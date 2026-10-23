import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { discoverResourceFiles } from "./resource-discovery.ts";
import { loadCanonicalComposition } from "./resource-composition.ts";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { canonicalResourceDescriptor, validateCanonicalResource, validateProjectedResource } from "./eval/resource.ts";
import { ClaudeCodeCliAdapter, claudeCodeInvocation } from "./eval/adapters/claude-code.ts";

const exec = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..");

void test("Claude emission and evaluation share canonical identities for nested agents", async () => {
  const root = await mkdtemp(join(tmpdir(), "agent-identity-"));
  const agents = [
    { path: "agents/team/unnamed.agent.md", name: "unnamed", fields: "" },
    { path: "agents/team/reviewer.agent.md", name: "careful-review", fields: "name: careful-review\n" },
    { path: "agents/helper.agent.md", name: "helper", fields: "" },
    { path: "agents/shared-first.agent.md", name: "shared-first", fields: "", description: "Shared review fixture" },
    { path: "agents/team/shared-second.agent.md", name: "shared-second", fields: "", description: "Shared review fixture" },
  ];
  try {
    await cp(join(ROOT, "scripts"), join(root, "scripts"), { recursive: true });
    await symlink(join(ROOT, "node_modules"), join(root, "node_modules"), "junction");
    await writeFile(join(root, "package.json"), '{"type":"module"}\n');
    await writeFile(join(root, "plugin.json"), '{"name":"identity-fixture","version":"1.0.0","description":"Fixture"}\n');
    await writeFile(join(root, "config.json"), JSON.stringify({ target: "claude-code", models: {}, toolGroups: {} }));
    for (const agent of agents) {
      const sourcePath = join(root, agent.path);
      await mkdir(dirname(sourcePath), { recursive: true });
      await writeFile(sourcePath, `---\n${agent.fields}description: ${agent.description ?? `Review fixture ${agent.name}`}\n---\n\nReview the assigned material.\n`);
    }

    const discovered = await discoverResourceFiles(root);
    assert.equal(discovered.agents.length, agents.length);
    const canonical = await loadCanonicalComposition(root, discovered);
    assert.deepEqual(canonical.diagnostics, []);
    assert.ok(canonical.composition);

    await exec(process.execPath, [join(root, "scripts/build.ts")], { cwd: root });
    const adapter = new ClaudeCodeCliAdapter(root);
    for (const agent of agents) {
      const sourcePath = join(root, agent.path);
      const source = await readFile(sourcePath, "utf8");
      assert.equal(canonical.composition.bySourcePath.get(sourcePath)?.name, agent.name);
      assert.equal(canonicalResourceDescriptor(agent.path, source).name, agent.name);
      const resource = { identity: `wycats-plugin:agents/${agent.name}`, name: agent.name, path: agent.path };
      validateCanonicalResource(resource, source);

      const generatedPath = adapter.projectedResourcePath(resource);
      assert.equal(generatedPath, join(root, "out/claude-code", agent.path));
      const generated = await readFile(generatedPath, "utf8");
      validateProjectedResource(resource, generated);
      const projectedName = parseResourceFrontmatter(generated).data.name;
      assert.equal(projectedName, agent.name);
      assert.equal(parseResourceFrontmatter(generated).body, parseResourceFrontmatter(source).body);
      const invocation = claudeCodeInvocation(resource, "identity-fixture", "Review.", "Projected.");
      assert.deepEqual(invocation.resourceArguments, ["--agent", `identity-fixture:${projectedName}`]);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
