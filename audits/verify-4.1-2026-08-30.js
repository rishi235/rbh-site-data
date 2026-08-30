// Independent verification of gbp-packs/fishlocks-ainsdale.md (item 4.1 quality pass)
// 2026-08-30. Imports nothing from tools/. Reads branches.json and the pack only.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pack = fs.readFileSync(path.join(root, 'gbp-packs', 'fishlocks-ainsdale.md'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'branches.json'), 'utf8'));
let checks = 0, defects = [], flags = [];
function ok(cond, label, flagOnly) {
  checks++;
  if (!cond) { (flagOnly ? flags : defects).push(label); }
}
const b = data.branches.find(x => x.id === 'fishlocks_ainsdale');
if (!b) { console.error('branch fishlocks_ainsdale not found'); process.exit(2); }
const others = data.branches.filter(x => x.id !== 'fishlocks_ainsdale' && !x.disposed);

// 1. Canonical facts present
ok(pack.includes(b.streetAddress), 'streetAddress present: ' + b.streetAddress);
ok(pack.includes(b.postalCode), 'postalCode present');
ok(pack.includes(b.phone), 'phone present in canonical spaced form: ' + b.phone);
ok(pack.includes(b.googleReviewUrl), 'own review URL present');
ok(pack.toLowerCase().includes(b.addressLocality.toLowerCase()), 'addressLocality present');
ok(pack.includes(b.branchName), 'branchName present: ' + b.branchName);

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

// 4. Outcome promises and efficacy claims.
// Pack-wide: the unambiguous promise shapes.
const packWide = [/lose\s+\d+/i, /\bguarantee/i, /\bproven\b/i, /\bdrop (a|two|three|\d)/i,
  /\bstones?\b/i, /\bkg\b/i, /\btransform/i, /\bfastest\b/i, /\bbest treatment\b/i, /\bmost effective\b/i];
