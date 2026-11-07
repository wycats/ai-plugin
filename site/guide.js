/**
 * Draws the strokes joining a guide's linked phrases to their notes (see
 * guide.mjs). The stylesheet shows them only when the notes have a margin.
 * Each stroke starts in the gutter, level with the end of its phrase, and
 * arrives at the note's title. It stays out of the prose column, because a
 * paragraph can continue after its linked phrase.
 */
const ns = 'http://www.w3.org/2000/svg';

export function setupGuides(root = document) {
  for (const account of root.querySelectorAll('[data-guide-account]')) {
    let frame;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(account));
    };
    // Also fires when a question unfolds or Contents opens, as the account
    // changes from unrendered to its laid-out size.
    new ResizeObserver(schedule).observe(account);
    document.fonts.ready.then(schedule);
  }
}

function draw(account) {
  const threads = account.querySelector('.guide-threads');
  threads.replaceChildren();
  const box = account.getBoundingClientRect();
  if (!box.width || getComputedStyle(threads).display === 'none') return;
  for (const unit of account.querySelectorAll('.guide-unit')) {
    const line = [...unit.querySelector('.guide-phrase').getClientRects()].filter(rect => rect.width).at(-1);
    const column = unit.querySelector('.guide-passage').getBoundingClientRect();
    const title = unit.querySelector('.guide-note h4').getBoundingClientRect();
    if (!line) continue;
    const start = { x: column.right - box.left + 8, y: line.bottom - box.top + 2 };
    const gutter = start.x + 8;
    const end = { x: title.left - box.left - 8, y: title.top - box.top + title.height * 0.55 };
    if (end.x - gutter < 24) continue;
    const stroke = document.createElementNS(ns, 'path');
    stroke.setAttribute('d', `M${start.x},${start.y} H${gutter} C${gutter + 22},${start.y} ${end.x - 22},${end.y} ${end.x},${end.y}`);
    threads.append(stroke);
  }
}
