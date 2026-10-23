# Foundations

This document develops the working model behind the design principles in
[QUALITY.md](QUALITY.md). It relates how context shapes language-model output to observations
from writing and using skills and agents.

The probability landscape is an explanatory metaphor. It helps us reason about
instructions that reinforce or interfere with one another. Claims about which
wording improves a particular task need to be checked in use, where the model,
available tools, and surrounding conversation also affect the result.

## The probability landscape

A language model generates text by computing, at each step, a probability
distribution over possible next tokens. The context includes system
instructions, skill content, conversation history, tool results, and the user's
message. Changing that context can change which continuations are likely.

Picture plausible continuations as regions in a landscape. A well represents
a family of continuations that the context makes easier to reach and remain
within. An instruction can give that family a recognizable shape: a proof
must preserve its assumptions, and an explanation for an experienced engineer
can rely on vocabulary a beginner has yet to learn.

A narrow well represents strong constraints on what can come next. Narrowness
alone says little about whether those constraints serve the task. An agent can
confidently continue a mistaken explanation. We need to examine what the context
makes salient and whether the resulting work remains answerable to its subject.

## Wells and stances

A stance articulates relationships worth attending to across different kinds
of work. Reader Orientation, for example, relates the understanding available
to an author to what someone can know where they encounter the artifact.
That relationship can guide a paragraph, a call site, or a navigation control.

An instruction gives the stance a place in the current task. “Explain this API
to someone extending the integration” draws attention to what that reader
already knows and what they need to do next. The stance helps us ask which
assumptions the explanation must expose and which details can wait.

In the landscape metaphor, the instruction begins to shape a well and the
stance gives it internal structure. The practical question is what the agent
is being led to notice, how those relationships bear on the work, and whether
other instructions support the same understanding.

## Stances as portable structure

The subject, format, and participants change across applications of a stance.
The relationships remain recognizable. Hypothesis Forming relates an
expectation to its reasons and to evidence that could revise it. That structure
can guide a programmer anticipating a code path, a scientist preparing an
experiment, or a detective deciding which lead to follow.

Cross-domain examples help make this structure precise. Their overlap shows
what is shared; their differences help distinguish it from incidental features
of one domain. Examples of three professionals diagnosing a fault might leave
open whether the stance requires a fault at all. An example about anticipating
a successful performance could make the intended relationship clearer.

The examples also give us something to examine. If an agent carries an
incidental feature into a new application, the set may not distinguish the
relationship we intended. Revising a stance means testing how its account and
examples guide the work, including unfamiliar cases.

## Invariants and situated projections

A stance is a canonical articulation of a stable relational invariant. Its
cross-domain examples are situated projections: each presents the relationship
in different circumstances while preserving what makes it recognizable. Their
overlap makes the invariant legible.

The same shape continues outward. A skill composes one or more invariants into
a workflow. An agent gives them a continuing place in a role's responsibility
and cognitive orientation. Project and session artifacts carry them across
timescales. Runtime packaging presents
them through the discovery and execution surfaces a particular host provides.

**Coherence preserves a stable relational structure across situated
projections. The canonical articulation governs changes to that structure;
projections adapt it to a task, timescale, or runtime without becoming a
competing source of meaning.**

Canonical describes authority to revise, not a ban on repetition. A compact
restatement can reinforce the same well in a workflow or handoff. It becomes a
problem when the restatement can evolve independently and silently change the
relationships the canonical articulation established.

Wording helps establish what a resource leads an agent to attend to, so
projection needs to preserve more than a summary of its propositions. Preserve
the authoritative language when a host can carry it directly. When a runtime
requires a different envelope, name, or location, adapt that envelope. When it cannot express a capability, make the
loss visible. When the semantics themselves need to differ, revise the
canonical articulation or introduce an explicit variant.

## Understanding at the point of encounter

The context available to an author and the context available to a reader are
different. An author can mentally supply a relationship that a paragraph, type,
or interface never expresses. An agent with a long conversation behind it can
make the same mistake: the account is coherent in its context while leaving a
new reader to infer a missing connection.

[Reader orientation](skills/stances/reader-orientation/SKILL.md) makes this information
boundary part of the task: what can someone understand where they encounter the work?
A useful level of detail exposes the relationships needed for the current
judgment, while a trustworthy contract lets other detail wait. Deeper inspection
should explain that contract without overturning the understanding it supplied.

