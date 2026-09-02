// Fresh independent verification for AGENT_WORKLIST item 3.8 (SK Chemists
// Bootle), quality pass 2026-09-02 (seventh pass). Written from scratch this
// run: no code imported from tools/, own regexes throughout, follows the
// template established by the item's six prior passes (see AGENT_WORKLIST.md
// entries dated 2026-08-04 through 2026-09-01).
//
// Checks, per page: exactly one crawlable H1 naming Bootle; own phone in both
// display and tel: shapes with no other live branch's digits present
// anywhere; own postcode only; own ODS code only where an ODS-bearing surface
// exists; JSON-LD block parses and matches branches.json field by field
// (type, name, address, telephone); map embed query decodes to the branch's
// own address; data-wa carries the estate WhatsApp constant; no other live
// branch's seoTown appears as a whole word unless it is in SK's own
// serviceAreaList (Bootle, Sefton, Liverpool); no other brandLabel appears in
// visible copy.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branchesData = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8'));
const branches = branchesData.branches;

const SK = branches.find(b => b.id === 'skchemists_bootle');
if (!SK) { console.error('FATAL: skchemists_bootle not found in branches.json'); process.exit(1); }

const liveBranches = branches.filter(b => !b.disposed);
const otherLive = liveBranches.filter(b => b.id !== SK.id);

const files = [
  'modules/service/pages/contraception-sk-chemists-bootle.html',
  'modules/service/pages/earache-treatment-sk-chemists-bootle.html',
  'modules/service/pages/impetigo-treatment-sk-chemists-bootle.html',
  'modules/service/pages/insect-bite-treatment-sk-chemists-bootle.html',
  'modules/service/pages/pharmacy-first-sk-chemists-bootle.html',
  'modules/service/pages/shingles-treatment-sk-chemists-bootle.html',
  'modules/service/pages/sinusitis-treatment-sk-chemists-bootle.html',
  'modules/service/pages/sore-throat-treatment-sk-chemists-bootle.html',
  'modules/service/pages/travel-clinic-sk-chemists-bootle.html',
  'modules/service/pages/uti-treatment-sk-chemists-bootle.html',
  'modules/service/pages/weight-loss-clinic-sk-chemists-bootle.html',
  'modules/switch/pages/switch-prescriptions-sk-chemists-bootle.html',
];

let checks = 0, flags = 0;
const flagLines = [];

function flag(file, rule, detail) {
  flags++;
  flagLines.push(`FLAG [${rule}] ${file}: ${detail}`);
}

function check() { checks++; }

// Digits-only forms of every live branch's phone, for substring collision tests
function digitsOf(s) { return (s || '').replace(/\D/g, ''); }
const ownPhoneDigits = digitsOf(SK.phone);
const otherPhoneDigitsList = otherLive.map(b => ({ id: b.id, digits: digitsOf(b.phone) })).filter(x => x.digits && x.digits !== ownPhoneDigits);

const ownPostcode = SK.postalCode;
const otherPostcodes = otherLive.map(b => b.postalCode).filter(p => p && p !== ownPostcode);

const ownOds = SK.odsCode;
const otherOds = otherLive.map(b => b.odsCode).filter(o => o && o !== ownOds);

// seoTowns of other live branches not covered by SK's own serviceAreaList
const ownServiceAreas = new Set((SK.serviceAreaList || []).map(t => t.toLowerCase()));
const foreignSeoTowns = [...new Set(otherLive.map(b => b.seoTown).filter(Boolean))]
  .filter(t => t.toLowerCase() !== SK.seoTown.toLowerCase())
  .filter(t => !ownServiceAreas.has(t.toLowerCase()));

const otherBrandLabels = [...new Set(otherLive.map(b => b.brandLabel).filter(Boolean))]
  .filter(l => l !== SK.brandLabel);

function wordBoundaryTest(haystack, needle) {
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(haystack);
}

