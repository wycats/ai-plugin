/** A bounded source-format experiment. Production discovery and builds are unchanged. */
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { stringify } from "yaml";
import { discoverResourceFiles } from "../resource-discovery.ts";
import {
  loadCanonicalComposition, projectCompositionLinks, formatCompositionDiagnostics,
  type CanonicalComposition, type CanonicalResource,
} from "../resource-composition.ts";
import {
  isMapping, parseResourceFrontmatter, serializeResourceFrontmatter,
} from "../resource-frontmatter.ts";
import { normalizeSkillSource } from "../skill-activation.ts";
import { createProjectionPlan } from "../projection-plan.ts";
import { type BuildTarget } from "../target-output.ts";

const root = resolve(import.meta.dirname, "../..");
const fixtureRoot = join(root, "experiments/standard-source/fixtures");
const fields = {
  kind: "wycats.kind", userInvocable: "wycats.user-invocable", invocation: "wycats.invocation",
} as const;

async function write(path: string, contents: string) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

async function load(directory: string): Promise<CanonicalComposition> {
  const result = await loadCanonicalComposition(directory, await discoverResourceFiles(directory));
  if (!result.composition) throw new Error(formatCompositionDiagnostics(result.diagnostics));
  return result.composition;
}

function canonicalPath(resource: CanonicalResource): string {
  return resource.kind === "agent" ? `agents/${resource.name}.agent.md`
    : `${resource.kind === "stance" ? "stances" : "skills"}/${resource.name}/SKILL.md`;
}

function candidatePath(resource: CanonicalResource): string {
  return resource.kind === "agent" ? canonicalPath(resource) : `skills/${resource.name}/SKILL.md`;
}

function groupedPath(resource: CanonicalResource): string {
  if (resource.kind === "agent") return canonicalPath(resource);
  const group = resource.kind === "stance" ? "stances" : "workflows";
  return `skills/${group}/${resource.name}/SKILL.md`;
}

/** Follow both reference and load edges: both must resolve in a self-contained slice. */
async function selectSlice(): Promise<CanonicalComposition> {
  const discovered = await discoverResourceFiles(root);
  const fixtures = await discoverResourceFiles(fixtureRoot);
  discovered.skills.push(...fixtures.skills.map((resource) => ({
    ...resource, pluginPath: `./${relative(root, resource.sourcePath)}`,
  })));
  const { composition, diagnostics } = await loadCanonicalComposition(root, discovered);
  if (!composition) throw new Error(formatCompositionDiagnostics(diagnostics));
  const selected = new Set(composition.resources.filter((resource) =>
    ["agent:recon", "skill:recon", "skill:entry-fixture", "skill:reconstruction-fixture"].includes(resource.identity)));
  let size: number;
  do {
    size = selected.size;
    for (const edge of composition.references) if (selected.has(edge.source)) selected.add(edge.target);
  } while (selected.size !== size);
  return { ...composition, resources: [...selected],
    bySourcePath: new Map([...selected].map((resource) => [resource.sourcePath, resource])),
    references: composition.references.filter((edge) => selected.has(edge.source)) };
}

/** Reuse the real link projector; support files stay relative to their resource. */
async function relocate(
  composition: CanonicalComposition, directory: string,
  pathFor: (resource: CanonicalResource) => string,
  frontmatter: (resource: CanonicalResource) => Record<string, unknown>,
) {
  const destinations = new Map(composition.resources.map((resource) =>
    [resource.sourcePath, join(directory, pathFor(resource))]));
  for (const resource of composition.resources) {
    const destination = destinations.get(resource.sourcePath);
    assert(destination);
    if (resource.kind !== "agent") {
      await cp(dirname(resource.sourcePath), dirname(destination), { recursive: true });
    }
    const projected = projectCompositionLinks(await readFile(resource.sourcePath, "utf8"),
      resource.sourcePath, destination, composition, destinations);
    const { body } = parseResourceFrontmatter(projected);
    await write(destination, serializeResourceFrontmatter(frontmatter(resource), body));
  }
}

function encodeMetadata(resource: CanonicalResource): Record<string, unknown> {
  if (!resource.activation) return resource.frontmatter;
  const data = { ...resource.frontmatter };
  delete data.invocation;
  delete data["user-invocable"];
  data.metadata = {
    ...(isMapping(data.metadata) ? data.metadata : {}),
    [fields.kind]: resource.kind === "stance" ? "stance" : "workflow",
    [fields.userInvocable]: String(resource.activation.userInvocable),
    [fields.invocation]: resource.activation.invocation,
  };
  return data;
}

function meaning(composition: CanonicalComposition) {
  return {
    resources: composition.resources.map(({ identity, kind, activation }) =>
      ({ identity, kind, activation })).sort((a, b) => a.identity.localeCompare(b.identity)),
    edges: composition.references.map(({ source, target, relation }) =>
      `${source.identity} ${relation} ${target.identity}`).sort(),
  };
}

