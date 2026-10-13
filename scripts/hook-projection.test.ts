import assert from "node:assert/strict";
import test from "node:test";
import { projectVSCodeHooks, projectClaudeCodeHooks, validateHookScriptPath, type HookManifest } from "./hook-projection.ts";

const manifests: HookManifest[] = [
  { type: "policy", name: "pnpm", events: ["PreToolUse"], tool: "terminal", script: "enforce-pnpm.ts", timeout: 5 },
  { type: "observer", name: "logging", events: ["PreToolUse", "PostToolUse"], script: "log-tool-calls.ts" },
];

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
    assert.equal(projectVSCodeHooks(input).PreToolUse[0].command, `node \${PLUGIN_ROOT}/scripts/hooks/${script}`);
    assert.equal(projectClaudeCodeHooks(input).PreToolUse[0].hooks[0].command, `node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/${script}"`);
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
