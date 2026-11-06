/**
 * How the reader arrived at a page, read from its address alone. The build
 * describes every story passage in `data-passages`; browser modules and tests
 * share these operations so what a page claims about the reader's path, the
 * links that carry it on, and the return they lead to cannot drift apart.
 *
 * Two kinds of provenance travel with an excursion. `from` names the story
 * passage it began at (with `note` when it began at that passage's marginal
 * note); it is the only thing a page may call a return. `question` names the
 * Contents question a reading was chosen from. Neither is inferred from which
 * questions a reading belongs to: that membership is static and is described
 * as such.
 */

/** The arrival described by a page address, keeping only what the edition recognizes. */
export function arrivalFrom(search, { passages, noteAnchor, questions = [] }) {
  const params = new URLSearchParams(search);
  const from = params.get('from');
  const passage = Object.hasOwn(passages, from) ? from : null;
  const note = Boolean(passage) && passage === noteAnchor && params.get('note') === passage;
  const chosen = params.get('question');
  const question = questions.includes(chosen) ? chosen : null;
  return { passage, note, question };
}

/** Where returning from an excursion lands: the reopened note, or the passage itself. */
export function returnAddress(origin, note = false) {
  return note ? `index.html?note=${origin}#${origin}` : `index.html?resume=${origin}#${origin}`;
}

/**
 * The page's return action, or null for an arrival with no story origin.
 * `place` is the chapter numeral (empty for the opening) and its section name.
 */
export function returnAction(arrival, passages) {
  if (!arrival.passage) return null;
  const passage = passages[arrival.passage];
  return {
    href: returnAddress(arrival.passage, arrival.note),
    label: arrival.note ? 'Return to the note' : 'Return to the passage',
    chapter: passage.chapter,
    section: passage.section || 'The opening',
    excerpt: passage.excerpt,
  };
}

/**
 * A reference link carried through an excursion: it keeps the story origin,
 * and the question the reader chose from unless the link names its own.
 * Other links are returned unchanged.
 */
export function carry(href, base, arrival) {
  const destination = new URL(href, base);
  const directory = new URL('.', base);
  if (destination.origin !== directory.origin || !destination.pathname.startsWith(directory.pathname)
    || !/\/reference-\d+\.html$/.test(destination.pathname)) return href;
  if (arrival.passage) {
    destination.searchParams.set('from', arrival.passage);
    if (arrival.note) destination.searchParams.set('note', arrival.passage);
    else destination.searchParams.delete('note');
  }
  if (arrival.question && !destination.searchParams.has('question')) destination.searchParams.set('question', arrival.question);
  return destination.href;
}

/**
 * The question to unfold when Contents opens at `passage`: the latest one whose
 * cue the reader has reached in the same chapter, or null before any of them.
 */
export function questionAt(passage, cues, passages) {
  if (!passages[passage]) return null;
  const order = Object.keys(passages);
  const at = order.indexOf(passage);
  let found = null;
  cues.forEach((cue, index) => {
    const position = order.indexOf(cue);
    if (passages[cue].chapter === passages[passage].chapter && position <= at && (found === null || position > order.indexOf(cues[found]))) found = index;
  });
  return found;
}
