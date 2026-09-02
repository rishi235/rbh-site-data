// Eighth independent verification pass for AGENT_WORKLIST item 3.7 (Smartts Chemist, Bootle).
// Written fresh, shares no code with tools/check-*.js. Run from repo root: node verify-3.7-2026-09-02-eighth.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const branches = require(path.join(ROOT, 'branches.json')).branches;
const byId = Object.fromEntries(branches.map(b => [b.id, b]));
const me = byId['smartts_bootle'];
if (!me) { console.error('FATAL: smartts_bootle not found in branches.json'); process.exit(2); }

const others = branches.filter(b => b.id !== 'smartts_bootle');

const pageDir = path.join(ROOT, 'modules', 'service', 'pages');
const switchDir = path.join(ROOT, 'modules', 'switch', 'pages');

const pages = [
  'contraception-smartts-bootle.html',
  'earache-treatment-smartts-bootle.html',
  'impetigo-treatment-smartts-bootle.html',
  'insect-bite-treatment-smartts-bootle.html',
  'pharmacy-first-smartts-bootle.html',
  'shingles-treatment-smartts-bootle.html',
  'sinusitis-treatment-smartts-bootle.html',
  'sore-throat-treatment-smartts-bootle.html',
  'travel-clinic-smartts-bootle.html',
  'uti-treatment-smartts-bootle.html',
  'weight-loss-clinic-smartts-bootle.html',
].map(f => path.join(pageDir, f));
pages.push(path.join(switchDir, 'switch-prescriptions-smartts-bootle.html'));

let checks = 0;
let flags = [];

function check(label, cond, detail) {
  checks++;
  if (!cond) flags.push({ label, detail });
}

function stripBuildComment(html) {
  // Blank the leading HTML build comment (documented em-dash exemption, estate-wide).
  return html.replace(/<!--[\s\S]*?-->/, m => ' '.repeat(m.length));
}

