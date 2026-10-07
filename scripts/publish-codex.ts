/** Publish the generated Codex marketplace on codex-plugin. */
import { cp, readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CODEX_MARKETPLACE_OUT, packageCodexMarketplace } from "./package-codex.ts";
import { gitOutput, publishGeneratedOutput } from "./publish-generated.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const CODEX_PUBLICATION_BRANCH = "codex-plugin";

export async function publishCodexOutput(output: string, remote: string): Promise<string> {
  const manifestPath = join("plugin", ".codex-plugin", "plugin.json");
  const marketplacePath = join(".agents", "plugins", "marketplace.json");
  const manifest = JSON.parse(await readFile(join(output, manifestPath), "utf8")) as { name?: string; version?: string };
  if (!manifest.name || !manifest.version) throw new Error("Codex publication requires a generated plugin manifest");
  await access(join(output, marketplacePath));
  return publishGeneratedOutput({
    remote, branch: CODEX_PUBLICATION_BRANCH, message: `Update Codex plugin (${manifest.version})`,
    prepare: async (stage) => {
      await cp(output, stage, { recursive: true });
      await access(join(stage, marketplacePath));
      await access(join(stage, "plugin", "composition-index.json"));
      await access(join(stage, "plugin", "projection-resources.json"));
      const stagedManifest = JSON.parse(await readFile(join(stage, manifestPath), "utf8")) as { name?: string; version?: string };
      if (stagedManifest.name !== manifest.name || stagedManifest.version !== manifest.version) throw new Error("Codex package changed while staging");
    },
  });
}

async function main(): Promise<void> {
  await packageCodexMarketplace();
  const remote = gitOutput(ROOT, ["remote", "get-url", "origin"]);
  await publishCodexOutput(CODEX_MARKETPLACE_OUT, remote);
  const manifest = JSON.parse(await readFile(join(CODEX_MARKETPLACE_OUT, "plugin", ".codex-plugin", "plugin.json"), "utf8")) as { name: string };
  console.log(`\nPublished to ${CODEX_PUBLICATION_BRANCH} branch.`);
  console.log("\nFor first-time install:");
  console.log("  codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin");
  console.log(`  codex plugin add ${manifest.name}@${manifest.name}`);
  console.log("\nTo update after publishing:");
  console.log(`  codex plugin marketplace upgrade ${manifest.name}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("Publish failed:", error);
    process.exitCode = 1;
  });
}
