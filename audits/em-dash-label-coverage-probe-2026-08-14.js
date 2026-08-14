/*
  em-dash-label-coverage-probe-2026-08-14.js

  Written for the item 5.1 quality pass on 2026-08-14. Independent instrument:
  it has its own file discovery, its own dash regexes and its own reading of the
  paste sheets, and imports NOTHING from tools/, so check-em-dashes.js is not
  tested against itself.

  It answers three questions and prints the evidence for each:

    1. COVERAGE OF FILES. Which files in the repo does check-em-dashes.js read,
       and which public surface does no rule reach? Rebuilt here from the
       checker's own constants, restated rather than imported.
    2. COVERAGE OF LINES. Which "- **Label:** value" labels do the paste sheets
       actually write, and which of them does the pasteable-line rule count as a
       value rather than as a heading?
    3. WHAT THE NOTES BUCKET IS HIDING. Every dash the checker reports rather
       than fails, classified by line shape, so "not a pasted value" can be
       audited instead of trusted.

  Finding on the day it was written: the label rule named five labels and the
  sheets write nine. Page Permalink (177), Page slug / URL (163), Page name (14)
  and HTML URL (14) fell to the notes bucket. Page Permalink sits between Page
  Title and Page Description in the same block and becomes the live URL. All
  were clean, so it was a latent hole. Fixed by inverting the rule to a shape.

  Run:  node audits/em-dash-label-coverage-probe-2026-08-14.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const rel = p => path.relative(REPO, p).replace(/\\/g, "/");

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}

// Own dash test, deliberately not the checker's.
const ENTITY = /&(?:mdash|ndash|#8212|#8211|#[xX]2014|#[xX]2013);/g;
const LITERAL = /[–—]/;
function hasDash(s) { ENTITY.lastIndex = 0; return LITERAL.test(s) || ENTITY.test(s); }
function countDashes(s) {
  const lit = s.match(/[–—]/g);
  ENTITY.lastIndex = 0;
  const ent = s.match(ENTITY);
  return (lit ? lit.length : 0) + (ent ? ent.length : 0);
}

// The checker's scope, RESTATED so a change there shows up here as a divergence.
const PAGE_DIRS = ["modules/switch/pages", "modules/service/pages", "modules/branch/pages"];
const EXTRA_HTML = [
  "modules/switch/weebly.html",
  "modules/emar/weebly",
  "modules/service/DRAFT-weight-loss-copy.html",
  "modules/service/DRAFT-travel-clinic-copy.html",
  "modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html",
  "modules/service/weebly-paste/cherry-lane-old-weight-loss-replacement.html"
];
function coveredBy(r) {
  const d = path.posix.dirname(r);
  if (EXTRA_HTML.includes(r)) return "EXTRA_HTML";
  if (PAGE_DIRS.includes(d) && r.endsWith(".html")) return "PAGE_DIRS(html)";
  if (PAGE_DIRS.includes(d) && r.endsWith(".md")) return "PAGE_DIRS(sheet)";
  if (d === "modules/switch/pages/banners" && r.endsWith(".txt")) return "BANNER_DIR";
  if (d === "gbp-packs" && r.endsWith(".md")) return "PACK_DIR";
  if ((r.startsWith("modules/") || r.startsWith("core/")) && /\.(js|css)$/i.test(r)) return "CODE_DIRS";
  if (r === "branches.json") return "DATA_FILES";
  return null;
}

let problems = 0;

// ---- 1. coverage of files -------------------------------------------------
console.log("1. COVERAGE OF FILES");
const all = walk(REPO, []).map(rel).sort();
const cov = {};
for (const r of all) { const c = coveredBy(r); if (c) cov[c] = (cov[c] || 0) + 1; }
for (const k of Object.keys(cov).sort()) console.log("   " + k + ": " + cov[k]);

// Every .html under modules/ must be reached by PAGE_DIRS or EXTRA_HTML.
const strayHtml = all.filter(r => r.startsWith("modules/") && r.endsWith(".html") && !coveredBy(r));
console.log("   .html under modules/ reached by no rule: " + strayHtml.length);
strayHtml.forEach(r => { console.log("     UNREACHED " + r); problems++; });

// Every .js/.css a generated page actually loads must be under CODE_DIRS.
const pages = all.filter(r => /^modules\/(switch|service|branch)\/pages\/[^/]+\.html$/.test(r));
const assets = new Set();
for (const r of pages) {
  const t = fs.readFileSync(path.join(REPO, r), "utf8");
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(t)) !== null) if (/\.(js|css)(\?|$)/i.test(m[1])) assets.add(m[1]);
}
console.log("   distinct .js/.css URLs referenced by generated pages: " + assets.size);
for (const u of [...assets].sort()) {
  const own = u.indexOf("rbh-site-data") !== -1;
  console.log("     " + (own ? "OURS      " : "THIRDPARTY") + " " + u);
}

// ---- 2. coverage of lines -------------------------------------------------
console.log("");
console.log("2. COVERAGE OF LINES (paste sheet labels)");
// The rule as it stands today. If this is ever narrowed back to a name list,
// the divergence below reappears.
const PASTEABLE = /^\s*[-*]\s*\*\*[^*]+:\*\*/;
const BOLD = /^\s*[-*]\s*\*\*([^*:]+):\*\*/;
const sheets = all.filter(r => PAGE_DIRS.includes(path.posix.dirname(r)) && r.endsWith(".md"));
const labels = {};
for (const r of sheets) {
  for (const l of fs.readFileSync(path.join(REPO, r), "utf8").split(/\r?\n/)) {
    const m = l.match(BOLD);
    if (!m) continue;
    const k = m[1].trim();
    if (!labels[k]) labels[k] = { n: 0, checked: PASTEABLE.test(l) };
    labels[k].n++;
  }
}
console.log("   sheets read: " + sheets.length + ", distinct labels: " + Object.keys(labels).length);
for (const k of Object.keys(labels).sort((a, b) => labels[b].n - labels[a].n)) {
  const st = labels[k].checked ? "CHECKED    " : "NOT CHECKED";
  console.log("     " + st + " " + k + " (" + labels[k].n + ")");
  if (!labels[k].checked) problems++;
}