This extends coherence across situated projections to levels of explanation.
A workflow overview, a bounded task, and its implementation can expose different
detail while preserving the same guarantees and distinctions. Repeating the
entire context at every level would obscure those relationships; omitting a
necessary assumption would make the account misleading.

The same principle explains the value of distilling work before delegation.
The coordinator resolves relationships that would otherwise require repeated
inference, then puts the necessary decisions, evidence, and constraints into
the task. This can reduce the reasoning execution must reconstruct. An assignment can
also leave an inquiry open: distinguish the decisions the worker can rely on
from the assumptions their investigation should examine. Participants can help
interpret one another's discoveries while the coordinator retains responsibility
for their implications across the whole.

## How stances compose

### Reinforcement

Stances reinforce when their contributions help the agent reason about the same
work. Reader Orientation asks what an explanation makes available to its
reader. Authorial Continuity asks how wording carries the author's judgment
into that relationship. Reading the two together can reveal why adding a true
qualification would lead this audience to infer a doubt the author does not
intend.

The contributions remain distinct. Reinforcement means one helps us apply the
other more precisely to the situation. In the metaphor, they deepen the same
well by giving its relationships more definition.

### Interference

Instructions can also pull attention toward incompatible accounts of the task.
An editor asked to develop a paragraph's reasoning and to eliminate every
instance of a grammatical pattern may satisfy the pattern rule while leaving
the missing reasoning untouched. The visible correction can make the result
look finished before the underlying question has been examined.

A restriction may have a real purpose. Work out what it protects and where that
judgment belongs. A warning about an authorization boundary needs explicit
attention at the point of action. A list of disfavored prose patterns may be
more useful as evidence for a later reading than as a demand governing every
sentence as it is written.

### Orthogonality

Different dimensions offer a useful starting point for composition. A subject,
an audience, and a purpose can each make a separate contribution: explain this
API to an integration author deciding how to recover from a timeout.

Those dimensions still affect one another. The purpose changes which parts of
the API matter, and the audience changes how much of its recovery model needs
explanation. Two stances concerned with the same dimension can reinforce each
other, as Reader Orientation and Authorial Continuity do. The question is
whether their contributions form a coherent account that the agent can use.

## Leverage

A familiar phrase can carry many assumptions in few words. “Senior engineer”
suggests technical vocabulary, prior experience, and expectations about detail.
This makes it useful when those associations fit the intended reader.

The compression also leaves interpretation to the model. The engineer may know
the language well while encountering this system for the first time. Describing
that relationship gives the explanation a more useful starting point than
seniority alone.

Choose wording for the understanding it supplies. A compact phrase can preserve
an established idea through a long workflow. A fuller explanation earns its
place when it distinguishes a relationship the phrase leaves ambiguous.
Repeated instructions can obscure that relationship if each restatement brings
slightly different assumptions.

## When specificity stops helping

An instruction can draw a distinction the agent does not reliably carry into
the work. The vocabulary may recur while the examples or decisions miss the
point. In landscape terms, we might describe a well too narrow to stay within.
That image identifies a question to investigate; it does not tell us why the
attempt failed.

Examine the result against the task. Was the needed evidence available? Did the
examples make the distinction recognizable? Did another instruction pull the
work toward a different purpose? A simpler formulation or a worked case can
help distinguish a limitation in the instruction from a limitation in the
agent's ability to apply it. Compare what changes in use before concluding
that greater specificity was the problem.

## Coherence across sources

System instructions, skill content, agent definitions, conversation history,
tool results, and the user's message all contribute to the context. Their
relationships need examination as carefully as the instructions within one
resource.

A workflow may ask for an investigation while a delegated task presupposes its
conclusion. A summary may preserve a decision while losing the uncertainty
that made it provisional. Each source can look reasonable on its own while
leading the combined work toward an unsupported account.

Make the resource's contribution visible to the participants. If the agent
explains which uncertainty it is investigating and why, the user can correct
a mistaken premise. When a finding changes the shared understanding, revise
the assignments and summaries that depend on it. Coherence develops through
these exchanges as well as through the initial instructions.

## Generation and evaluation

Writing a draft and examining it ask for different kinds of attention. A writer
needs room to develop an account. A reader can encounter that account without
silently supplying the reasoning that produced it. An agent may recognize a
weak passage on a later reading even though it generated the passage earlier.

The landscape metaphor gives us a way to describe this difference: asking for
a draft and asking what a particular reader can understand make different
continuations salient. It also suggests a design choice. Give the work a place
to develop and a place to be examined, with the sources and perspective each
contribution needs.

