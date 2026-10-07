import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import test from "node:test";
import { findClaudeCommand, findClaudeCommandBelow, resolveClaudeCommand } from "../../claude-executable.ts";
import {
  ClaudeCodeCliAdapter,
  claudeCodeInvocation,
  parseClaudeCodeStream,
  parseClaudeCodeConfig,
  validateClaudeCodeProjection,
  withConfigSnapshot,
} from "./claude-code.ts";
import type { EvaluationSuite } from "../core.ts";

const suite: EvaluationSuite = {
  schemaVersion: 1,
  protocol: "document-review/v1",
  resource: {
    identity: "wycats-plugin:agents/slop-linter",
    name: "slop-linter",
    path: "agents/slop-linter.agent.md",
  },
  description: "Example suite",
  cases: [
    {
      id: "example",
      description: "Example case",
      document: "Example document.",
      expect: { rewriteEqualsInput: true },
    },
  ],
};

function testAdapter(): { adapter: ClaudeCodeCliAdapter; root: string } {
  const root = mkdtempSync(join(tmpdir(), "claude-adapter-"));
  writeFileSync(join(root, "plugin.json"), '{"name":"wycats-ai-plugin"}\n');
  const projection = join(root, "out", "claude-code");
  mkdirSync(projection, { recursive: true });
  writeFileSync(join(projection, "projection-resources.json"), JSON.stringify({
    schemaVersion: 1, target: "claude-code", resources: [
      { canonicalSource: "./agents/slop-linter.agent.md", generatedSource: "./agents/custom-review.agent.md", identity: "agent:slop-linter", exposure: "public" },
      { canonicalSource: "./stances/relational-continuity/SKILL.md", generatedSource: "./skills/relational-continuity/SKILL.md", identity: "skill:relational-continuity", exposure: "private" },
    ],
  }));
  return { adapter: new ClaudeCodeCliAdapter(root), root };
}

void test("supplies captured config bytes and cleans up after build failure", async () => {
  const source = '{"target":"claude-code","models":{"balanced":"sonnet"}}';
  let snapshotPath = "";
  await assert.rejects(withConfigSnapshot(source, (path) => {
    snapshotPath = path;
    assert.equal(readFileSync(path, "utf-8"), source);
    throw new Error("Build failed");
  }), /Build failed/);
  assert.ok(snapshotPath);
  assert.equal(existsSync(snapshotPath), false);
});

void test("requires a Claude Code build target and concrete model mapping", () => {
  assert.throws(() => parseClaudeCodeConfig({ target: "codex", models: { balanced: "sonnet" } }), /must target claude-code/);
  assert.throws(() => parseClaudeCodeConfig({ target: "claude-code" }), /models object/);
  assert.throws(() => parseClaudeCodeConfig({ target: "claude-code", models: { balanced: 42 } }), /non-empty string or null/);
  assert.throws(() => parseClaudeCodeConfig({ target: "claude-code", models: { balanced: null } }), /concrete balanced/);
  assert.deepEqual(parseClaudeCodeConfig({ target: "claude-code", models: { balanced: "sonnet", auxiliary: null } }), { models: { balanced: "sonnet", auxiliary: null } });
});

