// A question's guide: an authored account of how someone can work through
// the situation, with each reading noted beside the moment its judgment
// contributes. The guide's prose is editorial. A short excerpt from the
// essay may appear where its exact words help; it is quoted, credited, and
// checked against the essay at build time.
//
// The account is a sequence of units. Each unit is one or more paragraphs
// with one linked {phrase}, and a note on the reading that phrase leads to.
// A question may also name the reading its account follows most closely; the
// guide then opens and closes with that reading. guide.js draws the joining
// strokes between phrases and notes when the margin has room.
import { escape } from './presentation.mjs';

const phrase = /\{([^{}]*)\}/g;
const anyBrace = /[{}]/;
const plain = text => text.replace(phrase, '$1');
const spaced = text => text.replace(/\s+/g, ' ').trim();

/**
 * Validates a question's guide against the essay and the rendered readings.
 * `story.find(section, text)` returns the passages in a chapter whose text
 * contains `text`; `story.links(passage)` returns its reading links as
 * `{ href, text }`; `href(page)` is a reading's page.
 */
export function resolveGuide(question, { sourcePage, story, href }) {
  const fail = message => { throw new Error(`Question ${question.id}: ${message}`); };
  for (const [name, text] of [['lead', question.lead], ['closing', question.closing]]) {
    if (!text || anyBrace.test(text)) fail(`its ${name} must be plain prose`);
  }
  const cue = question.cue;
  if (!cue?.section || !cue.text?.trim() || anyBrace.test(cue.text)) fail('its cue must name a chapter and plain source text');
  const locations = story.find(cue.section, spaced(cue.text));
  if (locations.length !== 1) fail(`its cue must occur once in ${cue.section}, found ${locations.length}`);
  const passage = locations[0];
  const main = question.reading && { page: sourcePage(question.reading[0]), role: question.reading[1] };
  const units = question.guide.map((unit, index) => {
    const where = `guide unit ${index + 1}`;
    const note = { page: sourcePage(unit.note[0]), role: unit.note[1] };
    if (anyBrace.test(note.role)) fail(`${where}: a note is plain prose`);
    const quote = unit.quote && excerpt(unit.quote, note, where);
    const paragraphs = (unit.text || []).map(segments);
    const phrases = [quote?.segments, ...paragraphs].filter(Boolean).flat().filter(part => part.phrase).length;
    if (phrases !== 1) fail(`${where} must link exactly one {phrase} to its note, found ${phrases}`);
    return { note, quote, paragraphs };
  });
  const readings = [main, ...units.map(unit => unit.note)].filter(Boolean);
  if (new Set(readings.map(reading => reading.page)).size !== readings.length) {
    fail('a reading appears once in its guide');
  }
  return { passage, lead: question.lead, closing: question.closing, main, units, readings };

  function excerpt({ section, text }, note, where) {
    const words = spaced(plain(text));
    const found = story.find(section, words);
    if (found.length !== 1) fail(`${where}: its excerpt must occur once in ${section}, found ${found.length}`);
    const parts = segments(text);
    for (const part of parts.filter(part => part.phrase)) {
      const linked = story.links(found[0]).some(link => link.href === href(note.page) && spaced(link.text) === spaced(part.phrase));
      if (!linked) fail(`${where}: the quoted phrase “${part.phrase}” must be the essay's own link to ${note.page.title}`);
    }
    return { passage: found[0], segments: parts };
  }
  function segments(text) {
    const parts = [];
    let last = 0;
    for (const match of text.matchAll(phrase)) {
      if (match.index > last) parts.push({ text: text.slice(last, match.index) });
      if (!match[1].trim()) fail('a {phrase} needs words');
      parts.push({ phrase: match[1] });
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last) });
    if (parts.some(part => part.text && anyBrace.test(part.text))) fail(`unbalanced braces in “${text}”`);
    return parts;
  }
}

// The reading arrow after "Read …": a drawn pen stroke, hidden from
// assistive technology; the link's words carry its meaning.
const arrow = '<svg class="reading-arrow" viewBox="0 0 44 20" aria-hidden="true" focusable="false"><path d="M2 12 C12 9 24 9 37 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M30 4 Q36 8 42 10 Q36 12 31 17 L34 11 Z" fill="currentColor"/></svg>';

/**
 * Renders a resolved guide. `href(page)` is a reading's address when chosen
 * from this question, and `link(page, html, className)` a link to it;
 * `also(page)` names its other questions; `citation(passage)` gives the
 * `{ href, label }` of an essay passage. `after` follows the closing.
 */
export function guideMarkup(question, guide, { href, link, also, citation, after = '' }) {
  const id = suffix => `question-${question.id}-${suffix}`;
  const prose = (parts, page) => parts.map(part => part.phrase
    ? link(page, escape(part.phrase), 'guide-phrase')
    : escape(part.text)).join('');
  const quote = ({ passage, segments }, page) => {
    const source = citation(passage);
    return `<blockquote class="guide-quote"><p>“${prose(segments, page)}” <cite>—&nbsp;<a href="${source.href}">${escape(source.label)}</a></cite></p></blockquote>`;
  };
  const heading = (page, suffix) => `<h4 id="${id(suffix)}">${link(page, escape(page.title))}</h4>`;
  const main = guide.main
    ? `<section class="guide-reading" aria-labelledby="${id('reading')}" data-reading="${href(guide.main.page)}">${heading(guide.main.page, 'reading')}<p>${escape(guide.main.role)}</p>${also(guide.main.page)}</section>`
    : '';
  const units = guide.units.map(({ note, quote: excerpt, paragraphs }, index) =>
    `<div class="guide-unit" data-reading="${href(note.page)}"><div class="guide-passage">${excerpt ? quote(excerpt, note.page) : ''}${paragraphs.map(parts => `<p>${prose(parts, note.page)}</p>`).join('')}</div>`
    + `<aside class="guide-note" aria-labelledby="${id(`note-${index + 1}`)}">${heading(note.page, `note-${index + 1}`)}<p>${escape(note.role)}</p>${also(note.page)}</aside></div>`).join('\n');
  const next = guide.main
    ? `<p class="guide-next">${link(guide.main.page, `<span>Read ${escape(guide.main.page.title)}</span>${arrow}`, 'reading-onward')}</p>`
    : '';
  return `<div class="question-guide"><p class="guide-lead">${escape(guide.lead)}</p>${main}
<div class="guide-account" data-guide-account>${units}<svg class="guide-threads" aria-hidden="true" focusable="false"></svg></div>
<p class="guide-closing">${escape(guide.closing)}</p>${after}${next}</div>`;
}
