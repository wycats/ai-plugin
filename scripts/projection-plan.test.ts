import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import test from "node:test";
import { parseResourceFrontmatter, serializeResourceFrontmatter } from "./resource-frontmatter.ts";
import { createProjectionPlan, parseProjectionResourceMap, projectionResourceMap, resolveProjectedResource } from "./projection-plan.ts";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition, projectCompositionLinks } from "./resource-composition.ts";
import { vscodePluginManifest } from "./vscode-plugin.ts";

async function fixture(body = "Recon.") {
  const root = await mkdtemp(join(tmpdir(), "projection-plan-"));
  const files: Record<string, string> = {
    "agents/recon.agent.md": "---\ndescription: Recon agent\n---\nRecon.",
    "agents/other.agent.md": "---\ndescription: Another agent\n---\nOther.",
    "instructions/style.instructions.md": "---\ndescription: Style\napplyTo: '**'\n---\nStyle.",
  };
  for (const name of ["recon", "other"]) files[`skills/${name}/SKILL.md`] = `---\nname: ${name}\ndescription: Workflow\n---\n${name === "recon" ? body : "Other."}`;
  for (const name of ["diagnostic-questioning", "interpretive-synthesis", "observational-grounding", "relational-continuity", "unselected"]) {
    files[`stances/${name}/SKILL.md`] = `---\nname: ${name}\ndescription: Stance\nuser-invocable: false\n---\nStance.`;
  }
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  const result = await loadCanonicalComposition(root, await discoverResourceFiles(root));
  assert.ok(result.composition);
  return { root, composition: result.composition };
}

