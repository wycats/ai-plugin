import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";
import { parseResourceFrontmatter } from "./resource-frontmatter.ts";
import { parseCompositionLinks, projectCompositionLinks, type CanonicalComposition } from "./resource-composition.ts";
import type { PersistentInstructionDocument } from "./runtime/persistent-context.mjs";
import type { PersistentInstructionPlan, ProjectedResource, ProjectionPlan } from "./projection-plan.ts";

/** Persistent prose follows the same link projection as lazily loaded resources.
 * Split destinations from text so the installed root is resolved at delivery time. */
export async function writePersistentContext(
  outDir: string, plan: ProjectionPlan, composition: CanonicalComposition,
): Promise<void> {
  const persistent = plan.persistentInstructions;
  if (!persistent) return;

  const documents = await prepareInstructionDocuments(outDir, persistent.resources, composition, plan.outputBySourcePath);
  await writeInstructionPayload(outDir, documents);
  await writeDeliveryRuntime(outDir, persistent.delivery);
  if (persistent.delivery === "claude-project-import") {
    await writeClaudeSetupCommand(outDir);
  }
}

async function prepareInstructionDocuments(
  packageRoot: string,
  resources: ProjectedResource[],
  composition: CanonicalComposition,
  destinations: ReadonlyMap<string, string>,
): Promise<PersistentInstructionDocument[]> {
  const documents: PersistentInstructionDocument[] = [];

  for (const { resource, outputPath } of resources) {
    const source = await readFile(resource.sourcePath, "utf8");
    const projected = projectCompositionLinks(source, resource.sourcePath, outputPath, composition, destinations);
    const { body } = parseResourceFrontmatter(projected);

    documents.push(encodeInstruction(body, outputPath, packageRoot));
  }

  return documents;
}

async function writeInstructionPayload(packageRoot: string, documents: PersistentInstructionDocument[]): Promise<void> {
  const runtimeDir = join(packageRoot, "scripts");
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(join(runtimeDir, "persistent-context.json"), JSON.stringify(documents) + "\n");
}

async function writeDeliveryRuntime(packageRoot: string, delivery: PersistentInstructionPlan["delivery"]): Promise<void> {
  const adapter = delivery === "claude-project-import" ? "claude-guidance" : "persistent-context-hook";

  // Installed plugins run outside this checkout, without its node_modules.
  // Bundle dependencies while retaining ESM import.meta.url for package paths.
  await build({
    entryPoints: ["persistent-context", adapter].map(name =>
      fileURLToPath(new URL(`./runtime/${name}.mts`, import.meta.url))),
    outdir: join(packageRoot, "scripts"),
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
    target: "es2024",
  });
}

/** This entry point belongs to Claude delivery, independent of the prose it installs. */
async function writeClaudeSetupCommand(packageRoot: string): Promise<void> {
  const directory = join(packageRoot, "skills", "setup-guidance");
  await mkdir(directory, { recursive: true });
  await cp(new URL("./runtime/claude-setup-guidance.md", import.meta.url), join(directory, "SKILL.md"));
}

/** Preserve prose byte-for-byte while deferring link addresses until delivery. */
function encodeInstruction(body: string, outputPath: string, packageRoot: string): PersistentInstructionDocument {
  const parts: PersistentInstructionDocument = [];
  let cursor = 0;

  for (const link of parseCompositionLinks(body).links) {
    const destination = resolve(dirname(outputPath), link.destination);
    const packagePath = relative(packageRoot, destination).replaceAll("\\", "/");

    // Angle brackets preserve Markdown destinations when an installation path has spaces.
    parts.push(body.slice(cursor, link.destinationStart) + "<", { packagePath }, ">");
    cursor = link.destinationEnd;
  }

  parts.push(body.slice(cursor));
  return parts;
}
