import { setupContents } from './contents.js';
import { setupMarginalia } from './marginalia.js';
import { arrivalFrom, carry, returnAction, arrivalTarget } from './origin.js';
import { setupGuides } from './guide.js';
import { applyArtworkTheme, observeDeferredArtwork } from './artwork.js';

const root = document.documentElement;
const paper = document.querySelector('.paper-choice');
function applyPaper() {
  const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  paper.textContent = theme === 'dark' ? 'Use light paper' : 'Use dark paper';
  applyArtworkTheme(document, theme);
}
paper.hidden = false;
paper.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('reading-paper', root.dataset.theme); } catch { /* Optional preference storage. */ }
  applyPaper();
});
applyPaper();
observeDeferredArtwork(document, () => root.dataset.theme === 'dark' ? 'dark' : 'light');
const tools = document.querySelector('.reading-tools');
new ResizeObserver(() => {
  root.style.setProperty('--tools-height', `${tools.getBoundingClientRect().height}px`);
}).observe(tools);

const returnAnchor = document.body.dataset.returnAnchor;
const passages = JSON.parse(document.body.dataset.passages);
const readingOrigins = new Set(Object.keys(passages));
const story = document.body.classList.contains('story-reading');
const params = new URLSearchParams(location.search);
const questionIds = [...document.querySelectorAll('#contents details.question')].map(question => question.id.replace(/^question-/, ''));
const arrival = story
  ? { passage: null, note: false, question: null }
  : arrivalFrom(location.search, { passages, noteAnchor: returnAnchor, questions: questionIds });
function carryOrigin(container, context) {
  for (const link of container.querySelectorAll('a[href]')) {
    const carried = carry(link.href, location.href, context);
    if (carried !== link.href) link.href = carried;
  }
}
for (const button of document.querySelectorAll('[data-beside]')) button.hidden = false;
if (!story) {
  carryOrigin(document, arrival);
  showReturn(returnAction(arrival, passages));
  showChosenQuestion(arrival.question);
}

// The edges of a reading name the book until the address shows where the
// reader left it; then they offer that actual return, with its place.
function showReturn(action) {
  if (!action) return;
  for (const link of document.querySelectorAll('[data-return-to-reading]')) {
    link.href = action.href;
    link.querySelector('[data-return-label]').textContent = action.label;
    const numeral = Object.assign(document.createElement('span'), { className: 'cue-chapter', textContent: action.chapter || 'opening' });
    const section = Object.assign(document.createElement('span'), { className: 'visually-hidden', textContent: `, ${action.section}: ` });
    const excerpt = Object.assign(document.createElement('span'), { className: 'cue-excerpt', textContent: `“${action.excerpt}”` });
    link.querySelector('[data-origin-cue]').replaceChildren(' ', numeral, section, excerpt);
  }
  for (const note of document.querySelectorAll('[data-edge-note]')) note.hidden = true;
  for (const reminder of document.querySelectorAll('[data-origin]')) reminder.hidden = false;
}

// The question the reader chose this reading from, possibly several readings
// ago. Its annotation offers the way back to it, and Contents opens there.
function showChosenQuestion(id) {
  if (!id) return;
  const notes = document.querySelector('[data-beside-notes]');
  if (!notes) return;
  let entry = notes.querySelector(`[data-question="${id}"]`);
  if (!entry) {
    // A later hop: this reading is not part of that question. Name the
    // question the reader came from, without a role it does not have here.
    const group = document.createElement('div');
    group.className = 'beside-group beside-chosen';
    group.innerHTML = `<p class="beside-label">From the question</p><section class="beside-question"><p class="beside-text"></p><button type="button" class="beside-open">${document.querySelector('.folded-tab')?.outerHTML || ''}<span data-open-label></span></button></section>`;
    entry = group.querySelector('.beside-question');
    entry.dataset.question = id;
    entry.querySelector('.beside-text').textContent = document.querySelector(`#question-${id} .question-text`).textContent;
    entry.querySelector('button').dataset.openQuestion = `question-${id}`;
    notes.prepend(group);
    notes.hidden = false;
  }
  entry.querySelector('[data-open-label]').textContent = 'Back to this question';
  const question = document.getElementById(`question-${id}`);
  for (const other of document.querySelectorAll('#contents details.question')) other.open = other === question;
}

// Resuming lands on the passage itself. When it opens a chapter, the chapter
// heading comes into view with it. The arrival mark identifies the passage in
// the book's own terms and serves as its focus indicator until focus moves on.
function arrive(passage) {
  arrivalTarget(passage).scrollIntoView();
  passage.dataset.arrival = '';
  passage.addEventListener('blur', () => delete passage.dataset.arrival, { once: true });
  passage.focus({ preventScroll: true });
}
// A return lands on its passage, or on the passage whose note it reopens.
const resume = params.get('resume') ?? (params.get('note') === returnAnchor ? returnAnchor : null);
if (story && readingOrigins.has(resume)) {
  document.fonts.ready.then(() => arrive(document.getElementById(resume)));
}

function openDialog(dialog, opener, beforeReturn = () => {}) {
  const restore = () => {
    beforeReturn();
    document.body.classList.toggle('dialog-open', Boolean(document.querySelector('dialog[open]')));
    const target = document.getElementById(dialog.dataset.focusTarget);
    delete dialog.dataset.focusTarget;
    (target || opener).focus({ preventScroll: true });
  };
  dialog.addEventListener('close', restore, { once: true });
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.querySelector('[data-close-dialog]').focus({ preventScroll: true });
}
for (const button of document.querySelectorAll('[data-close-dialog]')) {
  button.addEventListener('click', () => button.closest('dialog').close());
}
function captureContentsOrigin(dialog) {
  if (!story) return;
  // Read the paragraph beneath the fixed tools before opening the modal.
  // The annotation's wrapper also contains its note; measure only its prose.
  const line = tools.getBoundingClientRect().bottom + 24;
  const elements = [...readingOrigins].map(id => document.getElementById(id)).filter(Boolean);
  const passage = elements.find(element =>
    (element.querySelector('.passage') || element).getBoundingClientRect().bottom > line
  ) || elements.at(-1);
  if (passage) carryOrigin(dialog, { passage: passage.id, note: false, question: null });
  return passage?.id;
}
setupContents(openDialog, captureContentsOrigin, passages, arrive, (dialog, passage) => {
  carryOrigin(dialog, { passage, note: false, question: null });
});
setupMarginalia(openDialog);
setupGuides();
