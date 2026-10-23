import type { CanonicalComposition, CanonicalResource, CompositionReference } from "./resource-composition.ts";
import type { ProjectionPlan } from "./projection-plan.ts";

export interface ActivityContext {
  source: CanonicalResource;
  /** Full bodies accompanying the source. The source itself is already present. */
  resources: CanonicalResource[];
  /** Includes repeated and cyclic edges so deduplication preserves provenance. */
  edges: CompositionReference[];
}

/** Plan an adopted source's entry context, without traversing passage or reference edges. */
export function activityContext(composition: CanonicalComposition, source: CanonicalResource): ActivityContext {
  if (composition.bySourcePath.get(source.sourcePath) !== source) {
    throw new Error(`Context source '${source.identity}' does not belong to this composition`);
  }
  const seen = new Set([source.identity]);
  const resources: CanonicalResource[] = [];
  const edges: CompositionReference[] = [];
  const pending = [source];
  for (let index = 0; index < pending.length; index++) {
    for (const edge of composition.references) {
      if (edge.source !== pending[index] || edge.context !== "activity") continue;
      edges.push(edge);
      if (seen.has(edge.target.identity)) continue;
      seen.add(edge.target.identity);
      resources.push(edge.target);
      pending.push(edge.target);
    }
  }
  return { source, resources, edges };
}

/** A package records authored intent. A runtime adapter selects delivery mechanisms. */
export function contextDeliveryIndex(composition: CanonicalComposition, plan: ProjectionPlan) {
  const projected = new Map(plan.resources.map(item => [item.resource.identity, item]));
  return {
    schemaVersion: 1,
    target: plan.target,
    status: "intent-only",
    sources: plan.resources.map(({ resource, pluginPath }) => {
      const context = activityContext(composition, resource);
      return {
        source: resource.identity,
        generatedSource: pluginPath,
        activity: context.resources.map(target => {
          const item = projected.get(target.identity);
          if (!item) throw new Error(`Missing projected context '${target.identity}' for '${resource.identity}'`);
          return { identity: target.identity, generatedSource: item.pluginPath };
        }),
        edges: context.edges.map(edge => ({
          source: edge.source.identity, target: edge.target.identity,
          canonicalSource: edge.source.pluginPath, canonicalLine: edge.line,
        })),
      };
    }),
  };
}
