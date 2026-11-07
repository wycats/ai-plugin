# Agent Orientation

This repo is both a working agent plugin and a testbed for a theory of how language shapes model behavior. Before changing skills, stances, agents, instructions, or hooks, read:

- [FOUNDATIONS.md](FOUNDATIONS.md) for the underlying model: probability landscapes, stances, information boundaries, and why skill text creates behavioral wells.
- [QUALITY.md](QUALITY.md) for the practical writing principles that follow from that model.

These files are not background reading. They explain the local definition of a good skill: a skill should shape how the agent thinks about the work, not merely list steps. Prefer honest descriptions of tensions, visible execution shape, and reinforcing stances over defensive rule lists.

When adding or editing repo artifacts:

- Inspect nearby artifacts first and preserve the established source-of-truth flow.
- Keep platform-specific packaging generated through the build system when possible.
- Use `pnpm validate` for resource/frontmatter checks.
- Use target builds such as `pnpm build:codex` or `pnpm package-codex` when changing packaged output.

## Repository workflows

For work in progress, start with [WORK-STACK.md](WORK-STACK.md). It records the
current work, the follow-ups deliberately left open, and where local working
material lives.

Prose the reading edition adds around the canonical texts, such as question
guides, notes, and navigation labels, follows [site/STYLE.md](site/STYLE.md).

Contributor skills live in `.agents/skills/`, separately from the published
plugin resources in `skills/`. For generated reading-site artwork and visual
experiments, read [Illustration studies](.agents/skills/illustration-studies/SKILL.md).
