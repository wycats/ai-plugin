import matter from "gray-matter";
import { isAbsolute, posix, relative, resolve, sep } from "node:path";
import { realpath } from "node:fs/promises";
import type { EvaluationResource } from "./core.ts";
import { normalizeSkillSource } from "../skill-activation.ts";
import type { SkillKind } from "../resource-discovery.ts";

export const CANONICAL_RESOURCE_AUTHORITY = "wycats-plugin";

export async function resolveCanonicalResourcePath(root: string, path: string): Promise<string> {
  const resolved = resolve(root, path);
  let physicalPath: string;
  try {
    physicalPath = await realpath(resolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Canonical resource does not exist: ${path}.`, { cause: error });
    }
    throw error;
  }
  for (const local of [
    relative(root, resolved),
    relative(await realpath(root), physicalPath),
  ]) {
    if (!local || local === ".." || local.startsWith(`..${sep}`) || isAbsolute(local)) {
      throw new Error(`Canonical resource must resolve inside the repository: ${path}.`);
    }
  }
  return resolved;
}

export interface CanonicalResourceDescriptor {
  kind: "agent" | "skill" | "stance";
  name: string;
  locator: string;
}

function sourceData(source: string | Record<string, unknown>): Record<string, unknown> {
  return typeof source === "string"
    ? (matter(source).data as Record<string, unknown>)
    : source;
}

function skillSourceKind(
  path: string,
): { name: string; pathKind: SkillKind; legacyKind?: SkillKind } | undefined {
  const grouped = path.match(/^skills\/(workflows|stances)\/(?:[^/]+\/)*([^/]+)\/SKILL\.md$/);
  if (grouped) {
    const pathKind = grouped[1] === "workflows" ? "workflow" : "stance";
    return {
      name: grouped[2],
      pathKind,
    };
  }

  const legacyWorkflow = path.match(/^skills\/(?:[^/]+\/)*([^/]+)\/SKILL\.md$/);
  if (legacyWorkflow) return { name: legacyWorkflow[1], pathKind: "workflow", legacyKind: "workflow" };

  const legacyStance = path.match(/^stances\/(?:[^/]+\/)*([^/]+)\/SKILL\.md$/);
  if (legacyStance) return { name: legacyStance[1], pathKind: "stance", legacyKind: "stance" };
  return undefined;
}

export function canonicalResourceDescriptor(
  path: string,
  source?: string | Record<string, unknown>,
): CanonicalResourceDescriptor {
  const normalized = path.replaceAll("\\", "/");
  if (path !== normalized || posix.normalize(normalized) !== normalized) {
    throw new Error(`Resource path '${path}' must use its canonical repository-relative form.`);
  }
  const agent = normalized.match(/^agents\/(.+)\.agent\.md$/);
  if (agent) return { kind: "agent", name: agent[1], locator: `agents/${agent[1]}` };

  const skillSource = skillSourceKind(normalized);
  if (skillSource) {
    const kind = source === undefined
      ? skillSource.pathKind
      : normalizeSkillSource(sourceData(source), skillSource.legacyKind).kind;
    const resourceKind = kind === "workflow" ? "skill" : "stance";
    const locator = `${resourceKind === "skill" ? "skills" : "stances"}/${skillSource.name}`;
    return {
      kind: resourceKind,
      name: skillSource.name,
      locator,
    };
  }

  throw new Error(`Unsupported canonical resource path: ${path}.`);
}

export function validateCanonicalResource(
  resource: EvaluationResource,
  source: string,
): void {
  const rawFrontmatter = matter(source).data as Record<string, unknown>;
  const descriptor = canonicalResourceDescriptor(resource.path, rawFrontmatter);
  const normalizedSkill = descriptor.kind === "agent"
    ? undefined
    : normalizeSkillSource(
        rawFrontmatter,
        descriptor.kind === "skill" ? "workflow" : "stance",
      );
  const frontmatter = normalizedSkill?.frontmatter ?? rawFrontmatter;
  if (typeof frontmatter.description !== "string" || frontmatter.description.trim() === "") {
    throw new Error(`${resource.path} must declare a non-empty description in frontmatter.`);
  }
  if (frontmatter.name !== undefined && frontmatter.name !== descriptor.name) {
    throw new Error(
      `Resource name ${JSON.stringify(frontmatter.name)} in ${resource.path} does not match canonical name '${descriptor.name}'.`,
    );
  }
  if (descriptor.kind !== "agent" && frontmatter.name === undefined) {
    throw new Error(`${resource.path} must declare its canonical name in frontmatter.`);
  }
  if (resource.name !== descriptor.name) {
    throw new Error(
      `Resource name '${resource.name}' does not match canonical name '${descriptor.name}'.`,
    );
  }

  const separator = resource.identity.indexOf(":");
  const sourceName = resource.identity.slice(0, separator);
  const identityLocator = resource.identity.slice(separator + 1);
  if (
    separator <= 0 ||
    sourceName !== CANONICAL_RESOURCE_AUTHORITY ||
    identityLocator !== descriptor.locator
  ) {
    throw new Error(
      `Resource identity '${resource.identity}' does not match canonical identity '${CANONICAL_RESOURCE_AUTHORITY}:${descriptor.locator}'.`,
    );
  }
}
