import { Marked } from 'marked';
import matter from 'gray-matter';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { escape, cycleIllustration, questionPlate, relationshipDialog, folio, fold, closeMark } from './presentation.mjs';
import { annotation, marginalNote } from './marginalia.mjs';
import { resolveGuide, guideMarkup } from './guide.mjs';
import { questions } from './questions.mjs';
import { composeIllustrations } from './illustration-layout.mjs';
import { kinds, editionNote, colophon, questionsIntroduction, addressedReading, footLinks, pageMeta, repositoryUrl } from './edition.mjs';

const site = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(site, '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out')) throw new Error('Usage: node site/build.mjs [--out directory]');
const out = args.length ? path.resolve(args[1]) : path.join(repo, 'out', 'reading-site');
if (!out.startsWith(path.join(repo, 'out') + path.sep)) throw new Error('Site output must be inside the repo out directory');
const source = path.join(repo, 'instructions', 'building-together.instructions.md');
const styleSource = path.join(site, 'STYLE.md');
const tryingSource = path.join(site, 'TRYING.md');
// Pages the edition writes for its readers. They have fixed addresses and stay
// out of the index of canonical readings.
const editorial = new Map([
  [styleSource, { address: 'style.html', kind: 'editorial guide' }],
  [tryingSource, { address: 'trying.html', kind: 'edition note' }],
]);
fs.mkdirSync(out, { recursive: true });
const pages = new Map([[source, 'index.html']]);
const queue = [source];
const rendered = [];
let annotatedParagraph;
let annotationCount = 0;
// Every story paragraph a reader can leave from and return to, in reading order.
const passages = {};
const passageText = {};
// Story passages citing each reference page, and references citing one another.
const citations = new Map();
const referrers = new Map();

