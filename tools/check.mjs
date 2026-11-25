// Browser checks for both pages: layout, copy rules, the editor's interactions,
// the home shell, accessibility and the files search engines read.
//
// usage: node tools/check.mjs   (or `make check`)
//
// The site is served from a throwaway local server, so `make serve` need not be
// running. Every request that leaves that server is blocked and counted: a page
// that contacts another site while it loads fails, the visit counter aside. Add a name to the command to
// run only the checks whose name contains it: node tools/check.mjs fits

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json",
  ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };
const DESK = [1470, 840], PHONE = [390, 844];

const server = createServer((req, res) => {
  let file = join(ROOT, normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) { res.writeHead(404).end("not found"); return; }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await webkit.launch();
const axe = readFileSync(join(ROOT, "tools/node_modules/axe-core/axe.min.js"), "utf8");
const only = process.argv[2] || "";
let failed = 0;

// a page at a size, with the requests it made to other sites and the errors it threw
const open = async (path, [width, height], opts = {}) => {
  const phone = width < 500;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: phone ? 2 : 1, ...(phone ? { hasTouch: true, isMobile: true } : {}), ...opts });
  const page = await ctx.newPage();
  page.away = []; page.errs = [];
  await page.route((u) => u.hostname !== "127.0.0.1", (r) => { page.away.push(r.request().url()); r.abort(); });
  page.on("pageerror", (e) => page.errs.push(e.message));
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return page;
};
const check = async (name, fn) => {
  if (!name.includes(only)) return;
  const said = [];
  try { await fn((ok, what) => { if (!ok) said.push(what); }); } catch (e) { said.push(String(e.message || e).split("\n")[0]); }
  if (said.length) failed++;
  console.log((said.length ? "FAIL  " : "ok    ") + name + said.map((s) => "\n        " + s).join(""));
};
const drag = async (page, x0, y0, x1, y1) => {
  await page.mouse.move(x0, y0); await page.mouse.down();
  await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await page.mouse.move(x1, y1, { steps: 4 });
  await page.mouse.up();
};
const box = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); }, sel);
const near = (a, b, by = 1) => a.every((v, i) => Math.abs(v - b[i]) <= by);
const text = (file) => readFileSync(join(ROOT, file), "utf8");

