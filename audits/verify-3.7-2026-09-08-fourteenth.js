/*
  Item 3.7 quality pass (fourteenth), 2026-09-08.

  Fresh angle: tools/check-branch-identity.js - which pharmacy a page says it
  is (data-branch, JSON-LD name, outbound review links, cross-branch service
  links) - had never been named against Smartts Chemist Bootle across any of
  the prior thirteen passes (grep of AGENT_WORKLIST.md lines 4814-5439 for
  "check-branch-identity.js" returns zero hits before this pass). Smartts is
  a single-site brand (brandLabel === branchName === "Smartts Chemist", not
  shared with any sister), so rules 4/5/6/7 (the ambiguous-brand rules the
  checker was originally built for) do not apply to it - but rules 1-3
  (identity/owner/schemaname) and rule 8 (outbound review link) apply to
  every page regardless of whether the brand is shared, and had never been
  proven against this branch's own copy by injection.

  This script does two independent things, sharing no code with tools/:
    1. Fresh extraction across all 12 Smartts pages, checking the same facts
       check-branch-identity.js's rules 1/2/3/8 check, by its own regex logic
       written independently here.
    2. Three injections against the REAL tools/check-branch-identity.js,
       each restored by byte-copy from a saved original and sha256-confirmed
       identical before the next, proving the checker itself (not just this
       script) catches the fault.

  Run: node audits/verify-3.7-2026-09-08-fourteenth.js
*/
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });
var smartts = branches.find(function (b) { return b.id === "smartts_bootle"; });
if (!smartts) { console.log("FATAL: smartts_bootle not found in branches.json"); process.exit(1); }

var allBranchNames = {};
branches.forEach(function (b) {
  allBranchNames[b.branchName] = b.id;
  if (!allBranchNames[b.brandLabel]) allBranchNames[b.brandLabel] = b.id;
});

var pageDirs = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages")
];
var smarttsPages = [];
pageDirs.forEach(function (dir) {
  fs.readdirSync(dir).forEach(function (f) {
    if (/smartts-bootle\.html$/.test(f)) smarttsPages.push(path.join(dir, f));
  });
});

console.log("PART 1: fresh extraction, " + smarttsPages.length + " Smartts pages found\n");

var checks = 0, flags = 0;

function rootAttr(html, name) {
  var root = /<div id="rbhs[vw]-root"([^>]*)>/.exec(html);
  if (!root) return undefined;
  var m = new RegExp(name + '="([^"]*)"').exec(root[1]);
  return m ? m[1] : null;
}
function schemaName(html) {
  var m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return undefined;
  try { var o = JSON.parse(m[1]); return typeof o.name === "string" ? o.name : null; }
  catch (e) { return null; }
}

smarttsPages.forEach(function (p) {
  var html = fs.readFileSync(p, "utf8");
  var file = path.basename(p);

  // Rule 1/2: data-branch present and correct
  var db = rootAttr(html, "data-branch");
  checks++;
  if (db === undefined) {
    // no module root - fine, not every page family (none here lack one, but be safe)
  } else if (db === null || db === "") {
    flags++; console.log("  FLAG " + file + ": module root but empty data-branch");
  } else if (db !== smartts.branchName && db !== smartts.brandLabel) {
    flags++; console.log("  FLAG " + file + ': data-branch="' + db + '" does not match Smartts');
  }

  // Rule 3: JSON-LD name
  var sn = schemaName(html);
  checks++;
  if (sn === undefined || sn === null) {
    flags++; console.log("  FLAG " + file + ": no usable JSON-LD name");
  } else if (sn !== smartts.branchName && sn !== smartts.brandLabel) {
    flags++; console.log("  FLAG " + file + ': JSON-LD name "' + sn + '" does not match Smartts');
  }

  // Rule 8: outbound review links belong to Smartts
  var hrefRe = /href="([^"]+)"/g, hm;
  while ((hm = hrefRe.exec(html)) !== null) {
    var h = hm[1];
    if (h === smartts.googleReviewUrl || h === smartts.nhsReviewUrl) {
      checks++; // correct, no flag
    } else if (/^https:\/\/g\.page\/r\//.test(h) || /leave-a-review/.test(h)) {
      checks++;
      flags++;
      console.log("  FLAG " + file + ": review link " + h + " does not match Smartts's own review URLs");
    }
  }
});

console.log("\nPart 1 total: " + checks + " checks, " + flags + " flags\n");

console.log("PART 2: injections against the real tools/check-branch-identity.js\n");

