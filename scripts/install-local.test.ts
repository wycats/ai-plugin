import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { parse } from "jsonc-parser";
import { applyRegistrationActions } from "./install-local.ts";

void test("installer uses native plugin discovery and migrates only this checkout's owned settings", () => {
  const root = "/fixture/plugin-checkout";
  const output = join(root, "out", "wycats");
  const legacy = join(root, "out", "vscode");
  const foreign = "/other/checkout/out/wycats";
  const content = `{
    // Preserve the user's other customizations.
    "chat.plugins.paths": ${JSON.stringify({ [output]: true, [legacy]: false, [foreign]: true })},
    "chat.pluginLocations": ${JSON.stringify({ [legacy]: true, [foreign]: true })},
    "chat.hookFilesLocations": ${JSON.stringify({
      [join(output, "hooks")]: true,
      [join(legacy, "hooks")]: false,
      [join(output, "com.github.copilot", "hooks", "hooks.json")]: true,
      [join(foreign, "hooks")]: true,
      ".github/hooks": false,
    })},
    "editor.fontSize": 18,
  }`;
  const actions = applyRegistrationActions(content, output, root);
  const settings = parse(actions.content) as Record<string, unknown>;
  assert.deepEqual(settings["chat.plugins.paths"], { [foreign]: true });
  assert.deepEqual(settings["chat.pluginLocations"], { [foreign]: true, [output]: true });
  assert.deepEqual(settings["chat.hookFilesLocations"], { [join(foreign, "hooks")]: true, ".github/hooks": false });
  assert.equal(settings["editor.fontSize"], 18);
  assert.match(actions.content, /Preserve the user's other customizations/);
  assert.deepEqual(actions.entriesEnabled, [`chat.pluginLocations[${output}]`]);
  assert.equal(actions.staleEntriesRemoved.length, 6);
  const second = applyRegistrationActions(actions.content, output, root);
  assert.equal(second.content, actions.content);
  assert.deepEqual(second.entriesEnabled, []);
});

void test("installer creates one plugin registration without a separate hooks registration", () => {
  const output = "/scratch/plugin";
  const actions = applyRegistrationActions("{}\n", output, "/fixture/checkout");
  assert.deepEqual(parse(actions.content), { "chat.pluginLocations": { [output]: true } });
});
