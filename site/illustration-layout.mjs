import { parseFragment, serialize } from 'parse5';

/** Place the existing drawings beside their passages, retaining every passage
 * node, link and return address. The source's paragraph boundaries stay intact.
 * The edition's note on the text joins the opening spread as an aside, before
 * the introductory paragraphs and outside all of them. */
export function composeIllustrations(html, openingNote = '') {
  const root = parseFragment(html);
  const elements = root.childNodes.filter(node => node.tagName);
  const byId = id => elements.find(node => node.attrs?.some(attr => attr.name === 'id' && attr.value === id));
  const opening = byId('opening-cycle');
  const reprise = byId('return-cycle');
  const openingIndex = elements.indexOf(opening);
  const introduction = elements.slice(1, openingIndex);
  const reflection = elements[elements.indexOf(reprise) - 1];
  if (elements[0]?.tagName !== 'h1' || !opening || !introduction.length
      || introduction.some(node => node.tagName !== 'p') || reflection?.tagName !== 'p') {
    throw new Error('Illustration layout needs introductory paragraphs before the opening cycle and a reflection before the reprise');
  }
  const openingCopy = group('cycle-copy', introduction);
  const note = parseFragment(openingNote).childNodes;
  replace([...introduction, opening], group('cycle-spread cycle-opening', [...note, openingCopy, opening]));
  replace([reflection, reprise], group('cycle-spread cycle-return', [reprise, reflection]));
  return serialize(root);

  function group(className, children) {
    const wrapper = parseFragment(`<div class="${className}"></div>`).childNodes[0];
    wrapper.childNodes = children;
    for (const child of children) child.parentNode = wrapper;
    return wrapper;
  }
  function replace(nodes, wrapper) {
    const first = root.childNodes.indexOf(nodes[0]);
    const last = root.childNodes.indexOf(nodes.at(-1));
    root.childNodes.splice(first, last - first + 1, wrapper);
    wrapper.parentNode = root;
  }
}