for (const re of packWide) ok(!re.test(pack), 'outcome/efficacy pattern in pack: ' + re);
// Weight-loss-scoped: patterns that legitimately appear elsewhere (blood tests have
// "fast results") but must not appear in weight loss copy.
const wlBlocks = [];
const postC = pack.match(/### Post C - Weight loss clinic\r?\n[\s\S]*?(?=\r?\n### |\r?\nNotes for the paster)/);
if (postC) wlBlocks.push(postC[0]);
const wlService = pack.match(/^- Weight loss clinic:.*$/m);
if (wlService) wlBlocks.push(wlService[0]);
ok(wlBlocks.length === 2, 'both weight loss blocks parse (Post C + service line)');
const wlScoped = [/\bresults\b/i, /\bfast\b/i, /\beffective\b/i, /\bworks\b/i];
for (const block of wlBlocks) for (const re of wlScoped) ok(!re.test(block), 'WL-scoped efficacy pattern: ' + re);

// 5. Weight loss copy: consultation-led framing, no Buy wording, private
for (const block of wlBlocks) {
  ok(!/\bbuy\b/i.test(block), 'WL copy contains Buy wording');
  ok(!/[£$]|\bprice|\bdiscount|\boffer\b/i.test(block), 'WL copy headlines pricing or discounts');
}
ok(/pharmacist-led/.test(pack), 'WL described as pharmacist-led');
ok(/private/.test(wlBlocks.join(' ')), 'WL described as private');
ok(/consultation/.test(wlBlocks.join(' ')), 'WL framed around a consultation');

// 6. Pharmacy First: NHS condition list correct, no extras
const pfConditions = ['sinusitis','sore throat','impetigo','shingles','infected insect bite'];
for (const c of pfConditions) ok(lower.includes(c), 'PF condition missing: ' + c);
ok(/earache/.test(lower), 'PF earache present');
ok(/(uncomplicated (uti|urinary)|water infection)/i.test(pack), 'PF UTI wording present');
const pfBlock = pack.match(/NHS Pharmacy First[\s\S]{0,300}/);
ok(pfBlock && /free/i.test(pfBlock[0]), 'PF described as free NHS service');
ok(!/chickenpox|scarlet fever|conjunctivitis/i.test(pack), 'no non-PF conditions added');
ok(/seven common conditions/.test(pack), 'PF seven conditions count stated');
ok(/16 to 64/.test(pack), 'PF UTI age range 16 to 64 stated');

// 7. hasApp true: the pack earns exactly the app mention it is entitled to
ok(b.hasApp === true, 'branches.json hasApp is true');
ok(/\bapp\b/i.test(pack), 'app mention present as earned by hasApp true');

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
ok(urls.length >= 6, 'expected at least 6 URLs, found ' + urls.length);
for (const u of urls) {
  ok(/fishlockpharmacy\.co\.uk|g\.page/.test(u), 'URL off own domain: ' + u);
}

// 11. Post A button is the branch's own pfLink
ok(pack.includes(b.pfLink), 'Post A button uses the branch pfLink');

// 12. Hours vs branches.json: times and day composition
ok(/Monday to Friday 8:45am to 6:00pm/.test(pack), 'weekday hours string present');
ok(/Saturday and Sunday closed/.test(pack), 'Saturday and Sunday closed present');
const spec = b.openingHours.specification;
ok(spec.length === 1 && spec[0].opens === '08:45' && spec[0].closes === '18:00', 'branches.json spec is Mon-Fri 08:45-18:00');
ok(JSON.stringify(spec[0].dayOfWeek) === JSON.stringify(['Monday','Tuesday','Wednesday','Thursday','Friday']), 'open days are exactly Mon-Fri');
ok(JSON.stringify(b.openingHours.closedDays) === JSON.stringify(['Saturday','Sunday']), 'closed days are exactly Sat+Sun');
ok(!/Saturday \d/.test(pack), 'no Saturday opening time stated');
ok(!/Sunday \d/.test(pack), 'no Sunday opening time stated');

// 13. Catchment order per serviceAreaList
const catchRe = new RegExp(b.serviceAreaList.slice(0, -1).join(', ') + ',? and ' + b.serviceAreaList[b.serviceAreaList.length - 1]);
ok(catchRe.test(pack), 'catchment order (natural-language list): ' + b.serviceAreaList.join(', '));

// 14. Profile website is the branch landing page, not the shared homepage
ok(pack.includes('pharmacy-fishlocks-ainsdale.html'), 'profile website is the Ainsdale landing page');
ok(!/Website for the profile: https:\/\/www\.fishlockpharmacy\.co\.uk\r?\n/.test(pack), 'profile website is not the bare shared homepage');

// 15. Post lengths within the 1,500 limit
const posts = pack.match(/### Post [A-D][\s\S]*?(?=\r?\n### |\r?\nNotes for the paster)/g) || [];
ok(posts.length === 4, 'four posts parse, found ' + posts.length);
for (const p of posts) {
  const body = p.replace(/### Post [A-D][^\r\n]*\r?\n/, '').replace(/\r?\nButton:[\s\S]*$/, '').replace(/\r/g, '').replace(/\n/g, ' ');
  ok(body.length <= 1500, 'post body within 1500: ' + p.slice(0, 20) + ' at ' + body.length);
}

// 16. Services earned by the five widgets in branches.json
const widgetChecks = { bloodPressure: /blood pressure/i, contraception: /contraception/i,
  pharmacyFirst: /Pharmacy First/, weightLoss: /weight loss/i, travelClinic: /travel clinic/i };
for (const [w, re] of Object.entries(widgetChecks)) {
  if (b.widgets[w]) ok(re.test(pack), 'service earned by widget missing: ' + w);
}

console.log('CHECKS=' + checks, 'DEFECTS=' + defects.length, 'FLAGS=' + flags.length);
for (const d of defects) console.log('DEFECT: ' + d);
for (const f of flags) console.log('FLAG: ' + f);
process.exit(defects.length ? 1 : 0);

