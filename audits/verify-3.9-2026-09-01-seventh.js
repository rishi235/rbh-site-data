// Item 3.9 quality pass (seventh), 2026-09-01. Coleman and Leighs Pharmacy (Walton).
// Independent extraction, written fresh for this run. Shares no code with tools/ and
// does not import tools/seo-pattern.js, tools/build-service-pages.js or service.js -
// expected values are re-derived here from branches.json, the paste sheets and the
// general page conventions recorded in CLAUDE.md / RBH_DIGITAL_BUILD_PACK_v2.md, so a
// bug shared between a generator and this script would still be visible as a mismatch
// against the sheets and the branch data, not silently agreed with.
//
// This pass deliberately covers three families NOT exercised as independent
// re-derivations in this item's own six prior passes (checked against AGENT_LOG.md
// before writing this): booking-widget id assignment per page (including the Pharmacy
// First fallback rule), the Google Maps embed query (encoding AND value, cross-checked
// against the visible contact-card address), and the Meta Keywords line composed for
// each of the twelve Weebly paste sheets. A fourth, lighter family re-checks the
// title/description length and seoTown-presence rules already covered by
// check-seo-lengths.js and check-seo-pattern.js, independently, because this item's own
// passes have exercised NAP/JSON-LD/contamination/POM/brand-spelling far more than the
// SEO string composition itself.

const fs = require('fs');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8')).branches;
const b = branches.find(x => x.id === 'colemanleigh_liverpool');
if (!b) { console.error('branch colemanleigh_liverpool not found'); process.exit(1); }

let checks = 0, fails = [];
function check(cond, msg) { checks++; if (!cond) fails.push(msg); }

// ---------------------------------------------------------------------------
// FAMILY A: booking widget assignment, independently re-derived fallback rule
// ---------------------------------------------------------------------------
// The fallback rule (from CLAUDE.md "The booking chain - filename to diary"): a
// service page can use the branch's own Pharmacy First widget as a fallback ONLY if
// that service is one of the seven Pharmacy First conditions, i.e. the branch's own
// Pharmacy First overview page links to it. Anything else (weight loss, travel
// clinic, contraception) must carry its OWN widget id in branches.json and must NOT
// equal the pharmacyFirst id.

const pfOverviewHtml = fs.readFileSync('modules/service/pages/pharmacy-first-coleman-leigh-walton.html', 'utf8');
const pfConditionFiles = {
  'uti-treatment-coleman-leigh-walton.html': 'UTI',
  'sore-throat-treatment-coleman-leigh-walton.html': 'Sore throat',
  'sinusitis-treatment-coleman-leigh-walton.html': 'Sinusitis',
  'earache-treatment-coleman-leigh-walton.html': 'Earache',
  'impetigo-treatment-coleman-leigh-walton.html': 'Impetigo',
  'shingles-treatment-coleman-leigh-walton.html': 'Shingles',
  'insect-bite-treatment-coleman-leigh-walton.html': 'Infected insect bite',
};

// 1. Every condition file must be linked from the PF overview (this is what makes it
//    a Pharmacy First condition rather than a hardcoded assumption).
for (const [file, label] of Object.entries(pfConditionFiles)) {
  check(pfOverviewHtml.includes(`href="${file}"`), `PF overview does not link to ${file} (${label})`);
}

// 2. branches.json must carry a usable pharmacyFirst widget id (non-empty string),
//    because all 8 PF-family pages depend on the fallback resolving to something.
check(typeof b.widgets.pharmacyFirst === 'string' && b.widgets.pharmacyFirst.length > 0,
  'branches.json: colemanleigh_liverpool has no usable pharmacyFirst widget id');

// 3. Weight loss, travel clinic and contraception must each carry their OWN widget id,
//    distinct from pharmacyFirst (no silent fallback for a service with its own diary).
for (const svc of ['weightLoss', 'travelClinic', 'contraception']) {
  const id = b.widgets[svc];
  check(typeof id === 'string' && id.length > 0, `branches.json: colemanleigh_liverpool has no ${svc} widget id`);
  check(id !== b.widgets.pharmacyFirst, `branches.json: colemanleigh_liverpool's ${svc} widget id equals its pharmacyFirst id (would silently fall back)`);
}

// 4. No two of this branch's own widget ids collide with each other (a copy-paste
//    between two adjacent branches, the class of fault check-app-membership.js found
//    for hasApp, could also land two service keys on the same widget by mistake).
const ownIds = Object.entries(b.widgets);
for (let i = 0; i < ownIds.length; i++) {
  for (let j = i + 1; j < ownIds.length; j++) {
    check(ownIds[i][1] !== ownIds[j][1], `branches.json: colemanleigh_liverpool's ${ownIds[i][0]} and ${ownIds[j][0]} widget ids are identical (${ownIds[i][1]})`);
  }
}

