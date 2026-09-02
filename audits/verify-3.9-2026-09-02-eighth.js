// Eighth independent verification pass for AGENT_WORKLIST.md item 3.9,
// Coleman and Leighs Pharmacy (Walton, Liverpool L4 6TH).
// Written fresh for this run. Shares no code with tools/*.js or any prior
// verify-3.9-*.js script. Deliberately covers four families not exercised
// as independent re-derivations in this item's own seven prior passes:
//   1. CDN pin values on this branch's pages, re-derived from each
//      generator's own `const PIN` declaration rather than imported.
//   2. In-page fragment targets (any href="#id" on this branch's own
//      pages resolves to a real id on the same page).
//   3. URL scheme: no bare http:// anywhere in this branch's 12 pages
//      (every link/asset must be https, per check-url-scheme.js's remit,
//      re-derived independently here).
//   4. The GBP pack's blood pressure check age cohort (40 and over) and
//      travel clinic yellow fever silence, read directly off
//      gbp-packs/coleman-leigh-walton.md rather than through
//      check-pharmacy-first-eligibility.js or check-travel-clinic-copy.js.
//
// Run: node verify-3.9-2026-09-02-eighth.js  (from repo root, or pass
// REPO_ROOT env var)

const fs = require('fs');
const path = require('path');

const ROOT = process.env.REPO_ROOT || process.cwd();
const BRAND_SLUG = 'coleman-leigh';
const TOWN_SLUG = 'walton';
const BRANCH_ID = 'colemanleigh_liverpool';

let checks = 0;
let failures = [];

function ok(label) { checks++; }
function fail(label, detail) { checks++; failures.push(`${label}: ${detail}`); }

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

// ---- Load branches.json fact base ----
const branches = JSON.parse(read(path.join(ROOT, 'branches.json')));
const branch = branches.branches.find(b => b.id === BRANCH_ID);
if (!branch) {
  console.error('FATAL: branch not found in branches.json: ' + BRANCH_ID);
  process.exit(2);
}

// ---- Collect this branch's 12 generated pages ----
const servicePagesDir = path.join(ROOT, 'modules', 'service', 'pages');
const switchPagesDir = path.join(ROOT, 'modules', 'switch', 'pages');

const serviceFiles = fs.readdirSync(servicePagesDir)
  .filter(f => f.endsWith('.html') && f.includes(`${BRAND_SLUG}-${TOWN_SLUG}`));
const switchFiles = fs.readdirSync(switchPagesDir)
  .filter(f => f.endsWith('.html') && f.includes(`${BRAND_SLUG}-${TOWN_SLUG}`));

const allPages = [
  ...serviceFiles.map(f => ({ file: f, full: path.join(servicePagesDir, f), family: 'service' })),
  ...switchFiles.map(f => ({ file: f, full: path.join(switchPagesDir, f), family: 'switch' })),
];

if (allPages.length !== 12) {
  fail('page-count', `expected 12 pages for ${BRAND_SLUG}-${TOWN_SLUG}, found ${allPages.length}: ${allPages.map(p=>p.file).join(', ')}`);
} else {
  ok('page-count');
}

// ============================================================
// Family 1: CDN pin values, re-derived from each generator's own PIN.
// ============================================================
const generatorPins = {};

function extractPin(generatorFile) {
  const src = read(path.join(ROOT, 'tools', generatorFile));
  const m = src.match(/const\s+PIN\s*=\s*['"`]([^'"`]+)['"`]/);
  return m ? m[1] : null;
}

generatorPins['build-service-pages.js'] = extractPin('build-service-pages.js');
generatorPins['build-contraception-pages.js'] = extractPin('build-contraception-pages.js');
generatorPins['build-travel-clinic-pages.js'] = extractPin('build-travel-clinic-pages.js');
generatorPins['build-weight-loss-pages.js'] = extractPin('build-weight-loss-pages.js');
generatorPins['build-switch-pages.js'] = extractPin('build-switch-pages.js');

for (const [gen, pin] of Object.entries(generatorPins)) {
  if (!pin) {
    fail('generator-pin-present', `${gen} declared no const PIN (may be intentional if it emits no CDN ref; not treated as fatal here, flagged for visibility)`);
  } else {
    ok('generator-pin-present');
  }
}

for (const page of allPages) {
  const html = read(page.full);
  const jsdelivrRefs = [...html.matchAll(/cdn\.jsdelivr\.net\/gh\/[^"'\s)]+@([^/"'\s]+)\//g)].map(m => m[1]);
  if (jsdelivrRefs.length === 0) {
    fail('cdn-ref-present', `${page.file} carries no jsDelivr @ref reference`);
    continue;
  }
  // Figure out which generator owns this page by family, to know the expected pin(s).
  let expectedPins = [];
  if (page.file.startsWith('switch-prescriptions-')) {
    expectedPins = [generatorPins['build-switch-pages.js']].filter(Boolean);
  } else if (page.file.startsWith('contraception-')) {
    expectedPins = [generatorPins['build-contraception-pages.js']].filter(Boolean);
  } else if (page.file.startsWith('travel-clinic-')) {
    expectedPins = [generatorPins['build-travel-clinic-pages.js']].filter(Boolean);
  } else if (page.file.startsWith('weight-loss-clinic-')) {
    expectedPins = [generatorPins['build-weight-loss-pages.js']].filter(Boolean);
  } else {
    // Pharmacy First / condition pages / pharmacy-first overview
    expectedPins = [generatorPins['build-service-pages.js']].filter(Boolean);
  }
  for (const ref of jsdelivrRefs) {
    if (expectedPins.length && !expectedPins.includes(ref)) {
      fail('cdn-pin-matches-generator', `${page.file} loads @${ref}, generator(s) for this family declare ${JSON.stringify(expectedPins)}`);
    } else {
      ok('cdn-pin-matches-generator');
    }
  }
}

// ============================================================
// Family 2: In-page fragment targets resolve on the same page.
// ============================================================
for (const page of allPages) {
  const html = read(page.full);
  const hrefFragments = [...html.matchAll(/href=["']#([A-Za-z0-9_-]+)["']/g)].map(m => m[1]);
  if (hrefFragments.length === 0) {
    ok('fragment-targets'); // nothing to check on this page, not a defect
    continue;
  }
  const ids = new Set([...html.matchAll(/\sid=["']([A-Za-z0-9_-]+)["']/g)].map(m => m[1]));
  const names = new Set([...html.matchAll(/\sname=["']([A-Za-z0-9_-]+)["']/g)].map(m => m[1]));
  for (const frag of hrefFragments) {
    if (ids.has(frag) || names.has(frag)) {
      ok('fragment-targets');
    } else {
      fail('fragment-targets', `${page.file} links to #${frag}, no element with that id/name found on the page`);
    }
  }
}

