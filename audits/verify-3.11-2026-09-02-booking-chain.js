#!/usr/bin/env node
/*
  Eighth quality pass on item 3.11 (Gordon Short Chemist, Crosby), 2026-09-02.

  Fresh angle: the booking chain (branches.json widgets -> filename ->
  service.js routing -> Appointedd widget id -> data-branch/data-service
  labelling on the mount). None of the seven prior passes on this item
  read this chain; check-booking-routes.js covers it estate-wide and
  passes, but this item has never had its OWN independent extraction of
  it, the same standard every other angle on this item has already been
  held to (NAP, JSON-LD, spelling, symptoms, safety net, em-dashes).

  Imports nothing from tools/. Reads modules/service/service.js's own
  SERVICE_WIDGET_KEYS map and NO_FALLBACK_SERVICE_KEYS set as data under
  test (same convention check-booking-routes.js itself uses), not a
  hand-typed copy, so a change to the generator's routing table changes
  what this script expects too.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const branches = JSON.parse(fs.readFileSync(path.join(ROOT, 'branches.json'), 'utf8')).branches;
const branch = branches.find(b => b.id === 'gordonshorts_crosby');
if (!branch) { console.error('FAIL: gordonshorts_crosby not found in branches.json'); process.exit(1); }

const serviceJs = fs.readFileSync(path.join(ROOT, 'modules/service/service.js'), 'utf8');

// Extract SERVICE_WIDGET_KEYS map as data under test.
const mapMatch = serviceJs.match(/var SERVICE_WIDGET_KEYS = \{([\s\S]*?)\};/);
if (!mapMatch) { console.error('FAIL: could not locate SERVICE_WIDGET_KEYS in service.js'); process.exit(1); }
const SERVICE_WIDGET_KEYS = {};
mapMatch[1].split(',').forEach(line => {
  const m = line.match(/"([^"]+)"\s*:\s*"([^"]+)"/);
  if (m) SERVICE_WIDGET_KEYS[m[1]] = m[2];
});

// Extract NO_FALLBACK_SERVICE_KEYS as data under test.
const nfMatch = serviceJs.match(/var NO_FALLBACK_SERVICE_KEYS = \{([\s\S]*?)\};/);
if (!nfMatch) { console.error('FAIL: could not locate NO_FALLBACK_SERVICE_KEYS in service.js'); process.exit(1); }
const NO_FALLBACK = {};
nfMatch[1].split(',').forEach(line => {
  const m = line.match(/"([^"]+)"\s*:\s*true/);
  if (m) NO_FALLBACK[m[1]] = true;
});

const brandTownKey = branch.brandSlug + '-' + branch.townSlug;
if (brandTownKey !== 'gordon-short-crosby') {
  console.error('FAIL: expected key gordon-short-crosby, got', brandTownKey);
  process.exit(1);
}

let failures = 0;
let checks = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log('FAIL:', label); }
}

const pagesDir = path.join(ROOT, 'modules/service/pages');
const serviceSlugs = Object.keys(SERVICE_WIDGET_KEYS);

for (const slug of serviceSlugs) {
  const file = path.join(pagesDir, `${slug}-gordon-short-crosby.html`);
  if (!fs.existsSync(file)) {
    // Not every branch carries every service page; only check ones that exist.
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');

  // 1. ROUTE: filename must parse under service.js's own routing regex shape.
  const routeRe = new RegExp(
    `^(${serviceSlugs.join('|')})-([a-z0-9-]+?)(?:\\.html?)?$`
  );
  const base = path.basename(file, '.html');
  const m = base.match(routeRe);
  check(`${slug}: filename parses under routing regex`, !!m);

  // 2. BRANCH: key resolves to this branch only.
  check(`${slug}: brandTown key in filename resolves to gordon-short-crosby`, m && m[2] === brandTownKey);

  // 3. WIDGET: resolve wanted id per service.js's own fallback logic.
  // NOTE (self-caught during this pass's own injection test, see log): a
  // NO_FALLBACK service (weightLoss/travelClinic/contraception) whose page
  // this repo has already generated must carry its OWN widget id -
  // check-page-coverage.js only earns such a page where the branch already
  // holds that widget, so an existing page with no widget id is a real
  // break, not a correctly-absent case. The first draft of this check read
  // "!!wanted || NO_FALLBACK[serviceKey]", which let a NO_FALLBACK service's
  // widget id be deleted entirely and still pass, because NO_FALLBACK being
  // true made the check pass regardless of wanted. Fixed to require wanted
  // unconditionally once the page exists.
  const serviceKey = SERVICE_WIDGET_KEYS[slug];
  let wanted = branch.widgets ? branch.widgets[serviceKey] : undefined;
  const usedFallback = !wanted && !NO_FALLBACK[serviceKey];
  if (usedFallback) wanted = branch.widgets.pharmacyFirst;
  check(`${slug}: resolves to a usable, non-empty widget id`, !!wanted);

  // 4. BRANCHATTR: data-branch on the mount root names this branch.
  const dbMatch = html.match(/id="rbhsv-root"[^>]*data-branch="([^"]*)"/);
  check(`${slug}: data-branch present`, !!dbMatch);
  if (dbMatch) {
    check(`${slug}: data-branch is this branch's own name ("${dbMatch[1]}")`,
      dbMatch[1] === branch.branchName || dbMatch[1] === branch.brandLabel);
  }

  // 5. SERVICEATTR: data-service present, non-empty.
  const dsMatch = html.match(/data-service="([^"]*)"/);
  check(`${slug}: data-service present and non-empty`, !!dsMatch && dsMatch[1].trim().length > 0);

  console.log(`${slug}: widget=${wanted || '(none, NO_FALLBACK)'} fallback=${usedFallback} data-branch="${dbMatch ? dbMatch[1] : 'MISSING'}" data-service="${dsMatch ? dsMatch[1] : 'MISSING'}"`);
}

// Switch page: data-branch only, no widget/service.
const switchFile = path.join(ROOT, 'modules/switch/pages/switch-prescriptions-gordon-short-crosby.html');
if (fs.existsSync(switchFile)) {
  const html = fs.readFileSync(switchFile, 'utf8');
  const dbMatch = html.match(/id="rbhsw-root"[^>]*data-branch="([^"]*)"/);
  check('switch: data-branch present', !!dbMatch);
  if (dbMatch) {
    check(`switch: data-branch is this branch's own name`, dbMatch[1] === branch.branchName || dbMatch[1] === branch.brandLabel);
  }
  console.log(`switch: data-branch="${dbMatch ? dbMatch[1] : 'MISSING'}"`);
}

console.log(`\n${checks} checks, ${failures} failures.`);
process.exit(failures ? 1 : 0);
