import { Marked } from 'marked';
import matter from 'gray-matter';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { synthesis, relationships } from './relationships.mjs';
import { escape, cycleIllustration, relationshipDialog, folio, fold, closeMark, artwork, themeImage, mapStances } from './presentation.mjs';
import { annotation, marginalNote } from './marginalia.mjs';

const site = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(site, '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out')) throw new Error('Usage: node site/build.mjs [--out directory]');
const out = args.length ? path.resolve(args[1]) : path.join(repo, 'out', 'reading-site');
if (!out.startsWith(path.join(repo, 'out') + path.sep)) throw new Error('Site output must be inside the repo out directory');
const source = path.join(repo, 'instructions', 'building-together.instructions.md');
fs.mkdirSync(out, { recursive: true });
const pages = new Map([[source, 'index.html']]);
const queue = [source];
const rendered = [];
let annotatedParagraph;
let annotationCount = 0;
const readingOrigins = [];

for (let i = 0; i < queue.length; i++) {
  const file = queue[i];
  const { content: markdown, data } = matter(fs.readFileSync(file, 'utf8'));
  const title = markdown.match(/^# (.+)$/m)?.[1] || path.basename(file);
  const sections = [];
  let section;
  const marked = new Marked({
    walkTokens(token) {
      if (token.type !== 'link' || /^(?:[a-z]+:|#)/i.test(token.href)) return;
      const [rel, hash] = token.href.split('#');
      const target = path.resolve(path.dirname(file), decodeURIComponent(rel));
      if (!target.startsWith(repo + path.sep) || !fs.existsSync(target) || !target.endsWith('.md')) return;
      if (!pages.has(target)) {
        pages.set(target, `reference-${pages.size}.html`);
        queue.push(target);
      }
      token.href = pages.get(target) + (hash ? '#' + hash : '');
      if (token.title?.startsWith('composition:')) token.title = path.basename(path.dirname(target));
    },
    renderer: {
      code(token) {
        if (token.lang === 'mermaid' && file === source) return cycleIllustration('opening-cycle');
        return `<pre><code>${escape(token.text)}</code></pre>`;
      },
      heading(token) {
        const id = token.text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ +/g, '-');
        if (token.depth === 2) { section = id; sections.push({ id, title: token.text }); }
        const reprise = file === source && token.depth === 2 && id === 'further-reading'
          ? cycleIllustration('return-cycle', true) : '';
        const number = file === source && token.depth === 2 ? ` data-section-number="${roman(sections.length)}"` : '';
        return `${reprise}<h${token.depth} id="${id}"${number} tabindex="-1">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
      },
      paragraph(token) {
        const html = this.parser.parseInline(token.tokens);
        if (file === source && section === annotation.section && html.replace(/\s+/g, ' ').includes(annotation.quote)) {
          annotationCount++;
          readingOrigins.push(annotation.id);
          annotatedParagraph = passageLinks(html, annotation.id);
          return '<!--marginal-note-->';
        }
        if (file === source) {
          const id = `passage-${readingOrigins.length + 1}`;
          readingOrigins.push(id);
          return `<p id="${id}" tabindex="-1">${passageLinks(html, id)}</p>`;
        }
        return `<p>${html}</p>`;
      },
    },
  });
  const body = marked.parse(markdown);
  rendered.push({ file, title, body, sections, kind: data.metadata?.['wycats.kind'] });
}
if (annotationCount !== 1) throw new Error(`Expected one annotation passage in ${annotation.section}, found ${annotationCount}`);
const bySource = new Map(rendered.map(page => [path.relative(repo, page.file).split(path.sep).join('/'), page]));
function url(key) {
  const page = bySource.get(key);
  if (!page) throw new Error(`Reading annotation points to an unread source: ${key}`);
  return pages.get(page.file);
}
for (const edge of relationships) { url(edge.source); url(edge.target); }
for (const key of [...mapStances, annotation.stance]) url(key);

function roman(number) {
  let result = '';
  for (const [value, letters] of [[1000,'m'],[900,'cm'],[500,'d'],[400,'cd'],[100,'c'],[90,'xc'],[50,'l'],[40,'xl'],[10,'x'],[9,'ix'],[5,'v'],[4,'iv'],[1,'i']]) {
    while (number >= value) { result += letters; number -= value; }
  }
  return result;
}
function passageLinks(html, origin) {
  return html.replace(/href="(reference-\d+\.html)(#[^"]*)?"/g,
    (_, page, hash = '') => `href="${page}?from=${origin}${hash}"`);
}
function readingConnections(current, link) {
  const story = current === rendered[0];
  const key = path.relative(repo, current.file).split(path.sep).join('/');
  const adjacent = story
    ? [{ page: bySource.get(synthesis), note: 'Details change our understanding, and our understanding changes what we notice.' },
       { page: bySource.get('skills/stances/gap-reading/SKILL.md'), note: 'Return to details your interpretation has left out.' }]
    : relationships.flatMap(edge => {
      if (edge.source === key) return [{ page: bySource.get(edge.target), note: edge.outward }];
      if (edge.target === key) return [{ page: bySource.get(edge.source), note: edge.inward }];
      return [];
    }).slice(0, 2);
  if (!adjacent.length) return '';
  return `<div class="reading-connections"><p class="connection-label">Alongside this reading</p><ul>${adjacent.map(({ page, note }) => `<li>${link(page)}<p>${escape(note)}</p></li>`).join('')}</ul></div>`;
}
function navigation(current) {
  const story = rendered[0];
  const link = page => `<a href="${pages.get(page.file)}"${page === current ? ' aria-current="page"' : ''}><span class="entry-title">${escape(page.title)}</span></a>`;
  const sectionList = (page, local = false) => `<ul class="${local ? 'local-reading' : 'story-sections'}">${page.sections.map((section, index) => `<li><a href="${pages.get(page.file)}#${section.id}"${page === current ? ` data-section="${section.id}"` : ''}><span class="entry-title">${escape(section.title)}</span><span class="entry-leader" aria-hidden="true"></span><span class="entry-number" aria-hidden="true">${roman(index + 1)}</span></a></li>`).join('')}</ul>`;
  const outline = current === story ? sectionList(story) : `<details class="story-outline"><summary><span>In Building together</span>${fold}</summary>${sectionList(story)}</details><div class="local-reading-heading">${link(current)}</div>${sectionList(current, true)}`;
  const groups = [['stance', 'Stances'], ['workflow', 'Workflows'], [undefined, 'References']].map(([kind, label]) => {
    const members = rendered.filter(page => page !== story && page.kind === kind).sort((a, b) => a.title.localeCompare(b.title, 'en'));
    return members.length ? `<details class="catalog-group"><summary><span>${label}</span>${fold}</summary><ul>${members.map(page => `<li>${link(page)}</li>`).join('')}</ul></details>` : '';
  }).join('');
  return `<button class="contents-toggle folio-action" aria-label="Contents" aria-controls="contents" aria-expanded="false" aria-haspopup="dialog" hidden>${folio}<span>Contents</span></button>
<dialog id="contents" aria-labelledby="contents-title"><div class="contents-heading"><h2 id="contents-title">Contents</h2><button class="edge-close" data-close-dialog aria-label="Close contents">${closeMark}</button></div>
<div class="contents-index"><nav aria-label="Site"><div class="contents-column"><div class="story-link">${link(story)}</div>${outline}</div><div class="contents-column">${readingConnections(current, link)}<button class="folio-action" id="explore-relationships" aria-controls="contents-map">${folio}<span>Explore the relationships</span></button></div><div class="contents-collections">${groups}</div></nav></div>
<section id="contents-map" aria-label="Relationships between stances" hidden><button class="folio-action" id="return-to-contents"><span aria-hidden="true">‹</span><span>Back to contents</span></button><p class="map-introduction">An understanding can open to revision wherever we are in the work.</p><figure><a class="illustration-link" href="${artwork.map}-light.png" data-art-link="${artwork.map}" aria-label="Open the relationship map at full size">${themeImage(artwork.map, 'Eight stances connected through illuminated and sketched lettering, with an established understanding returning to an open question.', 'width="1536" height="1024"')}</a><figcaption>Open the image to inspect the lettering. Follow a stance below into its reading.</figcaption></figure><div class="map-reading-links">${mapStances.map(key => link(bySource.get(key))).join('')}</div></section></dialog>`;
}
// Resolve and validate the annotation before replacing the previous generated pages.
for (const page of rendered) page.body = page.body.replace('<!--marginal-note-->', () => marginalNote(annotatedParagraph, url));
for (const file of fs.readdirSync(out)) {
  if (file.endsWith('.html')) fs.unlinkSync(path.join(out, file));
}
const asset = name => `${name}?v=${createHash('sha256').update(fs.readFileSync(path.join(site, name))).digest('hex').slice(0, 10)}`;
for (const page of rendered) {
  const story = page.file === source;
  const body = page.body;
  const origin = story ? '' : '<p class="reading-origin"><a data-return-to-reading href="index.html">Return to Building together</a></p>';
  fs.writeFileSync(path.join(out, pages.get(page.file)), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(page.title)}</title><meta name="description" content="How shared understanding develops through conversation, implementation, and use."><script src="${asset('theme.js')}"></script><link rel="stylesheet" href="${asset('reading.css')}"><link rel="stylesheet" href="${asset('contents.css')}"><link rel="stylesheet" href="${asset('marginalia.css')}"><script type="module" src="${asset('reading.js')}"></script></head>
<body class="${story ? 'story-reading' : 'reference-reading'}" data-return-anchor="${annotation.id}" data-reading-origins="${readingOrigins.join(',')}"><a class="skip-link" href="#reading">Skip to text</a><div class="reading-tools"><button class="paper-choice" hidden>Use dark paper</button>${navigation(page)}</div><main id="reading" tabindex="-1">${origin}<article>${body}</article>${story ? relationshipDialog(url, annotation.id) : ''}<footer>${story ? 'Linked references are included for reading alongside the text.' : '<a data-return-to-reading href="index.html">Return to Building together</a>'}<noscript><details><summary>Contents</summary><ul>${rendered.map(p => `<li><a href="${pages.get(p.file)}">${escape(p.title)}</a></li>`).join('')}</ul></details></noscript></footer></main></body></html>`);
}
fs.cpSync(path.join(site, 'assets'), path.join(out, 'assets'), { recursive: true, filter: file => path.basename(file) !== 'README.md' });
for (const name of ['reading.css', 'contents.css', 'marginalia.css', 'theme.js', 'reading.js', 'contents.js', 'marginalia.js', 'vercel.json']) fs.copyFileSync(path.join(site, name), path.join(out, name));
console.log(`Rendered ${pages.size} pages in ${out}`);