function runChecker() {
  var r = cp.spawnSync("node", [path.join(ROOT, "tools", "check-branch-identity.js")], { cwd: ROOT, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

var targetFile = path.join(ROOT, "modules", "service", "pages", "impetigo-treatment-smartts-bootle.html");
var switchFile = path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-smartts-bootle.html");

var origTarget = fs.readFileSync(targetFile, "utf8");
var origTargetSha = sha(origTarget);

var baseline = runChecker();
console.log("Baseline (pre-injection): exit " + baseline.code + " - " +
  (baseline.code === 0 ? "clean" : "UNEXPECTED FAILURE, aborting"));
if (baseline.code !== 0) { console.log(baseline.out); process.exit(1); }

var results = [];

// Injection 1: data-branch changed to SK Chemists Bootle's name (the real,
// directly adjacent different Bootle brand - the exact danger case this
// item's own second pass named for check-widget-diaries.js, tested here
// against check-branch-identity.js's rule 2 instead).
(function () {
  var mutated = origTarget.replace(
    /data-branch="Smartts Chemist"/,
    'data-branch="SK Chemists Bootle"'
  );
  if (mutated === origTarget) { console.log("INJECTION 1 SKIPPED: pattern not found"); return; }
  fs.writeFileSync(targetFile, mutated);
  var r = runChecker();
  var caught = r.code !== 0 && /data-branch="SK Chemists Bootle" but the page belongs to smartts_bootle/.test(r.out);
  results.push({ n: 1, name: "data-branch swapped to SK Chemists Bootle (rule 2 owner)", caught: caught, out: r.out });
  fs.writeFileSync(targetFile, origTarget);
  var restoredSha = sha(fs.readFileSync(targetFile, "utf8"));
  if (restoredSha !== origTargetSha) { console.log("RESTORE FAILED for injection 1!"); process.exit(1); }
})();

// Injection 2: JSON-LD name changed to another live branch's name (Hirshmans
// Chemist Ainsdale - not adjacent, chosen to prove rule 3 fires on ANY
// foreign name, not only a geographically neighbouring one).
(function () {
  var mutated = origTarget.replace(
    /"name":\s*"Smartts Chemist"/,
    '"name": "Hirshmans Chemist"'
  );
  if (mutated === origTarget) { console.log("INJECTION 2 SKIPPED: pattern not found"); return; }
  fs.writeFileSync(targetFile, mutated);
  var r = runChecker();
  var caught = r.code !== 0 && /JSON-LD name "Hirshmans Chemist" but the page belongs to smartts_bootle/.test(r.out);
  results.push({ n: 2, name: "JSON-LD name swapped to Hirshmans Chemist (rule 3 schemaname)", caught: caught, out: r.out });
  fs.writeFileSync(targetFile, origTarget);
  var restoredSha = sha(fs.readFileSync(targetFile, "utf8"));
  if (restoredSha !== origTargetSha) { console.log("RESTORE FAILED for injection 2!"); process.exit(1); }
})();

// Injection 3: review link swapped to SK Chemists Bootle's own googleReviewUrl
// (rule 8 outbound) - on the switch page, untried for injection on this item
// across all thirteen prior passes.
(function () {
  var origSwitch = fs.readFileSync(switchFile, "utf8");
  var origSwitchSha = sha(origSwitch);
  var skBootle = branches.find(function (b) { return b.id === "skchemists_bootle" || /sk[-_]?chemists.*bootle/i.test(b.id); });
  if (!skBootle || !skBootle.googleReviewUrl) {
    console.log("INJECTION 3 SKIPPED: could not resolve SK Chemists Bootle's googleReviewUrl");
    return;
  }
  if (origSwitch.indexOf(smartts.googleReviewUrl) === -1) {
    console.log("INJECTION 3 SKIPPED: Smartts's own googleReviewUrl not found on switch page");
    return;
  }
  var mutated = origSwitch.split(smartts.googleReviewUrl).join(skBootle.googleReviewUrl);
  fs.writeFileSync(switchFile, mutated);
  var r = runChecker();
  var caught = r.code !== 0 && new RegExp("belongs to " + skBootle.id + ' \\("SK Chemists"\\), but the page belongs to smartts_bootle').test(r.out);
  results.push({ n: 3, name: "review link swapped to SK Chemists Bootle's googleReviewUrl (rule 8 outbound)", caught: caught, out: r.out });
  fs.writeFileSync(switchFile, origSwitch);
  var restoredSha = sha(fs.readFileSync(switchFile, "utf8"));
  if (restoredSha !== origSwitchSha) { console.log("RESTORE FAILED for injection 3!"); process.exit(1); }
})();

results.forEach(function (r) {
  console.log("  Injection " + r.n + " (" + r.name + "): " + (r.caught ? "CAUGHT" : "NOT CAUGHT / UNEXPECTED"));
  if (!r.caught) console.log(r.out);
});

var finalCheck = runChecker();
console.log("\nFinal sweep after all injections and restores: exit " + finalCheck.code +
  " - " + (finalCheck.code === 0 ? "clean" : "UNEXPECTED"));

var finalTargetSha = sha(fs.readFileSync(targetFile, "utf8"));
var finalSwitchSha = sha(fs.readFileSync(switchFile, "utf8"));
console.log("targetFile sha256 matches original: " + (finalTargetSha === origTargetSha));

var allCaught = results.every(function (r) { return r.caught; });
console.log("\nAll injections caught on intended rule: " + allCaught);
console.log("Part 1: " + checks + " checks, " + flags + " flags");

process.exit((allCaught && flags === 0 && finalCheck.code === 0) ? 0 : 1);
