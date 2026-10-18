import { createHash } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { renderPersistentInstructions } from "./persistent-context.mjs";
import {
  checkPath, commitChange, readContents, resumePendingChange, saveRecoveryCopy,
  type GuidanceContents, type GuidancePaths,
} from "./guidance-files.mjs";

const marker = "<!-- wycats:persistent-instructions -->";
const closingMarker = "<!-- /wycats:persistent-instructions -->";
const importLine = "@.claude/wycats/persistent-instructions.md";
const block = `${marker}\n${importLine}\n${closingMarker}\n`;
const usage = "Usage: node <plugin>/scripts/claude-guidance.mjs <install|remove|repair> --project <directory> [--dry-run]";

const installationRecordSchema = z.object({
  version: z.literal(1),
  // Include our inserted separator so removal restores the original text.
  importBlock: z.enum([block, `\n${block}`, `\n\n${block}`]),
  createdClaudeMd: z.boolean(),
  // Detect local edits before replacing or removing the generated prose.
  contentHash: z.string().regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 digest"),
  pluginRoot: z.string(),
});
type InstallationRecord = z.infer<typeof installationRecordSchema>;
type ImportBlock = InstallationRecord["importBlock"];

interface Command {
  action: "install" | "remove" | "repair";
  project: string;
  dryRun: boolean;
}
interface ProjectInstallation {
  paths: GuidancePaths;
  contents: GuidanceContents;
}

async function main(): Promise<void> {
  const command = parseCommand(process.argv.slice(2));
  if (!command) {
    console.log(usage);
    return;
  }

  const paths = await projectPaths(command.project);
  await resumePendingChange(paths, command.dryRun);
  const project = { paths, contents: await readContents(paths) };

  switch (command.action) {
    case "install": return installGuidance(project, command.dryRun);
    case "remove": return removeGuidance(project, command.dryRun);
    case "repair": return repairGuidance(project, command.dryRun);
  }
}

async function installGuidance(project: ProjectInstallation, dryRun: boolean): Promise<void> {
  const record = assertManagedContents(project);
  const content = await renderedGuidance();
  const importBlock = record?.importBlock ?? newImportBlock(project.contents.claude);
  const claude = record ? project.contents.claude : (project.contents.claude ?? "") + importBlock;
  const after = installationContents(content, claude, importBlock,
    record?.createdClaudeMd ?? project.contents.claude === null);

  reportDestinations(project.paths, dryRun ? "Would install" : "Installing");
  if (dryRun) return;
  await commitChange(project.paths, project.contents, after);
  reportInstalled();
}

async function removeGuidance(project: ProjectInstallation, dryRun: boolean): Promise<void> {
  const record = assertManagedContents(project);
  if (!record) {
    console.log(`No wycats guidance installed in ${project.paths.root}`);
    return;
  }
  const remaining = (project.contents.claude ?? "").replace(record.importBlock, "");
  const after: GuidanceContents = {
    claude: record.createdClaudeMd && remaining === "" ? null : remaining,
    body: null,
    record: null,
  };

  reportDestinations(project.paths, dryRun ? "Would remove" : "Removing");
  if (dryRun) return;
  await commitChange(project.paths, project.contents, after);
  // Leave directories and recovery copies available to the user.
}

/** Repair is an explicit request to refresh generated content. Preserve the
 * complete previous files before changing a marked import or the export. */
async function repairGuidance(project: ProjectInstallation, dryRun: boolean): Promise<void> {
  const record = recoverableRecord(project.contents.record);
  const repaired = repairedImport(project.contents.claude, record);
  const content = await renderedGuidance();
  const after = installationContents(content, repaired.claude, repaired.importBlock,
    record?.createdClaudeMd ?? project.contents.claude === null);

  reportDestinations(project.paths, dryRun ? "Would repair" : "Repairing");
  console.log("Save the current managed files in .claude/wycats/recovery/ before refreshing the installation.");
  if (dryRun) return;
  const backup = await saveRecoveryCopy(project.paths, project.contents);
  console.log(`Recovery copy: ${backup}`);
  await commitChange(project.paths, project.contents, after);
  reportInstalled();
}

async function projectPaths(project: string): Promise<GuidancePaths> {
  const root = await realpath(resolve(project));
  if (!(await lstat(root)).isDirectory()) throw new Error(`Project is not a directory: ${root}`);
  const directory = join(root, ".claude", "wycats");
  // A symlink here could redirect project writes into user-wide instructions.
  await checkPath(join(root, ".claude"), "directory");
  await checkPath(directory, "directory");
  return {
    root, directory, pending: join(directory, "pending.json"),
    files: {
      claude: join(root, "CLAUDE.md"),
      body: join(directory, "persistent-instructions.md"),
      record: join(directory, "installation.json"),
    },
  };
}

