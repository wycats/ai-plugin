import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export const RESOURCE_SECTIONS = [
  "agents",
  "skills",
  "stances",
  "instructions",
  "hooks",
] as const;

export type ResourceSection = (typeof RESOURCE_SECTIONS)[number];

export interface DiscoveredResource {
  section: ResourceSection;
  sourcePath: string;
  pluginPath: string;
}

interface ResourcePattern {
  directory: ResourceSection;
  pattern: RegExp;
}

const RESOURCE_PATTERNS = {
  agents: { directory: "agents", pattern: /\.agent\.md$/ },
  skills: { directory: "skills", pattern: /^SKILL\.md$/ },
  stances: { directory: "stances", pattern: /^SKILL\.md$/ },
  instructions: { directory: "instructions", pattern: /\.instructions\.md$/ },
  hooks: { directory: "hooks", pattern: /\.json$/ },
} satisfies Record<ResourceSection, ResourcePattern>;

export async function findFiles(
  dir: string,
  pattern: RegExp,
): Promise<string[]> {
  const results: string[] = [];

  const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFiles(full, pattern)));
    } else {
      pattern.lastIndex = 0;
      if (pattern.test(entry.name)) {
        results.push(full);
      }
    }
  }

  return results;
}

function isMissingTopLevelResourceDirectory(
  err: unknown,
  directory: string,
): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ENOENT" &&
    "path" in err &&
    err.path === directory
  );
}

export async function discoverResourceFiles(
  root: string,
): Promise<Record<ResourceSection, DiscoveredResource[]>> {
  const resources: Record<ResourceSection, DiscoveredResource[]> = {
    agents: [],
    skills: [],
    stances: [],
    instructions: [],
    hooks: [],
  };

  for (const section of RESOURCE_SECTIONS) {
    const { directory, pattern } = RESOURCE_PATTERNS[section];
    const sectionDirectory = join(root, directory);
    let files: string[];

    try {
      files = await findFiles(sectionDirectory, pattern);
    } catch (err: unknown) {
      if (isMissingTopLevelResourceDirectory(err, sectionDirectory)) {
        files = [];
      } else {
        throw err;
      }
    }

    resources[section] = files.map((sourcePath) => ({
      section,
      sourcePath,
      pluginPath: `./${relative(root, sourcePath).split(sep).join("/")}`,
    }));
  }

  return resources;
}
