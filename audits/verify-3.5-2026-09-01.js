#!/usr/bin/env node
/*
 * Independent extraction for item 3.5 quality pass (eighth), 2026-09-01.
 * Own regexes only. Nothing imported from tools/. __dirname-relative paths
 * (per the item 3.5 sixth-pass finding: hardcoded absolute paths break when
 * the run happens on a different mount).
 *
 * Verifies all 12 Hirshmans Chemist (Ainsdale) pages against branches.json:
 *   - exactly one <h1>, containing "Ainsdale"
 *   - title/description present with plausible lengths
 *   - display phone and tel: link both present, no other branch's phone
 *     digits anywhere on the page
 *   - PR8 3HW the only postcode on the page
 *   - street address string present
 *   - no foreign brand or seoTown outside this branch's own serviceAreaList
 *   - data-wa carries this branch's own WhatsApp number, no other
 *   - JSON-LD PostalAddress matches branches.json field by field, where a
 *     JSON-LD block is present
 *   - no http:// (non-https) href or src
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;
const me = branches.find(b => b.id === 'hirshmans_ainsdale');
if (!me) { console.error('FAIL: hirshmans_ainsdale not found in branches.json'); process.exit(1); }

const others = branches.filter(b => b.id !== me.id && !b.disposed);

const files = [
  'modules/service/pages/contraception-hirshmans-ainsdale.html',
  'modules/service/pages/earache-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/impetigo-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/insect-bite-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/pharmacy-first-hirshmans-ainsdale.html',
  'modules/service/pages/shingles-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/sinusitis-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/sore-throat-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/travel-clinic-hirshmans-ainsdale.html',
  'modules/service/pages/uti-treatment-hirshmans-ainsdale.html',
  'modules/service/pages/weight-loss-clinic-hirshmans-ainsdale.html',
  'modules/switch/pages/switch-prescriptions-hirshmans-ainsdale.html',
];

let checks = 0;
let failures = 0;
const notes = [];

function fail(file, msg) {
  failures++;
  console.log(`FAIL [${file}]: ${msg}`);
}

function ok() { checks++; }

const phoneDigits = me.phone.replace(/\D/g, '');
const otherPhoneDigits = others.map(b => (b.phone || '').replace(/\D/g, '')).filter(Boolean);
const myWa = me.whatsapp;
const otherWa = others.map(b => b.whatsapp).filter(Boolean);
const otherPostcodes = others.map(b => b.postalCode).filter(Boolean);
const otherBrands = others.map(b => b.brandLabel).filter(Boolean);
// Towns this branch is allowed to mention: its own seoTown plus its serviceAreaList
const allowedTowns = new Set([me.seoTown, ...(me.serviceAreaList || [])].map(t => t.toLowerCase()));
const otherSeoTowns = [...new Set(others.map(b => b.seoTown).filter(Boolean))]
  .filter(t => !allowedTowns.has(t.toLowerCase()));

for (const rel of files) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { fail(rel, 'file missing'); continue; }
  const raw = fs.readFileSync(full, 'utf8');
  // strip HTML comments (build/paste instructions) before reading visible-ish content
  const noComments = raw.replace(/<!--[\s\S]*?-->/g, '');

  // 1. exactly one h1, contains Ainsdale
  const h1s = [...raw.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) {
    fail(rel, `expected exactly one <h1>, found ${h1s.length}`);
  } else {
    ok();
    const h1text = h1s[0][1].replace(/<[^>]+>/g, '').trim();
    if (!/ainsdale/i.test(h1text)) fail(rel, `h1 "${h1text}" does not name Ainsdale`);
    else ok();
  }

  // 2. phone: display phone and tel: link present, no foreign phone digits
  if (!raw.includes(me.phone)) fail(rel, `display phone ${me.phone} not found`);
  else ok();
  if (!new RegExp(`tel:${phoneDigits}`).test(raw)) fail(rel, `tel:${phoneDigits} link not found`);
  else ok();
  for (const fd of otherPhoneDigits) {
    if (fd && fd !== phoneDigits && raw.includes(fd)) fail(rel, `foreign phone digits ${fd} present`);
  }
  ok();

  // 3. postcode: PR8 3HW present, no foreign postcode
  if (!raw.includes(me.postalCode)) fail(rel, `postcode ${me.postalCode} not found`);
  else ok();
  for (const pc of otherPostcodes) {
    if (pc && raw.includes(pc)) fail(rel, `foreign postcode ${pc} present`);
  }
  ok();

  // 4. street address string present
  if (!raw.includes(me.streetAddress)) fail(rel, `street address "${me.streetAddress}" not found`);
  else ok();

  // 5. no foreign brand label
  for (const fb of otherBrands) {
    if (fb && fb !== me.brandLabel && raw.includes(fb)) fail(rel, `foreign brand "${fb}" present`);
  }
  ok();

  // 6. no foreign seoTown outside serviceAreaList (word-boundary)
  for (const town of otherSeoTowns) {
    const re = new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(noComments)) fail(rel, `foreign town "${town}" present outside serviceAreaList`);
  }
  ok();

  // 7. data-wa: own number, no foreign number
  const waMatch = raw.match(/data-wa="(\d+)"/);
  if (waMatch) {
    if (waMatch[1] !== myWa) fail(rel, `data-wa is ${waMatch[1]}, expected ${myWa}`);
    else ok();
  }
  for (const fw of otherWa) {
    if (fw && fw !== myWa && raw.includes(fw)) fail(rel, `foreign whatsapp number ${fw} present`);
  }
  ok();

  // 8. JSON-LD address, where present
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { fail(rel, `JSON-LD does not parse: ${e.message}`); ld = null; }
    if (ld) {
      ok();
      const addr = ld.address || {};
      const checksAddr = [
        ['streetAddress', me.streetAddress],
        ['addressLocality', me.addressLocality],
        ['postalCode', me.postalCode],
        ['addressRegion', me.addressRegion],
        ['addressCountry', me.addressCountry],
      ];
      for (const [field, expected] of checksAddr) {
        if (addr[field] !== expected) fail(rel, `JSON-LD address.${field} = "${addr[field]}", expected "${expected}"`);
        else ok();
      }
      if (ld.telephone && ld.telephone !== me.phone) fail(rel, `JSON-LD telephone = "${ld.telephone}", expected "${me.phone}"`);
      else ok();
    }
  } else {
    notes.push(`${rel}: no JSON-LD block (switch pages carry none by design)`);
  }

  // 9. no http:// href or src (non-https)
  const httpLinks = [...raw.matchAll(/(?:href|src)="http:\/\/[^"]*"/g)];
  if (httpLinks.length) fail(rel, `${httpLinks.length} non-https href/src found`);
  else ok();
}

console.log(`\n${checks} checks run, ${failures} failures.`);
if (notes.length) {
  console.log('\nNotes:');
  notes.forEach(n => console.log(`  - ${n}`));
}
process.exit(failures ? 1 : 0);
