// Set the paper before CSS paints. Storage is optional, including private browsing.
try {
  document.documentElement.dataset.theme = localStorage.getItem('reading-paper') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch {
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
