// scripts/runtime/persistent-context.mts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
async function renderPersistentInstructions() {
  const payload = await readFile(new URL("./persistent-context.json", import.meta.url), "utf8");
  const documents = JSON.parse(payload);
  const packageRoot = fileURLToPath(new URL("../", import.meta.url));
  return documents.map((document) => document.map((part) => {
    if (typeof part === "string") return part;
    return resolve(packageRoot, part.packagePath).replaceAll("\\", "/");
  }).join("")).join("\n\n");
}

// scripts/runtime/persistent-context-hook.mts
var additionalContext = await renderPersistentInstructions();
if (Buffer.byteLength(additionalContext, "utf8") > 48e3) {
  throw new Error("Persistent plugin context exceeds 48 KB; review its size and delivery budget.");
}
process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext }
}));
