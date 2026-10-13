import assert from "node:assert/strict";
import test from "node:test";
import { projectVSCodeHooks, projectClaudeCodeHooks, type HookManifest } from "./hook-projection.ts";

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
  assert.throws(() => projectVSCodeHooks([{ ...manifests[0], script: "../outside.ts" }]), /Expected a bundled hook script/);
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