void test("rejects skill and stance names that share a Claude projection", async () => {
  const { root } = testAdapter();
  try {
    for (const section of ["skills", "stances"]) {
      mkdirSync(join(root, section, "shared"), { recursive: true });
      writeFileSync(join(root, section, "shared", "SKILL.md"), "---\nname: shared\ndescription: Fixture\n---\nResource body");
    }
    await assert.rejects(validateClaudeCodeProjection(root), /canonical identity 'skill:shared' collides/);
    rmSync(join(root, "stances", "shared", "SKILL.md"));
    await validateClaudeCodeProjection(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test("skips directories on PATH and accepts executable symlinks", { skip: process.platform === "win32" }, () => {
  const root = mkdtempSync(join(tmpdir(), "claude-path-"));
  const originalPath = process.env.PATH;
  try {
    const first = join(root, "first");
    const second = join(root, "second");
    mkdirSync(join(first, "claude"), { recursive: true });
    mkdirSync(second);
    const target = join(root, "cli");
    writeFileSync(target, "#!/bin/sh\nexit 0\n");
    chmodSync(target, 0o755);
    const command = join(second, "claude");
    symlinkSync(target, command);
    process.env.PATH = [first, second].join(delimiter);
    assert.equal(findClaudeCommand()?.discoveredPath, command);
    assert.equal(findClaudeCommandBelow(root)?.discoveredPath, command);
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    rmSync(root, { recursive: true, force: true });
  }
});

void test("launches Windows npm command shims through their Node entrypoint", () => {
  const prefix = mkdtempSync(join(tmpdir(), "claude-command-"));
  try {
    const cli = join(prefix, "node_modules", "@anthropic-ai", "claude-code", "cli.js");
    mkdirSync(join(prefix, "node_modules", "@anthropic-ai", "claude-code"), {
      recursive: true,
    });
    writeFileSync(cli, "");
    for (const extension of ["cmd", "bat"]) {
      const shim = join(prefix, `claude.${extension}`);
      writeFileSync(shim, "@echo off\n");
      assert.deepEqual(resolveClaudeCommand(shim, "win32"), {
        discoveredPath: shim,
        executable: process.execPath,
        argumentPrefix: [cli],
      });
    }
  } finally {
    rmSync(prefix, { recursive: true, force: true });
  }
});

void test("adds only the Claude Code invocation envelope to a canonical request", () => {
  const { adapter, root } = testAdapter();
  try {
    assert.equal(adapter.id, "claude-code-cli");
    assert.equal(adapter.target, "claude-code");
    assert.equal(adapter.transport, "cli");
    const canonicalPrompt = "Canonical request";
    assert.equal(adapter.projectPrompt(suite, canonicalPrompt), "Canonical request");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test("uses built resource addresses while invoking skills and stances through Claude Code's skill surface", () => {
  const { adapter, root } = testAdapter();
  try {
    const stanceSuite: EvaluationSuite = {
      ...suite,
      resource: {
        identity: "wycats-plugin:stances/relational-continuity",
        name: "relational-continuity",
        path: "stances/relational-continuity/SKILL.md",
      },
    };
    assert.equal(
      adapter.projectPrompt(stanceSuite, "Canonical request"),
      "Invoke the wycats-ai-plugin:relational-continuity skill before answering the canonical request below.\n\nCanonical request",
    );
    assert.equal(
      adapter.projectedResourcePath(suite.resource),
      join(root, "out", "claude-code", "agents", "custom-review.agent.md"),
    );
    assert.equal(
      adapter.projectedResourcePath(stanceSuite.resource),
      join(root, "out", "claude-code", "skills", "relational-continuity", "SKILL.md"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function stream(...events: unknown[]): string {
  return events.map((event) => JSON.stringify(event)).join("\n");
}

void test("runs a projected agent directly through Claude Code's agent surface", () => {
  const canonicalPrompt = "Canonical request";
  const result = '{"findings":[],"rewrittenDocument":"Agent result"}';
  const invocation = claudeCodeInvocation(
    suite.resource,
    "wycats-ai-plugin",
    canonicalPrompt,
    "Projected launcher prompt",
  );
  assert.deepEqual(invocation, {
    resourceArguments: ["--agent", "wycats-ai-plugin:slop-linter"],
    prompt: canonicalPrompt,
    directInvocation: {
      surface: "cli-agent",
      resource: "wycats-ai-plugin:slop-linter",
    },
  });
  assert.throws(
    () =>
      parseClaudeCodeStream(
        stream({ type: "result", subtype: "success", is_error: false, result }),
        suite.resource,
        "wycats-ai-plugin",
      ),
    /did not complete a wycats-ai-plugin:slop-linter resource invocation/,
  );
  assert.deepEqual(
    parseClaudeCodeStream(
      stream({ type: "result", subtype: "success", is_error: false, result }),
      suite.resource,
      "wycats-ai-plugin",
      invocation.directInvocation,
    ),
    {
      result,
      resourceInvocation: {
        surface: "cli-agent",
        resource: "wycats-ai-plugin:slop-linter",
      },
    },
  );
});

void test("recognizes a completed invocation through the projected skill surface", () => {
  const resource = {
    identity: "wycats-plugin:stances/relational-continuity",
    name: "relational-continuity",
    path: "stances/relational-continuity/SKILL.md",
  };
  const result = '{"findings":[],"rewrittenDocument":"Text"}';
  assert.deepEqual(
    parseClaudeCodeStream(
      stream(
        {
          type: "assistant",
          message: {
            content: [
              {
                type: "tool_use",
                id: "skill-1",
                name: "Skill",
                input: { skill: "wycats-ai-plugin:relational-continuity" },
              },
            ],
          },
        },
        {
          type: "user",
          message: {
            content: [{ type: "tool_result", tool_use_id: "skill-1", content: "Loaded" }],
          },
        },
        { type: "result", subtype: "success", is_error: false, result },
      ),
      resource,
      "wycats-ai-plugin",
    ),
    {
      result,
      resourceInvocation: {
        surface: "tool",
        tool: "Skill",
        resource: "wycats-ai-plugin:relational-continuity",
        toolUseId: "skill-1",
      },
    },
  );
});

void test("rejects a skill response without a successful skill invocation", () => {
  const resource = {
    identity: "wycats-plugin:stances/relational-continuity",
    name: "relational-continuity",
    path: "stances/relational-continuity/SKILL.md",
  };
  const directResult = stream({
    type: "result",
    subtype: "success",
    is_error: false,
    result: '{"findings":[],"rewrittenDocument":"Text"}',
  });
  assert.throws(
    () =>
      parseClaudeCodeStream(
        directResult,
        resource,
        "wycats-ai-plugin",
      ),
    /did not complete a wycats-ai-plugin:relational-continuity resource invocation/,
  );

  const failedInvocation = stream(
    {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            id: "agent-1",
            name: "Skill",
            input: { skill: "wycats-ai-plugin:relational-continuity" },
          },
        ],
      },
    },
    {
      type: "user",
      message: {
        content: [{ type: "tool_result", tool_use_id: "agent-1", is_error: true }],
      },
    },
    { type: "result", subtype: "success", is_error: false, result: "{}" },
  );
  assert.throws(
    () =>
      parseClaudeCodeStream(
        failedInvocation,
        resource,
        "wycats-ai-plugin",
      ),
    /did not complete a wycats-ai-plugin:relational-continuity resource invocation/,
  );
});