// ============================================================
// Family 3: URL scheme - no bare http:// anywhere in this branch's pages.
// ============================================================
for (const page of allPages) {
  const html = read(page.full);
  const httpMatches = [...html.matchAll(/["'(]http:\/\/[^"')\s]+/g)].map(m => m[0]);
  if (httpMatches.length > 0) {
    fail('url-scheme-https-only', `${page.file} contains bare http:// reference(s): ${httpMatches.join(', ')}`);
  } else {
    ok('url-scheme-https-only');
  }
}

// ============================================================
// Family 4: GBP pack facts read directly (not via check-*.js).
// ============================================================
const packPath = path.join(ROOT, 'gbp-packs', 'coleman-leigh-walton.md');
if (!fs.existsSync(packPath)) {
  fail('gbp-pack-present', 'gbp-packs/coleman-leigh-walton.md does not exist');
} else {
  ok('gbp-pack-present');
  const pack = read(packPath);
  const collapsed = pack.replace(/\s+/g, ' ');

  // Blood pressure cohort: must say "40 and over" or "aged 40" (not "over 40").
  const bpMentions = [...collapsed.matchAll(/blood pressure[^.]*\./gi)];
  if (bpMentions.length === 0) {
    ok('bp-cohort-not-applicable'); // this branch's pack may not mention BP checks; not a defect per se
  } else {
    let sawCorrectCohort = false;
    let sawWrongCohort = false;
    for (const m of bpMentions) {
      const sentence = m[0];
      if (/\b(aged\s*40|40\s*and\s*over|40\+)\b/i.test(sentence)) sawCorrectCohort = true;
      if (/\bover\s*40\b/i.test(sentence) && !/40\s*and\s*over/i.test(sentence)) sawWrongCohort = true;
    }
    if (sawWrongCohort) {
      fail('bp-cohort-wording', `coleman-leigh-walton.md uses "over 40" (excludes 40-year-olds) instead of "40 and over" in a blood pressure sentence`);
    } else if (sawCorrectCohort) {
      ok('bp-cohort-wording');
    } else {
      fail('bp-cohort-wording', 'blood pressure sentence present but neither the correct nor the known-wrong cohort phrase matched; needs manual read');
    }
  }

  // Yellow fever: Coleman and Leighs is not in the travel clinic file list checked
  // here (branches.json has no yellowFeverCentre field per CLAUDE.md Q48), so the
  // pack must not assert yellow fever availability as a fact (questions are fine).
  const yellowFeverAssertions = [...collapsed.matchAll(/yellow fever[^.?]*[.?]/gi)]
    .filter(m => !/\?\s*$/.test(m[0].trim()));
  if (yellowFeverAssertions.length > 0) {
    fail('yellow-fever-silence', `pack contains a yellow fever statement (not a question): ${yellowFeverAssertions.map(m=>m[0].trim()).join(' | ')}`);
  } else {
    ok('yellow-fever-silence');
  }

  // Sister-branch claim rule: Coleman and Leighs has no shared brandLabel with any
  // other live branch (brandLabel is unique to it), so the pack must not claim a
  // sister branch.
  const sisterBrand = branches.branches.filter(b => b.brandLabel === branch.brandLabel && b.id !== branch.id && !b.disposed);
  const sisterMentions = [...collapsed.matchAll(/sister branch[^.]*\./gi)];
  if (sisterBrand.length === 0 && sisterMentions.length > 0) {
    fail('sister-branch-claim', `pack mentions a sister branch but no other live branch shares brandLabel "${branch.brandLabel}": ${sisterMentions.map(m=>m[0].trim()).join(' | ')}`);
  } else {
    ok('sister-branch-claim');
  }
}

// ---- Report ----
console.log(`Item 3.9 eighth independent pass: ${checks} checks, ${failures.length} failures.`);
if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures) console.log(' - ' + f);
  process.exit(1);
} else {
  console.log('0 failures.');
  process.exit(0);
}
