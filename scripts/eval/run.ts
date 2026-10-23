import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAdapter } from "./adapters/index.ts";
import type { ResourceInvocation } from "./adapters/adapter.ts";
import {
  buildCanonicalPrompt,
  gradeResponse,
  parseEvaluationResponse,
  type EvaluationCase,
  type EvaluationResponse,
  type Grade,
} from "./core.ts";
import {
  buildEditorialPrompt,
  loadBehavioralSuiteSnapshot,
  protocolMaxTurns,
  recordEditorialReading,
  type BehavioralSuite,
  type EditorialCase,
} from "./editorial.ts";
import { resolveCanonicalResourcePath, validateCanonicalResource, validateProjectedResource } from "./resource.ts";
import { validateReportPath } from "./output.ts";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DEFAULT_SUITE = join(ROOT, "evals", "editorial-reader", "cases.json");

interface Options {
  adapter: "claude-code-cli";
  suitePath: string;
  caseId?: string;
  outputPath?: string;
  dryRun: boolean;
}

interface EvaluationResult {
  id: string;
  description: string;
  canonicalPrompt: string;
  projectedPrompt: string;
  durationMs?: number;
  rawResponse?: string;
  transportOutput?: string;
  resourceInvocation?: ResourceInvocation;
  stderr?: string;
  exitCode?: number | null;
  executionError?: string;
  error?: string;
  response?: EvaluationResponse;
  grade?: Grade;
  reading?: string;
  assessment?: ReturnType<typeof recordEditorialReading>["assessment"];
}

function usage(): string {
  return `Usage: pnpm eval -- --adapter claude-code-cli [options]

Options:
  --suite <path>   Evaluation suite (default: evals/editorial-reader/cases.json)
  --case <id>      Run one case
  --output <path>  New file under .runtime/evals/ (default: timestamp-claude-code-cli.json)
  --dry-run        Print case prompts without invoking the target`;
}

function argumentError(message: string): never {
  throw new Error(`${message}\n\n${usage()}`);
}

function optionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) argumentError(`Missing value for ${option}.`);
  return value;
}

function parseOptions(args = process.argv.slice(2)): Options {
  let adapter: string | undefined;
  let suitePath = DEFAULT_SUITE;
  let caseId: string | undefined;
  let outputPath: string | undefined;
  let dryRun = false;

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--") continue;
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--adapter" || argument === "--suite" || argument === "--case" || argument === "--output") {
      const value = optionValue(args, index, argument);
      if (argument === "--adapter") adapter = value;
      if (argument === "--suite") suitePath = resolve(ROOT, value);
      if (argument === "--case") caseId = value;
      if (argument === "--output") outputPath = resolve(ROOT, value);
      index++;
      continue;
    }
    argumentError(`Unknown argument: ${argument}`);
  }

  if (adapter !== "claude-code-cli") {
    argumentError(adapter ? `Unsupported adapter: ${adapter}.` : "Missing --adapter.");
  }
  return { adapter: "claude-code-cli", suitePath, caseId, outputPath, dryRun };
}

type BehavioralCase = EvaluationCase | EditorialCase;

function selectCases(cases: BehavioralCase[], caseId?: string): BehavioralCase[] {
  if (!caseId) return cases;
  const selected = cases.find((testCase) => testCase.id === caseId);
  if (!selected) throw new Error(`Suite does not contain case '${caseId}'.`);
  return [selected];
}

function buildPrompt(suite: BehavioralSuite, testCase: BehavioralCase): string {
  if (suite.protocol === "editorial-reading/v1" && "reviewQuestions" in testCase) {
    return buildEditorialPrompt(suite, testCase);
  }
  if (suite.protocol === "document-review/v1" && "expect" in testCase) {
    return buildCanonicalPrompt(suite, testCase);
  }
  throw new Error("Evaluation case does not match the suite protocol.");
}

function displayPath(path: string): string {
  if (!isAbsolute(path)) return path;
  const local = relative(ROOT, path);
  return local.startsWith("..") ? path : local;
}

function defaultOutputPath(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join(ROOT, ".runtime", "evals", `${timestamp}-claude-code-cli.json`);
}

function sha256(source: string): string {
  const digest = createHash("sha256").update(source).digest("hex");
  return `sha256:${digest}`;
}

async function assertSnapshotUnchanged(path: string, source: string, label: string): Promise<void> {
  if ((await readFile(path, "utf-8")) !== source) {
    throw new Error(`${label} changed while the evaluation was being prepared: ${displayPath(path)}.`);
  }
}

function adapterFailureMessage(message: string, stderr?: string): string {
  const detail = stderr?.trim() ?? "";
  if (!detail) return message;
  const limit = 1_000;
  const snippet = detail.length > limit ? `${detail.slice(0, limit)}…` : detail;
  return `${message}\nAdapter stderr: ${snippet}`;
}

