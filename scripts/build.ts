/**
 * Builds the plugin from source agents + config into an output directory.
 *
 * 1. Reads config.json by default, or an explicit config path when provided
 * 2. For each source agent: resolves model and tool role names from config
 * 3. Copies skills and target-specific resources
 * 4. Generates the platform-specific manifest
 *
 * Output goes to the target's platform output directory
 * (vscode → out/wycats/, claude-code → out/claude-code/, codex → out/codex/).
 */

import { parseBuildConfig, type BuildConfig as Config } from "./build-config.ts";
import { readFile, writeFile, mkdir, cp, stat } from "node:fs/promises";
import { join, relative, dirname, resolve, posix, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { stringify } from "yaml";
import { parseResourceFrontmatter, serializeResourceFrontmatter } from "./resource-frontmatter.ts";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import {
  discoverResourceFiles,
  type DiscoveredResource,
} from "./resource-discovery.ts";
import {
  CODEX_TARGET,
  legacyVSCodeOutputPath,
  outputPathForTarget,
  PI_TARGET,
  VSCODE_TARGET,
} from "./target-output.ts";
import {
  formatCompositionDiagnostics,
  loadCanonicalComposition,
  projectCompositionLinks,
  type CanonicalComposition,
} from "./resource-composition.ts";
import { assertSafeOutputOverride, prepareProjectionOutput } from "./projection-output.ts";
import { vscodePluginManifest } from "./vscode-plugin.ts";
import { projectPluginHooks } from "./hook-projection.ts";
import { parseHookManifest, type HookManifest } from "./hook-manifest.ts";
import { PI_PROFILE, piAgentContext } from "./pi-profile.ts";
import { createProjectionPlan, projectionResourceMap, type ProjectionPlan, type ProjectedResource } from "./projection-plan.ts";
import { contextDeliveryIndex } from "./context-delivery.ts";
import { writePersistentContext } from "./persistent-context.ts";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_CONFIG_PATH = join(ROOT, "config.json");
const CONFIG_ENV_VAR = "VSCODE_AI_PLUGIN_CONFIG_PATH";

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
}

interface CodexPluginJson extends PluginMetadata {
  author: {
    name: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  skills?: string;
  interface: {
    displayName: string;
    shortDescription: string;
    longDescription: string;
    developerName: string;
    category: string;
    capabilities: string[];
    websiteURL?: string;
    defaultPrompt: string[];
    brandColor?: string;
  };
}

function usage(): string {
  return `Usage: node scripts/build.ts [--config <path>] [--output <path>]

Examples:
  pnpm build --config config.example.json
  pnpm build -- --config config.example.json
  node scripts/build.ts --config config.pi.example.json --output /tmp/pi-projection`;
}

function failArgument(message: string): never {
  console.error(`${message}\n\n${usage()}`);
  process.exit(1);
}

interface BuildOptions {
  configPath: string;
  outputPath?: string;
}

function parseBuildOptions(args = process.argv.slice(2)): BuildOptions {
  let selectedConfigPath: string | undefined;
  let selectedOutputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--") continue;

    if (arg === "--config" || arg === "--output") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        failArgument(`Missing value for ${arg}.`);
      }
      if (arg === "--config") selectedConfigPath = value;
      else selectedOutputPath = value;
      i++;
      continue;
    }

    if (arg.startsWith("--config=") || arg.startsWith("--output=")) {
      const separator = arg.indexOf("=");
      const option = arg.slice(0, separator);
      const value = arg.slice(separator + 1);
      if (!value) failArgument(`Missing value for ${option}.`);
      if (option === "--config") selectedConfigPath = value;
      else selectedOutputPath = value;
      continue;
    }

    failArgument(`Unknown build argument: ${arg}`);
  }

  const envPath = process.env[CONFIG_ENV_VAR];
  return {
    configPath: resolve(
      ROOT,
      selectedConfigPath ?? (envPath || DEFAULT_CONFIG_PATH),
    ),
    ...(selectedOutputPath
      ? { outputPath: resolve(ROOT, selectedOutputPath) }
      : {}),
  };
}

function displayConfigPath(configPath: string): string {
  const relPath = relative(ROOT, configPath);
  if (relPath && !relPath.startsWith("..")) {
    return relPath;
  }
  return configPath;
}

const BUILD_OPTIONS = parseBuildOptions();
const CONFIG_PATH = BUILD_OPTIONS.configPath;