for (const file of pages) {
  const name = path.basename(file);
  if (!fs.existsSync(file)) { check(`${name}: file exists`, false, 'missing'); continue; }
  const raw = fs.readFileSync(file, 'utf8');
  const noComment = stripBuildComment(raw);

  // 1. Own postcode present, no other live branch's postcode present.
  check(`${name}: own postcode present`, raw.includes(me.postalCode), me.postalCode);
  for (const ob of others) {
    if (ob.postalCode && raw.includes(ob.postalCode)) {
      check(`${name}: no foreign postcode (${ob.id})`, false, `found ${ob.postalCode}`);
    }
  }

  // 2. Own street address present.
  check(`${name}: own street address present`, raw.includes(me.streetAddress), me.streetAddress);

  // 3. Phone: own number present (digits-normalised), no other live branch's phone digits.
  const digitsOnly = s => (s || '').replace(/\D/g, '');
  const myPhoneDigits = digitsOnly(me.phone);
  check(`${name}: own phone digits present`, digitsOnly(raw).includes(myPhoneDigits) || raw.includes(me.phone));
  for (const ob of others) {
    if (!ob.phone) continue;
    const obDigits = digitsOnly(ob.phone);
    if (obDigits && obDigits !== myPhoneDigits && raw.includes(ob.phone)) {
      check(`${name}: no foreign phone literal (${ob.id})`, false, ob.phone);
    }
  }

  // 4. tel: link matches own phone (E.164-ish or as generated).
  const telMatches = [...raw.matchAll(/href="tel:([^"]+)"/g)].map(m => m[1]);
  for (const t of telMatches) {
    check(`${name}: tel: link is own number (${t})`, digitsOnly(t).endsWith(myPhoneDigits.slice(-10)) || digitsOnly(t) === myPhoneDigits);
  }

  // 5. JSON-LD block: parse, check @type, name, telephone, PostalAddress.
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(`${name}: JSON-LD block present`, !!ldMatch);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(`${name}: JSON-LD parses`, !!ld, ld ? '' : String(ldMatch[1]).slice(0, 80));
    if (ld) {
      check(`${name}: JSON-LD @type is Pharmacy`, ld['@type'] === 'Pharmacy', ld['@type']);
      check(`${name}: JSON-LD @context is schema.org`, ld['@context'] === 'https://schema.org', ld['@context']);
      check(`${name}: JSON-LD name is branch/brand label`, ld.name === me.branchName || ld.name === me.brandLabel, ld.name);
      check(`${name}: JSON-LD telephone matches`, ld.telephone === me.phone, ld.telephone);
      if (ld.address) {
        check(`${name}: JSON-LD streetAddress`, ld.address.streetAddress === me.streetAddress, ld.address.streetAddress);
        check(`${name}: JSON-LD addressLocality`, ld.address.addressLocality === me.addressLocality, ld.address.addressLocality);
        check(`${name}: JSON-LD postalCode`, ld.address.postalCode === me.postalCode, ld.address.postalCode);
        check(`${name}: JSON-LD addressRegion`, ld.address.addressRegion === me.addressRegion, ld.address.addressRegion);
        check(`${name}: JSON-LD addressCountry`, ld.address.addressCountry === me.addressCountry, ld.address.addressCountry);
      } else {
        check(`${name}: JSON-LD has address block`, false);
      }
    }
  }

  // 6. data-branch attribute, if present, names this branch (branchName or brandLabel), not another branch's.
  const dataBranchMatch = raw.match(/data-branch="([^"]*)"/);
  if (dataBranchMatch) {
    const val = dataBranchMatch[1];
    check(`${name}: data-branch names own branch`, val === me.branchName || val === me.brandLabel, val);
    for (const ob of others) {
      if (val === ob.branchName || (ob.brandLabel && val === ob.brandLabel && ob.brandLabel !== me.brandLabel)) {
        check(`${name}: data-branch not another branch's name (${ob.id})`, false, val);
      }
    }
  }

  // 7. data-wa attribute, if present, is the estate WhatsApp number.
  const dataWaMatch = raw.match(/data-wa="([^"]*)"/);
  if (dataWaMatch) {
    check(`${name}: data-wa is E.164 UK mobile`, /^447\d{9}$/.test(dataWaMatch[1]), dataWaMatch[1]);
  }

  // 8. Cross-town seoTown guard: no other live branch's seoTown named as a whole word,
  //    unless that town is in this branch's own serviceAreaList.
  const areaList = me.serviceAreaList || [];
  const seoTowns = new Set(others.map(o => o.seoTown).filter(Boolean));
  for (const town of seoTowns) {
    if (town === me.seoTown) continue;
    const re = new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(noComment) && !areaList.includes(town)) {
      check(`${name}: no foreign seoTown "${town}" without serviceAreaList excuse`, false, town);
    }
  }

  // 9. No em dash outside the build-comment exemption.
  check(`${name}: no em dash outside build comment`, !noComment.includes('—') && !noComment.includes('&mdash;'));

  // 10. No other branch's Appointedd widget id anywhere on the page.
  const myWidgetIds = new Set(Object.values(me.widgets || {}));
  for (const ob of others) {
    for (const [svc, wid] of Object.entries(ob.widgets || {})) {
      if (wid && !myWidgetIds.has(wid) && raw.includes(wid)) {
        check(`${name}: no foreign widget id (${ob.id}/${svc})`, false, wid);
      }
    }
  }

  // 11. Map query decodes to this branch's own address.
  const mapMatch = raw.match(/google\.com\/maps\?q=([^&"]+)/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1].replace(/\+/g, ' '));
    const expected = `${me.streetAddress}, ${me.addressLocality}, ${me.postalCode}`;
    check(`${name}: map query decodes to own address`, decoded === expected, decoded);
  } else {
    check(`${name}: map embed present`, false, 'no google.com/maps?q= match');
  }

  // 12. No plain http:// links (all should be https).
  check(`${name}: no http:// links`, !/href="http:\/\//.test(raw));

  // 13. No other live branch's ODS code, review URL, or Pharmacy First link.
  for (const ob of others) {
    if (ob.odsCode && raw.includes(ob.odsCode)) check(`${name}: no foreign ODS code (${ob.id})`, false, ob.odsCode);
    if (ob.googleReviewUrl && raw.includes(ob.googleReviewUrl)) check(`${name}: no foreign review URL (${ob.id})`, false, ob.googleReviewUrl);
    if (ob.pfLink && raw.includes(ob.pfLink)) check(`${name}: no foreign pfLink (${ob.id})`, false, ob.pfLink);
  }

  // 14. hasApp consistency: Smartts is a member (hasApp true) - switch page should carry app card;
  //     service pages should not carry a store URL at all (app card lives only on switch pages).
  const isSwitch = name.startsWith('switch-');
  const hasStoreUrl = /apps\.apple\.com|play\.google\.com/.test(raw);
  if (isSwitch) {
    check(`${name}: app card present (hasApp=true)`, hasStoreUrl);
  } else {
    check(`${name}: no store URL on non-switch page`, !hasStoreUrl);
  }
}

console.log(`Checks run: ${checks}`);
console.log(`Flags: ${flags.length}`);
for (const f of flags) console.log(`  FLAG: ${f.label} -- ${f.detail || ''}`);
process.exit(flags.length ? 1 : 0);
