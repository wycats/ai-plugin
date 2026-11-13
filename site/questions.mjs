// Editorial entrances to the collection, written for this reading edition.
// Each question begins from a situation a reader can recognize in the essay
// and carries a guide (see guide.mjs): an account of how someone can work
// through it, with each reading noted beside the moment its judgment
// contributes. The account has an order because it follows one example; the
// readings themselves are not stages, and the closing says how they return.
//
// A reading can appear in several questions. Its note describes its part in
// this situation, while the reading, its page, and its index entry stay the
// same; Contents names its other questions beside the note.
//
// Guide prose is editorial. A `quote` is the essay's exact words, credited to
// its chapter and checked at build time: it must occur once in the named
// chapter, and a {phrase} inside it must be the essay's own link to the
// unit's reading. The independent cue locates the question in the essay;
// it does not require the guide to include an excerpt.
//
// A `situation` is one or two plain sentences shown under a folded question.
// It describes the circumstances at the cue in concrete terms, so a reader can
// recognize them before opening the guide; the lead then takes over.
//
// Write in plain, concrete sentences that read in order. Address the reader
// as "you"; name other people by their part in the work.

const stance = name => `skills/stances/${name}/SKILL.md`;
const workflow = name => `skills/workflows/${name}/SKILL.md`;

