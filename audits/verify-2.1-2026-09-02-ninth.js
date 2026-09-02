// Independent ninth-pass verification for worklist item 2.1 (Fishlocks Chemist Ainsdale).
// Written fresh for this run. Shares no code with anything under tools/, and is not a
// copy of any prior verify-2.1-*.js (none existed before this run; prior 2.1 passes used
// ad hoc PowerShell/Python extractions logged directly into AGENT_WORKLIST.md rather than
// a checked-in script). All expected values are re-derived from branches.json directly.
//
// Usage: node verify-2.1-2026-09-02-ninth.js <repoRoot>

const fs = require('fs');
const path = require('path');

const repoRoot = process.argv[2];
if (!repoRoot) {
  console.error('Usage: node verify-2.1-2026-09-02-ninth.js <repoRoot>');
  process.exit(2);
}

const branchesPath = path.join(repoRoot, 'branches.json');
const data = JSON.parse(fs.readFileSync(branchesPath, 'utf8'));
const branches = data.branches.filter(b => !b.disposed);

const own = branches.find(b => b.id === 'fishlocks_ainsdale');
if (!own) {
  console.error('fishlocks_ainsdale not found in branches.json');
  process.exit(2);
}

const others = branches.filter(b => b.id !== own.id);

const pageFiles = [
  'modules/branch/pages/pharmacy-fishlocks-ainsdale.html',
  'modules/service/pages/contraception-fishlocks-ainsdale.html',
  'modules/service/pages/earache-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/impetigo-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/insect-bite-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/pharmacy-first-fishlocks-ainsdale.html',
  'modules/service/pages/shingles-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/sinusitis-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/sore-throat-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/travel-clinic-fishlocks-ainsdale.html',
  'modules/service/pages/uti-treatment-fishlocks-ainsdale.html',
  'modules/service/pages/weight-loss-clinic-fishlocks-ainsdale.html',
  'modules/switch/pages/switch-prescriptions-fishlocks-ainsdale.html',
];

let checks = 0;
let failures = [];

function check(label, cond, detail) {
  checks++;
  if (!cond) failures.push(label + (detail ? ' :: ' + detail : ''));
}

function blankBuildComments(html) {
  // Strip <!-- ... --> build headers, same convention documented in CLAUDE.md
  // for check-em-dashes.js etc, re-implemented independently here.
  return html.replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
}

function normPhone(p) {
  return (p || '').replace(/\s+/g, '');
}

const ainsdalePostcode = own.postalCode;
const ainsdalePhone = own.phone;
const ainsdalePhoneDigits = normPhone(own.phone);

