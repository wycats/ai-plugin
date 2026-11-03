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
const inNote = node => hasAncestor(node, parent => parent.tagName === 'aside');

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
    const actual = descendants(article, n => n.tagName === 'p' && !inNote(n)).map(normalized);
    assert.deepEqual(actual, expected);
    const origins = new Set(descendants(article, n => n.attrs?.some(a => a.name === 'id'))
      .map(n => n.attrs.find(a => a.name === 'id').value));
    const body = descendants(document, n => n.tagName === 'body')[0];
    const excerpts = JSON.parse(body.attrs.find(a => a.name === 'data-reading-excerpts').value);
    const declaredOrigins = body.attrs.find(a => a.name === 'data-reading-origins').value.split(',');
    assert.deepEqual(Object.keys(excerpts), declaredOrigins);
    for (const [origin, excerpt] of Object.entries(excerpts)) {
      const passage = descendants(article, n => n.attrs?.some(a => a.name === 'id' && a.value === origin))[0];
      assert.ok(passage, `Excerpt has no source passage: ${origin}`);
      assert.ok(normalized(passage).startsWith(excerpt.replace(/…$/, '')), `Excerpt changed its source text: ${origin}`);
      assert.ok(excerpt.split(/\s+/).length <= 8, `Excerpt is no longer compact: ${origin}`);
    }
    const proseLinks = descendants(article, n => n.tagName === 'p' && !inNote(n))
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
      assert.match(page, /data-return-to-reading|Linked references/);
      const pageDocument = parse(page);
      const reminder = descendants(pageDocument, n => n.attrs?.some(a => a.name === 'class' && a.value === 'contents-origin'));
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
    }
    for (const name of ['initial-i-light', 'initial-i-dark', 'return-map-light', 'return-map-dark', 'diagram-recomposed-light', 'diagram-recomposed-dark']) {
      assert.ok((await readFile(path.join(directory, 'assets', 'illustrations', name + '.png'))).length > 0);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
