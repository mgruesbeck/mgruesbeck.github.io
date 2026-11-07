# mgruesbeck.github.io Blueprint

## System Overview

A single-page static personal résumé site for Melvin Gruesbeck, served by
GitHub Pages at `https://mgruesbeck.github.io/` (the `og:url` in
`index.html`). There is no build step, package manifest, JavaScript, or
server code: GitHub Pages serves the files in the repository root as-is.

The repository is flat. It has no subdirectories.

## Local Interface & Invariants

| File | Role |
| --- | --- |
| `index.html` | The whole site. One HTML document with `<title>Melvin Gruesbeck</title>`, SEO, canonical, Open Graph (`og:type` `profile`), and `twitter:card` meta tags, a JSON-LD `Person` block, an untitled intro, and `<h2>` sections: Experience, Education, Contributions, Volunteering, Certifications, Online, Reads. Links `normalize.css`, `custom.css`, and `favicon.ico` from the root. |
| `custom.css` | Site styles. Sets the body font to `'Inconsolata', monospace` with a `clamp(.8rem, 4vmin, 1.2rem)` font size and link color `#0b6e99`. Limits top-level body children to `max-width: 30rem` with an `8%` left margin, which grows to `calc(8% + 50px)` at `min-width: 750px`. |
| `normalize.css` | Vendored `normalize.css v3.0.2` (MIT). |
| `favicon.ico` | Site icon. |
| `melvin-gruesbeck.jpg` | 1200×630 social preview image (about 60 KB). Referenced by `og:image` and the JSON-LD `image` as `https://mgruesbeck.github.io/melvin-gruesbeck.jpg`. |

Invariants:

- The `description` and `og:description` meta tags in `index.html` hold the
  same text. Edit both together.
- `og:image:width` and `og:image:height` must match `melvin-gruesbeck.jpg`
  (1200×630). Renaming the file breaks `og:image` and the JSON-LD `image`.
- The JSON-LD `jobTitle`, `worksFor`, and `sameAs` values duplicate the
  Experience and Online sections. Update them together.
- The site is edited both locally and through the GitHub web editor. Pull before
  editing locally.

## Subdirectories & System Boundaries

- None. Every file is in the repository root.

## Global Invariants

- The site must stay a plain static site that GitHub Pages can serve directly
  from the `master` branch with no build.

## Global Side Effects

- None at runtime from this repository's code. There are no scripts. The
  `<!-- analytics -->` placeholder in `index.html` is empty.
- When the page loads, the browser requests the Inconsolata font from Google
  Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
- A push to `master` publishes the site through GitHub Pages.

## System Verification

- No test suite or build manifest exists. To check the site, serve the root
  locally and open it in a browser, for example:
  `python3 -m http.server` and then `http://localhost:8000/`.
