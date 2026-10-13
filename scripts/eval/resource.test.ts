import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  canonicalResourceDescriptor,
  resolveCanonicalResourcePath,
  validateCanonicalResource,
  validateProjectedResource,
} from "./resource.ts";
import { discoverResourceFiles } from "../resource-discovery.ts";
import { loadCanonicalComposition } from "../resource-composition.ts";
import { createProjectionPlan } from "../projection-plan.ts";
import { serializeResourceFrontmatter } from "../resource-frontmatter.ts";

void test("keeps canonical resources reached through links inside the repository", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "eval-resource-"));
  const root = join(temporary, "repo");
  try {
    await mkdir(root);
    const insideDirectory = join(root, "inside");
    const outsideDirectory = join(temporary, "outside");
    await mkdir(insideDirectory);
    await mkdir(outsideDirectory);
    const inside = join(insideDirectory, "resource.md");
    const outside = join(outsideDirectory, "resource.md");
    await writeFile(inside, "Inside");
    await writeFile(outside, "Outside");
    // Directory junctions need no symlink privileges on Windows. Node ignores
    // the type on POSIX, where these become ordinary directory symlinks.
    await symlink(insideDirectory, join(root, "inside-link"), "junction");
    await symlink(outsideDirectory, join(root, "outside-link"), "junction");
    assert.equal(await resolveCanonicalResourcePath(root, "inside-link/resource.md"), join(root, "inside-link", "resource.md"));
    await assert.rejects(resolveCanonicalResourcePath(root, "outside-link/resource.md"), /must resolve inside/);
    if (process.platform !== "win32") {
      await symlink(inside, join(root, "inside-link.md"));
      await symlink(outside, join(root, "outside-link.md"));
      assert.equal(await resolveCanonicalResourcePath(root, "inside-link.md"), join(root, "inside-link.md"));
      await assert.rejects(resolveCanonicalResourcePath(root, "outside-link.md"), /must resolve inside/);
    }
    await assert.rejects(resolveCanonicalResourcePath(root, "../outside/resource.md"), /must resolve inside/);
    await assert.rejects(resolveCanonicalResourcePath(root, "missing.md"), /Canonical resource does not exist: missing.md/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

const source = `---
name: slop-linter
description: Example
---

Instructions.
`;

void test("ties resource name and identity to the canonical source", () => {
  assert.doesNotThrow(() => {
    validateCanonicalResource(
      {
        identity: "wycats-plugin:agents/slop-linter",
        name: "slop-linter",
        path: "agents/slop-linter.agent.md",
      },
      source,
    );
  });
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:agents/review",
          name: "review",
          path: "agents/slop-linter.agent.md",
        },
        source,
      );
    },
    /does not match canonical name 'slop-linter'/,
  );
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:agents/review",
          name: "slop-linter",
          path: "agents/slop-linter.agent.md",
        },
        source,
      );
    },
    /does not match canonical identity 'wycats-plugin:agents\/slop-linter'/,
  );
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "other-plugin:agents/slop-linter",
          name: "slop-linter",
          path: "agents/slop-linter.agent.md",
        },
        source,
      );
    },
    /does not match canonical identity 'wycats-plugin:agents\/slop-linter'/,
  );
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:agents/../agents/review",
          name: "../agents/review",
          path: "agents/../agents/review.agent.md",
        },
        `---\ndescription: Reviews changes.\n---\n\nInstructions.\n`,
      );
    },
    /must use its canonical repository-relative form/,
  );
});

void test("derives an agent name when frontmatter omits it", () => {
  assert.doesNotThrow(() => {
    validateCanonicalResource(
      {
        identity: "wycats-plugin:agents/review",
        name: "review",
        path: "agents/review.agent.md",
      },
      `---\ndescription: Reviews changes.\n---\n\nInstructions.\n`,
    );
  });
});

void test("requires runtime discovery frontmatter", () => {
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:agents/review",
          name: "review",
          path: "agents/review.agent.md",
        },
        `---\nname: review\n---\n\nInstructions.\n`,
      );
    },
    /must declare a non-empty description in frontmatter/,
  );
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:stances/quiet-review",
          name: "quiet-review",
          path: "stances/quiet-review/SKILL.md",
        },
        `---\nname: quiet-review\ndescription: Reviews quietly.\n---\n\nInstructions.\n`,
      );
    },
    /stances must declare 'user-invocable: false'/,
  );
  assert.doesNotThrow(() => {
    validateCanonicalResource(
      {
        identity: "wycats-plugin:stances/quiet-review",
        name: "quiet-review",
        path: "stances/quiet-review/SKILL.md",
      },
      `---\nname: quiet-review\ndescription: Reviews quietly.\nuser-invocable: false\n---\n\nInstructions.\n`,
    );
  });
});

const groupedStanceSource = `---
name: reader-orientation
description: Orient readers around the context they need.
metadata:
  wycats.kind: stance
  wycats.user-invocable: "false"
  wycats.invocation: contextual
---

Read for what the reader needs to know.
`;

