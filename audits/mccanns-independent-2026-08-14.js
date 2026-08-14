// Item 3.6 FIFTH independent extraction - McCanns Chemist (Aigburth and
// Sandringham). Written fresh for the 2026-08-14 quality pass. Shares NO code
// with tools/: its own regexes, its own sheet parser, its own JSON-LD reader.
// The point is to agree with the checkers by arriving separately, not by
// calling them.
//
// Run 187's lesson is enforced first: COVERAGE IS PROVED BEFORE ANY RESULT IS
// BELIEVED. An extractor that matches nothing reports zero failures. So the
// script exits non-zero if it does not find 26 pages, match all 26 to a sheet
// entry, and run more checks than the floor declared below.
'use strict';
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const EXPECT_PAGES = 26;
const CHECK_FLOOR = 500;

const fail = [];
const notes = [];
let checks = 0;
function ck(cond, msg) { checks++; if (!cond) fail.push(msg); }

const read = f => fs.readFileSync(f, 'utf8');
const data = JSON.parse(read(path.join(REPO, 'branches.json')));
const all = data.branches;
const mine = all.filter(b => b.brandKey === 'mccanns');
if (mine.length !== 2) { console.error('expected 2 mccanns branches, got ' + mine.length); process.exit(1); }
const mineIds = new Set(mine.map(b => b.id));

// ---------- estate-wide fact tables, built from the data not hardcoded -------
const digits = s => String(s || '').replace(/\D/g, '');
const otherPhones = new Map();   // digits -> branch id
const otherPostcodes = new Map();
const otherOds = new Map();
const otherReviews = new Map();
const allWidgetIds = new Set();
for (const b of all) {
  for (const w of Object.values(b.widgets || {})) if (w) allWidgetIds.add(String(w));
  if (mineIds.has(b.id)) continue;
  if (b.phone) otherPhones.set(digits(b.phone), b.id);
  if (b.postalCode) otherPostcodes.set(b.postalCode.toUpperCase().replace(/\s+/g, ''), b.id);
  if (b.odsCode) otherOds.set(b.odsCode.toUpperCase(), b.id);
  if (b.googleReviewUrl) otherReviews.set(b.googleReviewUrl, b.id);
}
// my own phones must not be treated as foreign
for (const b of mine) otherPhones.delete(digits(b.phone));

// towns belonging to other BRANDS, for the cross-town scan
const foreignTowns = new Set();
for (const b of all) {
  if (b.brandKey === 'mccanns') continue;
  if (b.seoTown) foreignTowns.add(b.seoTown);
}
// a token that one of my own branches legitimately owns is not foreign
for (const b of mine) {
  foreignTowns.delete(b.seoTown);
  for (const a of (b.serviceAreaList || [])) foreignTowns.delete(a);
  foreignTowns.delete(b.addressLocality);
}

// ---------- my own 26 pages, found by globbing rather than by a list --------
const PAGE_DIRS = [
  ['branch', path.join(REPO, 'modules', 'branch', 'pages')],
  ['service', path.join(REPO, 'modules', 'service', 'pages')],
  ['switch', path.join(REPO, 'modules', 'switch', 'pages')]
];
const pages = [];
for (const [mod, dir] of PAGE_DIRS) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.html')) continue;
    if (!/-mccanns-(aigburth|sandringham)\.html$/.test(f)) continue;
    const slug = f.replace(/\.html$/, '');
    const which = /sandringham/.test(f) ? 'mccanns_sandringham' : 'mccanns_aigburth';
    pages.push({ mod, file: f, slug, dir, full: path.join(dir, f),
                 br: mine.find(b => b.id === which), html: read(path.join(dir, f)) });
  }
}

