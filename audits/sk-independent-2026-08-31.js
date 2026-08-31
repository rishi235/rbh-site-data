// Independent extraction check for the 12 SK Chemists Bootle pages, item 3.8
// fifth quality pass, 2026-08-31. Shares no code with tools/check-*.js by
// design: it re-derives the expected facts from branches.json and reads the
// pages with its own regexes, so it cannot pass for the same reason a
// checker with a bug would pass.
//
// Run: node audits/sk-independent-2026-08-31.js
// Result recorded this run: 696 checks, 0 flags, 12 files.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const branches = require(path.join(ROOT, 'branches.json')).branches;
const sk = branches.find(b => b.id === 'skchemists_bootle');
const others = branches.filter(b => b.id !== 'skchemists_bootle' && !b.disposed);

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
  'modules/switch/pages/switch-prescriptions-sk-chemists-bootle.html'
];

let totalChecks = 0, flags = 0;
function check(cond, msg, file) {
  totalChecks++;
  if (!cond) { flags++; console.log('FLAG:', file, '-', msg); }
}

for (const rel of files) {
  const full = path.join(ROOT, rel);
  const html = fs.readFileSync(full, 'utf8');

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  check(h1s.length === 1, `expected exactly 1 H1, found ${h1s.length}`, rel);
  if (h1s.length >= 1) check(h1s[0].includes('Bootle'), `H1 "${h1s[0]}" missing Bootle`, rel);

  const telHrefs = [...html.matchAll(/href="tel:([^"]+)"/g)].map(m => m[1]);
  const ownPhoneDigits = sk.phone.replace(/\D/g, '');
  const telOk = telHrefs.some(t => t.replace(/\D/g, '').endsWith(ownPhoneDigits) || ownPhoneDigits.endsWith(t.replace(/\D/g, '')));
  check(telHrefs.length > 0, 'no tel: link found', rel);
  check(telOk, `tel hrefs ${JSON.stringify(telHrefs)} do not match own phone ${sk.phone}`, rel);

  for (const ob of others) {
    if (!ob.phone) continue;
    const obDigits = ob.phone.replace(/\D/g, '');
    if (obDigits.length < 8) continue;
    check(!html.replace(/\D/g, '').includes(obDigits), `contains another branch's phone digits (${ob.branchName || ob.brandLabel} ${ob.phone})`, rel);
  }

  check(html.includes(sk.postalCode), `missing own postcode ${sk.postalCode}`, rel);
  for (const ob of others) {
    if (!ob.postalCode || ob.postalCode === sk.postalCode) continue;
    check(!html.includes(ob.postalCode), `contains another branch's postcode ${ob.postalCode} (${ob.branchName || ob.brandLabel})`, rel);
  }

  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(!!ldMatch, 'no JSON-LD block found', rel);
  if (ldMatch) {
    let ld; try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(!!ld, 'JSON-LD failed to parse', rel);
    if (ld) {
      check(ld['@type'] === 'Pharmacy', `@type is ${ld['@type']}, expected Pharmacy`, rel);
      check(ld.telephone === sk.phone, `JSON-LD telephone "${ld.telephone}" != "${sk.phone}"`, rel);
      if (ld.address) {
        check(ld.address.streetAddress === sk.streetAddress, `JSON-LD street mismatch`, rel);
        check(ld.address.postalCode === sk.postalCode, `JSON-LD postcode mismatch`, rel);
        check(ld.address.addressRegion === sk.addressRegion, `JSON-LD region mismatch`, rel);
      } else {
        check(false, 'JSON-LD has no address block', rel);
      }
    }
  }

  const dbMatch = html.match(/data-branch="([^"]+)"/);
  if (dbMatch) check(dbMatch[1] === sk.branchName || dbMatch[1] === sk.brandLabel, `data-branch "${dbMatch[1]}" not branchName/brandLabel`, rel);

  const visibleText = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  for (const ob of others) {
    if (!ob.brandLabel || ob.brandLabel === sk.brandLabel) continue;
    check(!visibleText.includes(ob.brandLabel), `visible text mentions another brand "${ob.brandLabel}"`, rel);
  }

  check(!others.some(ob => ob.odsCode && ob.odsCode !== sk.odsCode && html.includes(ob.odsCode)), 'contains another branch ODS code', rel);
}

console.log(`\nTotal checks: ${totalChecks}, flags: ${flags}, files: ${files.length}`);
