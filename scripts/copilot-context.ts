import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { activityContext } from "./context-delivery.ts";
import { projectCompositionLinks, type CanonicalComposition, type CanonicalResource } from "./resource-composition.ts";
import { parseResourceFrontmatter, serializeResourceFrontmatter } from "./resource-frontmatter.ts";
import type { ProjectionPlan } from "./projection-plan.ts";

/** Requires a materialized projection. The caller owns model, tools, permissions and session effects. */
export async function copilotAgentContext(
  composition: CanonicalComposition,
  plan: ProjectionPlan,
  agentIdentity: string,
) {
  if (plan.target !== "vscode") throw new Error("Copilot SDK context requires the VS Code resource projection");
  const projected = new Map(plan.resources.map(item => [item.resource.identity, item]));
  const agent = projected.get(agentIdentity);
  if (!agent || agent.resource.kind !== "agent") throw new Error(`No projected agent '${agentIdentity}'`);

  // Advertise reachable load targets, while the activity closure alone is preloaded.
  // References remain readable through their projected paths without selecting their workflows.
  const catalog = new Map<string, CanonicalResource>();
  const pending = [agent.resource];
  const seen = new Set([agentIdentity]);
  for (let index = 0; index < pending.length; index++) {
    for (const edge of composition.references) {
      if (edge.source !== pending[index] || edge.relation !== "load") continue;
      if (!edge.target.activation) throw new Error(`SDK context cannot deliver non-skill load '${edge.target.identity}'`);
      if (!projected.has(edge.target.identity)) throw new Error(`Missing projected skill '${edge.target.identity}'`);
      if (edge.target.activation.invocation !== "contextual") throw new Error(`SDK context cannot select explicit-only '${edge.target.identity}'`);
      if (seen.has(edge.target.identity)) continue;
      seen.add(edge.target.identity);
      catalog.set(edge.target.name, edge.target);
      pending.push(edge.target);
    }
  }

  // Consultation uses the filesystem, including targets outside the skill catalog.
  // Check every advertised address before constructing any receiving context.
  const required = new Set(pending);
  for (const edge of composition.references) {
    if (seen.has(edge.source.identity)) required.add(edge.target);
  }
  for (const resource of required) {
    const item = projected.get(resource.identity);
    if (!item) throw new Error(`Missing projected reference '${resource.identity}'`);
    try {
      await readFile(item.outputPath, "utf8");
    } catch (cause) {
      throw new Error(`SDK context requires a readable built resource '${resource.identity}' at ${item.outputPath}. Build the projection first.`, { cause });
    }
  }

  const plans = new Map(pending.map(source => [source.identity, activityContext(composition, source)]));
  const bodies = new Map<string, string>();
  for (const source of pending) {
    const item = projected.get(source.identity);
    if (!item) throw new Error(`Missing projected source '${source.identity}'`);
    const content = projectCompositionLinks(await readFile(source.sourcePath, "utf8"), source.sourcePath,
      item.outputPath, composition, plan.outputBySourcePath);
    const body = parseResourceFrontmatter(content).body;
    const context = plans.get(source.identity);
    assert.ok(context, `Missing context plan for ${source.identity}`);
    const activity = context.resources;
    const links = composition.references.filter(edge => edge.source === source);
    const guidance = [
      "<context-delivery>",
      "Generated for the Copilot SDK. The authored instructions follow this envelope.",
      `Resolve relative file references from ${dirname(item.outputPath)}.`,
      ...(activity.length ? [
        `Activity context: ${activity.map(resource => resource.name).join(", ")}.`,
        "Consult these bodies at entry if they are not already available here, using the skill tool with their listed names.",
      ] : []),
      ...(links.length ? [
        "When a linked instruction marked composition:load applies, consult its supporting body before making that judgment if it is not already available.",
        "For composition:reference, read the file when useful for consultation. Reading a reference does not select its workflow.",
        ...links.map(edge => {
          const target = projected.get(edge.target.identity);
          if (!target) throw new Error(`Missing projected reference '${edge.target.identity}'`);
          return edge.relation === "load"
            ? `Load target ${edge.target.pluginPath}: skill name ${edge.target.name}, file ${target.outputPath}.`
            : `Reference target ${edge.target.pluginPath}: file ${target.outputPath}.`;
        }),
      ] : []),
      "</context-delivery>",
      "",
    ].join("\n");
    bodies.set(source.identity, guidance + body);
  }

  const prompt = bodies.get(agentIdentity);
  const entryContext = plans.get(agentIdentity);
  assert.ok(prompt && entryContext, `Missing entry context for ${agentIdentity}`);
  return {
    agent: {
      name: agent.resource.name,
      description: String(agent.resource.frontmatter.description),
      prompt,
      skills: entryContext.resources.map(resource => resource.name),
    },
    skillProvider: {
      listSkills() {
        return [...catalog.values()].map(resource => {
          assert.ok(resource.activation);
          return {
            name: resource.name,
            description: String(resource.frontmatter.description),
            userInvocable: resource.activation.userInvocable,
            disableModelInvocation: resource.activation.invocation === "explicit",
          };
        });
      },
      readSkill(name: string) {
        const resource = catalog.get(name);
        if (!resource) return undefined;
        const item = projected.get(resource.identity);
        const body = bodies.get(resource.identity);
        assert.ok(item?.skillMetadata && body, `Missing SDK skill body for ${resource.identity}`);
        return serializeResourceFrontmatter(item.skillMetadata.frontmatter, body);
      },
    },
    delivery: {
      route: "copilot-sdk-custom-agent",
      activity: "native-skills-preload",
      passage: "skill-tool-with-generated-guidance",
      reference: "file-read-for-consultation",
      sources: [...plans.values()].map(context => ({ source: context.source.identity,
        activity: context.resources.map(resource => resource.identity) })),
    },
  };
}