// ---------- sheet parser, independent of tools/ -----------------------------
// Reads every *SEO.md in the estate and keys entries by Page Permalink, which
// is the filename without .html. Label spellings are matched loosely on
// purpose so a renamed label cannot silently drop an entry.
const SHEETS = [
  path.join(REPO, 'modules', 'branch', 'pages', 'SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'CONTRACEPTION-SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'TRAVEL-CLINIC-SEO.md'),
  path.join(REPO, 'modules', 'service', 'pages', 'WEIGHT-LOSS-SEO.md'),
  path.join(REPO, 'modules', 'switch', 'pages', 'SEO.md')
];
const sheet = new Map();
let sheetEntries = 0;
for (const s of SHEETS) {
  const blocks = read(s).split(/^##\s+/m).slice(1);
  for (const blk of blocks) {
    const g = re => { const m = blk.match(re); return m ? m[1].trim() : null; };
    const perm = g(/\*\*Page\s+Permalink:?\*\*\s*(.+)/i);
    if (!perm) continue;
    sheetEntries++;
    sheet.set(perm, {
      sheetFile: path.basename(s),
      title: g(/\*\*Page\s+Title:?\*\*\s*(.+)/i),
      desc: g(/\*\*Page\s+Description:?\*\*\s*(.+)/i),
      keywords: g(/\*\*Meta\s+Keywords:?\*\*\s*(.+)/i)
    });
  }
}

// ---------- COVERAGE GATE - run 187's lesson, before any result is believed --
const coverage = [];
coverage.push(['pages found', pages.length, EXPECT_PAGES]);
coverage.push(['sheet entries parsed', sheetEntries, '>0']);
const unmatched = pages.filter(p => !sheet.has(p.slug)).map(p => p.slug);
coverage.push(['pages matched to a sheet entry', pages.length - unmatched.length, EXPECT_PAGES]);
if (pages.length !== EXPECT_PAGES || sheetEntries === 0 || unmatched.length) {
  console.error('COVERAGE GATE FAILED - result not believable');
  console.error(JSON.stringify({ found: pages.length, expected: EXPECT_PAGES, sheetEntries, unmatched }, null, 1));
  process.exit(2);
}

// ---------- per-page checks -------------------------------------------------
const stripTags = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                        .replace(/<!--[\s\S]*?-->/g, ' ')
                        .replace(/<[^>]+>/g, ' ');
const titleLens = [], descLens = [];

for (const p of pages) {
  const H = p.html, B = p.br, tag = p.file;
  const body = stripTags(H);
  const myDigits = digits(B.phone);
  const myPc = B.postalCode.toUpperCase().replace(/\s+/g, '');

  // 1. exactly one H1, and it carries this branch's own seoTown
  const h1s = H.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  ck(h1s.length === 1, `${tag}: expected exactly 1 h1, found ${h1s.length}`);
  const h1txt = h1s.length ? stripTags(h1s[0]).replace(/\s+/g, ' ').trim() : '';
  ck(h1txt.includes(B.seoTown), `${tag}: h1 does not carry seoTown "${B.seoTown}" (h1="${h1txt}")`);

  // 2. phone in both shapes, and no other branch's number anywhere
  ck(H.includes(B.phone), `${tag}: display phone "${B.phone}" missing`);
  const tels = [...H.matchAll(/href="tel:([^"]+)"/gi)].map(m => digits(m[1]));
  ck(tels.length > 0, `${tag}: no tel: link`);
  for (const t of tels) ck(t === myDigits, `${tag}: tel: link ${t} is not this branch's number`);
  const numeric = H.replace(/[^\d]/g, '');
  for (const [d, id] of otherPhones) {
    if (d.length >= 10) ck(!numeric.includes(d), `${tag}: contains another branch's phone digits (${id})`);
  }

  // 3. postcode: own only
  ck(H.toUpperCase().replace(/\s+/g, '').includes(myPc), `${tag}: own postcode ${B.postalCode} missing`);
  const flatUpper = H.toUpperCase().replace(/\s+/g, '');
  for (const [pc, id] of otherPostcodes) ck(!flatUpper.includes(pc), `${tag}: contains ${id}'s postcode ${pc}`);

  // 4. street address
  ck(H.includes(B.streetAddress), `${tag}: own streetAddress "${B.streetAddress}" missing`);

  // 5. ODS: no other branch's
  for (const [ods, id] of otherOds) ck(!new RegExp('\\b' + ods + '\\b').test(H.toUpperCase()), `${tag}: contains ${id}'s ODS ${ods}`);

  // 6. review URL: no other branch's
  for (const [u, id] of otherReviews) ck(!H.includes(u), `${tag}: contains ${id}'s Google review URL`);

  // 7. no hard-coded widget id from anywhere in the estate
  for (const w of allWidgetIds) ck(!H.includes(w), `${tag}: hard-codes widget id ${w}`);

  // 8. no insecure scheme
  ck(!/http:\/\//i.test(H), `${tag}: contains an http:// URL`);

  // 9. cross-town: no other brand's town
  for (const t of foreignTowns) {
    if (t.length < 4) continue;
    ck(!new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(body),
       `${tag}: body mentions foreign town "${t}"`);
  }

  // 10. JSON-LD, parsed and compared field by field
  const ld = [...H.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  ck(ld.length === 1, `${tag}: expected 1 JSON-LD block, found ${ld.length}`);
  if (ld.length === 1) {
    let obj = null;
    try { obj = JSON.parse(ld[0][1]); } catch (e) { fail.push(`${tag}: JSON-LD does not parse (${e.message})`); }
    checks++;
    if (obj) {
      // A branch landing page names the SITE, a service or switch page names
      // the BRAND. My first draft asserted brandLabel everywhere and flagged
      // the two landing pages; the pages were right and the assertion was
      // wrong. Verified against all 177 estate pages before being narrowed:
      // 6 of 6 branch pages carry branchName, 171 of 171 service and switch
      // pages carry brandLabel. check-jsonld rule 3 was tightened to match.
      const wantName = p.mod === 'branch' ? B.branchName : B.brandLabel;
      ck(obj.name === wantName, `${tag}: JSON-LD name "${obj.name}" != expected "${wantName}" for a ${p.mod} page`);
      ck(digits(obj.telephone) === myDigits, `${tag}: JSON-LD telephone wrong`);
      const a = obj.address || {};
      ck(a['@type'] === 'PostalAddress', `${tag}: JSON-LD address @type wrong`);
      ck(a.streetAddress === B.streetAddress, `${tag}: JSON-LD streetAddress wrong`);
      ck(a.addressLocality === B.addressLocality, `${tag}: JSON-LD addressLocality wrong`);
      ck(a.postalCode === B.postalCode, `${tag}: JSON-LD postalCode wrong`);
      ck(a.addressRegion === B.addressRegion, `${tag}: JSON-LD addressRegion wrong`);
      ck(a.addressCountry === B.addressCountry, `${tag}: JSON-LD addressCountry wrong`);
      ck(typeof obj.url === 'string' && obj.url.startsWith(B.website), `${tag}: JSON-LD url not on own website`);
      ck(typeof obj.url === 'string' && obj.url.endsWith('/' + p.slug + '.html'), `${tag}: JSON-LD url slug mismatch`);
    }
  }

  // 11. sheet entry: present, on pattern, within length bands
  const s = sheet.get(p.slug);
  ck(!!s.title, `${tag}: sheet has no Page Title`);
  ck(!!s.desc, `${tag}: sheet has no Page Description`);
  if (s.title) {
    titleLens.push(s.title.length);
    ck(s.title.length >= 30 && s.title.length <= 70, `${tag}: sheet title length ${s.title.length} outside 30-70`);
    ck(s.title.includes(B.seoTown), `${tag}: sheet title missing seoTown "${B.seoTown}"`);
    ck(!/[–—]/.test(s.title), `${tag}: sheet title contains an en/em dash`);
  }
  if (s.desc) {
    descLens.push(s.desc.length);
    ck(s.desc.length >= 120 && s.desc.length <= 165, `${tag}: sheet description length ${s.desc.length} outside 120-165`);
    ck(s.desc.includes(B.seoTown), `${tag}: sheet description missing seoTown "${B.seoTown}"`);
    ck(!/[–—]/.test(s.desc), `${tag}: sheet description contains an en/em dash`);
  }

  // 12. the SEO title written into the page's own header comment must agree
  //     with the sheet. The sheet is what a human pastes; the comment is what
  //     tells them what to paste. If they disagree, one of them is a lie.
  const cm = H.match(/Weebly page SEO title:\s*(.+)/i);
  if (cm) ck(cm[1].trim() === (s.title || '').trim(),
             `${tag}: page comment SEO title != sheet title`);
  const cd = H.match(/Weebly page SEO description:\s*(.+)/i);
  if (cd) ck(cd[1].trim() === (s.desc || '').trim(),
             `${tag}: page comment SEO description != sheet description`);

  // 13. no emoji, no em dash in patient-facing body copy
  ck(!/[—]/.test(body), `${tag}: em dash in body copy`);
  ck(!/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u.test(body), `${tag}: emoji in body copy`);
}

// ---------- 14. CDN pins: every page must pin what its own generator says ---
// The generator that owns a page is found by matching the page's filename
// prefix against the slug each generator writes, so a page whose generator is
// renamed shows up as unowned rather than silently skipped.
const GENS = ['build-branch-landing-pages.js', 'build-service-pages.js',
  'build-contraception-pages.js', 'build-travel-clinic-pages.js',
  'build-weight-loss-pages.js', 'build-switch-pages.js'];
const genPin = {};
for (const g of GENS) {
  const src = read(path.join(REPO, 'tools', g));
  const m = src.match(/const\s+PIN\s*=\s*['"`]([^'"`]+)['"`]/);
  genPin[g] = m ? m[1] : null;
  ck(!!genPin[g], `generator ${g}: no const PIN found`);
}
function ownerOf(p) {
  if (p.mod === 'branch') return 'build-branch-landing-pages.js';
  if (p.mod === 'switch') return 'build-switch-pages.js';
  if (/^contraception-/.test(p.slug)) return 'build-contraception-pages.js';
  if (/^travel-clinic-/.test(p.slug)) return 'build-travel-clinic-pages.js';
  if (/^weight-loss-clinic-/.test(p.slug)) return 'build-weight-loss-pages.js';
  return 'build-service-pages.js';
}
const pinCount = {};
for (const p of pages) {
  const owner = ownerOf(p);
  const want = genPin[owner];
  const refs = [...p.html.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^/]+)\//g)].map(m => m[1]);
  ck(refs.length > 0, `${p.file}: no jsDelivr asset pinned`);
  for (const r of refs) ck(r === want, `${p.file}: pins @${r}, generator ${owner} declares @${want}`);
  pinCount[owner] = (pinCount[owner] || 0) + 1;
  notes.push(`${p.file} -> ${owner} @${want} (${refs.length} assets)`);
}

// ---------- 15. widget diary policy at brand level --------------------------
// weightLoss and travelClinic are shared across a brand's sites; the three NHS
// diaries are unique per site. Asserted from my two branches directly.
const [A, S] = [mine.find(b => b.id === 'mccanns_aigburth'), mine.find(b => b.id === 'mccanns_sandringham')];
ck(A.widgets.weightLoss === S.widgets.weightLoss, 'weightLoss diary should be shared across McCanns sites');
ck(A.widgets.travelClinic === S.widgets.travelClinic, 'travelClinic diary should be shared across McCanns sites');
for (const k of ['pharmacyFirst', 'contraception', 'bloodPressure']) {
  ck(A.widgets[k] !== S.widgets[k], `${k} diary must be unique per site, both McCanns sites share ${A.widgets[k]}`);
}
// and no McCanns NHS diary may collide with any other branch's
for (const k of ['pharmacyFirst', 'contraception', 'bloodPressure']) {
  for (const b of all) {
    if (b.brandKey === 'mccanns') continue;
    for (const [k2, v2] of Object.entries(b.widgets || {})) {
      ck(!(v2 && (v2 === A.widgets[k] || v2 === S.widgets[k])),
         `McCanns ${k} diary collides with ${b.id}.${k2}`);
    }
  }
}

// ---------- report ----------------------------------------------------------
const min = a => Math.min.apply(null, a), max = a => Math.max.apply(null, a);
console.log('McCANNS CHEMIST - ITEM 3.6 FIFTH INDEPENDENT EXTRACTION');
console.log('date: 2026-08-14   repo: rbh-site-data   branch: agents/audit-backlog');
console.log('');
console.log('COVERAGE GATE (proved before the result is read):');
for (const [k, got, want] of coverage) console.log('  ' + k + ': ' + got + ' (expected ' + want + ')');
console.log('  sheet files parsed: ' + SHEETS.length);
console.log('  estate widget ids scanned per page: ' + allWidgetIds.size);
console.log('  foreign towns scanned per page: ' + foreignTowns.size);
console.log('  other-branch phones scanned per page: ' + otherPhones.size);
console.log('');
console.log('PAGES BY MODULE:');
const byMod = {};
for (const p of pages) byMod[p.mod] = (byMod[p.mod] || 0) + 1;
for (const k of Object.keys(byMod).sort()) console.log('  ' + k + ': ' + byMod[k]);
console.log('');
console.log('PIN OWNERSHIP:');
for (const g of GENS) if (pinCount[g]) console.log('  ' + g + ' @' + genPin[g] + ': ' + pinCount[g] + ' pages');
console.log('');
console.log('SHEET STRING LENGTHS:');
console.log('  titles: ' + min(titleLens) + ' to ' + max(titleLens) + ' characters (' + titleLens.length + ' values)');
console.log('  descriptions: ' + min(descLens) + ' to ' + max(descLens) + ' characters (' + descLens.length + ' values)');
console.log('');
console.log('RESULT: ' + checks + ' checks, ' + fail.length + ' failures');
if (checks < CHECK_FLOOR) {
  console.error('CHECK FLOOR NOT MET: ' + checks + ' < ' + CHECK_FLOOR + ' - extractor is doing too little to be trusted');
  process.exit(3);
}
if (fail.length) {
  console.log('');
  console.log('FAILURES:');
  for (const f of fail) console.log('  - ' + f);
  process.exit(1);
}
console.log('ALL CLEAN');
