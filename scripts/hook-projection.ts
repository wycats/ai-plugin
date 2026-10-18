import { validateHookScriptPath, type HookManifest } from "./hook-manifest.ts";
import type { PersistentInstructionPlan } from "./projection-plan.ts";
import type { BuildTarget } from "./target-output.ts";
import { VSCODE_PLUGIN_HOOK_PATH } from "./vscode-plugin.ts";

interface HookCommand {
  type: "command";
  command: string;
  timeout?: number;
  /** Codex's inline context budget; other hosts omit this field. */
  additionalContextLimit?: number;
}

interface HookGroup {
  matcher?: string;
  hooks: HookCommand[];
}

interface ProjectedHooks {
  pluginPath: string;
  hooks: Partial<Record<string, HookCommand[]>> | Partial<Record<string, HookGroup[]>>;
}

/** The Local host expands and shell-quotes PLUGIN_ROOT, including spaces. */
export function projectVSCodeHooks(
  manifests: readonly HookManifest[],
  includeContext = false,
): Partial<Record<string, HookCommand[]>> {
  const hooks: Partial<Record<string, HookCommand[]>> = {};

  for (const manifest of manifests) {
    validateHookScriptPath(manifest.script);

    const handler: HookCommand = {
      type: "command",
      command: `node \${PLUGIN_ROOT}/scripts/hooks/${manifest.script}`,
      ...(manifest.timeout !== undefined ? { timeout: manifest.timeout } : {}),
    };

    for (const event of new Set(manifest.events)) {
      (hooks[event] ??= []).push(handler);
    }
  }

  if (includeContext) {
    (hooks.SessionStart ??= []).push({
      type: "command",
      command: "node ${PLUGIN_ROOT}/scripts/persistent-context-hook.mjs",
      timeout: 10,
    });
  }

  return hooks;
}

/** Claude supplies tool matchers and expands its root through the shell. */
export function projectClaudeCodeHooks(
  manifests: readonly HookManifest[],
  matchers: Record<string, string> = {},
): Partial<Record<string, HookGroup[]>> {
  const hooks: Partial<Record<string, HookGroup[]>> = {};

  for (const manifest of manifests) {
    validateHookScriptPath(manifest.script);

    const group: HookGroup = {
      hooks: [{
        type: "command",
        command: `node "$CLAUDE_PLUGIN_ROOT/scripts/hooks/${manifest.script}"`,
        ...(manifest.timeout !== undefined ? { timeout: manifest.timeout } : {}),
      }],
    };

    if (manifest.tool && matchers[manifest.tool]) {
      group.matcher = matchers[manifest.tool];
    }

    for (const event of manifest.events) {
      (hooks[event] ??= []).push(group);
    }
  }

  return hooks;
}

/** Assemble every registration before writing the target's one hook manifest. */
export function projectPluginHooks(
  target: BuildTarget,
  manifests: readonly HookManifest[],
  persistentDelivery?: PersistentInstructionPlan["delivery"],
  matchers: Record<string, string> = {},
): ProjectedHooks | undefined {
  const contextHook = persistentDelivery === "session-start";

  switch (target) {
    case "pi":
      return undefined;
    case "vscode":
      return hookManifest(VSCODE_PLUGIN_HOOK_PATH, projectVSCodeHooks(manifests, contextHook));
    case "claude-code":
      return hookManifest("./hooks/hooks.json", projectClaudeCodeHooks(manifests, matchers));
    case "codex":
      return contextHook ? hookManifest("./hooks/hooks.json", projectCodexContextHook()) : undefined;
  }
}

function hookManifest(pluginPath: string, hooks: ProjectedHooks["hooks"]): ProjectedHooks | undefined {
  if (!Object.keys(hooks).length) return undefined;

  return { pluginPath, hooks };
}

/** Codex retains prior context on resume/fork. Inject at fresh-context boundaries;
 * authored policy/observer hooks remain outside this target's projection. */
function projectCodexContextHook(): Partial<Record<string, HookGroup[]>> {
  const handler: HookCommand = {
    type: "command",
    command: `node -e "import(require('node:url').pathToFileURL(require('node:path').join(process.env.PLUGIN_ROOT, 'scripts/persistent-context-hook.mjs')).href)"`,
    timeout: 10,
    additionalContextLimit: 16000,
  };

  return {
    SessionStart: [{
      matcher: "^(startup|clear|compact)$",
      hooks: [handler],
    }],
  };
}
