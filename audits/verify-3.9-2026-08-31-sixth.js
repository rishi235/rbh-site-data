const fs = require('fs');
const path = require('path');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8')).branches;
const b = branches.find(x => x.id === 'colemanleigh_liverpool');
if (!b) { console.error('branch not found'); process.exit(1); }

const files = [
  'modules/service/pages/contraception-coleman-leigh-walton.html',
  'modules/service/pages/earache-treatment-coleman-leigh-walton.html',
  'modules/service/pages/impetigo-treatment-coleman-leigh-walton.html',
  'modules/service/pages/insect-bite-treatment-coleman-leigh-walton.html',
  'modules/service/pages/pharmacy-first-coleman-leigh-walton.html',
  'modules/service/pages/shingles-treatment-coleman-leigh-walton.html',
  'modules/service/pages/sinusitis-treatment-coleman-leigh-walton.html',
  'modules/service/pages/sore-throat-treatment-coleman-leigh-walton.html',
  'modules/service/pages/travel-clinic-coleman-leigh-walton.html',
  'modules/service/pages/uti-treatment-coleman-leigh-walton.html',
  'modules/service/pages/weight-loss-clinic-coleman-leigh-walton.html',
  'modules/switch/pages/switch-prescriptions-coleman-leigh-walton.html',
];

const otherTowns = branches
  .filter(x => x.id !== b.id && x.seoTown && x.disposed !== true)
  .map(x => x.seoTown);
const allowedOtherTowns = new Set((b.serviceAreaList || []).filter(t => t !== b.seoTown));

// POM names union (mirrors pom-names.js structure minimally, read directly)
let pomNames = [];
try {
  const pomSrc = fs.readFileSync('tools/pom-names.js', 'utf8');
  const matches = [...pomSrc.matchAll(/'([^']+)'/g)].map(m => m[1]);
  pomNames = matches.filter(s => /^[A-Za-z][A-Za-z\- ]{2,}$/.test(s));
} catch (e) {}

let checks = 0, fails = [];
function check(cond, msg) { checks++; if (!cond) fails.push(msg); }

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const base = path.basename(f);

  // 1. Phone present and correct everywhere phone-shaped
  const phoneMatches = [...noComments.matchAll(/0\d{3,4}[\s\d]{6,9}/g)].map(m => m[0].replace(/\s+/g, ' ').trim());
  for (const p of phoneMatches) {
    const digitsOnly = p.replace(/\s+/g, '');
    const expectedDigits = b.phone.replace(/\s+/g, '');
    check(digitsOnly === expectedDigits, `${base}: phone-shaped string "${p}" does not match branch phone ${b.phone}`);
  }

  // 2. Postcode present matches
  const postcodeMatches = [...noComments.matchAll(/\bL\d[\dA-Z]?\s?\d[A-Z]{2}\b/g)].map(m => m[0]);
  for (const pc of postcodeMatches) {
    const norm = pc.replace(/\s+/g, '').toUpperCase();
    const expected = b.postalCode.replace(/\s+/g, '').toUpperCase();
    check(norm === expected, `${base}: postcode-shaped string "${pc}" does not match branch postcode ${b.postalCode}`);
  }

  // 3. No em/en dash outside comments
  check(!/—|–/.test(noComments), `${base}: em/en dash found outside build comments`);

  // 4. No other branch's seoTown unless in serviceAreaList
  for (const town of new Set(otherTowns)) {
    if (allowedOtherTowns.has(town)) continue;
    if (town === b.seoTown) continue;
    const re = new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    check(!re.test(noComments), `${base}: mentions other branch's seoTown "${town}" without serviceAreaList excuse`);
  }

  // 5. No POM name anywhere in body
  for (const pom of pomNames) {
    const re = new RegExp(`\\b${pom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    check(!re.test(noComments), `${base}: contains POM name "${pom}"`);
  }

  // 6. brandLabel/branchName correct (Coleman and Leighs Pharmacy, no ampersand, has trailing s)
  check(!/Coleman\s*&\s*Leigh(s)?\b/i.test(noComments), `${base}: contains ampersand "Coleman & Leigh" variant`);
  check(!/Coleman and Leigh\b(?!s)/i.test(noComments), `${base}: contains "Coleman and Leigh" missing trailing s`);

  // 7. data-branch / JSON-LD name check (if module root present)
  const dataBranchMatch = noComments.match(/data-branch="([^"]+)"/);
  if (dataBranchMatch) {
    check(dataBranchMatch[1] === b.branchName || dataBranchMatch[1] === b.brandLabel,
      `${base}: data-branch="${dataBranchMatch[1]}" does not match branchName/brandLabel`);
  }
  const jsonldMatch = noComments.match(/"@type"\s*:\s*"([^"]+)"/);
  if (jsonldMatch) {
    check(jsonldMatch[1] === 'Pharmacy', `${base}: JSON-LD @type is "${jsonldMatch[1]}", expected Pharmacy`);
  }
  const jsonldName = noComments.match(/"name"\s*:\s*"([^"]+)"/);
  if (jsonldName) {
    check(jsonldName[1] === b.branchName || jsonldName[1] === b.brandLabel,
      `${base}: JSON-LD name "${jsonldName[1]}" does not match branchName/brandLabel`);
  }

  // 8. data-wa matches whatsapp field if present
  const waMatch = noComments.match(/data-wa="([^"]+)"/);
  if (waMatch) {
    check(waMatch[1] === b.whatsapp, `${base}: data-wa="${waMatch[1]}" does not match branch whatsapp ${b.whatsapp}`);
  }
}

console.log(`Coleman and Leighs (colemanleigh_liverpool) independent sixth-pass extraction`);
console.log(`Files checked: ${files.length}`);
console.log(`Total checks: ${checks}`);
console.log(`Failures: ${fails.length}`);
fails.forEach(f => console.log(' - ' + f));
process.exit(fails.length ? 1 : 0);
