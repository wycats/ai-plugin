import assert from "node:assert/strict";
import { exec as execShell, execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition, parseCompositionLinks, projectCompositionLinks } from "./resource-composition.ts";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { parseCanonicalResource } from "./resource-source.ts";
import { createProjectionPlan } from "./projection-plan.ts";
import { writePersistentContext } from "./persistent-context.ts";

const exec = promisify(execFile);
const shell = promisify(execShell);
const ROOT = resolve(import.meta.dirname, "..");

void test("persistent context is explicit and cannot also have file-scoped activation", () => {
  const resource = { section: "instructions" as const, sourcePath: "/source/instructions/test.instructions.md", pluginPath: "./instructions/test.instructions.md" };
  const parse = (fields: string) => parseCanonicalResource(resource, `---\ndescription: Test\n${fields}\n---\nBody.\n`);
  assert.equal(parse('metadata:\n  wycats.context: persistent').persistentContext, true);
  assert.equal(parse('applyTo: "**"').persistentContext, undefined);
  for (const fields of ["metadata: []", "metadata: false", "metadata:\n  wycats.context: true", "metadata:\n  wycats.context: sometimes", 'metadata:\n  wycats.context: persistent\napplyTo: "**"']) {
    assert.throws(() => parse(fields));
  }
});

