import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AGENT_PLUGINS_SCHEMA, buildVSCodePlugin, VSCODE_PLUGIN_HOOK_PATH, vscodePluginManifest } from "./vscode-plugin.ts";

const metadata = { name: "wycats", version: "0.1.0", description: "Toolkit" };

void test("standard manifest opts into fixed discovery without legacy component fields", () => {
  assert.deepEqual(vscodePluginManifest(metadata), { $schema: AGENT_PLUGINS_SCHEMA, ...metadata });
  assert.throws(() => vscodePluginManifest({ ...metadata, name: "invalid--name" }), /Invalid Agent Plugins name/);
});

void test("native discovery uses exact extension-relative files and excludes support documents", () => {
  const components = {
    agentPaths: ["./com.github.copilot/agents/team/review.agent.md"],
    instructionPaths: ["./com.github.copilot/rules/team/style.instructions.md"],
  };
  const manifest = vscodePluginManifest(metadata, components);
  assert.deepEqual(manifest.extensions, { "com.github.copilot": {
    agents: { paths: ["./agents/team/review.agent.md"], exclusive: true },
    rules: { paths: ["./rules/team/style.instructions.md"], exclusive: true },
  } });
  for (const path of ["./rules/style.instructions.md", "./com.github.copilot/rules/team/../style.instructions.md", "./com.github.copilot/rules\\style.instructions.md"]) {
    assert.throws(() => vscodePluginManifest(metadata, { agentPaths: [], instructionPaths: [path] }), /Invalid native rules component/);
  }
});

void test("an empty native inventory excludes all default agent and rule discovery", () => {
  const manifest = vscodePluginManifest(metadata, { agentPaths: [], instructionPaths: [] });
  assert.deepEqual(manifest.extensions, { "com.github.copilot": {
    agents: { paths: [], exclusive: true },
    rules: { paths: [], exclusive: true },
  } });
});

void test("all native hooks share the default discovery file and retain command order and timeouts", async () => {
  const root = await mkdtemp(join(tmpdir(), "vscode-plugin-with-spaces-"));
  try {
    await mkdir(join(root, "hooks"));
    await mkdir(join(root, "com.github.copilot", "agents"), { recursive: true });
    await mkdir(join(root, "com.github.copilot", "rules"), { recursive: true });
    await writeFile(join(root, "com.github.copilot", "agents", "review.agent.md"), "Review.");
    await writeFile(join(root, "com.github.copilot", "rules", "style.instructions.md"), "Style.");
    await writeFile(join(root, "hooks", "pnpm.json"), JSON.stringify({ hooks: { PreToolUse: [{ type: "command", command: "node scripts/hooks/enforce-pnpm.ts", timeout: 5 }] } }));
    await writeFile(join(root, "hooks", "logging.json"), JSON.stringify({ hooks: {
      PreToolUse: [{ type: "command", command: "node scripts/hooks/log-tool-calls.ts" }],
      PostToolUse: [{ type: "command", command: "node scripts/hooks/log-tool-calls.ts" }],
    } }));
    // Keep foreign files when adapting the builder's exact owned hook inputs.
    await writeFile(join(root, "hooks", "foreign.json"), "preserve");
    assert.deepEqual(await buildVSCodePlugin(root, metadata, ["./hooks/pnpm.json", "./hooks/logging.json"]), [VSCODE_PLUGIN_HOOK_PATH]);
    const output = JSON.parse(await readFile(join(root, VSCODE_PLUGIN_HOOK_PATH), "utf8")) as { hooks: Record<string, { command: string; timeout?: number }[]> };
    assert.deepEqual(output.hooks.PreToolUse, [
      { type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/enforce-pnpm.ts", timeout: 5 },
      { type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/log-tool-calls.ts" },
    ]);
    assert.equal(output.hooks.PostToolUse.length, 1);
    assert.deepEqual(await readdir(join(root, "hooks")), ["foreign.json"]);
    assert.equal(await readFile(join(root, "com.github.copilot", "agents", "review.agent.md"), "utf8"), "Review.");
    assert.equal(await readFile(join(root, "com.github.copilot", "rules", "style.instructions.md"), "utf8"), "Style.");
    assert.deepEqual(JSON.parse(await readFile(join(root, "plugin.json"), "utf8")), vscodePluginManifest(metadata));
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("hookless standard packages need only portable metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "vscode-plugin-"));
  try {
    assert.deepEqual(await buildVSCodePlugin(root, metadata, []), []);
    assert.deepEqual(await readdir(root), ["plugin.json"]);
    await assert.rejects(buildVSCodePlugin(root, metadata, ["./hooks/../outside.json"]), /Expected a generated/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
