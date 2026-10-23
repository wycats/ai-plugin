/**
 * Smoke tests for the Claude Code plugin.
 *
 * Builds the CC target, then runs a series of non-interactive prompts
 * to verify agents, skills, and hooks are working.
 *
 * Requires: Claude Code CLI authenticated.
 */

import { execSync, spawnSync } from "node:child_process";
import { readFile, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findClaudeCommand, type ClaudeCommand } from "./claude-executable.ts";
import { claudeCodeInvocation, parseClaudeCodeStream } from "./eval/adapters/claude-code.ts";
import type { EvaluationResource } from "./eval/core.ts";
import type { ResourceInvocation } from "./eval/adapters/adapter.ts";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CC_OUT = join(ROOT, "out", "claude-code");
const CONFIG_PATH = join(ROOT, "config.json");
const CC_EXAMPLE = join(ROOT, "config.claude-code.example.json");

function requireClaudeCommand(): ClaudeCommand {
  const command = findClaudeCommand();
  if (!command) {
    console.error("Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code");
    process.exit(1);
  }
  return command;
}

const CLAUDE = requireClaudeCommand();

const EXPECTED_AGENTS = [
  "recon",
  "recon-worker",
  "editorial-reader",
];

const EXPECTED_SKILLS = [
  "per-cycle",
  "recon",
  "walkthrough",
];

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

interface ClaudeInvocation {
  output: string;
  failure?: string;
  resourceInvocation?: ResourceInvocation;
}

const results: TestResult[] = [];

function cc(prompt: string, maxTurns = 3, resource?: EvaluationResource): ClaudeInvocation {
  const invocation = resource ? claudeCodeInvocation(resource, "wycats", prompt, prompt) : undefined;
  const result = spawnSync(
    CLAUDE.executable,
    [
      ...CLAUDE.argumentPrefix,
      "--plugin-dir",
      CC_OUT,
      ...(invocation?.resourceArguments ?? []),
      "-p",
      prompt,
      "--output-format",
      resource ? "stream-json" : "text",
      ...(resource ? ["--verbose"] : []),
      "--max-turns",
      String(maxTurns),
    ],
    {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (result.error) return { output: "", failure: result.error.message };
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || "No process output.";
    const outcome =
      result.status === null
        ? `was terminated by signal ${result.signal ?? "unknown"}`
        : `exited with status ${String(result.status)}`;
    return {
      output: "",
      failure: `Claude Code CLI ${outcome}: ${detail}`,
    };
  }
  if (resource) {
    try {
      const parsed = parseClaudeCodeStream(result.stdout, resource, "wycats", invocation?.directInvocation);
      return { output: parsed.result, resourceInvocation: parsed.resourceInvocation };
    } catch (error) {
      return { output: result.stdout, failure: error instanceof Error ? error.message : String(error) };
    }
  }
  return { output: result.stdout };
}

async function ensureCCBuild(): Promise<void> {
  let originalConfig = "";
  let needsRestore = false;

  try {
    originalConfig = await readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(originalConfig) as { target?: string };
    if (config.target !== "claude-code") {
      needsRestore = true;
      await writeFile(CONFIG_PATH, await readFile(CC_EXAMPLE, "utf-8"));
    }
  } catch {
    needsRestore = true;
    await writeFile(CONFIG_PATH, await readFile(CC_EXAMPLE, "utf-8"));
  }

  try {
    execSync("node scripts/build.ts", { cwd: ROOT, stdio: "inherit" });
  } finally {
    if (needsRestore) {
      if (originalConfig) {
        await writeFile(CONFIG_PATH, originalConfig);
      } else {
        await rm(CONFIG_PATH, { force: true });
      }
    }
  }
}

function test(name: string, fn: () => boolean | string) {
  process.stdout.write(`  ${name}... `);
  try {
    const result = fn();
    if (result === true || result === "") {
      results.push({ name, passed: true, detail: "" });
      console.log("✓");
    } else {
      results.push({ name, passed: false, detail: typeof result === "string" ? result : "failed" });
      console.log(`✗ ${typeof result === "string" ? result : ""}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, detail: msg });
    console.log(`✗ ${msg}`);
  }
}

async function run() {
  console.log("Building CC plugin...\n");
  await ensureCCBuild();

  console.log("\nRunning smoke tests...\n");

  // Test 1: All agents visible
  // CC namespaces plugin agents as "plugin-name:agent-name"
  const agentOutput = cc("List every plugin agent and plugin skill you have. Full names, one per line.", 2);

  test("All agents visible", () => {
    if (agentOutput.failure) return agentOutput.failure;
    const missing = EXPECTED_AGENTS.filter(
      (a) => !agentOutput.output.includes(`:${a}`) && !agentOutput.output.includes(a),
    );
    return missing.length === 0 ? true : `missing: ${missing.join(", ")}`;
  });

  // Test 2: All skills visible (checks the same output)
  test("All skills visible", () => {
    if (agentOutput.failure) return agentOutput.failure;
    const missing = EXPECTED_SKILLS.filter(
      (s) => !agentOutput.output.includes(`:${s}`) && !agentOutput.output.includes(s),
    );
    return missing.length === 0 ? true : `missing: ${missing.join(", ")}`;
  });

  // Test 3: Hook blocks npm
  const hookOutput = cc("Run this exact bash command: npm install leftpad. Tell me if it was blocked or allowed.", 4);

  test("Hook blocks npm", () => {
    if (hookOutput.failure) return hookOutput.failure;
    return hookOutput.output.toLowerCase().includes("block") ||
      hookOutput.output.toLowerCase().includes("denied") ||
      hookOutput.output.toLowerCase().includes("pnpm")
      ? true
      : `expected block, got: ${hookOutput.output.slice(0, 100)}`;
  });

  // Test 4: Native invocation works even when the role is not user-invocable.
  // This is a transport smoke check; the editorial evaluation needs human review.
  const editorialOutput = cc(
    'Read this release note for users deciding whether to upgrade: "Exports now keep the column order from your saved view. The refresh interval remains five minutes." Return what helps the writer continue. Keep proposed prose in your response.',
    12,
    {
      identity: "wycats-plugin:agents/editorial-reader",
      name: "editorial-reader",
      path: "agents/editorial-reader.agent.md",
    },
  );

  test("Editorial Reader native invocation returns a reading", () => {
    if (editorialOutput.failure) return editorialOutput.failure;
    if (editorialOutput.resourceInvocation?.resource !== "wycats:editorial-reader") {
      return "missing editorial-reader invocation evidence";
    }
    return editorialOutput.output.trim() !== "" ? true : "empty editorial reading";
  });

  // Test 5: Recon reads files
  const reconOutput = cc(
    "Use the recon skill. What file does the build script read config from? Answer in one sentence.",
    5,
  );

  test("Recon reads codebase", () => {
    if (reconOutput.failure) return reconOutput.failure;
    return reconOutput.output.includes("config.json")
      ? true
      : `expected mention of config.json: ${reconOutput.output.slice(0, 100)}`;
  });

  // Summary
  console.log("");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  if (failed > 0) {
    console.log(`${String(passed)} passed, ${String(failed)} failed:\n`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  ✗ ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  } else {
    console.log(`All ${String(passed)} tests passed.`);
  }
}

run().catch((err: unknown) => {
  console.error("Test failed:", err);
  process.exit(1);
});
