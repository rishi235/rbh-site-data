// Independent extraction for AGENT_WORKLIST item 3.8 (SK Chemists, Bootle),
// sixth quality pass, 2026-09-01. Fresh regexes, no code shared with tools/.
// Reads branches.json as data only; does not import any tools/check-*.js.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;

const SELF_ID = 'skchemists_bootle';
const self = branches.find(b => b.id === SELF_ID);
if (!self) { console.error('FATAL: branch not found'); process.exit(1); }

const others = branches.filter(b => b.id !== SELF_ID && !b.disposed);

const pageDir = path.join(ROOT, 'modules', 'service', 'pages');
const switchDir = path.join(ROOT, 'modules', 'switch', 'pages');

const files = [
  'contraception-sk-chemists-bootle.html',
  'earache-treatment-sk-chemists-bootle.html',
  'impetigo-treatment-sk-chemists-bootle.html',
  'insect-bite-treatment-sk-chemists-bootle.html',
  'pharmacy-first-sk-chemists-bootle.html',
  'shingles-treatment-sk-chemists-bootle.html',
  'sinusitis-treatment-sk-chemists-bootle.html',
  'sore-throat-treatment-sk-chemists-bootle.html',
  'travel-clinic-sk-chemists-bootle.html',
  'uti-treatment-sk-chemists-bootle.html',
  'weight-loss-clinic-sk-chemists-bootle.html',
].map(f => ({ file: f, full: path.join(pageDir, f) }));
files.push({ file: 'switch-prescriptions-sk-chemists-bootle.html', full: path.join(switchDir, 'switch-prescriptions-sk-chemists-bootle.html') });

let checks = 0;
let flags = [];

function check(cond, label, file) {
  checks++;
  if (!cond) flags.push(`${file}: ${label}`);
}

const ownPhoneDigits = self.phone.replace(/\D/g, ''); // 1519441013
const ownPostcode = self.postalCode; // L20 5DW
const ownTel = 'tel:' + '0' + ownPhoneDigits; // matches 01519441013 as seen in file
const ownStreet = self.streetAddress;
const ownOds = self.odsCode;
const ownWa = self.whatsapp;

