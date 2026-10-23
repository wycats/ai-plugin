import { z } from "zod";
import { buildTargetSchema } from "./target-output.ts";

const modelMapping = z.string().nullable();

// Role names are authored by agents. Known roles provide editor suggestions;
// custom roles and omitted mappings are supported by the build.
const modelsSchema = z.object({
  "fast": modelMapping.optional().describe("High-capability model for agents that need strong reasoning (recon, recon-worker). Examples: 'Claude Opus 4.6 Fast (vercel)', 'opus', null (platform default)."),
  "balanced": modelMapping.optional().describe("Mid-tier model role available to agent definitions. Examples: 'Gemini 3.1 Pro Preview (vercel)', 'sonnet', null (platform default)."),
  "auxiliary": modelMapping.optional().describe("Model for delegated editorial reading (editorial-reader). Examples: 'GPT 5.4 (vercel)', 'haiku', null (platform default)."),
}).catchall(modelMapping)
  .describe("Maps authored model roles to provider model names. Null or an omitted role uses the host default.");

const toolGroup = z.array(z.string());
const toolGroupsSchema = z.object({
  "core": toolGroup.optional().describe("Base tools available to most agents (search, read, etc.)."),
  "agent": toolGroup.optional().describe("Ability to dispatch subagents."),
  "communication": toolGroup.optional().describe("Messages to existing agents, including continuation where supported, without granting new-agent creation. Omitted mappings provide no tools for this group."),
  "browser": toolGroup.optional().describe("Browser interaction tools."),
  "edit": toolGroup.optional().describe("File editing tools for agents whose assignments include changing artifacts."),
  "memory": toolGroup.optional().describe("Persistent memory read/write."),
  "exo": toolGroup.optional().describe("Exosuit context tools."),
  "terminal": toolGroup.optional().describe("Full terminal access (run, await, kill, get output)."),
  "terminal-minimal": toolGroup.optional().describe("Limited terminal access (run and get output only)."),
  "testing": toolGroup.optional().describe("Test execution and failure inspection."),
  "tasks": toolGroup.optional().describe("VS Code task creation and execution."),
  "github": toolGroup.optional().describe("GitHub API tools (PRs, issues, search)."),
}).catchall(toolGroup)
  .describe("Named groups of tool identifiers. Agent source files reference group names, and the build expands them to concrete tool lists. Names that don't match a group key pass through as literals, except communication, which contributes no tools when omitted.");

export const buildConfigSchema = z.strictObject({
  $schema: z.string().optional().describe("Path to this schema file. Enables editor validation and autocomplete."),
  target: buildTargetSchema.describe("Build target platform. VS Code builds to out/wycats/; Claude Code builds to out/claude-code/; Codex builds to out/codex/; Pi builds to out/pi/."),
  models: modelsSchema,
  thinkingLevels: z.record(z.string(), modelMapping).optional().describe("Optional target-specific thinking levels keyed by abstract model role. Pi projects these into pi-subagents agent profiles."),
  toolGroups: toolGroupsSchema,
  hookMatchers: z.object({
    "terminal": z.string().optional().describe("Matcher for terminal hooks, e.g. Bash."),
    "edit": z.string().optional().describe("Matcher for edit hooks, e.g. Write|Edit|MultiEdit."),
  }).catchall(z.string()).optional()
    .describe("Claude Code hook matcher strings keyed by neutral hook tool name. Used when building consolidated hooks.json."),
}).meta({
  title: "Plugin Config",
  description: "Configuration for building the agent plugin. Maps abstract role names to concrete model strings and tool identifiers for your environment.",
});

export type BuildConfig = z.infer<typeof buildConfigSchema>;

export function parseBuildConfig(value: unknown): BuildConfig {
  const result = buildConfigSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid build configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** The committed editor schema is generated from the runtime contract. */
export function buildConfigJsonSchema(): string {
  const schema = z.toJSONSchema(buildConfigSchema, { target: "draft-07", io: "input" });
  return JSON.stringify(schema, null, 2) + "\n";
}
