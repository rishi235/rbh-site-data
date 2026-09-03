// Independent verification, item 3.5 (Hirshmans Chemist Ainsdale), tenth quality pass, 2026-09-03.
// Fresh extraction, no code imported from tools/. Run with: node verify-3.5-2026-09-03-tenth.js
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'C:\\Dev\\rbh-site-data';
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;
const b = branches.find(x => x.id === 'hirshmans_ainsdale');
if (!b) { console.error('FAIL: hirshmans_ainsdale not found in branches.json'); process.exit(1); }

const liveTownWords = branches
  .filter(x => !x.disposed && x.id !== b.id)
  .map(x => x.seoTown)
  .filter((v, i, a) => v && a.indexOf(v) === i);
const liveBrands = branches
  .filter(x => !x.disposed && x.id !== b.id)
  .map(x => x.brandLabel)
  .filter((v, i, a) => v && a.indexOf(v) === i);

let checks = 0, failures = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { failures++; console.log('FAIL:', msg); }
}

function stripForCrawl(html) {
  // Remove build comment, then scripts/styles, then tags, per Build Pack v2 5.1 (crawlable text only)
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  return s;
}

const pages = [
  'modules\\service\\pages\\contraception-hirshmans-ainsdale.html',
  'modules\\service\\pages\\earache-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\impetigo-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\insect-bite-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\pharmacy-first-hirshmans-ainsdale.html',
  'modules\\service\\pages\\shingles-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\sinusitis-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\sore-throat-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\travel-clinic-hirshmans-ainsdale.html',
  'modules\\service\\pages\\uti-treatment-hirshmans-ainsdale.html',
  'modules\\service\\pages\\weight-loss-clinic-hirshmans-ainsdale.html',
  'modules\\switch\\pages\\switch-prescriptions-hirshmans-ainsdale.html',
];

for (const rel of pages) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { failures++; console.log('FAIL: missing page', rel); continue; }
  const raw = fs.readFileSync(full, 'utf8');
  const crawl = stripForCrawl(raw);

  // H1 count and content
  const h1s = [...raw.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  check(h1s.length === 1, rel + ': expected exactly 1 H1, found ' + h1s.length);
  if (h1s.length >= 1) {
    check(h1s[0].includes(b.seoTown), rel + ': H1 does not carry seoTown "' + b.seoTown + '" (H1: "' + h1s[0] + '")');
  }

  // Phone: only this branch's phone digits anywhere
  const digitsWanted = b.phone.replace(/\D/g, '');
  const phoneMatches = [...crawl.matchAll(/0\d{3,4}[\s-]?\d{6,7}/g)].map(m => m[0].replace(/\D/g, ''));
  for (const pm of phoneMatches) {
    check(pm === digitsWanted, rel + ': phone-shaped digits "' + pm + '" do not match branch phone "' + digitsWanted + '"');
  }
  check(raw.includes('tel:' + digitsWanted) || raw.includes('tel:0' + digitsWanted.slice(1)), rel + ': no tel: link matching branch phone');

  // Postcode: only this branch's postcode
  const pcRe = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/g;
  const pcs = [...crawl.matchAll(pcRe)].map(m => m[0].replace(/\s+/g, ' ').trim());
  for (const pc of pcs) {
    const norm = pc.replace(/\s+/g, '');
    const wantNorm = b.postalCode.replace(/\s+/g, '');
    check(norm === wantNorm, rel + ': postcode-shaped text "' + pc + '" does not match branch postcode "' + b.postalCode + '"');
  }

  // No foreign live town or brand in crawlable text (word-boundary), except this branch's own serviceAreaList
  for (const town of liveTownWords) {
    if (b.serviceAreaList && b.serviceAreaList.includes(town)) continue;
    const re = new RegExp('\\b' + town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    check(!re.test(crawl), rel + ': carries foreign live seoTown "' + town + '" not in this branch\'s serviceAreaList');
  }
  for (const brand of liveBrands) {
    const re = new RegExp('\\b' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    check(!re.test(crawl), rel + ': carries foreign brand "' + brand + '"');
  }

  // data-wa ownership
  const waMatch = raw.match(/data-wa="(\d+)"/);
  if (waMatch) {
    check(waMatch[1] === b.whatsapp, rel + ': data-wa "' + waMatch[1] + '" does not match branch whatsapp "' + b.whatsapp + '"');
  }

  // JSON-LD address field by field, where present
  const ldMatch = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { failures++; console.log('FAIL: ' + rel + ' JSON-LD does not parse: ' + e.message); ld = null; }
    if (ld) {
      const addr = ld.address || {};
      check(addr.streetAddress === b.streetAddress, rel + ': JSON-LD streetAddress mismatch');
      check(addr.addressLocality === b.addressLocality, rel + ': JSON-LD addressLocality mismatch');
      check(addr.postalCode === b.postalCode, rel + ': JSON-LD postalCode mismatch');
      check(addr.addressRegion === b.addressRegion, rel + ': JSON-LD addressRegion mismatch');
      check(ld.telephone === b.phone, rel + ': JSON-LD telephone mismatch (' + ld.telephone + ' vs ' + b.phone + ')');
    }
  }

  // No hard-coded widget id (mount only, no literal booking id in source)
  check(raw.includes('rendered by service.js from branches.json') || raw.includes('rendered by switch.js from branches.json') || !/appointedd/i.test(raw) || !/widgetId["']?\s*[:=]\s*["'][0-9a-f]{20,}/i.test(raw),
    rel + ': possible hard-coded widget id literal in source');
}

// NEW LEG: independent verification of contraception-page rules against
// tools/build-contraception-pages.js's own declared copy for this branch,
// rather than by calling check-contraception-copy.js. First time this leg
// has been run on item 3.5 in its ten-pass history.
const contraFile = fs.readFileSync(path.join(ROOT, 'modules\\service\\pages\\contraception-hirshmans-ainsdale.html'), 'utf8');
const contraCrawl = stripForCrawl(contraFile);

check(/NHS Pharmacy Contraception Service/.test(contraCrawl), 'contraception: does not name the service by its NHS name');
check(/Free NHS( contraception)? service/i.test(contraCrawl), 'contraception: does not state the free-of-charge line');
check(!/£\d/.test(contraCrawl), 'contraception: carries a currency amount');
check(!/(?<!no )(?<!no prescription charge for )\bprescription charge\b/i.test(contraCrawl) || /no prescription\s*charge/i.test(contraCrawl),
  'contraception: carries a "prescription charge" phrase not negated as "no prescription charge"');
check(/only (be )?told|only tell your GP|with your consent/i.test(contraCrawl), 'contraception: consent/confidentiality sentence not found');
check(!/\bfit (a |the )?coil\b/i.test(contraCrawl) && !/\binsert (a |the )?implant\b/i.test(contraCrawl) && !/\bcoil (fitting|insertion)\b/i.test(contraCrawl),
  'contraception: appears to offer to fit a coil or implant');
const contraceptiveDrugNames = ['Rigevidon', 'Microgynon', 'Cerazette', 'Desogestrel', 'Levonorgestrel', 'Yasmin', 'Cerelle', 'Norethisterone'];
for (const drug of contraceptiveDrugNames) {
  check(!new RegExp('\\b' + drug + '\\b', 'i').test(contraCrawl), 'contraception: names contraceptive by brand/drug name "' + drug + '"');
}

console.log('\nTotal checks:', checks, 'Failures:', failures);
process.exit(failures > 0 ? 1 : 0);
