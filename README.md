# mgruesbeck.github.io Blueprint

## System Overview

A single-page static personal résumé site for Melvin Gruesbeck, served by
GitHub Pages at `https://mgruesbeck.github.io/` (the `og:url` in
`index.html`). There is no build step, package manifest, or server code:
GitHub Pages serves the files as-is.

The page is styled as a light "One Light" terminal transcript (`whoami`,
`cat about.md`, `open scramble.jpg`, `cat gear.json`, `ls experience/`, …)
with an annotated ski-mountaineering photo whose gear markers link to the
`gear.json` lines on hover, focus, or tap.

## Local Interface & Invariants

| File | Role |
| --- | --- |
| `index.html` | The whole site, self-contained. SEO, canonical, Open Graph (`og:type` `profile`), and `twitter:card` meta tags; a JSON-LD `Person` block; all CSS inline in one `<style>`; one inline `<script>` that links the photo markers (`.hs[data-i]`) to the gear lines (`[data-gear]`) and opens the hobby photos (`a.ph`) in the `<dialog class="viewer">`. Loads Martian Mono and IBM Plex Mono from Google Fonts and the photos from `assets/`. |
| `assets/scramble-900.jpg`, `assets/scramble-1800.jpg` | The ski-mountaineering photo at two widths, used through `srcset`. Photo by Brendan King (https://kingb12.github.io/), credited under the photo. |
| `assets/ski-1800.jpg`, `assets/moto-1800.jpg`, `assets/tools-1800.jpg` | Hobby photos linked from the last line of `about.md`. Each `a.ph` link's `href` points at the file, so it still works without JavaScript; the script reads `data-name`, `data-alt`, and `data-cap` to fill the viewer. |
| `assets/scramble-og.jpg` | 1200×1200 square crop of the same photo for link previews. Referenced by `og:image` and the JSON-LD `image`. |
| `favicon.svg` | Site icon: two dark peaks forming an "M", with an orange pin on the higher summit, matching the page's gear markers. |
| `favicon.ico`, `apple-touch-icon.png` | The same icon as a 16/32/48 px ICO for older browsers, and as a 180 px home-screen icon. |

Invariants:

- The `description` and `og:description` meta tags in `index.html` hold the
  same text. Edit both together.
- `og:image:width` and `og:image:height` must match `assets/scramble-og.jpg`
- Each `a.ph` link's `data-name` must match an `assets/<name>-1800.jpg` file
  (1200×1200). Renaming the file breaks `og:image` and the JSON-LD `image`.
- Keep the photo credit to Brendan King under the photo.
- The JSON-LD `sameAs` values duplicate the links section. Update them
  together. Add `jobTitle` and `worksFor` back when there is a current role.
- Each gear marker's `data-i` must match the `data-gear` of its line in
  `gear.json`, and the marker's `left`/`top` percentages are positions on the
  photo. Re-cropping or replacing the photo means re-placing the markers.
- The site is edited both locally and through the GitHub web editor. Pull before
  editing locally.

## Subdirectories & System Boundaries

- `assets/`: photo files for `index.html`. No contract file.
- `explorations/`, `research_notes/`, `reports/`: local working folders, all git-ignored.

## Global Invariants

- The site must stay a plain static site that GitHub Pages can serve directly
  from the `master` branch with no build.

## Global Side Effects

- The inline script only toggles classes on the page. It makes no network
  requests and stores nothing. The `<!-- analytics -->` placeholder is empty.
- When the page loads, the browser requests Martian Mono and IBM Plex Mono
  from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
- A push to `master` publishes the site through GitHub Pages.

## System Verification

- No test suite exists. To check the site, run `make serve` and open
  `http://localhost:8000/`. Use `make serve PORT=3000` for another port.
