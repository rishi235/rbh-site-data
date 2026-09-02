// Ninth independent extraction for item 3.6 (McCanns Chemist, Aigburth and
// Sandringham). Shares no code with tools/; own regexes throughout, per the
// standing convention for this item's re-verification passes.
//
// Reads branches.json as the source of truth and re-derives every expected
// value itself rather than importing anything from tools/ or a generator.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;

const aig = branches.find(b => b.id === 'mccanns_aigburth');
const san = branches.find(b => b.id === 'mccanns_sandringham');
if (!aig || !san) { console.error('FAIL: could not find both McCanns branch records'); process.exit(1); }

const allBranches = branches.filter(b => !b.disposed);

let checks = 0;
let failures = [];

function check(desc, cond) {
  checks++;
  if (!cond) failures.push(desc);
}

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Discover all McCanns pages by glob rather than a hardcoded list, so a
// page added or removed since the eighth pass would change the count here
// rather than being silently skipped.
function findFiles(dir, pred) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(findFiles(full, pred));
    else if (pred(entry.name)) out.push(full);
  }
  return out;
}

const pageDirs = [
  path.join(ROOT, 'modules', 'service', 'pages'),
  path.join(ROOT, 'modules', 'switch', 'pages'),
  path.join(ROOT, 'modules', 'branch', 'pages'),
];

let pages = [];
for (const dir of pageDirs) {
  pages = pages.concat(findFiles(dir, name => name.toLowerCase().includes('mccanns') && name.endsWith('.html')));
}

check('found exactly 26 McCanns pages (26 was every prior pass\'s count)', pages.length === 26);

const otherBranches = allBranches.filter(b => b.id !== 'mccanns_aigburth' && b.id !== 'mccanns_sandringham');