async function run(): Promise<void> {
  const options = parseOptions();
  const { suite, source: suiteSource } = await loadBehavioralSuiteSnapshot(options.suitePath);
  const cases = selectCases(suite.cases, options.caseId);
  const resourcePath = await resolveCanonicalResourcePath(ROOT, suite.resource.path);
  const resourceSource = await readFile(resourcePath, "utf-8");
  validateCanonicalResource(suite.resource, resourceSource);
  const resourceDigest = sha256(resourceSource);
  const suiteDigest = sha256(suiteSource);
  const outputPath = options.outputPath ?? defaultOutputPath();
  const adapter = createAdapter(options.adapter, ROOT);
  await validateReportPath(ROOT, outputPath);

  if (options.dryRun) {
    console.log(`Suite: ${displayPath(options.suitePath)}`);
    console.log(`Resource: ${suite.resource.identity} (${suite.resource.path})`);
    console.log(`Resource digest: ${resourceDigest}`);
    console.log(`Suite digest: ${suiteDigest}`);
    console.log(`Adapter: ${options.adapter}`);
    console.log(`Target: ${adapter.target}`);
    console.log(`Transport: ${adapter.transport}`);
    for (const testCase of cases) {
      console.log(`\n--- ${testCase.id}: ${testCase.description} ---\n`);
      const canonicalPrompt = buildPrompt(suite, testCase);
      console.log("Canonical request:\n");
      console.log(canonicalPrompt);
      console.log("\nTarget projection:\n");
      console.log(adapter.projectPrompt(suite, canonicalPrompt));
    }
    return;
  }

  const adapterMetadata = await adapter.prepare();
  await Promise.all([
    assertSnapshotUnchanged(options.suitePath, suiteSource, "Evaluation suite"),
    assertSnapshotUnchanged(resourcePath, resourceSource, "Canonical resource"),
  ]);
  const projectedResourcePath = adapter.projectedResourcePath(suite.resource);
  const projectedResourceSource = await readFile(projectedResourcePath, "utf-8");
  validateProjectedResource(suite.resource, projectedResourceSource);
  const execution = {
    ...adapterMetadata,
    maxTurns: protocolMaxTurns(suite.protocol),
    projectedResource: {
      path: displayPath(projectedResourcePath),
      digest: sha256(projectedResourceSource),
    },
  };
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf-8",
  }).trim();
  const sourceTreeDirty = execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf-8",
  }).trim() !== "";
  const startedAt = new Date().toISOString();
  const results: EvaluationResult[] = [];

  for (const testCase of cases) {
    process.stdout.write(`${testCase.id}... `);
    const canonicalPrompt = buildPrompt(suite, testCase);
    const projectedPrompt = adapter.projectPrompt(suite, canonicalPrompt);
    let rawResponse: string | undefined;
    let transportOutput: string | undefined;
    let resourceInvocation: ResourceInvocation | undefined;
    let stderr: string | undefined;
    let durationMs: number | undefined;
    let exitCode: number | null | undefined;
    let executionError: string | undefined;
    try {
      await assertSnapshotUnchanged(
        projectedResourcePath,
        projectedResourceSource,
        "Projected resource",
      );
      const observation = adapter.execute({
        canonicalPrompt,
        projectedPrompt,
        resource: suite.resource,
        maxTurns: execution.maxTurns,
      });
      rawResponse = observation.rawResponse;
      transportOutput = observation.transportOutput;
      resourceInvocation = observation.resourceInvocation;
      stderr = observation.stderr;
      durationMs = observation.durationMs;
      exitCode = observation.exitCode;
      executionError = observation.executionError;
      await assertSnapshotUnchanged(
        projectedResourcePath,
        projectedResourceSource,
        "Projected resource",
      );
      if (executionError || exitCode !== 0) {
        throw new Error(
          adapterFailureMessage(
            executionError ?? `${adapter.id} exited with status ${String(exitCode)}.`,
            stderr,
          ),
        );
      }
      const captured: EvaluationResult = {
        id: testCase.id,
        description: testCase.description,
        canonicalPrompt,
        projectedPrompt,
        durationMs,
        rawResponse: observation.rawResponse,
        transportOutput,
        resourceInvocation,
        stderr,
        exitCode,
      };
      if (suite.protocol === "editorial-reading/v1" && "reviewQuestions" in testCase) {
        results.push({ ...captured, ...recordEditorialReading(testCase, observation.rawResponse) });
        console.log("captured; awaiting human review");
      } else if (suite.protocol === "document-review/v1" && "expect" in testCase) {
        const response = parseEvaluationResponse(observation.rawResponse);
        const grade = gradeResponse(testCase, response);
        results.push({ ...captured, response, grade });
        console.log(grade.passed ? "passed" : `failed: ${grade.failures.join(" ")}`);
      } else {
        throw new Error("Evaluation case does not match the suite protocol.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        id: testCase.id,
        description: testCase.description,
        canonicalPrompt,
        projectedPrompt,
        durationMs,
        rawResponse,
        transportOutput,
        resourceInvocation,
        stderr,
        exitCode,
        executionError,
        error: message,
        ...(suite.protocol === "document-review/v1"
          ? { grade: { passed: false, failures: [message], observedFindingLabels: [] } }
          : {}),
      });
      console.log(`failed: ${message}`);
    }
  }

  await validateReportPath(ROOT, outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await validateReportPath(ROOT, outputPath);
  const report = {
    schemaVersion: 1,
    suite: {
      path: displayPath(options.suitePath),
      protocol: suite.protocol,
      resource: suite.resource,
      description: suite.description,
      suiteDigest,
      resourceDigest,
      sourceRevision: revision,
      sourceTreeDirty,
    },
    execution,
    startedAt,
    completedAt: new Date().toISOString(),
    results,
  };
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });

  if (suite.protocol === "editorial-reading/v1") {
    const captured = results.filter((result) => result.assessment !== undefined).length;
    console.log(`\n${String(captured)} readings await human review; ${String(results.length - captured)} capture failures.`);
    if (captured !== results.length) process.exitCode = 1;
  } else {
    const passed = results.filter((result) => result.grade?.passed).length;
    console.log(`\n${String(passed)}/${String(results.length)} cases passed.`);
    if (passed !== results.length) process.exitCode = 1;
  }
  console.log(`Result: ${displayPath(outputPath)}`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
