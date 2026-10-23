import { escape, artwork, themeImage, folio, fold } from './presentation.mjs';
import { synthesis } from './relationships.mjs';

// Editorial attachment to canonical prose. A changed or ambiguous quote fails
// the build so that the annotation can be reconsidered alongside the passage.
export const annotation = {
  id: 'result-understanding',
  section: 'working-through-a-change',
  quote: 'change what is worth doing next.',
  stance: synthesis,
  title: 'Interpretive Synthesis',
  explanation: 'The result can change our understanding of the work, including what now seems possible.',
};

// Measurements belong to this illustrated I. The browser maps its attachment
// into the page after the live title and paragraph have wrapped.
export const initial = {
  width: 1350, height: 1165,
  attachment: { x: 0.07, y: 0.85 },
  arrivalHandle: 30,
  margin: { width: 155, left: -115, top: -64 },
  compact: { width: 145, left: -40, top: -54, titleInset: 74, fadeStart: 18, fadeEnd: 38 },
};

export function markPhrase(html, quote, id) {
  const pattern = quote.split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  const matches = [...html.matchAll(new RegExp(pattern, 'g'))];
  if (matches.length !== 1) throw new Error(`Annotation ${id}: expected one occurrence of its phrase, found ${matches.length}`);
  return html.replace(new RegExp(pattern), text => `<span class="annotation-anchor" id="${id}-phrase">${text}</span>`);
}

export function marginalNote(html, url) {
  const a = annotation;
  const props = Object.entries(initial.margin).map(([key, value]) => `--initial-${key}:${value}px`)
    .concat(Object.entries(initial.compact).map(([key, value]) => `--compact-${key}:${value}${key.startsWith('fade') ? '%' : 'px'}`)).join(';');
  return `<div class="annotated" id="${a.id}" tabindex="-1" data-attachment-x="${initial.attachment.x}" data-attachment-y="${initial.attachment.y}" data-arrival-handle="${initial.arrivalHandle}" style="${props}">
<p class="passage">${markPhrase(html, a.quote, a.id)}</p><svg class="tether" aria-hidden="true"><g class="underlines"></g><path class="connector"></path></svg>
<button class="note-toggle" aria-expanded="true" aria-controls="${a.id}-note" hidden><span class="note-mark" aria-hidden="true">❧</span><span>A note on this passage</span>${fold}</button>
<aside id="${a.id}-note" class="marginal-note" aria-labelledby="${a.id}-title"><h2 id="${a.id}-title" class="note-title"><a href="${url(a.stance)}?from=${a.id}" aria-label="${a.title}">${themeImage(artwork.initial, '', `class="initial" width="${initial.width}" height="${initial.height}"`)}<span aria-hidden="true">nterpretive<br> Synthesis</span></a></h2><p>${escape(a.explanation)}</p><button class="folio-action open-map" aria-haspopup="dialog" aria-controls="encounter" hidden>${folio}<span>Explore the map</span></button><noscript><p><a href="${artwork.map}-light.png">View the relationship map</a></p></noscript></aside></div>`;
}