async function loadConfig(): Promise<Config> {
  try {
    return parseBuildConfig(JSON.parse(await readFile(CONFIG_PATH, "utf-8")) as unknown);
  } catch (err: unknown) {
    const displayPath = displayConfigPath(CONFIG_PATH);
    const error = err as NodeJS.ErrnoException;

    if (error.code === "ENOENT") {
      if (CONFIG_PATH === DEFAULT_CONFIG_PATH) {
        console.error(
          `config.json not found.\n\nCopy config.example.json to config.json and customize it:\n  cp config.example.json config.json\n`,
        );
      } else {
        console.error(
          `Config file not found: ${displayPath}\n\nPass a valid path with --config <path> or ${CONFIG_ENV_VAR}.\n`,
        );
      }
    } else {
      console.error(`Failed to load config from ${displayPath}:`, err);
    }
    process.exit(1);
  }
}

function resolveModel(role: string, config: Config): string | undefined {
  const value = config.models[role];
  // null or missing means "omit the field" (use platform default)
  if (value === null) return undefined;
  return value;
}

function resolveTools(toolList: unknown[], config: Config): string[] {
  const resolved: string[] = [];
  for (const entry of toolList) {
    const name = String(entry);
    // Existing configs predate communication. An omitted mapping leaves
    // messaging unavailable instead of emitting a literal tool name.
    if (name === "communication" && !(name in config.toolGroups)) continue;
    if (name in config.toolGroups) {
      resolved.push(...config.toolGroups[name]);
    } else {
      // Not a group name — pass through as a literal tool reference
      resolved.push(name);
    }
  }
  return resolved;
}

