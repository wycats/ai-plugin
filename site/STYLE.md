# Reading edition style

Use this guide when writing question guides, introductions, marginal notes,
captions, or navigation for the reading edition. Help readers choose what to
read and understand how it applies to their work.

The story, stances, and workflows are instructions written to a coding agent.
[QUALITY.md](../QUALITY.md) governs those source texts. The edition renders them
unchanged, and quotations reproduce their words exactly. The guidance below
applies to the prose we add around them, including this guide.

## Develop the reader's understanding across the whole piece

Help readers understand the situation well enough to think alongside the
writer. Begin with what is happening and why it matters. Develop that
understanding as the details arrive, showing how each important finding changes
or supports the idea. [Reader Orientation](../skills/stances/reader-orientation/SKILL.md#develop-the-readers-intuition-through-the-details)
explains this relationship across different kinds of work.

For example, an explanation of a proposed customer-record migration might open:

> Moving customer records to a new database means preserving what customers
> told us, even when the new database organizes that information differently.

The explanation can then examine a proposed script that splits each full name
at the first space. A customer with a single name has no such split. Another
customer's given name may contain spaces. Connect these cases to the original
purpose: the script would guess at information the customer never supplied.
Keeping the original name preserves it while the team investigates which tools
need separate name fields.

The conclusion can return to the opening idea with those cases behind it:

> Preserve each customer's full name as supplied. Store separate given and
> family names when the customer provides them. This preserves what customers
> told us while allowing tools to use the extra detail they supply. Before
> adopting the migration, check
> how downstream tools handle names without separate parts.

The ending returns to preserving customer information with a specific choice
and the reasons for it. Use the conclusion to explain what follows from the
findings. If they changed the opening idea, state the revised version.

Keep details together when they help explain each other. A proposed change
belongs near the problem it would address, including the uncertainty that
affects whether to try it. For example, explain a proposed retry mechanism
alongside the request that can succeed without returning confirmation. Readers
can then judge how the retry might perform the same action twice.

## Explain the subject directly

Give readers the information they need to understand a claim. In a guide about
sharing experimental results, “give your colleague the measured improvement,
the untested condition, and the next check” still leaves readers to work out
what the colleague needs to hear. Show the explanation in the situation:

> Updates appeared sooner in our local test of the shared-notes app. We haven't
> tested several people editing at once, so we don't yet know how quickly their
> updates appear or whether they arrive in the right order. Have several people
> edit at once and check both.

This names what improved, what remains unknown, and how to investigate it.
Choose this level of detail where readers need it. Once the test is familiar,
“the local result” may be enough to refer to it again.

An opening can express a sophisticated idea while naming the work it concerns.
“Migrating customer records to a new database” gives readers more to work with
than “testing migration assumptions.” Let a sentence establish its situation
before moving to the broader lesson. Paragraph breaks can give a finding and
its implications room to develop in turn.

## Write sentences readers can follow

Make clear who acts, what a phrase refers to, and how the ideas relate. [Reader Orientation](../skills/stances/reader-orientation/SKILL.md#what-the-reader-has-to-work-out)
describes the general judgment; the examples below come from this edition.

**Make the action clear.** Name who does the work when that helps readers
understand it. Abstract subjects can work: “A new detail can change your
explanation” is clear. “The new structure answers to a written account” leaves
readers to work out what “answers to” asks them to do.

| Draft | Revision |
| --- | --- |
| The new structure answers to a written account of what was learned. | Check the proposed structure against your written account of the system. Does it handle the cases you described? |
| …keeping the distinctions experience has proved. | Keep the cases that need different behavior separate from each other. |
| What remains should give each operation a name and contract a caller can use. | Give each remaining operation a name and a contract its callers can use. |

A clearer sentence must still say what we mean. Check that a revision preserves
the original claim, including any uncertainty or conditions.

**Use contrasts and qualifications where they help readers judge.** “We haven't
tested simultaneous editing” explains why the local result leaves a question
open. Advice against redesigning the whole app would introduce a choice this
example has given readers no reason to consider. Keep uncertainty precise:
“affects update delay” can be right when the direction of the effect is unknown.

**Try a different word order when a sentence is hard to follow.** Read both
versions in context and compare where you have to pause or reread.

<figure class="prose-comparison" id="word-order-comparison">
  <div class="comparison-examples">
    <div class="comparison-example">
      <p class="comparison-rubric" id="word-order-easier">Easier to follow</p>
      <blockquote aria-labelledby="word-order-easier"><p>Keep the cases that need different behavior separate from each other.</p></blockquote>
    </div>
    <div class="comparison-example">
      <p class="comparison-rubric" id="word-order-harder">Harder to follow</p>
      <blockquote aria-labelledby="word-order-harder" aria-describedby="word-order-note"><p><span class="comparison-mark">Keep</span> separate <span class="comparison-mark">the cases</span> that need different behavior.</p></blockquote>
      <p class="comparison-note" id="word-order-note">Separating “keep” from “the cases” makes this harder to follow.</p>
    </div>
  </div>
</figure>

**Introduce concrete examples.** Give readers enough context to follow an
example even if they have not read the story. Instead of referring to “the six
choices,” describe the setup screen and explain that the user wants to choose a
coherent setup, adapt it, and share it.

## Name the people in the work

Use names that tell readers which role matters:

- **You** addresses whoever is doing the work described in the guide. In the
  source instructions, “you” addresses the coding agent.
- **The user** is the person collaborating with the coding agent.
- **People using the product** are the people whose use the design affects.
  They may be different from the agent's user.
- **A colleague, reviewer, or reader** names someone's role in the work. Use
  “someone who wasn't part of the investigation” when their lack of context is
  what matters.
- **A person** fits when no particular role matters.

Use a pronoun once readers know who it refers to. Keep the same name for a role
throughout a passage. Switching among “user,” “person,” and “collaborator” for
variety can make readers wonder whether someone new has entered.

A question such as “Where do we begin?” can invite shared inquiry. When
describing a particular exchange, make clear who “we” and “they” refer to.
Preserve pronouns in quotations, including the story's “we”: the agent and the
person it works with.

For example, a guide addressed to someone working with a user can begin:

> Treat the user's reaction as evidence. Work through concrete examples
> together until both of you can explain what feels wrong and why.

The first sentence names whose reaction matters. The second says how to
investigate it together.

## Distinguish quotations from guidance

Put quoted words in quotation marks and link the credit to the source passage.
Keep the credit visibly attached to the quotation. Readers should be able to
tell which words come from the source and which we wrote for the guide.

Choose an excerpt because it helps readers understand the situation or decide
what to do. In a marginal note, explain how the linked reading helps at that
point. For example, a note beside advice to revisit unexplained cases can show
how Gap Reading helps uncover a missed requirement.

Place the credit after an em dash on the quotation's last line when it fits.
Otherwise move the whole credit to the next line, where it can wrap if needed.

## Give each visual treatment a purpose

- Use Fellowhand for titles, questions, and structural headings. Use Newsreader
  for reading prose, reading titles, and navigation.
- Use `text-wrap: pretty` for prose by default.
- Show hierarchy through type, spacing, margins, and rules. Preserve the book's
  character without enclosing each item in a box or card.
- Make illustrated controls understandable without the illustration, with
  meaningful labels and visible keyboard focus. Treat purely decorative marks
  as decoration, including for assistive technology.
