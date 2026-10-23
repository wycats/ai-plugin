import assert from "node:assert/strict";
import { fork, type ChildProcess } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { build } from "esbuild";

const ROOT = resolve(import.meta.dirname, "..");
const keys = ["claude", "body", "record"] as const;
type Snapshot = Record<typeof keys[number], string | null>;
interface Result { code: number | null; output: string }

// Pause real child processes at filesystem boundaries; no production timing hooks.
const preload = `
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
const method = process.env.PAUSE_METHOD;
const original = fs.promises[method];
let paused = false;
fs.promises[method] = async (...args) => {
  const result = await original(...args);
  const path = method === "rename" ? args[1] : args[0];
  if (!paused && String(path) === process.env.PAUSE_PATH) {
    paused = true;
    await new Promise(resolve => {
      process.once("message", resolve);
      process.send("paused");
    });
  }
  return result;
};
syncBuiltinESMExports();
`;

async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "guidance-recovery-")));
  const scripts = join(root, "plugin/scripts");
  const project = join(root, "project");
  await mkdir(scripts, { recursive: true });
  await mkdir(project);
  await build({ entryPoints: [join(ROOT, "scripts/runtime/claude-guidance.mts")],
    outfile: join(scripts, "claude-guidance.mjs"), bundle: true,
    platform: "node", format: "esm", target: "es2024" });
  await writeFile(join(scripts, "persistent-context.json"), JSON.stringify([["Fixture guidance.\n"]]));
  const hook = join(root, "pause.mjs");
  await writeFile(hook, preload);
  const directory = join(project, ".claude/wycats");
  const pending = join(directory, "pending.json");
  const lock = join(directory, "operation.lock");
  const files = { claude: join(project, "CLAUDE.md"), body: join(directory, "persistent-instructions.md"), record: join(directory, "installation.json") };
  const absent: Snapshot = { claude: "Project instructions.\n", body: null, record: null };
  await writeFile(files.claude, "Project instructions.\n");

  function start(action: string, pause?: { method: string; path: string }, extra: string[] = []) {
    const child = fork(join(scripts, "claude-guidance.mjs"), [action, "--project", project, ...extra], {
      execArgv: pause ? ["--import", hook] : [], silent: true,
      env: { ...process.env, PAUSE_METHOD: pause?.method, PAUSE_PATH: pause?.path },
    });
    let output = "";
    assert.ok(child.stdout && child.stderr);
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    const result = new Promise<Result>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", code => { resolve({ code, output }); });
    });
    const paused = pause ? new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { reject(new Error(`Pause not reached: ${output}`)); }, 10000);
      child.once("message", () => { clearTimeout(timer); resolve(); });
      child.once("exit", () => { clearTimeout(timer); reject(new Error(`Exited before pause: ${output}`)); });
    }) : Promise.resolve();
    return { child, result, paused };
  }
  async function command(action: string, ...extra: string[]) { return start(action, undefined, extra).result; }
  async function snapshot(): Promise<Snapshot> {
    const values = await Promise.all(keys.map(async key => {
      try { return await readFile(files[key], "utf8"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
    }));
    return { claude: values[0], body: values[1], record: values[2] };
  }
  async function restore(contents: Snapshot) {
    for (const key of keys) {
      const text = contents[key];
      if (text === null) await rm(files[key], { force: true });
      else await writeFile(files[key], text);
    }
  }
  assert.equal((await command("install")).code, 0);
  const installed = await snapshot();
  const dead = start("--help");
  const deadPid = dead.child.pid;
  assert.ok(deadPid);
  await dead.result;
  async function interruptedInstall() {
    await restore(absent);
    await writeFile(pending, JSON.stringify({ version: 1, pid: deadPid, before: absent, after: installed }));
  }
  return { root, project, directory, files, pending, lock, absent, installed,
    start, command, snapshot, restore, interruptedInstall,
    cleanup: () => rm(root, { recursive: true, force: true }) };
}

async function resume(child: ChildProcess, result: Promise<Result>) {
  if (child.connected) child.send("continue");
  return result;
}

for (const boundary of ["readFile", "rm"]) {
  void test(`one owner covers interrupted recovery and the requested operation (${boundary})`, async () => {
    const f = await fixture();
    try {
      await f.interruptedInstall();
      const first = f.start("remove", { method: boundary, path: f.pending });
      try {
        await first.paused;
        const blocked = await f.command(boundary === "readFile" ? "remove" : "install");
        assert.equal(blocked.code, 1, blocked.output);
        assert.match(blocked.output, /guidance operation.*running/i);
        assert.equal(await readFile(f.lock, "utf8").then(text => (JSON.parse(text) as { pid: number }).pid), first.child.pid);
      } finally {
        const completed = await resume(first.child, first.result);
        assert.equal(completed.code, 0, completed.output);
      }
      assert.deepEqual(await f.snapshot(), f.absent);
      await assert.rejects(readFile(f.pending), { code: "ENOENT" });
      await assert.rejects(readFile(f.lock), { code: "ENOENT" });
    } finally { await f.cleanup(); }
  });
}

void test("a delayed recoverer cannot consume another command's newer journal", async () => {
  const f = await fixture();
  try {
    await f.interruptedInstall();
    const first = f.start("remove", { method: "readFile", path: f.pending });
    await first.paused;
    const second = f.start("remove", { method: "writeFile", path: f.pending });
    try {
      const wroteJournal = await Promise.race([
        second.paused.then(() => true, () => false),
        second.result.then(() => false),
      ]);
      if (wroteJournal) {
        const newer = JSON.parse(await readFile(f.pending, "utf8")) as { pid: number };
        assert.equal(newer.pid, second.child.pid);
        await resume(first.child, first.result);
        const remaining = await readFile(f.pending, "utf8").catch(() => null);
        assert.fail(`A second command wrote a newer journal while recovery was paused; after the delayed recovery resumed, the newer journal was ${remaining === null ? "deleted" : "replaced"}.`);
      }
      const blocked = await second.result;
      assert.equal(blocked.code, 1, blocked.output);
      assert.match(blocked.output, /guidance operation.*running/i);
    } finally {
      await resume(first.child, first.result);
      await resume(second.child, second.result);
    }
    assert.deepEqual(await f.snapshot(), f.absent);
  } finally { await f.cleanup(); }
});

void test("ownership begins while bootstrapping an installation directory", async () => {
  const f = await fixture();
  try {
    await f.restore(f.absent);
    await rm(join(f.project, ".claude"), { recursive: true });
    const first = f.start("install", { method: "writeFile", path: f.pending });
    try {
      await first.paused;
      const journal = await readFile(f.pending, "utf8");
      const blocked = await f.command("repair");
      assert.equal(blocked.code, 1, blocked.output);
      assert.match(blocked.output, /guidance operation.*running/i);
      assert.equal(await readFile(f.pending, "utf8"), journal);
      await assert.rejects(readdir(join(f.directory, "recovery")), { code: "ENOENT" });
    } finally {
      assert.equal((await resume(first.child, first.result)).code, 0);
    }
    assert.deepEqual(await f.snapshot(), f.installed);
    await assert.rejects(readFile(f.lock), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

void test("an interrupted owner requires explicit unlock before journal recovery", async () => {
  const f = await fixture();
  try {
    await f.restore(f.absent);
    const first = f.start("install", { method: "rename", path: f.files.body });
    await first.paused;
    first.child.kill("SIGKILL");
    await first.result;
    const interrupted = await f.snapshot();
    const journal = await readFile(f.pending, "utf8");
    const refused = await f.command("install");
    assert.equal(refused.code, 1);
    assert.match(refused.output, /exited|not running/);
    assert.match(refused.output, /operation\.lock/);
    assert.deepEqual(await f.snapshot(), interrupted);
    assert.equal(await readFile(f.pending, "utf8"), journal);
    // The operator has verified that this exact child exited before unlocking.
    await rm(f.lock);
    const recovered = await f.command("install");
    assert.equal(recovered.code, 0, recovered.output);
    assert.deepEqual(await f.snapshot(), f.installed);
    await assert.rejects(readFile(f.pending), { code: "ENOENT" });
    await assert.rejects(readFile(f.lock), { code: "ENOENT" });
  } finally { await f.cleanup(); }
});

void test("recovery preserves intervening edits and its journal, releasing ownership on ordinary failure", async () => {
  const f = await fixture();
  try {
    await f.interruptedInstall();
    const journal = await readFile(f.pending, "utf8");
    const edited = "An intervening project edit.\n";
    await writeFile(f.files.claude, edited);
    const failed = await f.command("install");
    assert.equal(failed.code, 1);
    assert.match(failed.output, /Changed during an interrupted operation/);
    assert.deepEqual(await f.snapshot(), { ...f.absent, claude: edited });
    assert.equal(await readFile(f.pending, "utf8"), journal);
    await assert.rejects(readFile(f.lock), { code: "ENOENT" });
    await f.restore(f.absent);
    assert.equal((await f.command("install")).code, 0);
  } finally { await f.cleanup(); }
});

void test("dry-run creates no state and refuses an unknown leftover owner", async () => {
  const f = await fixture();
  try {
    await f.restore(f.absent);
    await rm(join(f.project, ".claude"), { recursive: true });
    const preview = await f.command("install", "--dry-run");
    assert.equal(preview.code, 0, preview.output);
    assert.deepEqual(await readdir(f.project), ["CLAUDE.md"]);
    await mkdir(f.directory, { recursive: true });
    await writeFile(f.lock, "");
    const refused = await f.command("install", "--dry-run");
    assert.equal(refused.code, 1);
    assert.match(refused.output, /unknown|cannot determine/i);
    assert.equal(await readFile(f.lock, "utf8"), "");
    assert.deepEqual(await f.snapshot(), f.absent);
  } finally { await f.cleanup(); }
});
