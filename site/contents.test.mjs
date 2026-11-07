import assert from 'node:assert/strict';
import test from 'node:test';
import { setupContents } from './contents.js';
import { carry } from './origin.js';

// Exercise the history boundary with a small DOM: visual placement is checked
// in a browser, while these cases cover which entry owns the saved state.
test('Contents follows history entries, but an explicit close and reload stay closed', () => {
  class Element extends EventTarget {
    constructor(id = '') { super(); this.id = id; this.dataset = {}; this.style = { setProperty() {} }; this.attrs = {}; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    getBoundingClientRect() { return { height: 20, top: 0 }; }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    focus() { document.activeElement = this; }
    scrollIntoView() {}
  }
  const dialog = new Element('contents');
  const heading = new Element();
  const close = new Element();
  const toggle = new Element();
  const question = new Element('question-result');
  question.dataset.passage = 'passage-1';
  const summary = new Element();
  question.querySelector = selector => selector === 'summary' ? summary : null;
  const target = new Element('passage-1');
  const link = new Element();
  link.href = 'https://example.test/index.html?resume=passage-1#passage-1';
  link.closest = () => link;
  link.hasAttribute = () => false;
  heading.querySelector = () => close;
  dialog.querySelector = selector => selector === '.contents-heading' ? heading : null;
  dialog.querySelectorAll = selector => selector === 'details.question' ? [question] : selector === 'a, button, summary, [tabindex]' ? [summary, link] : [];
  dialog.contains = () => false;
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event('close')); };
  const win = new EventTarget();
  const navigation = { type: 'navigate' };
  const history = { state: { other: 42 }, replaceState(state) { this.state = state; }, pushState(state) { this.state = state; } };
  const globals = {
    window: win, history, location: new URL('https://example.test/reference-13.html?question=result'),
    document: { activeElement: null, querySelector: selector => selector === '#contents' ? dialog : toggle, querySelectorAll: () => [], getElementById: id => id === target.id ? target : null, fonts: { ready: Promise.resolve() } },
    performance: { getEntriesByType: () => [navigation] }, ResizeObserver: class { observe() {} },
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
  };
  const originals = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  try {
    let captures = 0;
    let readingHref = 'https://example.test/reference-3.html?question=result';
    const applyOrigin = (_dialog, passage) => {
      readingHref = carry(readingHref, location.href, { passage, note: false, question: null });
    };
    setupContents(element => { element.open = true; }, element => { captures++; applyOrigin(element, 'passage-1'); return 'passage-1'; }, {}, undefined, applyOrigin);
    toggle.dispatchEvent(new Event('click'));
    question.open = true;
    dialog.scrollTop = 281;
    link.focus();
    const click = new Event('click', { cancelable: true });
    Object.defineProperty(click, 'target', { value: link });
    dialog.dispatchEvent(click);
    const saved = history.state;
    assert.deepEqual(saved, { other: 42, readingContents: { question: question.id, scrollTop: 281, focus: 1, origin: 'passage-1' } });
    dialog.open = false;
    // A reconstructed page has no previously rewritten link URLs. Restore the
    // saved origin rather than recapturing the now different viewport.
    readingHref = 'https://example.test/reference-3.html?question=result';
    navigation.type = 'back_forward';
    win.dispatchEvent(new Event('pageshow'));
    assert.equal(new URL(readingHref).searchParams.get('from'), 'passage-1');
    assert.equal(new URL(readingHref).searchParams.get('question'), 'result');
    assert.equal(captures, 1);
    assert.equal(dialog.open, true);
    assert.equal(question.open, true);
    assert.equal(dialog.scrollTop, 281);
    assert.equal(document.activeElement, link);
    dialog.close();
    assert.equal(history.state.readingContents, null);
    win.dispatchEvent(new Event('pageshow'));
    assert.equal(dialog.open, false);

    history.state = saved;
    navigation.type = 'reload';
    win.dispatchEvent(new Event('pageshow'));
    assert.equal(dialog.open, false);
    win.dispatchEvent(new Event('popstate'));
    assert.equal(dialog.open, true);
    history.state = { other: 42 };
    win.dispatchEvent(new Event('popstate'));
    assert.equal(dialog.open, false);
    assert.deepEqual(history.state, { other: 42 });

    // A same-document departure saves the old entry before creating the new one.
    toggle.dispatchEvent(new Event('click'));
    question.open = true;
    dialog.scrollTop = 123;
    globals.location = new URL('https://example.test/reference-13.html?question=result');
    globalThis.location = globals.location;
    link.href = 'https://example.test/reference-13.html?question=result#passage-1';
    const samePage = new Event('click', { cancelable: true });
    Object.defineProperty(samePage, 'target', { value: link });
    let previous;
    history.pushState = state => { previous = history.state; history.state = state; };
    dialog.dispatchEvent(samePage);
    assert.equal(samePage.defaultPrevented, true);
    assert.equal(previous.readingContents.scrollTop, 123);
    assert.equal(history.state, null);
    history.state = previous;
    win.dispatchEvent(new Event('popstate'));
    assert.equal(dialog.open, true);
    assert.equal(dialog.scrollTop, 123);
    win.dispatchEvent(new Event('pagehide'));
    assert.equal(history.state.readingContents.question, question.id);
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
