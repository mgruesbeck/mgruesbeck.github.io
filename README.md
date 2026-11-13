# mgruesbeck.github.io Blueprint

## System Overview

A single-page static personal résumé site for Melvin Gruesbeck, served by
GitHub Pages at `https://mgruesbeck.sh/` (the `og:url` in
`index.html`; the old `https://mgruesbeck.github.io/` address redirects there). There is no build step, package manifest, or server code:
GitHub Pages serves the files as-is.

The page is styled as a light "One Light" terminal transcript (`whoami`,
`cat about.md`, `open scramble.jpg`, `cat gear.json`, `ls experience/`, …)
with an annotated ski-mountaineering photo whose gear markers link to the
`gear.json` lines on hover, focus, or tap.

## Local Interface & Invariants

| File | Role |
| --- | --- |
| `index.html` | The whole site, self-contained. SEO, canonical, Open Graph (`og:type` `profile`), and `twitter:card` meta tags; a JSON-LD `Person` block; all CSS inline in one `<style>`; one inline `<script>` that links the photo markers (`.hs[data-i]`) to the gear lines (`[data-gear]`) and opens the hobby photos (`a.ph`) in the `<dialog class="viewer">`. Each `ls experience/` row is a native `<details>` (`li.x`) whose `.xd` panel holds the resume detail for that role, drawn as a `tree`-style list, so it expands without JavaScript. The `expand all` button in the hint below (`.hint .all`) opens or closes every row. Under `<main>`, a `<footer class="ft">` holds the motto "Make It Work. Make It Clear." as block lettering with a red shadow: one inline SVG with a `<g class="k">` for each letter and full stop and a last one for the two tone mark of the site icon, plus the same words in a visually hidden `<p>`. The script hides the letters and sets them one at a time the first time the footer is scrolled into view, or all at once under reduced motion; without JavaScript the motto is simply shown. Loads Martian Mono and IBM Plex Mono from Google Fonts and the photos from `assets/`. |
| `assets/scramble-600.jpg`, `assets/scramble-900.jpg`, `assets/scramble-1200.jpg`, `assets/scramble-1800.jpg` | The ski-mountaineering photo at four widths, used through `srcset`; the photo is drawn at most 560 px wide, so the `sizes` hint in `index.html` must follow any change to that width. The 600 and 1200 px files are resized from the 1800 px one. Photo by Brendan King (https://kingb12.github.io/), credited under the photo. |
| `assets/ski-air.jpg`, `assets/mountain-1800.jpg`, `assets/climb-1800.jpg`, `assets/moto-1800.jpg`, `assets/tools-1800.jpg` | Hobby photos linked from the last line of `about.md`. Each `a.ph` link's `href` points at its file; the script loads that `href` into the viewer and reads `data-name` (the title), `data-alt`, `data-cap`, and `data-w`/`data-h` (the file's pixel size, so the viewer takes the photo's own shape without cropping). Without JavaScript the link opens the file directly. |
| `assets/fonts/` | Martian Mono, the one typeface, served from this site: `martian-mono-latin.woff2` (one variable file, declared at weight 400 and width 87.5%, and at weight 600 and width 100%) and `martian-mono-latin-ext.woff2` (used by `projects/index.html` only, for accented letters outside Latin-1). The `@font-face` rules sit at the top of each page's `<style>`, and each page preloads the Latin file. `OFL.txt` is the font's licence and stays with the files. |
| `assets/scramble-og.jpg` | 1200×1200 square crop of the same photo for link previews. Referenced by `og:image` and the JSON-LD `image`. |
| `assets/consulting-og.jpg` | 1200×630 share card for the consulting page: the motto, "Start with a 30-day trial.", and the mark beside the mountain photo. Referenced by `og:image` in `consulting/index.html`, whose `og:image:width` and `og:image:height` must match it. |
| `CNAME` | The custom domain, `mgruesbeck.sh`, read by GitHub Pages. The domain is registered at Porkbun, where four `A` records point the apex at GitHub Pages and a `CNAME` record points `www` at `mgruesbeck.github.io`. The `canonical`, `og:url` and `og:image` addresses in both pages use this domain. |
| `favicon.svg` | Site icon, drawn in blocks: a near peak in paper white, a far peak in grey, and a red block above the summit, on a dark tile. Eight blocks across, so each block is two pixels at 16 px. The same drawing, in ink on the page colour, closes the motto in both footers. |
| `favicon.ico`, `apple-touch-icon.png` | The same icon as a 16/32/48 px ICO for older browsers, and as a 180 px home-screen icon. |
| `projects/index.html` | Password-gated project pages (`noindex`). Asks for the password in a `[sudo]` prompt, derives the key with PBKDF2 using `vault/meta.json`, then decrypts `vault/index.bin` (every project's text and photo list) and each photo as it scrolls into view. `#<slug>` opens one project. Keeps the derived key in `sessionStorage` until the tab closes or `logout`. |
| `projects/vault/` | Output of `make projects`: `meta.json` (salt and iteration count, not secret), `index.bin`, and one `<id>.bin` per photo. Each `.bin` is a 12-byte IV followed by AES-256-GCM ciphertext. Never edit by hand. |
| `tools/build-projects.mjs` | Builds `projects/vault/` from `projects/<slug>/project.md` and the photos it names. Resizes photos to 1600 px (2400 px for `.png` screenshots) and strips their metadata. IVs and file names are HMACs of the content, so unchanged projects rebuild byte-for-byte. Refuses a password that can't open the existing vault unless `CHANGE_PASSWORD=1`. |
| `consulting/index.html` | Consulting & booking page (`noindex`), linked from `open --links` in `index.html`. Drawn as a vim window split over three files: `overview.md` (the pitch: operations, communications and design run as one effort, year round, so the company is ready whenever a raise, partner or acquirer comes), `engagements.md` (a one-time Trial, 10h in 30 days, $2,000, and two monthly plans, Advisory 10h/$2,500 and Fractional 40h/$9,000) and `terms.md` (a summary of the Consulting Services Agreement: one agreement, month to month, 5% off for a 3-month term and 10% off for a 6-month term, extra hours $250 each). The call to action is the "free 30-minute call" link, which opens the Google Calendar Appointment Schedule in a dialog. It is the only link in the three files, so nothing draws a click away from it. The command line under the window holds a search for that link and can be typed over, by clicking it or by pressing a key anywhere on the page: the matches in the three files light up and the cursor moves to the first. Enter or Escape leaves the search for normal mode, where a small set of vim keys and colon commands work (`n`, `N`, `j`, `k`, `h`, `l`, `w`, `b`, `0`, `$`, `gg`, `G`, `*`, `:e`, `:12`, `:set nonu`, `:noh`, `:q` back to the home page, and `:help` for the list). In a window at least 1080px wide and 640px tall the editor has a fixed height, each file scrolls in its own pane, and the line with the call link stays pinned at the foot of `overview.md`. The headline, "Better Every Month. Ready Any Day.", is block lettering in the footer, kept out of the page until someone presses a key; each keystroke sets one more letter, and the last sets the two tone mark of the site icon. The editor stops short of the foot of the window, by the tops of the first line of the lettering, so those show under it without anything moving and the rest is a scroll away. Nothing is signed or paid on the page: the agreement is sent for signature through SignWell after the intro call, and the Stripe payment link is emailed after both parties sign. |
| `Makefile` | `make serve` runs a local server. `make projects` asks for the password and rebuilds the vault (`make projects CHANGE_PASSWORD=1` to set a new one). `make resume` exports the resume to PDF with LibreOffice (`soffice`) and copies it to `$(FORAGER)` (default `../forager/profile/resume.pdf`) when that folder exists. |

Invariants:

- The `description` and `og:description` meta tags in `index.html` hold the
  same text. Edit both together.
- `og:image:width` and `og:image:height` must match `assets/scramble-og.jpg`
  (1200×1200). Renaming the file breaks `og:image` and the JSON-LD `image`.
- Each `a.ph` link's `href` must point at an existing file in `assets/`, and its
  `data-w`/`data-h` must match that file's dimensions.
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
  collects no visitor data and holds no payment links or keys; keep it that
  way. Its copy uses no parentheses.
  Prices live in two places that must agree: the `ls engagements/` rows with
  `cat terms.md`, and the Stripe links and codes.
  `terms.md` summarizes the agreement template, a Google Doc (plans, term
  discounts and notice, the discount billed back on early termination, hours,
  AI accounts, costs, specialists, payment). The Google Doc is the source of
  truth: after any change to it, update `terms.md` and replace the template
  in SignWell.

## Global Invariants

- The site must stay a plain static site that GitHub Pages can serve directly
  from the `master` branch with no build. The projects vault is built locally
  and committed, so the server still needs no build.
- Never commit anything from `contracts/` or `projects/<slug>/`; the repo is
  public. Rebuild the vault with `make projects` after editing a project, then
  commit `projects/vault/`.

## Global Side Effects

- The inline script in `index.html` only toggles classes on the page. It makes
  no network requests and stores nothing. The `<!-- analytics -->` placeholder
  is empty.
- `projects/index.html` fetches files from `projects/vault/` and stores the
  derived key in `sessionStorage` under `projects-key`.
- `consulting/index.html` loads the Google Calendar Appointment Schedule iframe
  on demand when the visitor clicks "free 30-minute call". The search in its
  command line runs in the page. It sends nothing else.
- Fonts are served from `assets/fonts/`. No page contacts another site when it
  loads.
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
     field on each blank: text fields for the Client Information and Plan
     Details tables, then a signature, name and title, email and date for the
     Client, and a signature and date for the Consultant.
   - After an intro call and a conflict check, send the template to the
     client from SignWell with the plan, fee, term and notice period filled
     in. The fee is the plan's price less the term discount (5% for a 3-month
     term, 10% for a 6-month term); the notice period is 30 days for a monthly
     plan on any term, and none for a trial.
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
     the address that sent the agreement. The payer can edit the code at
     checkout, so check the first invoice against the signed agreement.

## System Verification

- No test suite exists. To check the site, run `make serve` and open
  `http://localhost:8000/`. Use `make serve PORT=3000` for another port.
- For consulting, open `http://localhost:8000/consulting/` and verify that
  "free 30-minute call" opens the calendar dialog with the schedule in it,
  that typing over the search in the command line lights the matches, that
  Enter then `:help` lists the keys and `:q` returns to the home page, and
  that the footer lettering appears one letter per keystroke while the status
  line stays where it is. With JavaScript
  off, the footer is simply shown and the link opens the calendar in a new
  tab.
- For projects, run `make projects`, then open `http://localhost:8000/projects/`
  and unlock it with the same password.
