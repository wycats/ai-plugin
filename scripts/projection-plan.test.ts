import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { createProjectionPlan, parseProjectionResourceMap, projectionResourceMap, resolveProjectedResource } from "./projection-plan.ts";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition } from "./resource-composition.ts";

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
    const vscode = await createProjectionPlan(composition, "vscode", out);
    const claude = await createProjectionPlan(composition, "claude-code", out);
    const codex = await createProjectionPlan(composition, "codex", out);
    const pi = await createProjectionPlan(composition, "pi", out);
    assert.equal(vscode.resources.some(({ resource }) => resource.section === "instructions"), true);
    assert.equal(claude.resources.some(({ resource }) => resource.section === "instructions"), false);
    assert.equal(codex.includesHooks, false);
    assert.ok(codex.resources.filter(({ resource }) => resource.section === "agents").every(({ exposure }) => exposure === "reference"));
    assert.ok(claude.resources.filter(({ resource }) => resource.section === "stances").every(({ pluginPath, exposure }) => pluginPath.startsWith("./skills/") && exposure === "private"));
    assert.equal(pi.resources.filter(({ resource }) => resource.section === "skills").length, 1);
    assert.equal(pi.resources.filter(({ resource }) => resource.section === "stances").length, 5);
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
    await assert.rejects(createProjectionPlan(composition, "pi", out), /not projected for target 'pi'/);
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
      assert.ok(result.composition);
      await assert.rejects(createProjectionPlan(result.composition, "pi", join(root, "output")), /Pi profile requires canonical/);
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
