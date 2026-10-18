import { Marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(site, '..');
const out = path.join(repo, 'out', 'reading-site');
const source = path.join(repo, 'instructions', 'building-together.instructions.md');
fs.mkdirSync(out, { recursive: true });
// Remove old generated pages while preserving Vercel's local project binding.
for (const file of fs.readdirSync(out)) {
  if (file.endsWith('.html')) fs.unlinkSync(path.join(out, file));
}
const pages = new Map([[source, 'index.html']]);
const queue = [source];
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const css = fs.readFileSync(path.join(site, 'reading.css'), 'utf8');
const diagram = fs.readFileSync(path.join(site, 'cycle.html'), 'utf8');

for (let i = 0; i < queue.length; i++) {
  const file = queue[i];
  let markdown = fs.readFileSync(file, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const title = markdown.match(/^# (.+)$/m)?.[1] || path.basename(file);
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
        if (token.lang === 'mermaid' && file === source) return diagram;
        return `<pre><code>${escape(token.text)}</code></pre>`;
      },
      heading(token) {
        const id = token.text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ +/g, '-');
        return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
      }
    }
  });
  const body = marked.parse(markdown);
  const nav = file === source ? 'Working draft · Reading copy' : '<a href="index.html">← Building together</a> · Reference';
  fs.writeFileSync(path.join(out, pages.get(file)), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><meta name="description" content="How shared understanding develops through conversation, implementation, and use."><style>${css}</style></head>
<body><main><nav>${nav}</nav><article>${body}</article><footer>${file === source ? 'Reading copy of the current draft. Linked references are included for reading alongside it.' : '<a href="index.html">Return to Building together</a>'}</footer></main></body></html>`);
}
fs.copyFileSync(path.join(site, 'vercel.json'), path.join(out, 'vercel.json'));
console.log(`Rendered ${pages.size} pages in ${out}`);
