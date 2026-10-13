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

/** The Local host expands and shell-quotes PLUGIN_ROOT, including spaces. */
export function projectVSCodeHooks(manifests: readonly HookManifest[]): Record<string, HookCommand[]> {
  const hooks: Record<string, HookCommand[]> = {};
  for (const manifest of manifests) {
    if (!/^[a-z0-9-]+\.ts$/.test(manifest.script)) {
      throw new Error(`Expected a bundled hook script in ${manifest.name}: ${manifest.script}`);
    }
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
