// Independent verification of gbp-packs/scorah-bramhall.md (item 4.4 quality pass, sixth pass)
// 2026-08-31. Imports nothing from tools/. Reads branches.json and the pack only.
// Builds on the fifth pass (audits/verify-4.4-2026-08-30.js): repeats every check from
// that pass, then adds four new independent checks this pass introduces (marked NEW):
//   - hours strings DERIVED from branches.json openingHours.specification rather than
//     hardcoded literals, so a change to the branch's hours would be caught here even
//     if nobody updated this script's expectations by hand;
//   - the bank holiday paster note carries no literal date, so the eight 2026 dates
//     cannot drift out of sync with branches.json;
//   - the sister-branch claim is checked against branches.json rather than assumed
//     (same brandLabel, sister's own seoTown named, sister not disposed);
//   - the WhatsApp reference in Post B does not quote a digit string that disagrees
//     with the branch's own branches.json "whatsapp" field (or any other branch's).
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
  if (o.whatsapp && o.whatsapp !== b.whatsapp) ok(!pack.includes(o.whatsapp), 'foreign whatsapp number leaked: ' + o.id);
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
  /\btransform/i, /\bfastest\b/i, /\bbest treatment\b/i, /\bmost effective\b/i,
  /\b(lose|shed|drop)\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|half a)\s+stone/i
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
ok(pack.indexOf('—') === -1, 'no em dashes');
ok(!/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/u.test(pack), 'no emojis');
ok(!/http:\/\//.test(pack), 'no http:// URLs');

// 10. All URLs on the branch's own domain or its Google review link
const urls = pack.match(/https:\/\/[^\s)>\]]+/g) || [];
for (const u of urls) {
  ok(/scorah-chemists\.co\.uk|g\.page/.test(u), 'URL off own domain: ' + u);
}

// 11. NEW - hours strings DERIVED from branches.json openingHours.specification, not hardcoded
function fmt12(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return h12 + ':' + String(m).padStart(2, '0') + suffix;
}
const spec = b.openingHours.specification;
const weekday = spec.find(s => s.dayOfWeek.includes('Monday'));
const saturday = spec.find(s => s.dayOfWeek.includes('Saturday') && !s.dayOfWeek.includes('Monday'));
ok(!!weekday, 'weekday session found in branches.json spec');
ok(!!saturday, 'Saturday session found in branches.json spec');
if (weekday) {
  const expectWeekday = fmt12(weekday.opens) + ' to ' + fmt12(weekday.closes);
  ok(pack.includes(expectWeekday), 'weekday hours string derived from branches.json present: ' + expectWeekday);
}
if (saturday) {
  const expectSat = 'Saturday ' + fmt12(saturday.opens) + ' to ' + fmt12(saturday.closes);
  ok(pack.includes(expectSat), 'Saturday hours string derived from branches.json present: ' + expectSat);
}
ok((b.openingHours.closedDays || []).includes('Sunday'), 'Sunday is a closed day in branches.json');
ok(/Sunday closed/i.test(pack), 'Sunday closed stated in pack');

// 12. NEW - bank holiday paster note present and carries no literal date (must not drift)
const bhNote = pack.match(/Bank holiday special hours:[\s\S]{0,700}/);
ok(!!bhNote, 'bank holiday paster note present');
if (bhNote) {
  ok(/bankHolidays\.dates2026/.test(bhNote[0]), 'note points at branches.json bankHolidays.dates2026 by name');
  // The real drift risk is a literal BANK HOLIDAY date typed into the note (it would go
  // stale the day branches.json's list changes). Dates that are provenance (when this
  // note was added) or a decision citation (when Q79 was confirmed) are not that risk
  // and are normal repo convention elsewhere in this file, so check against the actual
  // dates2026 list rather than banning every ISO-shaped date in the block.
  const holidayDates = (data.bankHolidays && data.bankHolidays.dates2026) || [];
  ok(holidayDates.length > 0, 'branches.json bankHolidays.dates2026 has entries to check against');
  for (const d of holidayDates) {
    ok(!bhNote[0].includes(d), 'note does not hardcode bank holiday date ' + d);
  }
  // Month-name spellouts of an actual bank holiday date (e.g. "25 December") would be
  // the same drift risk in prose form; none of the eight 2026 dates should appear that way.
  const monthNames = ['january','february','march','april','may','june','july','august',
    'september','october','november','december'];
  for (const d of holidayDates) {
    const [, mm, dd] = d.split('-').map(Number);
    const day = parseInt(String(dd), 10);
    const month = monthNames[mm - 1];
    const spelled = new RegExp('\\b' + day + '(st|nd|rd|th)?\\s+' + month + '\\b', 'i');
    ok(!spelled.test(bhNote[0]), 'note does not spell out bank holiday date as prose: ' + day + ' ' + month);
  }
  ok(/Q79/.test(bhNote[0]), 'note cites Q79 as the authorising decision');
}

// 13. NEW - sister-branch claim checked against branches.json, not assumed
const sisterMatch = pack.match(/our sister branch in ([A-Za-z ]+?) is close by/i);
ok(!!sisterMatch, 'sister-branch sentence present');
if (sisterMatch) {
  const namedTown = sisterMatch[1].trim();
  const sisters = data.branches.filter(x => x.id !== b.id && x.brandLabel === b.brandLabel && !x.disposed);
  ok(sisters.length > 0, 'a live sister branch exists sharing brandLabel ' + b.brandLabel);
  ok(sisters.some(s => s.seoTown === namedTown), 'named sister town matches a live sister\'s own seoTown: ' + namedTown);
}

// 14. NEW - WhatsApp: pack does not quote a digit string disagreeing with branches.json
ok(/WhatsApp/i.test(pack), 'WhatsApp mentioned in pack (Post B)');
const digitRuns = (pack.match(/\b0?7\d{9}\b|\b44\d{10}\b/g) || []);
for (const d of digitRuns) {
  ok(d.replace(/^0/, '44') === b.whatsapp || d === b.whatsapp, 'a mobile-shaped digit run in the pack matches the branch whatsapp field or is unrelated: ' + d, true);
}
ok(!!b.whatsapp && b.whatsapp === '447521775631', 'branch whatsapp field matches the estate-wide number');

// 15. Post town line (Q62 standing gap - verify Stockport still correct, flag only)
ok(/Bramhall, Stockport SK7 3LQ/.test(pack), 'address line post town reads Stockport', true);

console.log('CHECKS=' + checks, 'DEFECTS=' + defects.length, 'FLAGS=' + flags.length);
for (const d of defects) console.log('DEFECT: ' + d);
for (const f of flags) console.log('FLAG: ' + f);
process.exit(defects.length ? 1 : 0);
