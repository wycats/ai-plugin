import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import matter from "gray-matter";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition } from "./resource-composition.ts";

const execFileAsync = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..");

void test("Pi projection exposes only Recon publicly and keeps canonical bodies privately navigable", async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "pi-projection-"));
  const out = join(temporaryRoot, "pi");
  try {
    await execFileAsync(process.execPath, [
      join(ROOT, "scripts", "build.ts"),
      "--config",
      join(ROOT, "config.pi.example.json"),
      "--output",
      out,
    ]);

    const manifest = JSON.parse(
      await readFile(join(out, "package.json"), "utf-8"),
    ) as {
      pi: { skills: string[]; subagents: { agents: string[] } };
    };
    assert.deepEqual(manifest.pi.skills, ["./skills/recon"]);
    assert.deepEqual(manifest.pi.subagents.agents, ["./agents"]);

    const generatedAgentText = await readFile(
      join(out, "agents", "wycats-recon.agent.md"),
      "utf-8",
    );
    const generatedAgent = matter(generatedAgentText);
    const canonicalAgent = matter(
      await readFile(join(ROOT, "agents", "recon.agent.md"), "utf-8"),
    );
    assert.equal(generatedAgent.content, canonicalAgent.content);
    assert.equal(generatedAgent.data.name, "wycats-recon");
    assert.equal(generatedAgent.data.model, "openai-codex/gpt-5.6-terra");
    assert.equal(generatedAgent.data.thinking, "high");
    assert.equal(generatedAgent.data.inheritProjectContext, true);
    assert.equal(generatedAgent.data.inheritGlobalContext, false);
    assert.equal(generatedAgent.data.inheritSkills, false);
    assert.equal(generatedAgent.data.allowNestedSubagents, false);
    assert.deepEqual(generatedAgent.data.skills, [
      "recon",
      "diagnostic-questioning",
      "interpretive-synthesis",
      "observational-grounding",
      "relational-continuity",
    ]);
    assert.deepEqual(generatedAgent.data.skillPath, ["../skills", "../stances"]);
    assert.deepEqual(generatedAgent.data.tools, [
      "read",
      "grep",
      "find",
      "ls",
      "bash",
    ]);
    assert.match(
      generatedAgentText,
      /tools:\n {2}- read\n {2}- grep\n {2}- find\n {2}- ls\n {2}- bash\n/,
    );
    assert.match(
      generatedAgentText,
      /skills:\n {2}- recon\n {2}- diagnostic-questioning\n {2}- interpretive-synthesis\n {2}- observational-grounding\n {2}- relational-continuity\n/,
    );
    assert.match(
      generatedAgentText,
      /skillPath:\n {2}- \.\.\/skills\n {2}- \.\.\/stances\n/,
    );
    assert.doesNotMatch(generatedAgentText, /(?:tools|skills|skillPath):\n {2}\[/);

    const generatedRecon = matter(
      await readFile(join(out, "skills", "recon", "SKILL.md"), "utf-8"),
    );
    const canonicalRecon = matter(
      await readFile(join(ROOT, "skills", "recon", "SKILL.md"), "utf-8"),
    );
    assert.equal(generatedRecon.content, canonicalRecon.content);

    const composition = await loadCanonicalComposition(
      out,
      await discoverResourceFiles(out),
    );
    assert.deepEqual(composition.diagnostics, []);
    assert.ok(composition.composition);

    const canonical = await loadCanonicalComposition(
      ROOT,
      await discoverResourceFiles(ROOT),
    );
    assert.deepEqual(canonical.diagnostics, []);
    assert.ok(canonical.composition);
    // Pi carries all stances privately, but only Recon's workflow and agent.
    const expectedReferences = canonical.composition.references.filter(
      ({ source }) => source.section === "stances" || source.name === "recon",
    );
    assert.equal(composition.composition.references.length, expectedReferences.length);

    const index = JSON.parse(
      await readFile(join(out, "composition-index.json"), "utf-8"),
    ) as {
      schemaVersion: number;
      edges: Array<Record<string, unknown>>;
    };
    assert.equal(index.schemaVersion, 2);
    assert.deepEqual(
      index.edges.map((edge) => [edge.canonicalSource, edge.canonicalTarget, edge.relation]),
      expectedReferences.map(({ source, target, relation }) => [source.pluginPath, target.pluginPath, relation]),
    );
    assert.deepEqual(
      index.edges.map((edge) => [edge.generatedSource, edge.generatedTarget, edge.relation]),
      composition.composition.references.map(({ source, target, relation }) => [source.pluginPath, target.pluginPath, relation]),
    );
    assert.equal(index.edges[0].canonicalSource, "./agents/recon.agent.md");
    assert.equal(index.edges[0].canonicalLine, 18);
    assert.equal(index.edges[0].generatedSource, "./agents/wycats-recon.agent.md");
    assert.equal("line" in index.edges[0], false);

    const capabilities = JSON.parse(
      await readFile(join(out, "projection-capabilities.json"), "utf-8"),
    ) as {
      selectedResourceCatalog: unknown[];
      omitted: string[];
      activation: { automaticRuntimeLoader: boolean };
      agentFrontmatter: { listFormat: string; verifiedParser: string };
      runtimePrerequisites: {
        pi: { inspectedVersion: string };
        piSubagents: { inspectedVersion: string; required: boolean };
      };
    };
    assert.equal(capabilities.selectedResourceCatalog.length, 5);
    assert.equal(capabilities.activation.automaticRuntimeLoader, false);
    assert.equal(capabilities.agentFrontmatter.listFormat, "YAML block list (- item)");
    assert.equal(
      capabilities.agentFrontmatter.verifiedParser,
      "pi-subagents 0.68.0 parseFrontmatterList",
    );
    assert.equal(capabilities.runtimePrerequisites.pi.inspectedVersion, "0.85.1");
    assert.equal(
      capabilities.runtimePrerequisites.piSubagents.inspectedVersion,
      "0.68.0",
    );
    assert.equal(capabilities.runtimePrerequisites.piSubagents.required, true);
    assert.ok(
      capabilities.omitted.includes(
        "nested delegation and canonical fan-out execution",
      ),
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