void test("validates grouped stance metadata while retaining its stable locator", () => {
  const path = "skills/stances/reader-orientation/SKILL.md";
  assert.deepEqual(canonicalResourceDescriptor(path, groupedStanceSource), {
    kind: "stance",
    name: "reader-orientation",
    locator: "stances/reader-orientation",
  });
  assert.doesNotThrow(() => {
    validateCanonicalResource(
      {
        identity: "wycats-plugin:stances/reader-orientation",
        name: "reader-orientation",
        path,
      },
      groupedStanceSource,
    );
  });
});

void test("uses declared semantic kind and rejects a locator that disagrees with it", () => {
  const path = "skills/workflows/reader-orientation/SKILL.md";
  assert.equal(canonicalResourceDescriptor(path, groupedStanceSource).locator, "stances/reader-orientation");
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:skills/reader-orientation",
          name: "reader-orientation",
          path,
        },
        groupedStanceSource,
      );
    },
    /does not match canonical identity 'wycats-plugin:stances\/reader-orientation'/,
  );
});

void test("nested skill containers retain their leaf name and semantic identity", () => {
  for (const container of ["skills/workflows", "skills/stances", "skills", "stances"]) {
    const path = `${container}/outer/inner/reader-orientation/SKILL.md`;
    assert.deepEqual(canonicalResourceDescriptor(path, groupedStanceSource), {
      kind: "stance",
      name: "reader-orientation",
      locator: "stances/reader-orientation",
    });
    assert.doesNotThrow(() => {
      validateCanonicalResource({
        identity: "wycats-plugin:stances/reader-orientation",
        name: "reader-orientation",
        path,
      }, groupedStanceSource);
    });
  }
});

void test("rejects invalid activation metadata in grouped skill sources", () => {
  const sourceWithInvalidActivation = groupedStanceSource.replace(
    "wycats.invocation: contextual",
    "wycats.invocation: automatic",
  );
  assert.throws(
    () => {
      validateCanonicalResource(
        {
          identity: "wycats-plugin:stances/reader-orientation",
          name: "reader-orientation",
          path: "skills/stances/reader-orientation/SKILL.md",
        },
        sourceWithInvalidActivation,
      );
    },
    /invocation must be 'contextual' or 'explicit'/,
  );
});

void test("requires explicit metadata for grouped workflow and stance sources", () => {
  const sourceWithoutMetadata = `---
name: example
description: Example skill.
---

Instructions.
`;
  for (const [path, locator] of [
    ["skills/workflows/example/SKILL.md", "skills/example"],
    ["skills/stances/example/SKILL.md", "stances/example"],
  ]) {
    assert.throws(
      () => {
        validateCanonicalResource(
          {
            identity: `wycats-plugin:${locator}`,
            name: "example",
            path,
          },
          sourceWithoutMetadata,
        );
      },
      /grouped skill sources require explicit wycats authoring metadata/,
    );
  }
});

void test("evaluation and composition agree on names and kinds across source layouts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eval-source-"));
  const files = {
    "agents/team/reviewer.agent.md": "---\nname: careful-review\ndescription: Review\n---\nReview.",
    "agents/team/unnamed.agent.md": "---\ndescription: Review\n---\nReview.",
    "skills/workflows/outer/reader-orientation/SKILL.md": groupedStanceSource,
  };
  try {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(root, path, ".."), { recursive: true });
      await writeFile(join(root, path), content);
    }
    const { composition, diagnostics } = await loadCanonicalComposition(root, await discoverResourceFiles(root));
    assert.deepEqual(diagnostics, []);
    assert.ok(composition);
    for (const [path, content] of Object.entries(files)) {
      const descriptor = canonicalResourceDescriptor(path, content);
      const parsed = composition.bySourcePath.get(join(root, path));
      assert.ok(parsed);
      assert.equal(descriptor.name, parsed.name);
      assert.equal(descriptor.kind, parsed.kind);
      validateCanonicalResource({ name: parsed.name, path, identity: `wycats-plugin:${descriptor.locator}` }, content);
    }
    assert.equal(canonicalResourceDescriptor("agents/team/reviewer.agent.md", files["agents/team/reviewer.agent.md"]).name, "careful-review");
    assert.equal(canonicalResourceDescriptor("agents/team/unnamed.agent.md", files["agents/team/unnamed.agent.md"]).name, "unnamed");

    const plan = createProjectionPlan(composition, "claude-code", join(root, "out"));
    const stance = plan.resources.find(({ resource }) => resource.kind === "stance");
    assert.ok(stance?.skillMetadata);
    const resource = { name: "reader-orientation", identity: "wycats-plugin:stances/reader-orientation",
      path: "skills/workflows/outer/reader-orientation/SKILL.md" };
    const generated = serializeResourceFrontmatter(stance.skillMetadata.frontmatter, "Stance.");
    assert.doesNotThrow(() => { validateProjectedResource(resource, generated); });
    assert.throws(() => { validateCanonicalResource(resource, generated); }, /explicit wycats authoring metadata/);
    assert.throws(() => { validateProjectedResource(resource, generated.replace("name: reader-orientation", "name: wrong")); }, /does not match canonical name/);
    assert.throws(() => { validateProjectedResource(resource, "---\nname: reader-orientation\n---\n"); }, /non-empty description/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
