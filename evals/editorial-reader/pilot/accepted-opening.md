# wycats

Reusable instructions for investigation, implementation, review, and writing in
VS Code Copilot, Claude Code, Codex, and Pi.

## What this is

This plugin gives your coding agent workflows for tasks such as investigating a
codebase or developing an RFC, stances that shape the judgment those tasks need,
and agent roles for delegated work.

The plugin grew out of working with agents on real projects and revising their
instructions when the work revealed something we had missed. The repository
also develops a theory of how those instructions work. Using the resources
gives us ways to try that theory and reasons to revise it.

## How the pieces work together

Suppose an edit triggers an expensive calculation several times. You want to
understand why before deciding what to change.

Ask your agent to use the [Recon workflow](skills/workflows/recon/SKILL.md). It
guides the investigation: follow the calls, compare explanations, and decide
what to examine next. You may initially suspect that some calls should be
removed. Discovering that several consumers need the same result changes the
question to how those consumers could share the calculation.

[Interpretive Synthesis](skills/stances/interpretive-synthesis/SKILL.md) describes
the judgment involved in that change of understanding. The calls acquire a
different meaning once we understand their consumers, and that new account
changes what we need to investigate. This is a **stance**: relationships we can
recognize and attend to across different kinds of work. It also matters when an
implementation changes the premise of an RFC or a reader's response changes the
opening of an essay. A **workflow** brings such stances into a particular task
and describes how the work develops.

An **agent** takes responsibility for a contribution. The
[Recon worker](agents/recon-worker.agent.md) might trace the callers while another
participant examines how updates reach them. The worker uses the same Recon
workflow to pursue its part of the question. It shares findings while the
investigation is underway and brings discoveries that affect the larger account
to the coordinator. The coordinator uses those exchanges to reconsider the
investigation as a whole.

Stances live in `skills/stances/`, workflows in `skills/workflows/`, and agent
roles in `agents/`. The build adapts these sources to each application's skill,
agent, instruction, and hook support. The [target table](#how-the-build-works)
describes what each package provides.

## The core idea

Instructions shape what an agent notices, expects, and treats as worth pursuing.
A stance makes those relationships explicit. For example,
[Reader Orientation](skills/stances/reader-orientation/SKILL.md) asks what someone
can understand where they encounter a piece of work. That question can guide an
API explanation, a paragraph, or a navigation control. Each needs different
details to make sense to its reader.

We use a probability landscape as a working model for this influence: context
makes some continuations more likely than others. Instructions can reinforce
the same account of the work or pull it in competing directions. This gives us
a question to ask when writing a skill: what does each instruction lead the
agent to attend to, and how does that attention contribute to the task?

[Foundations](FOUNDATIONS.md) develops that model.
[Quality](QUALITY.md) turns it into principles for writing and reviewing the
resources. We revise both as using the plugin changes our understanding.
