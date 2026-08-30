// Independent verification of gbp-packs/scorah-bramhall.md (item 4.4 quality pass)
// 2026-08-30. Imports nothing from tools/. Reads branches.json and the pack only.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pack = fs.readFileSync(path.join(root, 'gbp-packs', 'scorah-bramhall.md'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'branches.json'), 'utf8'));
let checks = 0, defects = [], flags = [];
function ok(cond, label, flagOnly) {
  checks++;
  if (!cond) { (flagOnly ? flags : defects).push(label); }
}
const b = data.branches.find(x => x.id === 'scorah_bramhall');
if (!b) { console.error('branch scorah_bramhall not found'); process.exit(2); }
const others = data.branches.filter(x => x.id !== 'scorah_bramhall' && !x.disposed);

// 1. Canonical facts present
ok(pack.includes(b.streetAddress), 'streetAddress present: ' + b.streetAddress);
ok(pack.includes(b.postalCode), 'postalCode present');
ok(pack.includes(b.phone), 'phone present in canonical spaced form: ' + b.phone);
ok(pack.includes(b.googleReviewUrl), 'own review URL present');
ok(pack.toLowerCase().includes(b.addressLocality.toLowerCase()), 'addressLocality present');

// 2. No foreign branch identity
for (const o of others) {
  if (o.phone) {
    ok(!pack.includes(o.phone), 'foreign phone leaked: ' + o.id);
    ok(!pack.replace(/[^0-9]/g, '').includes(o.phone.replace(/[^0-9]/g, '')), 'foreign phone digits leaked: ' + o.id);
  }
  if (o.postalCode) ok(!pack.includes(o.postalCode), 'foreign postcode leaked: ' + o.id + ' ' + o.postalCode);
  if (o.googleReviewUrl) ok(!pack.includes(o.googleReviewUrl), 'foreign review URL leaked: ' + o.id);
}

// 3. POM names and drug classes must not appear anywhere in a GBP pack (regime 1 surface)
const pomNames = ['mounjaro','wegovy','ozempic','saxenda','orlistat','xenical','alli','rybelsus',
  'tirzepatide','semaglutide','liraglutide','glp-1','glp1','naltrexone','bupropion','mysimba'];
const lower = pack.toLowerCase();
for (const n of pomNames) ok(!lower.includes(n), 'POM/class name in pack: ' + n);

// 4. Weight loss copy: no outcome promises or efficacy claims (independent patterns)
const promisePatterns = [
  /lose\s+\d+/i, /\bguarantee/i, /\bproven\b/i, /\bresults\b(?![a-z])/i,
  /\bdrop (a|two|three|\d)/i, /\bstones?\b/i, /\bkg\b/i,
  /\btransform/i, /\bfastest\b/i, /\bbest treatment\b/i, /\bmost effective\b/i
];
for (const re of promisePatterns) ok(!re.test(pack), 'outcome/efficacy pattern in pack: ' + re);

// 5. Weight loss copy: required framing per house standard
ok(/private, paid service/.test(pack), 'WL copy states private paid service');
ok(/not right for everyone/.test(pack), 'WL copy states not right for everyone');
ok(/clinical assessment/.test(pack), 'WL copy mentions clinical assessment');

// 6. Pharmacy First: NHS condition list correct, no extras
const pfConditions = ['sinusitis','sore throat','impetigo','shingles','infected insect bite'];
for (const c of pfConditions) ok(lower.includes(c), 'PF condition missing: ' + c);
ok(/earache/.test(lower), 'PF earache present');
ok(/(uncomplicated (uti|urinary)|water infection)/i.test(pack), 'PF UTI wording present');
const pfBlock = pack.match(/NHS Pharmacy First[\s\S]{0,300}/);
ok(pfBlock && /free/i.test(pfBlock[0]), 'PF described as free NHS service');
ok(!/chickenpox|scarlet fever|conjunctivitis/i.test(pack), 'no non-PF conditions added');

// 7. hasApp false: no app offer (the paster note explaining the absence is allowed)
ok(b.hasApp === false, 'branches.json hasApp is false');
const appMentions = (pack.match(/\bapp\b/gi) || []).length;
ok(appMentions <= 1 && /No app mention anywhere in this pack/.test(pack), 'only the paster note mentions app');

// 8. Description length claim
const descMatch = pack.match(/## 1\. Business description \(max 750 chars - this is (\d+)\)\r?\n([\s\S]*?)\r?\n\r?\n## 2\./);
ok(!!descMatch, 'description block parses');
if (descMatch) {
  const actual = descMatch[2].replace(/\r/g, '').replace(/\n/g, ' ').length;
  const claimed = parseInt(descMatch[1], 10);
  ok(Math.abs(actual - claimed) <= 2, 'description length claim ' + claimed + ' vs actual ' + actual, true);
  ok(actual <= 750, 'description within 750 chars, actual ' + actual);
}

// 9. Copy standards: no em dashes, no emojis, https only
ok(pack.indexOf('\u2014') === -1, 'no em dashes');
ok(!/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/u.test(pack), 'no emojis');
ok(!/http:\/\//.test(pack), 'no http:// URLs');

// 10. All URLs on the branch's own domain or its Google review link
const urls = pack.match(/https:\/\/[^\s)>\]]+/g) || [];
for (const u of urls) {
  ok(/scorah-chemists\.co\.uk|g\.page/.test(u), 'URL off own domain: ' + u);
}

// 11. Hours vs branches.json canonical schedule
ok(/9:00am to 6:00pm/.test(pack), 'weekday hours string present');
ok(/Saturday 9:00am to 1:00pm/.test(pack), 'Saturday hours string present');
ok(/Sunday closed/i.test(pack), 'Sunday closed present');

// 12. Post town line (Q62 standing gap - verify Stockport still correct, flag only)
ok(/Bramhall, Stockport SK7 3LQ/.test(pack), 'address line post town reads Stockport', true);

console.log('CHECKS=' + checks, 'DEFECTS=' + defects.length, 'FLAGS=' + flags.length);
for (const d of defects) console.log('DEFECT: ' + d);
for (const f of flags) console.log('FLAG: ' + f);
process.exit(defects.length ? 1 : 0);
