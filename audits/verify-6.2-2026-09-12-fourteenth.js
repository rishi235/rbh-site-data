/*
  verify-6.2-2026-09-12-fourteenth.js

  Item 6.2, fourteenth quality pass. Proves, by injection, that RULE 1 of
  tools/check-service-links.js used to skip EVERY relative href containing
  "{{" regardless of which file it sat in, on the reasoning that it must be
  an unstamped template placeholder - and that this was too broad: it also
  exempted the four EXTRA_FILES that are live or near-live pasted copy (the
  two shared Weebly templates and the two Cherry Lane replacement blocks),
  not only the two genuine DRAFT-*.html content specs. Also proves
  check-whatsapp-route.js's own RULE 5 (which scans for the same
  "{{[A-Z0-9_]+}}" shape) does not cover the gap, because it reads PAGE_DIRS
  only, never EXTRA_FILES.

  Own script. No import from tools/ beyond invoking each checker as a real
  child process. Builds its own scratch copy (no .git) in a temp directory,
  runs a BEFORE probe against a copy of the checker as it stood before this
  pass's fix (reconstructed inline below, not read from git history, since
  this sandbox's git is unreliable this session), then runs an AFTER probe
  against the live, fixed checker. Every mutated file is restored from an
  in-memory buffer and sha256-reconfirmed identical before any conclusion is
  drawn. The live tracked tree is never opened for writing.

  Run: node audits/verify-6.2-2026-09-12-fourteenth.js
*/
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TMPROOT = process.env.TMPDIR || path.join(REPO, "..", "outputs");
const scratch = fs.mkdtempSync(path.join(fs.existsSync(TMPROOT) ? TMPROOT : os.tmpdir(), "verify62-14th-"));

function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }
function log(line) { console.log(line); }

function copyRepo(dest) {
  fs.mkdirSync(dest, { recursive: true });
  const skip = new Set([".git"]);
  (function walk(src, out) {
    fs.mkdirSync(out, { recursive: true });
    fs.readdirSync(src, { withFileTypes: true }).forEach(function (e) {
      if (skip.has(e.name)) return;
      const s = path.join(src, e.name);
      const o = path.join(out, e.name);
      if (e.isDirectory()) walk(s, o);
      else fs.copyFileSync(s, o);
    });
  })(REPO, dest);
}

log("verify-6.2-2026-09-12-fourteenth");
log("scratch dir: " + scratch);
copyRepo(scratch);

