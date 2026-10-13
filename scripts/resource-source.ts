import { basename, dirname } from "node:path";
import matter from "gray-matter";
import type { DiscoveredResource, ResourceKind } from "./resource-discovery.ts";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { normalizeSkillSource, type SkillActivation } from "./skill-activation.ts";

export interface CanonicalResourceContent {
  identity: string;
  name: string;
  kind: ResourceKind;
  frontmatter: Record<string, unknown>;
  activation?: SkillActivation;
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
  const frontmatter = matter(content).data as Record<string, unknown>;
  const name = typeof frontmatter.name === "string" && frontmatter.name.trim() !== ""
    ? frontmatter.name
    : basename(resource.sourcePath).replace(/\.agent\.md$|\.instructions\.md$/, "");
  const kind = resource.section === "agents" ? "agent" : "instruction";
  return { name, identity: `${kind}:${name}`, kind, frontmatter };
}