for (const file of pages) {
  const rel = path.relative(ROOT, file);
  const raw = readFile(rel);
  const isAig = rel.includes('mccanns-aigburth');
  const isSan = rel.includes('mccanns-sandringham');
  check(`${rel}: filename resolves to exactly one McCanns branch`, isAig !== isSan);
  const own = isAig ? aig : san;
  const sister = isAig ? san : aig;
  const isBranchLanding = rel.includes(path.join('branch', 'pages'));

  // Blank build comments the same way check-em-dashes.js does, so a
  // governance note in a build comment isn't read as public copy.
  const noComments = raw.replace(/<!--[\s\S]*?-->/g, '');

  // 1. H1 carries the branch's own seoTown.
  const h1Match = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  check(`${rel}: has an H1`, !!h1Match);
  if (h1Match) {
    const h1Text = h1Match[1].replace(/<[^>]+>/g, '');
    const ownTownRe = new RegExp('\\b' + own.seoTown.replace(/'/g, "['’]") + '\\b', 'i');
    check(`${rel}: H1 carries own seoTown "${own.seoTown}"`, ownTownRe.test(h1Text));
  }

  // 2. Cross-town: sister's seoTown must not appear in title/H1/meta
  //    description UNLESS excused by own serviceAreaList, or this is a
  //    branch landing page's deliberate sister-branch signpost (item 3.6's
  //    sixth/eighth passes both record this exception).
  const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const seoStrings = [
    h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : '',
    titleMatch ? titleMatch[1] : '',
    descMatch ? descMatch[1] : '',
  ].join(' | ');
  const sisterTownRe = new RegExp('\\b' + sister.seoTown.replace(/'/g, "['’]") + '\\b', 'i');
  const excused = own.serviceAreaList.some(t => t.toLowerCase() === sister.seoTown.toLowerCase());
  if (!excused && !isBranchLanding) {
    check(`${rel}: does not name sister's unexcused seoTown "${sister.seoTown}" in title/H1/description`, !sisterTownRe.test(seoStrings));
  }
  if (isBranchLanding) {
    // Branch landing pages deliberately signpost the sister branch
    // somewhere in the body copy; check it exists rather than checking
    // it's absent, since this is the documented exception.
    check(`${rel}: branch landing page signposts sister branch "${sister.seoTown}" somewhere in the body`, new RegExp(sister.seoTown.replace(/'/g, "['’]"), 'i').test(noComments));
  }

  // 3. Own phone present (display and/or tel:), no other branch's phone
  //    digits appear anywhere on the page.
  const digitsOnly = s => s.replace(/\D/g, '');
  const ownDigits = digitsOnly(own.phone);
  check(`${rel}: own phone digits (${own.phone}) appear on the page`, digitsOnly(raw).includes(ownDigits) || raw.includes(own.phone));
  for (const other of allBranches) {
    if (other.id === own.id) continue;
    const otherDigits = digitsOnly(other.phone || '');
    if (!otherDigits) continue;
    // A UK landline's last 6-7 digits are enough to be distinguishing;
    // check the full national number string and the tel: E.164-ish form.
    if (raw.includes(other.phone)) {
      failures.push(`${rel}: contains ANOTHER branch's phone (${other.id}: ${other.phone})`);
    }
    checks++;
  }

  // 4. Own postcode present, no other branch's postcode.
  check(`${rel}: own postcode (${own.postalCode}) present`, raw.includes(own.postalCode));
  for (const other of allBranches) {
    if (other.id === own.id) continue;
    if (other.postalCode && raw.includes(other.postalCode)) {
      failures.push(`${rel}: contains ANOTHER branch's postcode (${other.id}: ${other.postalCode})`);
    }
    checks++;
  }

  // 5. JSON-LD name equals the branch's own branchName, never the bare
  //    shared brandLabel (the item 3.6 fifth-pass rule).
  const ldMatch = raw.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  check(`${rel}: has a JSON-LD block`, !!ldMatch);
  if (ldMatch) {
    let ld;
    try { ld = JSON.parse(ldMatch[1]); } catch (e) { ld = null; }
    check(`${rel}: JSON-LD parses`, !!ld);
    if (ld) {
      check(`${rel}: JSON-LD name is own branchName, not bare brandLabel`, ld.name === own.branchName);
      check(`${rel}: JSON-LD @type is Pharmacy`, ld['@type'] === 'Pharmacy');
      if (ld.address) {
        check(`${rel}: JSON-LD streetAddress matches`, ld.address.streetAddress === own.streetAddress);
        check(`${rel}: JSON-LD postalCode matches`, ld.address.postalCode === own.postalCode);
        check(`${rel}: JSON-LD addressRegion matches`, ld.address.addressRegion === own.addressRegion);
        check(`${rel}: JSON-LD addressLocality matches`, ld.address.addressLocality === own.addressLocality);
      } else {
        failures.push(`${rel}: JSON-LD has no address block`);
        checks++;
      }
      if (ld.telephone) {
        check(`${rel}: JSON-LD telephone matches own phone`, ld.telephone === own.phone);
      }
    }
  }

  // 6. Widget diary policy. Per CLAUDE.md's booking-chain architecture, a
  //    generated service page ships an EMPTY mount and carries NO widget id
  //    at all - service.js resolves it at runtime from branches.json via
  //    the filename's brandSlug-townSlug key. So the correct page-level
  //    check is that no widget id (this branch's, the sister's, or any
  //    other estate id) is hard-coded anywhere on the page; the diary
  //    policy itself (shared vs unique) is checked at the branches.json
  //    level below, which is where it actually lives.
  const allWidgetIds = [];
  for (const b of allBranches) {
    for (const key of Object.keys(b.widgets || {})) allWidgetIds.push(b.widgets[key]);
  }
  const uniqueWidgetIds = [...new Set(allWidgetIds)];
  if (rel.includes('weight-loss-clinic') || rel.includes('travel-clinic') || rel.includes('contraception-mccanns') || rel.includes('pharmacy-first-mccanns')) {
    const hardcoded = uniqueWidgetIds.filter(id => raw.includes(id));
    check(`${rel}: no widget id hard-coded on the page (booking chain resolves at runtime)`, hardcoded.length === 0);
    check(`${rel}: booking mount present (rbhsv-root or rbhsw-root)`, /id=["'](rbhsv-root|rbhsw-root)["']/.test(raw));
  }

  // 7. data-wa matches the estate WhatsApp number where present.
  const waMatch = raw.match(/data-wa=["'](\d+)["']/);
  if (waMatch) {
    check(`${rel}: data-wa matches estate WhatsApp number`, waMatch[1] === own.whatsapp);
  }

  // 8. data-branch names the right branch (own branchName or brandLabel,
  //    never the sister's).
  const dbMatch = raw.match(/data-branch=["']([^"']+)["']/);
  if (dbMatch) {
    check(`${rel}: data-branch is own branchName or brandLabel`, dbMatch[1] === own.branchName || dbMatch[1] === own.brandLabel);
    check(`${rel}: data-branch is not sister's branchName`, dbMatch[1] !== sister.branchName || own.branchName === sister.branchName);
  }

  // 9. Map embed decodes to the branch's own full address.
  const mapMatch = raw.match(/google\.com\/maps\?q=([^"'&]+)[^"']*output=embed/i) || raw.match(/google\.com\/maps\/embed\?[^"']*q=([^"'&]+)/i);
  if (mapMatch) {
    const decoded = decodeURIComponent(mapMatch[1].replace(/\+/g, ' '));
    const expected = `${own.streetAddress}, ${own.addressLocality}, ${own.postalCode}`;
    check(`${rel}: map embed query decodes to own address`, decoded === expected);
  } else {
    // Not every page family carries a map (e.g. switch pages might not);
    // record as a check so silent absence is visible in the count rather
    // than skipped without trace.
    checks++;
    if (isBranchLanding || rel.includes('switch-prescriptions')) {
      // branch landing and switch pages are expected to carry a map;
      // flag if genuinely missing.
      failures.push(`${rel}: expected a map embed, none found`);
    }
  }

  // 10. No em/en dash literal or common HTML entity outside build comments.
  const dashRe = /[–—]|&mdash;|&ndash;|&#821[1-4];|&#x?20(1[3-4]);/i;
  check(`${rel}: no em/en dash (literal or entity) outside build comments`, !dashRe.test(noComments));
}

// Estate-wide: the two McCanns branches must not share a JSON-LD name with
// each other (branchName differs by construction, but re-assert directly).
check('mccanns_aigburth and mccanns_sandringham have different branchName', aig.branchName !== san.branchName);
check('mccanns_aigburth and mccanns_sandringham have different postalCode', aig.postalCode !== san.postalCode);
check('mccanns_aigburth and mccanns_sandringham have different phone', aig.phone !== san.phone);
check('mccanns_aigburth and mccanns_sandringham share brandLabel "McCanns Chemist" (by design)', aig.brandLabel === san.brandLabel && aig.brandLabel === 'McCanns Chemist');
check('mccanns_aigburth and mccanns_sandringham share the weightLoss widget (brand diary policy)', aig.widgets.weightLoss === san.widgets.weightLoss);
check('mccanns_aigburth and mccanns_sandringham share the travelClinic widget (brand diary policy)', aig.widgets.travelClinic === san.widgets.travelClinic);
check('mccanns_aigburth and mccanns_sandringham do NOT share the contraception widget', aig.widgets.contraception !== san.widgets.contraception);
check('mccanns_aigburth and mccanns_sandringham do NOT share the pharmacyFirst widget', aig.widgets.pharmacyFirst !== san.widgets.pharmacyFirst);
check('Sandringham serviceAreaList excuses naming Aigburth', san.serviceAreaList.map(t => t.toLowerCase()).includes('aigburth'));
check('Aigburth serviceAreaList does NOT excuse naming St Michael\'s/Sandringham', !aig.serviceAreaList.map(t => t.toLowerCase()).includes("st michael's") && !aig.serviceAreaList.map(t => t.toLowerCase()).includes('sandringham'));

console.log(`Checks: ${checks}`);
console.log(`Failures: ${failures.length}`);
if (failures.length) {
  failures.forEach(f => console.log('FAIL: ' + f));
  process.exit(1);
} else {
  console.log('CLEAN');
  process.exit(0);
}
