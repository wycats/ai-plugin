import { posix } from "node:path";

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
