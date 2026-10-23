/** Layout for the first authored annotation. Multiple-note placement is separate work. */
export function setupMarginalia(openDialog) {
  const passage = document.querySelector('.annotated');
  if (!passage) return;
  const note = passage.querySelector('.marginal-note');
  const anchor = passage.querySelector('.annotation-anchor');
  const initial = note.querySelector('.initial');
  const toggle = passage.querySelector('.note-toggle');
  const opener = note.querySelector('.open-map');
  const dialog = document.querySelector('#encounter');
  const heading = dialog.querySelector('.encounter-head');
  const close = heading.querySelector('[data-close-dialog]');
  function fitHeading() {
    if (!dialog.open) return;
    const clearance = close.getBoundingClientRect().height + 14;
    heading.style.setProperty('--close-clearance', `${clearance}px`);
  }
  new ResizeObserver(fitHeading).observe(close);
  let inlineOpen = new URLSearchParams(location.search).get('note') === passage.id;
  let margin = false;
  let frame;
  toggle.hidden = false;
  opener.hidden = false;

  function layout() {
    const main = document.querySelector('main');
    const style = getComputedStyle(main);
    const available = Math.min(1180, document.documentElement.clientWidth)
      - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    margin = available >= Math.max(1020, parseFloat(getComputedStyle(document.body).fontSize) * 43);
    document.body.dataset.noteLayout = margin ? 'margin' : 'inline';
    if (!margin && dialog.open) inlineOpen = true;
    // A resize keeps the reader's focused note available in its new location.
    if (!margin && note.contains(document.activeElement)) inlineOpen = true;
    note.hidden = !margin && !inlineOpen;
    toggle.setAttribute('aria-expanded', String(inlineOpen));
    if (margin && document.activeElement === toggle) note.querySelector('a').focus({ preventScroll: true });
    if (!margin) return;

    const bounds = passage.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(anchor);
    const lines = [...range.getClientRects()].filter(rect => rect.width > 0);
    const last = lines.at(-1);
    if (!last) return;
    const artBefore = initial.getBoundingClientRect();
    const entryWithinNote = artBefore.top - note.getBoundingClientRect().top + artBefore.height * Number(passage.dataset.attachmentY);
    // Preserve the accepted slight fall into the initial, deriving placement
    // from the artwork rather than a particular paragraph's line count.
    const noteTop = Math.max(64, last.bottom - bounds.top + 15 - entryWithinNote);
    note.style.setProperty('--note-offset', `${noteTop}px`);
    const art = initial.getBoundingClientRect();
    const start = { x: last.right - bounds.left, y: last.bottom - bounds.top + 3 };
    const end = {
      x: art.left - bounds.left + art.width * Number(passage.dataset.attachmentX),
      y: art.top - bounds.top + art.height * Number(passage.dataset.attachmentY),
    };
    const handle = Number(passage.dataset.arrivalHandle);
    passage.querySelector('.underlines').replaceChildren(...lines.map(line => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${line.left - bounds.left} ${line.bottom - bounds.top + 3} H ${line.right - bounds.left}`);
      return path;
    }));
    passage.querySelector('.connector').setAttribute('d', `M ${start.x} ${start.y} C ${Math.max(start.x + 20, end.x - 60)} ${start.y + 6}, ${end.x - handle} ${end.y}, ${end.x} ${end.y}`);
  }
  function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); }
  toggle.addEventListener('click', () => { inlineOpen = !inlineOpen; layout(); });
  const observer = new ResizeObserver(schedule);
  for (const element of [document.querySelector('main'), passage.querySelector('.passage'), note, initial]) observer.observe(element);
  window.addEventListener('resize', schedule);
  document.fonts.ready.then(schedule);
  document.fonts.addEventListener('loadingdone', schedule);
  initial.addEventListener('load', schedule);
  opener.addEventListener('click', () => {
    openDialog(dialog, opener, () => {
      if (!margin) inlineOpen = true;
      layout();
    });
    fitHeading();
  });
  layout();

  const map = dialog.querySelector('.map-focus');
  const whole = dialog.querySelector('#whole-map');
  const focused = dialog.querySelector('#focused-map');
  function showMap(wholeMap) {
    whole.setAttribute('aria-pressed', String(wholeMap));
    focused.setAttribute('aria-pressed', String(!wholeMap));
    map.setAttribute('viewBox', wholeMap ? '0 0 1536 1024' : '0 0 1050 680');
    if (wholeMap) map.querySelector('image').removeAttribute('mask');
    else map.querySelector('image').setAttribute('mask', 'url(#relationship-window)');
    dialog.querySelector('#map-title').textContent = wholeMap
      ? 'Eight connected stances. Finished penwork and sketching coexist as understanding returns to questioning.'
      : 'Hypothesis Evaluating asks what the result establishes. Hypothesis Forming asks what this now leads us to expect.';
    dialog.querySelector('.map-window').scrollTo(0, 0);
  }
  whole.addEventListener('click', () => showMap(true));
  focused.addEventListener('click', () => showMap(false));
  const scale = dialog.querySelector('#map-scale');
  scale.addEventListener('click', () => {
    const enlarged = dialog.querySelector('.map-window').classList.toggle('enlarged');
    scale.setAttribute('aria-pressed', String(enlarged));
    scale.textContent = enlarged ? 'Fit the leaf' : 'Larger lettering';
  });
  if (inlineOpen) document.fonts.ready.then(() => {
    layout();
    passage.scrollIntoView();
    (margin ? passage : toggle).focus({ preventScroll: true });
  });
}
