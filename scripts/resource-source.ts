import { basename, dirname } from "node:path";
import type { DiscoveredResource, ResourceKind } from "./resource-discovery.ts";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { normalizeSkillSource, type SkillActivation } from "./skill-activation.ts";

export interface CanonicalResourceContent {
  identity: string;
  name: string;
  kind: ResourceKind;
  frontmatter: Record<string, unknown>;
  activation?: SkillActivation;
  persistentContext?: boolean;
}

/** Resolve authoring conventions here; semantic consumers share this reading. */
export function parseCanonicalResource(
  resource: DiscoveredResource,
  content: string,
): CanonicalResourceContent {
  if (resource.section === "skills" || resource.section === "stances") {
    const grouped = /^\.\/skills\/(?:workflows|stances)\//.test(resource.pluginPath);
    const source = normalizeSkillSource(parseResourceFrontmatter(content).data,
      grouped ? undefined : resource.section === "stances" ? "stance" : "workflow");
    const { frontmatter, kind, activation } = source;
    const metadata = frontmatter.metadata as Record<string, unknown> | undefined;
    if (metadata?.["wycats.context"] !== undefined) {
      throw new Error("wycats.context belongs on an instruction resource");
    }
    const name = frontmatter.name;
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("canonical resource is missing a non-empty frontmatter name");
    }
    const directory = basename(dirname(resource.sourcePath));
    if (name !== directory) {
      throw new Error(`canonical resource name '${name}' does not match directory '${directory}'`);
    }
    if (typeof frontmatter.description !== "string" || frontmatter.description.trim() === "") {
      throw new Error("description must be a nonempty string");
    }
    return { name, identity: `skill:${name}`, kind, frontmatter, activation };
  }

  if (resource.section !== "agents" && resource.section !== "instructions") {
    throw new Error(`Not a canonical instruction resource: ${resource.pluginPath}`);
  }
  const frontmatter = parseResourceFrontmatter(content).data;
  const name = typeof frontmatter.name === "string" && frontmatter.name.trim() !== ""
    ? frontmatter.name
    : basename(resource.sourcePath).replace(/\.agent\.md$|\.instructions\.md$/, "");
  const kind = resource.section === "agents" ? "agent" : "instruction";
  const metadata = frontmatter.metadata;
  if (metadata !== undefined && (metadata === null || typeof metadata !== "object" || Array.isArray(metadata))) {
    throw new Error("metadata must be a mapping");
  }
  const context = (metadata as Record<string, unknown> | undefined)?.["wycats.context"];
  if (context !== undefined && (kind !== "instruction" || context !== "persistent")) {
    throw new Error("wycats.context must be 'persistent' on an instruction resource");
  }
  if (context !== undefined && frontmatter.applyTo !== undefined) {
    throw new Error("persistent instructions use wycats.context instead of a file-pattern applyTo");
  }
  return { name, identity: `${kind}:${name}`, kind, frontmatter,
    ...(context === "persistent" ? { persistentContext: true } : {}) };
}
