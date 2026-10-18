# Building together reading edition

Public URL: <https://building-together-ruby.vercel.app/>

The site renders `instructions/building-together.instructions.md` and the
repository Markdown pages reachable through its links. Canonical Markdown owns
the wording. `reading.css` preserves the reading edition's typography and colors;
`cycle.html` renders the opening Mermaid relationship as a compact, accessible
diagram. Keep that rendering aligned with the canonical diagram when it changes.

Build from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:site
```

The generated site is in `out/reading-site/`. It contains static HTML and the
Vercel configuration, with no remote fonts or runtime JavaScript. Source paths,
conversation records, screenshots, and the local reading copy's `sources.json`
are excluded.

For local preview:

```sh
python3 -m http.server 8878 --bind 127.0.0.1 --directory out/reading-site
```

The Vercel project is `building-together` in `yehuda-katzs-projects`. To publish
the current canonical text after reviewing it:

```sh
pnpm build:site
vercel deploy out/reading-site --prod --yes --project building-together --scope yehuda-katzs-projects
```

Publication is explicit. Plugin builds and merges do not automatically deploy
this site. Upload only the generated directory so local working records remain
outside the deployment.
