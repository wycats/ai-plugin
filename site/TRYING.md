# Trying the plugin

The essay in this book, and the stances and workflows it links, are the text of
a plugin for coding agents called `wycats`. Its skills help an agent investigate
code, develop a proposal with you, or review a change. Setting up its ongoing
guidance also gives the agent
[Building together](../instructions/building-together.instructions.md).

The plugin supports Codex, Claude Code, and VS Code with GitHub Copilot. Pi has
a smaller package that carries the Recon workflow. The repository's
[setup guide](../docs/setup.md) has the commands for each application. This
page explains what to expect from them.

## Set up the skills and ongoing guidance

Installing the plugin makes its skills available to the agent. Follow your
application’s setup instructions to give it the essay as well:

**Codex** delivers the essay through a hook that runs when a session starts.
Codex runs a plugin's hook only after you have reviewed and trusted it, and
`/hooks` shows whether that review is still pending.
[Install in Codex](../docs/setup.md#install-in-codex) has the commands.

**Claude Code** reads the essay from an import in a project's `CLAUDE.md`.
Running `/wycats:setup-guidance` in the project adds the import. It stays in
the project until you run the command again with `remove`, so do that before
uninstalling the plugin. See
[Claude Code persistent guidance](../docs/setup.md#claude-code-persistent-guidance).

**VS Code** loads a copy of the plugin that you build from the repository and
register in the settings of the channel you choose, Stable or Insiders. Agent
plugins are a preview feature there. The plugin's hook adds the essay to a
chat's first prompt. See
[VS Code local registration](../docs/setup.md#vs-code-local-registration).

**Pi** receives the Recon workflow and the stances it relies on. Its package
leaves the essay out. See the [Pi Recon profile](../docs/setup.md#pi-recon-profile).

After installing or trusting, start a fresh chat. In Codex, a chat that was
already open keeps the guidance it began with.

## A first investigation

Choose a question in a project you know, where understanding the answer would
help you decide what to do. The setup guide suggests one:

> “Use the wycats Recon workflow to investigate why this calculation runs several
> times for one edit. I want to understand which callers need it before deciding
> what to change. Start with [the relevant file or reproduction].”
> <cite>— [Setup guide · Try a first investigation](../docs/setup.md#try-a-first-investigation)</cite>

Replace the example with your own question and a place to start.
[Recon](../skills/workflows/recon/SKILL.md) guides the investigation. The agent
follows the evidence and brings back an explanation you can check against the
code. If it finds that the callers serve different consumers, that should
change what it recommends.

The same situation runs through this book. In
[Working through a change](../instructions/building-together.instructions.md#working-through-a-change),
a speedup arrives as expected, and reviewing the callers changes what is worth
doing next. In Contents, the question “The change worked as predicted. What did
it teach us?” follows that example through four stances.

## What to look for

Seeing a skill load tells you it is available. Judge what it contributes by how
the investigation develops. Does the explanation hold up when you check it?
Does the recommendation change when the evidence does? You can correct the
agent's account as you learn together. A useful first result gives you grounds
for a decision and makes clear what is still uncertain.

The repository records
[which deliveries have been checked](../docs/persistent-guidance.md#delivery-by-target)
in each application, and their limits. Those checks establish that the essay
reaches the agent. They are not evidence that it improves the agent's work,
which is something to judge in your own sessions.
