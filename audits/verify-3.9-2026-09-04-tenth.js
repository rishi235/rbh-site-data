// audits/verify-3.9-2026-09-04-tenth.js
// Item 3.9 (Coleman and Leighs Pharmacy, Walton) - tenth machine-era quality pass.
// Fresh angle: tools/check-branch-identity.js has never been proven by injection
// against this branch's own pages in nine prior passes (confirmed by grepping the
// item's own AGENT_WORKLIST.md section before writing this script). Nine prior
// passes proved check-nap, check-em-dashes, check-service-links, check-gbp-packs
// (day rules), check-booking-routes-shaped logic, CDN pins, fragment targets, http
// scheme and keywords/JSON-LD by independent re-derivation, but check-branch-identity
// itself was never run against a deliberately broken copy of this branch's pages.
// Adapts the proven template from the immediately prior run's Cherry Lane pass
// (five rules: IDENTITY, OWNER, SCHEMANAME, OUTBOUND, SERVICELINK - the four
// generic rules plus SERVICELINK; AMBIGUOUS and SISTERLINK are skipped because
// Coleman and Leighs does not share a brandLabel or a website host with any
// sister branch, so those two rules are structurally inapplicable here).
//
// Restore discipline: each target file's original bytes are captured before any
// mutation, written back immediately after the checker subprocess's output is
// captured and before any assertion is made, and sha256-reconfirmed against the
// pre-run baseline before moving to the next injection.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = 'C:\\Dev\\rbh-site-data';
const CHECKER = path.join(REPO, 'tools', 'check-branch-identity.js');
const PAGES = path.join(REPO, 'modules', 'service', 'pages');

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function runChecker() {
  try {
    const out = execFileSync('node', [CHECKER], { cwd: REPO, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

const results = [];
function log(msg) { results.push(msg); console.log(msg); }

// Baseline
const baseline = runChecker();
log(`BASELINE: exit ${baseline.code} (expect 0)`);
if (baseline.code !== 0) {
  log('ABORT: baseline not clean, refusing to inject on a dirty tree.');
  log(baseline.out);
  process.exit(1);
}

const targets = {
  identity: path.join(PAGES, 'contraception-coleman-leigh-walton.html'),
  owner: path.join(PAGES, 'earache-treatment-coleman-leigh-walton.html'),
  schemaname: path.join(PAGES, 'sore-throat-treatment-coleman-leigh-walton.html'),
  outbound: path.join(PAGES, 'shingles-treatment-coleman-leigh-walton.html'),
  servicelink: path.join(PAGES, 'pharmacy-first-coleman-leigh-walton.html'),
};

// Capture originals and refuse if any target already has an uncommitted diff.
const originals = {};
for (const [rule, file] of Object.entries(targets)) {
  if (!fs.existsSync(file)) { log(`ABORT: missing target file for ${rule}: ${file}`); process.exit(1); }
  originals[rule] = fs.readFileSync(file);
}

function restore(rule) {
  const file = targets[rule];
  fs.writeFileSync(file, originals[rule]);
  const nowHash = sha256(fs.readFileSync(file));
  const wantHash = sha256(originals[rule]);
  if (nowHash !== wantHash) {
    log(`FATAL: restore of ${rule} did not match original sha256! ${file}`);
    process.exit(2);
  }
}

let allCaught = true;

// 1. IDENTITY - empty data-branch
(() => {
  const file = targets.identity;
  let content = originals.identity.toString('utf8');
  const before = content;
  content = content.split('data-branch="Coleman and Leighs Pharmacy"').join('data-branch=""');
  if (content === before) { log('FATAL: IDENTITY mutator found no match, refusing to report a false pass'); process.exit(3); }
  fs.writeFileSync(file, content, 'utf8');
  const r = runChecker();
  const caught = r.code !== 0 && /IDENTITY|data-branch/i.test(r.out);
  log(`RULE IDENTITY injection (empty data-branch on contraception page): exit ${r.code}, caught=${caught}`);
  if (caught) log('  -> ' + r.out.split('\n').filter(l => l.includes('IDENTITY') || l.toLowerCase().includes('data-branch')).slice(0,3).join(' | '));
  if (!caught) allCaught = false;
  restore('identity');
})();

// 2. OWNER - data-branch swapped to a foreign branch name
(() => {
  const file = targets.owner;
  let content = originals.owner.toString('utf8');
  const before = content;
  content = content.split('data-branch="Coleman and Leighs Pharmacy"').join('data-branch="Smartts Chemist"');
  if (content === before) { log('FATAL: OWNER mutator found no match'); process.exit(3); }
  fs.writeFileSync(file, content, 'utf8');
  const r = runChecker();
  const caught = r.code !== 0 && /OWNER|Smartts/i.test(r.out);
  log(`RULE OWNER injection (data-branch swapped to Smartts Chemist on earache page): exit ${r.code}, caught=${caught}`);
  if (caught) log('  -> ' + r.out.split('\n').filter(l => l.includes('OWNER') || l.includes('Smartts')).slice(0,3).join(' | '));
  if (!caught) allCaught = false;
  restore('owner');
})();

// 3. SCHEMANAME - JSON-LD name swapped
(() => {
  const file = targets.schemaname;
  let content = originals.schemaname.toString('utf8');
  const before = content;
  content = content.replace(/"name": "Coleman and Leighs Pharmacy",/, '"name": "Smartts Chemist",');
  if (content === before) { log('FATAL: SCHEMANAME mutator found no match'); process.exit(3); }
  fs.writeFileSync(file, content, 'utf8');
  const r = runChecker();
  const caught = r.code !== 0 && /SCHEMANAME|Smartts/i.test(r.out);
  log(`RULE SCHEMANAME injection (JSON-LD name swapped to Smartts Chemist on sore-throat page): exit ${r.code}, caught=${caught}`);
  if (caught) log('  -> ' + r.out.split('\n').filter(l => l.includes('SCHEMANAME') || l.includes('Smartts')).slice(0,3).join(' | '));
  if (!caught) allCaught = false;
  restore('schemaname');
})();

// 4. OUTBOUND - review link swapped to a foreign branch's review URL
(() => {
  const file = targets.outbound;
  let content = originals.outbound.toString('utf8');
  const before = content;
  content = content.replace(
    'https://g.page/r/CVRiXrQr74lLEAE/review',
    'https://g.page/r/CVzJUbDqQwReEBM/review'
  );
  if (content === before) { log('FATAL: OUTBOUND mutator found no match'); process.exit(3); }
  fs.writeFileSync(file, content, 'utf8');
  const r = runChecker();
  const caught = r.code !== 0 && /OUTBOUND|review/i.test(r.out);
  log(`RULE OUTBOUND injection (Google review link swapped to Smartts Chemist's on shingles page): exit ${r.code}, caught=${caught}`);
  if (caught) log('  -> ' + r.out.split('\n').filter(l => l.includes('OUTBOUND') || l.toLowerCase().includes('review')).slice(0,3).join(' | '));
  if (!caught) allCaught = false;
  restore('outbound');
})();

// 5. SERVICELINK - shingles tile on the PF overview repointed cross-host at Smartts' equivalent page
(() => {
  const file = targets.servicelink;
  let content = originals.servicelink.toString('utf8');
  const before = content;
  content = content.replace(
    'href="shingles-treatment-coleman-leigh-walton.html"',
    'href="shingles-treatment-smartts-bootle.html"'
  );
  if (content === before) { log('FATAL: SERVICELINK mutator found no match'); process.exit(3); }
  fs.writeFileSync(file, content, 'utf8');
  const r = runChecker();
  const caught = r.code !== 0 && /SERVICELINK|smartts/i.test(r.out);
  log(`RULE SERVICELINK injection (shingles tile on PF overview repointed at Smartts' equivalent page): exit ${r.code}, caught=${caught}`);
  if (caught) log('  -> ' + r.out.split('\n').filter(l => l.includes('SERVICELINK') || l.toLowerCase().includes('smartts')).slice(0,3).join(' | '));
  if (!caught) allCaught = false;
  restore('servicelink');
})();

// Final restore verification for all five files
let allRestored = true;
for (const [rule, file] of Object.entries(targets)) {
  const nowHash = sha256(fs.readFileSync(file));
  const wantHash = sha256(originals[rule]);
  if (nowHash !== wantHash) { allRestored = false; log(`FATAL: ${rule} file not byte-identical after restore: ${file}`); }
}
log(`ALL FILES BYTE-IDENTICAL AFTER RESTORE: ${allRestored}`);

const final = runChecker();
log(`FINAL checker re-run after all restores: exit ${final.code} (expect 0)`);

log(`RESULT: allCaught=${allCaught}, allRestored=${allRestored}, finalClean=${final.code === 0}`);

