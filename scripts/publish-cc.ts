/** Publish the generated Claude Code plugin and marketplace on cc-plugin. */
import { readFile, writeFile, mkdir, cp, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { CLAUDE_CODE_TARGET, outputPathForTarget } from "./target-output.ts";
import { gitOutput, publishGeneratedOutput } from "./publish-generated.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const CLAUDE_CODE_PUBLICATION_BRANCH = "cc-plugin";

export async function publishClaudeCodeOutput(output: string, remote: string): Promise<string> {
  const manifest = JSON.parse(await readFile(join(output, ".claude-plugin", "plugin.json"), "utf8")) as { name?: string; version?: string; description?: string };
  if (!manifest.name || !manifest.version || !manifest.description) throw new Error("Claude Code publication requires a generated plugin manifest");
  return publishGeneratedOutput({
    remote, branch: CLAUDE_CODE_PUBLICATION_BRANCH, message: `Update Claude Code plugin (${manifest.version})`,
    prepare: async (stage) => {
      const plugin = join(stage, "plugin");
      await cp(output, plugin, { recursive: true });
      await access(join(plugin, "composition-index.json"));
      await access(join(plugin, "projection-resources.json"));
      const stagedManifest = JSON.parse(await readFile(join(plugin, ".claude-plugin", "plugin.json"), "utf8")) as typeof manifest;
      if (stagedManifest.name !== manifest.name || stagedManifest.version !== manifest.version || stagedManifest.description !== manifest.description) throw new Error("Claude Code package changed while staging");
      const marketplace = {
        $schema: "https://anthropic.com/claude-code/marketplace.schema.json",
        name: manifest.name, version: manifest.version, description: manifest.description,
        owner: { name: "wycats" },
        plugins: [{ name: manifest.name, source: "./plugin", description: manifest.description }],
      };
      await mkdir(join(stage, ".claude-plugin"), { recursive: true });
      await writeFile(join(stage, ".claude-plugin", "marketplace.json"), JSON.stringify(marketplace, null, 2) + "\n");
    },
  });
}

async function main(): Promise<void> {
  console.log("Building Claude Code plugin...\n");
  execFileSync(process.execPath, ["scripts/build.ts", "--config", "config.claude-code.example.json"], { cwd: ROOT, stdio: "inherit" });
  const output = outputPathForTarget(ROOT, CLAUDE_CODE_TARGET);
  const remote = gitOutput(ROOT, ["remote", "get-url", "origin"]);
  await publishClaudeCodeOutput(output, remote);
  const manifest = JSON.parse(await readFile(join(output, ".claude-plugin", "plugin.json"), "utf8")) as { name: string };
  console.log(`\nPublished to ${CLAUDE_CODE_PUBLICATION_BRANCH} branch.`);
  console.log("\nFor first-time install:");
  console.log("  /plugin marketplace add wycats/vscode-ai-plugin@cc-plugin");
  console.log(`  /plugin install ${manifest.name}@${manifest.name}`);
  console.log("\nTo update after publishing:");
  console.log(`  /plugin marketplace update ${manifest.name}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("Publish failed:", error);
    process.exitCode = 1;
  });
}
