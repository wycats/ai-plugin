/** Publish the generated Pi package at the root of the pi-plugin branch. */
import { cp, mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { gitOutput, publishGeneratedOutput } from "./publish-generated.ts";

export const PI_PUBLICATION_BRANCH = "pi-plugin";
const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Accepts a built package; tests publish exclusively to disposable local remotes. */
export async function publishPiOutput(output: string, remote: string): Promise<string> {
  const manifest = JSON.parse(await readFile(join(output, "package.json"), "utf8")) as {
    name?: string;
    version?: string;
    pi?: { skills?: string[]; subagents?: { agents?: string[] } };
  };
  if (!manifest.name || !manifest.version ||
      !manifest.pi?.skills?.includes("./skills/recon") ||
      !manifest.pi.subagents?.agents?.includes("./agents")) {
    throw new Error("Pi publication requires a generated Recon package manifest");
  }
  for (const path of ["skills/recon/SKILL.md", "agents/wycats-recon.agent.md", "stances", "composition-index.json", "projection-capabilities.json"]) {
    await access(join(output, path));
  }

  return publishGeneratedOutput({
    remote, branch: PI_PUBLICATION_BRANCH, message: `Update Pi plugin (${manifest.version})`,
    prepare: async (stage) => {
      await cp(output, stage, { recursive: true });
      await writeFile(join(stage, "README.md"), `# Wycats AI Plugin — Pi projection\n\nGenerated from the canonical resources in [wycats/vscode-ai-plugin](https://github.com/wycats/vscode-ai-plugin).\n\nRequires Node 24+, Pi, and pi-subagents for the delegated agent. This first projection exposes Recon and private constituent stances. See projection-capabilities.json for scope and runtime assumptions.\n\nInstall:\n\n\`\`\`sh\npi install git:github.com/wycats/vscode-ai-plugin@pi-plugin\n\`\`\`\n\nUpdate on Pi 0.85.1:\n\n\`\`\`sh\npi update git:github.com/wycats/vscode-ai-plugin@pi-plugin\n\`\`\`\n\nThen use /reload or restart pi. This branch is generated; edit canonical resources on main.\n`);
      for (const path of ["skills/recon/SKILL.md", "agents/wycats-recon.agent.md", "stances", "composition-index.json", "projection-capabilities.json", "projection-resources.json"]) {
        await access(join(stage, path));
      }
      const stagedManifest = JSON.parse(await readFile(join(stage, "package.json"), "utf8")) as { name?: string; version?: string };
      if (stagedManifest.name !== manifest.name || stagedManifest.version !== manifest.version) throw new Error("Pi package changed while staging");
    },
  });
}

async function main(): Promise<void> {
  if (process.argv.length > 2) throw new Error("Usage: pnpm publish-pi (publishes to origin/pi-plugin)");
  const stage = await mkdtemp(join(tmpdir(), "wycats-pi-build-"));
  try {
    const output = join(stage, "package");
    execFileSync(process.execPath, ["scripts/build.ts", "--config", "config.pi.example.json", "--output", output], { cwd: ROOT, stdio: "inherit" });
    const remote = gitOutput(ROOT, ["remote", "get-url", "origin"]);
    const head = await publishPiOutput(output, remote);
    console.log(`Published Pi package to ${PI_PUBLICATION_BRANCH}: ${head}`);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error("Pi publication failed:", error);
    process.exitCode = 1;
  });
}