void test("plans preserve distinct discovery, reference, and private resource surfaces across targets", async () => {
  const { root, composition } = await fixture();
  try {
    const out = join(root, "output");
    const vscode = createProjectionPlan(composition, "vscode", out);
    const claude = createProjectionPlan(composition, "claude-code", out);
    const codex = createProjectionPlan(composition, "codex", out);
    const pi = createProjectionPlan(composition, "pi", out);
    assert.equal(vscode.resources.some(({ resource }) => resource.kind === "instruction"), true);
    assert.equal(claude.resources.some(({ resource }) => resource.kind === "instruction"), false);
    assert.equal(codex.includesHooks, false);
    assert.ok(codex.resources.filter(({ resource }) => resource.kind === "agent").every(({ exposure }) => exposure === "reference"));
    assert.ok(claude.resources.filter(({ resource }) => resource.kind === "stance").every(({ pluginPath, exposure }) => pluginPath.startsWith("./skills/") && exposure === "private"));
    assert.equal(pi.resources.filter(({ resource }) => resource.kind === "workflow").length, 1);
    assert.equal(pi.resources.filter(({ resource }) => resource.kind === "stance").length, 5);
    assert.equal(pi.profileResources.length, 5);
    assert.ok(pi.resources.some(({ resource }) => resource.name === "unselected"));
    assert.equal(pi.profileResources.some(({ resource }) => resource.name === "unselected"), false);
    assert.equal(resolveProjectedResource(out, projectionResourceMap(pi), "agents/recon.agent.md"), join(out, "agents", "wycats-recon.agent.md"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("an incomplete bounded projection fails before touching existing output", async () => {
  const { root, composition } = await fixture('[Other](../other/SKILL.md "composition:load")');
  try {
    const out = join(root, "output");
    await mkdir(out);
    await writeFile(join(out, "sentinel"), "keep");
    assert.throws(() => createProjectionPlan(composition, "pi", out), /not projected for target 'pi'/);
    assert.equal(await readFile(join(out, "sentinel"), "utf8"), "keep");
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("artifact addresses require the expected target and an unambiguous contained destination", () => {
  const map = parseProjectionResourceMap({ schemaVersion: 1, target: "claude-code", resources: [
    { canonicalSource: "./agents/review.agent.md", generatedSource: "./agents/custom.agent.md", identity: "agent:review", exposure: "public" },
  ] }, "claude-code");
  const out = join(tmpdir(), "artifact");
  assert.equal(resolveProjectedResource(out, map, "agents/review.agent.md"), join(out, "agents", "custom.agent.md"));
  assert.throws(() => parseProjectionResourceMap(map, "codex"), /Invalid projection/);
  assert.throws(() => resolveProjectedResource(out, map, "skills/missing/SKILL.md"), /Expected one/);
  assert.throws(() => resolveProjectedResource(out, { ...map, resources: [...map.resources, ...map.resources] }, "agents/review.agent.md"), /Expected one/);
  for (const generatedSource of ["./../outside.md", "./agents/../../outside.md", "./agents\\review.agent.md", "./agents/../review.agent.md"]) {
    assert.throws(() => resolveProjectedResource(out, { ...map, resources: [{ ...map.resources[0], generatedSource }] }, "agents/review.agent.md"), /Invalid generated/);
  }
});

void test("Pi requires every declared profile resource even without a composition edge", async () => {
  for (const path of ["agents/recon.agent.md", "stances/diagnostic-questioning/SKILL.md"]) {
    const { root } = await fixture();
    try {
      await rm(join(root, path));
      const result = await loadCanonicalComposition(root, await discoverResourceFiles(root));
      const composition = result.composition;
      assert.ok(composition);
      assert.throws(() => createProjectionPlan(composition, "pi", join(root, "output")), /Pi profile requires canonical/);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});

void test("grouped authoring directly yields the same semantic graph and complete target resources", async () => {
  const { root, composition: legacy } = await fixture('[Stance](../../stances/diagnostic-questioning/SKILL.md "composition:load")\r\nKeep [ordinary](./notes.md).\r\nNo final newline');
  try {
    await mkdir(join(root, "skills/other/assets"), { recursive: true });
    await writeFile(join(root, "skills/other/assets/note.txt"), "workflow support");
    await mkdir(join(root, "stances/unselected/assets"), { recursive: true });
    await writeFile(join(root, "stances/unselected/assets/note.txt"), "stance support");
    const destinations = new Map(legacy.resources.map((resource) => [resource.sourcePath,
      resource.activation ? join(root, "skills", resource.kind === "stance" ? "stances" : "workflows", resource.name, "SKILL.md") : resource.sourcePath]));
    for (const resource of legacy.resources.filter((entry) => entry.activation)) {
      const destination = destinations.get(resource.sourcePath);
      assert.ok(destination);
      await mkdir(dirname(destination), { recursive: true });
      await cp(dirname(resource.sourcePath), dirname(destination), { recursive: true });
      const projected = projectCompositionLinks(await readFile(resource.sourcePath, "utf8"), resource.sourcePath,
        destination, legacy, destinations);
      const { body } = parseResourceFrontmatter(projected);
      const frontmatter = { ...resource.frontmatter };
      delete frontmatter["user-invocable"];
      delete frontmatter.invocation;
      frontmatter.metadata = {
        "wycats.kind": resource.kind,
        "wycats.user-invocable": String(resource.activation?.userInvocable),
        "wycats.invocation": resource.activation?.invocation,
      };
      await writeFile(destination, serializeResourceFrontmatter(frontmatter, body));
    }
    for (const resource of legacy.resources.filter((entry) => entry.activation)) {
      await rm(dirname(resource.sourcePath), { recursive: true });
    }
    const loaded = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.deepEqual(loaded.diagnostics, []);
    const grouped = loaded.composition;
    assert.ok(grouped);
    const meanings = (resources: typeof grouped.resources) => resources.map(({ identity, kind, activation }) =>
      ({ identity, kind, activation })).sort((a, b) => a.identity.localeCompare(b.identity));
    assert.deepEqual(meanings(grouped.resources), meanings(legacy.resources));
    assert.ok(grouped.resources.filter((resource) => resource.kind === "stance").every((resource) => resource.section === "skills"));
    const edges = (references: typeof grouped.references) => references.map(({ source, target, relation }) =>
      [source.identity, target.identity, relation]);
    assert.deepEqual(edges(grouped.references), edges(legacy.references));
    for (const target of ["vscode", "claude-code", "codex", "pi"]) {
      const out = join(root, "out", target);
      const before = createProjectionPlan(legacy, target, out);
      const after = createProjectionPlan(grouped, target, out);
      const signatures = (plan: typeof after) => plan.resources.map(({ resource, pluginPath, exposure, skillMetadata }) =>
        ({ identity: resource.identity, pluginPath, exposure, skillMetadata })).sort((a, b) => a.identity.localeCompare(b.identity));
      assert.deepEqual(signatures(after), signatures(before));
      assert.deepEqual(after.profileResources.map(({ resource }) => resource.identity), before.profileResources.map(({ resource }) => resource.identity));
      for (const entry of after.resources.filter(({ resource }) => resource.activation)) {
        assert.match(entry.pluginPath, target === "pi" && entry.resource.kind === "stance"
          ? /^\.\/stances\/[^/]+\/SKILL\.md$/ : /^\.\/skills\/[^/]+\/SKILL\.md$/);
        const copy = after.supportCopies.find((copy) => copy.destination === dirname(entry.outputPath));
        assert.equal(copy?.source, dirname(entry.resource.sourcePath));
      }
      const recon = after.resources.find(({ resource }) => resource.identity === "skill:recon");
      assert.ok(recon);
      const projected = projectCompositionLinks(await readFile(recon.resource.sourcePath, "utf8"),
        recon.resource.sourcePath, recon.outputPath, grouped, after.outputBySourcePath);
      assert.equal(parseResourceFrontmatter(projected).body, target === "pi"
        ? '[Stance](../../stances/diagnostic-questioning/SKILL.md "composition:load")\r\nKeep [ordinary](./notes.md).\r\nNo final newline'
        : '[Stance](../diagnostic-questioning/SKILL.md "composition:load")\r\nKeep [ordinary](./notes.md).\r\nNo final newline');
      if (target === "vscode") {
        assert.equal(after.resources.find(({ resource }) => resource.identity === "agent:recon")?.pluginPath, "./com.github.copilot/agents/recon.agent.md");
        assert.equal(after.resources.find(({ resource }) => resource.kind === "instruction")?.pluginPath, "./com.github.copilot/rules/style.instructions.md");
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("support copies exclude nested discovered containers for every host", async () => {
  const { root } = await fixture();
  try {
    const outer = join(root, "skills/workflows/outer");
    const inner = join(outer, "inner");
    for (const [directory, name] of [[outer, "outer"], [inner, "inner"]]) {
      await mkdir(join(directory, "assets"), { recursive: true });
      await writeFile(join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: Container\nmetadata:\n  wycats.kind: workflow\n  wycats.user-invocable: "true"\n  wycats.invocation: contextual\n---\nBody.`);
      await writeFile(join(directory, "assets/note.txt"), `${name} support`);
    }
    const loaded = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.deepEqual(loaded.diagnostics, []);
    assert.ok(loaded.composition);
    for (const target of ["vscode", "claude-code", "codex"]) {
      const plan = createProjectionPlan(loaded.composition, target, join(root, "out", target));
      const copies = plan.supportCopies.filter((copy) => copy.source === outer || copy.source === inner);
      assert.equal(copies.length, 2);
      for (const copy of copies) await cp(copy.source, copy.destination, { recursive: true,
        filter: (source) => !copy.excludedDirectories?.some((directory) => source === directory || source.startsWith(`${directory}${sep}`)),
      });
      assert.equal(await readFile(join(root, "out", target, "skills/outer/assets/note.txt"), "utf8"), "outer support");
      assert.equal(await readFile(join(root, "out", target, "skills/inner/assets/note.txt"), "utf8"), "inner support");
      await assert.rejects(readFile(join(root, "out", target, "skills/outer/inner/SKILL.md")), { code: "ENOENT" });
      assert.ok(plan.supportCopies.every((copy) => copy.source !== join(root, "skills")));
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("native resource discovery preserves nested paths and keeps support Markdown outside the rules catalog", async () => {
  const { root } = await fixture();
  try {
    await mkdir(join(root, "instructions/team"), { recursive: true });
    await mkdir(join(root, "agents/team"), { recursive: true });
    await writeFile(join(root, "instructions/team/extra.instructions.md"), '---\ndescription: Team guidance\napplyTo: "**"\n---\nRead [support](./note.md).\n');
    await writeFile(join(root, "instructions/team/note.md"), "Team-local support");
    await writeFile(join(root, "instructions/note.md"), "Shared support");
    await writeFile(join(root, "agents/team/helper.agent.md"), '---\nname: Team helper\ndescription: Helper\n---\nHelp.');
    const loaded = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.deepEqual(loaded.diagnostics, []);
    assert.ok(loaded.composition);
    const out = join(root, "output");
    await mkdir(out);
    const plan = createProjectionPlan(loaded.composition, "vscode", out);
    const instruction = plan.resources.find(({ resource }) => resource.pluginPath === "./instructions/team/extra.instructions.md");
    const agent = plan.resources.find(({ resource }) => resource.pluginPath === "./agents/team/helper.agent.md");
    assert.ok(instruction && agent);
    assert.equal(instruction.pluginPath, "./com.github.copilot/rules/team/extra.instructions.md");
    assert.equal(agent.pluginPath, "./com.github.copilot/agents/team/helper.agent.md");
    for (const copy of plan.supportCopies) await cp(copy.source, copy.destination, { recursive: true });
    await mkdir(dirname(agent.outputPath), { recursive: true });
    await writeFile(agent.outputPath, "Helper.");
    const projected = projectCompositionLinks(await readFile(instruction.resource.sourcePath, "utf8"),
      instruction.resource.sourcePath, instruction.outputPath, loaded.composition, plan.outputBySourcePath);
    await writeFile(instruction.outputPath, projected);
    const components = {
      agentPaths: plan.resources.filter(({ resource }) => resource.kind === "agent").map(({ pluginPath }) => pluginPath),
      instructionPaths: plan.resources.filter(({ resource }) => resource.kind === "instruction").map(({ pluginPath }) => pluginPath),
    };
    const manifest = vscodePluginManifest(
      { name: "native-path-fixture", version: "1.0.0", description: "Fixture" }, components);
    assert.ok(manifest.extensions);
    const discovery = manifest.extensions["com.github.copilot"];
    assert.ok(discovery.agents.paths.includes("./agents/team/helper.agent.md"));
    assert.ok(discovery.rules.paths.includes("./rules/team/extra.instructions.md"));
    assert.equal(discovery.rules.exclusive, true);
    assert.equal(discovery.rules.paths.some((path) => path.endsWith("note.md")), false);
    assert.equal(await readFile(join(dirname(instruction.outputPath), "note.md"), "utf8"), "Team-local support");
    await assert.rejects(readFile(join(out, "com.github.copilot/rules/extra.instructions.md")), { code: "ENOENT" });
  } finally { await rm(root, { recursive: true, force: true }); }
});