async function renderResources(composition: CanonicalComposition, target: BuildTarget, directory: string) {
  const plan = createProjectionPlan(composition, target, directory);
  const comparison = [];
  for (const entry of plan.resources) {
    const resource = entry.resource;
    if (resource.activation) await cp(dirname(resource.sourcePath), dirname(entry.outputPath), { recursive: true });
    const text = projectCompositionLinks(await readFile(resource.sourcePath, "utf8"),
      resource.sourcePath, entry.outputPath, composition, plan.outputBySourcePath);
    const { body } = parseResourceFrontmatter(text);
    const frontmatter = entry.skillMetadata?.frontmatter ?? resource.frontmatter;
    await write(entry.outputPath, serializeResourceFrontmatter(frontmatter, body));
    const sidecar = entry.skillMetadata?.codexSidecar;
    if (sidecar) await write(join(dirname(entry.outputPath), "agents/openai.yaml"), stringify(sidecar));
    comparison.push({ identity: resource.identity, path: entry.pluginPath, exposure: entry.exposure,
      frontmatter, sidecar, body });
  }
  return comparison.sort((a, b) => a.identity.localeCompare(b.identity));
}

async function verifyBoundary(candidate: string, directory: string) {
  const index = await load(candidate);
  const entryResource = index.resources.find((resource) => resource.identity === "skill:entry-fixture");
  const explicitResource = index.resources.find((resource) => resource.identity === "skill:reconstruction-fixture");
  assert(entryResource && explicitResource);
  const broken = join(directory, "load-edge");
  await cp(candidate, broken, { recursive: true });
  const entry = join(broken, relative(candidate, entryResource.sourcePath));
  await write(entry, (await readFile(entry, "utf8")).replace('"composition:reference"', '"composition:load"'));
  await assert.rejects(load(broken), /cannot target explicit-only/);

  const explicit = parseResourceFrontmatter(await readFile(explicitResource.sourcePath, "utf8")).data;
  assert(isMapping(explicit.metadata));
  const withMetadata = (changes: Record<string, unknown>) => ({ ...explicit, metadata: { ...explicit.metadata as Record<string, unknown>, ...changes } });
  assert.throws(() => normalizeSkillSource(withMetadata({ [fields.userInvocable]: "false" })), /requires user-invocable/);
  assert.throws(() => normalizeSkillSource(withMetadata({ [fields.userInvocable]: true })), /string-to-string/);
  assert.throws(() => normalizeSkillSource({ ...explicit, invocation: "contextual" }), /duplicates/);
  assert.throws(() => normalizeSkillSource(withMetadata({ [fields.kind]: "agent" })), /wycats.kind must/);
}

async function verifyRoundTrip(baseline: CanonicalComposition, normalized: CanonicalComposition) {
  assert.deepEqual(meaning(normalized), meaning(baseline));
  for (const resource of baseline.resources) {
    const roundTrip = normalized.resources.find((entry) => entry.identity === resource.identity);
    assert(roundTrip);
    const destinations = new Map(normalized.resources.map((entry) => {
      const original = baseline.resources.find((candidate) => candidate.identity === entry.identity);
      assert(original);
      return [entry.sourcePath, original.sourcePath];
    }));
    const restoredLinks = projectCompositionLinks(await readFile(roundTrip.sourcePath, "utf8"),
      roundTrip.sourcePath, resource.sourcePath, normalized, destinations);
    assert.equal(parseResourceFrontmatter(restoredLinks).body,
      parseResourceFrontmatter(await readFile(resource.sourcePath, "utf8")).body);
  }
}

/** Compare authored paths with v1's shallow layout; this is not a host loader. */
async function inspectLayout(directory: string) {
  const authoringSkills = (await discoverResourceFiles(directory)).skills.map((resource) => resource.pluginPath);
  return { authoringSkills,
    v1EligibleSkillPaths: authoringSkills.filter((path) => /^\.\/skills\/[^/]+\/SKILL\.md$/.test(path)) };
}

async function verifyExplicitProjection(
  actual: Awaited<ReturnType<typeof renderResources>>, target: BuildTarget, directory: string,
) {
  const explicit = actual.find((resource) => resource.identity === "skill:reconstruction-fixture");
  if (target === "pi") assert.equal(explicit, undefined); // Existing bounded profile.
  else {
    assert(explicit);
    assert.equal(explicit.exposure, "public");
    if (target === "codex") {
      assert(isMapping(explicit.sidecar?.policy));
      assert.equal(explicit.sidecar.policy.allow_implicit_invocation, false);
    } else assert.equal(explicit.frontmatter["disable-model-invocation"], true);
    assert.equal(await readFile(join(directory, "skills/reconstruction-fixture/references/contract.md"), "utf8"),
      await readFile(join(fixtureRoot, "skills/reconstruction-fixture/references/contract.md"), "utf8"));
  }
  return explicit ? "public; native policy emitted" : "outside existing profile";
}