for (const target of ["codex", "claude-code", "vscode"]) {
  void test(`${target} delivers the complete story with working links after package relocation`, async () => {
    const temporary = await mkdtemp(join(tmpdir(), "persistent-context-"));
    try {
      const built = join(temporary, "built");
      await exec(process.execPath, [join(ROOT, "scripts/build.ts"), "--config",
        join(ROOT, target === "vscode" ? "config.example.json" : `config.${target}.example.json`), "--output", built]);
      const installPath = join(temporary, "installed plugin (relocated)");
      await cp(built, installPath, { recursive: true });
      const installed = await realpath(installPath);
      await rm(built, { recursive: true });
      const hooksPath = target === "vscode" ? "com.github.copilot/hooks/hooks.json" : "hooks/hooks.json";
      const hooks = JSON.parse(await readFile(join(installed, hooksPath), "utf8")) as {
        hooks: Record<string, Array<{ command?: string; matcher?: string; hooks?: Array<{ command: string; additionalContextLimit?: number }> }> | undefined>;
      };
      const entry = (hooks.hooks.SessionStart ?? []).find(entry => (entry.command ?? entry.hooks?.[0]?.command)?.includes("persistent-context-hook.mjs"));
      if (target === "claude-code") assert.equal(entry, undefined);
      else assert.ok(entry);
      if (target === "codex") {
        assert.ok(entry);
        assert.equal(entry.hooks?.[0].additionalContextLimit, 16000);
        const lifecycle = new RegExp(entry.matcher ?? ".*");
        for (const source of ["startup", "clear", "compact"]) assert.ok(lifecycle.test(source));
        for (const source of ["resume", "fork"]) assert.equal(lifecycle.test(source), false);
        // Adding context support does not enable the other hosts' policy hooks in Codex.
        assert.deepEqual(Object.keys(hooks.hooks), ["SessionStart"]);
      } else assert.ok((hooks.hooks.PreToolUse?.length ?? 0) > 0);

      const { stdout } = target === "codex"
        ? await shell(entry?.hooks?.[0].command ?? "", { cwd: tmpdir(), env: { ...process.env, PLUGIN_ROOT: installed } })
        : target === "claude-code"
          ? await exec(process.execPath, ["--input-type=module", "-e",
            "const { renderPersistentInstructions } = await import(process.argv[1]); process.stdout.write(await renderPersistentInstructions());",
            pathToFileURL(join(installed, "scripts/persistent-context.mjs")).href], { cwd: tmpdir() })
          : await exec(process.execPath, [join(installed, "scripts/persistent-context-hook.mjs")], { cwd: tmpdir() });
      let context = stdout;
      if (target !== "claude-code") {
        const output = JSON.parse(stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
        assert.equal(output.hookSpecificOutput.hookEventName, "SessionStart");
        context = output.hookSpecificOutput.additionalContext;
      }
      const sourcePath = join(ROOT, "instructions/building-together.instructions.md");
      const source = parseResourceFrontmatter(await readFile(sourcePath, "utf8")).body;
      const canonical = await loadCanonicalComposition(ROOT, await discoverResourceFiles(ROOT));
      assert.ok(canonical.composition);
      const resourceMap = JSON.parse(await readFile(join(installed, "projection-resources.json"), "utf8")) as {
        resources: Array<{ canonicalSource: string; generatedSource: string }>;
      };
      const destinations = new Map(resourceMap.resources.map(entry => [resolve(ROOT, entry.canonicalSource), resolve(installed, entry.generatedSource)]));
      // Reconstruct the expected prose directly from canonical link identities,
      // independently of the loader's generated chunks.
      let expected = source;
      for (const link of parseCompositionLinks(source).links.reverse()) {
        const destination = destinations.get(resolve(dirname(sourcePath), link.destination));
        assert.ok(destination);
        await readFile(destination);
        expected = expected.slice(0, link.destinationStart) + `<${destination.replaceAll("\\", "/")}>` + expected.slice(link.destinationEnd);
      }
      assert.equal(context, expected);
      if (target === "claude-code") {
        const setupCommand = await readFile(join(installed, "skills/setup-guidance/SKILL.md"), "utf8");
        assert.equal(parseResourceFrontmatter(setupCommand).data["disable-model-invocation"], true);
        assert.ok(setupCommand.includes("${CLAUDE_PLUGIN_ROOT}/scripts/claude-guidance.mjs"));
        await verifyRecovery(installed, temporary, expected);
        const project = join(temporary, "user project");
        await mkdir(project);
        const claudePath = join(project, "CLAUDE.md");
        const prosePath = join(project, ".claude/wycats/persistent-instructions.md");
        const statePath = join(project, ".claude/wycats/installation.json");
        const original = "# Project instructions\n\nPreserve this exact text, including its missing final newline.";
        await writeFile(claudePath, original);
        const command = (action: string, args: string[] = [], plugin = installed, destination = project) =>
          exec(process.execPath, [join(plugin, "scripts/claude-guidance.mjs"), action, "--project", destination, ...args]);
        await command("install", ["--dry-run"]);
        assert.equal(await readFile(claudePath, "utf8"), original);
        await assert.rejects(readFile(prosePath), { code: "ENOENT" });
        await command("install");
        assert.equal(await readFile(prosePath, "utf8"), expected);
        const withImport = await readFile(claudePath, "utf8");
        assert.ok(withImport.startsWith(original));
        assert.equal(withImport.split("@.claude/wycats/persistent-instructions.md").length, 2);
        await command("install");
        assert.equal(await readFile(claudePath, "utf8"), withImport);

        // A damaged record must not authorize writes. In particular, an arbitrary
        // importBlock could otherwise cause removal to erase user instructions.
        const savedRecord = await readFile(statePath, "utf8");
        const record = JSON.parse(savedRecord) as Record<string, unknown>;
        for (const [field, value] of [
          ["version", 2],
          ["createdClaudeMd", "true"],
          ["contentHash", "invalid"],
          ["importBlock", original],
        ] as const) {
          const damagedRecord = JSON.stringify({ ...record, [field]: value });
          await writeFile(statePath, damagedRecord);

          for (const action of ["install", "remove"]) {
            await assert.rejects(command(action), new RegExp(`Invalid wycats installation record:[\\s\\S]*${field}`));
            assert.equal(await readFile(claudePath, "utf8"), withImport);
            assert.equal(await readFile(prosePath, "utf8"), expected);
            assert.equal(await readFile(statePath, "utf8"), damagedRecord);
          }
        }
        await writeFile(statePath, savedRecord);

        // A new installation refreshes destinations while leaving the import
        // and subsequent user edits untouched.
        const moved = join(temporary, "updated plugin");
        await cp(installed, moved, { recursive: true });
        const userAddition = "\nA later instruction from the user.\n";
        await writeFile(claudePath, withImport + userAddition);
        await command("install", [], moved);
        assert.equal(await readFile(claudePath, "utf8"), withImport + userAddition);
        const refreshed = expected.replaceAll(installed, await realpath(moved));
        assert.equal(await readFile(prosePath, "utf8"), refreshed);

        // An edited export or import must never be silently replaced or removed.
        await writeFile(prosePath, refreshed + "A local edit.");
        await assert.rejects(command("install"), /Generated guidance was changed/);
        await assert.rejects(command("remove"), /Generated guidance was changed/);
        assert.equal(await readFile(claudePath, "utf8"), withImport + userAddition);
        await writeFile(prosePath, refreshed);
        await writeFile(claudePath, (withImport + userAddition).replace("@.claude/", "@changed/"));
        await assert.rejects(command("install"), /managed import was changed/);
        await assert.rejects(command("remove"), /managed import was changed/);
        await writeFile(claudePath, withImport + userAddition);
        await command("remove", ["--dry-run"]);
        assert.equal(await readFile(prosePath, "utf8"), refreshed);
        await command("remove");
        assert.equal(await readFile(claudePath, "utf8"), original + userAddition);
        await assert.rejects(readFile(prosePath), { code: "ENOENT" });
        await assert.rejects(readFile(statePath), { code: "ENOENT" });
        await command("remove");

        // Fresh projects return to their original state; unrelated files survive.
        const fresh = join(temporary, "fresh project");
        await mkdir(fresh);
        await command("install", [], installed, fresh);
        const unrelated = join(fresh, ".claude/wycats/user-note.md");
        await writeFile(unrelated, "Keep me");
        await command("remove", [], installed, fresh);
        await assert.rejects(readFile(join(fresh, "CLAUDE.md")), { code: "ENOENT" });
        assert.equal(await readFile(unrelated, "utf8"), "Keep me");
        // Refuse unowned files and symlinks rather than adopting their contents.
        await writeFile(prosePath, "Unowned prose");
        await assert.rejects(command("install"), /no installation record/);
        assert.equal(await readFile(prosePath, "utf8"), "Unowned prose");
        await rm(prosePath);
        await symlink(claudePath, join(fresh, "CLAUDE.md"));
        await assert.rejects(command("install", [], installed, fresh), /ordinary file/);
        assert.equal(await readFile(claudePath, "utf8"), original + userAddition);
        await assert.rejects(exec(process.execPath, [join(installed, "scripts/claude-guidance.mjs"), "install"]), /--project/);
      }
      assert.ok(context.endsWith(source.slice(source.indexOf("## Further reading"))));
      assert.equal(context.includes(ROOT), false);
      assert.equal(context.includes("composition:load"), false);
      const projectedPath = destinations.get(sourcePath);
      assert.ok(projectedPath);
      assert.equal(await readFile(projectedPath, "utf8"), projectCompositionLinks(
        await readFile(sourcePath, "utf8"), sourcePath, projectedPath, canonical.composition, destinations));
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
}

void test("persistent delivery collects multiple instruction resources without a story-specific source", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "persistent-instructions-"));
  try {
    const source = join(temporary, "source");
    await mkdir(join(source, "instructions"), { recursive: true });
    const bodies = ["# Collaboration\n\nKeep shared decisions visible.\n", "# Investigation\n\nCheck the evidence.\n"];
    for (const [index, body] of bodies.entries()) {
      await writeFile(join(source, `instructions/${String(index)}.instructions.md`),
        `---\ndescription: Fixture ${String(index)}\nmetadata:\n  wycats.context: persistent\n---\n${body}`);
    }
    await writeFile(join(source, "instructions/scoped.instructions.md"),
      '---\ndescription: Scoped fixture\napplyTo: "**/*.ts"\n---\nOnly while editing TypeScript.\n');
    const { composition } = await loadCanonicalComposition(source, await discoverResourceFiles(source));
    assert.ok(composition);
    const expected = bodies.join("\n\n");
    for (const target of ["codex", "vscode", "claude-code"] as const) {
      const output = join(temporary, target);
      const plan = createProjectionPlan(composition, target, output);
      await writePersistentContext(output, plan, composition);
      const project = join(temporary, "project");
      if (target === "claude-code") await mkdir(project);
      const deliver = async (): Promise<string> => {
        if (target === "claude-code") {
          await exec(process.execPath, [join(output, "scripts/claude-guidance.mjs"), "install", "--project", project]);
          return readFile(join(project, ".claude/wycats/persistent-instructions.md"), "utf8");
        }
        const { stdout } = await exec(process.execPath, [join(output, "scripts/persistent-context-hook.mjs")]);
        const result = JSON.parse(stdout) as { hookSpecificOutput: { additionalContext: string } };
        return result.hookSpecificOutput.additionalContext;
      };
      assert.equal(await deliver(), expected);

      // A package address is a filesystem path, even when its characters have
      // other meanings inside a URL. Preserve the complete destination.
      const packagePath = "references/topic #1%.md";
      await mkdir(join(output, "references"));
      await writeFile(join(output, packagePath), "Reference");
      await writeFile(join(output, "scripts/persistent-context.json"),
        JSON.stringify([["Read [this](<", { packagePath }, ">)."]]));
      assert.equal(await deliver(), `Read [this](<${join(await realpath(output), packagePath)}>).`);
      // The hook budget belongs to hook delivery. Rendering itself preserves
      // the complete prose even when it exceeds that particular transport.
      const large = "Instruction. ".repeat(5000);
      await writeFile(join(output, "scripts/persistent-context.json"), JSON.stringify([[large]]));
      if (target === "claude-code") assert.equal(await deliver(), large);
      else await assert.rejects(deliver(), /exceeds 48 KB/);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

async function verifyRecovery(plugin: string, temporary: string, expected: string): Promise<void> {
  const project = join(temporary, "recovery project");
  await mkdir(project);
  const directory = join(project, ".claude/wycats");
  const paths = {
    claude: join(project, "CLAUDE.md"),
    body: join(directory, "persistent-instructions.md"),
    record: join(directory, "installation.json"),
  };
  const pendingPath = join(directory, "pending.json");
  const command = (action: string, ...args: string[]) => exec(process.execPath,
    [join(plugin, "scripts/claude-guidance.mjs"), action, "--project", project, ...args]);
  const original = "Keep these project instructions.\n";
  await writeFile(paths.claude, original);
  await command("install");
  const installed = {
    claude: await readFile(paths.claude, "utf8"),
    body: await readFile(paths.body, "utf8"),
    record: await readFile(paths.record, "utf8"),
  };
  const absent = { claude: original, body: null, record: null };
  const { stdout } = await exec(process.execPath, ["-e", "console.log(process.pid)"]);
  const exitedPid = Number(stdout.trim());
  type Snapshot = { claude: string | null; body: string | null; record: string | null };
  const keys = ["body", "claude", "record"] as const;
  const restore = async (snapshot: Snapshot) => {
    for (const key of keys) {
      const text = snapshot[key];
      if (text === null) await rm(paths[key], { force: true });
      else await writeFile(paths[key], text);
    }
  };

  // Exercise every completed-file boundary in both directions, using actual
  // installed bytes rather than inventing a second installation format.
  for (const action of ["install", "remove"]) {
    const before = action === "install" ? absent : installed;
    const after = action === "install" ? installed : absent;
    for (let completed = 0; completed <= keys.length; completed++) {
      const partial: Snapshot = { ...before };
      for (const key of keys.slice(0, completed)) partial[key] = after[key];
      await restore(partial);
      await writeFile(pendingPath, JSON.stringify({ version: 1, pid: exitedPid, before, after }));
      await assert.rejects(command(action, "--dry-run"), /interrupted operation/);
      await command(action);
      for (const key of keys) {
        if (after[key] === null) await assert.rejects(readFile(paths[key]), { code: "ENOENT" });
        else assert.equal(await readFile(paths[key], "utf8"), after[key]);
      }
      await assert.rejects(readFile(pendingPath), { code: "ENOENT" });
    }
  }

  await restore(installed);
  const pending = { version: 1, pid: exitedPid, before: installed, after: absent };
  await writeFile(pendingPath, JSON.stringify(pending));
  await writeFile(paths.claude, installed.claude + "A concurrent edit.\n");
  await assert.rejects(command("remove"), /Changed during an interrupted operation/);
  assert.equal(await readFile(paths.body, "utf8"), expected);
  assert.equal(await readFile(paths.claude, "utf8"), installed.claude + "A concurrent edit.\n");
  await restore(installed);
  await writeFile(pendingPath, JSON.stringify({ ...pending, pid: process.pid }));
  await assert.rejects(command("remove"), /still be running/);
  await rm(pendingPath);

  const editedBody = expected + "A local guidance edit.\n";
  const editedClaude = installed.claude.replace("@.claude/wycats/", "@changed/") + "A later project instruction.\n";
  await writeFile(paths.body, editedBody);
  await writeFile(paths.claude, editedClaude);
  await command("repair", "--dry-run");
  assert.equal(await readFile(paths.body, "utf8"), editedBody);
  await assert.rejects(readFile(join(directory, "recovery")), { code: "ENOENT" });
  await command("repair");
  const backups = await readdir(join(directory, "recovery"));
  assert.equal(backups.length, 1);
  const backup = join(directory, "recovery", backups[0]);
  assert.equal(await readFile(join(backup, "CLAUDE.md"), "utf8"), editedClaude);
  assert.equal(await readFile(join(backup, "persistent-instructions.md"), "utf8"), editedBody);
  assert.equal(await readFile(paths.body, "utf8"), expected);
  assert.ok((await readFile(paths.claude, "utf8")).endsWith("A later project instruction.\n"));
  await command("install");

  // Ambiguous marker boundaries need the user's interpretation, even for repair.
  const repaired = await readFile(paths.claude, "utf8");
  await writeFile(paths.claude, repaired + "<!-- wycats:persistent-instructions -->");
  await assert.rejects(command("repair"), /markers are incomplete, duplicated/);
  assert.equal((await readdir(join(directory, "recovery"))).length, 1);
  await writeFile(paths.claude, repaired);
  await command("remove");
  assert.equal(await readFile(join(backup, "persistent-instructions.md"), "utf8"), editedBody);
}
