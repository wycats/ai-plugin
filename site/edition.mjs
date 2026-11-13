// The edition speaking for itself: what a page is, whom its text addresses,
// and where a reader can go next. Canonical prose stays in the reading column
// unmarked. This copy keeps to a page's margin and edges, under a small-caps
// label, and follows STYLE.md.
//
// It claims only what the repository documents. The plugin's setup guide owns
// the installation procedure; TRYING.md explains what to expect from it.
import { escape, fold } from './presentation.mjs';

export const publicUrl = 'https://ai.wycats.dev/';
export const repositoryUrl = 'https://github.com/wycats/ai-plugin';

// Where the plugin's text is addressed. The essay's own pronouns stay as
// written; this says who they refer to (see STYLE.md, "Name the people").
const addressed = 'This essay is written to a coding agent working with you. It is part of the wycats plugin. “We” means you and the agent.';
const linked = 'Follow the underlined phrases to explore the stances and workflows behind the advice.';
const statement = 'This edition presents the essay alongside the stances and workflows it links. All of them are written to a coding agent, as the text of the wycats plugin.';

/** A control that opens Contents at one of its parts. It needs the script, so
 * it stays hidden until reading.js reveals it. */
export const contentsDoor = (part, label) =>
  `<button type="button" class="contents-door" data-open-contents="${part}" data-contents-door hidden>${fold}<span>${escape(label)}</span></button>`;

/** The note beside the essay's opening. It is an aside of the article, never
 * part of a canonical paragraph. */
export function editionNote(trying) {
  return `<aside class="edition-note" aria-labelledby="edition-note-label"><p class="edition-label"><span id="edition-note-label">About this edition</span></p><p>${addressed}</p><p>${linked}</p><p class="edition-doors">${contentsDoor('contents-questions', 'Questions to begin from')} <a href="${trying}">Trying the plugin</a></p></aside>`;
}

/** The colophon beside the chapter list in Contents. */
export function colophon(description, trying, tryingCurrent) {
  return `<div class="contents-colophon"><p>${escape(description)}</p><p>${statement}</p><p class="colophon-links"><a href="${trying}"${tryingCurrent ? ' aria-current="page"' : ''}>Trying the plugin</a></p></div>`;
}

export const questionsIntroduction = 'Each question begins from a situation in the essay. Open one to see how someone might work through it, with a note on each reading that helps along the way.';

// A direct arrival on a reading learns whom the text addresses and what kind
// of reading it is. An arrival from the essay has met both already, so the
// script replaces this with the return.
export const kinds = {
  stance: { label: 'stance', group: 'stances', about: 'Stances shape the judgment a task needs.' },
  workflow: { label: 'workflow', group: 'workflows', about: 'Workflows guide tasks such as investigating a codebase or developing an RFC.' },
};
export const addressedReading = kind => `Both are written to a coding agent.${kinds[kind] ? ` ${kinds[kind].about}` : ''}`;

/** The foot of every page: the ways on, inside the book and out of it. The
 * essay's foot also says what the edition is, for a reader who has finished. */
export function footLinks({ trying, style, story }) {
  const doors = `<p class="foot-doors" data-contents-door hidden>${contentsDoor('contents-questions', 'Questions to begin from')} ${contentsDoor('contents-index', 'Index of readings')}</p>`;
  return `${story ? `<p>${statement}</p>` : ''}${doors}<p><a href="${trying}">Trying the plugin</a> · <a href="${repositoryUrl}#setup">Install the plugin</a> · <a href="${repositoryUrl}">Source and documentation</a> · <a href="${style}">Style of this edition</a></p>`;
}

/** What a shared link shows before anyone opens the page. */
export function pageMeta({ title, description, file, story }) {
  const address = publicUrl + (story ? '' : file);
  const image = `${publicUrl}assets/illustrations/diagram-recomposed-light.png`;
  const alt = 'Our understanding of what we are building guides what we notice and pursue. What we encounter can revise that understanding.';
  return `<meta name="description" content="${escape(description)}"><link rel="canonical" href="${address}"><meta property="og:type" content="article"><meta property="og:site_name" content="Building together"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${address}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1536"><meta property="og:image:height" content="1024"><meta property="og:image:alt" content="${escape(alt)}"><meta name="twitter:card" content="summary_large_image">`;
}
