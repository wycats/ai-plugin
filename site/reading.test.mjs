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
function inNote(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) if (parent.tagName === 'aside') return true;
  return false;
}

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
    const proseLinks = descendants(article, n => n.tagName === 'p' && !inNote(n))
      .flatMap(p => descendants(p, n => n.tagName === 'a'))
      .map(n => n.attrs.find(a => a.name === 'href')?.value)
      .filter(href => href?.startsWith('reference-'));
    assert.ok(proseLinks.length > 20);
    for (const href of proseLinks) {
      const origin = new URL(href, 'https://example.test/').searchParams.get('from');
      assert.ok(origins.has(origin), `Missing passage origin for ${href}`);
    }
    assert.equal(descendants(article, n => n.attrs?.some(a => a.name === 'class' && a.value === 'annotation-anchor')).length, 1);
    const checked = await checkSite(directory);
    assert.ok(checked.pages > 20);
    for (const name of await readdir(directory)) {
      if (!name.endsWith('.html')) continue;
      const page = await readFile(path.join(directory, name), 'utf8');
      assert.doesNotMatch(page, /(?:\.runtime|type-study|\/Users\/)/);
      assert.match(page, /data-return-to-reading|Linked references/);
    }
    for (const name of ['initial-i-light', 'initial-i-dark', 'return-map-light', 'return-map-dark', 'diagram-recomposed-light', 'diagram-recomposed-dark']) {
      assert.ok((await readFile(path.join(directory, 'assets', 'illustrations', name + '.png'))).length > 0);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