function shouldQuoteYamlString(value: string): boolean {
  return (
    value === "" ||
    value.trim() !== value ||
    /[:#{}[\],&*?|>'"@`!%\\\n\r]/.test(value) ||
    /^[-?:](?:\s|$)/.test(value) ||
    /^(?:true|false|null|~|yes|no|on|off)$/i.test(value) ||
    /^[-+]?(?:\d+|\d+\.\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value) ||
    /^[-+]?(?:\.inf|\.nan)$/i.test(value) ||
    !yamlPlainScalarRoundTrips(value)
  );
}

function yamlPlainScalarRoundTrips(value: string): boolean {
  try {
    const parsed = matter(`---\nvalue: ${value}\n---\n`).data as Record<
      string,
      unknown
    >;
    return parsed.value === value;
  } catch {
    return false;
  }
}

function formatYamlString(value: string): string {
  return shouldQuoteYamlString(value) ? JSON.stringify(value) : value;
}

function serializeFrontmatter(
  data: Record<string, unknown>,
  listStyle: "flow" | "block" = "flow",
): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      if (listStyle === "block") {
        for (const item of value) {
          lines.push(`  - ${formatYamlString(String(item))}`);
        }
      } else {
        // Preserve the existing YAML flow envelope for non-Pi targets.
        lines.push(`  [`);
        for (const item of value) {
          lines.push(`    ${formatYamlString(String(item))},`);
        }
        lines.push(`  ]`);
      }
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value ? "true" : "false"}`);
    } else if (typeof value === "string") {
      lines.push(`${key}: ${formatYamlString(value)}`);
    }
  }
  return lines.join("\n");
}

async function buildAgent(
  srcPath: string,
  outPath: string,
  outDir: string,
  config: Config,
  pluginName: string,
  composition: CanonicalComposition,
  outputBySourcePath: ReadonlyMap<string, string>,
  profileSkillNames: string[],
): Promise<string> {
  const raw = projectCompositionLinks(
    await readFile(srcPath, "utf-8"),
    srcPath,
    outPath,
    composition,
    outputBySourcePath,
  );
  const { data: parsedData, content } = matter(raw);
  // gray-matter caches identical source text. Target-specific edits belong to
  // this emission, not another agent with the same authored frontmatter/body.
  const data = { ...parsedData };
  const canonicalName = composition.bySourcePath.get(resolve(srcPath))?.name;
  if (!canonicalName) throw new Error(`Missing canonical agent name for ${srcPath}`);
  const isClaudeCode = config.target === "claude-code";
  const isPi = config.target === PI_TARGET;

  if (config.target === VSCODE_TARGET) {
    // VS Code resolves delegation and handoffs by name. Explicit frontmatter
    // replaces its plugin-qualified fallback, so carry the namespace ourselves.
    data.name = `${pluginName}:${canonicalName}`;
  } else if ((isClaudeCode || isPi) && !data.name) {
    // Claude Code and pi-subagents require this field.
    const name = isPi ? PI_PROFILE.name : canonicalName;
    const original = { ...data };
    for (const k of Object.keys(data)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete data[k];
    }
    Object.assign(data, { name }, original);
  }

  // Resolve model and target-specific thinking from the same abstract role.
  if (data.model !== undefined) {
    const role = String(data.model);
    const resolved = resolveModel(role, config);
    if (resolved === undefined) {
      delete data.model;
    } else {
      data.model = resolved;
    }
    if (isPi) {
      const thinking = config.thinkingLevels?.[role];
      if (thinking) data.thinking = thinking;
    }
  }

  // Resolve tools
  if (Array.isArray(data.tools)) {
    const resolved = resolveTools(data.tools, config);
    // Claude Code and Pi groups may overlap; both hosts want a strict unique list.
    data.tools = isClaudeCode || isPi ? [...new Set(resolved)] : resolved;
  }

  if (isClaudeCode) {
    delete data["user-invocable"];
  }

  if (isPi) {
    Object.assign(data, piAgentContext(profileSkillNames));
  }

  const frontmatter = serializeFrontmatter(data, isPi ? "block" : "flow");
  const outContent = `---\n${frontmatter}\n---\n${content}`;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, outContent);

  return `./${relative(outDir, outPath).split("\\").join("/")}`;
}

async function readHookManifests(files: string[]): Promise<HookManifest[]> {
  return Promise.all(files.map(async file => {
    try {
      const manifest = parseHookManifest(JSON.parse(await readFile(file, "utf8")) as unknown);
      const scriptPath = join(ROOT, "scripts", "hooks", manifest.script);
      if (!(await stat(scriptPath)).isFile()) throw new Error(`Hook script is not a file: ${scriptPath}`);
      return manifest;
    } catch (error) {
      throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  }));
}

/**
 * Assemble authored hooks and generated persistent delivery into one manifest.
 * Copy the authored runtime only when that target includes authored hooks.
 */
async function buildHooks(
  outDir: string,
  config: Config,
  plan: ProjectionPlan,
  manifests: HookManifest[],
): Promise<string[]> {
  const projected = projectPluginHooks(plan.target, manifests,
    plan.persistentInstructions?.delivery, config.hookMatchers);
  if (!projected) return [];

  if (manifests.length) {
    await cp(join(ROOT, "scripts", "hooks"), join(outDir, "scripts", "hooks"), { recursive: true });
    await copyAgentHooksPackage(outDir);
  }
  const { pluginPath, hooks } = projected;
  const destination = join(outDir, pluginPath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify({ hooks }, null, 2) + "\n");
  return [pluginPath];
}

async function copyAgentHooksPackage(outDir: string): Promise<void> {
  const hooksPkg = join(ROOT, "packages", "agent-hooks");
  const hooksDest = join(outDir, "node_modules", "@wycats", "agent-hooks");

  await mkdir(join(hooksDest, "src"), { recursive: true });

  const packageJson = JSON.parse(
    await readFile(join(hooksPkg, "package.json"), "utf-8"),
  ) as Record<string, unknown>;
  packageJson.exports = { ".": "./src/index.js" };

  await writeFile(
    join(hooksDest, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  await cp(join(hooksPkg, "tools.json"), join(hooksDest, "tools.json"));

  const runtimeSource = await readFile(
    join(hooksPkg, "src", "index.ts"),
    "utf-8",
  );
  const { outputText } = transpileModule(runtimeSource, {
    compilerOptions: {
      target: ScriptTarget.ES2024,
      module: ModuleKind.ESNext,
    },
    fileName: join(hooksPkg, "src", "index.ts"),
  });

  await writeFile(join(hooksDest, "src", "index.js"), outputText);
}

async function writeProjectedResource(
  resource: DiscoveredResource,
  outPath: string,
  composition: CanonicalComposition,
  outputBySourcePath: ReadonlyMap<string, string>,
  skillMetadata?: ProjectedResource["skillMetadata"],
): Promise<void> {
  let content = projectCompositionLinks(
    await readFile(resource.sourcePath, "utf-8"),
    resource.sourcePath,
    outPath,
    composition,
    outputBySourcePath,
  );
  // Link offsets refer to canonical text. Rewrite them before changing its envelope.
  if (skillMetadata) {
    content = serializeResourceFrontmatter(skillMetadata.frontmatter, parseResourceFrontmatter(content).body);
  }
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, content);
  if (skillMetadata?.codexSidecar) {
    const sidecarPath = join(dirname(outPath), "agents", "openai.yaml");
    await mkdir(dirname(sidecarPath), { recursive: true });
    await writeFile(sidecarPath, stringify(skillMetadata.codexSidecar));
  }
}

async function writeCompositionIndex(
  outDir: string,
  composition: CanonicalComposition,
  outputBySourcePath: ReadonlyMap<string, string>,
): Promise<void> {
  const edges = composition.references.flatMap((reference) => {
    const source = outputBySourcePath.get(reference.source.sourcePath);
    const target = outputBySourcePath.get(reference.target.sourcePath);
    if (!source || !target) return [];
    return [
      {
        canonicalSource: reference.source.pluginPath,
        canonicalSourceIdentity: reference.source.identity,
        canonicalLine: reference.line,
        generatedSource: `./${relative(outDir, source).split("\\").join("/")}`,
        relation: reference.relation,
        ...(reference.relation === "load" ? { context: reference.context } : {}),
        generatedTarget: `./${relative(outDir, target).split("\\").join("/")}`,
        canonicalTarget: reference.target.pluginPath,
        canonicalTargetIdentity: reference.target.identity,
      },
    ];
  });
  await writeFile(
    join(outDir, "composition-index.json"),
    JSON.stringify(
      {
        schemaVersion: 2,
        coordinates: {
          canonicalLine:
            "line in canonicalSource; generated files may add or transform frontmatter",
          generatedSource: "projected file path; no generated line is asserted",
        },
        semantics: {
          reference: "consultation availability",
          load: "requested activation when the governing prose applies",
          context: { passage: "read at the linked encounter", activity: "include with the active source or read at entry" },
        },
        edges,
      },
      null,
      2,
    ) + "\n",
  );
}

async function writePiCapabilityReport(
  outDir: string,
  plan: ProjectionPlan,
): Promise<void> {
  const catalog = [];
  for (const { resource, pluginPath } of plan.profileResources) {
    const data = matter(await readFile(resource.sourcePath, "utf-8")).data as Record<
      string,
      unknown
    >;
    catalog.push({
      name: resource.name,
      description:
        typeof data.description === "string" ? data.description : "",
      location: pluginPath,
    });
  }

  await writeFile(
    join(outDir, "projection-capabilities.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        profile: PI_PROFILE.name,
        workflow: plan.profileResources[0].resource.name,
        runtimePrerequisites: {
          pi: {
            inspectedVersion: "0.85.1",
            preflight: "re-run pi --version and re-verify package behavior after upgrades",
          },
          piSubagents: {
            required: true,
            inspectedVersion: "0.68.0",
            install: "pi install npm:pi-subagents",
            preflight:
              "run /subagents-doctor and inspect wycats-recon Prompt Audit before behavioral probes",
          },
        },
        agentFrontmatter: {
          listFormat: "YAML block list (- item)",
          verifiedParser: "pi-subagents 0.68.0 parseFrontmatterList",
        },
        activation: {
          mechanism: "model-directed progressive disclosure",
          markers: ["composition:load", "composition:reference"],
          automaticRuntimeLoader: false,
        },
        supported: [
          "public Recon workflow discovery",
          "private canonical stance catalog for the delegated Recon profile",
          "canonical link navigation and target-relative projection",
          "project context inheritance",
          "local filesystem reads, search, and shell commands",
        ],
        omitted: [
          "persistent instructions (outside the bounded Recon profile)",
          "browser tools",
          "persistent memory",
          "Exo context tools",
          "nested delegation and canonical fan-out execution",
          "dedicated testing tools (shell commands remain available)",
        ],
        note:
          "The canonical fan-out prose is preserved. This local-code prototype reports unavailable capabilities rather than substituting different semantics.",
        selectedResourceCatalog: catalog,
      },
      null,
      2,
    ) + "\n",
  );
}

async function build() {
  const config = await loadConfig();
  const defaultOutDir = outputPathForTarget(ROOT, config.target);
  const outDir = BUILD_OPTIONS.outputPath ?? defaultOutDir;
  if (BUILD_OPTIONS.outputPath) {
    await assertSafeOutputOverride(ROOT, outDir);
  }
  const resources = await discoverResourceFiles(ROOT);
  const compositionResult = await loadCanonicalComposition(ROOT, resources);
  if (!compositionResult.composition) {
    throw new Error(
      `Canonical composition validation failed before output cleanup:\n${formatCompositionDiagnostics(compositionResult.diagnostics)}`,
    );
  }
  const composition = compositionResult.composition;
  const isClaudeCode = config.target === "claude-code";
  const isCodex = config.target === CODEX_TARGET;
  const isPi = config.target === PI_TARGET;
  const plan = createProjectionPlan(composition, config.target, outDir);
  const projectedResources = plan.resources.map(({ resource }) => resource);
  const { outputBySourcePath } = plan;

  const hookManifests = await readHookManifests(
    plan.includesSourceHooks ? resources.hooks.map(resource => resource.sourcePath) : [],
  );

  // Source and target preflight intentionally complete before generated output changes.
  await prepareProjectionOutput({
    outDir,
    ...(config.target === VSCODE_TARGET && !BUILD_OPTIONS.outputPath
      ? { legacyOutDir: legacyVSCodeOutputPath(ROOT) }
      : {}),
    target: config.target,
    composition,
    outputBySourcePath,
  });

  const pluginMeta = JSON.parse(
    await readFile(join(ROOT, "plugin.json"), "utf-8"),
  ) as PluginMetadata;

  const agentResources = projectedResources.filter(
    (resource) => resource.kind === "agent",
  );
  const agentPaths: string[] = [];
  for (const resource of agentResources) {
    const outPath = outputBySourcePath.get(resolve(resource.sourcePath));
    if (!outPath) throw new Error(`Missing output path for ${resource.pluginPath}`);
    agentPaths.push(
      await buildAgent(
        resource.sourcePath,
        outPath,
        outDir,
        config,
        pluginMeta.name,
        composition,
        outputBySourcePath,
        plan.profileResources.map(({ resource }) => resource.name),
      ),
    );
  }

  for (const copy of plan.supportCopies) {
    if (copy.optional) {
      try {
        await stat(copy.source);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
    }
    await cp(copy.source, copy.destination, {
      recursive: true,
      filter: (source) => !copy.excludedFiles?.includes(source) && !copy.excludedDirectories?.some(
        (directory) => source === directory || source.startsWith(`${directory}${sep}`),
      ),
    });
  }

  for (const { resource, outputPath: outPath, skillMetadata } of plan.resources.filter(
    ({ resource }) => resource.kind === "workflow" || resource.kind === "stance",
  )) {
    await writeProjectedResource(
      resource,
      outPath,
      composition,
      outputBySourcePath,
      skillMetadata,
    );
  }

  const skillPaths = plan.resources.filter(({ resource }) => resource.kind === "workflow").map(({ pluginPath }) => pluginPath);
  const stancePaths = plan.resources.filter(({ resource }) => resource.kind === "stance").map(({ pluginPath }) => pluginPath);

  const allSkillPaths = [...skillPaths, ...stancePaths];

  for (const { resource, outputPath } of plan.resources.filter(({ resource }) => resource.kind === "instruction")) {
    await writeProjectedResource(resource, outputPath, composition, outputBySourcePath);
  }
  await writePersistentContext(outDir, plan, composition);
  const hookPaths = await buildHooks(outDir, config, plan, hookManifests);

  await writeCompositionIndex(outDir, composition, outputBySourcePath);
  await writeFile(join(outDir, "context-delivery.json"), JSON.stringify(contextDeliveryIndex(composition, plan), null, 2) + "\n");
  await writeFile(join(outDir, "projection-resources.json"), JSON.stringify(projectionResourceMap(plan), null, 2) + "\n");

  const packageJson = isPi
    ? {
        name: pluginMeta.name,
        version: pluginMeta.version,
        description: `${pluginMeta.description} Pi projection.`,
        private: true,
        keywords: ["pi-package"],
        engines: { node: ">=24.0.0" },
        pi: {
          skills: plan.resources.filter(({ resource, exposure }) => resource.kind === "workflow" && exposure === "public").map(({ pluginPath }) => posix.dirname(pluginPath)),
          subagents: { agents: ["./agents"] },
        },
      }
    : { type: "module", engines: { node: ">=24.0.0" } };
  await writeFile(
    join(outDir, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
  );

  if (isPi) {
    await writePiCapabilityReport(outDir, plan);
    console.log(`Built to ${relative(ROOT, outDir)}/`);
    console.log(`  agents:       ${String(agentPaths.length)} pi-subagents profile`);
    console.log(`  skills:       ${String(plan.resources.filter(({ resource, exposure }) => resource.kind === "workflow" && exposure === "public").length)} public workflow`);
    console.log(`  stances:      ${String(stancePaths.length)} private canonical resources`);
    console.log("  manifest:     package.json");
    console.log("  capabilities: projection-capabilities.json");
  } else if (isClaudeCode) {
    // Claude Code: generate .claude-plugin/plugin.json
    const ccManifest: Record<string, unknown> = {
      name: pluginMeta.name,
      version: pluginMeta.version,
      description: pluginMeta.description,
    };

    // CC auto-discovers agents/, skills/, and hooks/ from the plugin root.
    // Explicit paths in the manifest override auto-discovery and have strict
    // validation — omitting them lets CC find everything in default locations.

    const manifestDir = join(outDir, ".claude-plugin");
    await mkdir(manifestDir, { recursive: true });
    await writeFile(
      join(manifestDir, "plugin.json"),
      JSON.stringify(ccManifest, null, 2) + "\n",
    );

    console.log(`Built to ${relative(ROOT, outDir)}/`);
    console.log(`  agents:       ${String(agentPaths.length)}`);
    console.log(
      `  skills:       ${String(skillPaths.length)} workflow + ${String(stancePaths.length)} stances = ${String(allSkillPaths.length)}`,
    );
    console.log(`  hooks:        ${String(hookPaths.length)}`);
    console.log(`  manifest:     .claude-plugin/plugin.json`);
  } else if (isCodex) {
    // Codex discovers skills and the generated context hook from fixed paths.
    // Agents remain reference material; authored policy hooks are omitted.
    const codexManifest: CodexPluginJson = {
      name: pluginMeta.name,
      version: pluginMeta.version,
      description: pluginMeta.description,
      author: {
        name: "wycats",
        url: "https://github.com/wycats",
      },
      homepage: "https://github.com/wycats/vscode-ai-plugin",
      repository: "https://github.com/wycats/vscode-ai-plugin",
      license: "MIT",
      keywords: ["codex", "agents", "skills", "workflow", "review"],
      skills: "./skills/",
      interface: {
        displayName: pluginMeta.name,
        shortDescription: "Personal workflow skills for Codex",
        longDescription:
          "A personal agent toolkit for Codex with workflow skills, architectural and implementation quality practices, collaborative review patterns, and reusable stances for stronger agent collaboration.",
        developerName: "wycats",
        category: "Developer Tools",
        capabilities: ["Interactive", "Write"],
        websiteURL: "https://github.com/wycats/vscode-ai-plugin",
        defaultPrompt: [
          "Improve implementation quality in this codebase",
          "Walk me through this code with the walkthrough skill",
          "Run a recon pass over this project",
        ],
        brandColor: "#2F6FED",
      },
    };

    const manifestDir = join(outDir, ".codex-plugin");
    await mkdir(manifestDir, { recursive: true });
    await writeFile(
      join(manifestDir, "plugin.json"),
      JSON.stringify(codexManifest, null, 2) + "\n",
    );

    console.log(`Built to ${relative(ROOT, outDir)}/`);
    console.log(`  agents:       ${String(agentPaths.length)} copied`);
    console.log(
      `  skills:       ${String(skillPaths.length)} workflow + ${String(stancePaths.length)} stances = ${String(allSkillPaths.length)}`,
    );
    console.log(`  manifest:     .codex-plugin/plugin.json`);
  } else {
    // VS Code: copy instructions; generate plugin.json
    const instructionPaths = plan.resources.filter(({ resource }) => resource.kind === "instruction" && !resource.persistentContext).map(({ pluginPath }) => pluginPath);

    const manifest = vscodePluginManifest(pluginMeta, { agentPaths, instructionPaths });
    await writeFile(join(outDir, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");

    console.log(`Built to ${relative(ROOT, outDir)}/`);
    console.log(`  agents:       ${String(agentPaths.length)}`);
    console.log(
      `  skills:       ${String(skillPaths.length)} workflow + ${String(stancePaths.length)} stances = ${String(allSkillPaths.length)}`,
    );
    console.log(`  instructions: ${String(instructionPaths.length)}`);
    console.log(`  hooks:        ${String(hookPaths.length)}`);
  }
}

build().catch((err: unknown) => {
  console.error("Build failed:", err);
  process.exit(1);
});
