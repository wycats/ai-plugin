import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition, projectCompositionLinks } from "./resource-composition.ts";
import { activityContext, contextDeliveryIndex } from "./context-delivery.ts";
import { createProjectionPlan, type ProjectionPlan } from "./projection-plan.ts";
import { copilotAgentContext } from "./copilot-context.ts";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";

function skill(name: string, body: string, extra = "") {
  return `---\nname: ${name}\ndescription: Investigate ${name}\n${extra}---\n\n${body}\n`;
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "context-delivery-"));
  const files = {
    "agents/inquirer.agent.md": '---\ndescription: Investigate the assigned question\n---\n\nFollow [method](../skills/main/SKILL.md "composition:load context=activity").',
    "skills/main/SKILL.md": skill("main", 'MAIN_BODY\n[Frame](../../stances/frame/SKILL.md "composition:load context=activity").\n[Judgment](../../stances/judgment/SKILL.md "composition:load") when needed.\n[Other process](../optional/SKILL.md "composition:reference").'),
    "stances/frame/SKILL.md": skill("frame", 'FRAME_BODY\n[Method](../../skills/main/SKILL.md "composition:load context=activity").\n[Judgment](../judgment/SKILL.md "composition:load").', "user-invocable: false\n"),
    "stances/judgment/SKILL.md": skill("judgment", 'LATER_BODY\n[Support](../support/SKILL.md "composition:load context=activity").', "user-invocable: false\n"),
    "stances/support/SKILL.md": skill("support", "SUPPORT_BODY", "user-invocable: false\n"),
    "skills/optional/SKILL.md": skill("optional", "OPTIONAL_BODY", "invocation: explicit\n"),
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), content);
  }
  return { root, dispose: () => rm(root, { recursive: true, force: true }) };
}
// Discovery is async. Keep fixtures and their source reads on the same path as real builds.
async function load(root: string) {
  return loadCanonicalComposition(root, await discoverResourceFiles(root));
}

async function materialize(composition: NonNullable<Awaited<ReturnType<typeof load>>["composition"]>, plan: ProjectionPlan) {
  for (const item of plan.resources) {
    await mkdir(dirname(item.outputPath), { recursive: true });
    await writeFile(item.outputPath, projectCompositionLinks(await readFile(item.resource.sourcePath, "utf8"),
      item.resource.sourcePath, item.outputPath, composition, plan.outputBySourcePath));
  }
}

void test("activity closure deduplicates cycles and leaves later judgments and references available", async () => {
  const { root, dispose } = await fixture();
  try {
    const result = await load(root); assert.deepEqual(result.diagnostics, []); assert.ok(result.composition);
    const composition = result.composition;
    const source = composition.resources.find(r => r.identity === "agent:inquirer"); assert.ok(source);
    const context = activityContext(composition, source);
    assert.deepEqual(context.resources.map(r => r.name), ["main", "frame"]);
    assert.equal(context.edges.length, 3); // Retains the back edge to main.
    const later = composition.resources.find(r => r.name === "judgment"); assert.ok(later);
    assert.deepEqual(activityContext(composition, later).resources.map(r => r.name), ["support"]);
    const plan = createProjectionPlan(composition, "vscode", join(root, "output"));
    const index = contextDeliveryIndex(composition, plan);
    assert.equal(index.status, "intent-only");
    assert.deepEqual(index.sources.find(s => s.source === source.identity)?.activity.map(r => r.identity), ["skill:main", "skill:frame"]);
    const reference = composition.references.find(r => r.relation === "reference"); assert.ok(reference);
    assert.equal("context" in reference, false);
    assert.deepEqual(composition.references.filter(r => r.relation === "load").map(r => r.context), ["activity", "activity", "passage", "activity", "passage", "activity"]);
    assert.throws(() => activityContext(composition, { ...source }), /does not belong/);
  } finally { await dispose(); }
});