// 5. Estate-wide: none of Coleman and Leighs's four widget ids is reused by ANY other
//    trading branch under the same service key (a wrong diary receiving this branch's
//    bookings, or this branch receiving someone else's).
for (const svc of ['pharmacyFirst', 'weightLoss', 'travelClinic', 'contraception']) {
  const myId = b.widgets[svc];
  if (!myId) continue;
  for (const other of branches) {
    if (other.id === b.id || other.disposed) continue;
    if (other.widgets && other.widgets[svc] === myId) {
      fails.push(`widget collision: colemanleigh_liverpool and ${other.id} share the same ${svc} widget id (${myId})`);
    }
    checks++;
  }
}

// ---------------------------------------------------------------------------
// FAMILY B: Google Maps embed - encoding, value, and cross-check against the
// visible contact-card address on the same page
// ---------------------------------------------------------------------------
const expectedAddressRaw = `${b.streetAddress}, ${b.addressLocality}, ${b.postalCode}`;
const expectedAddressEncoded = encodeURIComponent(expectedAddressRaw);

const allTwelveFiles = [
  'modules/service/pages/contraception-coleman-leigh-walton.html',
  'modules/service/pages/earache-treatment-coleman-leigh-walton.html',
  'modules/service/pages/impetigo-treatment-coleman-leigh-walton.html',
  'modules/service/pages/insect-bite-treatment-coleman-leigh-walton.html',
  'modules/service/pages/pharmacy-first-coleman-leigh-walton.html',
  'modules/service/pages/shingles-treatment-coleman-leigh-walton.html',
  'modules/service/pages/sinusitis-treatment-coleman-leigh-walton.html',
  'modules/service/pages/sore-throat-treatment-coleman-leigh-walton.html',
  'modules/service/pages/travel-clinic-coleman-leigh-walton.html',
  'modules/service/pages/uti-treatment-coleman-leigh-walton.html',
  'modules/service/pages/weight-loss-clinic-coleman-leigh-walton.html',
  'modules/switch/pages/switch-prescriptions-coleman-leigh-walton.html',
];

for (const f of allTwelveFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const noComments = html.replace(/<!--[\s\S]*?-->/g, '');

  const mapMatches = [...noComments.matchAll(/<iframe class="map" src="([^"]+)"/g)];
  check(mapMatches.length === 1, `${f}: expected exactly one map iframe, found ${mapMatches.length}`);
  if (mapMatches.length >= 1) {
    const src = mapMatches[0][1];
    check(src.startsWith('https://www.google.com/maps?q='), `${f}: map src does not start with the expected Google Maps host/path (${src})`);
    check(src.endsWith('&output=embed'), `${f}: map src does not end with &output=embed (${src})`);
    const qMatch = src.match(/[?&]q=([^&]+)/);
    check(!!qMatch, `${f}: map src has no q= query parameter`);
    if (qMatch) {
      check(qMatch[1] === expectedAddressEncoded, `${f}: map query "${decodeURIComponent(qMatch[1])}" does not equal expected "${expectedAddressRaw}"`);
    }
  }

  // Cross-check against the visible contact-card address line (independent of the map).
  const contactLineMatch = noComments.match(/<div class="contact-line"><p>([^<]+)<\/p><\/div>/);
  check(!!contactLineMatch, `${f}: no contact-line address paragraph found`);
  if (contactLineMatch) {
    check(contactLineMatch[1].trim() === expectedAddressRaw, `${f}: visible contact-card address "${contactLineMatch[1]}" does not equal expected "${expectedAddressRaw}"`);
  }
}

// ---------------------------------------------------------------------------
// FAMILY C: Meta Keywords line, read from the paste sheets, cross-checked against
// branches.json rather than against the page (the keywords line is Weebly-only,
// never rendered on the generated page itself)
// ---------------------------------------------------------------------------
const otherLiveBranches = branches.filter(x => x.id !== b.id && x.disposed !== true);
const allowedForeignTowns = new Set((b.serviceAreaList || []).filter(t => t !== b.seoTown));

