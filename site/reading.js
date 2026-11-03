import { setupContents } from './contents.js';
import { setupMarginalia } from './marginalia.js';

const root = document.documentElement;
const paper = document.querySelector('.paper-choice');
function applyPaper() {
  const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
  paper.textContent = theme === 'dark' ? 'Use light paper' : 'Use dark paper';
  for (const image of document.querySelectorAll('[data-art]')) {
    image.setAttribute(image.tagName.toLowerCase() === 'image' ? 'href' : 'src', `${image.dataset.art}-${theme}.png`);
  }
  for (const link of document.querySelectorAll('[data-art-link]')) link.href = `${link.dataset.artLink}-${theme}.png`;
}
paper.hidden = false;
paper.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('reading-paper', root.dataset.theme); } catch { /* Optional preference storage. */ }
  applyPaper();
});
applyPaper();
const tools = document.querySelector('.reading-tools');
new ResizeObserver(() => {
  root.style.setProperty('--tools-height', `${tools.getBoundingClientRect().height}px`);
}).observe(tools);

const returnAnchor = document.body.dataset.returnAnchor;
const readingOrigins = new Set(document.body.dataset.readingOrigins.split(','));
const story = document.body.classList.contains('story-reading');
const params = new URLSearchParams(location.search);
const origin = params.get('from');
const noteOrigin = origin === returnAnchor && params.get('note') === origin ? origin : null;
function carryOrigin(container, passage, note = null) {
  for (const link of container.querySelectorAll('a[href]')) {
    const destination = new URL(link.href);
    if (destination.origin === location.origin && destination.pathname.startsWith(new URL('.', location.href).pathname) && /\/reference-\d+\.html$/.test(destination.pathname)) {
      destination.searchParams.set('from', passage);
      if (note) destination.searchParams.set('note', note);
      else destination.searchParams.delete('note');
      link.href = destination.href;
    }
  }
}
if (!story && readingOrigins.has(origin)) {
  carryOrigin(document, origin, noteOrigin);
  for (const link of document.querySelectorAll('[data-return-to-reading]')) {
    link.href = noteOrigin
      ? `index.html?note=${origin}#${origin}`
      : `index.html?resume=${origin}#${origin}`;
    (link.querySelector('[data-return-label]') || link).textContent = 'Return to the passage';
  }
  const reminder = document.querySelector('.contents-origin');
  const excerpt = JSON.parse(document.body.dataset.readingExcerpts)[origin];
  if (reminder && excerpt) {
    reminder.querySelector('[data-origin-excerpt]').textContent = `“${excerpt}”`;
    reminder.hidden = false;
  }
}
const resume = new URLSearchParams(location.search).get('resume');
if (story && readingOrigins.has(resume)) {
  document.fonts.ready.then(() => {
    const passage = document.getElementById(resume);
    passage.scrollIntoView();
    passage.focus({ preventScroll: true });
  });
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
  const passages = [...readingOrigins].map(id => document.getElementById(id)).filter(Boolean);
  const passage = passages.find(element =>
    (element.querySelector('.passage') || element).getBoundingClientRect().bottom > line
  ) || passages.at(-1);
  if (passage) carryOrigin(dialog, passage.id);
}
setupContents(openDialog, captureContentsOrigin);
setupMarginalia(openDialog);
