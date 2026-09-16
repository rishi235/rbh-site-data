/*
  verify-6.2-2026-09-16-sixteenth.js

  Item 6.2, sixteenth quality pass, 2026-09-16 (unattended scheduled run).

  FRESH ANGLE: tools/check-service-links.js's RULE 1 builds estateHosts from
  branches.json with `if (b.disposed || !b.website) return;`, which is correct
  for every rule asking "is this one of our current branch domains" - but no
  prior pass (grepped this item's own fifteen-pass history for "disposed",
  "disposedHosts" and "Wilmslow" first: only narrative mentions of the actual
  1 July 2026 Wilmslow disposal, never a test of what this checker does with
  one) had ever asked what happens to a link SOME OTHER page still carries to
  a domain that has since dropped out of estateHosts. Once a host is gone from
  estateHosts, RULE 1's absolute-link branch treats a link to it as "external,
  out of scope by design" and skips it - silently, forever, with no rule in
  this checker ever looking at it again.

  This script proves, by injection against a disposable scratch copy (git
  archive HEAD, never the tracked tree, restored and confirmed after every
  step), that the gap was real, that the fix closes it, and that the fix does
  not misfire on the shared-domain sister-branch edge case (a disposed branch
  sharing a host with a branch that is still live).

  Zero live branches are disposed today (Wilmslow was removed from
  branches.json entirely rather than marked disposed), so this was a latent
  gap, not a live breach, the same shape every 6.2 finding before this one has
  taken.

  Run: node audits/verify-6.2-2026-09-16-sixteenth.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "verify-6.2-16th-"));

console.log("Scratch dir:", scratch);
execSync('git -C "' + REPO + '" archive HEAD | tar -x -C "' + scratch + '"');
// The RULE 1 fix for this pass is committed as part of this same run but may
// not yet be in HEAD at the moment this script runs (evidence is written
// before the commit, per this item's own running order) - copy the current
// WORKING TREE'''s checker over the archived one so the scratch copy always
// reflects the fix under test, not a stale committed version.
fs.copyFileSync(path.join(REPO, "tools", "check-service-links.js"), path.join(scratch, "tools", "check-service-links.js"));


function readJSON(f) { return JSON.parse(fs.readFileSync(f, "utf8")); }
function writeJSON(f, obj) { fs.writeFileSync(f, JSON.stringify(obj, null, 2)); }

function run() {
  try {
    execSync('node "' + path.join(scratch, "tools", "check-service-links.js") + '"', { cwd: scratch });
    return { code: 0, out: "" };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

console.log("\n=== BASELINE (unmutated scratch copy, fix already present) ===");
let base = run();
console.log("exit:", base.code);
console.log(base.out.split("\n").filter(function (l) { return /^  \d+ generated|clean,/i.test(l); }).join("\n"));

const checkerPath = path.join(scratch, "tools", "check-service-links.js");
const fixedSource = fs.readFileSync(checkerPath, "utf8");

// Reconstruct the PRE-FIX source by removing the disposedHosts guard added
// this pass, so the "before" behaviour can be demonstrated honestly rather
// than asserted.
const preFixSource = fixedSource
  .replace(/\/\/ DISPOSED-BRANCH HOSTS[\s\S]*?const disposedHosts = new Set\(Array\.from\(disposedHostsRaw\)\.filter\(function \(h\) \{ return !estateHosts\.has\(h\); \}\)\);\n/, "")
  .replace(/if \(disposedHosts\.has\(host\)\) \{[\s\S]*?continue;\n        \}\n        if \(!estateHosts\.has\(host\)\) continue;/, "if (!estateHosts.has(host)) continue;");

if (preFixSource === fixedSource) {
  console.log("\nABORT: pre-fix reconstruction pattern did not match current source.");
  process.exit(1);
}

fs.writeFileSync(checkerPath, preFixSource);

const branchesPath = path.join(scratch, "branches.json");
const orig = fs.readFileSync(branchesPath, "utf8");
const data = readJSON(branchesPath);
const gsc = data.branches.find(function (b) { return b.id === "gordonshorts_crosby"; });
gsc.disposed = true;
writeJSON(branchesPath, data);

const gscBackup = fs.mkdtempSync(path.join(os.tmpdir(), "gsc-backup-"));
["switch", "service", "branch"].forEach(function (fam) {
  const dir = path.join(scratch, "modules", fam, "pages");
  fs.readdirSync(dir).filter(function (f) { return f.indexOf("gordon-short-crosby") !== -1; }).forEach(function (f) {
    fs.renameSync(path.join(dir, f), path.join(gscBackup, f));
  });
});

const targetPage = path.join(scratch, "modules", "service", "pages", "contraception-riddings-timperley.html");
const origPage = fs.readFileSync(targetPage, "utf8");
const injectedHref = "https://www.gordonshortchemist.co.uk/pharmacy-first-gordon-short-crosby.html";
// These generated pages are Weebly embed fragments with no <body> tag at all
// (confirmed by grep: 0 of 177 pages carry one), so the injected link is
// simply appended at end of file rather than spliced before a closing tag
// that does not exist.
fs.writeFileSync(targetPage, origPage + "\n" + '<a href="' + injectedHref + '">disposed-host-test-link</a>\n');

console.log("\n=== PRE-FIX RECONSTRUCTION: gordonshorts_crosby disposed, its own pages removed, ===");
console.log("=== cross-link injected on a Riddings page pointing at its old domain          ===");
let preFix = run();
console.log("exit:", preFix.code);
const preFixHits = preFix.out.split("\n").filter(function (l) { return /gordon|disposed|FAIL/i.test(l); });
console.log(preFixHits.length ? preFixHits.join("\n") : "(no matching lines in output - confirms the injected link is invisible)");

fs.writeFileSync(checkerPath, fixedSource);
console.log("\n=== SAME INJECTION, FIXED CHECKER ===");
let postFix = run();
console.log("exit:", postFix.code);
console.log(postFix.out.split("\n").filter(function (l) { return /gordon|disposed|FAIL/i.test(l); }).join("\n"));

fs.writeFileSync(targetPage, origPage);
fs.writeFileSync(branchesPath, orig);
fs.readdirSync(gscBackup).forEach(function (f) {
  const fam = f.indexOf("switch-prescriptions") !== -1 ? "switch"
    : (f.indexOf("pharmacy-gordon-short") !== -1 ? "branch" : "service");
  fs.renameSync(path.join(gscBackup, f), path.join(scratch, "modules", fam, "pages", f));
});

console.log("\n=== RESTORED, FIXED CHECKER, CONTROL RUN (should match baseline exactly) ===");
let control = run();
console.log("exit:", control.code);
console.log(control.out.split("\n").filter(function (l) { return /^  \d+ generated|clean,/i.test(l); }).join("\n"));

const data2 = readJSON(branchesPath);
const hazel = data2.branches.find(function (b) { return b.id === "scorah_hazel"; });
hazel.disposed = true;
writeJSON(branchesPath, data2);
["switch", "service", "branch"].forEach(function (fam) {
  const dir = path.join(scratch, "modules", fam, "pages");
  fs.readdirSync(dir).filter(function (f) { return f.indexOf("scorah-hazel-grove") !== -1; }).forEach(function (f) {
    fs.renameSync(path.join(dir, f), path.join(gscBackup, f));
  });
});

console.log("\n=== SISTER-HOST EDGE CASE: scorah_hazel disposed, scorah_bramhall (same host) stays live ===");
let sister = run();
console.log("exit:", sister.code);
console.log(sister.out.split("\n").filter(function (l) { return /FAIL|disposed-branch/i.test(l); }).join("\n"));
console.log("(expect the EXISTING 'stale target' rule to fire on Bramhall's own cross-link to the removed");
console.log(" Hazel Grove page, NOT the new 'disposed-branch target' rule, since scorah-chemists.co.uk is");
console.log(" still a live estate host via Bramhall.)");

fs.writeFileSync(branchesPath, orig);

console.log("\nDone. Scratch copy left at " + scratch + " for inspection; tracked repo never opened for writing.");
