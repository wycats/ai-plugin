import matter from "gray-matter";
import { isAbsolute, posix, relative, resolve, sep } from "node:path";
import { realpath } from "node:fs/promises";
import type { EvaluationResource } from "./core.ts";
import { parseCanonicalResource } from "../resource-source.ts";

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

/** Suite locators remain stable identifiers; adapters consume their validated meaning. */
export function evaluationResourceKind(resource: EvaluationResource): CanonicalResourceDescriptor["kind"] {
  const prefix = `${CANONICAL_RESOURCE_AUTHORITY}:`;
  for (const [directory, kind] of [["agents", "agent"], ["skills", "skill"], ["stances", "stance"]] as const) {
    if (resource.identity === `${prefix}${directory}/${resource.name}`) return kind;
  }
  throw new Error(`Invalid canonical resource identity '${resource.identity}'.`);
}

export function canonicalResourceDescriptor(
  path: string,
  source: string,
): CanonicalResourceDescriptor {
  if (path.includes("\\") || posix.normalize(path) !== path) {
    throw new Error(`Resource path '${path}' must use its canonical repository-relative form.`);
  }
  const section = path.split("/")[0];
  if (!((section === "agents" && /^agents\/(?:[^/]+\/)*[^/]+\.agent\.md$/.test(path)) ||
        ((section === "skills" || section === "stances") && /^(?:skills|stances)\/(?:[^/]+\/)+SKILL\.md$/.test(path)))) {
    throw new Error(`Unsupported canonical resource path: ${path}.`);
  }
  const parsed = parseCanonicalResource({ section, sourcePath: path, pluginPath: `./${path}` }, source);
  const kind = parsed.kind === "workflow" ? "skill" : parsed.kind;
  if (kind === "instruction") throw new Error(`Unsupported evaluation resource: ${path}.`);
  const directory = kind === "agent" ? "agents" : kind === "skill" ? "skills" : "stances";
  return { name: parsed.name, kind, locator: `${directory}/${parsed.name}` };
}

function validateDiscoveryFields(name: string, source: string, path: string, requireName: boolean): void {
  const frontmatter = matter(source).data as Record<string, unknown>;
  if (typeof frontmatter.description !== "string" || frontmatter.description.trim() === "") {
    throw new Error(`${path} must declare a non-empty description in frontmatter.`);
  }
  if ((requireName || frontmatter.name !== undefined) && frontmatter.name !== name) {
    throw new Error(`Resource name ${JSON.stringify(frontmatter.name)} in ${path} does not match canonical name '${name}'.`);
  }
}

/** Generated envelopes carry native policy, not canonical authoring metadata. */
export function validateProjectedResource(resource: EvaluationResource, source: string): void {
  validateDiscoveryFields(resource.name, source, resource.path, true);
}

export function validateCanonicalResource(
  resource: EvaluationResource,
  source: string,
): void {
  const descriptor = canonicalResourceDescriptor(resource.path, source);
  validateDiscoveryFields(descriptor.name, source, resource.path, descriptor.kind !== "agent");
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