for (const { file, full } of files) {
  if (!fs.existsSync(full)) { flags.push(`${file}: FILE MISSING`); checks++; continue; }
  const raw = fs.readFileSync(full, 'utf8');
  // strip HTML comments for "visible copy" style checks, but keep raw for attribute checks
  const noComments = raw.replace(/<!--[\s\S]*?-->/g, '');

  // 1. exactly one H1, and it names Bootle
  const h1s = [...raw.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  check(h1s.length === 1, `expected exactly one <h1>, found ${h1s.length}`, file);
  if (h1s.length >= 1) {
    check(/Bootle/.test(h1s[0][1]), 'H1 does not name Bootle', file);
  }

  // 2. own phone present in tel: and visible form; no other branch's phone digits anywhere
  const hasTelLink = raw.includes(ownTel) || new RegExp('tel:0?' + ownPhoneDigits).test(raw);
  check(hasTelLink, 'no tel: link for own phone number found', file);
  const visiblePhonePattern = new RegExp(self.phone.replace(/\s/g, '\\s*'));
  check(visiblePhonePattern.test(noComments), 'no visible own phone number found', file);

  for (const o of others) {
    if (!o.phone) continue;
    const oDigits = o.phone.replace(/\D/g, '');
    if (raw.includes(oDigits)) flags.push(`${file}: contains OTHER branch phone digits (${o.id}: ${oDigits})`);
    checks++;
  }

  // 3. own postcode present; no other branch's postcode present
  check(raw.includes(ownPostcode), 'own postcode not found', file);
  for (const o of others) {
    if (!o.postalCode) continue;
    if (o.postalCode !== ownPostcode && raw.includes(o.postalCode)) {
      flags.push(`${file}: contains OTHER branch postcode (${o.id}: ${o.postalCode})`);
    }
    checks++;
  }

  // 4. own street address present
  check(raw.includes(ownStreet), 'own street address not found', file);

  // 5. no other trading branch's brandLabel appears in visible copy (own brandLabel is "SK Chemists")
  for (const o of others) {
    if (!o.brandLabel || o.brandLabel === self.brandLabel) continue;
    const re = new RegExp('\\b' + o.brandLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(noComments)) flags.push(`${file}: contains OTHER branch brandLabel (${o.id}: ${o.brandLabel})`);
    checks++;
  }

  // 6. no other branch's seoTown appears unless in own serviceAreaList
  const ownAreas = new Set((self.serviceAreaList || []).map(s => s.toLowerCase()));
  const seenTowns = new Set();
  for (const o of others) {
    if (!o.seoTown) continue;
    if (seenTowns.has(o.seoTown)) continue;
    seenTowns.add(o.seoTown);
    if (o.seoTown === self.seoTown) continue;
    const re = new RegExp('\\b' + o.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(noComments) && !ownAreas.has(o.seoTown.toLowerCase())) {
      flags.push(`${file}: names OTHER branch's seoTown "${o.seoTown}" (${o.id}) not in own serviceAreaList`);
    }
    checks++;
  }

  // 7. data-wa carries own WhatsApp number; no foreign WhatsApp number present
  const waMatch = raw.match(/data-wa="(\d+)"/);
  if (waMatch) {
    check(waMatch[1] === ownWa, `data-wa is ${waMatch[1]}, expected ${ownWa}`, file);
  }
  // scan for any other branch's whatsapp digit string appearing where it shouldn't (only relevant if it differs)
  for (const o of others) {
    if (!o.whatsapp || o.whatsapp === ownWa) continue;
    if (raw.includes(o.whatsapp)) flags.push(`${file}: contains OTHER branch WhatsApp number (${o.id}: ${o.whatsapp})`);
    checks++;
  }

  // 8. JSON-LD block: parses, and matches branches.json field by field where present
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try {
      ld = JSON.parse(ldMatch[1]);
      checks++;
    } catch (e) {
      flags.push(`${file}: JSON-LD does not parse: ${e.message}`);
      checks++;
      ld = null;
    }
    if (ld) {
      check(ld['@context'] === 'https://schema.org', 'JSON-LD @context wrong', file);
      check(ld['@type'] === 'Pharmacy', `JSON-LD @type is ${ld['@type']}, expected Pharmacy`, file);
      check(ld.name === self.brandLabel || ld.name === self.branchName, `JSON-LD name "${ld.name}" matches neither brandLabel nor branchName`, file);
      check(ld.telephone === self.phone, `JSON-LD telephone "${ld.telephone}" != "${self.phone}"`, file);
      if (ld.address) {
        check(ld.address.streetAddress === self.streetAddress, 'JSON-LD streetAddress mismatch', file);
        check(ld.address.addressLocality === self.addressLocality, 'JSON-LD addressLocality mismatch', file);
        check(ld.address.postalCode === self.postalCode, 'JSON-LD postalCode mismatch', file);
        check(ld.address.addressRegion === self.addressRegion, 'JSON-LD addressRegion mismatch', file);
        check(ld.address.addressCountry === self.addressCountry, 'JSON-LD addressCountry mismatch', file);
      } else {
        flags.push(`${file}: JSON-LD has no address block`); checks++;
      }
    }
  } else {
    // switch pages may structure differently; only flag for service pages
    if (!file.startsWith('switch-')) { flags.push(`${file}: no JSON-LD block found`); checks++; }
  }

  // 9. no non-https href/src (bare http://)
  const httpLinks = [...raw.matchAll(/(?:href|src)="http:\/\/[^"]*"/g)];
  check(httpLinks.length === 0, `found ${httpLinks.length} non-https http:// link(s)`, file);

  // 10. map iframe query decodes to own address
  const mapMatch = raw.match(/maps\?q=([^&"]+)&output=embed/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1]);
    const expected = `${self.streetAddress}, ${self.addressLocality}, ${self.postalCode}`;
    check(decoded === expected, `map query "${decoded}" != expected "${expected}"`, file);
  } else {
    flags.push(`${file}: no map embed query found`); checks++;
  }

  // 11. own ODS code present where NHS review link appears (service pages typically don't print ODS, but pfLink pages reference it via nhsReviewUrl elsewhere - skip if absent)
  // Not all pages carry the review link; only assert no OTHER branch's ODS code appears.
  for (const o of others) {
    if (!o.odsCode) continue;
    if (o.odsCode !== ownOds && raw.includes(o.odsCode)) {
      flags.push(`${file}: contains OTHER branch ODS code (${o.id}: ${o.odsCode})`);
    }
    checks++;
  }
}

console.log(`Independent extraction for 3.8 (SK Chemists, Bootle): ${files.length} files, ${checks} checks, ${flags.length} flags.`);
if (flags.length) {
  console.log('FLAGS:');
  for (const f of flags) console.log(' - ' + f);
  process.exit(1);
} else {
  console.log('CLEAN.');
}
