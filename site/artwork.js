/** Apply the paper choice without fetching artwork in unopened guides. */
export function applyArtworkTheme(scope, theme) {
  for (const image of scope.querySelectorAll('[data-art]')) {
    if (!image.hasAttribute('data-art-deferred')) setImageTheme(image, theme);
  }
  for (const link of scope.querySelectorAll('[data-art-link]')) {
    link.href = `${link.dataset.artLink}-${theme}.png`;
  }
}

function setImageTheme(image, theme) {
  image.setAttribute(image.tagName.toLowerCase() === 'image' ? 'href' : 'src', `${image.dataset.art}-${theme}.png`);
}

/** SVG images have no native lazy loading. Observe their visible frame, which
 * stays outside the viewport while its dialog or question is closed. */
export function observeDeferredArtwork(scope, currentTheme, Observer = IntersectionObserver) {
  const observer = new Observer(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      for (const image of target.querySelectorAll('[data-art-deferred]')) {
        image.removeAttribute('data-art-deferred');
        setImageTheme(image, currentTheme());
      }
      observer.unobserve(target);
    }
  });
  for (const image of scope.querySelectorAll('[data-art-deferred]')) {
    observer.observe(image.closest('svg'));
  }
  return observer;
}
