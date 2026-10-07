import assert from "node:assert/strict";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gitOutput, publishGeneratedOutput } from "./publish-generated.ts";
import { publishClaudeCodeOutput } from "./publish-cc.ts";
import { publishCodexOutput } from "./publish-codex.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

for (const existing of [false, true]) {
  void test(`publication refuses a concurrent ${existing ? "replacement" : "creation"} and removes its own stage`, async () => {
    const root = await mkdtemp(join(tmpdir(), "publication-race-"));
    const remote = join(root, "remote.git");
    let rejectedStage = "";
    let winner = "";
    try {
      gitOutput(root, ["init", "--bare", remote]);
      if (existing) await publishGeneratedOutput({ remote, branch: "generated", message: "Initial", prepare: async (stage) => { await writeFile(join(stage, "content"), "Initial"); } });
      await assert.rejects(publishGeneratedOutput({
        remote, branch: "generated", message: "Stale publisher",
        prepare: async (stage) => {
          rejectedStage = stage;
          await writeFile(join(stage, "content"), "Stale");
          winner = await publishGeneratedOutput({ remote, branch: "generated", message: "Concurrent publisher", prepare: async (concurrent) => { await writeFile(join(concurrent, "content"), "Winner"); } });
        },
      }), /stale info/);
      assert.equal(gitOutput(root, ["--git-dir", remote, "rev-parse", "refs/heads/generated"]), winner);
      assert.equal(gitOutput(root, ["--git-dir", remote, "show", `${winner}:content`]), "Winner");
      await assert.rejects(access(rejectedStage), { code: "ENOENT" });
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}

void test("failed preparation leaves the publication ref untouched and cleans up staging", async () => {
  const root = await mkdtemp(join(tmpdir(), "publication-failure-"));
  const remote = join(root, "remote.git");
  let failedStage = "";
  try {
    gitOutput(root, ["init", "--bare", remote]);
    await assert.rejects(publishGeneratedOutput({ remote, branch: "generated", message: "Invalid artifact", prepare: async (stage) => {
      failedStage = stage;
      await writeFile(join(stage, "partial"), "Partial");
      throw new Error("Invalid package");
    } }), /Invalid package/);
    assert.equal(gitOutput(root, ["ls-remote", "--heads", remote]), "");
    await assert.rejects(access(failedStage), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const target of ["claude-code", "codex"] as const) {
  void test(`${target} publication preserves its marketplace layout and replaces only its generated ref`, async () => {
    const root = await mkdtemp(join(tmpdir(), "host-publication-"));
    const built = join(root, "built");
    const remote = join(root, "remote.git");
    try {
      gitOutput(root, ["init", "--bare", remote]);
      execFileSync(process.execPath, ["scripts/build.ts", "--config", `config.${target}.example.json`, "--output", built], { cwd: ROOT, stdio: "pipe" });
      const output = target === "codex" ? join(root, "marketplace") : built;
      if (target === "codex") {
        await cp(built, join(output, "plugin"), { recursive: true });
        await mkdir(join(output, ".agents", "plugins"), { recursive: true });
        await writeFile(join(output, ".agents", "plugins", "marketplace.json"), JSON.stringify({ name: "wycats-ai-plugin", plugins: [{ name: "wycats-ai-plugin", source: { source: "local", path: "./plugin" } }] }));
      }
      const publish = target === "codex" ? publishCodexOutput : publishClaudeCodeOutput;
      const branch = target === "codex" ? "codex-plugin" : "cc-plugin";
      const first = await publish(output, remote);
      gitOutput(root, ["--git-dir", remote, "update-ref", "refs/heads/main", first]);
      const manifestPath = target === "codex" ? "plugin/.codex-plugin/plugin.json" : "plugin/.claude-plugin/plugin.json";
      const originalManifest = await readFile(join(built, target === "codex" ? ".codex-plugin" : ".claude-plugin", "plugin.json"), "utf8");
      assert.equal(gitOutput(root, ["--git-dir", remote, "show", `${first}:${manifestPath}`]), originalManifest.trim());
      const marketplacePath = target === "codex" ? ".agents/plugins/marketplace.json" : ".claude-plugin/marketplace.json";
      const marketplace = JSON.parse(gitOutput(root, ["--git-dir", remote, "show", `${first}:${marketplacePath}`])) as { plugins: Array<{ source: unknown }> };
      assert.deepEqual(marketplace.plugins[0].source, target === "codex" ? { source: "local", path: "./plugin" } : "./plugin");
      await writeFile(join(output, "revision.txt"), "Updated");
      const second = await publish(output, remote);
      assert.notEqual(first, second);
      assert.equal(gitOutput(root, ["--git-dir", remote, "rev-parse", "refs/heads/main"]), first);
      assert.equal(gitOutput(root, ["--git-dir", remote, "rev-parse", `refs/heads/${branch}`]), second);
      assert.equal(gitOutput(root, ["--git-dir", remote, "rev-list", "--count", second]), "1");
      const map = join(target === "codex" ? join(output, "plugin") : output, "projection-resources.json");
      await rm(map);
      await assert.rejects(publish(output, remote));
      assert.equal(gitOutput(root, ["--git-dir", remote, "rev-parse", `refs/heads/${branch}`]), second);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
}
