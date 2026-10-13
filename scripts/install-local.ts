/**
 * Runs the build and registers the output directory
 * in VS Code's local plugin paths setting.
 *
 * After running, all VS Code windows will pick up the plugin
 * on their next reload or settings sync.
 *
 * Uses jsonc-parser (the same JSONC library VS Code uses
 * internally) to safely edit settings.json while preserving
 * comments and formatting.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { homedir, platform } from "node:os";
import { fileURLToPath } from "node:url";
import {
  modify,
  applyEdits,
  parse,
  printParseErrorCode,
  type ParseError,
} from "jsonc-parser";
import {
  legacyVSCodeOutputPath,
  outputPathForTarget,
  VSCODE_TARGET,
} from "./target-output.ts";
import { COPILOT_NAMESPACE } from "./vscode-plugin.ts";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

type VSCodeChannel = "stable" | "insiders";

interface CliOptions {
  settingsPath?: string;
  vscodeChannel?: VSCodeChannel;
  configPath?: string;
  outputPath?: string;
  dryRun: boolean;
}

interface ResolvedSettingsTarget {
  path: string;
  source: string;
}

interface RegistrationActions {
  staleEntriesRemoved: string[];
  alreadyEnabledEntries: string[];
  entriesEnabled: string[];
  content: string;
}

function usage(): string {
  return [
    "Usage: pnpm install-local -- --settings <path>",
    "   or: pnpm install-local -- --vscode-channel <stable|insiders>",
    "",
    "Options:",
    "  --settings <path>                 Settings JSONC file to update.",
    "  --vscode-channel <stable|insiders> Convenience alias for the standard VS Code settings path.",
    "  --dry-run                         Build and report changes without writing settings.",
    "  --config <path>                   Build using an explicit config file.",
    "  --output <path>                   Build into a fresh external scratch directory.",
    "",
    "Environment fallbacks, in precedence order after direct CLI settings:",
    "  VSCODE_SETTINGS_PATH, VSCODE_CHANNEL",
  ].join("\n");
}

function parseVSCodeChannel(value: string, source: string): VSCodeChannel {
  if (value === "stable" || value === "insiders") {
    return value;
  }

  throw new Error(
    `${source} must be "stable" or "insiders"; received ${JSON.stringify(value)}.`,
  );
}

function takeOptionValue(args: string[], index: number, name: string): string {
  if (index + 1 >= args.length) {
    throw new Error(`${name} requires a value.\n\n${usage()}`);
  }

  const value = args[index + 1];

  if (value.startsWith("--")) {
    throw new Error(`${name} requires a value.\n\n${usage()}`);
  }

  return value;
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = { dryRun: false };
  let sawCliSettings = false;
  let sawCliChannel = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--") continue;

    if (arg === "--config" || arg === "--output") {
      const value = takeOptionValue(args, index, arg);
      if (arg === "--config") options.configPath = value;
      else options.outputPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--config=") || arg.startsWith("--output=")) {
      const separator = arg.indexOf("=");
      const value = arg.slice(separator + 1);
      if (!value) throw new Error(`${arg.slice(0, separator)} requires a value.`);
      if (arg.startsWith("--config=")) options.configPath = value;
      else options.outputPath = value;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--settings") {
      options.settingsPath = takeOptionValue(args, index, "--settings");
      sawCliSettings = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--settings=")) {
      options.settingsPath = arg.slice("--settings=".length);
      sawCliSettings = true;
      continue;
    }

    if (arg === "--vscode-channel") {
      options.vscodeChannel = parseVSCodeChannel(
        takeOptionValue(args, index, "--vscode-channel"),
        "--vscode-channel",
      );
      sawCliChannel = true;
      index += 1;
      continue;
    }

    if (arg.startsWith("--vscode-channel=")) {
      options.vscodeChannel = parseVSCodeChannel(
        arg.slice("--vscode-channel=".length),
        "--vscode-channel",
      );
      sawCliChannel = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
  }

  if (sawCliSettings && sawCliChannel) {
    throw new Error(
      "Use either direct --settings or direct --vscode-channel, not both.",
    );
  }

  return options;
}

function expandHome(path: string): string {
  if (path === "~") {
    return homedir();
  }

  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }

  return path;
}

function resolveSettingsPath(path: string): string {
  if (path.trim().length === 0) {
    throw new Error("Settings path must not be empty.");
  }

  return resolve(expandHome(path));
}

function isFileNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ENOENT"
  );
}

function settingsPathForChannel(channel: VSCodeChannel): string {
  const appName = channel === "stable" ? "Code" : "Code - Insiders";

  switch (platform()) {
    case "darwin":
      return join(
        homedir(),
        "Library/Application Support",
        appName,
        "User/settings.json",
      );
    case "win32":
      return join(
        process.env.APPDATA ?? join(homedir(), "AppData/Roaming"),
        appName,
        "User/settings.json",
      );
    default:
      return join(
        process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"),
        appName,
        "User/settings.json",
      );
  }
}

function resolveSettingsTarget(options: CliOptions): ResolvedSettingsTarget {
  if (options.settingsPath !== undefined) {
    return {
      path: resolveSettingsPath(options.settingsPath),
      source: "--settings",
    };
  }

  if (process.env.VSCODE_SETTINGS_PATH !== undefined) {
    return {
      path: resolveSettingsPath(process.env.VSCODE_SETTINGS_PATH),
      source: "VSCODE_SETTINGS_PATH",
    };
  }

  if (options.vscodeChannel !== undefined) {
    return {
      path: settingsPathForChannel(options.vscodeChannel),
      source: `--vscode-channel ${options.vscodeChannel}`,
    };
  }

  if (process.env.VSCODE_CHANNEL !== undefined) {
    const channel = parseVSCodeChannel(process.env.VSCODE_CHANNEL, "VSCODE_CHANNEL");
    return {
      path: settingsPathForChannel(channel),
      source: `VSCODE_CHANNEL=${channel}`,
    };
  }

  throw new Error(
    [
      "Refusing to guess which VS Code settings file to mutate.",
      "Pass --settings <path> for an explicit settings file, or --vscode-channel stable|insiders for the standard VS Code location.",
      "You can also set VSCODE_SETTINGS_PATH or VSCODE_CHANNEL.",
      "",
      usage(),
    ].join("\n"),
  );
}

/** Read settings.json, using a minimal in-memory object if it doesn't exist yet. */
async function readSettings(settingsPath: string): Promise<string> {
  try {
    return await readFile(settingsPath, "utf-8");
  } catch (err: unknown) {
    if (!isFileNotFoundError(err)) {
      throw err;
    }

    return "{}\n";
  }
}

