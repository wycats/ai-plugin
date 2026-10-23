# Fresh reading of the README opening

The audience in the request has used a coding agent and wants to understand what
this plugin contributes. I read the README before investigating the sources and
without reading the other editorial-rethink studies, prior rationales, or
history. I used the assigned Editorial Reader role and its Reader Orientation,
Authorial Continuity, and Interpretive Synthesis stances. Canonical files remain
with the coordinating writer; `proposed-opening.md` is a proposed replacement
for the opening through “The core idea,” with links intended for README.md.

## What the current opening communicates

The opening gives me a coherent account of three resource kinds. The calculation
example lets me recognize a change in understanding before I encounter the name
Interpretive Synthesis. The examples of an RFC and an essay make the point that
this relationship travels across tasks. Those passages are doing useful work,
so the proposal preserves most of them.

The origin story also tells me something meaningful about the author's position:
these resources and their theory develop through use. “Working model” gives the
theory an appropriate status. I retained that relationship rather than turning
the introduction into a claim that the plugin has proven a general method.

The main missing connection occurs before the example. “An agent toolkit” could
name tools, runtime infrastructure, instructions, or some combination. The first
paragraph begins with the project's origin and then introduces its taxonomy.
Although “instructions” appears there, I have to assemble the practical answer
for myself: installing this adds reusable guidance for my existing coding agent.
Someone already familiar with agents needs that orientation before the
distinctions become useful.

## Question and the coordinating writer's reply

I asked whether the opening should primarily explain a usable plugin or
introduce the broader instruction-writing theory through this plugin. Both are
supported by the sources, but their order establishes different expectations.

The coordinating writer replied:

> For this pass, prioritize someone considering using the plugin. That is my
> editorial choice for the README and is still open to the author's response.
> The theory should remain easy to find because developing good instructions is
> part of this project's purpose, but a reader should first understand what they
> would be adding to their existing coding setup.

They also asked for activation language that respects differences among the
supported applications, and confirmed that they had not provided their prior
editorial rationale. The proposal therefore starts with reusable instructions
and says “Ask your agent to use the Recon workflow.” It does not prescribe a
slash-command spelling shared by every target. This is a proposal under that
editorial choice, awaiting the author's judgment.

## What source investigation changed

The calculation example is present in the actual
[Recon workflow](../../../skills/workflows/recon/SKILL.md), under “Let inquiries
inform one another.” It shows why evidence about distinct consumers changes the
question the investigators should pursue. The opening's example is faithful.
My small change makes the initial suspicion of removable calls explicit, so the
later change in question has an established starting point.

The [Recon worker](../../../agents/recon-worker.agent.md) loads Recon for its
investigation method. Its own instructions establish a bounded contribution,
sharing surprising findings while another participant can help interpret them,
and bringing changes affecting other work to the coordinator. README.md says
“Its instructions establish how to pursue that question and exchange findings.”
That is broadly accurate, but it does not reveal the compositional relationship:
the agent uses the workflow and takes responsibility for its part. The proposal
names that relationship directly. This is the most consequential source-derived
addition after the opening orientation.

The actual workflow also makes exchange part of inquiry, rather than reserving
all synthesis for a final report. The proposal retains the coordinator's
responsibility while making exchange during investigation visible. It does not
reproduce the workflow's full collaboration protocol in the README.

[Interpretive Synthesis](../../../skills/stances/interpretive-synthesis/SKILL.md)
supports the described change of question, including a discovery that leaves
earlier observations accurate while changing what is worth doing next.
[Reader Orientation](../../../skills/stances/reader-orientation/SKILL.md) supports
the core-idea example across code, interfaces, and explanation. These examples
do not need replacement to make the opening useful to this audience.

[Foundations](../../../FOUNDATIONS.md) explicitly treats the probability
landscape as an explanatory metaphor and connects context to the likelihood of
continuations. The proposal keeps “working model” and supplies one clause about
likelihood so “probability landscape” offers an initial explanation before the
reader follows the link. It introduces no claim about measured improvements.

[Quality](../../../QUALITY.md), particularly “Agents crystallize stances; skills
compose them,” and the
[resource architecture document](../../../docs/canonical-resources-and-runtime-projections.md)
support distinguishing an agent's responsibility from workflow method and
stance meaning. The architecture documentation also distinguishes packaging
availability from runtime activation. The README's target-table link is useful
at this level; the opening need not reproduce runtime contracts.

## Limits and reconciliation

This is one source-grounded editorial reading, not an observed test with plugin
users. The proposal clarifies the product's contribution without asserting that
ordinary coding agents lack these capabilities or that installing the plugin
guarantees a particular behavior. Its opening emphasis follows the coordinating
writer's stated choice, which remains open to the author's response.

I have not proposed changes beyond the assigned opening. The rest of the README
provided surrounding context, including the catalog and target differences.
The current README was already modified when I inspected its status; I left
that file and all other canonical files untouched.
