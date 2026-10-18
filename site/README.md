# Building together reading edition

Public URL: <https://ai.wycats.fun/>

The site renders `instructions/building-together.instructions.md` and the
repository Markdown pages reachable through its links. Canonical Markdown owns
the wording. `reading.css` preserves the reading edition's typography and colors;
`cycle.html` renders the opening Mermaid relationship as a compact, accessible
diagram. Keep that rendering aligned with the canonical diagram when it changes.

Build from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:site
pnpm check:site
```

The generated site is in `out/reading-site/`. It contains static HTML and the
Vercel configuration, with no remote fonts or runtime JavaScript. Source paths,
conversation records, screenshots, and the local reading copy's `sources.json`
are excluded.

For local preview:

```sh
python3 -m http.server 8878 --bind 127.0.0.1 --directory out/reading-site
```

## Deployment

The validation workflow builds the site on Linux and Windows for pull requests
and pushes to `main`. It checks local links, images, and fragment destinations
in the rendered HTML. External links are not fetched during CI.

After the full validation matrix passes on `main`, the deployment job publishes
the validated Linux artifact to Vercel. The project is `building-together` in
`yehuda-katzs-projects`; it has no separate Git-triggered deployment. Changes to
generated plugin output alone do not trigger the workflow.

Deployment credentials live in the GitHub environment `reading-site-production`,
restricted to `main`. Its `READING_SITE_VERCEL_TOKEN` secret is scoped to this
Vercel project. Pull request validation does not use the environment or token.

To publish a reviewed build manually:

```sh
pnpm build:site
pnpm check:site
vercel deploy out/reading-site --prod --yes --project building-together --scope yehuda-katzs-projects
```

Upload only the generated directory so local working records remain outside
the deployment. The original `building-together-ruby.vercel.app` URL remains
available alongside the custom domain.