export const questions = [
  {
    id: 'unease',
    cue: { section: 'developing-an-approach', text: 'the user says the six independent choices feel wrong.' },
    question: 'The design feels wrong, but it’s hard to say why. Where do we begin?',
    short: 'something feels wrong',
    situation: 'A settings screen has grown to six independent choices. Each made sense when it was added.',
    lead: 'Treat the user’s reaction as evidence. For a settings screen that feels wrong, work through a setup the user would actually choose, adapt, and share.',
    guide: [
      {
        quote: { section: 'developing-an-approach', text: 'As {we look at the screen together}, the user says the six independent choices feel wrong.' },
        text: ['Look at the same screen, document, or code together. Point to the details that prompt the reaction, so both of you are discussing the same thing.'],
        note: [stance('joint-reading'), 'Examine the same material together. Each of you may notice something the other has missed.'],
      },
      {
        text: ['Offer the user a possible explanation. Perhaps the screen asks people to assemble a setup they expected the product to provide. {Let the user’s response develop the idea}. In the essay, the user explains that they want to choose a coherent setup, adapt it, and share it.'],
        note: [stance('socratic-elicitation'), 'Put a possible explanation into words. A correction can reveal more than agreement would.'],
      },
      {
        text: ['{Ask for a setup the user would share with a colleague}. Which choices would the colleague keep, and which would they need to change? In the essay, the example reveals that some choices belong to the shared setup while others need to stay specific to each person’s work.'],
        note: [stance('diagnostic-questioning'), 'Ask questions whose answers could change the work. Each answer can change which question is worth asking next.'],
      },
      {
        text: ['{Describe the distinction to the user and ask whether it fits their example}. Try it in a small mockup so you can examine which choices would be shared and which each person would make.'],
        note: [stance('collaborative-grounding'), 'Show the user what you understand. Their experience can change the idea and which part is worth trying next.'],
      },
    ],
    closing: 'The user’s unease has led to a design you can try together: choosing and adapting a shared setup. If the mockup still feels wrong, return to the example and investigate what it asks the user to do.',
  },
  {
    id: 'result',
    cue: { section: 'working-through-a-change', text: 'We might improve an expensive operation and find the speedup we expected.' },
    question: 'The change worked as predicted. What did it teach us?',
    short: 'a result that worked',
    situation: 'The benchmark shows the speedup you expected, and the plan already names the next optimization.',
    lead: 'You made an expensive operation faster, and the benchmark shows the speedup you expected. Now investigate how the product uses that operation. It may be doing work it could avoid.',
    guide: [
      {
        quote: { section: 'working-through-a-change', text: 'We might improve an expensive operation and {find the speedup we expected}.' },
        text: ['Keep the benchmark’s workload in view when explaining the result. If it measured how quickly a documentation tool recomputes answers after an edit, it tells you how much faster that computation was in the test.'],
        note: [stance('hypothesis-evaluating'), 'Judge what the result establishes and the conditions under which you observed it.'],
      },
      {
        text: ['Trace which answers the edit could have changed. You may find that many answers remain valid, even though the tool computes them again. {That changes what the earlier measurements mean}: you have sped up the computation, but some of it may be unnecessary.'],
        note: [stance('interpretive-synthesis'), 'A new detail can change your explanation, including what earlier observations meant.'],
      },
      {
        text: ['{Predict what reusing those answers would change}. If most remain valid after an edit, the tool should be able to skip most of the repeated calls. Check the dependencies that make an answer safe to reuse, then measure the work saved.'],
        note: [stance('hypothesis-forming'), 'Make the expectation specific enough to be wrong, and say which decision the check could change.'],
      },
      {
        text: ['{Decide which change now deserves the work}: a faster operation, fewer calls, or both. Compare how each would help people get answers while editing their documentation. Some calls may still be necessary to meet a requirement you have not yet examined.'],
        note: [stance('vision-steering'), 'Keep in view what the work should make possible for people. A result can change which improvement matters most.'],
      },
    ],
    closing: 'The speedup is still useful for work the tool must perform. The next check can tell you how much work it could skip, giving you a reason to keep improving the operation, focus on reuse, or pursue both.',
    plate: true,
  },
  {
    id: 'express',
    cue: { section: 'working-through-a-change', text: 'Before removing the old structures, return to the cases and decisions they preserved.' },
    question: 'We have learned something. How should the design express it?',
    short: 'expressing what we learned',
    situation: 'A new approach has taken over, and the old paths are still in the code.',
    lead: 'Restructure the code so it directly expresses what you’ve learned. Keep the cases that need different behavior separate from each other.',
    reading: [workflow('architectural-distillation'), 'Work out what the existing code and its history can teach you before deciding what to change.'],
    guide: [
      {
        text: ['Write down what you understand about the system, including the cases it must handle and why they differ. As you examine the code and its history, {revise that account when you find something it doesn’t explain}.'],
        note: [stance('interpretive-synthesis'), 'A new detail can change your explanation. Rereading the code with that explanation may reveal something you missed.'],
      },
      {
        quote: { section: 'working-through-a-change', text: 'Before removing the old structures, {return to the cases and decisions they preserved}.' },
        text: [
          'For example, a request might succeed even if the caller never receives confirmation. Before removing the recovery code, check how the proposed design would avoid performing the same action twice.',
          'If you discover a requirement you missed, revise your account. Keep any cases you cannot yet explain available for further investigation.',
        ],
        note: [stance('gap-reading'), 'Return to the material your account leaves out. What you find can send you back to reconsider the explanation above.'],
      },
      {
        text: ['{Ask someone who wasn’t part of the investigation to read your account}. Can they understand why the difficult cases matter and assess the changes you propose? Supply the context they need. If you cannot explain a choice, investigate it further.'],
        note: [stance('reader-orientation'), 'Explain the design for someone who has not followed the work. Give them enough context to reason about it and question your choices.'],
      },
    ],
    closing: 'Check the proposed design against your account. Does it handle the cases and preserve the constraints you found? If implementation reveals another constraint, return to the evidence and revise the account again.',
  },
  {
    id: 'explain',
    cue: { section: 'learning-from-use', text: 'we have to make those choices understandable without recounting every attempt.' },
    question: 'How do we explain the design to people who weren’t there?',
    short: 'explaining the design',
    situation: 'The design came out of a long conversation. The people who will use it were not there.',
    lead: 'Someone choosing a shared setup needs to know whether it is a starting point they can adapt or will also receive later changes from its author. Explain what each choice would do, and why both forms of sharing can be useful.',
    guide: [
      {
        quote: { section: 'learning-from-use', text: "As we {explain the design for people who weren't part of the conversation}, we have to make those choices understandable without recounting every attempt." },
        text: ['In the essay, one user wants a starting point they can adapt. An earlier example describes a team that wants to receive updates. Explain how each form of sharing serves that use, so a colleague can assess the distinction without having followed the investigation.'],
        note: [stance('public-design-reasoning'), 'Write an account people can build on, teach from, and later revise without the conversation that produced it.'],
      },
      {
        text: ['{Explain which settings change when a setup’s author publishes an update}. Check that account against the implementation, including what happens to settings someone has adapted. Keep the explanation accurate as the behavior changes.'],
        note: [stance('relational-continuity'), 'Keep each sentence attached to the work it describes, so someone continuing the work later knows what it refers to.'],
      },
      {
        text: ['{Explain the choice where someone adopts a setup}. They need to know whether later updates will change it and what happens to their own adaptations. Link to examples and further detail from there.'],
        note: [stance('reader-orientation'), 'Give people the context they need where they meet the design, with a route to further detail.'],
      },
    ],
    closing: 'A reader should be able to choose the form of sharing that fits their work and predict what an update will do. If you cannot explain what happens to an adapted setting, return to that case with the user before presenting the choice as settled.',
  },
];