function run(rel) {
  try {
    const out = execFileSync("node", [rel], { cwd: scratch, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status === undefined ? 1 : e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// ---- baseline (fixed checker, as it now stands in the live tree) ----------
log("\n-- BASELINE (fixed checker, unmutated scratch copy) --");
let r = run("tools/check-service-links.js");
log("check-service-links.js exit=" + r.code + " (expect 0)");
if (r.code !== 0) { log(r.out); throw new Error("baseline check-service-links.js did not pass clean"); }
r = run("tools/check-whatsapp-route.js");
log("check-whatsapp-route.js exit=" + r.code + " (expect 0)");
if (r.code !== 0) { log(r.out); throw new Error("baseline check-whatsapp-route.js did not pass clean"); }

// ---- OLD BEHAVIOUR reconstruction ------------------------------------------
// Simulate the PRE-fix checker by writing a copy of check-service-links.js
// with TOKEN_TEMPLATE_FILES removed and the {{ check reverted to a blanket
// skip - i.e. exactly what shipped before this pass, reconstructed from the
// AGENT_WORKLIST.md description rather than from git history.
const checkerPath = path.join(scratch, "tools", "check-service-links.js");
const fixedSrc = fs.readFileSync(checkerPath, "utf8");
const oldSrc = fixedSrc
  .replace(/\n\/\/ Files where an unstamped[\s\S]*?const TOKEN_TEMPLATE_FILES = new Set\(\[\n  "modules\/service\/DRAFT-weight-loss-copy\.html",\n  "modules\/service\/DRAFT-travel-clinic-copy\.html"\n\]\);\n/,
    "\n")
  .replace(
    /        if \(href\.indexOf\("\{\{"\) !== -1\) \{\n          if \(TOKEN_TEMPLATE_FILES\.has\(rel\(file\)\)\) continue; \/\/ legitimate template placeholder\n          failures\.push\(\{\n            file: rel\(file\),\n            rule: "unreplaced token",\n            text: "relative href \\"" \+ href \+ "\\" still carries an unstamped template placeholder"\n          \}\);\n          continue;\n        \}\n/,
    '        if (href.indexOf("{{") !== -1) continue; // unstamped template token, not a real URL\n'
  );
if (oldSrc === fixedSrc) throw new Error("reconstruction of the pre-fix checker did not change anything - regex anchors are stale");
const oldCheckerPath = path.join(scratch, "tools", "check-service-links.OLD.js");
fs.writeFileSync(oldCheckerPath, oldSrc);
log("\nReconstructed pre-fix checker written to tools/check-service-links.OLD.js for comparison only.");

// ---- injection targets ------------------------------------------------------
const targets = [
  {
    label: "Cherry Lane pharmacy-first replacement (live-pasted EXTRA_FILE)",
    file: "modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html",
    find: 'href="/pharmacy-first-cherry-lane-walton.html"',
    inject: 'href="/{{STALE_LINK}}.html"'
  },
  {
    label: "Generated Pharmacy First condition page (PAGE_DIRS)",
    file: "modules/service/pages/earache-treatment-cherry-lane-walton.html",
    find: 'href="pharmacy-first-cherry-lane-walton.html"',
    inject: 'href="{{STALE_LINK3}}.html"'
  }
];

const results = [];
targets.forEach(function (t) {
  const full = path.join(scratch, t.file);
  const before = fs.readFileSync(full, "utf8");
  const beforeHash = sha256(full);
  if (before.indexOf(t.find) === -1) throw new Error("injection anchor not found in " + t.file);
  fs.writeFileSync(full, before.replace(t.find, t.inject));

  const oldResult = run("tools/check-service-links.OLD.js");
  const newResult = run("tools/check-service-links.js");
  const waResult = run("tools/check-whatsapp-route.js");

  fs.writeFileSync(full, before);
  const afterHash = sha256(full);
  if (afterHash !== beforeHash) throw new Error("restore failed for " + t.file + " - hash mismatch");

  results.push({
    label: t.label, file: t.file,
    oldExit: oldResult.code, oldCaught: /unreplaced token|FAILURES/.test(oldResult.out) && oldResult.code !== 0,
    newExit: newResult.code, newCaught: newResult.code !== 0 && /unreplaced token/.test(newResult.out),
    waExit: waResult.code
  });
  log("\n-- " + t.label + " --");
  log("  file: " + t.file);
  log("  OLD (pre-fix) checker exit=" + oldResult.code + (oldResult.code === 0 ? "  <-- PASSED (the gap)" : ""));
  log("  NEW (fixed) checker exit=" + newResult.code + (newResult.code !== 0 ? "  <-- CAUGHT" : "  <-- MISSED"));
  log("  check-whatsapp-route.js exit=" + waResult.code + (waResult.code === 0 ? "  <-- also did not catch it (RULE 5 is PAGE_DIRS-only)" : ""));
  log("  restore sha256 match: " + (afterHash === beforeHash));
});

// ---- control: DRAFT files must still pass unmodified with the fixed checker
log("\n-- CONTROL: DRAFT-*.html files, fixed checker, unmutated --");
r = run("tools/check-service-links.js");
log("check-service-links.js exit=" + r.code + " (expect 0 - DRAFT files' own {{TOKEN}} hrefs still correctly skipped)");
if (r.code !== 0) throw new Error("control run on fixed checker did not pass clean");

// ---- full 36-checker sweep on the fixed scratch copy (cdn-pins excluded:
// this scratch copy has no .git, a known environment artefact of this method,
// not a repo defect - confirmed identical on an unmutated control copy
// earlier in this pass, recorded in AGENT_WORKLIST.md) ----------------------
log("\n-- FULL SUITE sweep (fixed checker in place, scratch has no .git so cdn-pins is skipped) --");
const checkers = fs.readdirSync(path.join(scratch, "tools")).filter(function (f) {
  return /^check-.*\.js$/.test(f) && f !== "check-cdn-pins.js" && f !== "check-service-links.OLD.js";
});
let failCount = 0;
checkers.forEach(function (f) {
  const res = run("tools/" + f);
  if (res.code !== 0) { failCount++; log("  FAIL(" + res.code + "): " + f); }
});
log(checkers.length + " checker(s) run, " + failCount + " unexpected failure(s) (expect 0).");

// ---- summary ----------------------------------------------------------------
// check-whatsapp-route.js's RULE 5 scans PAGE_DIRS (so it DOES independently
// catch an unstamped token on a generated page, as a defence this pass did
// not know about until running it) but never EXTRA_FILES (so it can never
// catch one on the Cherry Lane/weebly.html/emar/weebly class of file). The
// exclusive, total blind spot - caught by NOTHING before this pass's fix -
// is EXTRA_FILES only; PAGE_DIRS had RULE 5 as an independent (if less
// specific) backstop all along. Both facts matter and are asserted
// separately rather than folded into one pass/fail.
log("\n== SUMMARY ==");
let allOldPassed = true, allNewCaught = true;
results.forEach(function (res) {
  if (res.oldExit !== 0) allOldPassed = false;
  if (!res.newCaught) allNewCaught = false;
});
const extraFileTarget = results.find(function (r) { return r.file.indexOf("weebly-paste") !== -1; });
const pageDirsTarget = results.find(function (r) { return r.file.indexOf("modules/service/pages") !== -1; });
const extraFileWasTotalBlindSpot = extraFileTarget.oldExit === 0 && extraFileTarget.waExit === 0;
const pageDirsHadWaBackstop = pageDirsTarget.waExit !== 0;
log("Old (pre-fix) check-service-links.js passed clean on every injection (the gap existed): " + allOldPassed);
log("New (fixed) check-service-links.js caught every injection with rule 'unreplaced token': " + allNewCaught);
log("EXTRA_FILES (Cherry Lane) injection was a TOTAL blind spot pre-fix (no checker caught it): " + extraFileWasTotalBlindSpot);
log("PAGE_DIRS injection had an independent backstop in check-whatsapp-route.js RULE 5 all along: " + pageDirsHadWaBackstop);
log("Full suite clean on fixed scratch copy: " + (failCount === 0));
const ok = failCount === 0 && allOldPassed && allNewCaught && extraFileWasTotalBlindSpot && pageDirsHadWaBackstop;
log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED - see above");
process.exit(ok ? 0 : 1);
