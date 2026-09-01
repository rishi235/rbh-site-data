// Independent verification script for item 3.7 (Smartts Chemist Bootle), seventh quality pass.
// Written fresh, shares no code with tools/. 2026-09-01.
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('branches.json', 'utf8'));
const branches = data.branches.filter(b => !b.disposed);
const me = branches.find(b => b.id === 'smartts_bootle');
if (!me) { console.error('smartts_bootle not found or disposed'); process.exit(1); }

const others = branches.filter(b => b.id !== me.id);

const pages = [
  'modules/service/pages/contraception-smartts-bootle.html',
  'modules/service/pages/earache-treatment-smartts-bootle.html',
  'modules/service/pages/impetigo-treatment-smartts-bootle.html',
  'modules/service/pages/insect-bite-treatment-smartts-bootle.html',
  'modules/service/pages/pharmacy-first-smartts-bootle.html',
  'modules/service/pages/shingles-treatment-smartts-bootle.html',
  'modules/service/pages/sinusitis-treatment-smartts-bootle.html',
  'modules/service/pages/sore-throat-treatment-smartts-bootle.html',
  'modules/service/pages/travel-clinic-smartts-bootle.html',
  'modules/service/pages/uti-treatment-smartts-bootle.html',
  'modules/service/pages/weight-loss-clinic-smartts-bootle.html',
  'modules/switch/pages/switch-prescriptions-smartts-bootle.html',
];

let checks = 0, flags = 0;
const flagLines = [];
function flag(file, msg) {
  flags++;
  flagLines.push(`${file}: ${msg}`);
}
function check(cond, file, msg) {
  checks++;
  if (!cond) flag(file, msg);
}

// Blank out the HTML build comment (documented estate-wide em-dash exemption)
// before em-dash scanning, same convention check-em-dashes.js uses.
function stripBuildComment(html) {
  return html.replace(/<!--[\s\S]*?-->/, m => ' '.repeat(m.length));
}

const otherPhones = others.map(b => (b.phone || '').replace(/\D/g, '')).filter(Boolean);
const otherPostcodes = others.map(b => (b.postalCode || '').toUpperCase()).filter(Boolean);
const otherStreets = others.map(b => b.streetAddress).filter(Boolean);
const otherOds = others.map(b => b.odsCode).filter(Boolean);
const otherSeoTowns = others.map(b => b.seoTown).filter(Boolean);
const otherWidgetIds = [];
for (const b of others) {
  if (b.widgets) for (const k of Object.keys(b.widgets)) otherWidgetIds.push(b.widgets[k]);
}
const myWidgetIds = new Set(Object.values(me.widgets || {}));
const myPhoneDigits = me.phone.replace(/\D/g, '');