function renderSource(file) {
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
      // Editorial documentation links to repository guidance without pulling
      // the contributor documentation graph into the book's reading catalog.
      if (file === styleSource) {
        token.href = repositoryPage(target, hash);
        return;
      }
      // "Trying the plugin" stays in the book for readings the essay already
      // reaches, and hands off to the repository's documentation for setup.
      // Each link remembers its document, so a quotation can be checked
      // against the one its credit names.
      if (file === tryingSource) {
        token.linkedSource = target;
        if (pages.has(target)) {
          token.href = pages.get(target) + (hash ? '#' + hash : '');
          return;
        }
        if (hash && !headingIds(target).has(hash)) throw new Error(`Trying the plugin: ${rel} has no section #${hash}`);
        token.href = repositoryPage(target, hash);
        return;
      }
      if (!pages.has(target)) {
        pages.set(target, `reference-${pages.size}.html`);
        queue.push(target);
      }
      if (file !== source && target !== file && !editorial.has(file)) {
        if (!referrers.has(target)) referrers.set(target, new Set());
        referrers.get(target).add(file);
      }
      token.href = pages.get(target) + (hash ? '#' + hash : '');
      if (token.title?.startsWith('composition:')) token.title = path.basename(path.dirname(target));
    },
    renderer: {
      blockquote(token) {
        if (file === tryingSource) checkQuotation(token);
        return `<blockquote>${this.parser.parse(token.tokens)}</blockquote>`;
      },
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
          annotatedParagraph = storyPassage(annotation.id, html, token.tokens);
          return '<!--marginal-note-->';
        }
        if (file === source) {
          const id = `passage-${Object.keys(passages).length + 1}`;
          return `<p id="${id}" tabindex="-1">${storyPassage(id, html, token.tokens)}</p>`;
        }
        return `<p>${html}</p>`;
      },
    },
  });
  function storyPassage(id, html, tokens) {
    const chapter = sections.length ? sections.at(-1) : null;
    passages[id] = { excerpt: passageExcerpt(tokens), chapter: chapter ? roman(sections.length) : '', section: chapter?.title || '' };
    passageText[id] = { text: passageExcerptText(tokens).replace(/\s+/g, ' '), section, links: readingLinks(tokens) };
    const linked = passageLinks(html, id);
    for (const [, href] of linked.matchAll(/href="(reference-\d+\.html)/g)) cite(href, id);
    return linked;
  }
  const parsed = marked.parse(markdown);
  const body = file === source ? composeIllustrations(parsed, editionNote(editorial.get(tryingSource).address)) : parsed;
  rendered.push({ file, title, body, sections, kind: data.metadata?.['wycats.kind'], description: data.description });
}
function repositoryPage(target, hash) {
  return `${repositoryUrl}/blob/main/${path.relative(repo, target).split(path.sep).map(encodeURIComponent).join('/')}${hash ? '#' + hash : ''}`;
}
// Section addresses of a repository document, as its headings produce them.
function headingIds(target) {
  const { content } = matter(fs.readFileSync(target, 'utf8'));
  return new Set([...content.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ +/g, '-')));
}
// A quotation on an edition page reproduces its source exactly: the words in
// quotation marks must occur in the document its credit links to.
function checkQuotation(token) {
  const flat = tokens => tokens.flatMap(item => [item, ...flat(item.tokens || [])]);
  const credit = flat(token.tokens).find(item => item.type === 'link' && item.linkedSource);
  const words = /“([\s\S]+)”/.exec(token.text)?.[1].replace(/\s+/g, ' ');
  if (!credit || !words) throw new Error('Trying the plugin: a quotation needs quotation marks and a linked credit');
  const sourceText = fs.readFileSync(credit.linkedSource, 'utf8').replace(/^>\s?/gm, '').replace(/\s+/g, ' ');
  if (!sourceText.includes(words)) throw new Error(`Trying the plugin: “${words}” is not in ${path.relative(repo, credit.linkedSource)}`);
}
// Discover canonical readings first so their existing addresses stay stable.
for (let i = 0; i < queue.length; i++) renderSource(queue[i]);
for (const [file, { address }] of editorial) pages.set(file, address);
for (const file of editorial.keys()) renderSource(file);
if (annotationCount !== 1) throw new Error(`Expected one annotation passage in ${annotation.section}, found ${annotationCount}`);
const bySource = new Map(rendered.map(page => [path.relative(repo, page.file).split(path.sep).join('/'), page]));
// Editorial navigation names canonical sources; each must be a rendered reading.
function sourcePage(key) {
  const page = bySource.get(key);
  if (!page) throw new Error(`Reading-edition navigation points to an unread source: ${key}`);
  return page;
}
const url = key => pages.get(sourcePage(key).file);
// The marginal note belongs to the text, so its reading is cited by that passage.
cite(url(annotation.stance), annotation.id);
// Resolve each editorial question against the essay and the rendered readings.
const story = {
  find: (section, text) => Object.keys(passageText).filter(id => passageText[id].section === section && passageText[id].text.includes(text)),
  links: id => passageText[id].links,
};
const entrances = questions.map(question => {
  const guide = resolveGuide(question, { sourcePage, story, href: page => pages.get(page.file) });
  const passage = guide.passage;
  return { ...question, passage, guide, readings: guide.readings };
});
const entrancesFor = page => entrances.filter(question => question.readings.some(reading => reading.page === page));

