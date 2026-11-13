import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { parse, parseFragment } from 'parse5';
import { marked } from 'marked';
import matter from 'gray-matter';
import { markPhrase } from './marginalia.mjs';
import { checkSite } from './check.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
function descendants(root, predicate) {
  const result = [];
  function visit(node) {
    if (predicate(node)) result.push(node);
    for (const child of node.childNodes || []) visit(child);
  }
  visit(root);
  return result;
}
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const normalized = node => text(node).replace(/\s+/g, ' ').trim();
function hasAncestor(node, predicate) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) if (predicate(parent)) return true;
  return false;
}
const within = name => node => hasAncestor(node, parent => parent.attrs?.some(a => a.name === 'class' && a.value.split(/\s+/).includes(name)));
const inNote = within('marginal-note');
// The edition's own asides in the article: the marginal note and the note on
// the edition. Every other paragraph there is the essay's.
const inApparatus = node => inNote(node) || within('edition-note')(node);

test('annotations preserve source whitespace and reject absent or ambiguous phrases', () => {
  const input = 'A result can agree with our\nprediction and still change what is worth doing next.';
  const markedPhrase = markPhrase(input, 'A result can agree with our prediction', 'example');
  assert.equal(normalized(parseFragment(markedPhrase)), input.replace(/\s+/g, ' '));
  assert.match(markedPhrase, /id="example-phrase"/);
  assert.throws(() => markPhrase(input, 'missing phrase', 'example'), /found 0/);
  assert.throws(() => markPhrase('same same', 'same', 'example'), /found 2/);
});

