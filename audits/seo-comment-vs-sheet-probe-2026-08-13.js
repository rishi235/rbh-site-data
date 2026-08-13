/*
  seo-comment-vs-sheet-probe-2026-08-13.js

  Estate-wide probe raised by the item 3.7 quality pass, run 149.

  Every generated page opens with an HTML comment that carries the two
  Weebly SEO strings for that page:

      Weebly page SEO title:        ...
      Weebly page SEO description:  ...

  Those are pasteable values: a human copies them into the Weebly SEO
  fields. check-em-dashes.js strips HTML comments before it reads a page,
  by design, because a comment is not visible copy. So the ONLY thing that
  reads those two strings for a dash is the paste sheet copy of them, and
  that only works if a sheet row exists for the page AND says the same
  thing.

  This probe asks two questions across every generated page:
    1. does every page-comment SEO string have a matching sheet row
    2. where both exist, do they agree character for character

  Exit 0 if the two halves agree everywhere, 1 otherwise.
*/

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, hits) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hits);
    else hits.push(p);
  }
  return hits;
}
const files = walk(path.join(ROOT, 'modules'), []);
const pages = files.filter(p => /\.html$/i.test(p) && /[\\/]pages[\\/]/.test(p) && !/[\\/]banners[\\/]/.test(p));
const sheets = files.filter(p => /\.md$/i.test(p) && /[\\/]pages[\\/]/.test(p));

const rows = [];
for (const f of sheets) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  let cur = null;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (/^##\s+/.test(line)) { if (cur) rows.push(cur); cur = { sheet: rel }; continue; }
    if (!cur) continue;
    let m;
    if ((m = line.match(/^\s*-\s*\*\*(?:Page Title|SEO title)\s*:?\*\*\s*(.+?)\s*$/i))) cur.title = m[1];
    else if ((m = line.match(/^\s*-\s*\*\*(?:Page Description|SEO description)\s*:?\*\*\s*(.+?)\s*$/i))) cur.description = m[1];
    else if ((m = line.match(/^\s*-\s*\*\*Page Permalink\s*:?\*\*\s*(.+?)\s*$/i))) cur.permalink = m[1];
  }
  if (cur) rows.push(cur);
}
const byPermalink = {};
for (const r of rows) if (r.permalink) (byPermalink[r.permalink] = byPermalink[r.permalink] || []).push(r);

let withComment = 0, uncovered = [], mismatched = [], compared = 0;
for (const p of pages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const raw = fs.readFileSync(p, 'utf8');
  const ct = raw.match(/Weebly page SEO title:\s*(.+?)\s*\r?\n/i);
  const cd = raw.match(/Weebly page SEO description:\s*(.+?)\s*\r?\n/i);
  if (!ct && !cd) continue;
  withComment++;
  const permalink = path.basename(p).replace(/\.html$/i, '');
  const matches = byPermalink[permalink] || [];
  if (!matches.length) { uncovered.push(rel); continue; }
  let titleSeen = false, descSeen = false;
  for (const r of matches) {
    if (ct && r.title) { compared++; titleSeen = true; if (ct[1].trim() !== r.title.trim()) mismatched.push(rel + ' TITLE vs ' + r.sheet); }
    if (cd && r.description) { compared++; descSeen = true; if (cd[1].trim() !== r.description.trim()) mismatched.push(rel + ' DESCRIPTION vs ' + r.sheet); }
  }
  if (ct && !titleSeen) uncovered.push(rel + ' (title has no sheet counterpart)');
  if (cd && !descSeen) uncovered.push(rel + ' (description has no sheet counterpart)');
}

console.log('Generated pages scanned:              ' + pages.length);
console.log('Pages carrying comment SEO strings:   ' + withComment);
console.log('Paste sheets read:                    ' + sheets.length);
console.log('Sheet rows parsed:                    ' + rows.length);
console.log('Comment/sheet string pairs compared:  ' + compared);
console.log('');
console.log('Pages whose comment SEO string has NO sheet counterpart: ' + uncovered.length);
uncovered.forEach(u => console.log('  ' + u));
console.log('Pairs that disagree: ' + mismatched.length);
mismatched.forEach(m => console.log('  ' + m));

// A dash in an uncovered comment string reaches no checker at all. Prove it
// by counting dashes in the uncovered set rather than asserting it.
let dashesInUncovered = 0;
for (const u of uncovered) {
  const f = path.join(ROOT, u.split(' ')[0].replace(/\//g, path.sep));
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  for (const re of [/Weebly page SEO title:\s*(.+?)\s*\r?\n/i, /Weebly page SEO description:\s*(.+?)\s*\r?\n/i]) {
    const m = raw.match(re);
    if (m && /[–—]|&mdash;|&ndash;|&#8212;|&#8211;/i.test(m[1])) dashesInUncovered++;
  }
}
console.log('Dashes currently sitting in uncovered comment strings: ' + dashesInUncovered);
process.exitCode = (uncovered.length || mismatched.length) ? 1 : 0;
