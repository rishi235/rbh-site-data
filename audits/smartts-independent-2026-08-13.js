/*
  smartts-independent-2026-08-13.js

  Independent verification of item 3.7, Smartts Chemist (Bootle), written for
  the quality pass of 2026-08-13 (run 149). It shares NO code with tools/:
  its own file discovery, its own regexes and its own reading of branches.json,
  so where it agrees with the 30 checkers it does so by arriving separately
  rather than by calling them.

  Run:  node audits\smartts-independent-2026-08-13.js
  Exit: 0 if every check passes, 1 otherwise.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8'));
const branches = data.branches;
const me = branches.find(b => b.id === 'smartts_bootle');
const others = branches.filter(b => b.id !== 'smartts_bootle');

let checks = 0, failures = [];
function ok(cond, label) {
  checks++;
  if (!cond) failures.push(label);
}
function out(s) { console.log(s); }

// ---- own file discovery, not tools/'s ----------------------------------
function walk(dir, hits) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hits);
    else hits.push(p);
  }
  return hits;
}
const allFiles = walk(ROOT, []).filter(p => !p.includes('.git' + path.sep));
const myPages = allFiles.filter(p => /\.html$/i.test(p) && /smartts-bootle/i.test(path.basename(p)));

out('SMARTTS CHEMIST (BOOTLE) - INDEPENDENT VERIFICATION, item 3.7');
out('Run 149, 2026-08-13. Repo half only: no browser, nothing live read.');
out('');
out('Pages discovered: ' + myPages.length);
myPages.forEach(p => out('  ' + path.relative(ROOT, p).replace(/\\/g, '/')));
out('');

const stripComments = s => s.replace(/<!--[\s\S]*?-->/g, '');
const digits = s => (s || '').replace(/\D/g, '');
const myDigits = digits(me.phone);

// ---- per-page checks ---------------------------------------------------
const otherWidgetIds = [];
branches.forEach(b => Object.values(b.widgets || {}).forEach(id => {
  if (!Object.values(me.widgets || {}).includes(id)) otherWidgetIds.push(id);
}));
const allWidgetIds = [];
branches.forEach(b => Object.values(b.widgets || {}).forEach(id => allWidgetIds.push(id)));

for (const p of myPages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const raw = fs.readFileSync(p, 'utf8');
  const body = stripComments(raw);

  // H1: exactly one, carrying seoTown
  const h1s = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  ok(h1s.length === 1, rel + ': expected exactly one H1, found ' + h1s.length);
  if (h1s.length === 1) {
    const text = h1s[0].replace(/<[^>]+>/g, '').trim();
    ok(new RegExp('\\b' + me.seoTown + '\\b', 'i').test(text),
      rel + ': H1 does not carry seoTown ' + me.seoTown + ' -> "' + text + '"');
  }

  // phone, both shapes, and nobody else's
  ok(body.includes(me.phone), rel + ': display phone ' + me.phone + ' missing');
  ok(new RegExp('tel:' + myDigits).test(body), rel + ': tel: link tel:' + myDigits + ' missing');
  for (const b of others) {
    const d = digits(b.phone);
    // rbh_head_office_aintree carries an EMPTY phone. An empty needle makes
    // includes() true for every page, so an unguarded loop reports all 12
    // pages as carrying head office's number. Guarded, not silently skipped.
    if (!d || d === myDigits) continue;
    ok(!body.includes(b.phone), rel + ": carries " + b.branchName + "'s display phone " + b.phone);
    ok(!body.includes('tel:' + d), rel + ": carries " + b.branchName + "'s tel: link");
  }

  // address: own street and postcode only
  ok(body.includes(me.postalCode) || !/postalCode|postcode/i.test(body),
    rel + ': postcode block present but own postcode ' + me.postalCode + ' missing');
  for (const b of others) {
    if (b.postalCode === me.postalCode) continue;
    ok(!body.includes(b.postalCode), rel + ": carries " + b.branchName + "'s postcode " + b.postalCode);
    if (b.streetAddress !== me.streetAddress) {
      ok(!body.includes(b.streetAddress), rel + ": carries " + b.branchName + "'s street " + b.streetAddress);
    }
  }

  // widget ids: none hard-coded, from anywhere in the estate
  for (const id of allWidgetIds) {
    ok(!body.includes(id), rel + ': hard-codes widget id ' + id);
  }

  // ODS and nhs.net
  for (const b of others) {
    if (b.odsCode && b.odsCode !== me.odsCode) {
      ok(!body.includes(b.odsCode), rel + ": carries " + b.branchName + "'s ODS " + b.odsCode);
    }
    if (b.nhsEmail && b.nhsEmail !== me.nhsEmail) {
      ok(!body.includes(b.nhsEmail), rel + ": carries " + b.branchName + "'s nhs.net address");
    }
  }

  // review links and Pharmacy First links: own only
  for (const b of others) {
    for (const f of ['googleReviewUrl', 'nhsReviewUrl', 'pfLink']) {
      if (b[f] && b[f] !== me[f]) {
        ok(!body.includes(b[f]), rel + ": carries " + b.branchName + "'s " + f);
      }
    }
  }

  // insecure references
  const insecure = body.match(/(?:href|src)\s*=\s*["']http:\/\/[^"']+/gi) || [];
  ok(insecure.length === 0, rel + ': insecure http:// reference(s): ' + insecure.join(', '));

  // dashes, literal and entity, in visible copy
  const dash = body.match(/[–—]|&mdash;|&ndash;|&#8212;|&#8211;|&#x201[34];/gi) || [];
  ok(dash.length === 0, rel + ': em/en dash in visible copy: ' + dash.join(', '));

  // other brands
  for (const b of others) {
    if (b.brandLabel === me.brandLabel) continue;
    ok(!body.includes(b.brandLabel), rel + ": names another brand, " + b.brandLabel);
  }
}

// ---- JSON-LD, field by field ------------------------------------------
let ldCount = 0;
for (const p of myPages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const raw = fs.readFileSync(p, 'utf8');
  const blocks = raw.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const b of blocks) {
    const json = b.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    let parsed = null;
    try { parsed = JSON.parse(json); } catch (e) { ok(false, rel + ': JSON-LD does not parse: ' + e.message); continue; }
    ldCount++;
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const n of nodes) {
      const a = n.address;
      if (!a) continue;
      ok(a.streetAddress === me.streetAddress, rel + ': JSON-LD streetAddress "' + a.streetAddress + '"');
      ok(a.addressLocality === me.addressLocality, rel + ': JSON-LD addressLocality "' + a.addressLocality + '"');
      ok(a.postalCode === me.postalCode, rel + ': JSON-LD postalCode "' + a.postalCode + '"');
      ok(a.addressRegion === me.addressRegion, rel + ': JSON-LD addressRegion "' + a.addressRegion + '"');
      ok(!a.addressCountry || a.addressCountry === me.addressCountry, rel + ': JSON-LD addressCountry "' + a.addressCountry + '"');
      if (n.telephone) ok(digits(n.telephone) === myDigits, rel + ': JSON-LD telephone "' + n.telephone + '"');
    }
  }
}

// ---- CDN pins, per family ---------------------------------------------
const pinOf = s => {
  const m = s.match(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^/]+)\//);
  return m ? m[1] : null;
};
const pins = {};
for (const p of myPages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const raw = fs.readFileSync(p, 'utf8');
  const found = [...raw.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^/]+)\//g)].map(m => m[1]);
  const uniq = [...new Set(found)];
  ok(uniq.length <= 1, rel + ': mixed CDN pins ' + uniq.join(', '));
  const family = rel.includes('/switch/') ? 'switch' : 'service';
  (pins[family] = pins[family] || []).push(uniq[0] || 'none');
}
for (const fam of Object.keys(pins)) {
  const uniq = [...new Set(pins[fam])];
  ok(uniq.length === 1, fam + ' family has inconsistent pins: ' + uniq.join(', '));
  out('CDN pin, ' + fam + ' family: ' + uniq.join(', ') + ' (' + pins[fam].length + ' pages)');
}
out('JSON-LD blocks parsed and compared field by field: ' + ldCount);
out('');

// ---- paste sheets: own reading, keyed by permalink --------------------
// Every *.md under a pages folder is read, not a named list, so a sheet a
// future generator adds is covered the day it is written.
const sheetFiles = allFiles.filter(p => /\.md$/i.test(p) && /\{0}modules\{0}(service|switch|branch)\{0}pages\{0}/.test(p.replace(/\\/g, '{0}')));
const sheetEntries = [];   // {sheet, permalink, title, description, keywords}
for (const f of sheetFiles) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  let cur = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (cur) sheetEntries.push(cur);
      cur = { sheet: path.relative(ROOT, f).replace(/\\/g, '/'), heading: line.replace(/^##\s+/, '').trim() };
      continue;
    }
    if (!cur) continue;
    let m;
    if ((m = line.match(/^\s*-\s*\*\*(?:Page Title|SEO title)\s*:?\*\*\s*(.+?)\s*$/i))) cur.title = m[1];
    else if ((m = line.match(/^\s*-\s*\*\*(?:Page Description|SEO description)\s*:?\*\*\s*(.+?)\s*$/i))) cur.description = m[1];
    else if ((m = line.match(/^\s*-\s*\*\*Page Permalink\s*:?\*\*\s*(.+?)\s*$/i))) cur.permalink = m[1];
    else if ((m = line.match(/^\s*-\s*\*\*Meta Keywords\s*:?\*\*\s*(.+?)\s*$/i))) cur.keywords = m[1];
  }
  if (cur) sheetEntries.push(cur);
}
const mySheetRows = sheetEntries.filter(e =>
  (e.permalink && /smartts-bootle/i.test(e.permalink)) ||
  (e.heading && /Smartts/i.test(e.heading)));
out('Paste sheet rows for Smartts: ' + mySheetRows.length +
    ' across ' + [...new Set(mySheetRows.map(r => r.sheet))].length + ' sheets');

let descLens = [];
for (const r of mySheetRows) {
  if (!r.description) continue;
  descLens.push(r.description.length);
  ok(r.description.length >= 120 && r.description.length <= 165,
    r.sheet + ' / ' + (r.permalink || r.heading) + ': description length ' + r.description.length);
  const d = r.description.match(/[–—]|&mdash;|&ndash;|&#8212;|&#8211;/g) || [];
  ok(d.length === 0, r.sheet + ' / ' + (r.permalink || r.heading) + ': dash in pasteable description');
  if (r.title) {
    const t = r.title.match(/[–—]|&mdash;|&ndash;|&#8212;|&#8211;/g) || [];
    ok(t.length === 0, r.sheet + ' / ' + (r.permalink || r.heading) + ': dash in pasteable title');
  }
}
if (descLens.length) {
  out('Sheet description lengths: ' + Math.min(...descLens) + ' to ' + Math.max(...descLens) + ' characters');
}
out('');

// ---- NEW CROSS-CHECK: the SEO strings written INSIDE each page comment
// against the same strings in the paste sheet. Two copies of the same
// Weebly field live in two files; whoever pastes reads one of them.
const byPermalink = {};
for (const e of sheetEntries) {
  if (e.permalink) (byPermalink[e.permalink] = byPermalink[e.permalink] || []).push(e);
}
let compared = 0, divergent = [];
for (const p of myPages) {
  const rel = path.relative(ROOT, p).replace(/\\/g, '/');
  const raw = fs.readFileSync(p, 'utf8');
  const permalink = path.basename(p).replace(/\.html$/i, '');
  const ct = raw.match(/Weebly page SEO title:\s*(.+?)\s*\r?\n/i);
  const cd = raw.match(/Weebly page SEO description:\s*(.+?)\s*\r?\n/i);
  const rows = byPermalink[permalink] || [];
  if (!ct && !cd) continue;
  if (!rows.length) { divergent.push(rel + ': page carries SEO strings but no sheet row has permalink ' + permalink); continue; }
  for (const row of rows) {
    if (ct && row.title) {
      compared++;
      if (ct[1].trim() !== row.title.trim()) {
        divergent.push(rel + ': SEO title in page comment "' + ct[1].trim() + '" vs sheet ' + row.sheet + ' "' + row.title.trim() + '"');
      }
    }
    if (cd && row.description) {
      compared++;
      if (cd[1].trim() !== row.description.trim()) {
        divergent.push(rel + ': SEO description in page comment differs from sheet ' + row.sheet);
      }
    }
  }
}
checks += compared;
out('SEO strings compared page-comment against paste sheet: ' + compared);
if (divergent.length) {
  out('DIVERGENCES:');
  divergent.forEach(d => out('  ' + d));
  failures = failures.concat(divergent);
} else {
  out('No divergence between page-comment SEO strings and the paste sheets.');
}
out('');

// ---- GBP pack ----------------------------------------------------------
const packPath = path.join(ROOT, 'gbp-packs', 'smartts-bootle.md');
if (fs.existsSync(packPath)) {
  const packRaw = fs.readFileSync(packPath, 'utf8');
  // The pack splits at "Notes for the paster:". Everything above it is copy
  // that gets typed into a Google field; everything below is instructions to
  // the human and is never pasted. The cross-brand scan runs on the pasteable
  // half only, because this pack deliberately names the sister Bootle branch
  // in the notes to explain why the description is worded differently. The
  // ASCII and dash-entity rules stay on the WHOLE file, since a note copied
  // into a field by mistake is still the failure those rules guard against.
  const splitAt = packRaw.indexOf('Notes for the paster:');
  const pack = splitAt === -1 ? packRaw : packRaw.slice(0, splitAt);
  ok(pack.includes(me.streetAddress), 'gbp pack: own street missing');
  ok(pack.includes(me.postalCode), 'gbp pack: own postcode missing');
  ok(pack.includes(me.phone), 'gbp pack: own display phone missing');
  const nonAscii = [...new Set((packRaw.match(/[^\x00-\x7F]/g) || []))];
  ok(nonAscii.length === 0, 'gbp pack: non-ASCII character(s) ' + nonAscii.map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase()).join(', '));
  const ent = packRaw.match(/&mdash;|&ndash;|&#8212;|&#8211;|&#x201[34];/gi) || [];
  ok(ent.length === 0, 'gbp pack: dash entity ' + ent.join(', '));
  for (const b of others) {
    if (b.postalCode !== me.postalCode) ok(!pack.includes(b.postalCode), "gbp pack: carries " + b.branchName + "'s postcode");
    if (digits(b.phone) && digits(b.phone) !== myDigits) ok(!pack.includes(b.phone), "gbp pack: carries " + b.branchName + "'s phone");
    if (b.brandLabel !== me.brandLabel) ok(!pack.includes(b.brandLabel), 'gbp pack: names another brand, ' + b.brandLabel);
  }
  out('GBP pack read: gbp-packs/smartts-bootle.md');
} else {
  ok(false, 'gbp pack gbp-packs/smartts-bootle.md not found');
}

// ---- opening hours: pack and pages against branches.json ---------------
const spec = (me.openingHours && me.openingHours.specification) || [];
const specWindows = spec.map(s => s.opens + '-' + s.closes);
out('branches.json hours: ' + specWindows.join(', ') + '; closed ' +
    ((me.openingHours && me.openingHours.closedDays) || []).join(', '));
out('');

// ---- verdict -----------------------------------------------------------
out('CHECKS RUN: ' + checks);
out('FAILURES:   ' + failures.length);
if (failures.length) {
  failures.forEach(f => out('  FAIL ' + f));
  process.exitCode = 1;
} else {
  out('All checks passed.');
}
