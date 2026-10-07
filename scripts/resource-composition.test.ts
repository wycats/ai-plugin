import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { discoverResourceFiles } from "./resource-discovery.ts";
import {
  loadCanonicalComposition,
  parseCompositionLinks,
  projectCompositionLinks,
} from "./resource-composition.ts";
import { assertSafeOutputOverride, prepareProjectionOutput } from "./projection-output.ts";

async function fixture(
  files: Record<string, string>,
): Promise<{ root: string; dispose: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "composition-fixture-"));
  for (const [path, content] of Object.entries(files)) {
    const fullPath = join(root, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }
  return { root, dispose: () => rm(root, { recursive: true, force: true }) };
}

function skill(name: string, body: string): string {
  return `---\nname: ${name}\ndescription: Fixture ${name}\n---\n\n# ${name}\n\n${body}\n`;
}

void test("discovery keeps plugin paths portable and source paths native", async () => {
  const { root, dispose } = await fixture({
    "agents/nested/review.agent.md": "Agent fixture.",
    "skills/source/SKILL.md": skill("source", "Workflow."),
    "stances/target/SKILL.md": skill("target", "Stance."),
  });
  try {
    const discovered = await discoverResourceFiles(root);
    for (const [section, path] of [
      ["agents", "agents/nested/review.agent.md"],
      ["skills", "skills/source/SKILL.md"],
      ["stances", "stances/target/SKILL.md"],
    ] as const) {
      assert.equal(discovered[section][0].pluginPath, `./${path}`);
      assert.equal(discovered[section][0].sourcePath, join(root, path));
    }
  } finally {
    await dispose();
  }
});