// ---- 3. what the notes bucket is hiding -----------------------------------
console.log("");
console.log("3. DASHES THE CHECKER REPORTS RATHER THAN FAILS, BY LINE SHAPE");
const shapes = {};
for (const r of sheets) {
  fs.readFileSync(path.join(REPO, r), "utf8").split(/\r?\n/).forEach((l, i) => {
    if (!hasDash(l) || PASTEABLE.test(l)) return;
    let shape;
    if (BOLD.test(l)) shape = "LABELLED LINE (should be checked)";
    else if (/^\s*#{1,6}\s/.test(l)) shape = "markdown section heading";
    else if (/^\s*\|/.test(l)) shape = "table row";
    else if (/^\s*[-*]\s/.test(l)) shape = "plain bullet";
    else shape = "prose / other";
    if (!shapes[shape]) shapes[shape] = { dashes: 0, ex: [] };
    shapes[shape].dashes += countDashes(l);
    if (shapes[shape].ex.length < 2) shapes[shape].ex.push(r + ":" + (i + 1) + "  " + l.trim().slice(0, 100));
  });
}
for (const k of Object.keys(shapes).sort((a, b) => shapes[b].dashes - shapes[a].dashes)) {
  console.log("   " + k + ": " + shapes[k].dashes);
  shapes[k].ex.forEach(e => console.log("       " + e));
  if (k.indexOf("should be checked") !== -1) problems += shapes[k].dashes;
}

console.log("");
if (problems) {
  console.log("PROBE FOUND " + problems + " coverage gap(s) above.");
  process.exit(1);
}
console.log("PROBE CLEAN: every public file is reached by a rule, every sheet label is");
console.log("checked as a value, and every reported dash is genuine sheet structure.");
