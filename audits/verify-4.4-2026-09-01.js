// Independent verifier for item 4.4 (Scorah Chemists Bramhall GBP pack), seventh
// quality pass, 2026-09-01. Own regexes throughout, imports nothing from tools/.
// Composed only from branches.json and gbp-packs/TEMPLATE.md conventions.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = require(path.join(ROOT, 'branches.json'));
const branches = data.branches;
const b = branches.find(x => x.id === 'scorah_bramhall');
const sister = branches.find(x => x.id === 'scorah_hazel');

const packPath = path.join(ROOT, 'gbp-packs', 'scorah-bramhall.md');
const pack = fs.readFileSync(packPath, 'utf8');

let checks = 0, failures = 0;
function check(name, cond) {
  checks++;
  if (!cond) {
    failures++;
    console.log('FAIL:', name);
  }
}

check('GBP name is branchName', pack.includes('Name on GBP: ' + b.branchName));

const addrLineMatch = pack.match(/- Address: (.+)/);
check('address line present', !!addrLineMatch);
if (addrLineMatch) {
  const addrLine = addrLineMatch[1];
  check('address has streetAddress', addrLine.includes(b.streetAddress));
  check('address has addressLocality', addrLine.includes(b.addressLocality));
  check('address has postalCode', addrLine.includes(b.postalCode));
}

check('phone line matches branches.json exactly', pack.includes('- Phone: ' + b.phone));
let otherPhoneLeak = false;
for (const other of branches) {
  if (other.id === b.id || other.disposed) continue;
  if (other.phone && other.phone !== b.phone && pack.includes(other.phone)) {
    otherPhoneLeak = true;
    console.log('  -> leaked phone from', other.id, other.phone);
  }
}
check('no other trading branch phone present', !otherPhoneLeak);

function fmt12(t) {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'pm' : 'am';
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return m === 0 ? `${h12}:00${ap}` : `${h12}:${String(m).padStart(2,'0')}${ap}`;
}
const weekday = b.openingHours.specification.find(s => s.dayOfWeek.includes('Monday'));
const saturday = b.openingHours.specification.find(s => s.dayOfWeek.includes('Saturday'));
check('has weekday session Mon-Fri', !!weekday && weekday.dayOfWeek.length === 5);
check('has Saturday session', !!saturday);
check('Sunday in closedDays', b.openingHours.closedDays.includes('Sunday'));
const expectedHoursCollapsed = `Monday to Friday ${fmt12(weekday.opens)} to ${fmt12(weekday.closes)}, Saturday ${fmt12(saturday.opens)} to ${fmt12(saturday.closes)}, Sunday closed`;
check('hours string matches derived spec (whitespace-collapsed)', pack.replace(/\s+/g,' ').includes(expectedHoursCollapsed));

const expectedLanding = `${b.website}/pharmacy-${b.brandSlug}-${b.townSlug}.html`;
check('profile website line uses branch landing page', pack.includes(expectedLanding));
const landingFile = path.join(ROOT, 'modules', 'branch', 'pages', `pharmacy-${b.brandSlug}-${b.townSlug}.html`);
check('landing page file exists in repo', fs.existsSync(landingFile));

check('review link matches googleReviewUrl exactly', pack.includes(b.googleReviewUrl));
let otherReviewLeak = false;
for (const other of branches) {
  if (other.id === b.id || other.disposed) continue;
  if (other.googleReviewUrl && pack.includes(other.googleReviewUrl)) {
    otherReviewLeak = true;
    console.log('  -> leaked review link from', other.id);
  }
}
check('no other branch review link present', !otherReviewLeak);

