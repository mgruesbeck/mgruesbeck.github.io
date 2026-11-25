// The Content-Security-Policy of each page, written into the page as a <meta http-equiv> tag (GitHub Pages can't send
// headers). It names the only places a page may load from, and lets an inline <script> run only if its exact text
// matches a hash listed in the policy. So after any edit to an inline script, the hashes must be written again:
//
//   node tools/csp.mjs        (or `make csp`)   rewrites the tag in every page
//   node tools/csp.mjs check                    exits 1 if any page's tag is out of date (make check runs this too)
//
// Inline style attributes are allowed ('unsafe-inline' for styles): the pages use them for small per-element values.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// the visit counter: its script, and where it reports a page view (by beacon, or by image where there is no beacon)
const COUNTER = { script: "https://gc.zgo.at", report: "https://mgruesbeck.goatcounter.com" };

export const PAGES = {
  "index.html": {},
  "portfolio/index.html": {},
  // the booking calendar opens in a frame when the call link is clicked
  "consulting/index.html": { frame: "https://calendar.google.com" },
};

// the sha256 of each inline script that runs (a JSON-LD block is data, not script, and needs none)
const hashes = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(([, attrs]) => !/type="application\/ld\+json"/.test(attrs))
  .map(([, , body]) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);

export const policy = (file, html) => {
  const page = PAGES[file];
  return [
    "default-src 'self'",
    `script-src 'self' ${COUNTER.script} ${hashes(html).join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${COUNTER.report}`,
    `connect-src 'self' ${COUNTER.report}`,
    "font-src 'self'",
    "worker-src 'self'",
    `frame-src ${page.frame || "'none'"}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
};

const TAG = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
export const tag = (file, html) => `<meta http-equiv="Content-Security-Policy" content="${policy(file, html)}">`;

// the tag sits right after <meta charset>, so it is in force before anything else in the page loads
const write = (file) => {
  const path = join(ROOT, file), html = readFileSync(path, "utf8");
  const next = TAG.test(html) ? html.replace(TAG, tag(file, html)) : html.replace(/(<meta charset="UTF-8">)/, `$1\n  ${tag(file, html)}`);
  if (next !== html) writeFileSync(path, next);
  return next !== html;
};

// is the page's tag the one its current scripts need?
export const stale = (file) => {
  const html = readFileSync(join(ROOT, file), "utf8"), found = html.match(TAG);
  return !found || found[0] !== tag(file, html);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "check") {
    const old = Object.keys(PAGES).filter(stale);
    for (const f of old) console.error(`${f}: the Content-Security-Policy is out of date. Run make csp.`);
    process.exit(old.length ? 1 : 0);
  }
  for (const f of Object.keys(PAGES)) console.log(`${write(f) ? "updated" : "up to date"}  ${f}`);
}
