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
import { parseSkillActivation } from "../skill-activation.ts";
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
  return resource.section === "agents" ? `agents/${resource.name}.agent.md`
    : `${resource.section}/${resource.name}/SKILL.md`;
}

function candidatePath(resource: CanonicalResource): string {
  return resource.section === "agents" ? canonicalPath(resource) : `skills/${resource.name}/SKILL.md`;
}

function groupedPath(resource: CanonicalResource): string {
  if (resource.section === "agents") return canonicalPath(resource);
  const group = resource.section === "stances" ? "stances" : "workflows";
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
    if (resource.section !== "agents") {
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
    [fields.kind]: resource.section === "stances" ? "stance" : "workflow",
    [fields.userInvocable]: String(resource.activation.userInvocable),
    [fields.invocation]: resource.activation.invocation,
  };
  return data;
}

/** Experimental authoring dialect. These keys are consumed by our bridge, not by hosts. */
function decodeMetadata(data: Record<string, unknown>) {
  const metadata = data.metadata;
  assert(isMapping(metadata), "expected string-valued authoring metadata");
  assert(Object.values(metadata).every((value) => typeof value === "string"), "metadata values must be strings");
  assert(!Object.hasOwn(data, "invocation") && !Object.hasOwn(data, "user-invocable"), "duplicate policy ownership");
  const kind = metadata[fields.kind];
  assert(kind === "stance" || kind === "workflow", "unknown wycats.kind");
  const visibility = metadata[fields.userInvocable];
  assert(visibility === "true" || visibility === "false", "invalid wycats.user-invocable");
  const section = kind === "stance" ? "stances" : "skills";
  const ownedFields: string[] = Object.values(fields);
  const remaining = Object.fromEntries(Object.entries(metadata).filter(([key]) => !ownedFields.includes(key)));
  const frontmatter: Record<string, unknown> = {
    ...data, "user-invocable": visibility === "true", invocation: metadata[fields.invocation],
  };
  delete frontmatter.metadata;
  if (Object.keys(remaining).length) frontmatter.metadata = remaining;
  // The established parser owns valid activation combinations.
  parseSkillActivation(frontmatter, section);
  return { section, frontmatter };
}

async function normalizeCandidate(candidate: string, normalized: string) {
  // This initial index is for link destinations only. The current reader does not
  // interpret wycats metadata; the normalized tree is validated again below.
  const index = await load(candidate);
  const decoded = new Map(index.resources.filter((resource) => resource.section !== "agents")
    .map((resource) => [resource.sourcePath, decodeMetadata(resource.frontmatter)]));
  await relocate(index, normalized,
    (resource) => {
      if (resource.section === "agents") return canonicalPath(resource);
      const policy = decoded.get(resource.sourcePath);
      assert(policy);
      return `${policy.section}/${resource.name}/SKILL.md`;
    },
    (resource) => decoded.get(resource.sourcePath)?.frontmatter ?? resource.frontmatter);
  return load(normalized);
}

function meaning(composition: CanonicalComposition) {
  return {
    resources: composition.resources.map(({ identity, section, activation }) =>
      ({ identity, section, activation })).sort((a, b) => a.identity.localeCompare(b.identity)),
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
  await assert.rejects(normalizeCandidate(broken, join(directory, "load-normalized")), /cannot target explicit-only/);

  const explicit = explicitResource.frontmatter;
  assert(isMapping(explicit.metadata));
  const withMetadata = (changes: Record<string, unknown>) => ({ ...explicit, metadata: { ...explicit.metadata as Record<string, unknown>, ...changes } });
  assert.throws(() => decodeMetadata(withMetadata({ [fields.userInvocable]: "false" })), /requires user-invocable/);
  assert.throws(() => decodeMetadata(withMetadata({ [fields.userInvocable]: true })), /must be strings/);
  assert.throws(() => decodeMetadata({ ...explicit, invocation: "contextual" }), /duplicate policy/);
  assert.throws(() => decodeMetadata(withMetadata({ [fields.kind]: "agent" })), /unknown wycats.kind/);
}

async function verifyRoundTrip(baseline: CanonicalComposition, normalized: CanonicalComposition) {
  assert.deepEqual(meaning(normalized), meaning(baseline));
  for (const resource of baseline.resources) {
    const roundTrip = normalized.resources.find((entry) => entry.identity === resource.identity);
    assert(roundTrip);
    assert.equal(parseResourceFrontmatter(await readFile(roundTrip.sourcePath, "utf8")).body,
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
      "The experiment normalizes this tree and generates the existing target resource layouts.\n");
  }
  const normalized = await normalizeCandidate(candidate, join(directory, "normalized-source"));
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

Both candidates preserve the current slice's nine resource identities, kinds,
activation policies, composition edges, and body bytes after normalization.
Both produce equivalent resource projections: nine resources each for VS Code,
Claude Code, and Codex; seven for the existing Pi profile, which excludes the fixtures.

| Open a resource | Current source | Flat candidate | Grouped candidate |
| --- | --- | --- | --- |
| Recon | [Workflow](current-source/skills/recon/SKILL.md) | [Workflow](flat/source/skills/recon/SKILL.md) | [Workflow](grouped/source/skills/workflows/recon/SKILL.md) |
| Diagnostic questioning | [Stance](current-source/stances/diagnostic-questioning/SKILL.md) | [Stance](flat/source/skills/diagnostic-questioning/SKILL.md) | [Stance](grouped/source/skills/stances/diagnostic-questioning/SKILL.md) |
| Explicit entry | [Fixture](current-source/skills/reconstruction-fixture/SKILL.md) | [Fixture](flat/source/skills/reconstruction-fixture/SKILL.md) | [Fixture](grouped/source/skills/workflows/reconstruction-fixture/SKILL.md) |

The grouped candidate keeps the stance/workflow distinction visible in directories
and records it in metadata. The bridge reads metadata to determine semantic kind.
Its reader remains experimental and retains today's globally unique skill names.

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
