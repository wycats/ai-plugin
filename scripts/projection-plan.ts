import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import matter from "gray-matter";
import { PI_PROFILE } from "./pi-profile.ts";
import {
  formatCompositionDiagnostics,
  validateProjectionCompleteness,
  type CanonicalComposition,
  type CanonicalResource,
} from "./resource-composition.ts";
import { CODEX_TARGET, PI_TARGET, VSCODE_TARGET, isBuildTarget, type BuildTarget } from "./target-output.ts";

export interface ProjectedResource {
  resource: CanonicalResource;
  outputPath: string;
  pluginPath: string;
  exposure: "public" | "private" | "reference";
}

export interface ProjectionPlan {
  target: BuildTarget;
  resources: ProjectedResource[];
  profileResources: ProjectedResource[];
  outputBySourcePath: ReadonlyMap<string, string>;
  supportCopies: Array<{ source: string; destination: string; optional: boolean }>;
  includesHooks: boolean;
}

/** One address and exposure decision for every materialized canonical resource.
 * Composition links retain prose-governed activation; this is no runtime loader. */
export async function createProjectionPlan(
  composition: CanonicalComposition,
  target: string,
  outDir: string,
): Promise<ProjectionPlan> {
  if (!isBuildTarget(target)) throw new Error(`Unsupported build target '${target}'`);
  const selected = composition.resources.filter((resource) => {
    if (target === PI_TARGET) {
      return resource.pluginPath === PI_PROFILE.agent ||
        resource.pluginPath === PI_PROFILE.resources[0] || resource.section === "stances";
    }
    return resource.section !== "instructions" || target === VSCODE_TARGET;
  });
  const resources: ProjectedResource[] = [];
  for (const resource of selected) {
    const destination = target === PI_TARGET && resource.section === "agents"
      ? `agents/${PI_PROFILE.name}.agent.md`
      : resource.section === "stances" && (target === "claude-code" || target === CODEX_TARGET)
        ? `skills/${resource.name}/SKILL.md`
        : resource.pluginPath.slice(2);
    const frontmatter = matter(await readFile(resource.sourcePath, "utf8")).data as Record<string, unknown>;
    resources.push({
      resource,
      outputPath: resolve(outDir, destination),
      pluginPath: `./${destination}`,
      exposure: target === CODEX_TARGET && resource.section === "agents"
        ? "reference"
        : resource.section === "stances" || resource.section === "instructions" ||
            frontmatter["user-invocable"] === false
          ? "private"
          : "public",
    });
  }
  const outputBySourcePath = new Map(resources.map(({ resource, outputPath }) => [resource.sourcePath, outputPath]));
  const diagnostics = validateProjectionCompleteness(composition, outputBySourcePath, target);
  if (diagnostics.length) {
    throw new Error(`Target projection validation failed before output cleanup:\n${formatCompositionDiagnostics(diagnostics)}`);
  }
  const profileResources = target === PI_TARGET ? PI_PROFILE.resources.map((path) => {
    const projected = resources.find(({ resource }) => resource.pluginPath === path);
    if (!projected) throw new Error(`Pi profile requires canonical resource '${path}'`);
    return projected;
  }) : [];
  if (target === PI_TARGET && !resources.some(({ resource }) => resource.pluginPath === PI_PROFILE.agent)) {
    throw new Error(`Pi profile requires canonical agent '${PI_PROFILE.agent}'`);
  }
  const copyDirectory = (path: string, optional = true) => ({
    source: join(composition.root, path), destination: join(outDir, path), optional,
  });
  const supportCopies = target === PI_TARGET
    ? [copyDirectory(dirname(PI_PROFILE.resources[0].slice(2)), false), copyDirectory("stances")]
    : [copyDirectory("skills"), ...(target === VSCODE_TARGET ? [copyDirectory("stances"), copyDirectory("instructions")] : [])];
  return { target, resources, profileResources, outputBySourcePath, supportCopies,
    includesHooks: target === VSCODE_TARGET || target === "claude-code" };
}

export interface ProjectionResourceMap {
  schemaVersion: 1;
  target: BuildTarget;
  resources: Array<{ canonicalSource: string; generatedSource: string; identity: string; exposure: ProjectedResource["exposure"] }>;
}

export function projectionResourceMap(plan: ProjectionPlan): ProjectionResourceMap {
  return {
    schemaVersion: 1, target: plan.target,
    resources: plan.resources.map(({ resource, pluginPath, exposure }) => ({
      canonicalSource: resource.pluginPath, generatedSource: pluginPath, identity: resource.identity, exposure,
    })),
  };
}

export function parseProjectionResourceMap(value: unknown, target: BuildTarget): ProjectionResourceMap {
  const isRecord = (entry: unknown): entry is Record<string, unknown> => typeof entry === "object" && entry !== null;
  if (!isRecord(value) || value.schemaVersion !== 1 || value.target !== target || !Array.isArray(value.resources) ||
      !(value.resources as unknown[]).every((entry) => isRecord(entry) && typeof entry.canonicalSource === "string" &&
        typeof entry.generatedSource === "string" && typeof entry.identity === "string" &&
        typeof entry.exposure === "string" && ["public", "private", "reference"].includes(entry.exposure))) {
    throw new Error(`Invalid projection resource map for '${target}'`);
  }
  return value as unknown as ProjectionResourceMap;
}

/** Read the built artifact's address contract, rather than reconstructing a host layout. */
export function resolveProjectedResource(
  output: string,
  map: ProjectionResourceMap,
  canonicalPath: string,
): string {
  const matches = map.resources.filter((resource) => resource.canonicalSource === `./${canonicalPath}`);
  if (matches.length !== 1) throw new Error(`Expected one projected resource for '${canonicalPath}'`);
  const path = matches[0].generatedSource;
  const resolved = resolve(output, path);
  const local = relative(output, resolved);
  const portable = path.slice(2);
  if (!path.startsWith("./") || path.includes("\\") || posix.normalize(portable) !== portable ||
      posix.isAbsolute(portable) || !local || local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new Error(`Invalid generated resource path '${path}'`);
  }
  return resolved;
}
