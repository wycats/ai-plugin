import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

export function gitOutput(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Publish an orphan snapshot of a validated, host-specific staged package.
 * The lease covers preparation too: a concurrent publication must not be erased. */
export async function publishGeneratedOutput({ remote, branch, message, prepare }: {
  remote: string;
  branch: string;
  message: string;
  prepare: (stage: string) => Promise<void>;
}): Promise<string> {
  const stage = await mkdtemp(join(tmpdir(), "wycats-generated-publish-"));
  try {
    const ref = `refs/heads/${branch}`;
    gitOutput(stage, ["check-ref-format", ref]);
    gitOutput(stage, ["init", "--quiet"]);
    gitOutput(stage, ["config", "user.name", "github-actions[bot]"]);
    gitOutput(stage, ["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
    gitOutput(stage, ["remote", "add", "origin", remote]);
    const previous = gitOutput(stage, ["ls-remote", "--heads", "origin", ref]).split(/\s+/)[0] ?? "";
    await prepare(stage);
    gitOutput(stage, ["add", "--all"]);
    gitOutput(stage, ["commit", "--quiet", "-m", message]);
    const head = gitOutput(stage, ["rev-parse", "HEAD"]);
    gitOutput(stage, ["push", `--force-with-lease=${ref}:${previous}`, "origin", `HEAD:${ref}`]);
    return head;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
