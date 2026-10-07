/**
 * Packages the Codex build output into an ignored local marketplace root.
 *
 * The generated directory is suitable for local testing with:
 *   codex plugin marketplace add ./out/codex-marketplace
 */

import { readFile, writeFile, mkdir, cp, rm, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  CODEX_TARGET,
  displayOutputDirectoryForTarget,
  outputPathForTarget,
} from "./target-output.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CODEX_OUT = outputPathForTarget(ROOT, CODEX_TARGET);
const CODEX_OUT_REL = displayOutputDirectoryForTarget(CODEX_TARGET);
const CODEX_CONFIG = "config.codex.example.json";
export const CODEX_MARKETPLACE_OUT = join(ROOT, "out", "codex-marketplace");

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function ensureCodexBuild(): void {
  execFileSync(process.execPath, ["scripts/build.ts", "--config", CODEX_CONFIG], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

export async function packageCodexMarketplace(): Promise<void> {
  console.log("Building Codex plugin...\n");
  ensureCodexBuild();

  const manifestPath = join(CODEX_OUT, ".codex-plugin", "plugin.json");
  if (!(await fileExists(manifestPath))) {
    console.error(`Build output not found at ${CODEX_OUT_REL}/`);
    process.exit(1);
  }

  const pluginMeta = JSON.parse(await readFile(manifestPath, "utf-8")) as {
    name: string;
    version: string;
    description: string;
    interface?: {
      displayName?: string;
      category?: string;
    };
  };

  await rm(CODEX_MARKETPLACE_OUT, { recursive: true, force: true });
  await mkdir(CODEX_MARKETPLACE_OUT, { recursive: true });

  const pluginDir = join(CODEX_MARKETPLACE_OUT, "plugin");
  await cp(CODEX_OUT, pluginDir, { recursive: true });
  await cp(join(ROOT, "README.md"), join(pluginDir, "README.md"));

  const marketplace = {
    name: pluginMeta.name,
    interface: {
      displayName: pluginMeta.interface?.displayName ?? "Wycats AI Plugin",
    },
    plugins: [
      {
        name: pluginMeta.name,
        source: {
          source: "local",
          path: "./plugin",
        },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL",
        },
        category: pluginMeta.interface?.category ?? "Developer Tools",
      },
    ],
  };

  const marketplaceDir = join(CODEX_MARKETPLACE_OUT, ".agents", "plugins");
  await mkdir(marketplaceDir, { recursive: true });
  await writeFile(
    join(marketplaceDir, "marketplace.json"),
    JSON.stringify(marketplace, null, 2) + "\n",
  );

  console.log("\nPackaged Codex marketplace.");
  console.log("  marketplace: out/codex-marketplace/");
  console.log("  plugin:      out/codex-marketplace/plugin/");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  packageCodexMarketplace().catch((err: unknown) => {
    console.error("Package failed:", err);
    process.exit(1);
  });
}
