import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { parseYamlMapping, parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { parseSkillActivation } from "./skill-activation.ts";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition } from "./resource-composition.ts";
import { createProjectionPlan } from "./projection-plan.ts";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..");
const STANCES = ["diagnostic-questioning", "interpretive-synthesis", "observational-grounding", "relational-continuity"];

async function put(root: string, path: string, content: string | Uint8Array) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

function skill(name: string, fields = "", body = "Body.\n"): string {
  return `---\nname: ${name}\ndescription: Description for ${name}\n${fields}---\n${body}`;
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "skill-activation-"));
  await put(root, "skills/recon/SKILL.md", skill("recon", "invocation: explicit\nmetadata:\n  nested: [one, two]\n",
    '\r\n# Body\r\n\r\nRead [stance](../../stances/diagnostic-questioning/SKILL.md "composition:load").\r\nNo final newline'));
  await put(root, "agents/recon.agent.md", "---\ndescription: Recon agent\n---\nAgent.\n");
  for (const name of STANCES) await put(root, `stances/${name}/SKILL.md`, skill(name, "user-invocable: false\n"));
  return root;
}

async function canonical(root: string) {
  const result = await loadCanonicalComposition(root, await discoverResourceFiles(root));
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.composition);
  return result.composition;
}

void test("activation defaults preserve contextual skills and reject ambiguous declarations", () => {
  assert.deepEqual(parseSkillActivation({}, "skills"), { userInvocable: true, invocation: "contextual" });
  assert.deepEqual(parseSkillActivation({ "user-invocable": false }, "stances"), { userInvocable: false, invocation: "contextual" });
  for (const data of [
    { "user-invocable": "false" }, { "user-invocable": null },
    { invocation: null }, { invocation: "automatic" },
    { "user-invocable": false, invocation: "explicit" },
    { "disable-model-invocation": false },
  ]) assert.throws(() => parseSkillActivation(data, "skills"));
  assert.throws(() => parseSkillActivation({}, "stances"), /stances must declare/);
  assert.throws(() => parseResourceFrontmatter(skill("duplicate", "invocation: explicit\ninvocation: contextual\n")), /unique/);
  assert.throws(() => parseResourceFrontmatter("---\n- not-a-mapping\n---\nBody"), /mapping/);
});

