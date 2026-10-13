import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_PLUGINS_SCHEMA, vscodePluginManifest } from "./vscode-plugin.ts";

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
