/** Shared reading-edition marks and artwork. Text and destinations come from the build. */
export const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
export const folio = '<svg class="folio-icon" viewBox="0 0 28 28" aria-hidden="true"><path d="M3 5q6-2 11 1q5-3 11-1v18q-6-2-11 1q-5-3-11-1Z"/><path d="M14 6v18M6 10l5 1M17 11l5-1M6 15l5 1M17 16l5-1"/></svg>';
export const fold = '<svg class="folded-tab" viewBox="0 0 18 24" aria-hidden="true"><path class="tab-base" d="M2 2 16 12 2 22Z"/><path class="tab-light" d="M2 2 16 12 4 11Z"/><path class="tab-shade" d="M4 11 16 12 2 22Z"/></svg>';
export const closeMark = '<span>Close</span><span class="close-sign" aria-hidden="true">×</span>';
export const artwork = {
  opening: 'assets/illustrations/diagram-recomposed',
  map: 'assets/illustrations/return-map',
  initial: 'assets/illustrations/initial-i',
};
export function themeImage(base, alt, attributes = '') {
  return `<img src="${base}-light.png" data-art="${base}" alt="${escape(alt)}" ${attributes}>`;
}
export function cycleIllustration(id, reprise = false) {
  const alt = 'Our understanding of what we are building guides what we notice and pursue. What we encounter can revise that understanding. The lettering and returning penwork form a continuous composition.';
  return `<figure id="${id}" class="manuscript-cycle${reprise ? ' cycle-reprise' : ''}"><a class="illustration-link" href="${artwork.opening}-light.png" data-art-link="${artwork.opening}" aria-label="Open the understanding diagram at full size">${themeImage(artwork.opening, alt, 'width="1536" height="1024"')}</a><figcaption><a href="${artwork.opening}-light.png" data-art-link="${artwork.opening}">Open the illustration</a></figcaption></figure>`;
}
export const mapStances = [
  'socratic-elicitation', 'collaborative-grounding', 'gap-reading',
  'interpretive-synthesis', 'hypothesis-forming', 'observational-grounding',
  'hypothesis-evaluating', 'vision-steering',
].map(name => `skills/stances/${name}/SKILL.md`);

export function relationshipDialog(url, returnId) {
  const link = (name, title) => `<a href="${url(`skills/stances/${name}/SKILL.md`)}?from=${returnId}">${title}</a>`;
  return `<dialog id="encounter" aria-labelledby="encounter-title">
<div class="encounter-head"><h2 id="encounter-title">What follows from the result</h2><button class="edge-close" data-close-dialog aria-label="Close the map and return to the passage">${closeMark}</button></div>
<p>What a result establishes can become the starting point for a new expectation. Here the finished lettering of ${link('hypothesis-evaluating', 'Hypothesis Evaluating')} returns to the sketched ${link('hypothesis-forming', 'Hypothesis Forming')}.</p>
<div class="map-views" role="group" aria-label="Map view"><button id="focused-map" aria-pressed="true">This relationship</button><button id="whole-map" aria-pressed="false">Whole map</button><button id="map-scale" aria-pressed="false">Larger lettering</button></div>
<figure><div class="map-window" tabindex="0" role="region" aria-label="Illustrated relationship; scroll to read enlarged lettering">
<svg class="map-focus" viewBox="0 0 1050 680" role="img" aria-labelledby="map-title"><title id="map-title">Hypothesis Evaluating asks what the result establishes. Hypothesis Forming asks what this now leads us to expect.</title><defs><filter id="soft-edge"><feGaussianBlur stdDeviation="5"/></filter><mask id="relationship-window"><path fill="white" filter="url(#soft-edge)" d="M 8 8 H 930 Q 955 8 955 45 L 950 145 Q 1040 155 1040 210 L 1040 300 Q 1015 334 952 350 L 925 390 Q 940 430 945 490 L 960 610 Q 975 662 910 675 H 130 Q 18 675 8 625 Z"/></mask></defs><image href="${artwork.map}-light.png" data-art="${artwork.map}" width="1536" height="1024" mask="url(#relationship-window)"></image></svg></div>
<figcaption>The sketch marks an understanding opening to revision. Any part of the work can return to it. <a href="${artwork.map}-light.png" data-art-link="${artwork.map}">Open the illustration at full size</a>.</figcaption></figure></dialog>`;
}
