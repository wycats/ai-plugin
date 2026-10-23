/** File ownership and restartable writes for the project guidance installer. */
import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const fileNames = {
  claude: "CLAUDE.md",
  body: "persistent-instructions.md",
  record: "installation.json",
} as const;
const fileKeys = ["body", "claude", "record"] as const;

const contentsSchema = z.object({
  claude: z.string().nullable(),
  body: z.string().nullable(),
  record: z.string().nullable(),
});
const pendingSchema = z.object({
  version: z.literal(1),
  pid: z.number().int().positive(),
  before: contentsSchema,
  after: contentsSchema,
});
export type GuidanceContents = z.infer<typeof contentsSchema>;
type PendingChange = z.infer<typeof pendingSchema>;

export interface GuidancePaths {
  root: string;
  directory: string;
  pending: string;
  files: Record<keyof GuidanceContents, string>;
}

/** Own recovery, the subsequent snapshot, and the requested operation together.
 * The journal survives interruption; the separate lock is never reclaimed from
 * a PID check, since another process could acquire it between check and removal. */
export async function withGuidanceOperation(
  paths: GuidancePaths, dryRun: boolean, run: () => Promise<void>,
): Promise<void> {
  const lock = join(paths.directory, "operation.lock");
  if (dryRun) {
    const existing = await readOptional(lock);
    if (existing !== null) throw occupiedOperation(lock, existing);
    return run();
  }

  await mkdir(paths.directory, { recursive: true });
  let handle;
  try {
    handle = await open(lock, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    throw occupiedOperation(lock, await readOptional(lock));
  }

  try {
    await handle.writeFile(JSON.stringify({ version: 1, pid: process.pid }) + "\n");
    await run();
  } finally {
    await handle.close();
    await rm(lock);
  }
}

function occupiedOperation(lock: string, text: string | null): Error {
  const ownerSchema = z.object({ version: z.literal(1), pid: z.number().int().positive() });
  let owner: z.infer<typeof ownerSchema> | undefined;
  try {
    const parsed = ownerSchema.safeParse(JSON.parse(text ?? "") as unknown);
    if (parsed.success) owner = parsed.data;
  } catch { /* A process can be interrupted before writing its owner record. */ }

  const status = owner
    ? processIsRunning(owner.pid)
      ? `Another guidance operation may still be running (PID ${String(owner.pid)}). Retry after it exits.`
      : `The guidance operation recorded with PID ${String(owner.pid)} is not running.`
    : "The guidance operation's owner is unknown; its lock record is incomplete or unavailable.";
  return new Error(`${status} Lock: ${lock}. After verifying that no guidance operation for this project is running, remove only this lock file and rerun the command. Keep pending.json for interrupted-operation recovery.`);
}

export async function checkPath(path: string, kind: "file" | "directory"): Promise<void> {
  try {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || (kind === "directory" ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error(`Expected an ordinary ${kind}: ${path}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export async function readOptional(path: string): Promise<string | null> {
  await checkPath(path, "file");
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readContents(paths: GuidancePaths): Promise<GuidanceContents> {
  const [claude, body, record] = await Promise.all([
    readOptional(paths.files.claude),
    readOptional(paths.files.body),
    readOptional(paths.files.record),
  ]);
  return { claude, body, record };
}

/** Each file may be either the old or new version after a process interruption.
 * Check the entire set before continuing, so later edits are never overwritten. */
async function applyChange(paths: GuidancePaths, pending: PendingChange): Promise<void> {
  const current = await readContents(paths);
  for (const key of fileKeys) {
    if (current[key] !== pending.before[key] && current[key] !== pending.after[key]) {
      throw new Error(`Changed during an interrupted operation: ${paths.files[key]}. Preserve your edits and reconcile them with ${paths.pending} before continuing.`);
    }
  }

  for (const key of fileKeys) {
    if (current[key] === pending.after[key]) continue;
    const desired = pending.after[key];
    if (desired === null) await rm(paths.files[key], { force: true });
    else await replaceFile(paths.files[key], desired);
  }
  await rm(paths.pending);
}

export async function resumePendingChange(paths: GuidancePaths, dryRun: boolean): Promise<void> {
  const text = await readOptional(paths.pending);
  if (text === null) return;
  const pending = pendingSchema.parse(JSON.parse(text) as unknown);
  if (processIsRunning(pending.pid)) {
    throw new Error(`Another guidance operation may still be running (PID ${String(pending.pid)}). Retry after it exits. Pending record: ${paths.pending}`);
  }
  if (dryRun) {
    throw new Error(`An interrupted operation is pending at ${paths.pending}. Rerun without --dry-run to finish it before the requested operation.`);
  }
  console.log(`Finishing the interrupted guidance operation recorded at ${paths.pending}`);
  await applyChange(paths, pending);
}

export async function commitChange(paths: GuidancePaths, before: GuidanceContents, after: GuidanceContents): Promise<void> {
  await mkdir(paths.directory, { recursive: true });
  const pending: PendingChange = { version: 1, pid: process.pid, before, after };
  // The operation lock already covers recovery and planning. Exclusive journal
  // creation additionally preserves any unexpected existing transaction record.
  // Record complete before/after bytes before modifying any managed file.
  await writeFile(paths.pending, JSON.stringify(pending, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  await applyChange(paths, pending);
}

export async function saveRecoveryCopy(paths: GuidancePaths, contents: GuidanceContents): Promise<string> {
  const recoveryRoot = join(paths.directory, "recovery");
  await checkPath(recoveryRoot, "directory");
  const backup = join(recoveryRoot, randomUUID());
  await mkdir(backup, { recursive: true });
  for (const key of fileKeys) {
    const text = contents[key];
    if (text !== null) await writeFile(join(backup, fileNames[key]), text, { flag: "wx", mode: 0o600 });
  }
  return backup;
}

async function replaceFile(path: string, text: string): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const mode = await lstat(path).then(stat => stat.mode, () => undefined);
  try {
    await writeFile(temporary, text, { flag: "wx", mode });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

function processIsRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}