await mkdir(join(root, "out"), { recursive: true });
const output = await mkdtemp(join(root, "out/standard-source-prototype-"));
const baselinePath = join(output, "current-source");
await relocate(await selectSlice(), baselinePath, canonicalPath, (resource) => resource.frontmatter);
const baseline = await load(baselinePath);
const targets: BuildTarget[] = ["vscode", "claude-code", "codex", "pi"];
const expected = new Map<BuildTarget, Awaited<ReturnType<typeof renderResources>>>();
for (const target of targets) {
  expected.set(target, await renderResources(baseline, target, join(output, "current-projections", target)));
}
const results = [];
for (const layout of [
  { name: "flat", pathFor: candidatePath },
  { name: "grouped", pathFor: groupedPath },
]) {
  const directory = join(output, layout.name);
  const candidate = join(directory, "source");
  await relocate(baseline, candidate, layout.pathFor, encodeMetadata);
  if (layout.name === "flat") {
    await write(join(candidate, "plugin.json"), JSON.stringify({
      $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
      name: "wycats-source-prototype", version: "0.0.0",
      description: "Authoring-layout experiment; use target projections to preserve activation semantics.",
    }, null, 2) + "\n");
  } else {
    await write(join(candidate, "README.md"), "# Grouped authoring candidate\n\n" +
      "This source groups instruction containers by meaning. The prototype reader discovers them recursively.\n" +
      "Agent Plugins 1.0 does not discover these nested skills. No published 1.1 conformance or host support is claimed.\n" +
      "The production reader ingests this tree directly and generates target resource layouts.\n");
  }
  const normalized = await load(candidate);
  await verifyRoundTrip(baseline, normalized);
  const projections = [];
  for (const target of targets) {
    const destination = join(directory, "projections", target);
    const actual = await renderResources(normalized, target, destination);
    assert.deepEqual(actual, expected.get(target));
    const explicitFixture = await verifyExplicitProjection(actual, target, destination);
    projections.push({ target, equivalentResources: actual.length, explicitFixture });
  }
  await verifyBoundary(candidate, join(directory, "negative-cases"));
  const discovery = await inspectLayout(candidate);
  assert.equal(discovery.v1EligibleSkillPaths.length, layout.name === "flat" ? discovery.authoringSkills.length : 0);
  results.push({ layout: layout.name, ...discovery, projections });
}
const report = {
  scope: "Source round trip and resource projection comparison; no host execution or complete package build",
  resources: meaning(baseline), candidates: results,
  checks: ["normalized kinds, identities, activation, and edges agree", "body bytes survive round trip",
    "projected paths, exposure, metadata, sidecars, and bodies agree", "fixture support file survives",
    "load into explicit workflow rejected", "invalid metadata and duplicate ownership rejected"],
  limits: ["Generic discovery has no standardized meaning for wycats metadata",
    "Flat source places every instruction container on the v1 discovery surface; metadata does not control generic host exposure",
    "Grouped source requires our authoring reader; no Agent Plugins 1.1 support or conformance is claimed",
    "Agent envelope, host installation, visibility, and runtime selection remain untested"],
};
await write(join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
await write(join(output, "comparison.md"), `# Three source layouts, one resource model

Both candidates load directly through the production source reader and preserve
the slice's resource identities, kinds, activation policies, composition edges,
and body bytes after resolving link destinations. No intermediate source tree is reconstructed.
Both produce equivalent resource projections: nine resources each for VS Code,
Claude Code, and Codex; seven for the existing Pi profile, which excludes the fixtures.

| Open a resource | Legacy baseline | Flat candidate | Grouped candidate |
| --- | --- | --- | --- |
| Recon | [Workflow](current-source/skills/recon/SKILL.md) | [Workflow](flat/source/skills/recon/SKILL.md) | [Workflow](grouped/source/skills/workflows/recon/SKILL.md) |
| Diagnostic questioning | [Stance](current-source/stances/diagnostic-questioning/SKILL.md) | [Stance](flat/source/skills/diagnostic-questioning/SKILL.md) | [Stance](grouped/source/skills/stances/diagnostic-questioning/SKILL.md) |
| Explicit entry | [Fixture](current-source/skills/reconstruction-fixture/SKILL.md) | [Fixture](flat/source/skills/reconstruction-fixture/SKILL.md) | [Fixture](grouped/source/skills/workflows/reconstruction-fixture/SKILL.md) |

The grouped candidate keeps the stance/workflow distinction visible in directories
and records it in metadata. The production reader uses metadata to determine semantic kind
and retains today's globally unique skill names.

The flat candidate's eight instruction containers meet v1's immediate-child layout.
None of the grouped containers do. The grouped tree is an authoring option that
can project to today's layouts; it makes no claim of direct host support.

Compare the generated [flat Codex policy](flat/projections/codex/skills/reconstruction-fixture/agents/openai.yaml)
and [grouped Codex policy](grouped/projections/codex/skills/reconstruction-fixture/agents/openai.yaml).
Both preserve the same explicit-entry declaration. Native execution remains untested.

The [machine-readable report](report.json) records both candidates and all four target comparisons.
`);
console.log(`Prototype checks passed. Inspect ${output}`);
console.log(JSON.stringify(results.map(({ layout, projections }) => ({ layout, projections })), null, 2));