void test("projects quoted composition links and preserves every non-destination byte", async () => {
  const { root, dispose } = await fixture({
    "skills/source/SKILL.md": skill(
      "source",
      "Load [Target](../../stances/target/SKILL.md 'composition:load') now.\nKeep [docs](../../README.md) ordinary.",
    ),
    "stances/target/SKILL.md": skill("target", "Target body."),
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    assert.deepEqual(result.diagnostics, []);
    assert.ok(result.composition);
    const source = join(root, "skills/source/SKILL.md");
    const target = join(root, "stances/target/SKILL.md");
    const sourceOutput = join(root, "output/skills/source/SKILL.md");
    const targetOutput = join(root, "output/skills/target/SKILL.md");
    const original = skill(
      "source",
      "Load [Target](../../stances/target/SKILL.md 'composition:load') now.\nKeep [docs](../../README.md) ordinary.",
    );
    const projected = projectCompositionLinks(
      original,
      source,
      sourceOutput,
      result.composition,
      new Map([
        [source, sourceOutput],
        [target, targetOutput],
      ]),
    );
    const expected = original.replace(
      "../../stances/target/SKILL.md",
      "../target/SKILL.md",
    );
    assert.equal(projected, expected);
  } finally {
    await dispose();
  }
});

void test("accepts cycles without recursively expanding the graph", async () => {
  const { root, dispose } = await fixture({
    "stances/a/SKILL.md": skill(
      "a",
      '[B](../b/SKILL.md "composition:reference")',
    ),
    "stances/b/SKILL.md": skill(
      "b",
      '[A](../a/SKILL.md "composition:reference")',
    ),
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.composition?.references.length, 2);
  } finally {
    await dispose();
  }
});

void test("reports canonical identity collisions", async () => {
  const { root, dispose } = await fixture({
    "skills/shared/SKILL.md": skill("shared", "Workflow."),
    "stances/other/SKILL.md": skill("shared", "Stance."),
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    assert.match(
      result.diagnostics.map((item) => item.message).join("\n"),
      /canonical identity 'skill:shared' collides/,
    );
  } finally {
    await dispose();
  }
});

void test("reports unknown relationships, marker typos, and unresolved targets with file lines", async () => {
  const { root, dispose } = await fixture({
    "skills/source/SKILL.md": skill(
      "source",
      [
        "ordinary line",
        '[Unknown](../../stances/target/SKILL.md "composition:activate")',
        '[Typo](../../stances/target/SKILL.md "compositon:load")',
        '[EarlyDeletion](../../stances/target/SKILL.md "comosition:load")',
        '[Transposition](../../stances/target/SKILL.md "copmosition:reference")',
        '[Missing](../../stances/missing/SKILL.md "composition:load")',
      ].join("\n"),
    ),
    "stances/target/SKILL.md": skill("target", "Target."),
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    assert.equal(result.diagnostics.length, 5);
    assert.deepEqual(
      result.diagnostics.map((item) => item.line),
      [9, 10, 11, 12, 13],
    );
    const messages = result.diagnostics.map((item) => item.message).join("\n");
    assert.match(messages, /unsupported composition relationship title 'composition:activate'/);
    assert.match(messages, /unsupported composition relationship title 'compositon:load'/);
    assert.match(messages, /unsupported composition relationship title 'comosition:load'/);
    assert.match(messages, /unsupported composition relationship title 'copmosition:reference'/);
    assert.match(messages, /does not resolve to a discovered canonical resource/);
  } finally {
    await dispose();
  }
});

void test("rejects missing and non-relative canonical targets", async () => {
  const { root, dispose } = await fixture({
    "skills/source/SKILL.md": skill(
      "source",
      [
        '[Empty](<> "composition:load")',
        '[External](https://example.com/stance.md "composition:reference")',
        '[Fragment](../../stances/target/SKILL.md#section "composition:load")',
      ].join("\n"),
    ),
    "stances/target/SKILL.md": skill("target", "Target."),
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    const messages = result.diagnostics.map((item) => item.message).join("\n");
    assert.match(messages, /missing a canonical target/);
    assert.match(messages, /must be an unqualified canonical relative Markdown path/);
    assert.equal(result.diagnostics.length, 3);
  } finally {
    await dispose();
  }
});

void test("preflight failure preserves the existing output directory", async () => {
  const { root, dispose } = await fixture({
    "skills/source/SKILL.md": skill(
      "source",
      '[Target](../../stances/target/SKILL.md "composition:load")',
    ),
    "stances/target/SKILL.md": skill("target", "Target."),
    "generated/sentinel.txt": "keep me\n",
  });
  try {
    const result = await loadCanonicalComposition(
      root,
      await discoverResourceFiles(root),
    );
    assert.ok(result.composition);
    const source = result.composition.resources.find(
      (resource) => resource.identity === "skill:source",
    );
    assert.ok(source);
    await assert.rejects(
      prepareProjectionOutput({
        outDir: join(root, "generated"),
        target: "fixture-target",
        composition: result.composition,
        outputBySourcePath: new Map([
          [source.sourcePath, join(root, "generated/skills/source/SKILL.md")],
        ]),
      }),
      /Target projection validation failed before output cleanup.*not projected for target 'fixture-target'/s,
    );
    assert.equal(
      await readFile(join(root, "generated/sentinel.txt"), "utf-8"),
      "keep me\n",
    );
  } finally {
    await dispose();
  }
});

void test("reports malformed marked links but ignores literal fenced and inline examples", () => {
  const content = [
    '[Broken](../target/SKILL.md "composition:load"',
    "`[Inline](../target/SKILL.md \"composition:load\")`",
    "```markdown",
    '[Fenced](../target/SKILL.md "composition:activate")',
    "```",
    "> ```markdown",
    '> [Blockquoted](../target/SKILL.md "composition:activate")',
    "> ```",
    'Bare "composition:load" marker',
    '[Documentation](guide.md "composition guide")',
  ].join("\n");
  const result = parseCompositionLinks(content, "fixture.md");
  assert.deepEqual(result.diagnostics, [
    {
      file: "fixture.md",
      line: 1,
      message:
        'malformed composition link; use [label](relative/path "composition:load") or "composition:reference"',
    },
    {
      file: "fixture.md",
      line: 9,
      message:
        "composition marker must appear as the title of a supported inline Markdown link",
    },
  ]);
  assert.deepEqual(result.links, []);
});

void test("output overrides preserve source, unrelated data, and symlink targets", async () => {
  const { root, dispose } = await fixture({
    "repo/source.md": "canonical source",
    "occupied/sentinel": "unrelated data",
  });
  try {
    const source = join(root, "repo");
    await assert.rejects(assertSafeOutputOverride(source, source), /outside/);
    await assert.rejects(assertSafeOutputOverride(source, join(source, "skills")), /outside/);
    await assert.rejects(assertSafeOutputOverride(source, root), /ancestors/);
    await assert.rejects(assertSafeOutputOverride(source, join(root, "occupied")), /empty directory/);
    // Junctions exercise physical containment on Windows without symlink privileges.
    // On other platforms Node creates ordinary directory symlinks.
    await symlink(source, join(root, "source-link"), "junction");
    await assert.rejects(assertSafeOutputOverride(source, join(root, "source-link", "new")), /outside/);
    await symlink(join(root, "occupied"), join(root, "output-link"), "junction");
    await assert.rejects(assertSafeOutputOverride(source, join(root, "output-link")), /symlink/);
    await mkdir(join(root, "empty"));
    await assertSafeOutputOverride(source, join(root, "empty"));
    await assertSafeOutputOverride(source, join(root, "fresh", "nested"));
    assert.equal(await readFile(join(source, "source.md"), "utf8"), "canonical source");
    assert.equal(await readFile(join(root, "occupied", "sentinel"), "utf8"), "unrelated data");
  } finally {
    await dispose();
  }
});
