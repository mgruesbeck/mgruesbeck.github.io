# mgruesbeck.github.io Blueprint

## System Overview

A single-page static personal résumé site for Melvin Gruesbeck, served by
GitHub Pages at `https://mgruesbeck.sh/` (the `og:url` in
`index.html`; the old `https://mgruesbeck.github.io/` address redirects there). There is no build step, package manifest, or server code:
GitHub Pages serves the files as-is.

The page is styled as a light "One Light" terminal transcript (`whoami`,
`cat about.md`, `open --links`, `open scramble.jpg`, `cat gear.json`, `ls experience/`, …)
with an annotated ski-mountaineering photo whose gear markers link to the
`gear.json` lines on hover, focus, or tap.

## Local Interface & Invariants

| File | Role |
| --- | --- |
| `index.html` | The whole site, self-contained. SEO, canonical, Open Graph (`og:type` `profile`), and `twitter:card` meta tags; a JSON-LD `Person` block; all CSS inline in one `<style>`; one inline `<script>` that links the photo markers (`.hs[data-i]`) to the gear lines (`[data-gear]`) and opens the hobby photos (`a.ph`) in the `<dialog class="viewer">`. Each `ls experience/` row is a native `<details>` (`li.x`) whose `.xd` panel holds the resume detail for that role, drawn as a `tree`-style list, so it expands without JavaScript. The `expand all` button in the hint below (`.hint .all`) opens or closes every row. Under `<main>`, a `<footer class="ft">` holds the motto "Make It Work. Make It Clear." as block lettering with a red shadow: one inline SVG with a `<g class="k">` for each letter and full stop and a last one for the two tone mark of the site icon, plus the same words in a visually hidden `<p>`. The script hides the letters and sets them one at a time the first time the footer is scrolled into view, or all at once under reduced motion; without JavaScript the motto is simply shown. Loads Martian Mono from `assets/fonts/` and the photos from `assets/`, and from another site only the visit counter. |
| `assets/scramble-600.jpg`, `assets/scramble-900.jpg`, `assets/scramble-1200.jpg`, `assets/scramble-1800.jpg` | The ski-mountaineering photo at four widths, used through `srcset`; the photo is drawn at most 560 px wide, so the `sizes` hint in `index.html` must follow any change to that width. The 600 and 1200 px files are resized from the 1800 px one. Photo by Brendan King (https://kingb12.github.io/), credited under the photo. Each width has an `.avif` twin of the same size in pixels, listed first in a `<picture>` so a browser that reads AVIF takes it and the rest take the JPEG. |
| `assets/ski-air.jpg`, `assets/mountain-1800.jpg`, `assets/climb-1800.jpg`, `assets/moto-1800.jpg`, `assets/tools-1800.jpg` | Hobby photos linked from the last line of `about.md`. Each `a.ph` link's `href` points at its file; the script loads that `href` into the viewer and reads `data-name` (the title), `data-alt`, `data-cap`, and `data-w`/`data-h` (the file's pixel size, so the viewer takes the photo's own shape without cropping). Without JavaScript the link opens the file directly. Each has an `.avif` twin of the same size in pixels, which the viewer's `<picture>` offers first by swapping the `.jpg` at the end of the `href` for `.avif`. |
| `assets/fonts/` | Martian Mono, the one typeface, served from this site: `martian-mono-latin.woff2` (one variable file, declared at weight 400 and width 87.5%, and at weight 600 and width 100%) and `martian-mono-latin-ext.woff2` (used by `projects/index.html` only, for accented letters outside Latin-1). The `@font-face` rules sit at the top of each page's `<style>`, and each page preloads the Latin file. `OFL.txt` is the font's licence and stays with the files. |
| `assets/scramble-og.jpg` | 1200×1200 square crop of the same photo for link previews. Referenced by `og:image` and the JSON-LD `image`. |
| `assets/consulting-og.jpg` | 1200×630 share card for the consulting page, drawn after the LinkedIn poster: "Summits are won months before. So are rounds.", "Start with a 30-day trial.", "ops · comms · design" and the mark on the dot grid, beside a photo of a skier booting up a snow couloir between two granite towers. Referenced by `og:image` in `consulting/index.html`, whose `og:image:width` and `og:image:height` must match it. |
| `CNAME` | The custom domain, `mgruesbeck.sh`, read by GitHub Pages. The domain is registered at Porkbun, where four `A` records point the apex at GitHub Pages and a `CNAME` record points `www` at `mgruesbeck.github.io`. The `canonical`, `og:url` and `og:image` addresses in both pages use this domain. |
| `favicon.svg` | Site icon, drawn in blocks: a near peak in paper white, a far peak in grey, and a red block above the summit, on a dark tile. Eight blocks across, so each block is two pixels at 16 px. The same drawing, in ink on the page colour, closes the motto in both footers. |
| `favicon.ico`, `apple-touch-icon.png` | The same icon as a 16/32/48 px ICO for older browsers, and as a 180 px home-screen icon. |
| `projects/index.html` | Password-gated project pages (`noindex`). Asks for the password in a `[sudo]` prompt, derives the key with PBKDF2 using `vault/meta.json`, then decrypts `vault/index.bin` (every project's text and photo list) and each photo as it scrolls into view. `#<slug>` opens one project. Keeps the derived key in `sessionStorage` until the tab closes or `logout`. |
| `projects/vault/` | Output of `make projects`: `meta.json` (salt and iteration count, not secret), `index.bin`, and one `<id>.bin` per photo. Each `.bin` is a 12-byte IV followed by AES-256-GCM ciphertext. Never edit by hand. |
| `tools/build-projects.mjs` | Builds `projects/vault/` from `projects/<slug>/project.md` and the photos it names. Resizes photos to 1600 px (2400 px for `.png` screenshots) and strips their metadata. IVs and file names are HMACs of the content, so unchanged projects rebuild byte-for-byte. Refuses a password that can't open the existing vault unless `CHANGE_PASSWORD=1`. |
| `tools/check.mjs` | The site's checks, run in WebKit through Playwright against a server of its own on a free port, so nothing else needs to be running. For both pages: no script errors, no request to another site but the visit counter's, no sideways scroll, and no accessibility finding from axe (WCAG 2.2 AA and best practice, without its two colour rules, since the palettes are chosen ones; the `~` filler lines of the editor are left out as decoration). For the consulting page: its copy rules, type sizes, quote arithmetic, keys, window handling, print layout on one Letter sheet, and that nothing scrolls inside a pane at four laptop sizes. For the home page: the shell, the photo viewer, the email link, and that each photo is served as AVIF with enough pixels for a 2560px wide screen. Also that both pages can be indexed and `projects/` cannot. Exits 1 on any failure. |
| `tools/package.json`, `tools/package-lock.json` | Pin the two packages the checks use, Playwright and axe-core. `tools/node_modules/` is git-ignored. Nothing the site serves depends on them. |
| `sitemap.xml`, `robots.txt` | The two public pages, for search engines, and the pointer to that list. Neither names `projects/`. |
| `consulting/index.html` | Consulting & booking page, linked from `open --links` in `index.html`. Drawn as a dark code editor's window on a desktop: a title bar with a search field, one file with numbered lines, a `quote` pane beside it, and a status bar with the visitor's own time under both. The file is `overview.md`: the pitch (operations, communications and design run as one effort, year round, so the company is ready whenever a raise, partner or acquirer comes), then a summary of the Consulting Services Agreement (one agreement, month to month, 5% off for a 3-month term and 10% off for a 6-month term, hours above a plan's cap need approval and are $250 each), and the call to action on its last line. The desktop behind the window is a grid of dots with a low range of squares along its foot, cut from the shape of the site icon; both are CSS backgrounds on `body`, the range an inline SVG data URL. The quote pane (`aside.qp`) has a plan picker (a one-time Trial, 10h in 30 days, $2,000, and two monthly plans, Advisory 10h/$2,500 and Fractional 40h/$9,000), a term picker, and an hours slider over a meter of sixty cells. It shows one price: the plan less its term discount, plus $250 for each hour above the plan's cap. Choosing a plan sets the hours to its cap, and a term chosen on the Trial moves the quote to Advisory. Its numbers are the `PLANS`, `OFF` and `RATE` constants in the page's second inline script, which also writes the clock. The call to action is the "free 30-minute call" link, which opens the Google Calendar Appointment Schedule in a dialog. It is the only link on the page, so nothing draws a click away from it. The search field in the title bar holds a search for that link and can be typed over, by clicking it or by pressing a key anywhere on the page: the matches in the file light up and the cursor moves to the first. Enter or Escape leaves the search for normal mode, where a small set of vim keys and colon commands work (`n`, `N`, `j`, `k`, `h`, `l`, `w`, `b`, `0`, `$`, `gg`, `G`, `*`, `:12`, `:set nonu`, `:noh`, `:q` back to the home page, and `:help` for the list). In a browser window at least 1080px wide and 640px tall the editor is a window of its own, at most 1240px by 940px, that can be dragged by its title bar, resized by its edges and corners down to 760px by 600px, and is put back in the middle at its first size and split by a double click on the title bar (the page's last inline script). Wherever the file and the quote sit side by side, the gap between them is a handle: dragging it moves the split, the file keeps at least 400px and the quote 320px, and a double click on it restores three parts to two. In that layout the file is set at a line height of 1.5 with blank numbered lines between its sections and `~` on the lines past its end, and where the window is too short for the file, the file scrolls in its pane and the line with the call link stays pinned at its foot. In a smaller window the page itself scrolls, without the blank lines, and the numbers count only the lines shown; under 1080px wide the quote goes under the file. The headline, "Better Every Month. Ready Any Day.", is block lettering in a `<footer class="ft">` at the foot of the quote pane, kept out of the page until someone presses a key or moves the hours slider; each keystroke, and each hour the slider moves, sets one more letter, and the last sets the two tone mark of the site icon. In the window layout its place is kept free, so nothing moves when it appears. Nothing is signed or paid on the page: the agreement is sent for signature through SignWell after the intro call, and the Stripe payment link is emailed after both parties sign. On paper (`@media print`, at the end of the style block) the same markup is the offer alone, in ink on white, on one sheet: a line saying whose it is, the motto, the file, the plans beside the terms, and the call line followed by the page's address. The editor's chrome, the slider and the price are left out. |
| `Makefile` | `make serve` runs a local server. `make projects` asks for the password and rebuilds the vault (`make projects CHANGE_PASSWORD=1` to set a new one). `make resume` exports the resume to PDF with LibreOffice (`soffice`) and copies it to `$(FORAGER)` (default `../forager/profile/resume.pdf`) when that folder exists. `make check` runs the browser checks (`make check ONLY=print` for the checks whose name contains a word), after `make check-setup` once to install their driver. |

Invariants:

- The `description` and `og:description` meta tags in `index.html` hold the
  same text. Edit both together.
- `og:image:width` and `og:image:height` must match `assets/scramble-og.jpg`
  (1200×1200). Renaming the file breaks `og:image` and the JSON-LD `image`.
- Each `a.ph` link's `href` must point at an existing file in `assets/`, and its
  `data-w`/`data-h` must match that file's dimensions.
- Every photo in `assets/` that a page shows has a `.jpg` and an `.avif` of the
  same name and the same size in pixels. To add or replace one, encode the twin
  with `magick photo.jpg -quality 45 -define heic:speed=2 -define
  heic:chroma=420 photo.avif`. The share images (`*-og.jpg`) stay JPEG only.
- `sitemap.xml` lists the home page and `consulting/` and nothing else, and
  `projects/index.html` keeps its `noindex`. `robots.txt` does not name
  `projects/`, which would advertise it.
- The `Consulting` link in `open --links` has the red glimmer of the call link
  on the consulting page: one `span` per letter and the `gl` keyframes, which
  are written in both files. Change the timing in both together.
- The email address is written in no file: the `Email` link in `open --links`,
  whose links are in alphabetical order, is hidden until the script shows it, and gets its `mailto:` when it is
  pointed at, focused or touched. Keep the address out of the HTML, the
  JSON-LD and this file, so harvesters do not find it.
- Keep the photo credit to Brendan King under the photo.
- The JSON-LD `sameAs` values duplicate the external profile links in the
  `open --links` section (`consulting/` is an internal page and is excluded from
  `sameAs`). Update external links together. Add `jobTitle` and `worksFor` back
  when there is a current role.
- Each gear marker's `data-i` must match the `data-gear` of its line in
  `gear.json`, and the marker's `left`/`top` percentages are positions on the
  photo. Re-cropping or replacing the photo means re-placing the markers.
- The site is edited both locally and through the GitHub web editor. Pull before
  editing locally.

## Subdirectories & System Boundaries

- `assets/`: photo files for `index.html`. No contract file.
- `projects/<slug>/`: the original photos for one project plus its `project.md`
  (`# Title`, `year:` and `summary:` lines, then `## Step` sections with short
  paragraphs, `![alt](file.jpg)` lines, and ``` fenced notes; consecutive image
  lines form one gallery). Git-ignored: only the encrypted `projects/vault/` is
  published, because the repo is public. Not backed up by git.
- `explorations/`: past design variants for the site, kept for reference.
  Browse them at `http://localhost:8000/explorations/` with `make serve`.
  Git-ignored.
- `resume/`: the one working copy of the resume, `Melvin Gruesbeck.docx`, and
  the PDF that `make resume` exports from it. Git-ignored. Edit the `.docx`
  directly or as tracked changes, keep its fonts and layout, then run
  `make resume`. Not backed up by git.
- `contracts/`: the place to keep signed client agreements. Git-ignored,
  because the repo is public. Not backed up by git. The agreement template is
  a Google Doc, "Consulting Services Agreement", in Melvin's Drive; its link
  stays out of the repo.
- `consulting/`: static consulting & booking page (`consulting/index.html`).
  Its only external endpoint is the Google Calendar Appointment Schedule URL
  in the `href` of the "free 30-minute call" link (`data-cal`). The page
  holds no payment links or keys, and collects nothing from a visitor beyond
  the page view counted by GoatCounter; keep it that way. Its copy uses no parentheses.
  Prices live in three places that must agree: the page (the quote pane's
  buttons, the `PLANS`, `OFF` and `RATE` constants in its script, and the
  terms at the end of `overview.md`), section 2 of the agreement, and the
  Stripe links and codes. Those terms summarize the agreement template, a
  Google Doc (plans, term discounts and notice, the discount billed back on
  early termination, hours, AI accounts, costs, specialists, payment). The
  Google Doc is the source of truth: after any change to it, update the terms
  on the page and replace the template in SignWell.

## Global Invariants

- The site must stay a plain static site that GitHub Pages can serve directly
  from the `master` branch with no build. The projects vault is built locally
  and committed, so the server still needs no build.
- Never commit anything from `contracts/` or `projects/<slug>/`; the repo is
  public. Rebuild the vault with `make projects` after editing a project, then
  commit `projects/vault/`.

## Global Side Effects

- The inline script in `index.html` only toggles classes on the page. It makes
  no network requests and stores nothing.
- `index.html` and `consulting/index.html` load GoatCounter's `count.v5.js`
  from `gc.zgo.at`, pinned by its `integrity` hash, which reports each page
  view and its referrer to `mgruesbeck.goatcounter.com`. It sets no cookie and
  does not count visits to a local server. `projects/index.html` does not load
  it. Opening `https://mgruesbeck.sh/#toggle-goatcounter` in a browser stops
  that browser's own visits from being counted.
- `projects/index.html` fetches files from `projects/vault/` and stores the
  derived key in `sessionStorage` under `projects-key`.
- `consulting/index.html` loads the Google Calendar Appointment Schedule iframe
  on demand when the visitor clicks "free 30-minute call". The search in its
  title bar runs in the page. It sends nothing else.
- Fonts are served from `assets/fonts/`. The visit counter is the one file a page asks
  another site for when it loads.
- A push to `master` publishes the site through GitHub Pages.

## Consulting Setup (`consulting/index.html`)

1. **Google Calendar Appointment Schedule:**
   - In Google Calendar, click **Create → Appointment schedule**, set a
     30-minute duration and your available windows, and save. This is the free
     intro call; no payment is attached to it.
   - Click **Share → Website embed → Inline booking page** and copy the
     `https://calendar.google.com/calendar/appointments/schedules/...?gv=true`
     URL into the `href` of the `data-cal` link. The short
     `calendar.app.google` link cannot be shown in the page's dialog.
2. **SignWell (nothing goes in the repo):**
   - Download the agreement Google Doc as a `.docx` (File, Download) and
     upload it as a template with two signers, Client and Consultant. Place a
     field on each blank: text fields for the Client Information table,
     assigned to the Client; dropdowns for Plan (Trial, Advisory, Fractional)
     and Term (None, Month to month, 3-month, 6-month); then a signature, name
     and title, email and date for the Client, and a signature and date for
     the Consultant.
   - After an intro call and a conflict check, send the template to the
     client from SignWell with the Plan and Term chosen. Nothing else is
     entered: the agreement lists each plan's fee on each term and its cap on
     hours, sets 30 days' notice, and takes the date of the last signature as
     its effective date.
   - Save each signed agreement in `contracts/`.
3. **Stripe Payment Links (kept in Stripe, never in the repo):**
   - In the Stripe Dashboard (`https://dashboard.stripe.com/payment-links`),
     create 3 Payment Links, each with **US Bank Account / ACH only** so
     Stripe's fee is capped at $5.00: **$2,000.00** one-time for the trial,
     and **$2,500.00** and **$9,000.00** per month for Advisory and
     Fractional.
   - Create two coupons with duration **Forever**: 5% off with the promotion
     code `TERM3`, and 10% off with the promotion code `TERM6`. On each of the
     two monthly links, turn on **Allow promotion codes**. For a 3-month or
     6-month term, add `?prefilled_promo_code=TERM3` (or `TERM6`) to the
     plan's link before emailing it.
   - Email the link to the client only after both parties have signed, from
     the `hello` address at the domain, the one that sent the agreement. The payer can edit the code at
     checkout, so check the first invoice against the signed agreement.

## System Verification

- Run `make check` (once, first: `make check-setup`, which needs Node 18 or
  later and downloads WebKit). It prints one line per check and `all passed`.
- To look at the site, run `make serve` and open `http://localhost:8000/`.
  Use `make serve PORT=3000` for another port.
- For consulting, open `http://localhost:8000/consulting/` and verify that
  "free 30-minute call" opens the calendar dialog with the schedule in it,
  that typing over the search in the title bar lights the matches, that
  Enter then `:help` lists the keys and `:q` returns to the home page, that
  the plan and term buttons and the hours slider change the price in the
  quote pane, that the motto appears at the foot of that pane one letter per
  keystroke or per hour moved while the status bar stays where it is, and
  that on a laptop the window drags by its title bar and nothing in it needs
  scrolling at 1470×840.
  With JavaScript off, the quote shows Advisory month to month, the motto is
  simply shown and the link opens the calendar in a new tab.
- For projects, run `make projects`, then open `http://localhost:8000/projects/`
  and unlock it with the same password.
