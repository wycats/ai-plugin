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
const origin = new URLSearchParams(location.search).get('from');
if (readingOrigins.has(origin)) {
  for (const link of document.querySelectorAll('a[href]')) {
    const destination = new URL(link.href);
    if (destination.origin === location.origin && destination.pathname.startsWith(new URL('.', location.href).pathname) && /\/reference-\d+\.html$/.test(destination.pathname)) {
      destination.searchParams.set('from', origin);
      link.href = destination.href;
    }
  }
  for (const link of document.querySelectorAll('[data-return-to-reading]')) {
    link.href = origin === returnAnchor
      ? `index.html?note=${origin}#${origin}`
      : `index.html?resume=${origin}#${origin}`;
    link.textContent = 'Return to the passage';
  }
}
const resume = new URLSearchParams(location.search).get('resume');
if (document.body.classList.contains('story-reading') && readingOrigins.has(resume)) {
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
setupContents(openDialog);
setupMarginalia(openDialog);