const descMatch = pack.match(/## 1\. Business description \(max 750 chars - this is (\d+)\)\n([\s\S]+?)\n\n## 2\./);
check('description block found', !!descMatch);
if (descMatch) {
  const claimedLen = Number(descMatch[1]);
  const body = descMatch[2].replace(/\n/g, ' ').trim();
  check('description under 750 chars', body.length <= 750);
  check('claimed char count matches actual (paste-joined)', body.length === claimedLen);
}

check('hasApp is false for this branch', b.hasApp === false);
// Exclude the paster note itself ("No app mention anywhere in this pack") -
// that line CONFIRMS absence, it is not an app claim. Excluding it by content,
// not by line number, so any other genuine app mention still fails the check.
const appWordCheck = pack
  .replace(/happen|approach|appointment|appropriate|apply|applies/gi, '')
  .replace(/No app mention anywhere in this pack:[^\n]*/gi, '');
check('no app mention in pack (excluding the paster note confirming absence)', !/\bapp\b/i.test(appWordCheck));

if (/whatsapp/i.test(pack)) {
  check('branch has a whatsapp field if pack mentions WhatsApp', !!b.whatsapp);
}

const sisterMatch = pack.match(/our sister branch in ([A-Za-z ]+) is close by/);
check('sister branch sentence present', !!sisterMatch);
if (sisterMatch) {
  check('sister branch is a live branch sharing brandLabel', !!sister && !sister.disposed && sister.brandLabel === b.brandLabel);
  check("sister sentence names sister's own seoTown", sister && sisterMatch[1].trim() === sister.seoTown);
}

const pfConditions = ['sinusitis', 'sore throat', 'earache', 'impetigo', 'shingles', 'infected insect bites', 'uncomplicated'];
for (const cond of pfConditions) {
  check(`PF condition "${cond}" present`, pack.toLowerCase().includes(cond));
}
check('blood pressure cohort is 40 and over', /aged 40 and over/i.test(pack));
check('where appropriate hedge present', /where appropriate/i.test(pack));

const postUrls = [...pack.matchAll(/Button:.*?-> (https:\/\/\S+\.html)/g)].map(m => m[1]);
check('four post button URLs found', postUrls.length === 4);
check('Post A URL equals branch pfLink', postUrls[0] === b.pfLink);

const expectedFiles = {};
expectedFiles[`${b.website}/switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`] = path.join(ROOT, 'modules', 'switch', 'pages', `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`);
expectedFiles[`${b.website}/weight-loss-clinic-${b.brandSlug}-${b.townSlug}.html`] = path.join(ROOT, 'modules', 'service', 'pages', `weight-loss-clinic-${b.brandSlug}-${b.townSlug}.html`);
expectedFiles[`${b.website}/travel-clinic-${b.brandSlug}-${b.townSlug}.html`] = path.join(ROOT, 'modules', 'service', 'pages', `travel-clinic-${b.brandSlug}-${b.townSlug}.html`);

for (const url of postUrls.slice(1)) {
  const f = expectedFiles[url];
  check(`post URL ${url} maps to a known generator file`, f !== undefined);
  if (f) check(`file for ${url} exists`, fs.existsSync(f));
}

const postCMatch = pack.match(/### Post C - Weight loss clinic\n([\s\S]+?)\nButton:/);
check('Post C block found', !!postCMatch);
if (postCMatch) {
  const meds = ['mounjaro', 'wegovy', 'orlistat', 'saxenda', 'ozempic', 'xenical'];
  for (const med of meds) {
    check(`Post C does not name ${med}`, !postCMatch[1].toLowerCase().includes(med));
  }
  check('Post C has no superlative/efficacy claim word', !/\b(best|fastest|guaranteed|proven results)\b/i.test(postCMatch[1]));
}

const bhNoteMatch = pack.match(/Bank holiday special hours:[\s\S]+$/);
check('bank holiday paster note present', !!bhNoteMatch);
if (bhNoteMatch) {
  const note = bhNoteMatch[0];
  let anyDateLeaked = false;
  for (const d of data.bankHolidays.dates2026) {
    if (note.includes(d)) anyDateLeaked = true;
  }
  check('bank holiday note does not retype any real dates2026 value', !anyDateLeaked);
  check('bank holiday note references dates2026 by name', note.includes('dates2026'));
  check('bank holiday note references Q79 and closed policy', /Q79/.test(note) && /closed/i.test(note));
}

check('primary category is Pharmacy', /Primary: Pharmacy/.test(pack));
const catBlock = pack.match(/## 2\. Categories\n([\s\S]+?)\n\n## 3\./);
if (catBlock) {
  check('Travel clinic category only if travelClinic widget present', !/Travel clinic/.test(catBlock[1]) || !!b.widgets.travelClinic);
  check('Weight loss category only if weightLoss widget present', !/Weight loss/.test(catBlock[1]) || !!b.widgets.weightLoss);
}

check('no em dash', !pack.includes('—'));
check('no en dash', !pack.includes('–'));

console.log(`\n${checks} checks, ${failures} failures.`);
process.exit(failures > 0 ? 1 : 0);
