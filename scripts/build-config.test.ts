import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import matter from "gray-matter";
import { buildConfigJsonSchema, parseBuildConfig } from "./build-config.ts";

const ROOT = resolve(import.meta.dirname, "..");
const exec = promisify(execFile);

void test("editor schema stays current with runtime configuration, including shipped examples", async () => {
  assert.deepEqual(JSON.parse(await readFile(join(ROOT, "config.schema.json"), "utf8")), JSON.parse(buildConfigJsonSchema()),
    "Run pnpm generate:config-schema after editing scripts/build-config.ts");
  for (const name of ["config.example.json", "config.claude-code.example.json", "config.codex.example.json", "config.pi.example.json"]) {
    parseBuildConfig(JSON.parse(await readFile(join(ROOT, name), "utf8")) as unknown);
  }
});

void test("custom roles survive parsing while omitted mappings remain absent", () => {
  const config = {
    target: "pi", models: { specialist: "provider/model", fast: null },
    thinkingLevels: { specialist: "high" }, toolGroups: { custom: ["read"] },
  };
  assert.deepEqual(parseBuildConfig(config), config);
  assert.equal(parseBuildConfig(config).models.balanced, undefined);
  for (const change of [
    { target: "unsupported" }, { models: { fast: 42 } },
    { toolGroups: { custom: "read" } }, { thinkingLevels: { fast: false } },
    { hookMatchers: { terminal: [] } }, { toolGroup: {} },
  ]) assert.throws(() => parseBuildConfig({ ...config, ...change }), /Invalid build configuration/);
});

void test("Claude investigators can communicate without giving workers delegation tools", async () => {
  const root = await mkdtemp(join(tmpdir(), "claude-communication-"));
  try {
    const config = JSON.parse(await readFile(join(ROOT, "config.claude-code.example.json"), "utf8")) as {
      toolGroups: Record<string, string[]>;
    };
    const configPath = join(root, "config.json");
    const build = async (variant: string) => {
      const out = join(root, variant);
      await writeFile(configPath, JSON.stringify(config));
      await exec(process.execPath, [join(ROOT, "scripts/build.ts"), "--config", configPath, "--output", out], { cwd: ROOT });
      const readTools = async (name: string): Promise<string[]> => {
        const { data } = matter(await readFile(join(out, "agents", name + ".agent.md"), "utf8"));
        assert.ok(Array.isArray(data.tools));
        return data.tools as string[];
      };
      return { recon: await readTools("recon"), worker: await readTools("recon-worker") };
    };

    const current = await build("current");
    for (const tools of [current.recon, current.worker]) {
      assert.ok(tools.includes("SendMessage"));
      assert.equal(tools.includes("communication"), false);
      assert.equal(new Set(tools).size, tools.length);
    }
    for (const tool of ["Agent", "TaskStop"]) {
      assert.ok(current.recon.includes(tool));
      assert.equal(current.worker.includes(tool), false);
    }

    // Updating canonical agents must also work with a consumer's older config.
    delete config.toolGroups.communication;
    const legacy = await build("legacy");
    for (const tools of [legacy.recon, legacy.worker]) {
      assert.equal(tools.includes("communication"), false);
      assert.equal(tools.includes("SendMessage"), false);
      assert.ok(tools.includes("Read"));
    }
    assert.ok(legacy.recon.includes("Agent"));
    assert.equal(legacy.worker.includes("Agent"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test("invalid config and hook inputs preserve the previous generated output", async () => {
  const root = await mkdtemp(join(tmpdir(), "build-inputs-"));
  try {
    await cp(join(ROOT, "scripts"), join(root, "scripts"), { recursive: true });
    await symlink(join(ROOT, "node_modules"), join(root, "node_modules"), "dir");
    await writeFile(join(root, "package.json"), '{"type":"module"}');
    await mkdir(join(root, "hooks"));
    await mkdir(join(root, "out/wycats"), { recursive: true });
    const sentinel = join(root, "out/wycats/previous.txt");
    await writeFile(sentinel, "previous build");
    const config = { target: "vscode", models: {}, toolGroups: {} };
    const manifest = { type: "policy", name: "test", events: ["PreToolUse"], script: "enforce-pnpm.ts" };
    const build = () => exec(process.execPath, [join(root, "scripts/build.ts")], { cwd: root });

    await writeFile(join(root, "config.json"), JSON.stringify({ ...config, models: [] }));
    await assert.rejects(build(), /Invalid build configuration/);
    assert.equal(await readFile(sentinel, "utf8"), "previous build");
    await writeFile(join(root, "config.json"), JSON.stringify(config));

    for (const change of [{ events: "PreToolUse" }, { script: "../outside.ts" }, { script: "missing.ts" }]) {
      await writeFile(join(root, "hooks/test.json"), JSON.stringify({ ...manifest, ...change }));
      await assert.rejects(build(), /hooks[/\\]test\.json/);
      assert.equal(await readFile(sentinel, "utf8"), "previous build");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