function cite(href, id) {
  if (!citations.has(href)) citations.set(href, []);
  citations.get(href).push(id);
}
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
function passageExcerpt(tokens) {
  const plain = passageExcerptText(tokens);
  const words = plain.trim().split(/\s+/);
  return words.slice(0, 8).join(' ') + (words.length > 8 ? '…' : '');
}
// The essay's own reading links in a passage, as rendered destinations and words.
function readingLinks(tokens) {
  return tokens.flatMap(token => token.type === 'link' && /^reference-\d+\.html/.test(token.href)
    ? [{ href: token.href.split('#')[0], text: passageExcerptText(token.tokens) }]
    : token.tokens ? readingLinks(token.tokens) : []);
}
function passageExcerptText(tokens) {
  return tokens.map(token => token.tokens ? passageExcerptText(token.tokens) : token.text || '').join('');
}
const resumeHref = id => `index.html?resume=${id}#${id}`;
const placeName = id => passages[id].section || 'The opening';
function gloss(page) {
  const first = page.description?.split(/(?<=\.)\s/)[0];
  return first ? first.replace(/^Use when /, 'When ') : '';
}
// An index entry's references. Chapter locators name each chapter whose prose
// cites the reading, in the red numerals the chapter list uses, and resume its
// first citing passage there. A reading the text never cites points instead to
// the readings that do.
function chapterLocators(page) {
  const order = Object.keys(passages);
  const cited = (citations.get(pages.get(page.file)) || []).toSorted((a, b) => order.indexOf(a) - order.indexOf(b));
  const byChapter = new Map();
  for (const id of cited) if (!byChapter.has(passages[id].chapter)) byChapter.set(passages[id].chapter, id);
  if (!byChapter.size) return '';
  const links = [...byChapter].map(([chapter, id]) => {
    const place = chapter ? `${chapter}, ${placeName(id).toLowerCase()}` : 'the opening';
    return `<a href="${resumeHref(id)}" aria-label="${escape(placeName(id))}" title="Read it in ${escape(place)}">${chapter || 'opening'}</a>`;
  }).join(' ');
  return `<span class="index-locators"><span class="visually-hidden">in the text: </span>${links}</span>`;
}
function seeAlso(page) {
  if (citations.get(pages.get(page.file))?.length) return '';
  const from = [...(referrers.get(page.file) || [])].map(file => rendered.find(other => other.file === file)).slice(0, 2);
  return from.length ? `<p class="index-see"><em>see</em> ${from.map(other => `<a href="${pages.get(other.file)}">${escape(other.title)}</a>`).join(', ')}</p>` : '';
}
function navigation(current) {
  const story = rendered[0];
  const link = page => `<a href="${pages.get(page.file)}"${page === current ? ' aria-current="page"' : ''}><span class="entry-title">${escape(page.title)}</span></a>`;
  const sectionList = (page, local = false) => `<ul class="${local ? 'local-reading' : 'story-sections'}">${page.sections.map((section, index) => `<li><a href="${pages.get(page.file)}#${section.id}"${page === current ? ` data-section="${section.id}"` : ''}><span class="entry-title">${escape(section.title)}</span><span class="entry-leader" aria-hidden="true"></span><span class="entry-number" aria-hidden="true">${roman(index + 1)}</span></a></li>`).join('')}</ul>`;
  const outline = current === story ? sectionList(story) : `<details class="story-outline"><summary><span>Chapters</span>${fold}</summary>${sectionList(story)}</details><div class="local-reading-heading">${link(current)}</div>${sectionList(current, true)}`;

  const open = entrancesFor(current)[0];
  // A reading chosen from a question carries that question as provenance (see
  // origin.js), and names the other questions it appears in.
  const entrance = question => {
    const href = page => `${pages.get(page.file)}?question=${question.id}`;
    const link = (page, html, className = '') => `<a href="${href(page)}"${className ? ` class="${className}"` : ''}${page === current ? ' aria-current="page"' : ''}>${html}</a>`;
    const also = page => {
      const elsewhere = entrancesFor(page).filter(other => other !== question);
      return elsewhere.length ? `<p class="also-in">Also in ${elsewhere.map(other => `<button type="button" data-open-question="question-${other.id}">${fold}<span>${escape(other.short)}</span></button>`).join(', ')}</p>` : '';
    };
    const citation = passage => ({ href: resumeHref(passage), label: `Building together · ${placeName(passage)}` });
    const guide = guideMarkup(question, question.guide, { href: page => pages.get(page.file), link, also, citation, illustration: question.plate ? questionPlate() : '' });
    if (!question.situation?.trim() || /[{}]/.test(question.situation)) throw new Error(`Question ${question.id}: its situation must be plain prose`);
    return `<details class="question" name="contents-question" id="question-${question.id}" data-passage="${question.passage}"${question === open ? ' open' : ''}><summary><span class="question-heading"><span class="question-text">${escape(question.question)}</span><span class="question-situation">${escape(question.situation)}</span></span>${fold}</summary>
<div class="question-spread">${guide}</div></details>`;
  };

  return `<button class="contents-toggle folio-action" aria-label="Contents" aria-controls="contents" aria-expanded="false" aria-haspopup="dialog" hidden>${folio}<span>Contents</span></button>
<dialog id="contents" aria-labelledby="contents-title"><div class="contents-heading"><h2 id="contents-title">Contents</h2><p class="contents-parts"><a href="#contents-chapters">chapters</a><a href="#contents-questions">questions</a><a href="#contents-index">index</a></p><button class="edge-close" data-close-dialog aria-label="Close contents">${closeMark}</button></div>
<nav class="contents-body" aria-label="Building together and its readings">${current === story ? '' : `<p class="contents-origin" data-origin hidden>${returnLink('Return to the passage')}</p>`}
<section id="contents-chapters" class="contents-chapters" aria-label="Chapters" tabindex="-1"><div class="contents-column"><div class="story-link">${link(story)}</div>${outline}</div>${colophon(story.description, editorial.get(tryingSource).address, current.file === tryingSource)}</section>
<section id="contents-questions" class="contents-questions" aria-labelledby="questions-title" tabindex="-1"><h3 id="questions-title">Questions to begin from</h3><p class="part-introduction">${questionsIntroduction}</p>${entrances.map(entrance).join('')}</section>
<section id="contents-index" class="contents-index" aria-labelledby="index-title" tabindex="-1"><h3 id="index-title">Index of readings</h3><p class="index-key">Chapter references lead to passages that cite each reading.</p>${readingIndex(current)}</section><p class="contents-edition">${[[tryingSource, 'Trying the plugin'], [styleSource, 'Style of this edition']].map(([file, label]) => `<a href="${editorial.get(file).address}"${current.file === file ? ' aria-current="page"' : ''}>${label}</a>`).join(' · ')}</p></nav></dialog>`;
}
function readingIndex(current, ids = true) {
  const story = rendered[0];
  const entry = page => `<a href="${pages.get(page.file)}"${page === current ? ' aria-current="page"' : ''}><span class="entry-title">${escape(page.title)}</span></a>`;
  return [...Object.entries(kinds), [undefined, { group: 'other readings', about: '' }]].map(([kind, { group, about }]) => {
    const members = rendered.filter(page => page !== story && !editorial.has(page.file) && page.kind === kind).sort((a, b) => a.title.localeCompare(b.title, 'en'));
    if (!members.length) return '';
    const id = `index-${group.replace(/ /g, '-')}`;
    // Each entry is an annotated row: the name on the left edge, chapter
    // locators on the right edge of the same line, and its gloss and any
    // cross-reference hung beneath the name.
    const row = page => `<li><p class="index-entry">${entry(page)}${chapterLocators(page)}</p>${gloss(page) ? `<p class="index-gloss">${escape(gloss(page))}</p>` : ''}${seeAlso(page)}</li>`;
    return `<section class="index-group"${ids ? ` aria-labelledby="${id}"` : ''}><h4${ids ? ` id="${id}"` : ''}>${group}</h4>${about ? `<p class="part-introduction">${about}</p>` : ''}<ul>${members.map(row).join('')}</ul></section>`;
  }).join('');
}
// The way back into the book. Without a known origin it names the book; the
// script makes it a return only when the address names a story passage.
function returnLink(label) {
  return `<a data-return-to-reading href="index.html"><span class="edge-label" data-return-label>${label}</span><span class="edge-cue" data-origin-cue></span></a>`;
}
// A direct arrival at the head of a canonical reading also learns whom the
// text addresses and what kind of reading it is.
function readingEdge(where, page) {
  const addressed = where === 'head' && !editorial.has(page.file) ? ` <span class="edge-addressed">${addressedReading(page.kind)}</span>` : '';
  return `<p class="reading-edge reading-edge-${where}">${returnLink('Building together')}<span class="edge-note" data-edge-note>, the essay this reading accompanies${addressed ? `.${addressed}` : ''}</span></p>`;
}
// Resolve and validate the annotation before replacing the previous generated pages.
for (const page of rendered) page.body = page.body.replace('<!--marginal-note-->', () => marginalNote(annotatedParagraph, url));
for (const file of fs.readdirSync(out)) {
  if (file.endsWith('.html')) fs.unlinkSync(path.join(out, file));
}
const asset = name => `${name}?v=${createHash('sha256').update(fs.readFileSync(path.join(site, name))).digest('hex').slice(0, 10)}`;
// A reference page's arrival: its title and opening paragraph, with the
// reading's kind set quietly on the title line. The questions it belongs to
// are a marginal annotation on that opening, in the words Contents gives them;
// it describes membership, never the reader's path. The script adds the
// question the reader actually chose from when the address names one.
function arrival(page) {
  const opening = /^\s*(<h1\b[^>]*>[\s\S]*?<\/h1>)\s*(<p>[\s\S]*?<\/p>)?/.exec(page.body);
  if (!opening) throw new Error(`${page.title}: a reading must open with its title`);
  const [whole, title, intro = ''] = opening;
  const kind = editorial.get(page.file)?.kind ?? kinds[page.kind]?.label;
  const memberships = entrancesFor(page).map(question => {
    const { role } = question.readings.find(reading => reading.page === page);
    return besideQuestion(question, `<p class="beside-role">${escape(role)}</p>`);
  });
  const label = memberships.length > 1 ? 'Related questions' : 'Related question';
  const beside = `<aside class="reading-beside" aria-label="Questions in Building together" data-beside-notes${memberships.length ? '' : ' hidden'}><div class="beside-group" data-membership${memberships.length ? '' : ' hidden'}><p class="beside-label">${label}</p>${memberships.join('')}</div></aside>`;
  return `<header class="reading-arrival"><div class="arrival-title">${title}${kind ? `<p class="reading-kind">${kind}</p>` : ''}</div><div class="arrival-intro">${intro}${beside}</div></header>${page.body.slice(whole.length)}`;
}
function besideQuestion(question, role = '') {
  return `<section class="beside-question" data-question="${question.id}"><p class="beside-text">${escape(question.question)}</p>${role}<button type="button" class="beside-open" data-open-question="question-${question.id}" data-beside hidden>${fold}<span data-open-label>Open this question</span></button></section>`;
}
const passageData = escape(JSON.stringify(passages));
// What a link to the page says about it: the essay in the author's words and
// the edition's, a reading by its gloss and kind.
function describe(page) {
  const essay = rendered[0].description;
  if (page.file === source) return `${essay} An essay written to a coding agent, in a reading edition with the stances and workflows it links.`;
  if (editorial.has(page.file)) return page.file === tryingSource
    ? 'What installing the wycats plugin gives a coding agent, how installation differs from trusting its guidance, and a first investigation to try.'
    : 'How the reading edition of Building together writes the guides, notes, and navigation it adds around the canonical texts.';
  const label = kinds[page.kind]?.label;
  return `${gloss(page) || essay} ${label ? `A ${label}` : 'A reading'} from the wycats plugin, read alongside Building together.`;
}
for (const page of rendered) {
  const story = page.file === source;
  fs.writeFileSync(path.join(out, pages.get(page.file)), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(page.title)}${story ? '' : ' · Building together'}</title>${pageMeta({ title: page.title, description: describe(page), file: pages.get(page.file), story })}<script src="${asset('theme.js')}"></script><link rel="stylesheet" href="${asset('reading.css')}"><link rel="stylesheet" href="${asset('contents.css')}"><link rel="stylesheet" href="${asset('marginalia.css')}"><script type="module" src="${asset('reading.js')}"></script></head>
<body class="${story ? 'story-reading' : 'reference-reading'}${editorial.has(page.file) ? ' editorial-reading' : ''}" data-return-anchor="${annotation.id}" data-passages="${passageData}"><a class="skip-link" href="#reading">Skip to text</a><div class="reading-tools"><button class="paper-choice" hidden>Use dark paper</button>${navigation(page)}</div><main id="reading" tabindex="-1">${story ? '' : readingEdge('head', page)}<article>${story ? page.body : arrival(page)}</article>${story ? relationshipDialog(url, annotation.id) : ''}<footer>${story ? '' : readingEdge('foot', page)}${footLinks({ trying: editorial.get(tryingSource).address, style: editorial.get(styleSource).address, story })}<noscript><section class="plain-index"><h2>Index of readings</h2><p><a href="index.html">Building together</a></p>${readingIndex(page, false)}</section></noscript></footer></main></body></html>`);
}
fs.cpSync(path.join(site, 'assets'), path.join(out, 'assets'), { recursive: true, filter: file => path.basename(file) !== 'README.md' });
for (const name of ['reading.css', 'contents.css', 'marginalia.css', 'theme.js', 'artwork.js', 'reading.js', 'contents.js', 'marginalia.js', 'origin.js', 'guide.js', 'vercel.json']) fs.copyFileSync(path.join(site, name), path.join(out, name));
console.log(`Rendered ${pages.size} pages in ${out}`);
