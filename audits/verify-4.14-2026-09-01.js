// Independent verification for item 4.14 (Gordon Short Chemist Crosby GBP
// pack), eighth pass, following the seventh pass on 2026-08-31. Imports
// nothing from tools/; reads branches.json and the pack directly with its
// own regexes, same convention as other items' verify-*.js scripts (e.g.
// verify-4.10-2026-09-01.js, verify-3.3-2026-09-01.js).
'use strict';
const fs = require('fs');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8'));
const b = branches.branches.find(x => x.id === 'gordonshorts_crosby');
if (!b) { console.error('FAIL: gordonshorts_crosby not found in branches.json'); process.exit(1); }

const pack = fs.readFileSync('gbp-packs/gordon-short-crosby.md', 'utf8');

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
check('hasApp is false and pack makes no app claim', b.hasApp === false && !/\bthe app\b/i.test(pack));

// Hours: Mon-Fri two sessions, Saturday two DIFFERENT-length sessions, Sunday closed
const spec = b.openingHours.specification;
const weekdayAm = spec.find(s => s.opens === '09:00' && s.closes === '13:00' && s.dayOfWeek.includes('Monday'));
const weekdayPm = spec.find(s => s.opens === '14:00' && s.closes === '18:00' && s.dayOfWeek.includes('Monday'));
const satAm = spec.find(s => s.opens === '09:00' && s.closes === '13:00' && s.dayOfWeek.includes('Saturday') && !s.dayOfWeek.includes('Monday'));
const satPm = spec.find(s => s.opens === '14:00' && s.closes === '17:00' && s.dayOfWeek.includes('Saturday'));
check('Weekday AM session (09:00-13:00, Mon-Fri) present in branches.json', !!weekdayAm && weekdayAm.dayOfWeek.length === 5);
check('Weekday PM session (14:00-18:00, Mon-Fri) present in branches.json', !!weekdayPm && weekdayPm.dayOfWeek.length === 5);
check('Saturday AM session (09:00-13:00) present as its own entry', !!satAm);
check('Saturday PM session (14:00-17:00, shorter than weekday) present', !!satPm);
check('closedDays is exactly Sunday', JSON.stringify(b.openingHours.closedDays) === JSON.stringify(['Sunday']));
check('Pack states weekday hours 9:00am to 1:00pm and 2:00pm to 6:00pm',
  pack.includes('Monday to Friday 9:00am to 1:00pm and 2:00pm to 6:00pm'));
check('Pack states Saturday hours 9:00am to 1:00pm and 2:00pm to 5:00pm (shorter than weekday)',
  pack.includes('Saturday\n  9:00am to 1:00pm and 2:00pm to 5:00pm'));
check('Pack states Sunday closed', pack.includes('Sunday closed'));

// Catchment: Crosby, Waterloo, Sefton, leading with own seoTown, in three places
check('serviceAreaList is exactly Crosby, Waterloo, Sefton',
  JSON.stringify(b.serviceAreaList) === JSON.stringify(['Crosby', 'Waterloo', 'Sefton']));
const catchmentMentions = (pack.match(/Crosby, Waterloo and (the wider )?Sefton|Crosby, Waterloo and Sefton/g) || []).length;
check('Catchment phrase "Crosby, Waterloo and Sefton" (or "the wider Sefton area") appears at least 3 times',
  catchmentMentions >= 3);
check('Description leads with own seoTown (Crosby)', /serving Crosby, Waterloo/i.test(pack));

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

// Post links: Post A must be the pfLink (PF_TARGET_HOLD, Q32 STOP), never the
// branch-specific generated page, which still carries the wrong live name.
const postLinks = [...pack.matchAll(/Button: [^-]*-> (https:\/\/www\.gordonshortchemist\.co\.uk\/[^\s]+)/g)]
  .map(m => m[1]);
check('Found 4 post buttons', postLinks.length === 4);
check('Post A link is exactly the branches.json pfLink (PF_TARGET_HOLD/Q32 STOP honoured)',
  postLinks[0] === b.pfLink);
check('Post A link is NOT the branch-specific generated Pharmacy First page (still wrong live name)',
  postLinks[0] !== 'https://www.gordonshortchemist.co.uk/pharmacy-first-gordon-short-crosby.html');

const expectedFiles = {
  'https://www.gordonshortchemist.co.uk/switch-prescriptions-gordon-short-crosby.html': 'modules/switch/pages/switch-prescriptions-gordon-short-crosby.html',
  'https://www.gordonshortchemist.co.uk/weight-loss-clinic-gordon-short-crosby.html': 'modules/service/pages/weight-loss-clinic-gordon-short-crosby.html',
  'https://www.gordonshortchemist.co.uk/travel-clinic-gordon-short-crosby.html': 'modules/service/pages/travel-clinic-gordon-short-crosby.html'
};
for (const link of postLinks) {
  if (link === b.pfLink) { check('Post link ' + link + ' is the known live-only pfLink page', true); continue; }
  const file = expectedFiles[link];
  check('Post link ' + link + ' has a generated file', !!file && fs.existsSync(file));
}

// Character limits on posts (1500 max, GBP)
const posts = [...pack.matchAll(/### Post [A-Z][^\n]*\n([\s\S]*?)\nButton:/g)].map(m => m[1].trim());
check('Found 4 posts', posts.length === 4);
posts.forEach((p, i) => {
  check('Post ' + String.fromCharCode(65 + i) + ' under 1500 chars (' + p.length + ')', p.length <= 1500);
});

// Post C names no medicine, makes no efficacy/outcome claim
const bannedTerms = ['mounjaro', 'wegovy', 'orlistat', 'ozempic', 'saxenda', 'yellow fever'];
const lowerPack = pack.toLowerCase();
bannedTerms.forEach(term => {
  check('No "' + term + '" in pack', !lowerPack.includes(term));
});

// Body-image self-referential weight loss copy (the item 4.14 fifth-pass
// finding, BODY_IMAGE_SELF/BODY_IMAGE_CONTEXT in check-gbp-packs.js) - Post C
// must not carry this class of wording.
const postC = posts[2] || '';
const bodyImageTerms = ['transformation', 'beach body', 'slimmed down', 'a new you', 'body back'];
bodyImageTerms.forEach(term => {
  check('Post C carries no body-image wording ("' + term + '")', !postC.toLowerCase().includes(term));
});

// No em dash / en dash / smart quotes / nbsp
const suspectChars = { 'em dash': '—', 'en dash': '–', 'smart quotes': '‘’“”', 'nbsp': ' ' };
for (const [name, chars] of Object.entries(suspectChars)) {
  let found = false;
  for (const c of chars) if (pack.includes(c)) found = true;
  check('No ' + name + ' in pack', !found);
}

console.log('');
console.log(failures === 0 ? 'ALL CHECKS PASSED' : 'FAILURES: ' + failures);
process.exit(failures === 0 ? 0 : 1);