test('canonical build preserves every story paragraph and has self-contained destinations', async () => {
  await mkdir(path.join(repo, 'out'), { recursive: true });
  const directory = await mkdtemp(path.join(repo, 'out', 'reading-test-'));
  try {
    execFileSync(process.execPath, ['site/build.mjs', '--out', directory], { cwd: repo });
    const { content } = matter(await readFile(path.join(repo, 'instructions/building-together.instructions.md'), 'utf8'));
    const expected = descendants(parseFragment(marked.parse(content)), n => n.tagName === 'p').map(normalized);
    const html = await readFile(path.join(directory, 'index.html'), 'utf8');
    const document = parse(html);
    const article = descendants(document, n => n.tagName === 'article')[0];
    const actual = descendants(article, n => n.tagName === 'p' && !inApparatus(n)).map(normalized);
    assert.deepEqual(actual, expected);
    // The edition says what the essay is in an aside of its own, before the
    // first paragraph and inside none of them. Its doors lead on: Contents
    // (which needs the script, so the door starts hidden) and the page on trying.
    const notes = descendants(article, n => n.tagName === 'aside' && n.attrs.some(a => a.name === 'class' && a.value === 'edition-note'));
    assert.equal(notes.length, 1);
    assert.ok(!hasAncestor(notes[0], parent => parent.tagName === 'p'));
    const editionWords = descendants(notes[0], n => n.tagName === 'p').map(normalized);
    assert.equal(editionWords[0], 'About this edition');
    assert.match(editionWords[1], /coding agent/);
    assert.ok(editionWords.every(words => !expected.includes(words)), 'The edition does not speak in the essay\'s words');
    const doors = descendants(notes[0], n => n.attrs?.some(a => a.name === 'data-open-contents'));
    assert.deepEqual(doors.map(n => n.attrs.find(a => a.name === 'data-open-contents').value), ['contents-questions']);
    assert.ok(doors.every(n => n.attrs.some(a => a.name === 'hidden')));
    assert.ok(descendants(document, n => n.attrs?.some(a => a.name === 'id' && a.value === 'contents-questions')).length);
    assert.deepEqual(descendants(notes[0], n => n.tagName === 'a').map(n => n.attrs.find(a => a.name === 'href').value), ['trying.html']);
    const origins = new Set(descendants(article, n => n.attrs?.some(a => a.name === 'id'))
      .map(n => n.attrs.find(a => a.name === 'id').value));
    const body = descendants(document, n => n.tagName === 'body')[0];
    const passages = JSON.parse(body.attrs.find(a => a.name === 'data-passages').value);
    const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
    for (const [id, paragraph] of [['opening-cycle', expected[0]], ['return-cycle', expected.find(p => p.startsWith('We return to the larger idea'))]]) {
      const drawing = descendants(article, n => attr(n, 'id') === id)[0];
      assert.ok(descendants(drawing.parentNode, n => n.tagName === 'p' && normalized(n) === paragraph).length,
        `${id}: drawing accompanies its source passage`);
      const image = descendants(drawing, n => n.tagName === 'img')[0];
      assert.equal(attr(image, 'width'), '1536');
      assert.equal(attr(image, 'height'), '1024', 'The complete cycle returns, rather than a cropped ornament');
    }
    const storyPassages = descendants(article, n => (n.tagName === 'p' && attr(n, 'id')) || attr(n, 'class') === 'annotated');
    assert.deepEqual(Object.keys(passages), storyPassages.map(n => attr(n, 'id')), 'Every story paragraph can be an origin');
    for (const [origin, { excerpt }] of Object.entries(passages)) {
      const passage = descendants(article, n => n.attrs?.some(a => a.name === 'id' && a.value === origin))[0];
      assert.ok(passage, `Excerpt has no source passage: ${origin}`);
      assert.ok(normalized(passage).startsWith(excerpt.replace(/…$/, '')), `Excerpt changed its source text: ${origin}`);
      assert.ok(excerpt.split(/\s+/).length <= 8, `Excerpt is no longer compact: ${origin}`);
    }
    const proseLinks = descendants(article, n => n.tagName === 'p' && !inApparatus(n))
      .flatMap(p => descendants(p, n => n.tagName === 'a'))
      .map(n => n.attrs.find(a => a.name === 'href')?.value)
      .filter(href => href?.startsWith('reference-'));
    assert.ok(proseLinks.length > 20);
    for (const href of proseLinks) {
      const query = new URL(href, 'https://example.test/').searchParams;
      const origin = query.get('from');
      assert.ok(origins.has(origin), `Missing passage origin for ${href}`);
      assert.equal(query.get('note'), null, 'Prose links must not imply annotation use');
    }
    const annotationLinks = descendants(document, n => n.tagName === 'a' &&
      (inNote(n) || hasAncestor(n, parent => parent.attrs?.some(a => a.name === 'id' && a.value === 'encounter'))))
      .map(n => new URL(n.attrs.find(a => a.name === 'href').value, 'https://example.test/'))
      .filter(url => /\/reference-\d+\.html$/.test(url.pathname));
    assert.ok(annotationLinks.length >= 3);
    for (const url of annotationLinks) {
      assert.equal(url.searchParams.get('note'), 'result-understanding');
      assert.equal(url.searchParams.get('from'), 'result-understanding');
    }
    assert.equal(descendants(article, n => n.attrs?.some(a => a.name === 'class' && a.value === 'annotation-anchor')).length, 1);
    const checked = await checkSite(directory);
    assert.ok(checked.pages > 20);
    assert.match(await readFile(path.join(repo, 'README.md'), 'utf8'), /^## Setup\s*$/m,
      'The footer installation link must resolve to the README setup section');
    for (const name of await readdir(directory)) {
      if (!name.endsWith('.html')) continue;
      const page = await readFile(path.join(directory, name), 'utf8');
      assert.doesNotMatch(page, /(?:\.runtime|type-study|\/Users\/)/);
      assert.match(page, /data-return-to-reading|class="edition-note"/);
      const pageDocument = parse(page);
      const reminder = descendants(pageDocument, n => n.attrs?.some(a => a.name === 'data-origin'));
      assert.equal(reminder.length, name === 'index.html' ? 0 : 1);
      if (reminder.length) {
        assert.ok(reminder[0].attrs.some(a => a.name === 'hidden'), 'A direct reference must not imply a passage origin');
        const returnLink = descendants(reminder[0], n => n.tagName === 'a')[0];
        assert.equal(returnLink.attrs.find(a => a.name === 'href').value, 'index.html');
        assert.ok(returnLink.attrs.some(a => a.name === 'data-return-to-reading'));
      }
      const footer = descendants(pageDocument, n => n.tagName === 'footer')[0];
      const destinations = descendants(footer, n => n.tagName === 'a').map(n => n.attrs.find(a => a.name === 'href').value);
      assert.ok(destinations.includes('https://github.com/wycats/ai-plugin#setup'));
      assert.ok(destinations.includes('https://github.com/wycats/ai-plugin'));
      assert.ok(destinations.includes('trying.html'), 'Every page leads to the page on trying the plugin');
    }
    for (const name of ['initial-i-light', 'initial-i-dark', 'return-map-light', 'return-map-dark', 'diagram-recomposed-light', 'diagram-recomposed-dark']) {
      assert.ok((await readFile(path.join(directory, 'assets', 'illustrations', name + '.png'))).length > 0);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('an arrival claims only the provenance its address carries, and keeps it across hops', async () => {
  const { arrivalFrom, returnAction, carry, questionAt } = await import('./origin.js');
  const passages = {
    'passage-1': { excerpt: 'As we build…', chapter: '', section: '' },
    'passage-2': { excerpt: 'What we want…', chapter: 'i', section: 'Developing an approach' },
    'passage-3': { excerpt: 'We are adding…', chapter: 'i', section: 'Developing an approach' },
    'passage-4': { excerpt: 'As we implement…', chapter: 'ii', section: 'Working through a change' },
    'result-understanding': { excerpt: 'As we implement…', chapter: 'ii', section: 'Working through a change' },
  };
  const context = { passages, noteAnchor: 'result-understanding', questions: ['result', 'express'] };
  const base = 'https://example.test/edition/reference-15.html';

  // A direct arrival has no origin and no return.
  const direct = arrivalFrom('', context);
  assert.deepEqual(direct, { passage: null, note: false, question: null });
  assert.equal(returnAction(direct, passages), null);
  // Unknown or forged provenance is ignored rather than invented.
  assert.deepEqual(arrivalFrom('?from=passage-99&question=nonsense&note=passage-99', context), direct);
  // A note flag belongs only to the passage that carries the note.
  assert.equal(arrivalFrom('?from=passage-3&note=passage-3', context).note, false);

  // A passage origin returns to that passage, naming its place.
  const fromPassage = arrivalFrom('?from=passage-3', context);
  assert.deepEqual(returnAction(fromPassage, passages), {
    href: 'index.html?resume=passage-3#passage-3', label: 'Return to the passage',
    chapter: 'i', section: 'Developing an approach', excerpt: 'We are adding…',
  });
  assert.equal(returnAction(arrivalFrom('?from=passage-1', context), passages).section, 'The opening');

  // A note origin reopens the note.
  const fromNote = arrivalFrom('?from=result-understanding&note=result-understanding', context);
  assert.deepEqual([returnAction(fromNote, passages).href, returnAction(fromNote, passages).label],
    ['index.html?note=result-understanding#result-understanding', 'Return to the note']);

  // A hop to another reading carries the story origin, note, and chosen question.
  const chosen = arrivalFrom('?from=result-understanding&note=result-understanding&question=express', context);
  assert.equal(chosen.question, 'express');
  const hop = new URL(carry('reference-16.html#composition-notes', base, chosen));
  assert.equal(hop.pathname, '/edition/reference-16.html');
  assert.equal(hop.hash, '#composition-notes');
  assert.deepEqual(Object.fromEntries(hop.searchParams), { from: 'result-understanding', note: 'result-understanding', question: 'express' });
  // The hop's return is the original story origin, not the intermediate reading.
  assert.equal(returnAction(arrivalFrom(hop.search, context), passages).href, 'index.html?note=result-understanding#result-understanding');
  // A link chosen from another question names that question instead.
  assert.equal(new URL(carry('reference-1.html?question=result', base, chosen)).searchParams.get('question'), 'result');
  // A passage origin without a note clears a stale note.
  assert.equal(new URL(carry('reference-1.html?note=x', base, fromPassage)).searchParams.has('note'), false);
  // The story, other sites, and other directories are left as they are.
  assert.equal(carry('index.html#passage-3', base, chosen), 'index.html#passage-3');
  assert.equal(carry('https://example.invalid/reference-1.html', base, chosen), 'https://example.invalid/reference-1.html');
  assert.equal(carry('../reference-1.html', base, chosen), '../reference-1.html');
  // With nothing to carry, a reading link keeps its address.
  assert.equal(new URL(carry('reference-1.html', base, direct)).search, '');

  // A question unfolds once the reader has reached its passage, within its chapter.
  const cues = ['passage-3', 'passage-4'];
  assert.equal(questionAt('passage-2', cues, passages), null);
  assert.equal(questionAt('passage-3', cues, passages), 0);
  assert.equal(questionAt('passage-4', cues, passages), 1);
  assert.equal(questionAt('passage-1', cues, passages), null);
  assert.equal(questionAt(undefined, cues, passages), null);
});

test('Contents offers questions, a complete index, and a place for every reading', async () => {
  await mkdir(path.join(repo, 'out'), { recursive: true });
  const directory = await mkdtemp(path.join(repo, 'out', 'reading-test-'));
  try {
    execFileSync(process.execPath, ['site/build.mjs', '--out', directory], { cwd: repo });
    const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
    const hasClass = (node, name) => (attr(node, 'class') || '').split(' ').includes(name);
    const names = (await readdir(directory)).filter(name => name.endsWith('.html'));
    const references = names.filter(name => /^reference-\d+\.html$/.test(name));
    assert.ok(names.includes('style.html'), 'The editorial guide has a stable book address');
    assert.ok(names.includes('trying.html'), 'The page on trying the plugin has a stable book address');
    const editionPages = ['style.html', 'trying.html'];
    const story = parse(await readFile(path.join(directory, 'index.html'), 'utf8'));
    const passages = JSON.parse(attr(descendants(story, n => n.tagName === 'body')[0], 'data-passages'));

    for (const name of names) {
      const document = parse(await readFile(path.join(directory, name), 'utf8'));
      const dialog = descendants(document, n => attr(n, 'id') === 'contents')[0];
      const hrefs = node => descendants(node, n => n.tagName === 'a').map(n => attr(n, 'href'));
      const editorialLink = descendants(dialog, n => hasClass(n, 'contents-edition'))[0];
      assert.deepEqual(hrefs(editorialLink), ['trying.html', 'style.html'], 'Contents exposes the edition\'s own pages separately from canonical readings');
      // The colophon says what the edition is and whom its texts address.
      const colophon = descendants(dialog, n => hasClass(n, 'contents-colophon'))[0];
      assert.match(normalized(colophon), /written to a coding agent/);
      assert.deepEqual(hrefs(colophon), ['trying.html']);

      // A known title is always findable: each reading appears once in the index.
      const index = descendants(dialog, n => attr(n, 'id') === 'contents-index')[0];
      const indexed = descendants(index, n => n.tagName === 'li')
        .map(li => attr(descendants(li, n => n.tagName === 'a')[0], 'href'));
      assert.deepEqual(indexed.toSorted(), references.toSorted(), `${name}: index must list every reading once`);
      const titles = Object.fromEntries(descendants(index, n => hasClass(n, 'index-entry'))
        .map(line => line.childNodes.find(n => n.tagName === 'a')).map(link => [attr(link, 'href'), normalized(link)]));
      // Each entry opens with its name, then chapter locators on the same line;
      // the gloss and any cross-reference follow beneath. A reading the text
      // cites resumes that passage from its chapter numeral; one it never
      // cites points to the readings that do.
      for (const li of descendants(index, n => n.tagName === 'li')) {
        const [entryLine, ...rest] = li.childNodes.filter(n => n.tagName);
        assert.ok(hasClass(entryLine, 'index-entry'), 'An entry begins with its name line');
        const nameLink = entryLine.childNodes.find(n => n.tagName);
        assert.equal(nameLink.tagName, 'a');
        const locators = descendants(entryLine, n => hasClass(n, 'index-locators'))
          .flatMap(n => descendants(n, a => a.tagName === 'a'));
        for (const locator of locators) {
          const resume = new URL(attr(locator, 'href'), 'https://example.test/').searchParams.get('resume');
          assert.ok(passages[resume], `${attr(nameLink, 'href')}: locator resumes a passage`);
          assert.equal(normalized(locator), passages[resume].chapter || 'opening');
        }
        assert.ok(rest.every(n => hasClass(n, 'index-gloss') || hasClass(n, 'index-see')));
        const see = rest.filter(n => hasClass(n, 'index-see'));
        assert.equal(see.length > 0, locators.length === 0, `${attr(nameLink, 'href')}: see only when the text does not cite it`);
      }

      // Each question's guide explains its readings in place. Its excerpt is
      // the essay's exact words, credited and linked to the passage it comes
      // from, which is where the question arises.
      const storyText = Object.fromEntries(descendants(story, n => passages[attr(n, 'id')])
        .map(n => [attr(n, 'id'), normalized(n.tagName === 'p' ? n : descendants(n, p => hasClass(p, 'passage'))[0])]));
      const questions = descendants(dialog, n => n.tagName === 'details' && hasClass(n, 'question'));
      assert.equal(questions.length, 4);
      // Folded, each question shows the situation it begins from, in its summary.
      for (const question of questions) {
        const summary = question.childNodes.find(n => n.tagName === 'summary');
        const situation = descendants(summary, n => hasClass(n, 'question-situation'));
        assert.equal(situation.length, 1);
        assert.ok(normalized(situation[0]).length > 30);
      }
      const appearances = new Map();
      for (const question of questions) {
        const id = attr(question, 'id').replace(/^question-/, '');
        const passage = attr(question, 'data-passage');
        assert.ok(passages[passage], `${id}: the question arises at a story passage`);
        const guide = descendants(question, n => hasClass(n, 'question-guide'))[0];
        assert.ok(guide, `${id}: guide`);
        assert.doesNotMatch(text(guide), /[{}]/, `${id}: no editorial markup left in the guide`);
        for (const svg of descendants(guide, n => n.tagName === 'svg' && attr(n, 'role') !== 'img')) assert.equal(attr(svg, 'aria-hidden'), 'true', `${id}: drawn marks are hidden`);
        const quotes = descendants(guide, n => hasClass(n, 'guide-quote'));
        quotes.forEach((quote, index) => {
          const [paragraph] = quote.childNodes.filter(n => n.tagName);
          const cite = descendants(paragraph, n => n.tagName === 'cite')[0];
          assert.equal(cite.parentNode, paragraph, `${id}: the credit stays in the quotation paragraph`);
          const [source] = hrefs(cite);
          const quoted = new URL(source, 'https://example.test/').searchParams.get('resume');
          assert.equal(source, `index.html?resume=${quoted}#${quoted}`);
          assert.match(normalized(cite), /^— Building together · /, `${id}: the credit follows an em dash`);
          const words = normalized(paragraph).slice(0, -normalized(cite).length).trim();
          assert.match(words, /^“.+”$/, `${id}: the excerpt is in quotation marks`);
          assert.ok(storyText[quoted].includes(words.slice(1, -1)), `${id}: the excerpt is the essay's exact words`);
        });
        const entries = descendants(guide, n => attr(n, 'data-reading'));
        for (const entry of entries) {
          const reading = attr(entry, 'data-reading');
          assert.ok(references.includes(reading), `${id}: ${reading} is not a reading`);
          // Every link to a reading here is chosen from this question; credits lead to the essay.
          for (const href of hrefs(entry)) {
            const destination = new URL(href, 'https://example.test/');
            if (destination.pathname === '/index.html') continue;
            assert.equal(destination.pathname.slice(1), reading, `${id}: links in an entry lead to its reading`);
            assert.equal(destination.searchParams.get('question'), id, `${id}: a reading chosen here carries the question`);
          }
          // Its heading names the reading, and a sentence says what it contributes here.
          const titled = hasClass(entry, 'guide-unit') ? descendants(entry, n => hasClass(n, 'guide-note'))[0] : entry;
          const heading = titled.childNodes.find(n => n.tagName === 'h4');
          assert.equal(normalized(heading), titles[reading], `${id}: the note names its reading`);
          const role = titled.childNodes.filter(n => n.tagName === 'p' && !hasClass(n, 'also-in'));
          assert.equal(role.length, 1);
          assert.ok(normalized(role[0]).length > 20, `${id}: each reading says what it contributes`);
          if (hasClass(entry, 'guide-unit')) {
            const phrases = descendants(entry, n => hasClass(n, 'guide-phrase'));
            assert.equal(phrases.length, 1, `${id}: one phrase leads to each note`);
            assert.ok(descendants(entry, n => hasClass(n, 'guide-note')).length === 1);
          }
          appearances.set(reading, [...(appearances.get(reading) || []), [question, entry]]);
          for (const button of descendants(entry, n => attr(n, 'data-open-question'))) {
            assert.ok(questions.some(other => attr(other, 'id') === attr(button, 'data-open-question') && other !== question));
          }
        }
        assert.equal(new Set(entries.map(entry => attr(entry, 'data-reading'))).size, entries.length, `${id}: a reading appears once in its guide`);
        // A guide that follows one reading closes with the way into it.
        const main = descendants(guide, n => hasClass(n, 'guide-reading'))[0];
        const onward = descendants(guide, n => hasClass(n, 'reading-onward'))[0];
        assert.equal(Boolean(main), Boolean(onward), `${id}: a main reading has an onward link`);
        if (onward) {
          assert.equal(new URL(attr(onward, 'href'), 'https://example.test/').pathname.slice(1), attr(main, 'data-reading'));
          assert.match(normalized(onward), /^Read \S/);
        }
      }
      // A reading recurring across questions keeps one destination and names its other encounters.
      const recurring = [...appearances].filter(([, where]) => where.length > 1);
      assert.ok(recurring.length >= 2, 'Readings recur across questions');
      for (const [href, where] of recurring) {
        for (const [, entry] of where) {
          assert.equal(descendants(entry, n => attr(n, 'data-open-question')).length, where.length - 1, `${href} names its other questions`);
        }
      }

      // A reading's Contents opens on a question it belongs to; others start closed.
      const open = questions.filter(n => n.attrs.some(a => a.name === 'open'));
      const belongs = questions.filter(question => descendants(question, n => attr(n, 'data-reading') === name).length);
      assert.equal(open.length, belongs.length ? 1 : 0, `${name}: open question`);
      if (open.length) assert.ok(belongs.includes(open[0]));

      if (name === 'index.html') continue;
      // The reading itself arrives first: the article opens with its title and
      // opening paragraph, and nothing but the edge precedes it in the page.
      const main = descendants(document, n => n.tagName === 'main')[0];
      const [edge, article] = main.childNodes.filter(n => n.tagName);
      assert.ok(hasClass(edge, 'reading-edge-head'), `${name}: the head edge precedes the reading`);
      assert.equal(article.tagName, 'article');
      const opening = descendants(article, n => hasClass(n, 'reading-arrival'))[0];
      assert.equal(article.childNodes.find(n => n.tagName), opening, `${name}: the arrival opens the article`);
      assert.equal(descendants(opening, n => n.tagName === 'h1').length, 1);
      // Without a known origin, the edges name the book and claim no return.
      // At the head of a canonical reading, a direct arrival also learns whom
      // the text addresses and what kind of reading it is; the script removes
      // that with the rest of the note when the address names a passage.
      for (const where of ['head', 'foot']) {
        const line = descendants(document, n => hasClass(n, `reading-edge-${where}`))[0];
        assert.ok(line, `${name}: ${where} edge`);
        const addressed = where === 'head' && !editionPages.includes(name);
        assert.match(normalized(line), addressed
          ? /^Building together, the essay this reading accompanies\. Both are written to a coding agent\. (Stances shape|Workflows guide) .+\.$/
          : /^Building together, the essay this reading accompanies$/);
        if (addressed) {
          const kind = normalized(descendants(opening, n => hasClass(n, 'reading-kind'))[0]);
          assert.match(normalized(line), new RegExp(`${kind}s (shape|guide) `, 'i'), `${name}: the edge explains the kind its title names`);
          const note = descendants(line, n => attr(n, 'data-edge-note') !== undefined)[0];
          assert.ok(normalized(note).includes('Both are written to a coding agent'), `${name}: a known origin replaces the whole note`);
        }
        assert.doesNotMatch(normalized(line), /return/i);
        assert.deepEqual(hrefs(line), ['index.html']);
      }
      // The questions it belongs to annotate its opening, in Contents' words.
      const notes = descendants(opening, n => attr(n, 'data-beside-notes') !== undefined)[0];
      const noted = descendants(notes, n => attr(n, 'data-question')).map(n => `question-${attr(n, 'data-question')}`);
      assert.deepEqual(noted, belongs.map(n => attr(n, 'id')));
      assert.equal(notes.attrs.some(a => a.name === 'hidden'), belongs.length === 0);
      const apparatus = descendants(notes, n => hasClass(n, 'beside-label') || n.tagName === 'button').map(normalized).join(' | ');
      assert.doesNotMatch(apparatus, /return|back|from the question/i, 'Membership is not described as the reader\'s path');
      for (const question of belongs) {
        const note = descendants(notes, n => `question-${attr(n, 'data-question')}` === attr(question, 'id'))[0];
        assert.equal(normalized(descendants(note, n => hasClass(n, 'beside-text'))[0]), normalized(descendants(question, n => hasClass(n, 'question-text'))[0]));
        const role = descendants(question, n => attr(n, 'data-reading') === name)[0];
        assert.ok(normalized(role).includes(normalized(descendants(note, n => hasClass(n, 'beside-role'))[0])), `${name}: the note gives the role Contents gives`);
      }
      // Without scripts, the index remains in the page.
      const fallback = descendants(document, n => n.tagName === 'noscript')[0];
      for (const reference of references) assert.ok(text(fallback).includes(`href="${reference}"`), `${name}: no-script index`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('the page on trying the plugin quotes the setup guide exactly and hands off to sections that exist', async () => {
  await mkdir(path.join(repo, 'out'), { recursive: true });
  const directory = await mkdtemp(path.join(repo, 'out', 'reading-test-'));
  try {
    execFileSync(process.execPath, ['site/build.mjs', '--out', directory], { cwd: repo });
    const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
    const article = descendants(parse(await readFile(path.join(directory, 'trying.html'), 'utf8')), n => n.tagName === 'article')[0];
    const repository = 'https://github.com/wycats/ai-plugin/blob/main/';
    const sections = async file => new Set([...matter(await readFile(path.join(repo, file), 'utf8')).content.matchAll(/^#{1,6} (.+)$/gm)]
      .map(([, heading]) => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ +/g, '-')));
    // Setup belongs to the repository's documentation. Each hand-off names a
    // document, and a section of it, that exists in this checkout.
    const handoffs = descendants(article, n => n.tagName === 'a').map(n => attr(n, 'href')).filter(href => href.startsWith(repository));
    assert.ok(handoffs.length >= 5);
    for (const href of handoffs) {
      const [file, section] = href.slice(repository.length).split('#');
      assert.match(file, /^docs\/[a-z-]+\.md$/);
      if (section) assert.ok((await sections(file)).has(section), `${file} has no section #${section}`);
    }
    for (const section of ['install-in-codex', 'claude-code-persistent-guidance', 'vs-code-local-registration', 'try-a-first-investigation']) {
      assert.ok(handoffs.includes(`${repository}docs/setup.md#${section}`), `Trying the plugin hands off to ${section}`);
    }
    // A quotation is the credited document's exact words.
    const quotes = descendants(article, n => n.tagName === 'blockquote');
    assert.equal(quotes.length, 1);
    for (const quote of quotes) {
      const cite = descendants(quote, n => n.tagName === 'cite')[0];
      const credit = attr(descendants(cite, n => n.tagName === 'a')[0], 'href');
      const words = /^“(.+)” —/.exec(normalized(quote))[1];
      const source = (await readFile(path.join(repo, credit.slice(repository.length).split('#')[0]), 'utf8')).replace(/^>\s?/gm, '').replace(/\s+/g, ' ');
      assert.ok(source.includes(words), 'The quoted prompt is the setup guide\'s own');
    }
    // It stays in the book for the readings and the passage it mentions.
    const inBook = descendants(article, n => n.tagName === 'a').map(n => attr(n, 'href')).filter(href => !/^https?:/.test(href));
    assert.ok(inBook.some(href => /^reference-\d+\.html$/.test(href)));
    assert.ok(inBook.includes('index.html#working-through-a-change'));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('a guide quotes only the essay and links each phrase to its note', async () => {
  const { resolveGuide } = await import('./guide.mjs');
  const pages = { a: { title: 'A', href: 'reference-1.html' }, b: { title: 'B', href: 'reference-2.html' }, c: { title: 'C', href: 'reference-3.html' } };
  const story = {
    find: (section, text) => ['passage-1', 'passage-2'].filter(id => id === 'passage-1' && section === 'one' && 'We read the code. Then we return to the cases they kept.'.includes(text)),
    links: () => [{ href: 'reference-3.html', text: 'return to the cases' }],
  };
  const context = { sourcePage: key => pages[key] || (() => { throw new Error(`unread ${key}`); })(), story, href: page => page.href };
  const valid = {
    id: 'q', cue: { section: 'one', text: 'We read the code.' }, lead: 'Begin here.', closing: 'Return as needed.', reading: ['a', 'The main reading.'],
    guide: [
      { text: ['Write {an account} of the system.'], note: ['b', 'A note on B.'] },
      { quote: { section: 'one', text: 'Then we {return to the cases} they kept.' }, text: ['For example, check them.'], note: ['c', 'A note on C.'] },
    ],
  };
  const guide = resolveGuide(valid, context);
  assert.deepEqual(guide.readings.map(reading => reading.page.title), ['A', 'B', 'C']);
  // Navigation provenance remains valid even when the guide quotes nothing.
  const unquoted = resolveGuide({ ...valid, guide: [valid.guide[0]] }, context);
  assert.equal(unquoted.passage, 'passage-1');
  assert.ok(unquoted.units.every(unit => !unit.quote));
  assert.throws(() => resolveGuide({ ...valid, cue: { section: 'one', text: 'Missing cue.' } }, context), /cue must occur once/);
  assert.throws(() => resolveGuide({ ...valid, cue: { section: 'one', text: '' } }, context), /cue must name/);

  assert.equal(guide.units[1].quote.passage, 'passage-1');
  assert.deepEqual(guide.units[0].paragraphs[0], [{ text: 'Write ' }, { phrase: 'an account' }, { text: ' of the system.' }]);
  const unit = (index, change) => ({ ...valid, guide: valid.guide.map((item, i) => i === index ? { ...item, ...change } : item) });
  // An excerpt must be the essay's words, and its phrase the essay's own link to the note's reading.
  assert.throws(() => resolveGuide(unit(1, { quote: { section: 'one', text: 'Then we {go back to the cases} they kept.' } }), context), /must occur once/);
  assert.throws(() => resolveGuide(unit(1, { quote: { section: 'two', text: 'Then we {return to the cases} they kept.' } }), context), /must occur once/);
  assert.throws(() => resolveGuide(unit(1, { note: ['b', 'Another reading.'] }), context), /essay's own link/);
  assert.throws(() => resolveGuide(unit(1, { quote: { section: 'one', text: '{Then we} return to the cases they kept.' } }), context), /essay's own link/);
  // Each unit links one phrase to its note, and a reading appears once.
  assert.throws(() => resolveGuide(unit(0, { text: ['Write an account.'] }), context), /exactly one \{phrase\}/);
  assert.throws(() => resolveGuide(unit(0, { text: ['Write {an account} and {a test}.'] }), context), /exactly one \{phrase\}/);
  assert.throws(() => resolveGuide(unit(0, { note: ['a', 'Main again.'] }), context), /appears once/);
  assert.throws(() => resolveGuide(unit(0, { text: ['Write {an account of it.'] }), context), /unbalanced braces/);
  assert.throws(() => resolveGuide({ ...valid, closing: 'Return to {the start}.' }, context), /plain prose/);
  assert.throws(() => resolveGuide(unit(0, { note: ['z', 'Unknown.'] }), context), /unread z/);
});

test('returning to the opening includes its title without moving later passages', async () => {
  const { arrivalTarget } = await import('./origin.js');
  const title = { matches: selector => selector === 'h1, h2' };
  const opening = { previousElementSibling: title };
  const first = { matches: () => true, closest: () => opening, previousElementSibling: null };
  const second = { matches: () => false, previousElementSibling: { matches: () => false } };
  const chapter = { matches: () => false, previousElementSibling: title };
  assert.equal(arrivalTarget(first), title);
  assert.equal(arrivalTarget(second), second);
  assert.equal(arrivalTarget(chapter), title);
});

test('hidden relationship artwork waits for visibility and uses the current paper choice', async () => {
  const { applyArtworkTheme, observeDeferredArtwork } = await import('./artwork.js');
  const { questionPlate, relationshipDialog } = await import('./presentation.mjs');
  for (const html of [questionPlate(), relationshipDialog(x => x, 'result-understanding')]) {
    const image = descendants(parseFragment(html), node => node.tagName === 'image')[0];
    assert.ok(image.attrs.some(attr => attr.name === 'data-art-deferred'));
    assert.ok(!image.attrs.some(attr => attr.name === 'href'), 'The HTML parser must not start the request');
  }
  const attributes = new Map([['data-art-deferred', '']]);
  const image = {
    tagName: 'image', dataset: { art: 'assets/illustrations/return-map' },
    hasAttribute: name => attributes.has(name),
    removeAttribute: name => attributes.delete(name),
    setAttribute: (name, value) => attributes.set(name, value),
    closest: () => frame,
  };
  const frame = { querySelectorAll: () => attributes.has('data-art-deferred') ? [image] : [] };
  const link = { dataset: { artLink: image.dataset.art } };
  const scope = { querySelectorAll: selector => selector === '[data-art-link]' ? [link] : [image] };
  let report, observed, unobserved, theme = 'light';
  class Observer {
    constructor(callback) { report = callback; }
    observe(target) { observed = target; }
    unobserve(target) { unobserved = target; }
  }
  observeDeferredArtwork(scope, () => theme, Observer);
  assert.equal(observed, frame);
  applyArtworkTheme(scope, theme);
  theme = 'dark';
  applyArtworkTheme(scope, theme);
  report([{ target: frame, isIntersecting: false }]);
  assert.equal(attributes.has('href'), false, 'Theme changes must not load a closed guide');
  assert.equal(link.href, 'assets/illustrations/return-map-dark.png');
  report([{ target: frame, isIntersecting: true }]);
  assert.equal(attributes.get('href'), 'assets/illustrations/return-map-dark.png');
  assert.equal(unobserved, frame);
  applyArtworkTheme(scope, 'light');
  assert.equal(attributes.get('href'), 'assets/illustrations/return-map-light.png');
});
