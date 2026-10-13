import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isMapping, parseYamlMapping } from "./resource-frontmatter.ts";
import type { SkillKind } from "./resource-discovery.ts";

/** Public workflow selection and contextual applicability are independent. */
export type SkillActivation =
  | { userInvocable: true; invocation: "explicit" | "contextual" }
  | { userInvocable: false; invocation: "contextual" };

export function parseSkillActivation(
  data: Record<string, unknown>,
  kind: SkillKind,
): SkillActivation {
  if (Object.hasOwn(data, "disable-model-invocation")) {
    throw new Error("disable-model-invocation is adapter-owned; declare canonical invocation instead");
  }
  const userInvocable = Object.hasOwn(data, "user-invocable") ? data["user-invocable"] : true;
  const invocation = Object.hasOwn(data, "invocation") ? data.invocation : "contextual";
  if (typeof userInvocable !== "boolean") throw new Error("user-invocable must be a YAML boolean");
  if (invocation !== "contextual" && invocation !== "explicit") {
    throw new Error("invocation must be 'contextual' or 'explicit'");
  }
  if (kind === "stance" && userInvocable) {
    throw new Error("stances must declare 'user-invocable: false'");
  }
  if (!userInvocable) {
    if (invocation === "explicit") throw new Error("invocation: explicit requires user-invocable: true");
    return { userInvocable, invocation };
  }
  return { userInvocable, invocation };
}

const AUTHORING_FIELDS = ["wycats.kind", "wycats.user-invocable", "wycats.invocation"] as const;

/** Decode the authoring envelope once; activation validation owns combinations. */
export function normalizeSkillSource(
  data: Record<string, unknown>,
  legacyKind?: SkillKind,
): { kind: SkillKind; frontmatter: Record<string, unknown>; activation: SkillActivation } {
  const metadata = data.metadata;
  const authored = isMapping(metadata) && AUTHORING_FIELDS.some((field) => Object.hasOwn(metadata, field));
  if (!authored) {
    if (!legacyKind) throw new Error("grouped skill sources require explicit wycats authoring metadata");
    return { kind: legacyKind, frontmatter: data, activation: parseSkillActivation(data, legacyKind) };
  }
  if (!isMapping(metadata) || !Object.values(metadata).every((value) => typeof value === "string")) {
    throw new Error("authoring metadata must be a string-to-string mapping");
  }
  for (const field of ["user-invocable", "invocation", "disable-model-invocation"]) {
    if (Object.hasOwn(data, field)) throw new Error(`${field} duplicates authoring metadata or is adapter-owned`);
  }
  const kind = metadata["wycats.kind"];
  if (kind !== "workflow" && kind !== "stance") throw new Error("wycats.kind must be 'workflow' or 'stance'");
  const visibility = metadata["wycats.user-invocable"];
  if (visibility !== "true" && visibility !== "false") {
    throw new Error("wycats.user-invocable must be the string 'true' or 'false'");
  }
  const frontmatter: Record<string, unknown> = {
    ...data, "user-invocable": visibility === "true", invocation: metadata["wycats.invocation"],
  };
  const remaining = Object.fromEntries(Object.entries(metadata).filter(([field]) =>
    !(AUTHORING_FIELDS as readonly string[]).includes(field)));
  delete frontmatter.metadata;
  if (Object.keys(remaining).length) frontmatter.metadata = remaining;
  return { kind, frontmatter, activation: parseSkillActivation(frontmatter, kind) };
}

/** A source sidecar may own presentation metadata, but not activation policy. */
export async function readSkillSidecar(sourcePath: string): Promise<Record<string, unknown> | undefined> {
  const path = join(dirname(sourcePath), "agents", "openai.yaml");
  let contents: Buffer;
  try {
    contents = await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  try {
    const data = parseYamlMapping(new TextDecoder("utf-8", { fatal: true }).decode(contents));
    if (Object.hasOwn(data, "policy")) {
      if (!isMapping(data.policy)) throw new Error("policy must be a YAML mapping");
      if (Object.hasOwn(data.policy, "allow_implicit_invocation")) {
        throw new Error("policy.allow_implicit_invocation is adapter-owned; declare canonical invocation instead");
      }
    }
    return data;
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

export function codexSkillSidecar(
  frontmatter: Record<string, unknown>,
  activation: SkillActivation,
  source: Record<string, unknown> = {},
): Record<string, unknown> {
  const authoredInterface = Object.hasOwn(source, "interface") ? source.interface : {};
  if (!isMapping(authoredInterface)) throw new Error("agents/openai.yaml: interface must be a YAML mapping");
  const ui = { ...authoredInterface };
  for (const [field, fallback] of [["display_name", "name"], ["short_description", "description"]]) {
    if (!Object.hasOwn(ui, field)) ui[field] = frontmatter[fallback];
    if (typeof ui[field] !== "string" || ui[field].trim() === "") {
      throw new Error(`agents/openai.yaml: interface.${field} must be a nonempty string`);
    }
  }
  return {
    ...source,
    interface: ui,
    policy: {
      ...(isMapping(source.policy) ? source.policy : {}),
      allow_implicit_invocation: activation.invocation === "contextual",
    },
  };
}
