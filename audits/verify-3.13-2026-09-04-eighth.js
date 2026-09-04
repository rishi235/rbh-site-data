// Item 3.13 quality pass (eighth), 2026-09-04. Clear Chemist (Aintree/Liverpool).
//
// Fresh angle: seven prior passes on this item all verified facts via a
// separate custom instrument (audits/clear-aintree-independent-2026-08-14.js)
// and its own nine-fault vacuity probe, which proves that INSTRUMENT is not
// vacuous - it never once mutated and ran the REAL repo checker,
// tools/check-switch-copy.js, against Clear's own switch page. The seventh
// pass did this for check-weight-loss-copy.js and check-travel-clinic-copy.js
// against Clear's other two pages, closing that gap; check-switch-copy.js
// against switch-prescriptions-clear-aintree.html was the one page/checker
// pairing for this item left unproven by direct injection. This script closes
// it: five injections against five different rules (7, 8, 9, 10, 11a), each
// restored by fs.writeFileSync from an in-memory Buffer captured before any
// mutation (never git), sha256-reconfirmed after every restore, matching the
// discipline the 3.2 tenth pass, 3.5 eleventh pass and 3.7 tenth pass all used.
//
// Imports nothing from tools/ except by shelling out to the real checker as a
// child process, so the checker under test is never in-process with this
// script.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PAGE = path.join(ROOT, 'modules', 'switch', 'pages', 'switch-prescriptions-clear-aintree.html');
const BANNER = path.join(ROOT, 'modules', 'switch', 'pages', 'banners', 'switch-prescriptions-clear-aintree.txt');
const CHECKER = path.join(ROOT, 'tools', 'check-switch-copy.js');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

