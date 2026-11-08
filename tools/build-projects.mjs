// Encrypt projects/<slug>/project.md and its images into projects/vault/.
//
// usage: PROJECTS_PASSWORD=... node tools/build-projects.mjs   (or `make projects`)
//
// The originals in projects/<slug>/ are gitignored; only the vault is published.
// Every vault file is iv(12) || AES-256-GCM ciphertext. The key comes from
// PBKDF2-SHA256 over the password with the salt in vault/meta.json. IVs and
// file names are HMACs of the content, so unchanged files rebuild identically.
// Set CHANGE_PASSWORD=1 to replace the password; otherwise a password that
// can't open the existing vault is treated as a typo and the build stops.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { join } from "node:path";

const { subtle } = crypto;
const ROOT = "projects", VAULT = join(ROOT, "vault"), ITER = 600000;
const b64 = (u8) => Buffer.from(u8).toString("base64");

const password = process.env.PROJECTS_PASSWORD;
if (!password) { console.error("Set PROJECTS_PASSWORD (or run `make projects`)."); process.exit(1); }

mkdirSync(VAULT, { recursive: true });
const metaPath = join(VAULT, "meta.json");
const meta = existsSync(metaPath) && !process.env.CHANGE_PASSWORD
  ? JSON.parse(readFileSync(metaPath, "utf8"))
  : { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(crypto.getRandomValues(new Uint8Array(16))) };

const base = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = new Uint8Array(await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: Buffer.from(meta.salt, "base64"), iterations: meta.iter }, base, 512));
const aes = await subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt", "decrypt"]);
const mac = await subtle.importKey("raw", bits.slice(32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

// a typo would silently re-encrypt everything under the wrong password
const indexPath = join(VAULT, "index.bin");
if (existsSync(indexPath) && !process.env.CHANGE_PASSWORD) {
  const buf = readFileSync(indexPath);
  try { await subtle.decrypt({ name: "AES-GCM", iv: buf.subarray(0, 12) }, aes, buf.subarray(12)); }
  catch { console.error("That password doesn't open the existing vault. Use CHANGE_PASSWORD=1 to replace it."); process.exit(1); }
}

const written = new Set();
async function seal(bytes, name) {
  const h = new Uint8Array(await subtle.sign("HMAC", mac, bytes));
  const iv = h.slice(0, 12), id = name || Buffer.from(h.slice(12, 20)).toString("hex");
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, aes, bytes));
  const file = join(VAULT, id + ".bin");
  writeFileSync(file, Buffer.concat([iv, ct]));
  written.add(id + ".bin");
  return id;
}

function prepImage(src) {
  // UI screenshots keep more pixels so small text stays legible
  const ui = src.toLowerCase().endsWith(".png");
  const out = execFileSync("magick", [src, "-auto-orient", "-resize", ui ? "2400x2400>" : "1600x1600>", "-strip",
    "-sampling-factor", "4:2:0", "-interlace", "JPEG", "-quality", ui ? "90" : "82", "jpg:-"], { maxBuffer: 1 << 28 });
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", "jpg:-"], { input: out }).toString().split(" ").map(Number);
  return { bytes: new Uint8Array(out), w, h };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inline = (s) => esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

async function build(slug) {
  const dir = join(ROOT, slug), lines = readFileSync(join(dir, "project.md"), "utf8").split("\n");
  const p = { slug, title: slug, year: "", summary: "", blocks: [] };
  let para = [], fence = null, gallery = null;
  const flush = () => { if (para.length) p.blocks.push({ t: "p", html: inline(para.join(" ")) }); para = []; };
  for (const line of lines) {
    if (fence) { if (line.startsWith("```")) { p.blocks.push({ t: "pre", text: fence.join("\n") }); fence = null; } else fence.push(line); continue; }
    if (line.startsWith("```")) { flush(); gallery = null; fence = []; continue; }
    const img = line.match(/^!\[([^\]]*)\]\((.+)\)\s*$/);
    if (img) {
      flush();
      const { bytes, w, h } = prepImage(join(dir, img[2]));
      const item = { id: await seal(bytes), w, h, alt: img[1] };
      if (!gallery) p.blocks.push(gallery = { t: "img", items: [] });
      gallery.items.push(item);
      continue;
    }
    if (line.trim() === "") { flush(); continue; }
    gallery = null;
    const kv = line.match(/^(year|summary):\s*(.*)$/);
    if (kv && !p.blocks.length && !para.length) { p[kv[1]] = kv[2]; continue; }
    if (line.startsWith("# ")) { p.title = line.slice(2).trim(); continue; }
    if (line.startsWith("## ")) { flush(); p.blocks.push({ t: "h", text: line.slice(3).trim() }); continue; }
    para.push(line.trim());
  }
  flush();
  console.log(`  ${slug}: ${p.blocks.filter((b) => b.t === "img").reduce((n, b) => n + b.items.length, 0)} images`);
  return p;
}

const slugs = readdirSync(ROOT).filter((d) => d !== "vault" && statSync(join(ROOT, d)).isDirectory() && existsSync(join(ROOT, d, "project.md")));
const projects = [];
for (const s of slugs) projects.push(await build(s));
projects.sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.title.localeCompare(b.title));

await seal(new TextEncoder().encode(JSON.stringify({ projects })), "index");
writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
written.add("meta.json");
for (const f of readdirSync(VAULT)) if (!written.has(f)) rmSync(join(VAULT, f));
console.log(`vault: ${written.size} files`);
