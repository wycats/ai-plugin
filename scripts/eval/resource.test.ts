import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  canonicalResourceDescriptor,
  resolveCanonicalResourcePath,
  validateCanonicalResource,
} from "./resource.ts";

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