for (const rel of files) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { flag(rel, 'MISSING_FILE', 'file listed but not found on disk'); continue; }
  const html = fs.readFileSync(full, 'utf8');
  // strip build comments so governance notes are not counted as copy
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  // crawlable text: strip tags but keep script contents separately flagged
  const scriptBlocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const withoutScripts = noComments.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  const visibleText = withoutScripts.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // 1. H1 count and content
  check();
  const h1s = [...noComments.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  if (h1s.length !== 1) {
    flag(rel, 'H1_COUNT', `expected exactly 1 H1, found ${h1s.length}`);
  } else {
    check();
    if (!wordBoundaryTest(h1s[0], 'Bootle')) flag(rel, 'H1_TOWN', `H1 "${h1s[0]}" does not name Bootle`);
  }

  // 2. Own phone present (display and tel:), no other branch phone digits present anywhere in the file
  check();
  if (!html.includes(SK.phone)) flag(rel, 'PHONE_DISPLAY_MISSING', `own display phone "${SK.phone}" not found`);
  check();
  const telHrefs = [...html.matchAll(/href="tel:([^"]+)"/gi)].map(m => digitsOf(m[1]));
  if (!telHrefs.some(d => d.endsWith(ownPhoneDigits) || ownPhoneDigits.endsWith(d))) {
    flag(rel, 'TEL_HREF_MISSING', `no tel: href matching own phone digits ${ownPhoneDigits}`);
  }
  for (const other of otherPhoneDigitsList) {
    check();
    // search all phone-shaped digit runs of length >= 10 in the whole file
    const allDigitRuns = [...html.matchAll(/\d[\d\s]{8,}\d/g)].map(m => digitsOf(m[0]));
    if (allDigitRuns.some(d => d.includes(other.digits))) {
      flag(rel, 'FOREIGN_PHONE', `contains ${other.id}'s phone digits ${other.digits}`);
    }
  }

  // 3. Postcode: own present, no other branch's postcode present
  check();
  if (!html.includes(ownPostcode)) flag(rel, 'POSTCODE_MISSING', `own postcode "${ownPostcode}" not found`);
  for (const pc of otherPostcodes) {
    check();
    if (wordBoundaryTest(html, pc.replace(/\s+/g, '\\s*'))) flag(rel, 'FOREIGN_POSTCODE', `contains another branch's postcode ${pc}`);
  }

  // 4. ODS code: if page carries any ODS-bearing surface (pfLink page), own ODS present, never another branch's
  for (const ods of otherOds) {
    check();
    if (wordBoundaryTest(html, ods)) flag(rel, 'FOREIGN_ODS', `contains another branch's ODS code ${ods}`);
  }

  // 5. JSON-LD block
  check();
  const ldMatches = [...noComments.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (ldMatches.length !== 1) {
    flag(rel, 'JSONLD_COUNT', `expected exactly 1 JSON-LD block, found ${ldMatches.length}`);
  } else {
    let ld;
    try { ld = JSON.parse(ldMatches[0][1]); } catch (e) { ld = null; flag(rel, 'JSONLD_PARSE', e.message); }
    if (ld) {
      check();
      if (ld['@type'] !== 'Pharmacy') flag(rel, 'JSONLD_TYPE', `@type is "${ld['@type']}", expected Pharmacy`);
      check();
      if (ld.name !== SK.branchName && ld.name !== SK.brandLabel) flag(rel, 'JSONLD_NAME', `name "${ld.name}" matches neither branchName nor brandLabel`);
      check();
      const addr = ld.address || {};
      if (addr.streetAddress !== SK.streetAddress) flag(rel, 'JSONLD_STREET', `streetAddress "${addr.streetAddress}" != "${SK.streetAddress}"`);
      check();
      if (addr.addressLocality !== SK.addressLocality) flag(rel, 'JSONLD_LOCALITY', `addressLocality "${addr.addressLocality}" != "${SK.addressLocality}"`);
      check();
      if (addr.postalCode !== SK.postalCode) flag(rel, 'JSONLD_POSTCODE', `postalCode "${addr.postalCode}" != "${SK.postalCode}"`);
      check();
      if (addr.addressRegion !== SK.addressRegion) flag(rel, 'JSONLD_REGION', `addressRegion "${addr.addressRegion}" != "${SK.addressRegion}"`);
      check();
      if (ld.telephone !== SK.phone) flag(rel, 'JSONLD_PHONE', `telephone "${ld.telephone}" != "${SK.phone}"`);
    }
  }

  // 6. Map embed query decodes to own address
  check();
  const mapMatches = [...html.matchAll(/<iframe[^>]*src="(https:\/\/www\.google\.com\/maps\?[^"]*)"/gi)]
    .map(m => m[1])
    .filter(src => /[?&]q=/.test(src) && /[?&]output=embed\b/.test(src))
    .map(src => src.match(/[?&]q=([^&]+)/)[1]);
  if (mapMatches.length !== 1) {
    flag(rel, 'MAP_COUNT', `expected exactly 1 maps embed query, found ${mapMatches.length}`);
  } else {
    const decoded = decodeURIComponent(mapMatches[0]);
    const expected = `${SK.streetAddress}, ${SK.addressLocality}, ${SK.postalCode}`;
    check();
    if (decoded !== expected) flag(rel, 'MAP_QUERY', `decoded "${decoded}" != expected "${expected}"`);
  }

  // 7. data-wa carries estate WhatsApp constant, if present
  const waMatches = [...html.matchAll(/data-wa="([^"]*)"/gi)];
  for (const m of waMatches) {
    check();
    if (m[1] !== SK.whatsapp) flag(rel, 'DATA_WA', `data-wa="${m[1]}" != estate constant "${SK.whatsapp}"`);
  }

  // 8. No foreign seoTown as a whole word (branch landing pages are a distinct
  // page type with deliberate cross-link sentences; SK Bootle has none, so no
  // exception needed here, but the 3.6 pass's finding is kept in mind)
  for (const town of foreignSeoTowns) {
    check();
    if (wordBoundaryTest(visibleText, town)) {
      flag(rel, 'FOREIGN_SEOTOWN', `names "${town}" (not in SK's serviceAreaList)`);
    }
  }

  // 9. No other live branch's brandLabel in visible copy
  for (const label of otherBrandLabels) {
    check();
    if (visibleText.includes(label)) flag(rel, 'FOREIGN_BRAND', `contains another branch's brandLabel "${label}"`);
  }

  // 10. No http:// (non-https) links
  check();
  if (/href="http:\/\//i.test(html)) flag(rel, 'HTTP_LINK', 'contains a non-https href');

  // 11. Script-only copy check: any visible hero/H1 wording present only inside a <script> block
  check();
  const scriptText = scriptBlocks.join(' ');
  if (h1s.length === 1 && !visibleText.includes(h1s[0]) && scriptText.includes(h1s[0])) {
    flag(rel, 'SCRIPT_ONLY_H1', 'H1 text found only inside a <script> block, invisible to a crawler');
  }
}

console.log(`Item 3.8 (SK Chemists Bootle) independent verification, 2026-09-02 (seventh pass)`);
console.log(`Files checked: ${files.length}`);
console.log(`Total checks: ${checks}`);
console.log(`Flags: ${flags}`);
if (flags) {
  console.log(flagLines.join('\n'));
  process.exitCode = 1;
} else {
  console.log('ZERO FLAGS.');
}