function runChecker() {
  try {
    const out = execFileSync('node', [CHECKER], { cwd: ROOT, encoding: 'utf8' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

const pageOriginal = fs.readFileSync(PAGE);
const bannerOriginal = fs.readFileSync(BANNER);
const pageHashBefore = sha256(pageOriginal);
const bannerHashBefore = sha256(bannerOriginal);

console.log('Baseline page sha256:  ' + pageHashBefore);
console.log('Baseline banner sha256: ' + bannerHashBefore);

const baseline = runChecker();
if (baseline.code !== 0) {
  console.log('ABORT: check-switch-copy.js is not clean before any injection. Refusing to proceed.');
  console.log(baseline.out);
  process.exit(2);
}
console.log('Baseline check-switch-copy.js: exit 0 (clean), proceeding.\n');

let caught = 0;
let missed = 0;
const results = [];

function restorePage() {
  fs.writeFileSync(PAGE, pageOriginal);
  const h = sha256(fs.readFileSync(PAGE));
  if (h !== pageHashBefore) {
    console.log('FATAL: page restore did not reproduce baseline hash. ' + h + ' vs ' + pageHashBefore);
    process.exit(3);
  }
}

function restoreBanner() {
  fs.writeFileSync(BANNER, bannerOriginal);
  const h = sha256(fs.readFileSync(BANNER));
  if (h !== bannerHashBefore) {
    console.log('FATAL: banner restore did not reproduce baseline hash. ' + h + ' vs ' + bannerHashBefore);
    process.exit(3);
  }
}

function tryInjection(label, targetFile, originalBuf, mutateFn, restoreFn, expectTag) {
  const text = originalBuf.toString('utf8');
  const mutated = mutateFn(text);
  if (mutated === text) {
    console.log('SKIP (vacuous, target string not found): ' + label);
    results.push({ label, status: 'VACUOUS' });
    return;
  }
  fs.writeFileSync(targetFile, mutated, 'utf8');
  const res = runChecker();
  const caughtThis = res.code !== 0 && (!expectTag || res.out.toLowerCase().includes(expectTag.toLowerCase()));
  restoreFn();
  const rerun = runChecker();
  if (rerun.code !== 0) {
    console.log('FATAL: checker not clean after restore for ' + label);
    console.log(rerun.out);
    process.exit(4);
  }
  if (caughtThis) {
    caught++;
    console.log('CAUGHT: ' + label + ' (exit ' + res.code + ', tag "' + expectTag + '" present)');
    results.push({ label, status: 'CAUGHT' });
  } else {
    missed++;
    console.log('MISSED: ' + label + ' (exit ' + res.code + ')');
    console.log(res.out);
    results.push({ label, status: 'MISSED' });
  }
}

// RULE 7: no medicines / no clinical claim. Insert a POM medicine name into the hero-sub.
tryInjection(
  'RULE 7 no-medicines (hero-sub names Wegovy)',
  PAGE, pageOriginal,
  (t) => t.replace(
    'Switching your prescriptions to us is quick, free, and means your medication comes to a pharmacy team you can actually speak to.',
    'Switching your prescriptions to us is quick, free, and we can also discuss Wegovy if relevant.'
  ),
  restorePage,
  'no-medicines'
);

// RULE 8: town. Change the pill from this branch's own town (Aintree) to a
// real, different live branch's town (Walton - Cherry Lane and Coleman and
// Leighs both hold it as their own seoTown).
tryInjection(
  'RULE 8 town (pill renamed Aintree -> Walton)',
  PAGE, pageOriginal,
  (t) => t.replace('Your local independent pharmacy in Aintree', 'Your local independent pharmacy in Walton'),
  restorePage,
  'town'
);

// RULE 9: form and the sentence about the form. Add an undescribed input with
// no FIELD_WORDS entry and no mention in step 1.
tryInjection(
  'RULE 9 form-copy (undescribed nhs_number field added)',
  PAGE, pageOriginal,
  (t) => t.replace(
    '<input type="hidden" name="destination" value="">',
    '<input type="text" name="nhs_number" placeholder="NHS number">\n            <input type="hidden" name="destination" value="">'
  ),
  restorePage,
  'form-copy'
);

// RULE 10: the collection notice. Delete the privacy paragraph outright.
tryInjection(
  'RULE 10 collection-notice (privacy paragraph deleted)',
  PAGE, pageOriginal,
  (t) => t.replace('<p class="privacy">We will only use your details to help process your switch request.</p>', ''),
  restorePage,
  'collection-notice'
);

// RULE 11a: the banner. Repoint Clear's own banner SWITCH_URL at a different
// branch's switch page (Cherry Lane Walton).
tryInjection(
  'RULE 11a banner (SWITCH_URL repointed at Cherry Lane)',
  BANNER, bannerOriginal,
  (t) => t.replace(
    'var SWITCH_URL = "/switch-prescriptions-clear-aintree.html";',
    'var SWITCH_URL = "/switch-prescriptions-cherry-lane-walton.html";'
  ),
  restoreBanner,
  'banner'
);

console.log('\n=== SUMMARY ===');
console.log('Caught: ' + caught + '  Missed: ' + missed + '  Total: ' + results.length);
results.forEach(r => console.log(' - ' + r.status + ': ' + r.label));

const finalPageHash = sha256(fs.readFileSync(PAGE));
const finalBannerHash = sha256(fs.readFileSync(BANNER));
console.log('\nFinal page sha256:   ' + finalPageHash + (finalPageHash === pageHashBefore ? ' (matches baseline)' : ' MISMATCH'));
console.log('Final banner sha256: ' + finalBannerHash + (finalBannerHash === bannerHashBefore ? ' (matches baseline)' : ' MISMATCH'));

const finalCheck = runChecker();
console.log('\nFinal check-switch-copy.js run: exit ' + finalCheck.code + (finalCheck.code === 0 ? ' (clean)' : ' UNEXPECTED'));

if (missed > 0 || finalPageHash !== pageHashBefore || finalBannerHash !== bannerHashBefore || finalCheck.code !== 0) {
  process.exit(1);
}
process.exit(0);
