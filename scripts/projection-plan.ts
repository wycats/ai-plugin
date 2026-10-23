import { z } from "zod";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { codexSkillSidecar } from "./skill-activation.ts";
import { PI_PROFILE } from "./pi-profile.ts";
import {
  formatCompositionDiagnostics,
  validateProjectionCompleteness,
  type CanonicalComposition,
  type CanonicalResource,
} from "./resource-composition.ts";
import { CODEX_TARGET, PI_TARGET, VSCODE_TARGET, buildTargetSchema, isBuildTarget, type BuildTarget } from "./target-output.ts";

const resourceExposureSchema = z.enum(["public", "private", "reference"]);

export interface ProjectedResource {
  resource: CanonicalResource;
  outputPath: string;
  pluginPath: string;
  exposure: z.infer<typeof resourceExposureSchema>;
  /** Resolved before output cleanup; emitted after copying supporting files. */
  skillMetadata?: { frontmatter: Record<string, unknown>; codexSidecar?: Record<string, unknown> };
}

export interface PersistentInstructionPlan {
  resources: ProjectedResource[];
  delivery: "session-start" | "claude-project-import";
}

export interface ProjectionPlan {
  target: BuildTarget;
  resources: ProjectedResource[];
  profileResources: ProjectedResource[];
  outputBySourcePath: ReadonlyMap<string, string>;
  supportCopies: Array<{ source: string; destination: string; optional: boolean; excludedDirectories?: string[]; excludedFiles?: string[] }>;
  /** Authored policy/observer hooks are independent of persistent delivery. */
  includesSourceHooks: boolean;
  persistentInstructions?: PersistentInstructionPlan;
}

function projectedDestination(resource: CanonicalResource, target: BuildTarget): string {
  if (resource.persistentContext) return resource.pluginPath.slice(2);
  if (resource.kind === "workflow" || resource.kind === "stance") {
    if (target === PI_TARGET && resource.kind === "workflow" && resource.identity !== PI_PROFILE.resources[0]) {
      return `references/workflows/${resource.name}/SKILL.md`;
    }
    const directory = target === PI_TARGET && resource.kind === "stance" ? "stances" : "skills";
    return `${directory}/${resource.name}/SKILL.md`;
  }
  if (target === PI_TARGET && resource.kind === "agent") return `agents/${PI_PROFILE.name}.agent.md`;
  if (target === VSCODE_TARGET && resource.kind === "agent") return `com.github.copilot/${resource.pluginPath.slice(2)}`;
  if (target === VSCODE_TARGET && resource.kind === "instruction") return `com.github.copilot/rules/${resource.pluginPath.slice("./instructions/".length)}`;
  return resource.pluginPath.slice(2);
}

/** One address and exposure decision for every materialized canonical resource.
 * Composition links retain prose-governed activation; this is no runtime loader. */
