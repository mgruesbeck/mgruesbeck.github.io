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
| `index.html` | The whole site, self-contained. SEO, canonical, Open Graph (`og:type` `profile`), and `twitter:card` meta tags; a JSON-LD `Person` block; all CSS inline in one `<style>`; one inline `<script>` that links the photo markers (`.hs[data-i]`) to the gear lines (`[data-gear]`) and opens the hobby photos (`a.ph`) in the `<dialog class="viewer">`. Each `ls experience/` row is a native `<details>` (`li.x`) whose `.xd` panel holds the resume detail for that role, drawn as a `tree`-style list, so it expands without JavaScript. The `expand all` button in the hint below (`.hint .all`) opens or closes every row. Loads Martian Mono and IBM Plex Mono from Google Fonts and the photos from `assets/`. |
| `assets/scramble-900.jpg`, `assets/scramble-1800.jpg` | The ski-mountaineering photo at two widths, used through `srcset`. Photo by Brendan King (https://kingb12.github.io/), credited under the photo. |
| `assets/ski-air.jpg`, `assets/mountain-1800.jpg`, `assets/climb-1800.jpg`, `assets/moto-1800.jpg`, `assets/tools-1800.jpg` | Hobby photos linked from the last line of `about.md`. Each `a.ph` link's `href` points at its file; the script loads that `href` into the viewer and reads `data-name` (the title), `data-alt`, `data-cap`, and `data-w`/`data-h` (the file's pixel size, so the viewer takes the photo's own shape without cropping). Without JavaScript the link opens the file directly. |
| `assets/scramble-og.jpg` | 1200×1200 square crop of the same photo for link previews. Referenced by `og:image` and the JSON-LD `image`. |
| `favicon.svg` | Site icon: two dark peaks forming an "M", with an orange pin on the higher summit, matching the page's gear markers. |
| `favicon.ico`, `apple-touch-icon.png` | The same icon as a 16/32/48 px ICO for older browsers, and as a 180 px home-screen icon. |
| `projects/index.html` | Password-gated project pages (`noindex`). Asks for the password in a `[sudo]` prompt, derives the key with PBKDF2 using `vault/meta.json`, then decrypts `vault/index.bin` (every project's text and photo list) and each photo as it scrolls into view. `#<slug>` opens one project. Keeps the derived key in `sessionStorage` until the tab closes or `logout`. |
| `projects/vault/` | Output of `make projects`: `meta.json` (salt and iteration count, not secret), `index.bin`, and one `<id>.bin` per photo. Each `.bin` is a 12-byte IV followed by AES-256-GCM ciphertext. Never edit by hand. |
| `tools/build-projects.mjs` | Builds `projects/vault/` from `projects/<slug>/project.md` and the photos it names. Resizes photos to 1600 px (2400 px for `.png` screenshots) and strips their metadata. IVs and file names are HMACs of the content, so unchanged projects rebuild byte-for-byte. Refuses a password that can't open the existing vault unless `CHANGE_PASSWORD=1`. |
| `consulting/index.html` | Consulting & booking page (`noindex`), linked from `open --links` in `index.html`. Offers a free 30-minute intro call (Google Calendar Appointment Schedule), a one-time Trial (10h in 30 days, $2,000), and four monthly plans (Advisory 10h/$2,500, Embedded 20h/$4,800, Fractional 40h/$9,000, Half Time 80h/$16,000) with 5% off for a 6-month term and 10% off for a 12-month term. One inline live-interpolated Consulting Agreement covers the trial and every plan; its e-signature form posts to `tools/consulting-contract-gas.js`. |
| `tools/consulting-contract-gas.js` | Google Apps Script backend for `/consulting/`. Receives the client's signed agreement (`doPost`), creates a Google Doc in a `Consulting Contracts` Google Drive folder, and emails the owner a 1-click countersign link (`doGet`). Clicking the link appends the consultant's countersignature, exports a locked PDF to Drive, and emails both parties the executed PDF + the Stripe ACH payment link that the page sent for the chosen plan and term. |
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
- `consulting/`: static consulting & booking page (`consulting/index.html`).
  All external endpoints (Google Calendar Appointment Schedule URL, Stripe
  Payment Links, and Google Apps Script Web App URL) are configured in the
  top `CONFIG` object of `consulting/index.html`. Any action whose URL still
  holds a `REPLACE_` placeholder shows as "(not connected yet)" and does
  nothing, so the page is safe to load before setup but must not be published
  until every link is real.
  Prices live in three places that must agree: the `ls engagements/` rows, the
  `TIERS` and `TERMS` objects in the script, and the Stripe links and codes.
  The AI spend cap (10% of the monthly fee) and the specialist terms live in
  two places that must agree: `cat terms.md` and section 4 of the agreement.

## Global Invariants

- The site must stay a plain static site that GitHub Pages can serve directly
  from the `master` branch with no build. The projects vault is built locally
  and committed, so the server still needs no build.
- Never commit anything from `projects/<slug>/`; the repo is public. Rebuild
  the vault with `make projects` after editing a project, then commit
  `projects/vault/`.

## Global Side Effects

- The inline script in `index.html` only toggles classes on the page. It makes
  no network requests and stores nothing. The `<!-- analytics -->` placeholder
  is empty.
- `projects/index.html` fetches files from `projects/vault/` and stores the
  derived key in `sessionStorage` under `projects-key`.
- `consulting/index.html` loads the Google Calendar Appointment Schedule iframe
  on demand when the visitor clicks "Browse open slots" and `POST`s signed
  agreements to the Google Apps Script endpoint in
  `CONFIG.contractWebhookUrl`.
- When the page loads, the browser requests Martian Mono and IBM Plex Mono
  from Google Fonts (`fonts.googleapis.com` and `fonts.gstatic.com`).
- A push to `master` publishes the site through GitHub Pages.

## Consulting Setup (`consulting/index.html`)

Update the `CONFIG` block at the top of the inline `<script>` in
`consulting/index.html`:

1. **Google Calendar Appointment Schedule (`CONFIG.calendarBookingUrl`):**
   - In Google Calendar, click **Create → Appointment schedule**, set a
     30-minute duration and your available windows, and save. This is the free
     intro call; no payment is attached to it.
   - Click **Share → Website embed → Inline booking page** and copy the
     `https://calendar.google.com/calendar/appointments/schedules/...?gv=true`
     URL into `CONFIG.calendarBookingUrl`.
2. **Stripe Payment Links (`CONFIG.stripeLinks`, `CONFIG.termPromoCodes`):**
   - In the Stripe Dashboard (`https://dashboard.stripe.com/payment-links`),
     create 5 Payment Links, each with **US Bank Account / ACH only** so
     Stripe's fee is capped at $5.00:
     - `trial`: **$2,000.00** one-time.
     - `advisory`: **$2,500.00/month**.
     - `embedded`: **$4,800.00/month**.
     - `fractional`: **$9,000.00/month**.
     - `half`: **$16,000.00/month**.
   - Create two coupons with duration **Forever**: 5% off with the promotion
     code `TERM6`, and 10% off with the promotion code `TERM12`. On each of the
     four monthly links, turn on **Allow promotion codes**. For a 6-month or
     12-month term the page adds `?prefilled_promo_code=` to the plan's link.
   - The payer can edit the code at checkout, so check the first invoice
     against the signed agreement.
3. **Google Apps Script Contract Workflow (`CONFIG.contractWebhookUrl`):**
   - Open `https://script.google.com`, create a new project, and paste the
     contents of `tools/consulting-contract-gas.js` into `Code.gs`.
   - Click **Deploy → New deployment → Web app**, set **Execute as: Me** and
     **Who has access: Anyone**, authorize Drive/Docs/Gmail, and copy the Web
     App URL (`https://script.google.com/macros/s/.../exec`) into
     `CONFIG.contractWebhookUrl`.

## System Verification

- No test suite exists. To check the site, run `make serve` and open
  `http://localhost:8000/`. Use `make serve PORT=3000` for another port.
- For consulting, open `http://localhost:8000/consulting/` and verify plan and
  term switching, live contract interpolation, calendar modal, and print/PDF
  view.
- For projects, run `make projects`, then open `http://localhost:8000/projects/`
  and unlock it with the same password.
