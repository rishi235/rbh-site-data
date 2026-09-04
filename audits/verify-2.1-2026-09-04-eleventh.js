// audits/verify-2.1-2026-09-04-eleventh.js
// Item 2.1 (Fishlocks Ainsdale) quality pass, eleventh pass, 2026-09-04.
// Proves tools/check-weight-loss-copy.js by injection against this branch's
// own weight-loss-clinic page for the first time in eleven prior passes on
// this item (prior passes injection-tested the switch page, the travel
// clinic page and the branch landing page; the weight loss page - the most
// compliance-sensitive page type this branch owns - had never been tried).
// No import from tools/: shells out to the real checker as a child process.
// Refuses to run if the target file already carries a git diff. Restores
// from an in-memory buffer immediately after capturing the checker's output
// and before any assertion, sha256-verified byte-identical before the next
// injection and again at the end, matching the CLAUDE.md item 5.2 discipline
// ("a test harness must restore by byte copy, not from git").

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO = 'C:\\Dev\\rbh-site-data';
const TARGET = path.join(REPO, 'modules', 'service', 'pages', 'weight-loss-clinic-fishlocks-ainsdale.html');
const CHECKER = path.join(REPO, 'tools', 'check-weight-loss-copy.js');

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function gitDiffEmpty(file) {
  const out = execSync(`git status --porcelain -- "${file}"`, { cwd: REPO, encoding: 'utf8' });
  return out.trim() === '';
}

function runChecker() {
  try {
    const out = execSync(`node "${CHECKER}"`, { cwd: REPO, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

if (!gitDiffEmpty(TARGET)) {
  console.error('REFUSING: target file already carries a git diff. Aborting.');
  process.exit(1);
}

const original = fs.readFileSync(TARGET);
const originalHash = sha256(original);
console.log('Original sha256:', originalHash, 'length:', original.length);

const baseline = runChecker();
console.log('BASELINE check-weight-loss-copy.js exit:', baseline.code);
if (baseline.code !== 0) {
  console.error('REFUSING: baseline checker is not clean before injection. Aborting.');
  console.error(baseline.out);
  process.exit(1);
}

const injections = [
  {
    name: 'RULE 4 (private/paid/not NHS)',
    from: 'This is a paid private service, not an NHS treatment,',
    to: 'This is a fantastic new service,',
    expectSubstr: null
  },
  {
    name: 'RULE 5 (eligibility - 18 and over)',
    from: '<li>Adults aged 18 and over</li>',
    to: '<li>Adults aged 16 and over</li>',
    expectSubstr: null
  },
  {
    name: 'RULE 6 (no guarantee)',
    from: 'Nothing below is a guarantee of treatment, a specific medicine, or a specific outcome. Individual results vary.',
    to: 'This plan is guaranteed to help you lose weight fast. Individual results vary.',
    expectSubstr: null
  },
  {
    name: 'RULE 8 (no medicine named)',
    from: 'prescription-only weight-loss medication can be supplied',
    to: 'Mounjaro or Wegovy can be supplied',
    expectSubstr: null
  },
  {
    name: 'RULE 9 (no efficacy/results claim)',
    from: 'A qualified pharmacist or clinician will review your health history',
    to: 'Real results - lose weight fast with a qualified pharmacist or clinician who will review your health history',
    expectSubstr: null
  }
];

const results = [];
for (const inj of injections) {
  const text = original.toString('utf8');
  if (!text.includes(inj.from)) {
    console.error(`MUTATOR FOUND NO MATCH for "${inj.name}" - refusing to report a false pass.`);
    fs.writeFileSync(TARGET, original);
    process.exit(1);
  }
  const mutated = text.replace(inj.from, inj.to);
  fs.writeFileSync(TARGET, mutated, 'utf8');
  const res = runChecker();
  // restore immediately, before any assertion
  fs.writeFileSync(TARGET, original);
  const restoredHash = sha256(fs.readFileSync(TARGET));
  const restoredOk = restoredHash === originalHash;
  results.push({ name: inj.name, exitCode: res.code, caught: res.code !== 0, restoredOk, outSnippet: res.out.split('\n').filter(l => l.trim()).slice(0, 6).join(' | ') });
  console.log(`[${inj.name}] exit=${res.code} caught=${res.code !== 0} restoredOk=${restoredOk}`);
  console.log('  ' + res.out.split('\n').filter(l => l.trim()).slice(0, 6).join('\n  '));
}

// final restore confirmation
const finalHash = sha256(fs.readFileSync(TARGET));
console.log('Final sha256 matches original:', finalHash === originalHash);

const finalCheck = runChecker();
console.log('FINAL check-weight-loss-copy.js exit after all restores:', finalCheck.code);

const allCaught = results.every(r => r.caught);
const allRestored = results.every(r => r.restoredOk) && (finalHash === originalHash);
console.log('ALL 5 CAUGHT:', allCaught);
console.log('ALL RESTORES BYTE-IDENTICAL:', allRestored);
console.log(JSON.stringify(results, null, 2));
