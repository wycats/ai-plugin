/** Regenerate editor completion and validation from the build's runtime schema. */
import { writeFile } from "node:fs/promises";
import { buildConfigJsonSchema } from "./build-config.ts";

await writeFile(new URL("../config.schema.json", import.meta.url), buildConfigJsonSchema());
