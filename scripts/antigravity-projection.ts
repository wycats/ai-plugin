import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const MODEL_TIERS = new Set(["inherit", "flash_lite", "flash", "pro"]);

/** Antigravity selects model tiers, not the provider IDs accepted by Copilot. */
export function validateAntigravityModels(models: Record<string, string | null | undefined>): void {
  for (const [role, value] of Object.entries(models)) {
    if (value != null && !MODEL_TIERS.has(value)) {
      throw new Error(`Antigravity model role '${role}' must use inherit, flash_lite, flash, pro, or null; received '${value}'`);
    }
  }
}

export function antigravityAgentMetadata(data: Record<string, unknown>) {
  return {
    mainAgent: data["user-invocable"] !== false,
    subagent: true,
    // Keep command execution subject to the host sandbox and approval settings.
    commandExecutionPolicy: "sandbox",
  };
}

export async function writeAntigravityManifest(
  outDir: string,
  metadata: { name: string; version: string; description: string },
): Promise<void> {
  await writeFile(join(outDir, "plugin.json"), JSON.stringify({
    $schema: "https://antigravity.google/schemas/v1/plugin.json",
    ...metadata,
    displayName: "Building together",
  }, null, 2) + "\n");
  await writeFile(join(outDir, "projection-capabilities.json"), JSON.stringify({
    schemaVersion: 1,
    target: "antigravity",
    persistentGuidance: "native always_on rules",
    activation: {
      mechanism: "model-directed progressive disclosure",
      explicitOnly: "disable-model-invocation",
      hiddenSkillVisibility: "not qualified; stances may appear as slash commands",
      automaticLinkedBodyPreloading: false,
    },
    agents: "native agents; mainAgent follows canonical user visibility; tools use configured mappings",
    omitted: [
      "authored policy and observer hooks (their event and tool envelopes require separate qualification)",
      "nonpersistent Copilot instructions",
    ],
    defaultToolMapping: {
      available: ["file reads and search", "shell commands", "delegation", "inter-agent messages"],
      omitted: ["browser", "persistent memory", "Exo", "dedicated testing, tasks, and GitHub tools"],
      note: "Shell commands remain subject to host permissions. Users can extend config.antigravity.example.json mappings for their host.",
    },
    qualification: "Package validation and installed discovery do not establish model behavior or linked-body delivery.",
  }, null, 2) + "\n");
  await writeFile(join(outDir, "README.md"), `# Building together\n\nGenerated from wycats/ai-plugin canonical resources for Antigravity.\n\nInstall or update with \`agy plugin install <this-directory>\`. Start a new conversation to use the updated guidance. The package includes skills, native agents, and always-on rules. See projection-capabilities.json for qualified behavior and omissions.\n\nSource and update instructions: https://github.com/wycats/ai-plugin/blob/main/docs/antigravity.md\n`);
}
