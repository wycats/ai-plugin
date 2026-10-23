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
export {
  renderPersistentInstructions
};