for (const file of pages) {
  if (!fs.existsSync(file)) { flag(file, 'FILE MISSING'); continue; }
  const raw = fs.readFileSync(file, 'utf8');
  const html = stripBuildComment(raw);

  // 1. exactly one h1, contains Bootle
  const h1s = [...raw.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  check(h1s.length === 1, file, `expected 1 h1, found ${h1s.length}`);
  if (h1s.length >= 1) {
    check(/Bootle/.test(h1s[0][1]), file, 'h1 does not contain Bootle');
  }

  // 2. own phone present (tel: and visible), no other branch's phone digits
  check(raw.includes(`tel:${me.phone.replace(/\s/g, '')}`) || new RegExp(`tel:\\+?44?${myPhoneDigits.slice(-10)}`).test(raw) || raw.includes(me.phone), file, 'own phone not found in expected form');
  check(raw.includes(me.phone), file, 'own visible phone string not found');
  for (const digits of otherPhones) {
    if (digits && digits !== myPhoneDigits && raw.replace(/\D/g, '').includes(digits)) {
      flag(file, `carries another branch's phone digits (${digits})`);
    }
    checks++;
  }

  // 3. own postcode present, no other branch's postcode
  check(raw.toUpperCase().includes(me.postalCode.toUpperCase()), file, 'own postcode not found');
  for (const pc of otherPostcodes) {
    check(!raw.toUpperCase().includes(pc), file, `carries another branch's postcode (${pc})`);
  }

  // 4. own street address present, no other branch's street
  check(raw.includes(me.streetAddress), file, 'own street address not found');
  for (const st of otherStreets) {
    if (st !== me.streetAddress) check(!raw.includes(st), file, `carries another branch's street address (${st})`);
  }

  // 5. JSON-LD
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { flag(file, `JSON-LD does not parse: ${e.message}`); }
    if (ld) {
      check(ld['@type'] === 'Pharmacy', file, `JSON-LD @type is ${ld['@type']}, expected Pharmacy`);
      check(ld.telephone === me.phone, file, `JSON-LD telephone mismatch: ${ld.telephone}`);
      if (ld.address) {
        check(ld.address.streetAddress === me.streetAddress, file, 'JSON-LD streetAddress mismatch');
        check(ld.address.postalCode === me.postalCode, file, 'JSON-LD postalCode mismatch');
        check(ld.address.addressLocality === me.addressLocality, file, 'JSON-LD addressLocality mismatch');
        check(ld.address.addressRegion === me.addressRegion, file, 'JSON-LD addressRegion mismatch');
      } else {
        flag(file, 'JSON-LD has no address block');
      }
    }
  } else {
    checks++; // pfLink-only pages / switch pages may not carry JSON-LD; not flagged as a failure by itself
  }

  // 6. data-wa correct where present
  const waMatch = raw.match(/data-wa="([^"]+)"/);
  if (waMatch) {
    check(waMatch[1] === me.whatsapp, file, `data-wa mismatch: ${waMatch[1]}`);
  }

  // 7. cross-town naming guard: no other branch's seoTown, unless in me.serviceAreaList
  for (const town of otherSeoTowns) {
    if (town === me.seoTown) continue;
    if ((me.serviceAreaList || []).includes(town)) continue;
    const re = new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    check(!re.test(raw), file, `carries another live branch's seoTown "${town}" without a serviceAreaList excuse`);
  }

  // 8. hasApp: switch page should carry app card iff hasApp true
  if (file.includes('/switch/')) {
    if (me.hasApp) {
      check(/RB Healthcare Pharmacy app/i.test(raw) || /download.*app/i.test(raw), file, 'hasApp true but no app card text found');
    }
  }

  // 9. em dash scan (build comment stripped)
  check(!/—/.test(html), file, 'em dash found outside build comment');

  // 10. no other branch's Appointedd widget id
  for (const wid of otherWidgetIds) {
    if (myWidgetIds.has(wid)) continue; // shared id at another brand, allowed
    if (raw.includes(wid)) flag(file, `carries another branch's widget id (${wid})`);
    checks++;
  }

  // 11. map query decodes to own address
  const mapMatch = raw.match(/google\.com\/maps\?q=([^"&]+)/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1].replace(/\+/g, ' '));
    const expected = `${me.streetAddress}, ${me.addressLocality}, ${me.postalCode}`;
    check(decoded === expected, file, `map query decodes to "${decoded}", expected "${expected}"`);
  } else {
    checks++;
  }

  // 12. no other branch's ODS code
  for (const ods of otherOds) {
    check(!raw.includes(ods), file, `carries another branch's ODS code (${ods})`);
  }

  // 13. no http:// (non-https) links
  check(!/href="http:\/\//.test(raw) && !/src="http:\/\//.test(raw), file, 'contains a non-https href/src');

  // 14. no other trading branch's brandLabel
  for (const b of others) {
    if (b.brandLabel === me.brandLabel) continue;
    const re = new RegExp(b.brandLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    check(!re.test(raw), file, `carries another branch's brandLabel "${b.brandLabel}"`);
  }
}

console.log(`Files checked: ${pages.length}`);
console.log(`Total checks: ${checks}`);
console.log(`Flags: ${flags}`);
if (flags) {
  console.log('--- FLAGS ---');
  flagLines.forEach(l => console.log(l));
}