function parseSheetBlocksForBranch(sheetPath, headingContains) {
  const text = fs.readFileSync(sheetPath, 'utf8');
  const blocks = text.split(/\n(?=## )/);
  return blocks.filter(blk => blk.startsWith('## ') && blk.slice(0, 200).includes(headingContains));
}

function extractField(block, label) {
  const re = new RegExp(`-\\s*\\*\\*${label}:\\*\\*\\s*(.+)`);
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

const sheetsToCheck = [
  ['modules/service/pages/SEO.md', 'Coleman and Leighs Pharmacy'],
  ['modules/service/pages/CONTRACEPTION-SEO.md', 'Coleman and Leighs Pharmacy'],
  ['modules/service/pages/TRAVEL-CLINIC-SEO.md', 'Coleman and Leighs Pharmacy'],
  ['modules/service/pages/WEIGHT-LOSS-SEO.md', 'Coleman and Leighs Pharmacy'],
  ['modules/switch/pages/SEO.md', 'Coleman and Leighs Pharmacy'],
];

let keywordBlocksRead = 0;
for (const [sheetPath, heading] of sheetsToCheck) {
  const blocks = parseSheetBlocksForBranch(sheetPath, heading);
  for (const blk of blocks) {
    const permalink = extractField(blk, 'Page Permalink');
    const keywords = extractField(blk, 'Meta Keywords');
    const label = permalink || sheetPath;

    check(!!permalink, `${sheetPath}: a Coleman and Leighs block has no Page Permalink`);
    check(!!keywords && keywords.length > 0, `${label}: Meta Keywords missing or empty`);
    if (!keywords) continue;
    keywordBlocksRead++;

    // own seoTown present
    const townRe = new RegExp(`\\b${b.seoTown}\\b`, 'i');
    check(townRe.test(keywords), `${label}: Meta Keywords does not contain own seoTown "${b.seoTown}"`);

    // no foreign live branch's seoTown, unless serviceAreaList excuses it
    for (const other of otherLiveBranches) {
      if (!other.seoTown || other.seoTown === b.seoTown) continue;
      if (allowedForeignTowns.has(other.seoTown)) continue;
      const foreignRe = new RegExp(`\\b${other.seoTown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      check(!foreignRe.test(keywords), `${label}: Meta Keywords contains foreign branch's seoTown "${other.seoTown}" (${other.id}) without a serviceAreaList excuse`);
    }

    // no foreign brandLabel
    for (const other of otherLiveBranches) {
      if (!other.brandLabel || other.brandLabel === b.brandLabel) continue;
      if (keywords.includes(other.brandLabel)) {
        fails.push(`${label}: Meta Keywords contains foreign branch's brandLabel "${other.brandLabel}" (${other.id})`);
      }
      checks++;
    }

    // no efficacy/results wording (small independently-written list, not imported from
    // tools/claim-patterns.js, deliberately narrower and phrased differently so this is
    // a genuine second opinion rather than the same list re-run)
    const bannedClaimWords = /\bbest\b|\bguarantee(d)?\b|\bproven\b|\bfast(est)?\s+results\b|\blose\s+\d/i;
    check(!bannedClaimWords.test(keywords), `${label}: Meta Keywords contains claim/efficacy wording ("${keywords}")`);
  }
}
check(keywordBlocksRead === 12, `expected to read Meta Keywords for all 12 Coleman and Leighs pages, actually read ${keywordBlocksRead}`);

// ---------------------------------------------------------------------------
// FAMILY D: title/description length and seoTown presence, independently recomposed
// from the sheets (lighter re-check; the heavy lifting for this family already sits in
// check-seo-lengths.js / check-seo-pattern.js and five prior passes of this item, so
// this is a fast confirmation rather than a full rebuild of the pattern rules)
// ---------------------------------------------------------------------------
for (const [sheetPath, heading] of sheetsToCheck) {
  const blocks = parseSheetBlocksForBranch(sheetPath, heading);
  for (const blk of blocks) {
    const title = extractField(blk, 'Page Title');
    const desc = extractField(blk, 'Page Description');
    const permalink = extractField(blk, 'Page Permalink');
    const label = permalink || sheetPath;

    check(!!title, `${label}: no Page Title`);
    check(!!desc, `${label}: no Page Description`);
    if (title) {
      check(title.length <= 65, `${label}: title is ${title.length} characters, over the 65 limit ("${title}")`);
      check(new RegExp(`\\b${b.seoTown}\\b`, 'i').test(title), `${label}: title does not contain seoTown "${b.seoTown}"`);
    }
    if (desc) {
      check(desc.length >= 80 && desc.length <= 165, `${label}: description is ${desc.length} characters, outside the 80-165 range`);
      check(new RegExp(`\\b${b.seoTown}\\b`, 'i').test(desc), `${label}: description does not contain seoTown "${b.seoTown}"`);
    }
  }
}

// ---------------------------------------------------------------------------
console.log('Coleman and Leighs (colemanleigh_liverpool) - item 3.9, seventh-pass independent extraction');
console.log(`Files/sheets covered: ${allTwelveFiles.length} pages, ${keywordBlocksRead} keyword blocks`);
console.log(`Total checks: ${checks}`);
console.log(`Failures: ${fails.length}`);
fails.forEach(f => console.log(' - ' + f));
process.exit(fails.length ? 1 : 0);