export function createProjectionPlan(
  composition: CanonicalComposition,
  target: string,
  outDir: string,
): ProjectionPlan {
  if (!isBuildTarget(target)) throw new Error(`Unsupported build target '${target}'`);
  const selected = composition.resources.filter((resource) => {
    if (target === PI_TARGET) {
      return resource.identity === PI_PROFILE.agent ||
        resource.identity === PI_PROFILE.resources[0] || resource.kind === "stance";
    }
    return resource.kind !== "instruction" || resource.persistentContext || target === VSCODE_TARGET;
  });
  if (target === PI_TARGET) {
    // A reference makes a workflow readable without advertising another native
    // entry. Loading an omitted workflow still fails completeness validation.
    const included = new Set(selected);
    let changed = true;
    while (changed) {
      changed = false;
      for (const { source, target: referenced, relation } of composition.references) {
        if (included.has(source) && relation === "reference" && referenced.kind === "workflow" && !included.has(referenced)) {
          included.add(referenced);
          selected.push(referenced);
          changed = true;
        }
      }
    }
  }
  const resources: ProjectedResource[] = [];
  for (const resource of selected) {
    const destination = projectedDestination(resource, target);
    const frontmatter = resource.frontmatter;
    let skillMetadata: ProjectedResource["skillMetadata"];
    if (resource.activation) {
      try {
        const projected: Record<string, unknown> = { ...frontmatter, "user-invocable": resource.activation.userInvocable };
        delete projected.invocation;
        if (target === CODEX_TARGET) {
          if (!/^skills\/[^/]+\/SKILL\.md$/.test(destination)) {
            throw new Error("Codex requires skill directories immediately under skills/");
          }
          skillMetadata = { frontmatter: projected,
            codexSidecar: codexSkillSidecar(frontmatter, resource.activation, resource.skillSidecar) };
        } else {
          skillMetadata = { frontmatter: { ...projected,
            "disable-model-invocation": resource.activation.invocation === "explicit" } };
        }
      } catch (error) {
        throw new Error(`${target}: ${resource.pluginPath}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
    resources.push({
      resource,
      outputPath: resolve(outDir, destination),
      pluginPath: `./${destination}`,
      skillMetadata,
      exposure: (target === CODEX_TARGET && resource.kind === "agent") ||
        (target === PI_TARGET && resource.kind === "workflow" && resource.identity !== PI_PROFILE.resources[0])
        ? "reference"
        : resource.kind === "stance" || resource.kind === "instruction" ||
            (resource.activation?.userInvocable ?? frontmatter["user-invocable"]) === false
          ? "private"
          : "public",
    });
  }
  const outputBySourcePath = new Map(resources.map(({ resource, outputPath }) => [resource.sourcePath, outputPath]));
  const diagnostics = validateProjectionCompleteness(composition, outputBySourcePath, target);
  if (diagnostics.length) {
    throw new Error(`Target projection validation failed before output cleanup:\n${formatCompositionDiagnostics(diagnostics)}`);
  }
  const profileResources = target === PI_TARGET ? PI_PROFILE.resources.map((identity) => {
    const projected = resources.find(({ resource }) => resource.identity === identity);
    if (!projected) throw new Error(`Pi profile requires canonical resource '${identity}'`);
    return projected;
  }) : [];
  if (target === PI_TARGET && !resources.some(({ resource }) => resource.identity === PI_PROFILE.agent)) {
    throw new Error(`Pi profile requires canonical agent '${PI_PROFILE.agent}'`);
  }
  const supportCopies: ProjectionPlan["supportCopies"] = resources
    .filter(({ resource }) => resource.kind === "workflow" || resource.kind === "stance")
    .map(({ resource, outputPath }) => {
      const source = dirname(resource.sourcePath);
      // Each container owns its supporting files. Nested discovered containers
      // receive their own projection rather than leaking raw source envelopes.
      const excludedDirectories = composition.resources
        .map((nested) => dirname(nested.sourcePath))
        .filter((directory) => directory.startsWith(`${source}${sep}`));
      return { source, destination: dirname(outputPath), optional: false, excludedDirectories };
    });
  if (target === VSCODE_TARGET) {
    // Instruction supporting files retain their existing shared directory scope.
    supportCopies.push({ source: join(composition.root, "instructions"),
      destination: join(outDir, "com.github.copilot", "rules"), optional: true,
      excludedFiles: composition.resources.filter(resource => resource.persistentContext).map(resource => resource.sourcePath) });
  }
  const persistentResources = resources.filter(({ resource }) => resource.persistentContext);
  if (target === "claude-code" && persistentResources.length &&
      resources.some(({ resource }) => resource.activation && resource.name === "setup-guidance")) {
    throw new Error("Claude persistent delivery reserves the skill name 'setup-guidance' for project installation.");
  }
  return { target, resources, profileResources, outputBySourcePath, supportCopies,
    includesSourceHooks: target === VSCODE_TARGET || target === "claude-code",
    ...(persistentResources.length ? { persistentInstructions: {
      resources: persistentResources,
      delivery: target === "claude-code" ? "claude-project-import" as const : "session-start" as const,
    } } : {}) };
}

const projectionResourceMapSchema = z.object({
  schemaVersion: z.literal(1),
  target: buildTargetSchema,
  resources: z.array(z.object({
    canonicalSource: z.string(),
    generatedSource: z.string(),
    identity: z.string(),
    exposure: resourceExposureSchema,
  })),
});

export type ProjectionResourceMap = z.infer<typeof projectionResourceMapSchema>;

export function projectionResourceMap(plan: ProjectionPlan): ProjectionResourceMap {
  return {
    schemaVersion: 1, target: plan.target,
    resources: plan.resources.map(({ resource, pluginPath, exposure }) => ({
      canonicalSource: resource.pluginPath, generatedSource: pluginPath, identity: resource.identity, exposure,
    })),
  };
}

export function parseProjectionResourceMap(value: unknown, target: BuildTarget): ProjectionResourceMap {
  const result = projectionResourceMapSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid projection resource map for '${target}':\n${z.prettifyError(result.error)}`);
  }
  if (result.data.target !== target) {
    throw new Error(`Invalid projection resource map for '${target}': received '${result.data.target}'`);
  }
  return result.data;
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
