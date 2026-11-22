/** Build from canonical sources, validate with the receiving host, then install.
 * The same command updates an existing installation through Antigravity's CLI. */
import { execFileSync } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseBuildConfig } from "./build-config.ts";
import { outputPathForTarget } from "./target-output.ts";

const ROOT = resolve(import.meta.dirname, "..");

export function installOptions(args: string[]) {
  let config = "config.antigravity.example.json";
  let agy: string | undefined;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    const option = args[i];
    if (option === "--") continue;
    if (option === "--dry-run") { dryRun = true; continue; }
    if (option !== "--config" && option !== "--agy") throw new Error(`Unknown option: ${option}`);
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${option}`);
    if (option === "--config") config = value;
    else agy = value;
  }
  return { config, agy, dryRun };
}

/** A rejected package must never reach the install step. */
export function installValidatedPackage(
  agy: string, output: string, dryRun: boolean,
  run: (command: string, args: string[]) => void = (command, args) => {
    execFileSync(command, args, { cwd: ROOT, stdio: "inherit" });
  },
): void {
  run(agy, ["plugin", "validate", "--strict", output]);
  if (!dryRun) run(agy, ["plugin", "install", output]);
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log("Usage: pnpm install:antigravity [--config <path>] [--agy <executable>] [--dry-run]\nBuilds and validates before installing. --dry-run builds and validates only.");
    return;
  }
  const options = installOptions(process.argv.slice(2));
  const config = resolve(ROOT, options.config);
  const parsed = parseBuildConfig(JSON.parse(await readFile(config, "utf8")) as unknown);
  if (parsed.target !== "antigravity") throw new Error("install:antigravity requires an antigravity build config");
  let agy = options.agy ?? process.env.ANTIGRAVITY_CLI;
  if (!agy) {
    const bundled = join(homedir(), ".gemini", "bin", process.platform === "win32" ? "agy.exe" : "agy");
    try {
      if (!(await stat(bundled)).isFile()) throw new Error("Bundled CLI is not a file");
      await access(bundled, constants.X_OK);
      agy = bundled;
    }
    catch { agy = "agy"; }
  }
  // Verify the CLI is available before doing build work. No inference is invoked.
  execFileSync(agy, ["plugin", "--help"], { stdio: "pipe" });
  execFileSync(process.execPath, [join(ROOT, "scripts/build.ts"), "--config", config], { cwd: ROOT, stdio: "inherit" });
  const output = outputPathForTarget(ROOT, "antigravity");
  installValidatedPackage(agy, output, options.dryRun);
  if (options.dryRun) {
    console.log("Validated build; installation unchanged.");
    return;
  }
  console.log("Start a new Antigravity conversation to use the updated plugin.");
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
}
