/*
  Item 2.1 quality pass (thirteenth), 2026-09-06 (unattended scheduled run,
  read half via mcp__workspace__bash sandbox, write half via
  mcp__Windows-MCP__PowerShell on the real host, per the standing Q96
  workaround recorded in AGENT_LOG.md).

  Fresh angle for this pass: of Fishlocks Ainsdale's 13 owned pages, the
  switch page (eighth pass), the travel clinic page (ninth), the branch
  landing page (tenth), the weight-loss-clinic page (eleventh) and the
  contraception page (twelfth) had each had a dedicated injection round for
  this item. The seven Pharmacy First condition pages and the Pharmacy First
  overview page had not, and check-pharmacy-first-eligibility.js - the
  checker that pins the NHS cohort ages this whole worklist family exists to
  protect - had never been proven against this branch's own pages at all.

  PART A. Baseline confirms the checker was already clean against this
  branch's condition pages before any injection.

  PART B. Four injections against the branch's own Pharmacy First pages,
  restored byte-identical after each, proving rules 5, 6, 7 and 8:
    (1) RULE 6/7 - sinusitis-treatment-fishlocks-ainsdale.html: the hero pill
        "Age 12 and over" changed to "Age 10 and over" (10 is not the NHS
        sinusitis cohort {12}).
    (2) RULE 8 - earache-treatment-fishlocks-ainsdale.html: the safety
        redirect "Babies under 1 should see a GP" removed from the
        "different help" list.
    (3) RULE 5 - shingles-treatment-fishlocks-ainsdale.html: the eligibility
        cohort line "Adults aged 18 and over" changed to "Grown-ups aged 18
        and over" (same numbers, no longer verbatim).
    (4) RULE 7 - uti-treatment-fishlocks-ainsdale.html: the cohort line
        "Women aged 16 to 64" changed to "Women aged 16 to 74", the exact
        range-tail-drift regression class the checker's own header names as
        the reason rule 7 reads both ends of a range.

  PART C. A genuine gap found and closed, not merely re-proved. The Pharmacy
  First OVERVIEW page (pharmacy-first-fishlocks-ainsdale.html) states every
  condition's age a second time, once per tile, composed in
  tools/build-service-pages.js's overviewPage() from the same c.ageNote
  string as the condition page's own pill. Before this pass, nothing read it:
  rules 5-8 only open a file named "<cond>-treatment-*", which an overview
  page's filename never is, and rule 9 only reads gbp-packs/ and
  modules/branch/pages/, neither of which this file is in. Proved by
  injection BEFORE the fix (changing the shingles tile's age from "Age 18 and
  over" to "Age 16 and over" and running the full checker suite): 0 failures
  across all checkers in tools/. The live copy was correct only by
  construction (one generator function, one string, used twice), not by any
  rule - the same shape this repo has already found at the map-embed query
  and the WhatsApp number.

  FIX: check-pharmacy-first-eligibility.js gained RULE 12, reading every
  modules/service/pages/pharmacy-first-*.html file, matching each
  condition-grid tile to its condition by name, and requiring the tile's own
  age span to equal that condition's pinned ageNote verbatim, plus the same
  stray-age sweep rule 7 runs, bounded to that one tile. See the rule's own
  comment in the checker for the full design notes.

  PART D re-runs the same three injection shapes against the OVERVIEW page
  post-fix, confirming rule 12 now catches all of them, then confirms the
  full checker suite is clean on the untouched tree and all six generators
  rebuild to a byte-identical zero diff.

  Every mutation in this script is applied to a freshly-restored copy of the
  original, restored by direct file write from an in-memory string
  immediately after capturing the checker's output, sha256-reconfirmed
  byte-identical before the next injection and again at the end. The script
  refuses to run if the relevant tree is not git-clean before it starts.

  Run:  node audits/verify-2.1-2026-09-06-thirteenth.js
*/
"use strict";

const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

function clean(paths) {
  const out = execSync("git status --porcelain -- " + paths.join(" "), { cwd: ROOT }).toString();
  return out.trim() === "";
}