void test("an activity encounter delivers a shared target once and preserves its later encounter", async () => {
  const { root, dispose } = await fixture();
  try {
    const sourcePath = join(root, "skills/main/SKILL.md");
    const original = await readFile(sourcePath, "utf8");
    await writeFile(sourcePath, original + '\n[Prepare judgment](../../stances/judgment/SKILL.md "composition:load context=activity").\n');
    const { composition } = await load(root); assert.ok(composition);
    const agent = composition.resources.find(r => r.identity === "agent:inquirer"); assert.ok(agent);
    const context = activityContext(composition, agent);
    assert.deepEqual(context.resources.map(r => r.name), ["main", "frame", "judgment", "support"]);
    assert.equal(context.resources.filter(r => r.name === "judgment").length, 1);
    assert.deepEqual(composition.references.filter(r => r.source.name === "main" && r.target.name === "judgment")
      .map(r => r.context), ["passage", "activity"]);
    assert.equal(context.edges.filter(e => e.target.name === "judgment").length, 1);
  } finally { await dispose(); }
});

void test("qualifiers reject ambiguous meanings and preserve explicit selection boundaries", async () => {
  for (const [title, target, expected] of [
    ["composition:load context=passage", "../skills/main/SKILL.md", /unsupported composition/],
    ["composition:load context=activity context=activity", "../skills/main/SKILL.md", /unsupported composition/],
    ["composition:reference context=activity", "../skills/main/SKILL.md", /unsupported composition/],
    ["composition:load context=activity", "./inquirer.agent.md", /requires a skill or stance/],
    ["composition:load context=activity", "../skills/optional/SKILL.md", /explicit-only/],
  ] as const) {
    const { root, dispose } = await fixture();
    try {
      await writeFile(join(root, "agents/inquirer.agent.md"), `---\ndescription: Fixture\n---\n[Target](${target} "${title}")`);
      const result = await load(root);
      assert.equal(result.composition, undefined);
      assert.match(result.diagnostics.map(d => d.message).join("\n"), expected);
      assert.equal(result.diagnostics[0].line, 4);
    } finally { await dispose(); }
  }
});

void test("qualified link projection preserves authored prose and the context marker", async () => {
  const { root, dispose } = await fixture();
  try {
    const { composition } = await load(root); assert.ok(composition);
    const plan = createProjectionPlan(composition, "vscode", join(root, "output"));
    const source = plan.resources.find(r => r.resource.name === "main"); assert.ok(source);
    const original = await readFile(source.resource.sourcePath, "utf8");
    assert.equal(projectCompositionLinks(original, source.resource.sourcePath, source.outputPath, composition, plan.outputBySourcePath),
      original.replaceAll("../../stances/", "../"));
  } finally { await dispose(); }
});

void test("SDK projection separates native preload, callable later skills and consultable references", async () => {
  const { root, dispose } = await fixture();
  try {
    const { composition } = await load(root); assert.ok(composition);
    const plan = createProjectionPlan(composition, "vscode", join(root, "output"));
    await assert.rejects(copilotAgentContext(composition, plan, "agent:inquirer"), /readable built resource/);
    await materialize(composition, plan);
    const sdk = await copilotAgentContext(composition, plan, "agent:inquirer");
    assert.deepEqual(sdk.agent.skills, ["main", "frame"]);
    assert.deepEqual(sdk.skillProvider.listSkills().map(s => s.name), ["main", "frame", "judgment", "support"]);
    assert.equal(sdk.skillProvider.readSkill("optional"), undefined);
    const optional = plan.resources.find(r => r.resource.name === "optional"); assert.ok(optional);
    await rm(optional.outputPath);
    await assert.rejects(copilotAgentContext(composition, plan, "agent:inquirer"), /readable built resource 'skill:optional'/);
    await materialize(composition, plan);
    const main = sdk.skillProvider.readSkill("main"); assert.ok(main);
    assert.match(main, /skill name judgment/);
    assert.match(main, /Reference target .*optional/);
    assert.ok(!main.includes("LATER_BODY"));
    assert.ok(!main.includes("OPTIONAL_BODY"));
    const later = sdk.skillProvider.readSkill("judgment"); assert.ok(later);
    assert.match(later, /Activity context: support/);
    assert.match(later, /LATER_BODY/);
    assert.ok(!later.includes("SUPPORT_BODY")); // Entry read fallback, not transitive inlining.
    assert.equal(parseResourceFrontmatter(later).data["disable-model-invocation"], false);
    assert.ok(parseResourceFrontmatter(main).body.endsWith(parseResourceFrontmatter(
      projectCompositionLinks(await readFile(join(root, "skills/main/SKILL.md"), "utf8"), join(root, "skills/main/SKILL.md"),
        join(root, "output/skills/main/SKILL.md"), composition, plan.outputBySourcePath)).body));
  } finally { await dispose(); }
});
