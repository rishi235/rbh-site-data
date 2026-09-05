// Independent verification, item 3.5, twelfth quality pass, 2026-09-05.
// Freshly written, no import from tools/. Reads branches.json and the CONDITIONS
// table's raw text (hand-transcribed from the generator source, not required in
// as code) so that a bug shared between the generator and this script would
// still need to exist in two independently-typed places to hide.
//
// NEW LEG this pass: the six Pharmacy First condition pages that have never
// been independently, individually checked on this item across eleven prior
// passes - sore-throat, sinusitis, earache, impetigo, shingles, insect-bite.
// Every prior pass that named a "new leg" picked a different PAGE TYPE
// (pharmacy-first overview, uti-treatment, weight-loss-clinic,
// switch-prescriptions, contraception, travel-clinic) but none had gone back
// to check the other six condition-specific pages this branch also carries,
// even though every full 36-checker run reads them collectively.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8'));
const branch = branches.branches.find(b => b.id === 'hirshmans_ainsdale');
if (!branch) { console.error('FAIL: hirshmans_ainsdale not found in branches.json'); process.exit(1); }

let checks = 0, failures = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log('FAIL:', label); }
}

// ---- Condition data, hand-transcribed independently from build-service-pages.js
// (read once for accuracy, not required in as code) ----
const CONDITIONS = {
  'sore-throat': { h1Phrase: 'Sore throat treatment', ageNote: 'Age 5 and over', yes0: 'Anyone aged 5 and over', noAge: 'Children under 5 should see a GP' },
  'sinusitis': { h1Phrase: 'Sinusitis treatment', ageNote: 'Age 12 and over', yes0: 'Anyone aged 12 and over', noAge: 'Children under 12 should see a GP' },
  'earache': { h1Phrase: 'Earache treatment for children', ageNote: 'Age 1 to 17', yes0: 'Children and young people aged 1 to 17', noAge: 'Babies under 1 should see a GP' },
  'impetigo': { h1Phrase: 'Impetigo treatment', ageNote: 'Age 1 and over', yes0: 'Anyone aged 1 and over', noAge: 'Babies under 1 should see a GP' },
  'shingles': { h1Phrase: 'Shingles treatment', ageNote: 'Age 18 and over', yes0: 'Adults aged 18 and over', noAge: 'Children and young people under 18 should see a GP' },
  'insect-bite': { h1Phrase: 'Infected insect bite treatment', ageNote: 'Age 1 and over', yes0: 'Anyone aged 1 and over', noAge: 'Babies under 1 should see a GP' }
};

const PAGES_DIR = path.join(ROOT, 'modules', 'service', 'pages');
const ALL_HIRSHMANS_PAGES = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('hirshmans-ainsdale.html'));
const SWITCH_PAGE = 'switch-prescriptions-hirshmans-ainsdale.html';

check('exactly 11 service-family Hirshmans pages found', ALL_HIRSHMANS_PAGES.length === 11);
check('switch page exists', fs.existsSync(path.join(ROOT, 'modules', 'switch', 'pages', SWITCH_PAGE)));

const foreignTowns = branches.branches
  .filter(b => b.id !== branch.id && !b.disposed)
  .map(b => b.seoTown)
  .filter(t => typeof t === 'string' && t.length > 0)
  .filter(t => !branch.serviceAreaList.includes(t));

// ---- Standard invariants, all 12 pages (11 service + 1 switch) ----
const allFiles = ALL_HIRSHMANS_PAGES.map(f => ({ f, full: path.join(PAGES_DIR, f) }))
  .concat([{ f: SWITCH_PAGE, full: path.join(ROOT, 'modules', 'switch', 'pages', SWITCH_PAGE) }]);

for (const { f, full } of allFiles) {
  const html = fs.readFileSync(full, 'utf8');
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  check(`${f}: exactly one H1`, h1Matches.length === 1);
  const h1Text = h1Matches[0] ? h1Matches[0].replace(/<[^>]+>/g, '') : '';
  check(`${f}: H1 carries Ainsdale`, /\bAinsdale\b/.test(h1Text));
  check(`${f}: postcode PR8 3HW present`, html.includes('PR8 3HW'));
  const foreignPostcodes = branches.branches.filter(b => b.id !== branch.id).map(b => b.postalCode);
  const hasForeignPostcode = foreignPostcodes.some(pc => pc && html.includes(pc));
  check(`${f}: no foreign postcode`, !hasForeignPostcode);
  check(`${f}: display phone 01704 577376 present`, html.includes('01704 577376'));
  check(`${f}: tel: link 01704577376 present`, html.includes('tel:01704577376'));
  const foreignPhones = branches.branches.filter(b => b.id !== branch.id).map(b => 'tel:' + (b.phone || '').replace(/\s+/g, ''));
  const hasForeignPhone = foreignPhones.some(p => p.length > 5 && html.includes(p));
  check(`${f}: no foreign tel: link`, !hasForeignPhone);
  const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const foundForeign = foreignTowns.filter(t => new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(bodyText));
  check(`${f}: no foreign seoTown (found: ${foundForeign.join(',') || 'none'})`, foundForeign.length === 0);
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(`${f}: JSON-LD parses`, !!ld);
    if (ld && ld.address) {
      check(`${f}: JSON-LD streetAddress matches`, ld.address.streetAddress === branch.streetAddress);
      check(`${f}: JSON-LD addressLocality matches`, ld.address.addressLocality === branch.addressLocality);
      check(`${f}: JSON-LD postalCode matches`, ld.address.postalCode === branch.postalCode);
      check(`${f}: JSON-LD addressRegion matches`, ld.address.addressRegion === branch.addressRegion);
    }
    if (ld) check(`${f}: JSON-LD telephone matches`, ld.telephone === branch.phone);
  }
  const waMatch = html.match(/data-wa="([^"]+)"/);
  if (waMatch) check(`${f}: data-wa is this branch's own WhatsApp`, waMatch[1] === branch.whatsapp);
}

// ---- NEW LEG: the six never-individually-tested condition pages ----
for (const slug of Object.keys(CONDITIONS)) {
  const file = `${slug}-treatment-hirshmans-ainsdale.html`;
  const full = path.join(PAGES_DIR, file);
  check(`${file}: exists`, fs.existsSync(full));
  if (!fs.existsSync(full)) continue;
  const html = fs.readFileSync(full, 'utf8');
  const c = CONDITIONS[slug];
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Text = h1Matches[0] ? h1Matches[0].replace(/<[^>]+>/g, '') : '';
  check(`${file}: H1 contains h1Phrase "${c.h1Phrase}"`, h1Text.includes(c.h1Phrase));
  check(`${file}: ageNote "${c.ageNote}" appears on page`, html.includes(c.ageNote));
  check(`${file}: eligibleYes[0] cohort line "${c.yes0}" appears`, html.includes(c.yes0));
  check(`${file}: eligibleNo age-exclusion line "${c.noAge}" appears`, html.includes(c.noAge));
  check(`${file}: Pharmacy First framing present`, /Pharmacy First/.test(html));
}

console.log(`\nTOTAL: ${checks} checks, ${failures} failures`);
process.exit(failures > 0 ? 1 : 0);
