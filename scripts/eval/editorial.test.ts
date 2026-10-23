import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildEditorialPrompt,
  loadBehavioralSuiteSnapshot,
  parseBehavioralSuiteSource,
  parseEditorialSuite,
  protocolMaxTurns,
  recordEditorialReading,
} from "./editorial.ts";

const suitePath = new URL("../../evals/editorial-reader/cases.json", import.meta.url);

async function editorialSuite() {
  const suite = parseEditorialSuite(JSON.parse(await readFile(suitePath, "utf8")) as unknown);
  return suite;
}

void test("presents the audience and sources without disclosing assessment notes or a response schema", async () => {
  const suite = await editorialSuite();
  for (const entry of suite.cases) {
    const prompt = buildEditorialPrompt(suite, entry);
    assert.match(prompt, /first encounter/);
    assert.match(prompt, /questions as a continuation point/);
    assert.doesNotMatch(prompt, /reviewQuestions|rewrittenDocument|requiredFindings|Return only a JSON|Every action must remove/);
    for (const question of entry.reviewQuestions) assert.ok(!prompt.includes(question));
    assert.ok(!prompt.includes(entry.description));
    const payload = JSON.parse(prompt.slice(prompt.indexOf('{"audience":'))) as unknown;
    assert.deepEqual(payload, {
      audience: entry.audience,
      purpose: entry.purpose,
      assignment: entry.assignment,
      document: entry.document,
      context: entry.context,
    });
  }
});

void test("records retention, questions, investigation, and revisions without grading their quality", async () => {
  const suite = await editorialSuite();
  const entry = suite.cases[0];
  for (const reading of [
    'I would retain "The refresh interval remains five minutes." It answers these users\' existing concern.',
    "Should the introduction lead readers toward using the plugin or toward the instruction-design essays?",
    "The implementation retains a pending calculation until it completes. Concurrent requests can share it; later requests calculate again.",
    "Proposed prose:\n\nExports now preserve your saved column order. The refresh interval remains five minutes.\n",
  ]) {
    const record = recordEditorialReading(entry, reading);
    assert.equal(record.reading, reading);
    assert.deepEqual(record.assessment, {
      status: "awaiting-human-review",
      stage: "first-encounter",
      reviewQuestions: entry.reviewQuestions,
    });
    assert.equal("grade" in record, false);
    assert.equal("passed" in record, false);
  }
  assert.throws(() => recordEditorialReading(entry, " \n"), /returned no reading/);
});

void test("validates the new protocol while keeping legacy document-review parsing available", async () => {
  const source = await readFile(suitePath, "utf8");
  assert.equal(parseBehavioralSuiteSource(source, "editorial.json").protocol, "editorial-reading/v1");
  const legacy = await loadBehavioralSuiteSnapshot(new URL("../../evals/slop-linter/cases.json", import.meta.url).pathname);
  assert.equal(legacy.suite.protocol, "document-review/v1");
  assert.throws(() => parseBehavioralSuiteSource(source.replace('"schemaVersion": 1,', '"schemaVersion": 1, "schemaVersion": 1,'), "duplicate.json"), /duplicate member/);
  const suite = await editorialSuite();
  assert.throws(() => parseEditorialSuite({ ...suite, cases: [suite.cases[0], suite.cases[0]] }), /Duplicate case/);
  assert.throws(() => parseEditorialSuite({ ...suite, cases: [{ ...suite.cases[0], expect: { maximumFindings: 0 } }] }), /Unrecognized key/);
  assert.throws(() => parseEditorialSuite({ ...suite, cases: [{ ...suite.cases[0], reviewQuestions: [] }] }), /reviewQuestions/);
});

void test("allocates bounded source-reading turns separately from the legacy parser protocol", () => {
  assert.equal(protocolMaxTurns("editorial-reading/v1"), 12);
  assert.equal(protocolMaxTurns("document-review/v1"), 3);
});

void test("preserves pilot bytes and maps the recorded input digests to archived snapshots", async () => {
  const pilot = new URL("../../evals/editorial-reader/pilot/", import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("archive.json", pilot), "utf8")) as {
    originalSourceRoot: string;
    files: { archive: string; source: string; sha256: string }[];
  };
  assert.equal(manifest.originalSourceRoot, ".runtime/editorial-rethink/reader-pilot/");
  for (const file of manifest.files) {
    const bytes = await readFile(new URL(file.archive, pilot));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256, file.archive);
  }
  const inputs = JSON.parse(await readFile(new URL("inputs.json", pilot), "utf8")) as Record<string, string>;
  for (const [input, digest] of Object.entries(inputs)) {
    const source: string = input === "README.md" ? `${manifest.originalSourceRoot}readme-before.md` : input;
    const archived = manifest.files.find((file) => file.source === source);
    assert.ok(archived, `Missing pilot input snapshot: ${input}`);
    assert.equal(archived.sha256, digest, input);
  }
});
