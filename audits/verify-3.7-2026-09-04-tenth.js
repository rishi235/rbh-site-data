/*
  audits/verify-3.7-2026-09-04-tenth.js

  Item 3.7 (Smartts Chemist, Bootle) - tenth quality pass, 2026-09-04.

  Nine prior passes proved check-nap.js, check-postcodes.js, check-em-dashes.js
  and check-contraception-copy.js against Smartts's own pages by injection, and
  covered identity/NAP/JSON-LD/map/hasApp fields by fresh independent
  extraction each time. None of the nine ever proved tools/check-switch-copy.js
  - the eleven-rule checker for the highest-commitment page family in the
  estate - against Smartts's own switch page or banner file specifically. A
  source search for "smartts" in tools/check-switch-copy.js returns zero
  matches, confirming the gap. The same checker was proved against Cherry
  Lane's switch page on item 2.3's ninth pass (rules 6, 8, 9) and against Cherry
  Lane's page and banner together on item 3.4's tenth pass (rules 7, 8, 9, 10,
  11a) - this pass repeats that fuller five-rule sweep against
  switch-prescriptions-smartts-bootle.html and its banner file, the same method
  proven twice already, applied to the one item in the rotation it had never
  touched.

  Two parts:
    PART 1 - independent extraction across all 12 Smartts pages, no code
             shared with tools/ or any prior pass's script.
    PART 2 - proof by injection against the real check-switch-copy.js, five
             rules, on switch-prescriptions-smartts-bootle.html and its banner,
             each restored by direct Buffer write (not a text pipeline) and
             sha256-confirmed before the next.

  Run: node verify-3.7-2026-09-04-tenth.js
*/
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");

var ROOT = "C:\\Dev\\rbh-site-data";
var PAGE_DIR = path.join(ROOT, "modules");
var BRANCHES = path.join(ROOT, "branches.json");

var data = JSON.parse(fs.readFileSync(BRANCHES, "utf8"));
var byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });
var smartts = byId["smartts_bootle"];
if (!smartts) { console.error("smartts_bootle not found in branches.json"); process.exit(2); }

var otherLive = data.branches.filter(function (b) { return b.id !== "smartts_bootle" && !b.disposed; });

function flat(s) { return String(s).replace(/\s+/g, " ").trim(); }
function textOf(h) { return flat(String(h).replace(/<[^>]+>/g, " ")); }
function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex").toUpperCase(); }
function stripBuildComment(html) { return html.replace(/<!--[\s\S]*?-->/, ""); }

var checks = 0, flags = [];
function check(cond, msg) { checks++; if (!cond) flags.push(msg); }

// ---------------------------------------------------------------------------
// PART 1 - independent extraction, all 12 Smartts pages
// ---------------------------------------------------------------------------
var files = [];
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && e.name.endsWith(".html") && /smartts-bootle/.test(e.name)) files.push(p);
  });
}
walk(PAGE_DIR);
check(files.length === 12, "expected 12 Smartts pages on disk, found " + files.length);