function assertManagedContents({ paths, contents }: ProjectInstallation): InstallationRecord | undefined {
  const { claude, body, record: saved } = contents;
  if (saved === null) {
    if (body !== null || hasImportTrace(claude)) {
      throw new Error(`Existing guidance has no installation record at ${paths.files.record}. Use repair to preserve a recovery copy and establish a new installation.`);
    }
    return undefined;
  }

  const record = parseInstallationRecord(saved);
  if (body === null || digest(body) !== record.contentHash) {
    throw new Error(`Generated guidance was changed or removed: ${paths.files.body}. Use repair to save a recovery copy and refresh it before updating or removing this installation.`);
  }
  if (claude === null || occurrences(claude, record.importBlock) !== 1 ||
      occurrences(claude, marker) !== 1 || occurrences(claude, closingMarker) !== 1) {
    throw new Error(`The managed import was changed or removed in ${paths.files.claude}. Use repair to preserve a recovery copy and restore an unambiguous marked import.`);
  }
  return record;
}

function repairedImport(claude: string | null, record: InstallationRecord | undefined): { claude: string; importBlock: ImportBlock } {
  const text = claude ?? "";
  if (record && occurrences(text, record.importBlock) === 1 &&
      occurrences(text, marker) === 1 && occurrences(text, closingMarker) === 1) {
    return { claude: text, importBlock: record.importBlock };
  }
  if (!hasImportTrace(text)) {
    const importBlock = newImportBlock(claude);
    return { claude: text + importBlock, importBlock };
  }

  const start = text.indexOf(marker);
  const closing = text.indexOf(closingMarker);
  if (occurrences(text, marker) !== 1 || occurrences(text, closingMarker) !== 1 || closing < start) {
    throw new Error("The import markers are incomplete, duplicated, or out of order. Preserve your edits and reconcile the marked block in CLAUDE.md before running repair.");
  }
  let end = closing + closingMarker.length;
  if (text[end] === "\n") end++;
  const outside = text.slice(0, start) + text.slice(end);
  if (outside.includes(importLine)) {
    throw new Error("An additional guidance import exists outside the marked block. Reconcile it in CLAUDE.md before running repair.");
  }
  return { claude: text.slice(0, start) + block + text.slice(end), importBlock: block };
}

function installationContents(body: string, claude: string | null, importBlock: ImportBlock, createdClaudeMd: boolean): GuidanceContents {
  const record: InstallationRecord = {
    version: 1, importBlock, createdClaudeMd, contentHash: digest(body),
    pluginRoot: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  };
  return { claude, body, record: JSON.stringify(record, null, 2) + "\n" };
}

function newImportBlock(existing: string | null): ImportBlock {
  if (!existing) return block;
  return existing.endsWith("\n") ? `\n${block}` : `\n\n${block}`;
}

function parseInstallationRecord(text: string): InstallationRecord {
  const result = installationRecordSchema.safeParse(JSON.parse(text) as unknown);
  if (!result.success) {
    throw new Error(`Invalid wycats installation record:\n${z.prettifyError(result.error)}\nUse repair to preserve the current files and rebuild the record.`);
  }
  return result.data;
}

function recoverableRecord(text: string | null): InstallationRecord | undefined {
  if (text === null) return undefined;
  try {
    return parseInstallationRecord(text);
  } catch {
    // Repair preserves the original record and conservatively keeps CLAUDE.md.
    return undefined;
  }
}

async function renderedGuidance(): Promise<string> {
  const content = await renderPersistentInstructions();
  if (!content.trim()) throw new Error("Plugin produced no persistent instructions.");
  return content;
}

function digest(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function occurrences(text: string, part: string): number {
  return text.split(part).length - 1;
}

function hasImportTrace(text: string | null): boolean {
  return text !== null && [marker, closingMarker, importLine].some(part => text.includes(part));
}

function reportDestinations(paths: GuidancePaths, verb: string): void {
  console.log(`${verb} guidance in ${paths.root}\nImport: ${paths.files.claude}\nGenerated prose: ${paths.files.body}`);
}

function reportInstalled(): void {
  console.log("Restart or resume Claude to load the updated instructions. Rerun install after plugin updates; run remove before uninstalling the plugin.");
}

function parseCommand(args: string[]): Command | undefined {
  const [action, ...options] = args;
  if (action === "--help") return undefined;
  let project: string | undefined;
  let dryRun = false;

  for (let index = 0; index < options.length; index++) {
    const option = options[index];
    if (option === "--project" && !project && options[index + 1] && !options[index + 1].startsWith("--")) {
      project = options[++index];
    } else if (option === "--dry-run" && !dryRun) {
      dryRun = true;
    } else {
      throw new Error(usage);
    }
  }
  if ((action !== "install" && action !== "remove" && action !== "repair") || !project) throw new Error(usage);
  return { action, project, dryRun };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
