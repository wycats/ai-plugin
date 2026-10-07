/**
 * Validates the plugin source tree:
 * - Every skill directory has a SKILL.md with valid frontmatter
 * - Every stance directory has a SKILL.md with valid frontmatter
 * - Every agent file has valid frontmatter with a description
 * - Every instruction file has valid frontmatter
 * - Every neutral hook manifest has required fields and an existing script
 * - plugin.json contains metadata only; resources are discovered from disk
 * - Skill and stance directory names match the `name` field in SKILL.md
 */

import { readFile, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RESOURCE_SECTIONS,
  discoverResourceFiles,
  type DiscoveredResource,
} from "./resource-discovery.ts";
import { loadCanonicalComposition } from "./resource-composition.ts";

const HOOK_TYPES = new Set(["policy", "observer", "side-effect"]);

const ROOT = fileURLToPath(new URL("..", import.meta.url));

let errors = 0;

function error(msg: string) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function extractFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line
        .slice(colonIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      fields[key] = value;
    }
  }
  return fields;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function parseJsonObject(
  path: string,
  content: string,
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      error(`${path}: expected a JSON object`);
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    error(`${path}: invalid JSON (${String(err)})`);
    return null;
  }
}

async function validatePluginJson() {
  console.log("Checking plugin metadata...");
  const pluginPath = join(ROOT, "plugin.json");

  if (!(await fileExists(pluginPath))) {
    error("plugin.json not found.");
    return;
  }

  const plugin = parseJsonObject(
    "plugin.json",
    await readFile(pluginPath, "utf-8"),
  );
  if (!plugin) return;

  for (const field of ["name", "version", "description"] as const) {
    const value = plugin[field];
    if (typeof value !== "string" || value.trim() === "") {
      error(`plugin.json: missing non-empty '${field}' metadata field`);
    }
  }

  for (const section of RESOURCE_SECTIONS) {
    if (section in plugin) {
      error(
        `plugin.json: remove '${section}' entries; build/validate discover resources from the filesystem`,
      );
    }
  }
}

async function validateSkills(skills: DiscoveredResource[]) {
  console.log(`Checking skills (${String(skills.length)})...`);

  await validateSkillLikeResources(skills);
}

async function validateStances(stances: DiscoveredResource[]) {
  console.log(`Checking stances (${String(stances.length)})...`);

  await validateSkillLikeResources(stances, (stance, fm) => {
    if (fm["user-invocable"] !== "false") {
      error(
        `${stance.pluginPath}: stances must declare 'user-invocable: false'`,
      );
    }
  });
}

async function validateSkillLikeResources(
  resources: DiscoveredResource[],
  validateFrontmatter?: (
    resource: DiscoveredResource,
    frontmatter: Record<string, string>,
  ) => void,
) {
  for (const resource of resources) {
    const fullPath = resource.sourcePath;
    const content = await readFile(fullPath, "utf-8");
    const fm = extractFrontmatter(content);

    if (!fm) {
      error(`${resource.pluginPath}: missing YAML frontmatter`);
      continue;
    }

    if (!fm.name) {
      error(`${resource.pluginPath}: missing 'name' in frontmatter`);
    }

    if (!fm.description) {
      error(`${resource.pluginPath}: missing 'description' in frontmatter`);
    }

    // Check name matches directory
    const dirName = basename(dirname(fullPath));
    if (fm.name && fm.name !== dirName) {
      error(
        `${resource.pluginPath}: name '${fm.name}' does not match directory '${dirName}'`,
      );
    }

    validateFrontmatter?.(resource, fm);
  }
}

async function validateAgents(agents: DiscoveredResource[]) {
  console.log(`Checking agents (${String(agents.length)})...`);

  for (const agent of agents) {
    const fullPath = agent.sourcePath;
    const content = await readFile(fullPath, "utf-8");
    const fm = extractFrontmatter(content);

    if (!fm) {
      error(`${agent.pluginPath}: missing YAML frontmatter`);
      continue;
    }

    if (!fm.description) {
      error(`${agent.pluginPath}: missing 'description' in frontmatter`);
    }
  }
}

async function validateInstructions(instructions: DiscoveredResource[]) {
  console.log(`Checking instructions (${String(instructions.length)})...`);

  for (const instruction of instructions) {
    const content = await readFile(instruction.sourcePath, "utf-8");
    const fm = extractFrontmatter(content);

    if (!fm) {
      error(`${instruction.pluginPath}: missing YAML frontmatter`);
      continue;
    }

    if (!fm.description) {
      error(`${instruction.pluginPath}: missing 'description' in frontmatter`);
    }

    if (!fm.applyTo) {
      error(`${instruction.pluginPath}: missing 'applyTo' in frontmatter`);
    }
  }
}

async function validateHooks(hooks: DiscoveredResource[]) {
  console.log(`Checking hooks (${String(hooks.length)})...`);

  for (const hook of hooks) {
    const manifest = parseJsonObject(
      hook.pluginPath,
      await readFile(hook.sourcePath, "utf-8"),
    );
    if (!manifest) continue;

    const type = manifest.type;
    if (typeof type !== "string" || !HOOK_TYPES.has(type)) {
      error(
        `${hook.pluginPath}: 'type' must be one of policy, observer, side-effect`,
      );
    }

    if (typeof manifest.name !== "string" || manifest.name.trim() === "") {
      error(`${hook.pluginPath}: missing non-empty 'name'`);
    }

    const events = manifest.events;
    if (
      !Array.isArray(events) ||
      events.length === 0 ||
      events.some((event) => typeof event !== "string" || event.trim() === "")
    ) {
      error(`${hook.pluginPath}: 'events' must be a non-empty string array`);
    }

    if (manifest.tool !== undefined && typeof manifest.tool !== "string") {
      error(`${hook.pluginPath}: optional 'tool' must be a string`);
    }

    const script = manifest.script;
    if (typeof script !== "string" || script.trim() === "") {
      error(`${hook.pluginPath}: missing non-empty 'script'`);
    } else if (isAbsolute(script) || script.split(/[\\/]/).includes("..")) {
      error(`${hook.pluginPath}: 'script' must stay under scripts/hooks/`);
    } else if (!(await fileExists(join(ROOT, "scripts", "hooks", script)))) {
      error(`${hook.pluginPath}: script not found: scripts/hooks/${script}`);
    }

    if (
      manifest.timeout !== undefined &&
      typeof manifest.timeout !== "number"
    ) {
      error(`${hook.pluginPath}: optional 'timeout' must be a number`);
    }
  }
}

async function main() {
  const resources = await discoverResourceFiles(ROOT);

  await validatePluginJson();
  await validateSkills(resources.skills);
  await validateStances(resources.stances);
  await validateAgents(resources.agents);
  await validateInstructions(resources.instructions);
  await validateHooks(resources.hooks);

  console.log("Checking canonical composition links...");
  const composition = await loadCanonicalComposition(ROOT, resources);
  for (const diagnostic of composition.diagnostics) {
    error(`${diagnostic.file}:${String(diagnostic.line)}: ${diagnostic.message}`);
  }

  console.log("");
  if (errors > 0) {
    console.error(`Validation failed with ${String(errors)} error(s).`);
    process.exit(1);
  } else {
    console.log("All checks passed.");
  }
}

main().catch((err: unknown) => {
  console.error("Validation error:", err);
  process.exit(1);
});