This separation can happen across turns or participants. A fresh reader may
expose an assumption the writer has come to share with an informed colleague.
That colleague may be better able to judge a revision whose reasons developed
through their discussion. Choose the encounter for what it could reveal, then
let its findings change the work.

### Review can reopen the reasoning

Editing the surface of a weak account preserves its missing reasoning. Replacing
a semicolon with a period, for example, leaves the reader to infer the same
unexplained relationship between two claims.

Review can ask whether that relationship holds and whether the reader needs
both claims. The answer may justify deleting a sentence, investigating an
assumption, or developing a different explanation. The new account comes from
that renewed work. A reviewer needs access to the underlying material and room
to question the framing to make this contribution.

Giving generation and evaluation distinct contributions makes room for both
kinds of attention. Findings can send the work back through preparation,
investigation, or revision. PER preserves expectations and evidence so
participants can see what a finding changes, including changes to the question
they thought they were answering.

## The information landscape

What the agent can judge depends on the information available to it. These
four categories help identify what can be investigated and where another
participant's contribution is needed:

**Agent-only perception** — information accessible through tools that the user
does not typically examine. Terminal output, log contents, file system structure.
The agent can investigate these sources and bring consequential observations
into the conversation. A missing source can be hard for either participant to
notice; compare what a judgment needs with what the tools actually expose.

**Shared perception** — information both the agent and user can examine.
Diagnostics panels, editor state, visible errors. A shared reference lets the
user confirm a detail or question the agent's interpretation. Establishing what
each participant can actually see matters: access to a file does not give the
agent perception of the window displaying it.

**Unshared environmental** — information that exists in the environment but
the agent cannot currently observe. A visible error in an inaccessible window,
for example, may be decisive. A plausible inference can hide this gap. When a
judgment depends on the missing observation, establish whether another tool can
reach it or ask the user for the particular detail.

**Inherently situated** — the user's experience and judgment: priorities,
energy, timing, flow state. Records and earlier exchanges can help the agent
understand this experience. The user can still contribute something those
sources leave out or correct what the agent made of them. Bring consequential
uncertainty into that conversation.

Making environmental information observable lets the agent investigate it
directly. That leaves more of the user's attention for the judgments their
experience can bring to the work.

## Selection across timescales

At the scale of a task, instructions shape what the agent attends to and treats
as worth pursuing. A related selection question arises over the longer span
of a project. Several plans, tasks, pull requests, and infrastructure moves
can all be locally worthwhile while making different contributions to what
the project should make possible.

Project vision gives these choices a shared purpose: the experienced change
the project should create. Relate a proposed move to the capability it supports
and what someone could do as a result. Follow that relationship far enough to
compare the choices in front of you. An infrastructure change may support an
obligation that becomes apparent only through the work depending on it. A
small experiment may resolve an uncertainty that changes which larger
investment deserves attention.

Purpose needs enough continuity to support sustained work. Experience can also
clarify or challenge it. An unexpected use may reveal a further ambition;
success may show that the work has accomplished enough for now. Carry these
findings into the next choice instead of letting whichever artifact moved
most recently determine the direction.

The information boundary remains. Tools can show what was built, how people
encountered it, and where experience diverged from an expectation. The user
can relate those findings to priorities and commitments outside the agent's
view. Use what they have already explained to continue within the direction;
bring a consequential possibility back to them when it could change what
the project is for.

## Implications for skill design

The working model gives us questions for writing and trying resources:

**Make the contribution recognizable.** Explain which relationships matter and
how attending to them helps the work. Participants can then examine whether
that is the contribution the task needs.

**Compose distinct contributions.** Ask what each stance adds and how it changes
the application of the others. Follow apparent conflict back to the judgments
or obligations the instructions are trying to preserve.

**Choose the compression the task can support.** Use compact language for
established understanding and fuller explanations where a relationship needs
to become recognizable. Cross-domain examples can distinguish that relationship
from incidental features of one application.

**Give review room to change the account.** Arrange the sources, perspective,
and conversation needed to examine the work. Let a finding reopen the
investigation or premise it bears on.

**Describe tensions and preserve requirements.** Explain the concerns a judgment
must reconcile. Keep exact boundaries explicit where the work depends on them,
and use mechanical checks for what they can reliably establish.

**Route information according to what is available.** Observe what tools can
reach. Ask for a missing environmental fact when the judgment needs it. Use
the user's contributions to develop the understanding on which later work
will depend.
