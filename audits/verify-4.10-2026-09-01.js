// Independent verification for item 4.10 (Smartts Chemist Bootle GBP pack),
// second recorded pass, following the sole 2026-08-10 pass. Imports nothing
// from tools/; reads branches.json and the pack directly with its own
// regexes, same convention as other items' verify-*.js scripts.
'use strict';
const fs = require('fs');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8'));
const b = branches.branches.find(x => x.id === 'smartts_bootle');
if (!b) { console.error('FAIL: smartts_bootle not found in branches.json'); process.exit(1); }

const pack = fs.readFileSync('gbp-packs/smartts-bootle.md', 'utf8');

let failures = 0;
function check(label, cond) {
  if (cond) { console.log('PASS: ' + label); }
  else { console.log('FAIL: ' + label); failures++; }
}

check('Name on GBP matches brandLabel', pack.includes('Name on GBP: ' + b.brandLabel));
check('Address matches streetAddress/locality/postcode',
  pack.includes(`Address: ${b.streetAddress}, ${b.addressLocality} ${b.postalCode}`));
check('Phone matches', pack.includes('Phone: ' + b.phone));
check('Website matches', pack.includes('Website: ' + b.website));
check('Review link matches', pack.includes('Review link: ' + b.googleReviewUrl));
check('hasApp true and pack mentions app', b.hasApp === true && /\bapp\b/i.test(pack));

// Hours: Mon-Fri split session, Sat/Sun closed
const spec = b.openingHours.specification;
const amSession = spec.find(s => s.opens === '09:00' && s.closes === '13:00');
const pmSession = spec.find(s => s.opens === '14:00' && s.closes === '18:00');
check('Two Mon-Fri sessions present in branches.json (09:00-13:00, 14:00-18:00)',
  !!amSession && !!pmSession);
check('closedDays is exactly Saturday, Sunday',
  JSON.stringify(b.openingHours.closedDays) === JSON.stringify(['Saturday', 'Sunday']));
check('Pack states the two-range hours', pack.includes('9:00am to 1:00pm and 2:00pm to 6:00pm'));
check('Pack states Saturday and Sunday closed', pack.includes('Saturday and Sunday closed'));

// Description length claim
const descMatch = pack.match(/## 1\. Business description \(max 750 chars - this is (\d+)\)\n([\s\S]*?)\n\n## 2/);
if (descMatch) {
  const claimed = parseInt(descMatch[1], 10);
  const actual = descMatch[2].replace(/\n/g, ' ').length;
  check('Business description char count matches claim (' + claimed + ')', claimed === actual);
  check('Business description under 750 chars', actual <= 750);
} else {
  check('Business description section found and parseable', false);
}

// Post links resolve to files that exist in the repo (or are KNOWN live-only)
const postLinks = [...pack.matchAll(/Button: [^-]*-> (https:\/\/www\.smarttschemist\.co\.uk\/[^\s]+)/g)]
  .map(m => m[1]);
check('Found 4 post buttons', postLinks.length === 4);
const expectedFiles = {
  [b.pfLink]: null, // known live-only, exempt via check-service-links KNOWN list
  'https://www.smarttschemist.co.uk/switch-prescriptions-smartts-bootle.html': 'modules/switch/pages/switch-prescriptions-smartts-bootle.html',
  'https://www.smarttschemist.co.uk/weight-loss-clinic-smartts-bootle.html': 'modules/service/pages/weight-loss-clinic-smartts-bootle.html',
  'https://www.smarttschemist.co.uk/travel-clinic-smartts-bootle.html': 'modules/service/pages/travel-clinic-smartts-bootle.html'
};
for (const link of postLinks) {
  if (link === b.pfLink) {
    check('Post A link is pfLink (known live-only page, Q8/Q16)', true);
    continue;
  }
  const file = expectedFiles[link];
  check('Post link ' + link + ' has a generated file', !!file && fs.existsSync(file));
}

// Character limits on posts (1500 max, GBP)
const posts = [...pack.matchAll(/### Post [A-Z][^\n]*\n([\s\S]*?)\nButton:/g)].map(m => m[1].trim());
posts.forEach((p, i) => {
  check('Post ' + String.fromCharCode(65 + i) + ' under 1500 chars (' + p.length + ')', p.length <= 1500);
});

// No medicine/vaccine brand names, no yellow fever claim (not registered per branches.json)
const bannedTerms = ['mounjaro', 'wegovy', 'orlistat', 'ozempic', 'saxenda', 'yellow fever'];
const lowerPack = pack.toLowerCase();
bannedTerms.forEach(term => {
  check('No "' + term + '" in pack', !lowerPack.includes(term));
});

// No em dash / en dash / smart quotes / nbsp
const suspectChars = { 'em dash': '—', 'en dash': '–', 'smart quotes': '‘’“”', 'nbsp': ' ' };
for (const [name, chars] of Object.entries(suspectChars)) {
  let found = false;
  for (const c of chars) if (pack.includes(c)) found = true;
  check('No ' + name + ' in pack', !found);
}

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED (' : 'FAILURES: ' + failures + ' (');
process.exit(failures === 0 ? 0 : 1);
