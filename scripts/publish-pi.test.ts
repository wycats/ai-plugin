import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { publishPiOutput } from "./publish-pi.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "pi-publication-test-"));
  const output = join(root, "package");
  const remote = join(root, "remote.git");
  git(root, "init", "--bare", remote);
  try {
    execFileSync(process.execPath, ["scripts/build.ts", "--config", "config.pi.example.json", "--output", output], { cwd: ROOT, stdio: "pipe" });
    return { root, output, remote };
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}

void test("Pi publication ships a relocatable root package and replaces only the publication ref", async () => {
  const { root, output, remote } = await fixture();
  try {
    const first = await publishPiOutput(output, remote);
    const manifest = JSON.parse(git(root, "--git-dir", remote, "show", `${first}:package.json`)) as { pi: { skills: string[] } };
    assert.deepEqual(manifest.pi.skills, ["./skills/recon"]);
    assert.match(git(root, "--git-dir", remote, "show", `${first}:README.md`), /pi update git:github.com\/wycats\/vscode-ai-plugin@pi-plugin/);
    git(root, "--git-dir", remote, "update-ref", "refs/heads/main", first);
    await writeFile(join(output, "revision.txt"), "second publication\n");
    const second = await publishPiOutput(output, remote);
    assert.notEqual(first, second);
    assert.equal(git(root, "--git-dir", remote, "rev-parse", "refs/heads/main"), first);
    assert.equal(git(root, "--git-dir", remote, "rev-parse", "refs/heads/pi-plugin"), second);
    assert.equal(git(root, "--git-dir", remote, "show", `${second}:revision.txt`), "second publication");
    assert.equal(git(root, "--git-dir", remote, "rev-list", "--count", second), "1");
    await rm(join(output, "agents/wycats-recon.agent.md"));
    await assert.rejects(publishPiOutput(output, remote));
    assert.equal(git(root, "--git-dir", remote, "rev-parse", "refs/heads/pi-plugin"), second);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test("installed Pi fetches a later publication from the named branch", { skip: !process.env.PI_TEST_BINARY }, async () => {
  const binary = process.env.PI_TEST_BINARY;
  assert.ok(binary);
  const { root, output, remote } = await fixture();
  try {
    await publishPiOutput(output, remote);
    const agentDir = join(root, "pi-agent");
    await mkdir(agentDir);
    await writeFile(join(agentDir, "settings.json"), JSON.stringify({ defaultProjectTrust: "never", npmCommand: ["pnpm"], enableInstallTelemetry: false }));
    // Exercise the real Git package updater without contacting GitHub or touching
    // the user's Pi installation. Git rewrites this one fixture URL locally.
    const url = "https://github.com/pi-local-test/publication-fixture";
    const source = `git:${url}@pi-plugin`;
    const env = {
      ...process.env,
      PI_CODING_AGENT_DIR: agentDir,
      PI_SKIP_VERSION_CHECK: "1",
      PI_TELEMETRY: "0",
      PI_OFFLINE: "0",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: `url.file://${remote}.insteadOf`,
      GIT_CONFIG_VALUE_0: url,
      GIT_TERMINAL_PROMPT: "0",
    };
    const pi = (args: string[]) => execFileSync(binary, args, { cwd: root, env, encoding: "utf8", timeout: 60000, stdio: "pipe" });
    pi(["install", source]);
    const installed = join(agentDir, "git", "github.com", "pi-local-test", "publication-fixture");
    const installedManifest = JSON.parse(await readFile(join(installed, "package.json"), "utf8")) as { name: string };
    assert.equal(installedManifest.name, "wycats");
    await writeFile(join(output, "revision.txt"), "updated via pi\n");
    const expected = await publishPiOutput(output, remote);
    pi(["update", "--extensions"]);
    assert.equal(await readFile(join(installed, "revision.txt"), "utf8"), "updated via pi\n");
    assert.equal(git(installed, "rev-parse", "HEAD"), expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