function validateJsonc(content: string, settingsPath: string): void {
  const errors: ParseError[] = [];
  parse(content, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const details = errors
      .map(
        (error) =>
          `${printParseErrorCode(error.error)} at offset ${String(error.offset)}`,
      )
      .join(", ");

    throw new Error(`Invalid JSONC in ${settingsPath}: ${details}`);
  }
}

/** Set a value at a JSONC path, preserving comments and formatting. */
function setJsoncValue(
  content: string,
  path: (string | number)[],
  value: unknown,
): string {
  const edits = modify(content, path, value, {
    formattingOptions: { tabSize: 2, insertSpaces: false },
  });
  return applyEdits(content, edits);
}

/** Remove a JSONC path, preserving comments and formatting. */
function removeJsoncValue(content: string, path: (string | number)[]): string {
  const edits = modify(content, path, undefined, {
    formattingOptions: { tabSize: 2, insertSpaces: false },
  });
  return applyEdits(content, edits);
}

function getJsoncValue(content: string, path: string[]): unknown {
  const parsed = parse(content, undefined, {
    allowTrailingComma: true,
  }) as unknown;
  let current = parsed;

  for (const segment of path) {
    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function hasJsoncPath(content: string, path: string[]): boolean {
  return getJsoncValue(content, path) !== undefined;
}

function isJsoncPathEnabled(content: string, path: string[]): boolean {
  return getJsoncValue(content, path) === true;
}

export function applyRegistrationActions(
  content: string,
  outPath: string,
  root = ROOT,
): RegistrationActions {
  const staleEntriesRemoved: string[] = [];
  const alreadyEnabledEntries: string[] = [];
  const entriesEnabled: string[] = [];

  const ownedOutputs = new Set([outPath, outputPathForTarget(root, VSCODE_TARGET), legacyVSCodeOutputPath(root)]);
  for (const ownedOutput of ownedOutputs) {
    const obsolete: string[][] = [
      ["chat.plugins.paths", ownedOutput],
      ["chat.hookFilesLocations", join(ownedOutput, "hooks")],
      ["chat.hookFilesLocations", join(ownedOutput, COPILOT_NAMESPACE, "hooks")],
      ["chat.hookFilesLocations", join(ownedOutput, COPILOT_NAMESPACE, "hooks", "hooks.json")],
    ];
    if (ownedOutput !== outPath) obsolete.push(["chat.pluginLocations", ownedOutput]);
    for (const path of obsolete) {
      if (hasJsoncPath(content, path)) {
        content = removeJsoncValue(content, path);
        staleEntriesRemoved.push(`${path[0]}[${path[1]}]`);
      }
    }
  }

  if (isJsoncPathEnabled(content, ["chat.pluginLocations", outPath])) {
    alreadyEnabledEntries.push(`chat.pluginLocations[${outPath}]`);
  } else {
    content = setJsoncValue(content, ["chat.pluginLocations", outPath], true);
    entriesEnabled.push(`chat.pluginLocations[${outPath}]`);
  }

  return {
    staleEntriesRemoved,
    alreadyEnabledEntries,
    entriesEnabled,
    content,
  };
}

function logList(title: string, entries: string[]): void {
  if (entries.length === 0) {
    console.log(`${title}: none`);
    return;
  }

  console.log(`${title}:`);
  for (const entry of entries) {
    console.log(`  - ${entry}`);
  }
}

function logRegistrationPlan(
  actions: RegistrationActions,
  settingsTarget: ResolvedSettingsTarget,
  outPath: string,
): void {
  console.log(`Resolved settings path: ${settingsTarget.path}`);
  console.log(`Settings source: ${settingsTarget.source}`);
  console.log(`Plugin path: ${outPath}`);
  console.log(`Hooks: discovered through ${COPILOT_NAMESPACE}/hooks/hooks.json by the plugin`);
  logList("Stale entries that would be removed", actions.staleEntriesRemoved);
  logList("Entries already enabled", actions.alreadyEnabledEntries);
  logList("Entries that would be added/enabled", actions.entriesEnabled);
}

async function readConfiguredTarget(configPath: string): Promise<string> {
  try {
    const config = JSON.parse(
      await readFile(configPath, "utf-8"),
    ) as { target?: string };
    return config.target ?? "vscode";
  } catch {
    // config.json missing or invalid — build.ts already errored or will error.
    return "vscode";
  }
}

async function installLocal() {
  const options = parseCliOptions(process.argv.slice(2));

  // Step 1: run the build
  const configPath = resolve(ROOT, options.configPath ?? process.env.VSCODE_AI_PLUGIN_CONFIG_PATH ?? "config.json");
  const buildArgs = ["scripts/build.ts", "--config", configPath];
  if (options.outputPath) buildArgs.push("--output", options.outputPath);
  execFileSync(process.execPath, buildArgs, { cwd: ROOT, stdio: "inherit" });

  // Step 2: determine output path from config
  const target = await readConfiguredTarget(configPath);
  const outPath = options.outputPath ? resolve(ROOT, options.outputPath) : outputPathForTarget(ROOT, target);

  if (target !== VSCODE_TARGET) {
    console.log(
      `Built ${target} plugin at ${outPath}; no VS Code local registration needed.`,
    );
    return;
  }

  // Step 3: resolve and read current settings
  const settingsTarget = resolveSettingsTarget(options);
  const originalContent = await readSettings(settingsTarget.path);
  validateJsonc(originalContent, settingsTarget.path);

  // Step 4: compute registration changes in memory
  const actions = applyRegistrationActions(originalContent, outPath);

  if (options.dryRun) {
    logRegistrationPlan(actions, settingsTarget, outPath);
    console.log("Dry run only; settings file was not changed.");
    return;
  }

  for (const entry of actions.staleEntriesRemoved) {
    console.log(`Removed stale registration ${entry}`);
  }

  for (const entry of actions.alreadyEnabledEntries) {
    console.log(`Already enabled ${entry}`);
  }

  for (const entry of actions.entriesEnabled) {
    console.log(`Enabled ${entry}`);
  }

  if (actions.content !== originalContent) {
    await mkdir(dirname(settingsTarget.path), { recursive: true });
    await writeFile(settingsTarget.path, actions.content, "utf-8");
    console.log(`Updated VS Code settings at ${settingsTarget.path}`);
  } else {
    console.log(`No VS Code settings changes needed at ${settingsTarget.path}`);
  }

  console.log("Reload VS Code windows to pick up changes.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installLocal().catch((err: unknown) => {
    console.error("Install failed:", err);
    process.exit(1);
  });
}