for (const rel of pageFiles) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    check('file-exists:' + rel, false, 'missing');
    continue;
  }
  const raw = fs.readFileSync(full, 'utf8');
  const visible = blankBuildComments(raw);

  // 1. Own postcode present.
  check('own-postcode-present:' + rel, visible.includes(ainsdalePostcode), ainsdalePostcode);

  // 2. No foreign live-branch postcode.
  for (const ob of others) {
    if (ob.postalCode && visible.includes(ob.postalCode)) {
      check('foreign-postcode:' + rel, false, `${ob.id} postcode ${ob.postalCode} found`);
    } else {
      check('foreign-postcode:' + rel + ':' + ob.id, true);
    }
  }

  // 3. Own phone present somewhere (tel: href or visible), spaced or unspaced.
  const hasOwnPhoneSpaced = visible.includes(ainsdalePhone);
  const hasOwnPhoneDigits = visible.replace(/[^\d+]/g, '').includes(ainsdalePhoneDigits.replace(/^0/, '')) ||
    visible.replace(/[^\d+]/g, '').includes(ainsdalePhoneDigits);
  check('own-phone-present:' + rel, hasOwnPhoneSpaced || hasOwnPhoneDigits, ainsdalePhone);

  // 4. No foreign phone number (spaced form) from any other branch.
  for (const ob of others) {
    if (ob.phone && visible.includes(ob.phone)) {
      check('foreign-phone:' + rel, false, `${ob.id} phone ${ob.phone} found`);
    } else {
      check('foreign-phone:' + rel + ':' + ob.id, true);
    }
  }

  // 5. Own seoTown (Ainsdale) present.
  check('own-seotown-present:' + rel, new RegExp('\\bAinsdale\\b').test(visible));

  // 6. No foreign live-branch seoTown in the page's SEO-relevant strings (title, H1, meta
  // description), unless it is in this branch's own serviceAreaList. Scoped to title/H1/
  // description rather than the whole page body, matching the scope CLAUDE.md documents for
  // check-seo-pattern.js's own absence rule ("the same three strings it already reads").
  // A whole-body scan would also catch the deliberate "Looking for our other branch?"
  // sister-branch cross-link paragraph that build-branch-landing-pages.js composes on
  // purpose for shared-domain pairs, which is a different, permitted thing (same category
  // as check-gbp-packs.js's KNOWN_SISTER claim, not a foreign-town SEO claim).
  const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/i);
  const h1Match = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const descMatch = raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const seoStrings = [titleMatch, h1Match, descMatch].filter(Boolean).map(m => m[1]);
  const svcArea = own.serviceAreaList || [];
  for (const ob of others) {
    if (!ob.seoTown) continue;
    const re = new RegExp('\\b' + ob.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    const hitIn = seoStrings.find(s => re.test(s));
    if (hitIn && !svcArea.includes(ob.seoTown)) {
      check('foreign-seotown-in-seo-strings:' + rel, false, `${ob.id} seoTown "${ob.seoTown}" found in "${hitIn}" and not in serviceAreaList`);
    } else {
      check('foreign-seotown-in-seo-strings:' + rel + ':' + ob.id, true);
    }
  }

  // 7. Singular "Fishlock" brand near-miss (should never appear; correct form is "Fishlocks").
  const singularHits = visible.match(/\bFishlock\b(?!s)/g);
  check('no-singular-fishlock:' + rel, !singularHits, singularHits ? singularHits.join(',') : '');

  // 8. "Fishlock's" apostrophe-s near-miss.
  check('no-apostrophe-fishlock:' + rel, !/Fishlock's/.test(visible));

  // 9. No em dash or en dash literal or entity outside build comments (build comments already blanked).
  const dashHits = visible.match(/[–—]|&ndash;|&mdash;/g);
  check('no-em-en-dash:' + rel, !dashHits, dashHits ? dashHits.join(',') : '');

  // 10. JSON-LD block present and parses.
  const ldMatch = raw.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/);
  check('jsonld-present:' + rel, !!ldMatch);
  if (ldMatch) {
    let ld;
    try {
      ld = JSON.parse(ldMatch[1]);
    } catch (e) {
      check('jsonld-parses:' + rel, false, e.message);
      ld = null;
    }
    if (ld) {
      check('jsonld-parses:' + rel, true);
      check('jsonld-type-pharmacy:' + rel, ld['@type'] === 'Pharmacy', String(ld['@type']));
      if (ld.address) {
        check('jsonld-street:' + rel, ld.address.streetAddress === own.streetAddress, ld.address.streetAddress);
        check('jsonld-locality:' + rel, ld.address.addressLocality === own.addressLocality, ld.address.addressLocality);
        check('jsonld-postcode:' + rel, ld.address.postalCode === own.postalCode, ld.address.postalCode);
        check('jsonld-region:' + rel, ld.address.addressRegion === own.addressRegion, ld.address.addressRegion);
        check('jsonld-country:' + rel, ld.address.addressCountry === own.addressCountry, ld.address.addressCountry);
      } else {
        check('jsonld-address-present:' + rel, false);
      }
      check('jsonld-telephone:' + rel, ld.telephone === own.phone, ld.telephone);
    }
  }

  // 11. Google Maps embed query decodes to this branch's own address. Actual live URL shape
  // confirmed by direct inspection is "google.com/maps?q=...&output=embed", not
  // "google.com/maps/embed?...q=...".
  const mapMatch = raw.match(/google\.com\/maps\?[^"']*q=([^"'&]+)/);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1]).replace(/\+/g, ' ');
    const expected = `${own.streetAddress}, ${own.addressLocality}, ${own.postalCode}`;
    check('map-query-matches:' + rel, decoded === expected, `got "${decoded}" expected "${expected}"`);
  } else {
    check('map-embed-present:' + rel, false, 'no google.com/maps/embed query found');
  }

  // 12. data-branch attribute, where present, names only this branch.
  const dataBranchMatch = raw.match(/data-branch="([^"]*)"/);
  if (dataBranchMatch) {
    const val = dataBranchMatch[1];
    const okValues = [own.branchName, own.brandLabel];
    check('data-branch-own:' + rel, okValues.includes(val), val);
  }

  // 13. data-wa (WhatsApp) matches the branch's own whatsapp field where present.
  const dataWaMatch = raw.match(/data-wa="([^"]*)"/);
  if (dataWaMatch) {
    check('data-wa-matches:' + rel, dataWaMatch[1] === own.whatsapp, dataWaMatch[1]);
  }
}

// 14. pfLink ownership: the branch's own pfLink must resolve to a filename this branch owns
// (i.e. contains "fishlocks-ainsdale"), not a sister branch's page.
check('pflink-ownership', own.pfLink.includes('fishlocks-ainsdale'), own.pfLink);

// 15. No other live branch's pfLink points at an Ainsdale-owned filename.
for (const ob of others) {
  if (ob.pfLink && ob.pfLink.includes('fishlocks-ainsdale')) {
    check('pflink-not-hijacked-by:' + ob.id, false, ob.pfLink);
  }
}

console.log(`Checks: ${checks}`);
console.log(`Failures: ${failures.length}`);
if (failures.length) {
  console.log('--- FAILURE DETAIL ---');
  for (const f of failures) console.log(f);
  process.exit(1);
} else {
  console.log('ALL CLEAN');
  process.exit(0);
}
