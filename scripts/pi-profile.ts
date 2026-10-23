/** The bounded Recon projection: discovery, delegated context, and activation intent. */
export const PI_PROFILE = {
  name: "wycats-recon",
  agent: "agent:recon",
  // The public workflow comes first, followed by its delegated stance catalog.
  resources: [
    "skill:recon",
    "skill:diagnostic-questioning",
    "skill:interpretive-synthesis",
    "skill:observational-grounding",
    "skill:relational-continuity",
  ],
  agentContext: {
    advertise: true,
    systemPromptMode: "replace",
    inheritProjectContext: true,
    inheritGlobalContext: false,
    inheritSkills: false,
    skillPath: ["../skills", "../stances"],
    allowNestedSubagents: false,
  },
} as const;

export function piAgentContext(skillNames: string[]): Record<string, unknown> {
  const { skillPath, allowNestedSubagents, ...context } = PI_PROFILE.agentContext;
  return { ...context, skills: skillNames, skillPath, allowNestedSubagents };
}
