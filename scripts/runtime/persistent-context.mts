import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Literal prose interleaved with package-relative file addresses. The build
 * owns this format; runtime delivery resolves addresses after installation. */
export type PersistentInstructionDocument = Array<string | { packagePath: string }>;

/** Render every persistent instruction in package order, resolving links at
 * the installed location. Delivery adapters own their envelopes and limits. */
export async function renderPersistentInstructions(): Promise<string> {
  const payload = await readFile(new URL("./persistent-context.json", import.meta.url), "utf8");
  const documents = JSON.parse(payload) as PersistentInstructionDocument[];
  const packageRoot = fileURLToPath(new URL("../", import.meta.url));
  return documents.map(document => document.map(part => {
    if (typeof part === "string") return part;
    // Addresses are filesystem paths. URL parsing would treat # and % as syntax.
    return resolve(packageRoot, part.packagePath).replaceAll("\\", "/");
  }).join("")).join("\n\n");
}
