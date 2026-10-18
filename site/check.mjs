import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

/** Check rendered destinations, including links written as raw HTML in source. */
export async function checkSite(directory) {
  const root = path.resolve(directory);
  const pages = new Map();
  for (const file of await fs.readdir(root)) {
    if (!file.endsWith('.html')) continue;
    const document = parse(await fs.readFile(path.join(root, file), 'utf8'));
    pages.set(file, pageReferences(document));
  }
  if (!pages.has('index.html')) throw new Error('Reading site is missing index.html');

  const errors = [];
  let linkCount = 0;
  for (const [file, page] of pages) {
    for (const href of page.links) {
      linkCount++;
      try {
        await checkDestination(root, file, href, pages);
      } catch (error) {
        errors.push(`${file}: ${href}: ${error.message}`);
      }
    }
  }
  if (errors.length) throw new Error(`Broken reading-site links:\n${errors.join('\n')}`);
  return { pages: pages.size, links: linkCount };
}

function pageReferences(document) {
  const ids = new Set();
  const links = [];
  function visit(node) {
    for (const { name, value } of node.attrs ?? []) {
      if (name === 'id') ids.add(value);
      if (name === 'href' || name === 'src') links.push(value);
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(document);
  return { ids, links };
}

async function checkDestination(root, source, href, pages) {
  // Resolve relative URLs as the static host does, including query strings.
  const origin = 'https://reading-site.invalid';
  const url = new URL(href, `${origin}/${source}`);
  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
    throw new Error(`Unsupported URL scheme ${url.protocol}`);
  }
  if (url.origin !== origin) return; // External services are outside this check.

  const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
  const destination = path.resolve(root, target);
  if (!destination.startsWith(root + path.sep)) throw new Error('Destination escapes the site');
  if (!(await fs.stat(destination).catch(() => null))?.isFile()) {
    throw new Error(`Missing file ${target}`);
  }
  if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
    throw new Error(`Missing anchor ${url.hash}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = fileURLToPath(new URL('../out/reading-site/', import.meta.url));
  const result = await checkSite(directory);
  console.log(`Checked ${result.pages} pages and ${result.links} links.`);
}
