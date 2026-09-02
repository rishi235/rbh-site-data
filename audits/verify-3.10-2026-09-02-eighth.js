// Independent re-verification of item 3.10 (Riddings Pharmacy, Timperley), eighth pass.
// Shares no code with tools/*.js or any prior verify-3.10-*.js. Read-only.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;
const me = branches.find(b => b.id === 'riddings_timperley');
if (!me) { console.error('FAIL: riddings_timperley not found in branches.json'); process.exit(1); }
const others = branches.filter(b => b.id !== me.id && !b.disposed);

const files = [
  'modules/service/pages/contraception-riddings-timperley.html',
  'modules/service/pages/earache-treatment-riddings-timperley.html',
  'modules/service/pages/impetigo-treatment-riddings-timperley.html',
  'modules/service/pages/insect-bite-treatment-riddings-timperley.html',
  'modules/service/pages/pharmacy-first-riddings-timperley.html',
  'modules/service/pages/shingles-treatment-riddings-timperley.html',
  'modules/service/pages/sinusitis-treatment-riddings-timperley.html',
  'modules/service/pages/sore-throat-treatment-riddings-timperley.html',
  'modules/service/pages/travel-clinic-riddings-timperley.html',
  'modules/service/pages/uti-treatment-riddings-timperley.html',
  'modules/service/pages/weight-loss-clinic-riddings-timperley.html',
  'modules/switch/pages/switch-prescriptions-riddings-timperley.html',
];

let failures = 0;
let checks = 0;
function fail(msg) { failures++; console.log('FAIL: ' + msg); }
function ok() { checks++; }

const phoneDigits = me.phone.replace(/\D/g, '');
const streetAddress = me.streetAddress;
const postcode = me.postalCode;
const seoTown = me.seoTown;

for (const rel of files) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { fail(`missing file ${rel}`); continue; }
  const html = fs.readFileSync(p, 'utf8');
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');

  // 1. Own postcode present, no other live branch's postcode
  if (!noComments.includes(postcode)) fail(`${rel}: own postcode ${postcode} not found`); else ok();
  for (const o of others) {
    if (o.postalCode && o.postalCode !== postcode && noComments.includes(o.postalCode)) {
      fail(`${rel}: contains foreign postcode ${o.postalCode} (${o.branchName})`);
    } else ok();
  }

  // 2. Phone: every tel: href and visible phone-shaped number must be this branch's
  const telHrefs = [...noComments.matchAll(/href="tel:([^"]+)"/g)].map(m => m[1].replace(/\D/g, ''));
  for (const t of telHrefs) {
    // UK numbers with/without leading 44 vs 0
    const norm = t.replace(/^44/, '0');
    if (norm !== phoneDigits) fail(`${rel}: tel href ${t} does not match branch phone ${phoneDigits}`);
    else ok();
  }
  for (const o of others) {
    if (!o.phone) continue;
    const oDigits = o.phone.replace(/\D/g, '');
    if (oDigits !== phoneDigits && noComments.includes(o.phone)) {
      fail(`${rel}: contains foreign phone ${o.phone} (${o.branchName})`);
    } else ok();
  }

  // 3. seoTown present, no other live branch's seoTown unless in serviceAreaList
  if (seoTown && !new RegExp(`\\b${seoTown}\\b`).test(noComments)) {
    fail(`${rel}: own seoTown "${seoTown}" not found`);
  } else ok();
  for (const o of others) {
    if (!o.seoTown || o.seoTown === seoTown) continue;
    const allowed = (me.serviceAreaList || []).includes(o.seoTown);
    const re = new RegExp(`\\b${o.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (!allowed && re.test(noComments)) {
      fail(`${rel}: contains foreign seoTown "${o.seoTown}" (${o.branchName}) without serviceAreaList excuse`);
    } else ok();
  }

  // 4. brandLabel spelling
  if (!noComments.includes(me.brandLabel)) fail(`${rel}: brandLabel "${me.brandLabel}" not found verbatim`); else ok();

  // 5. JSON-LD block: parse and check key fields
  const ldMatch = noComments.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) {
    fail(`${rel}: no JSON-LD block found`);
  } else {
    ok();
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { fail(`${rel}: JSON-LD does not parse: ${e.message}`); ld = null; }
    if (ld) {
      if (ld['@type'] !== 'Pharmacy' && ld['@type'] !== 'MedicalBusiness') fail(`${rel}: JSON-LD @type unexpected "${ld['@type']}"`); else ok();
      if (ld.telephone && ld.telephone.replace(/\D/g, '') !== phoneDigits) fail(`${rel}: JSON-LD telephone mismatch`); else ok();
      if (ld.address) {
        if (ld.address.streetAddress !== streetAddress) fail(`${rel}: JSON-LD streetAddress mismatch: got "${ld.address.streetAddress}"`); else ok();
        if (ld.address.postalCode !== postcode) fail(`${rel}: JSON-LD postalCode mismatch`); else ok();
        if (ld.address.addressRegion !== me.addressRegion) fail(`${rel}: JSON-LD addressRegion mismatch`); else ok();
      } else {
        fail(`${rel}: JSON-LD has no address block`);
      }
    }
  }

  // 6. Map embed query decodes to this branch's address
  const mapMatch = noComments.match(/google\.com\/maps\/embed\?[^"']*[?&]q=([^"'&]+)/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1].replace(/\+/g, ' '));
    const expected = `${streetAddress}, ${me.addressLocality}, ${postcode}`;
    if (decoded !== expected) fail(`${rel}: map query "${decoded}" != expected "${expected}"`); else ok();
  } else {
    ok(); // not every page type necessarily carries a map (module fragments may rely on a shared card); noted, not failed here
  }

  // 7. No em or en dash (literal or entity)
  if (/[–—]|&ndash;|&mdash;/.test(noComments)) fail(`${rel}: em/en dash found`); else ok();

  // 8. data-wa matches agreed WhatsApp number if present
  const waMatch = noComments.match(/data-wa="([^"]+)"/);
  if (waMatch) {
    if (waMatch[1] !== '447521775631') fail(`${rel}: data-wa is ${waMatch[1]}, expected 447521775631`); else ok();
  } else ok();

  // 9. data-branch names this branch, never another
  const dbMatch = noComments.match(/data-branch="([^"]+)"/);
  if (dbMatch) {
    if (dbMatch[1] !== me.branchName && dbMatch[1] !== me.brandLabel) fail(`${rel}: data-branch "${dbMatch[1]}" is not this branch's name`); else ok();
  } else ok();
}

console.log(`\n${checks} checks across ${files.length} pages, ${failures} failure(s).`);
process.exit(failures > 0 ? 1 : 0);