files.forEach(function (f) {
  var html = fs.readFileSync(f, "utf8");
  var noComment = stripBuildComment(html);
  var text = textOf(html);

  // Own facts present
  check(html.indexOf(smartts.postalCode) !== -1, path.basename(f) + ": own postcode " + smartts.postalCode + " not found");
  check(html.indexOf(smartts.streetAddress) !== -1, path.basename(f) + ": own street address not found");
  check(html.indexOf(smartts.phone) !== -1 || text.indexOf(smartts.phone) !== -1, path.basename(f) + ": own phone not found");

  // No other live branch's postcode, ODS code or widget id anywhere
  otherLive.forEach(function (b) {
    if (b.postalCode && b.postalCode !== smartts.postalCode && html.indexOf(b.postalCode) !== -1) {
      flags.push(path.basename(f) + ": carries " + b.id + "'s postcode " + b.postalCode);
    }
    checks++;
    if (b.odsCode && html.indexOf(b.odsCode) !== -1) {
      flags.push(path.basename(f) + ": carries " + b.id + "'s ODS code " + b.odsCode);
    }
    checks++;
    if (b.widgets) {
      Object.keys(b.widgets).forEach(function (svc) {
        checks++;
        var wid = b.widgets[svc];
        if (wid && smartts.widgets && Object.values(smartts.widgets).indexOf(wid) === -1 && html.indexOf(wid) !== -1) {
          flags.push(path.basename(f) + ": carries " + b.id + "'s " + svc + " widget id " + wid);
        }
      });
    }
  });

  // Cross-town guard: no other live branch's seoTown, unless in Smartts's own serviceAreaList
  otherLive.forEach(function (b) {
    checks++;
    if (!b.seoTown || b.seoTown === smartts.seoTown) return;
    var allowed = (smartts.serviceAreaList || []).indexOf(b.seoTown) !== -1;
    var re = new RegExp("\\b" + b.seoTown.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
    if (!allowed && re.test(text)) {
      flags.push(path.basename(f) + ": names " + b.seoTown + " (" + b.id + "'s town) without a serviceAreaList excuse");
    }
  });

  // em dash outside the build-comment exemption
  checks++;
  if (/\u2014/.test(noComment)) flags.push(path.basename(f) + ": em dash found outside the build HTML comment");

  // hasApp consistency on the switch page specifically
  if (/switch\\pages\\switch-prescriptions-smartts-bootle\.html$/i.test(f) || /switch[\\/]pages[\\/]switch-prescriptions-smartts-bootle\.html$/i.test(f)) {
    checks++;
    var hasAppCard = /RB Healthcare Pharmacy app/i.test(html);
    check(smartts.hasApp ? hasAppCard : !hasAppCard,
      "switch page hasApp mismatch: branch hasApp=" + smartts.hasApp + ", app card present=" + hasAppCard);
  }
});

console.log("PART 1 (independent extraction, " + files.length + " pages): " + checks + " checks, " + flags.length + " flag(s)");
flags.forEach(function (m) { console.log("  FLAG: " + m); });

// ---------------------------------------------------------------------------
// PART 2 - proof by injection against the real checker
// ---------------------------------------------------------------------------
var SWITCH_PAGE = path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-smartts-bootle.html");
var BANNER_FILE = path.join(ROOT, "modules", "switch", "pages", "banners", "switch-prescriptions-smartts-bootle.txt");
var CHECKER = path.join(ROOT, "tools", "check-switch-copy.js");

function runChecker() {
  var r = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

// Guard: refuse to run if either target file already carries a git diff.
var diffCheck = cp.spawnSync("git", ["status", "--porcelain", "--", SWITCH_PAGE, BANNER_FILE], { cwd: ROOT, encoding: "utf8" });
if (diffCheck.stdout && diffCheck.stdout.trim()) {
  console.error("REFUSING TO RUN: target file(s) already show a git diff:\n" + diffCheck.stdout);
  process.exit(3);
}

var pageBuf = fs.readFileSync(SWITCH_PAGE);
var bannerBuf = fs.readFileSync(BANNER_FILE);
var pageHash = sha256(pageBuf);
var bannerHash = sha256(bannerBuf);
console.log("\nBaseline sha256:");
console.log("  " + path.basename(SWITCH_PAGE) + " = " + pageHash);
console.log("  " + path.basename(BANNER_FILE) + " = " + bannerHash);

var baseline = runChecker();
if (baseline.code !== 0) {
  console.error("REFUSING TO RUN: check-switch-copy.js is not clean at baseline:\n" + baseline.out);
  process.exit(4);
}
console.log("Baseline check-switch-copy.js: exit 0 (clean)\n");

var results = [];
function inject(label, targetPath, buf, mutate, expectTag) {
  var mutated = mutate(buf.toString("utf8"));
  if (mutated === buf.toString("utf8")) {
    results.push({ label: label, ok: false, note: "mutation did not change file content, aborting this probe" });
    return;
  }
  fs.writeFileSync(targetPath, mutated, "utf8");
  var r = runChecker();
  var caught = r.code !== 0 && r.out.toLowerCase().indexOf("[" + expectTag.toLowerCase() + "]") !== -1;
  // restore immediately, direct Buffer write, before any further assertion
  fs.writeFileSync(targetPath, buf);
  var restoredHash = sha256(fs.readFileSync(targetPath));
  var expectedHash = sha256(buf);
  var restoredOk = restoredHash === expectedHash;
  results.push({
    label: label,
    ok: caught && restoredOk,
    exitCode: r.code,
    expectTag: expectTag,
    caught: caught,
    restoredOk: restoredOk,
    outSnippet: r.out.split("\n").slice(0, 6).join(" | ")
  });
}

// 1. RULE 7, no-medicines: insert a prescription-only weight loss medicine name
inject("rule7-no-medicines (Wegovy in hero-sub)", SWITCH_PAGE, pageBuf, function (html) {
  return html.replace(/<p class="hero-sub">/, '<p class="hero-sub">We can also discuss Wegovy if relevant. ');
}, "no-medicines");

// 2. RULE 8, town: swap the pill line's town from Bootle to a different live branch's town
inject("rule8-town (pill Bootle -> Walton)", SWITCH_PAGE, pageBuf, function (html) {
  return html.replace(/(<span class="pill">)([\s\S]*?)(<\/span>)/, function (m, a, mid, c) {
    return a + mid.replace(/\bBootle\b/, "Walton") + c;
  });
}, "town");

// 3. RULE 9, form-copy: add an undescribed field to the form grid
inject("rule9-form-copy (undescribed nhs_number field)", SWITCH_PAGE, pageBuf, function (html) {
  return html.replace(/(<div class="form-grid">)/, '$1<input type="text" name="nhs_number" placeholder="NHS number">');
}, "form-copy");

// 4. RULE 10, collection-notice: delete the privacy paragraph
inject("rule10-collection-notice (privacy paragraph removed)", SWITCH_PAGE, pageBuf, function (html) {
  return html.replace(/<p class="privacy">[\s\S]*?<\/p>/, "");
}, "collection-notice");

// 5. RULE banner (11a): repoint SWITCH_URL at a different branch's switch page
inject("rule-banner-11a (SWITCH_URL repointed at Cherry Lane)", BANNER_FILE, bannerBuf, function (txt) {
  return txt.replace('var SWITCH_URL = "/switch-prescriptions-smartts-bootle.html";',
    'var SWITCH_URL = "/switch-prescriptions-cherry-lane-walton.html";');
}, "banner");

console.log("PART 2 (injection proof), 5 probes:");
var allOk = true;
results.forEach(function (r) {
  console.log("  " + (r.ok ? "CAUGHT" : "FAILED") + " - " + r.label +
    (r.exitCode !== undefined ? " (exit=" + r.exitCode + ", caught=" + r.caught + ", restoredOk=" + r.restoredOk + ")" : " (" + r.note + ")"));
  if (r.outSnippet) console.log("      " + r.outSnippet);
  if (!r.ok) allOk = false;
});

// Final sweep
var finalPageHash = sha256(fs.readFileSync(SWITCH_PAGE));
var finalBannerHash = sha256(fs.readFileSync(BANNER_FILE));
console.log("\nFinal hash check:");
console.log("  page  matches baseline: " + (finalPageHash === pageHash));
console.log("  banner matches baseline: " + (finalBannerHash === bannerHash));
var finalRun = runChecker();
console.log("  final check-switch-copy.js run: exit " + finalRun.code + (finalRun.code === 0 ? " (clean)" : ""));

console.log("\n=== SUMMARY ===");
console.log("PART 1 flags: " + flags.length);
console.log("PART 2 all caught and restored: " + allOk);
console.log("Files byte-identical to baseline after all probes: " +
  (finalPageHash === pageHash && finalBannerHash === bannerHash));
console.log("Final checker run clean: " + (finalRun.code === 0));

if (flags.length || !allOk || finalPageHash !== pageHash || finalBannerHash !== bannerHash || finalRun.code !== 0) {
  process.exit(1);
}
process.exit(0);
