import { parseHookManifest, validateHookScriptPath, type HookManifest } from "./hook-manifest.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { projectVSCodeHooks, projectClaudeCodeHooks, projectPluginHooks } from "./hook-projection.ts";

const manifests: HookManifest[] = [
  { type: "policy", name: "pnpm", events: ["PreToolUse"], tool: "terminal", script: "enforce-pnpm.ts", timeout: 5 },
  { type: "observer", name: "logging", events: ["PreToolUse", "PostToolUse"], script: "log-tool-calls.ts" },
];

void test("manifest parsing validates the authored envelope and retains meaningful values", () => {
  assert.deepEqual(parseHookManifest({ ...manifests[0], description: "Extra source metadata" }), manifests[0]);
  for (const change of [
    { type: "unknown" }, { name: " " }, { events: [] }, { events: [42] },
    { tool: false }, { timeout: "5" }, { script: "../outside.ts" },
  ]) assert.throws(() => parseHookManifest({ ...manifests[0], ...change }));
});

void test("native hook projection preserves event order, timeouts, and host-owned root expansion", () => {
  const hooks = projectVSCodeHooks(manifests);
  assert.deepEqual(hooks, {
    PreToolUse: [
      { type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/enforce-pnpm.ts", timeout: 5 },
      { type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/log-tool-calls.ts" },
    ],
    PostToolUse: [{ type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/log-tool-calls.ts" }],
  });
  assert.deepEqual(projectVSCodeHooks([]), {});
  assert.throws(() => projectVSCodeHooks([{ ...manifests[0], script: "../outside.ts" }]), /portable relative path/);
});

void test("source validation and both adapters share the portable script path contract", () => {
  for (const script of ["audit_hook.ts", "cleanup.js", "policies/check.ts", "nested/audit_check.mjs"]) {
    validateHookScriptPath(script);
    const input = [{ ...manifests[0], script }];
    assert.equal(projectVSCodeHooks(input).PreToolUse?.[0].command, `node \${PLUGIN_ROOT}/scripts/hooks/${script}`);
    assert.equal(projectClaudeCodeHooks(input).PreToolUse?.[0].hooks[0].command, `node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/${script}"`);
  }
  for (const script of ["", "../outside.ts", "nested/../../outside.ts", "/tmp/check.ts", "C:/check.ts", "nested\\check.ts", "with space.ts", "$(command).ts"]) {
    const input = [{ ...manifests[0], script }];
    assert.throws(() => { validateHookScriptPath(script); }, /portable relative path/);
    assert.throws(() => projectVSCodeHooks(input), /portable relative path/);
    assert.throws(() => projectClaudeCodeHooks(input), /portable relative path/);
  }
});

void test("Claude retains matcher groups and shell quoting around its package root", () => {
  assert.deepEqual(projectClaudeCodeHooks(manifests, { terminal: "Bash" }), {
    PreToolUse: [
      { matcher: "Bash", hooks: [{ type: "command", command: 'node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/enforce-pnpm.ts"', timeout: 5 }] },
      { hooks: [{ type: "command", command: 'node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/log-tool-calls.ts"' }] },
    ],
    PostToolUse: [{ hooks: [{ type: "command", command: 'node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/log-tool-calls.ts"' }] }],
  });
});

void test("one target manifest combines authored hooks with independent persistent delivery", () => {
  const authored = [...manifests, {
    type: "observer" as const, name: "start", events: ["SessionStart"], script: "start.ts",
  }];
  const vscode = projectPluginHooks("vscode", authored, "session-start");
  assert.ok(vscode);
  assert.equal(vscode.pluginPath, "./com.github.copilot/hooks/hooks.json");
  assert.deepEqual(vscode.hooks.PreToolUse, projectVSCodeHooks(authored).PreToolUse);
  assert.deepEqual(vscode.hooks.SessionStart, [
    { type: "command", command: "node ${PLUGIN_ROOT}/scripts/hooks/start.ts" },
    { type: "command", command: "node ${PLUGIN_ROOT}/scripts/persistent-context-hook.mjs", timeout: 10 },
  ]);
  const claude = projectPluginHooks("claude-code", authored, "claude-project-import", { terminal: "Bash" });
  assert.deepEqual(claude?.hooks, projectClaudeCodeHooks(authored, { terminal: "Bash" }));
  const codex = projectPluginHooks("codex", [], "session-start");
  assert.ok(codex);
  assert.deepEqual(Object.keys(codex.hooks), ["SessionStart"]);
  // Persistent context can supply the only hook, or no hook at all.
  assert.ok(projectPluginHooks("vscode", [], "session-start"));
  assert.equal(projectPluginHooks("claude-code", [], "claude-project-import"), undefined);
  for (const target of ["vscode", "claude-code", "codex", "pi"] as const) {
    assert.equal(projectPluginHooks(target, []), undefined);
  }
});
