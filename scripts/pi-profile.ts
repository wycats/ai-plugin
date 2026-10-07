/** The bounded Recon projection: discovery, delegated context, and activation intent. */
export const PI_PROFILE = {
  name: "wycats-recon",
  agent: "./agents/recon.agent.md",
  // The public workflow comes first, followed by its delegated stance catalog.
  resources: [
    "./skills/recon/SKILL.md",
    "./stances/diagnostic-questioning/SKILL.md",
    "./stances/interpretive-synthesis/SKILL.md",
    "./stances/observational-grounding/SKILL.md",
    "./stances/relational-continuity/SKILL.md",
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
