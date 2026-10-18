import { z } from "zod";

const scriptPathMessage = "script must be a portable relative path under scripts/hooks/ using letters, digits, underscores, periods, hyphens, and forward slashes";

// These paths become shell command arguments on both hosts. Restrict their
// spelling as well as traversal, so quoting cannot change what gets executed.
const hookScriptPathSchema = z.string({ error: scriptPathMessage })
  .regex(/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/, scriptPathMessage)
  .refine(script => !script.split("/").includes(".."), scriptPathMessage);

const nonemptyString = z.string().regex(/\S/, "Expected a non-empty string");

export const hookManifestSchema = z.object({
  type: z.enum(["policy", "observer", "side-effect"]),
  name: nonemptyString,
  events: z.array(nonemptyString).min(1),
  tool: z.string().optional(),
  script: hookScriptPathSchema,
  timeout: z.number().optional(),
});

export type HookManifest = z.infer<typeof hookManifestSchema>;

export function parseHookManifest(value: unknown): HookManifest {
  const result = hookManifestSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid hook manifest:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function validateHookScriptPath(script: unknown): asserts script is string {
  hookScriptPathSchema.parse(script);
}
