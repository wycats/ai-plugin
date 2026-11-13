import { questionAt } from './origin.js';

/**
 * Contents is one leaf with three parts: the chapters, questions to begin
 * from, and the index of readings. Opening it from the story unfolds the
 * question that arises in the passage being read; opening it from a reading
 * unfolds a question that reading belongs to (set by the build). A door in
 * the page (`data-open-contents`) opens it at the part it names.
 */
export function setupContents(openDialog, beforeOpen = () => {}, passages = {}, arrive = target => target.focus({ preventScroll: true }), restoreOrigin = () => {}) {
  const dialog = document.querySelector('#contents');
  const toggle = document.querySelector('.contents-toggle');
  const heading = dialog.querySelector('.contents-heading');
  const close = heading.querySelector('[data-close-dialog]');
  const questions = [...dialog.querySelectorAll('details.question')];
  const historyKey = 'readingContents';
  let closingForHistory = false;
  let origin = null;

  function saveContents() {
    const question = questions.find(item => item.open);
    const focusables = [...dialog.querySelectorAll('a, button, summary, [tabindex]')];
    const state = dialog.open ? { question: question?.id || null, scrollTop: dialog.scrollTop, focus: focusables.indexOf(document.activeElement), origin } : null;
    history.replaceState({ ...history.state, [historyKey]: state }, '');
  }

  function restoreContents() {
    const state = history.state?.[historyKey];
    if (!state) {
      if (dialog.open) {
        closingForHistory = true;
        dialog.close();
      }
      return;
    }
    origin = state.origin ?? null;
    if (origin !== null) restoreOrigin(dialog, origin);
    const question = questions.find(item => item.id === state.question);
    if (!dialog.open) openDialog(dialog, toggle);
    unfold(question);
    fitHeading();
    toggle.setAttribute('aria-expanded', 'true');
    dialog.scrollTop = state.scrollTop;
    const focus = dialog.querySelectorAll('a, button, summary, [tabindex]')[state.focus];
    (focus || question?.querySelector('summary'))?.focus({ preventScroll: true });
  }
  function fitHeading() {
    if (!dialog.open) return;
    const clearance = close.getBoundingClientRect().height + 14;
    heading.style.setProperty('--close-clearance', `${clearance}px`);
    dialog.style.setProperty('--contents-heading-height', `${heading.getBoundingClientRect().height}px`);
  }
  new ResizeObserver(fitHeading).observe(close);
  new ResizeObserver(fitHeading).observe(heading);

  function unfold(question) {
    for (const other of questions) other.open = other === question;
  }
  function show(opener = toggle) {
    if (dialog.open) return;
    origin = beforeOpen(dialog) ?? null;
    const reached = questionAt(origin, questions.map(question => question.dataset.passage), passages);
    if (reached !== null) unfold(questions[reached]);
    openDialog(dialog, opener);
    dialog.scrollTop = 0;
    fitHeading();
    toggle.setAttribute('aria-expanded', 'true');
  }

  // Opening a later question closes the long guide above it. Keep the
  // chosen heading in view after that layout change, for clicks and keys.
  for (const question of questions) {
    question.querySelector('summary').addEventListener('click', () => {
      if (question.open) return;
      requestAnimationFrame(() => {
        if (dialog.open && question.open) question.scrollIntoView({ block: 'start' });
      });
    });
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => show());
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    if (closingForHistory) closingForHistory = false;
    else saveContents();
  });

  // A history entry owns its open Contents, including its place in the leaf.
  // Reloads and new visits start closed; traversals recover the saved entry.
  window.addEventListener('pagehide', saveContents);
  window.addEventListener('pageshow', event => {
    if (event.persisted || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') restoreContents();
  });
  window.addEventListener('popstate', restoreContents);

  // "Beside" buttons, on a reading's rubric or within another question, open
  // the named question in place so its neighbors and their parts are visible.
  for (const button of document.querySelectorAll('[data-open-question]')) {
    button.addEventListener('click', () => {
      const question = dialog.querySelector(`#${button.dataset.openQuestion}`);
      show(button);
      unfold(question);
      question.scrollIntoView({ block: 'start' });
      question.querySelector('summary').focus({ preventScroll: true });
    });
  }

  // Doors in the page open Contents at one of its parts: the edition's note
  // and each page's foot lead to the questions and the index.
  for (const door of document.querySelectorAll('[data-open-contents]')) {
    door.addEventListener('click', () => {
      const part = dialog.querySelector(`#${door.dataset.openContents}`);
      show(door);
      part.scrollIntoView({ block: 'start' });
      part.focus({ preventScroll: true });
    });
  }

  dialog.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href);
    if (link.target && link.target !== '_self' || link.hasAttribute('download')) return;
    if (destination.pathname !== location.pathname || destination.search !== location.search || !destination.hash) {
      saveContents();
      return;
    }
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    if (dialog.contains(target)) {
      target.scrollIntoView({ block: 'start' });
      target.focus({ preventScroll: true });
      return;
    }
    saveContents();
    dialog.dataset.focusTarget = target.id;
    closingForHistory = true;
    dialog.close();
    history.pushState(null, '', destination.href);
    if (passages[target.id]) arrive(target);
    else {
      target.scrollIntoView();
      target.focus({ preventScroll: true });
    }
  });

  const links = [...dialog.querySelectorAll('[data-section]')];
  const sections = links.map(link => document.getElementById(link.dataset.section));
  function locate() {
    let current = -1;
    sections.forEach((section, i) => { if (section?.getBoundingClientRect().top <= 150) current = i; });
    links.forEach((link, i) => {
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let frame;
  window.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(locate);
  }, { passive: true });
  window.addEventListener('resize', locate);
  document.fonts.ready.then(locate);
  locate();
}
