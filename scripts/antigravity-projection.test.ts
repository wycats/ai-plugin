import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition, parseCompositionLinks, projectCompositionLinks } from "./resource-composition.ts";
import { createProjectionPlan } from "./projection-plan.ts";
import { validateAntigravityModels } from "./antigravity-projection.ts";
import { installOptions, installValidatedPackage } from "./install-antigravity.ts";

const ROOT = resolve(import.meta.dirname, "..");
const exec = promisify(execFile);

void test("Antigravity package preserves canonical prose and resolves links after relocation", async () => {
  const scratch = await mkdtemp(join(tmpdir(), "antigravity package "));
  const output = join(scratch, "build");
  try {
    await exec(process.execPath, [join(ROOT, "scripts/build.ts"), "--config", "config.antigravity.example.json", "--output", output], { cwd: ROOT });
    const loaded = await loadCanonicalComposition(ROOT, await discoverResourceFiles(ROOT));
    assert.ok(loaded.composition);
    const composition = loaded.composition;
    const plan = createProjectionPlan(composition, "antigravity", output);
    assert.equal(plan.includesSourceHooks, false);
    assert.equal(plan.persistentInstructions?.delivery, "native-rules");
    const installed = join(scratch, "installed elsewhere");
    await cp(output, installed, { recursive: true });
    let links = 0;
    for (const { resource, outputPath, pluginPath } of plan.resources) {
      const original = await readFile(resource.sourcePath, "utf8");
      const expected = projectCompositionLinks(original, resource.sourcePath, outputPath, composition, plan.outputBySourcePath);
      const actual = await readFile(outputPath, "utf8");
      assert.equal(parseResourceFrontmatter(actual).body, parseResourceFrontmatter(expected).body, resource.identity);
      for (const link of parseCompositionLinks(actual).links) {
        assert.ok((await readFile(resolve(dirname(join(installed, pluginPath)), link.destination))).length);
        links++;
      }
    }
    assert.ok(links > 100);
    const rule = plan.resources.find(({ resource }) => resource.persistentContext);
    assert.ok(rule);
    assert.equal(parseResourceFrontmatter(await readFile(rule.outputPath, "utf8")).data.trigger, "always_on");
    for (const name of ["recon", "recon-worker", "editorial-reader"]) {
      const { data } = parseResourceFrontmatter(await readFile(join(output, "agents", `${name}.md`), "utf8"));
      assert.equal(data.name, name);
      assert.equal(data.subagent, true);
      assert.equal(data.mainAgent, name === "recon");
      assert.equal(data["user-invocable"], undefined);
      assert.equal(data.commandExecutionPolicy, "sandbox");
      if (name !== "editorial-reader") {
        assert.ok(Array.isArray(data.tools));
        assert.ok(data.tools.includes("send_message"));
        assert.equal(data.tools.includes("invoke_subagent"), name === "recon");
        assert.equal(new Set(data.tools).size, data.tools.length);
      }
    }
    for (const { resource, outputPath } of plan.resources.filter(({ resource }) => resource.activation)) {
      const { data } = parseResourceFrontmatter(await readFile(outputPath, "utf8"));
      assert.equal(data["disable-model-invocation"], resource.activation?.invocation === "explicit");
      assert.equal(data["user-invocable"], undefined);
      assert.equal(data.invocation, undefined);
    }
    const manifest = JSON.parse(await readFile(join(output, "plugin.json"), "utf8")) as { name: string };
    assert.equal(manifest.name, "wycats");
    await assert.rejects(readFile(join(output, "hooks/hooks.json")), { code: "ENOENT" });
    await assert.rejects(readFile(join(output, "scripts/persistent-context-hook.mjs")), { code: "ENOENT" });
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

void test("Antigravity model validation precedes output cleanup", async () => {
  validateAntigravityModels({ fast: "pro", balanced: "flash", auxiliary: null, other: "inherit" });
  assert.throws(() => { validateAntigravityModels({ fast: "claude-opus" }); }, /Antigravity model role/);
  const scratch = await mkdtemp(join(tmpdir(), "antigravity-preflight-"));
  try {
    const config = join(scratch, "bad.json");
    await writeFile(config, JSON.stringify({ target: "antigravity", models: { fast: "provider/model" }, toolGroups: {} }));
    const sentinel = join(scratch, "keep.txt");
    await writeFile(sentinel, "existing output");
    await assert.rejects(exec(process.execPath, [join(ROOT, "scripts/build.ts"), "--config", config, "--output", scratch]), /Antigravity model role/);
    assert.equal(await readFile(sentinel, "utf8"), "existing output");
  } finally { await rm(scratch, { recursive: true, force: true }); }
});

void test("installer parses explicit paths and rejects missing or unknown options", () => {
  assert.deepEqual(installOptions(["--", "--config", "custom config.json", "--agy", "/some path/agy", "--dry-run"]), {
    config: "custom config.json", agy: "/some path/agy", dryRun: true,
  });
  assert.throws(() => installOptions(["--config"]), /Missing value/);
  assert.throws(() => installOptions(["--agy", "--dry-run"]), /Missing value/);
  assert.throws(() => installOptions(["--force"]), /Unknown option/);
});


void test("installer stops on host validation failure and dry-run leaves installation alone", () => {
  const installed = { revision: "previous" };
  const calls: string[][] = [];
  const runner = (command: string, args: string[]) => {
    assert.equal(command, "/path with spaces/agy");
    calls.push(args);
    if (args[1] === "validate") throw new Error("host rejected package");
    installed.revision = "new";
  };
  assert.throws(() => { installValidatedPackage("/path with spaces/agy", "/package with spaces", false, runner); }, /host rejected/);
  assert.equal(installed.revision, "previous");
  assert.equal(calls.length, 1);
  const acceptingRunner = (_command: string, args: string[]) => {
    calls.push(args);
    if (args[1] === "install") installed.revision = "new";
  };
  installValidatedPackage("agy", "/package with spaces", true, acceptingRunner);
  assert.equal(installed.revision, "previous");
  installValidatedPackage("agy", "/package with spaces", false, acceptingRunner);
  assert.equal(installed.revision, "new");
  assert.deepEqual(calls.at(-1), ["plugin", "install", "/package with spaces"]);
});


void test("explicit skills retain their selection boundary in the native envelope", async () => {
  const root = await mkdtemp(join(tmpdir(), "antigravity-explicit-"));
  try {
    const skill = join(root, "skills", "release");
    await mkdir(skill, { recursive: true });
    await writeFile(join(skill, "SKILL.md"), "---\nname: release\ndescription: Release when requested\ninvocation: explicit\n---\nRelease.\n");
    const loaded = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.ok(loaded.composition);
    const plan = createProjectionPlan(loaded.composition, "antigravity", join(root, "output"));
    assert.equal(plan.resources[0].skillMetadata?.frontmatter["disable-model-invocation"], true);
    assert.equal(plan.resources[0].exposure, "public");
  } finally { await rm(root, { recursive: true, force: true }); }
});
