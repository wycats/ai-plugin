import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { discoverResourceFiles } from "../../scripts/resource-discovery.ts";
import { parseResourceFrontmatter } from "../../scripts/resource-frontmatter.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const resources = await discoverResourceFiles(root);
const entries = await Promise.all([...resources.skills, ...resources.stances].map(async (resource) => {
  const { data } = parseResourceFrontmatter(await readFile(resource.sourcePath, "utf8"));
  if (typeof data.name !== "string" || typeof data.description !== "string") {
    throw new Error(`${resource.pluginPath}: expected name and description`);
  }
  return { name: data.name, description: data.description, path: resource.pluginPath.slice(2) };
}));
entries.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(new URL("CATALOG.md", import.meta.url), [
  "# Full skill catalog",
  "Generated from canonical descriptions by `node experiments/situational-discovery/catalog.ts`.",
  ...entries.map(({ name, description, path }) => `- [${name}](../../${path}): ${description}`),
].join("\n\n") + "\n");