void test("composition constrains incoming skill edges without assigning policies to agents", async () => {
  const root = await fixture();
  try {
    const agent = '---\ndescription: Agent\n---\n[Recon](../skills/recon/SKILL.md "composition:load")';
    await put(root, "agents/recon.agent.md", agent);
    let result = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.match(result.diagnostics.map(d => d.message).join("\n"), /cannot target explicit-only skill/);
    await put(root, "agents/recon.agent.md", agent.replace("composition:load", "composition:reference"));
    await put(root, "skills/caller/SKILL.md", skill("caller", "", '[Agent](../../agents/recon.agent.md "composition:load")'));
    result = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.composition?.references.length, 3);
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("each target resolves native policy while keeping an explicit skill public", async () => {
  const root = await fixture();
  try {
    const composition = await canonical(root);
    for (const target of ["vscode", "claude-code", "codex", "pi"]) {
      const plan = createProjectionPlan(composition, target, join(root, "out", target));
      const recon = plan.resources.find(r => r.resource.identity === "skill:recon");
      assert.equal(recon?.exposure, "public");
      assert.ok(recon.skillMetadata);
      assert.equal("invocation" in recon.skillMetadata.frontmatter, false);
      assert.equal(recon.skillMetadata.frontmatter["user-invocable"], true);
      assert.deepEqual(recon.skillMetadata.frontmatter.metadata, { nested: ["one", "two"] });
      if (target === "codex") {
        assert.deepEqual(recon.skillMetadata.codexSidecar, {
          interface: { display_name: "recon", short_description: "Description for recon" },
          policy: { allow_implicit_invocation: false },
        });
      } else assert.equal(recon.skillMetadata.frontmatter["disable-model-invocation"], true);
      const stance = plan.resources.find(r => r.resource.section === "stances");
      assert.equal(stance?.skillMetadata?.frontmatter["user-invocable"], false);
      if (target === "codex") assert.deepEqual(stance.skillMetadata.codexSidecar?.policy, { allow_implicit_invocation: true });
      else assert.equal(stance.skillMetadata.frontmatter["disable-model-invocation"], false);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

async function prepareBuildFixture(root: string) {
  await cp(join(ROOT, "scripts"), join(root, "scripts"), { recursive: true });
  await symlink(join(ROOT, "node_modules"), join(root, "node_modules"), "junction");
  await put(root, "package.json", '{"type":"module"}');
  await put(root, "plugin.json", '{"name":"activation-fixture","version":"1.0.0","description":"Fixture"}');
  for (const target of ["vscode", "claude-code", "codex", "pi"]) {
    await put(root, `config.${target}.json`, JSON.stringify({ target, models: {}, toolGroups: {} }));
  }
}

function build(root: string, target: string) {
  return execFileAsync(process.execPath, [join(root, "scripts/build.ts"), "--config", join(root, `config.${target}.json`)]);
}

void test("built packages preserve body bytes, move stance assets, and expose supported discovery paths", async () => {
  const root = await fixture();
  try {
    await prepareBuildFixture(root);
    const sidecar = 'interface:\n  display_name: Reader\n  icon_small: ./assets/icon.svg\ndependencies:\n  tools: []\n';
    await put(root, "stances/diagnostic-questioning/agents/openai.yaml", sidecar);
    await put(root, "stances/diagnostic-questioning/assets/icon.svg", "<svg/>");
    await put(root, "stances/outer/SKILL.md", skill("outer", "user-invocable: false\n"));
    await put(root, "stances/outer/inner/SKILL.md", skill("inner", "user-invocable: false\n"));
    await put(root, "stances/outer/inner/assets/note.txt", "inner support");
    const original = parseResourceFrontmatter(await readFile(join(root, "skills/recon/SKILL.md"), "utf8"));
    for (const target of ["vscode", "claude-code", "codex", "pi"]) {
      await build(root, target);
      const out = join(root, "out", target === "vscode" ? "wycats" : target);
      const generated = parseResourceFrontmatter(await readFile(join(out, "skills/recon/SKILL.md"), "utf8"));
      const relocated = target === "codex" || target === "claude-code";
      assert.equal(generated.body, relocated
        ? original.body.replace("../../stances/diagnostic-questioning/SKILL.md", "../diagnostic-questioning/SKILL.md")
        : original.body);
      assert.deepEqual(generated.data.metadata, original.data.metadata);
      const stanceDir = join(out, relocated ? "skills" : "stances", "diagnostic-questioning");
      assert.equal(await readFile(join(stanceDir, "assets/icon.svg"), "utf8"), "<svg/>");
      if (relocated) {
        await assert.rejects(readFile(join(out, "skills/outer/inner/SKILL.md")), { code: "ENOENT" });
        assert.equal(await readFile(join(out, "skills/inner/assets/note.txt"), "utf8"), "inner support");
        const inner = parseResourceFrontmatter(await readFile(join(out, "skills/inner/SKILL.md"), "utf8"));
        assert.equal(inner.data["user-invocable"], false);
      }
      if (target === "codex") {
        const metadata = parseYamlMapping(await readFile(join(stanceDir, "agents/openai.yaml"), "utf8"));
        assert.deepEqual(metadata.interface, {
          display_name: "Reader", icon_small: "./assets/icon.svg",
          short_description: "Description for diagnostic-questioning",
        });
        assert.deepEqual(metadata.dependencies, { tools: [] });
        assert.deepEqual(metadata.policy, { allow_implicit_invocation: true });
        const explicit = parseYamlMapping(await readFile(join(out, "skills/recon/agents/openai.yaml"), "utf8"));
        assert.deepEqual(explicit.policy, { allow_implicit_invocation: false });
      } else assert.equal(generated.data["disable-model-invocation"], true);
      if (target === "vscode") {
        const manifest = JSON.parse(await readFile(join(out, "plugin.json"), "utf8")) as { skills: string[] };
        assert.deepEqual(manifest.skills, ["./skills/", "./stances/"]);
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

void test("invalid policy, sidecars, and target layouts fail before replacing existing output", async () => {
  const root = await fixture();
  try {
    await prepareBuildFixture(root);
    const sentinel = join(root, "out/codex/sentinel");
    await put(root, "out/codex/sentinel", "keep");
    for (const sidecar of [
      "policy: false", "interface: []", "interface:\n  display_name: ''",
      "policy:\n  allow_implicit_invocation: false", "interface: [",
      new Uint8Array([0xff]),
    ]) {
      await put(root, "skills/recon/agents/openai.yaml", sidecar);
      await assert.rejects(build(root, "codex"), /openai.yaml/);
      assert.equal(await readFile(sentinel, "utf8"), "keep");
    }
    await rm(join(root, "skills/recon/agents/openai.yaml"));
    for (const field of ['user-invocable: "false"\n', 'invocation: explicit\nuser-invocable: false\n', 'invocation: null\n']) {
      await put(root, "skills/recon/SKILL.md", skill("recon", field));
      await assert.rejects(build(root, "codex"), /recon\/SKILL.md|recon\\SKILL.md/);
      await assert.rejects(execFileAsync(process.execPath, [join(root, "scripts/validate.ts")]));
      assert.equal(await readFile(sentinel, "utf8"), "keep");
    }
    await put(root, "skills/recon/SKILL.md", skill("recon"));
    await put(root, "skills/group/nested/SKILL.md", skill("nested"));
    await assert.rejects(build(root, "codex"), /immediately under skills/);
    assert.equal(await readFile(sentinel, "utf8"), "keep");
  } finally { await rm(root, { recursive: true, force: true }); }
});
