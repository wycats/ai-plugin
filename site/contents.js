export function setupContents(openDialog) {
  const dialog = document.querySelector('#contents');
  const toggle = document.querySelector('.contents-toggle');
  const title = dialog.querySelector('#contents-title');
  const index = dialog.querySelector('.contents-index');
  const map = dialog.querySelector('#contents-map');
  const explore = dialog.querySelector('#explore-relationships');
  const back = dialog.querySelector('#return-to-contents');
  const heading = dialog.querySelector('.contents-heading');
  const close = heading.querySelector('[data-close-dialog]');
  function fitHeading() {
    if (!dialog.open) return;
    const clearance = close.getBoundingClientRect().height + 14;
    heading.style.setProperty('--close-clearance', `${clearance}px`);
  }
  new ResizeObserver(fitHeading).observe(close);
  let indexScroll = 0;

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    openDialog(dialog, toggle);
    fitHeading();
    toggle.setAttribute('aria-expanded', 'true');
  });
  function showIndex(restoreFocus = false) {
    map.hidden = true;
    index.hidden = false;
    title.textContent = 'Contents';
    dialog.scrollTop = indexScroll;
    if (restoreFocus) explore.focus({ preventScroll: true });
  }
  explore.addEventListener('click', () => {
    indexScroll = dialog.scrollTop;
    index.hidden = true;
    map.hidden = false;
    title.textContent = 'Relationships';
    dialog.scrollTop = 0;
    back.focus({ preventScroll: true });
  });
  back.addEventListener('click', () => showIndex(true));
  dialog.addEventListener('close', () => {
    showIndex();
    indexScroll = 0;
    toggle.setAttribute('aria-expanded', 'false');
  });
  dialog.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href);
    if (destination.pathname !== location.pathname || !destination.hash) return;
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    dialog.dataset.focusTarget = target.id;
    dialog.close();
    history.pushState(null, '', destination.href);
    target.scrollIntoView();
    target.focus({ preventScroll: true });
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
