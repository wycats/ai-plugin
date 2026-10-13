export interface HookManifest {
  type: "policy" | "observer" | "side-effect";
  name: string;
  events: string[];
  tool?: string;
  script: string;
  timeout?: number;
}

interface HookCommand {
  type: "command";
  command: string;
  timeout?: number;
}

/** Script paths are portable command arguments, shared by both host envelopes. */
export function validateHookScriptPath(script: unknown): asserts script is string {
  if (typeof script !== "string" || !/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(script) ||
      script.split("/").includes("..")) {
    throw new Error("script must be a portable relative path under scripts/hooks/ using letters, digits, underscores, periods, hyphens, and forward slashes");
  }
}

/** The Local host expands and shell-quotes PLUGIN_ROOT, including spaces. */
export function projectVSCodeHooks(manifests: readonly HookManifest[]): Record<string, HookCommand[]> {
  const hooks: Record<string, HookCommand[]> = {};
  for (const manifest of manifests) {
    validateHookScriptPath(manifest.script);
    const handler: HookCommand = {
      type: "command",
      command: `node \${PLUGIN_ROOT}/scripts/hooks/${manifest.script}`,
      ...(manifest.timeout !== undefined ? { timeout: manifest.timeout } : {}),
    };
    for (const event of new Set(manifest.events)) (hooks[event] ??= []).push(handler);
  }
  return hooks;
}

/** Claude supplies tool matchers and expands its root through the shell. */
export function projectClaudeCodeHooks(
  manifests: readonly HookManifest[],
  matchers: Record<string, string> = {},
): Record<string, { matcher?: string; hooks: HookCommand[] }[]> {
  const hooks: Record<string, { matcher?: string; hooks: HookCommand[] }[]> = {};
  for (const manifest of manifests) {
    validateHookScriptPath(manifest.script);
    const group: { matcher?: string; hooks: HookCommand[] } = {
      hooks: [{
        type: "command",
        command: `node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/${manifest.script}"`,
        ...(manifest.timeout !== undefined ? { timeout: manifest.timeout } : {}),
      }],
    };
    if (manifest.tool && matchers[manifest.tool]) group.matcher = matchers[manifest.tool];
    for (const event of manifest.events) (hooks[event] ??= []).push(group);
  }
  return hooks;
}