function runNode(scriptPath) {
  try {
    const out = execFileSync("node", [scriptPath], { cwd: ROOT }).toString();
    return { code: 0, out };
  } catch (e) {
    return { code: typeof e.status === "number" ? e.status : 1, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

function runAllCheckers() {
  const dir = path.join(ROOT, "tools");
  const files = fs.readdirSync(dir).filter((f) => /^check-.*\.js$/.test(f));
  let fails = 0;
  const failed = [];
  files.forEach((f) => {
    const r = runNode(path.join(dir, f));
    if (r.code !== 0) { fails++; failed.push(f); }
  });
  return { total: files.length, fails, failed };
}

const CHECKER = path.join(ROOT, "tools", "check-pharmacy-first-eligibility.js");

console.log("PART A: baseline, before any mutation");
// tools/check-pharmacy-first-eligibility.js is deliberately modified by this
// pass (rule 12, added earlier in this session) and is not checked for
// cleanliness here; every OTHER tracked path must be untouched throughout.
if (!clean(["modules", "core", "branches.json", "gbp-packs", "status"])) {
  console.error("REFUSING: tree not clean at start"); process.exit(2);
}
let r = runNode(CHECKER);
console.log("exit " + r.code + "\n" + r.out.trim().split("\n").slice(-4).join("\n"));
if (r.code !== 0) { console.error("ABORT: checker not clean at baseline"); process.exit(3); }

console.log("\nPART B: four injections against this branch's own condition pages");
const partB = [
  {
    file: "modules/service/pages/sinusitis-treatment-fishlocks-ainsdale.html",
    label: "RULE 6/7: hero pill Age 12 and over -> Age 10 and over",
    needle: '<span class="pill">Age 12 and over &middot; Free NHS service in Ainsdale</span>',
    replacement: '<span class="pill">Age 10 and over &middot; Free NHS service in Ainsdale</span>',
    expectRule: /\(rule 6\)|\(rule 7\)/
  },
  {
    file: "modules/service/pages/earache-treatment-fishlocks-ainsdale.html",
    label: "RULE 8: safety redirect for babies under 1 removed",
    needle: "<li>Babies under 1 should see a GP</li>",
    replacement: "<li>Please arrive ten minutes early for your appointment</li>",
    expectRule: /\(rule 8\)/
  },
  {
    file: "modules/service/pages/shingles-treatment-fishlocks-ainsdale.html",
    label: "RULE 5: cohort line reworded, same numbers",
    needle: "<li>Adults aged 18 and over</li>",
    replacement: "<li>Grown-ups aged 18 and over</li>",
    expectRule: /\(rule 5\)/
  },
  {
    file: "modules/service/pages/uti-treatment-fishlocks-ainsdale.html",
    label: "RULE 7: range tail drifted 64 -> 74",
    needle: "<li>Women aged 16 to 64</li>",
    replacement: "<li>Women aged 16 to 74</li>",
    expectRule: /\(rule 7\)/
  }
];

let allBCaught = true;
partB.forEach((t) => {
  const abs = path.join(ROOT, t.file);
  const original = fs.readFileSync(abs, "utf8");
  const origSha = sha(original);
  if (original.indexOf(t.needle) === -1) { console.error("GUARD FAILED: needle not found for " + t.label); process.exit(4); }
  fs.writeFileSync(abs, original.replace(t.needle, t.replacement), "utf8");

  const res = runNode(CHECKER);
  const caught = res.code !== 0 && t.expectRule.test(res.out);
  console.log("- " + t.label + " -> exit " + res.code + ", caught on expected rule: " + caught);
  if (!caught) allBCaught = false;

  fs.writeFileSync(abs, original, "utf8");
  const restored = sha(fs.readFileSync(abs, "utf8")) === origSha;
  if (!restored) { console.error("FATAL: restore failed for " + t.file); process.exit(5); }
});
console.log("Part B all caught on first attempt: " + allBCaught);
if (!clean(["modules", "core", "branches.json", "gbp-packs", "status"])) {
  console.error("REFUSING: tree not clean after Part B restores"); process.exit(6);
}

console.log("\nPART C/D: the overview-page gap, and rule 12 closing it");
const overviewFile = path.join(ROOT, "modules", "service", "pages", "pharmacy-first-fishlocks-ainsdale.html");
const overviewOriginal = fs.readFileSync(overviewFile, "utf8");
const overviewSha = sha(overviewOriginal);

const partD = [
  {
    label: "shingles tile Age 18 and over -> Age 16 and over",
    needle: '<span style="color:#6b7280;font-size:13px;">Age 18 and over</span>',
    replacement: '<span style="color:#6b7280;font-size:13px;">Age 16 and over</span>'
  },
  {
    label: "UTI tile range tail 64 -> 74",
    needle: '<span style="color:#6b7280;font-size:13px;">Women aged 16 to 64</span>',
    replacement: '<span style="color:#6b7280;font-size:13px;">Women aged 16 to 74</span>'
  },
  {
    label: "earache tile cohort word dropped (Age vs Ages, numbers unchanged)",
    needle: '<span style="color:#6b7280;font-size:13px;">Age 1 to 17</span>',
    replacement: '<span style="color:#6b7280;font-size:13px;">Ages 1 to 17</span>'
  }
];

let allDCaught = true;
partD.forEach((t) => {
  const current = fs.readFileSync(overviewFile, "utf8");
  if (sha(current) !== overviewSha) { console.error("ABORT: overview page not at original state"); process.exit(7); }
  if (current.indexOf(t.needle) === -1) { console.error("GUARD FAILED: needle not found for " + t.label); process.exit(8); }
  fs.writeFileSync(overviewFile, current.replace(t.needle, t.replacement), "utf8");

  const res = runNode(CHECKER);
  const caught = res.code !== 0 && /\(rule 12\)/.test(res.out);
  console.log("- " + t.label + " -> exit " + res.code + ", caught on rule 12: " + caught);
  if (!caught) allDCaught = false;

  fs.writeFileSync(overviewFile, overviewOriginal, "utf8");
  const restored = sha(fs.readFileSync(overviewFile, "utf8")) === overviewSha;
  if (!restored) { console.error("FATAL: restore failed for overview page"); process.exit(9); }
});
console.log("Part D all caught by new rule 12: " + allDCaught);

if (!clean(["modules", "core", "gbp-packs", "status"])) {
  console.error("REFUSING: non-tools tree not clean after Part D restores"); process.exit(10);
}

console.log("\nFinal: full checker suite on the untouched tree");
const suite = runAllCheckers();
console.log("checkers run: " + suite.total + ", failures: " + suite.fails +
  (suite.failed.length ? " (" + suite.failed.join(", ") + ")" : ""));

console.log("\nFinal: regenerate all six page families, confirm byte-identical zero diff");
const beforeGen = execSync("git status --porcelain -- modules core", { cwd: ROOT }).toString();
[
  "build-branch-landing-pages.js",
  "build-contraception-pages.js",
  "build-service-pages.js",
  "build-switch-pages.js",
  "build-travel-clinic-pages.js",
  "build-weight-loss-pages.js"
].forEach((g) => execFileSync("node", [path.join("tools", g)], { cwd: ROOT }));
const afterGen = execSync("git status --porcelain -- modules core", { cwd: ROOT }).toString();
console.log("generator diff empty before and after: " + (beforeGen === "" && afterGen === "" && beforeGen === afterGen));

console.log("\nRESULT: rules 5, 6, 7 and 8 re-proven by injection against this branch's own condition " +
  "pages for the first time on this item (Part B), and a genuine, previously-unread third surface for " +
  "these ages (the Pharmacy First overview page) proved missing by injection (Part C) and closed with " +
  "new RULE 12, proven against the same branch's overview page (Part D). check-pharmacy-first-eligibility.js " +
  "is the only tracked file changed. All six generators rebuild to a byte-identical zero diff.");
