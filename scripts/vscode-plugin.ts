import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";

export const AGENT_PLUGINS_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
export const COPILOT_NAMESPACE = "com.github.copilot";
export const VSCODE_PLUGIN_HOOK_PATH = `./${COPILOT_NAMESPACE}/hooks/hooks.json`;

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
}

interface NativeComponents {
  agentPaths: readonly string[];
  instructionPaths: readonly string[];
}

function nativeComponentPaths(paths: readonly string[], directory: "agents" | "rules") {
  const prefix = `./${COPILOT_NAMESPACE}/`;
  return paths.map((path) => {
    const local = path.slice(prefix.length);
    if (!path.startsWith(`${prefix}${directory}/`) || path.includes("\\") || posix.normalize(local) !== local) {
      throw new Error(`Invalid native ${directory} component path: ${path}`);
    }
    return `./${local}`;
  });
}

interface HookCommand {
  type: "command";
  command: string;
  timeout?: number;
}

/** Portable components use fixed discovery paths; native agents and rules are
 * projected directly into com.github.copilot/ before their links are rendered. */
export function vscodePluginManifest(metadata: PluginMetadata, components?: NativeComponents) {
  if (metadata.name.length > 64 || !/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(metadata.name)) {
    throw new Error(`Invalid Agent Plugins name: ${metadata.name}`);
  }
  const extension = components ? {
    agents: { paths: nativeComponentPaths(components.agentPaths, "agents"), exclusive: true },
    rules: { paths: nativeComponentPaths(components.instructionPaths, "rules"), exclusive: true },
  } : undefined;
  return {
    $schema: AGENT_PLUGINS_SCHEMA,
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    ...(extension ? { extensions: { [COPILOT_NAMESPACE]: extension } } : {}),
  };
}

/** Adapt the builder's own per-policy Local hooks to the single native discovery
 * file. PLUGIN_ROOT is expanded and shell-quoted by the VS Code plugin reader,
 * so commands work from a different workspace and after package relocation. */
export async function buildVSCodePlugin(
  outDir: string,
  metadata: PluginMetadata,
  hookPaths: readonly string[],
  nativeComponents?: NativeComponents,
): Promise<string[]> {
  const manifest = vscodePluginManifest(metadata, nativeComponents);
  const hooks: Record<string, HookCommand[]> = {};
  for (const path of hookPaths) {
    if (!/^\.\/hooks\/[a-z0-9-]+\.json$/.test(path)) {
      throw new Error(`Expected a generated VS Code hook file, received ${path}`);
    }
    const input = JSON.parse(await readFile(join(outDir, path), "utf8")) as {
      hooks: Record<string, { type: string; command: string; timeout?: number }[]>;
    };
    for (const [event, commands] of Object.entries(input.hooks)) {
      for (const command of commands) {
        const script = /^node scripts\/hooks\/([a-z0-9-]+\.ts)$/.exec(command.command)?.[1];
        if (command.type !== "command" || !script) {
          throw new Error(`Expected a bundled hook command in ${path}`);
        }
        (hooks[event] ??= []).push({ ...command, type: "command", command: `node \${PLUGIN_ROOT}/scripts/hooks/${script}` });
      }
    }
  }

  if (hookPaths.length > 0) {
    const destination = join(outDir, VSCODE_PLUGIN_HOOK_PATH);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, JSON.stringify({ hooks }, null, 2) + "\n");
    for (const path of hookPaths) await rm(join(outDir, path));
    // Only generated input files are owned here. Preserve any other directory data.
    await rmdir(join(outDir, "hooks")).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOTEMPTY") throw error;
    });
  }
  await writeFile(join(outDir, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");
  return hookPaths.length > 0 ? [VSCODE_PLUGIN_HOOK_PATH] : [];
}
