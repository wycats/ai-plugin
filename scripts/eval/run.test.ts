import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateReportPath } from "./output.ts";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function runEval(args: string[]) {
  return spawnSync(process.execPath, ["scripts/eval/run.ts", "--", ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

void test("rejects unknown CLI arguments with usage", () => {
  const result = runEval(["--adapter", "claude-code-cli", "--unknown"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument: --unknown/);
  assert.match(result.stderr, /Usage: pnpm eval/);
});

void test("projects one case without invoking the target", () => {
  const result = runEval([
    "--adapter",
    "claude-code-cli",
    "--dry-run",
    "--case",
    "empty-document",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--- empty-document:/);
  assert.match(result.stdout, /Canonical request:/);
  assert.match(result.stdout, /Target projection:/);
  assert.match(result.stdout, /Target projection:\n\nProtocol: document-review\/v1/);
});

void test("refuses output paths that overwrite evaluation inputs", () => {
  const suiteResult = runEval([
    "--adapter",
    "claude-code-cli",
    "--dry-run",
    "--output",
    "evals/slop-linter/cases.json",
  ]);
  assert.equal(suiteResult.status, 1);
  assert.match(suiteResult.stderr, /must be a new file under .runtime\/evals/);

  const resourceResult = runEval([
    "--adapter",
    "claude-code-cli",
    "--dry-run",
    "--output",
    "agents/slop-linter.agent.md",
  ]);
  assert.equal(resourceResult.status, 1);
  assert.match(resourceResult.stderr, /must be a new file under .runtime\/evals/);

  for (const path of [
    "config.claude-code.example.json",
    "plugin.json",
    "agents/recon.agent.md",
  ]) {
    const result = runEval(["--adapter", "claude-code-cli", "--output", path]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /must be a new file under .runtime\/evals/);
  }
});

void test("accepts new reports and rejects existing files and redirected directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eval-output-"));
  try {
    const reports = join(root, ".runtime", "evals");
    await validateReportPath(root, join(reports, "new.json"));
    await mkdir(reports, { recursive: true });
    const existing = join(reports, "existing.json");
    await writeFile(existing, "Previous report");
    await assert.rejects(validateReportPath(root, existing), /already exists/);
    await symlink(root, join(reports, "redirect"), "junction");
    await assert.rejects(validateReportPath(root, join(reports, "redirect", "new.json")), /symlinks/);
    await assert.rejects(validateReportPath(root, join(reports, "..", "escape.json")), /new file under/);
    await validateReportPath(root, join(reports, "nested", "new.json"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
