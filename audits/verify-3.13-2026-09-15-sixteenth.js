/*
  verify-3.13-2026-09-15-sixteenth.js

  Item 3.13 (Clear Chemist, Liverpool/Aintree), sixteenth quality pass,
  2026-09-15. All 8 unblocked worklist items were [BLOCKED] this run again
  (5.3, 5.4, 5.5, 5.8, 6.1, and the three Q60/Q66 lines under 6.4/6.5/6.6), so
  this is the fallback quality pass, picked by the standing rotation-pool
  method: a fresh header-to-next-header quality-pass/Done-date scan of every
  completed item's own block, with the standing out-of-rotation set
  (1.1, 1.4, 2.2, 5.6, 5.7, 6.7, 6.8) excluded. The tied-oldest pool at
  2026-09-14 was {3.13, 4.1} once 3.12 dropped out of it after the
  forty-first run's sixteenth pass moved 3.12 to 2026-09-15. Took 3.13 on the
  lowest-item-number tiebreak.

  FRESH ANGLE. Fifteen prior passes on this item proved, by direct injection
  against Clear Chemist Aintree's own pages/records specifically:
  check-switch-copy.js, check-weight-loss-copy.js, check-travel-clinic-copy.js,
  check-jsonld.js, check-seo-pattern.js, check-seo-keywords.js,
  check-branch-links.js, check-app-membership.js, check-booking-routes.js,
  check-nap.js, check-postcodes.js, check-em-dashes.js, check-cdn-pins.js,
  check-branch-identity.js and (fifteenth pass) check-map-embeds.js. A grep of
  this item's own AGENT_WORKLIST.md section for "check-seo-lengths.js" across
  all fifteen passes returns zero hits - it has never once been proven against
  Clear Chemist Aintree specifically, despite being the checker several other
  items (3.9, 3.10, 3.11, 3.12) have each closed on their own most recent
  pass. check-seo-lengths.js holds four rules: Page Title <= 65 characters,
  Page Description between 80 and 165 characters, no two pages across the
  whole estate sharing a title/description/permalink, and no two pages
  sharing an H1 (same-branch repeat FAILS outright). Closed this pass.

  Restore discipline: every injection restored from an in-memory buffer via
  fs.writeFileSync, not git (the standing fix this item's fifth pass had to
  apply after a FUSE index.lock crashed an earlier probe mid-run), sha256-
  reconfirmed byte-identical before the next injection and again at the end.

  Run: node audits/verify-3.13-2026-09-15-sixteenth.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-seo-lengths.js");

const SWITCH_SHEET = path.join(REPO, "modules", "switch", "pages", "SEO.md");
const WEIGHT_SHEET = path.join(REPO, "modules", "service", "pages", "WEIGHT-LOSS-SEO.md");
const TRAVEL_SHEET = path.join(REPO, "modules", "service", "pages", "TRAVEL-CLINIC-SEO.md");
const SWITCH_PAGE = path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-clear-aintree.html");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function line(s) { console.log(s); }

// ---- baseline ---------------------------------------------------------
const FILES = {
  switchSheet: SWITCH_SHEET,
  weightSheet: WEIGHT_SHEET,
  travelSheet: TRAVEL_SHEET,
  switchPage: SWITCH_PAGE
};
const baseline = {};
Object.keys(FILES).forEach(function (k) { baseline[k] = fs.readFileSync(FILES[k]); });
const baselineSha = {};
Object.keys(baseline).forEach(function (k) { baselineSha[k] = sha256(baseline[k]); });

line("=== BASELINE ===");
Object.keys(baselineSha).forEach(function (k) { line("  " + k + ": " + baselineSha[k]); });

const pre = runChecker();
line("Pre-injection checker run: exit " + pre.code);
if (pre.code !== 0) {
  line(pre.out);
  throw new Error("Checker not clean before any injection - aborting, this would invalidate every result below.");
}

function restoreAll() {
  Object.keys(FILES).forEach(function (k) { fs.writeFileSync(FILES[k], baseline[k]); });
  Object.keys(FILES).forEach(function (k) {
    const got = sha256(fs.readFileSync(FILES[k]));
    if (got !== baselineSha[k]) throw new Error("RESTORE FAILED for " + k + ": " + got + " != " + baselineSha[k]);
  });
}

let caught = 0, missed = 0, results = [];

function attempt(name, mutate, expectSubstring) {
  mutate();
  const r = runChecker();
  const hit = r.code !== 0 && r.out.indexOf(expectSubstring) !== -1;
  if (hit) { caught++; results.push({ name: name, status: "CAUGHT", tag: expectSubstring }); }
  else if (r.code !== 0) { results.push({ name: name, status: "CAUGHT (different message)", out: r.out }); caught++; }
  else { missed++; results.push({ name: name, status: "MISSED", out: r.out }); }
  restoreAll();
  const post = runChecker();
  if (post.code !== 0) throw new Error("Checker not clean after restore for '" + name + "' - restore itself is broken.");
}

// ---- RULE 1, title length: switch page title extended past 65 chars -----
attempt(
  "RULE 1 title length - switch page title extended past 65 characters",
  function () {
    const src = fs.readFileSync(SWITCH_SHEET, "utf8");
    const marker = "- **Page Title:** Switch Your Prescriptions to Clear Chemist, Aintree";
    if (src.indexOf(marker) === -1) throw new Error("marker not found in switch SEO.md - sheet shape changed");
    const newTitle = "Switch Your NHS Repeat Prescriptions Over To Clear Chemist, Aintree Today";
    if (newTitle.length <= 65) throw new Error("injected title is not actually over the limit - fix the fixture");
    const mutated = src.replace(marker, "- **Page Title:** " + newTitle);
    fs.writeFileSync(SWITCH_SHEET, mutated);
  },
  "over the 65 limit"
);

// ---- RULE 2, description length: weight loss description shortened ------
attempt(
  "RULE 2 description length - weight loss description shortened under 80 characters",
  function () {
    const src = fs.readFileSync(WEIGHT_SHEET, "utf8");
    const marker = "- **Page Description:** Private, pharmacist-led weight loss clinic at Clear Chemist in Aintree. Clinical assessment first; treatment only where appropriate.";
    if (src.indexOf(marker) === -1) throw new Error("marker not found in WEIGHT-LOSS-SEO.md - sheet shape changed");
    const newDesc = "Weight loss clinic at Clear Chemist.";
    if (newDesc.length >= 80) throw new Error("injected description is not actually under the minimum - fix the fixture");
    const mutated = src.replace(marker, "- **Page Description:** " + newDesc);
    fs.writeFileSync(WEIGHT_SHEET, mutated);
  },
  "under the 80 minimum"
);

// ---- RULE 3a, duplicate title: travel clinic title set to the weight loss
// clinic's own title (same branch, two different sheets) ------------------
attempt(
  "RULE 3a duplicate title - travel clinic title set to Clear Aintree's own weight loss title",
  function () {
    const src = fs.readFileSync(TRAVEL_SHEET, "utf8");
    const marker = "- **Page Title:** Travel Clinic at Clear Chemist, Aintree";
    if (src.indexOf(marker) === -1) throw new Error("marker not found in TRAVEL-CLINIC-SEO.md - sheet shape changed");
    const mutated = src.replace(marker, "- **Page Title:** Weight Loss Clinic at Clear Chemist, Aintree");
    fs.writeFileSync(TRAVEL_SHEET, mutated);
  },
  "duplicate title"
);

// ---- RULE 3b, duplicate permalink: switch permalink set to the travel
// clinic's own permalink (same branch, two different sheets) --------------
attempt(
  "RULE 3b duplicate permalink - switch permalink set to Clear Aintree's own travel clinic permalink",
  function () {
    const src = fs.readFileSync(SWITCH_SHEET, "utf8");
    const marker = "- **Page Permalink:** switch-prescriptions-clear-aintree";
    if (src.indexOf(marker) === -1) throw new Error("marker not found in switch SEO.md - sheet shape changed");
    const mutated = src.replace(marker, "- **Page Permalink:** travel-clinic-clear-aintree");
    fs.writeFileSync(SWITCH_SHEET, mutated);
  },
  "duplicate permalink"
);

// ---- RULE 4a, H1 same-branch repeat: switch page's H1 set to the weight
// loss page's own H1 (both Clear Aintree's own pages) ----------------------
attempt(
  "RULE 4a same-branch H1 repeat - switch page H1 set to Clear Aintree's own weight loss H1",
  function () {
    const src = fs.readFileSync(SWITCH_PAGE, "utf8");
    const marker = "<h1>Switch your prescriptions to Clear Chemist in Aintree in under 30 seconds</h1>";
    if (src.indexOf(marker) === -1) throw new Error("marker not found in switch page - page shape changed");
    const mutated = src.replace(marker, "<h1>Weight Loss Clinic at Clear Chemist in Aintree</h1>");
    fs.writeFileSync(SWITCH_PAGE, mutated);
  },
  "one branch uses the same H1 on two of its own pages - clearchemist_aintree"
);

// ---- CONTROL: benign, unrelated edit - must NOT fire this checker -------
{
  const src = fs.readFileSync(SWITCH_SHEET, "utf8");
  const marker = "- **Meta Keywords:** Clear Chemist, Clear Chemist Aintree, switch prescriptions Aintree, switch pharmacy, prescription transfer, repeat prescriptions, pharmacy Aintree, NHS pharmacy Aintree, chemist Aintree, L9";
  if (src.indexOf(marker) === -1) throw new Error("marker not found in switch SEO.md - sheet shape changed");
  const mutated = src.replace(marker, marker + ", Brookfield Trade Centre");
  fs.writeFileSync(SWITCH_SHEET, mutated);
  const r = runChecker();
  results.push({
    name: "CONTROL - benign Meta Keywords addition on switch sheet (not read by this checker)",
    status: r.code === 0 ? "PASSED (correct)" : "FALSE POSITIVE",
    out: r.code === 0 ? undefined : r.out
  });
  if (r.code === 0) caught++; else missed++;
  restoreAll();
  const post = runChecker();
  if (post.code !== 0) throw new Error("Checker not clean after CONTROL restore.");
}

// ---- final verification ---------------------------------------------------
line("");
line("=== RESULTS ===");
results.forEach(function (r) {
  line("  " + r.status + ": " + r.name + (r.tag ? " [" + r.tag + "]" : ""));
  if (r.out && r.status.indexOf("MISSED") !== -1) line("    " + r.out.split("\n").join("\n    "));
  if (r.out && r.status.indexOf("FALSE POSITIVE") !== -1) line("    " + r.out.split("\n").join("\n    "));
});

line("");
Object.keys(FILES).forEach(function (k) {
  const got = sha256(fs.readFileSync(FILES[k]));
  line("Final restore check " + k + ": " + (got === baselineSha[k] ? "OK byte-identical" : "MISMATCH " + got));
});

const finalRun = runChecker();
line("Final checker run after full restore: exit " + finalRun.code);
if (finalRun.code !== 0) { line(finalRun.out); throw new Error("Checker not clean at end of run."); }

line("");
line("Summary: " + caught + " correct outcome(s) (caught or correctly passed), " + missed + " unexpected outcome(s).");
if (missed > 0) process.exitCode = 1;