for (const path of ["/", "/consulting/", "/portfolio/"]) {
  await check(`${path} loads clean`, async (want) => {
    for (const size of [DESK, PHONE]) {
      const page = await open(path, size);
      want(!page.errs.length, `${size[0]}: script errors: ${page.errs.join("; ")}`);
      // the one file a page may ask another site for is the visit counter, pinned by its hash
      const away = page.away.filter((u) => u !== "https://gc.zgo.at/count.v5.js");
      want(!away.length, `${size[0]}: contacted another site on load: ${away.join(", ")}`);
      want(page.away.length > away.length && /count\.v5\.js" crossorigin="anonymous" integrity="sha384-/.test(text(path.slice(1) + "index.html")), `${size[0]}: the visit counter is missing or not pinned`);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      want(wide <= 0, `${size[0]}: the page scrolls sideways by ${wide}px`);
      await page.context().close();
    }
  });

  // axe-core's WCAG A and AA rules. The tildes under the file are vim's empty lines: decoration, hidden from screen readers
  await check(`${path} accessibility`, async (want) => {
    for (const size of [DESK, PHONE]) {
      const page = await open(path, size);
      await page.waitForTimeout(2200);
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
      await page.evaluate(axe);
      // the two rules about colour are off: the palettes are chosen ones, and a link in a sentence is told apart by colour alone
      const found = await page.evaluate(() => axe.run({ exclude: [[".vt"]] }, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"], rules: { "color-contrast": { enabled: false }, "link-in-text-block": { enabled: false } } })
        .then((r) => r.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0].target.join(" ")}`)));
      for (const f of found) want(false, `${size[0]}: ${f}`);
      await page.context().close();
    }
  });
}

await check("/consulting/ fits without scrolling inside a pane", async (want) => {
  for (const size of [DESK, [1728, 1117], [1280, 720], [1200, 600]]) {
    const page = await open("/consulting/", size);
    const over = await page.evaluate(() => ["file", ".pn .o", "quote", ".qp"].reduce((o, v, i, a) => (i % 2 ? o : { ...o, [v]: document.querySelector(a[i + 1]).scrollHeight - document.querySelector(a[i + 1]).clientHeight }), {}));
    want(over.file === 0 && over.quote === 0, `${size.join("×")}: file over by ${over.file}px, quote over by ${over.quote}px`);
    await page.context().close();
  }
});

await check("/consulting/ copy rules", async (want) => {
  const page = await open("/consulting/", DESK);
  const m = await page.evaluate(() => ({ links: document.querySelectorAll("main a").length, paren: /[()]/.test(document.querySelector("main").innerText),
    h1: document.querySelector("h1").textContent, cta: document.querySelector(".cta a").textContent }));
  want(m.links === 1, `the page has ${m.links} links; the calendar link is the only one`);
  want(!m.paren, "the copy has parentheses");
  want(m.h1 === "Better Every Month. Ready Any Day.", `headline is "${m.h1}"`);
  want(m.cta === "free 30-minute call", `the link reads "${m.cta}"`);
  await page.context().close();
});

// four sizes of type: 32 (22 on phones), 13.5, 12 and 11
await check("/consulting/ type sizes", async (want) => {
  for (const [size, allowed] of [[DESK, [32, 13.5, 12, 11]], [PHONE, [22, 13.5, 12, 11]]]) {
    const page = await open("/consulting/", size);
    const used = await page.evaluate(() => [...new Set([...document.querySelectorAll("body *")]
      .filter((el) => el.getClientRects().length && !el.closest("svg, script, style, dialog") && [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim()))
      .map((el) => parseFloat(getComputedStyle(el).fontSize)))]);
    const odd = used.filter((s) => !allowed.includes(s));
    want(!odd.length, `${size[0]}: type at ${odd.join(", ")}px`);
    await page.context().close();
  }
});

await check("/consulting/ the call link opens the calendar", async (want) => {
  for (const size of [DESK, PHONE]) {
    const page = await open("/consulting/", size);
    await page.click(".cta a"); await page.waitForTimeout(250);
    want(await page.evaluate(() => !!document.querySelector("#cal-dialog[open]")), `${size[0]}: no dialog after a click`);
    want(!page.errs.length, `${size[0]}: ${page.errs.join("; ")}`);
    await page.context().close();
  }
});

await check("/consulting/ quote arithmetic", async (want) => {
  const page = await open("/consulting/", DESK);
  const price = () => page.evaluate(() => document.querySelector(".pt b").textContent);
  const press = (group, i) => page.evaluate(([g, n]) => document.querySelectorAll(g + " button")[n].click(), [group, i]);
  want(await price() === "$2,500", `Advisory starts at ${await price()}`);
  await press(".tt", 2); want(await price() === "$2,250", `Advisory on a 6-month term is ${await price()}`);
  await press(".pp", 2); want(await price() === "$8,100", `Fractional on a 6-month term is ${await price()}`);
  await press(".tt", 1); want(await price() === "$8,550", `Fractional on a 3-month term is ${await price()}`);
  await press(".pp", 0); want(await price() === "$2,000", `the Trial is ${await price()}`);
  await page.context().close();
});

await check("/consulting/ hours and keys", async (want) => {
  const page = await open("/consulting/", DESK);
  const lit = () => page.evaluate(() => document.querySelectorAll(".ft svg .k.on").length);
  const before = await lit();
  await page.focus(".qp .hs input"); for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  want(await lit() > before, "moving the hours sets no letters of the motto");
  await page.evaluate(() => document.activeElement.blur());
  // a key pressed anywhere on the page is typed into the field in the title bar, and sets a letter too
  const field = () => page.evaluate(() => document.querySelector(".e-top .vc .q").textContent), lit0 = await lit();
  await page.keyboard.press("x"); await page.waitForTimeout(80);
  want((await field()).endsWith("x"), `a key typed on the page leaves "${await field()}" in the field`);
  want(await lit() > lit0, "typing sets no letters of the motto");
  want(!page.errs.length, page.errs.join("; "));
  await page.context().close();
});

await check("/consulting/ window: move, resize, split, restore", async (want) => {
  const page = await open("/consulting/", DESK);
  const cut = () => page.evaluate(() => { const q = document.querySelector(".qp"); return [q.scrollWidth - q.clientWidth, q.scrollHeight - q.clientHeight]; });
  const home = await box(page, ".tm"), pane = await box(page, ".pn"), rest = await cut();
  await drag(page, home[0] + 150, home[1] + 18, home[0] + 110, home[1] + 68);
  want(near(await box(page, ".tm"), [home[0] - 40, home[1] + 50, home[2], home[3]], 2), "a drag on the title bar does not move the window");
  // the free stretch of the title bar is to the right of its field
  const bar = async () => { const t = await box(page, ".tm"); return [t[0] + t[2] - 95, t[1] + 18]; };
  await page.mouse.dblclick(...await bar());
  want(near(await box(page, ".tm"), home), "a double click on the title bar does not put the window back");

  let sx = await box(page, ".e-sx");
  await drag(page, sx[0] + 4, sx[1] + sx[3] / 2, sx[0] - 116, sx[1] + sx[3] / 2);
  want((await box(page, ".pn"))[2] < pane[2] - 100, "a drag on the gap does not move the split");
  sx = await box(page, ".e-sx"); await page.mouse.dblclick(sx[0] + 4, sx[1] + sx[3] / 2);
  want(near(await box(page, ".pn"), pane), "a double click on the gap does not reset the split");

  await drag(page, home[0] + home[2] - 3, home[1] + home[3] - 3, 0, 0);
  const least = await box(page, ".tm");
  want(least[2] === 760 && least[3] === 600, `the least size is ${least[2]}×${least[3]}, not 760×600`);
  const small = await cut();
  want(small[0] <= rest[0] && small[1] <= 0, `the quote is cut off at the least size: ${small[0] - rest[0]}px sideways, ${small[1]}px down`);
  await page.mouse.dblclick(...await bar());
  want(near(await box(page, ".tm"), home), "the window does not come back from its least size");
  want(!page.errs.length, page.errs.join("; "));
  await page.context().close();
});

await check("/ shell and photo viewer", async (want) => {
  const page = await open("/", DESK);
  await page.click(".cu .q"); await page.keyboard.type("pwd"); await page.keyboard.press("Enter"); await page.waitForTimeout(150);
  want((await page.evaluate(() => document.querySelector(".sb").innerText)).includes("/Users/mgruesbeck"), "pwd prints nothing at the prompt");
  await page.click("a.ph"); await page.waitForTimeout(300);
  want(await page.evaluate(() => !!document.querySelector("dialog.viewer[open]")), "a photo link opens no viewer");
  want(!page.errs.length, page.errs.join("; "));
  await page.context().close();
});

// the email address is in no file a harvester reads, and is on the link once the link is pointed at
await check("/ email link", async (want) => {
  const to = ["hello", "mgruesbeck.sh"].join("@"), page = await open("/", DESK);
  want(!text("index.html").includes(to) && !/mailto:\w/.test(text("index.html")), "the address is written in index.html");
  want(!(await page.content()).includes(to), "the address is in the page before the link is touched");
  await page.hover("a.em");
  want(await page.evaluate(() => document.querySelector("a.em").href) === "mailto:" + to, "pointing at the link does not set its address");
  await page.context().close();
});

// a photo is sent as AVIF, and the viewer's copy has every pixel the JPEG has: 1800 across fills a 27-inch screen
await check("/ photos", async (want) => {
  const page = await open("/", [2560, 1440]);
  const hero = await page.evaluate(() => { const i = document.querySelector(".gearfig img"); return [i.currentSrc, i.naturalWidth, Math.round(i.getBoundingClientRect().width)]; });
  want(hero[0].endsWith(".avif") && hero[1] >= hero[2], `the first photo is ${hero[0]}, ${hero[1]}px for ${hero[2]}px of page`);
  const links = await page.evaluate(() => [...document.querySelectorAll("a.ph")].map((a) => [a.getAttribute("href"), +a.dataset.w]));
  await page.click("a.ph");
  for (const [href, w] of links) {
    await page.waitForFunction(() => { const i = document.querySelector(".viewer img"); return i.complete && i.naturalWidth > 0; });
    const got = await page.evaluate(() => { const i = document.querySelector(".viewer img"); return [i.currentSrc, i.naturalWidth]; });
    want(got[0].endsWith(href.replace(".jpg", ".avif")) && got[1] === w, `${href} opens as ${got[0]} at ${got[1]}px, not ${w}px of AVIF`);
    want(existsSync(join(ROOT, href)), `${href}, the JPEG for older browsers, is missing`);
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(150);
  }
  await page.context().close();
});

await check("print layout", async (want) => {
  const page = await open("/consulting/", [695, 935]);
  await page.emulateMedia({ media: "print" });
  const m = await page.evaluate(() => { const see = (s) => [...document.querySelectorAll(s)].some((e) => e.getClientRects().length);
    return { chrome: see(".e-top, .tb, .vs, .vt, .e-rz, .e-sx, .hs, .m60"), plans: [...document.querySelectorAll(".pp button")].filter((e) => e.getClientRects().length).length, url: getComputedStyle(document.querySelector(".cta"), "::after").content.includes("mgruesbeck.sh/consulting"),
      bg: getComputedStyle(document.body).backgroundColor, wide: document.documentElement.scrollWidth - innerWidth, tall: Math.ceil(document.querySelector(".cta").getBoundingClientRect().bottom + scrollY) }; });
  want(!m.chrome, "the editor's chrome is printed");
  want(m.plans >= 3, "the three plans are not listed in print");
  want(m.url, "the printed page does not say where to book the call");
  want(/255, 255, 255|0, 0, 0, 0/.test(m.bg), `the printed page has a ${m.bg} background`);
  want(m.wide <= 0, `the printed page is ${m.wide}px too wide`);
  // a Letter page inside 16mm margins is 695 by 935 CSS pixels, and A4 is taller
  want(m.tall <= 935, `the printed page is ${m.tall}px tall, more than one sheet of Letter`);
  await page.context().close();
});

await check("search engines", async (want) => {
  const map = existsSync(join(ROOT, "sitemap.xml")) ? text("sitemap.xml") : "";
  want(!/name="robots"[^>]*noindex/.test(text("consulting/index.html")), "the consulting page is marked noindex");
  want(!/name="robots"[^>]*noindex/.test(text("index.html")), "the home page is marked noindex");
  want(/name="robots"[^>]*noindex/.test(text("projects/index.html")), "the projects page must stay noindex");
  want(map.includes("<loc>https://mgruesbeck.sh/</loc>") && map.includes("<loc>https://mgruesbeck.sh/consulting/</loc>"), "sitemap.xml does not list both pages");
  want(!/projects/.test(map + (existsSync(join(ROOT, "robots.txt")) ? text("robots.txt") : "")), "sitemap.xml or robots.txt names the projects page");
  want(existsSync(join(ROOT, "robots.txt")) && text("robots.txt").includes("Sitemap: https://mgruesbeck.sh/sitemap.xml"), "robots.txt does not point to the sitemap");
});

await browser.close(); server.close();
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
