/*
  audits/clear-aintree-vacuity-probe-2026-08-14.js

  A pass is worthless until the instrument has been shown to be capable of
  failing. This injects one fault at a time into a real page, runs the item
  3.13 audit, and asserts the matching rule fires. Every injection is undone
  with `git checkout --` immediately afterwards, and the probe refuses to run
  unless the worktree is clean to begin with, so it cannot mask a real edit.

  Run:  node audits/clear-aintree-vacuity-probe-2026-08-14.js
*/
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const REPO = path.join(__dirname, "..");
const AUDIT = path.join(__dirname, "clear-aintree-independent-2026-08-14.js");
const TARGET = "modules/switch/pages/switch-prescriptions-clear-aintree.html";
const abs = path.join(REPO, TARGET);

const status = cp.execFileSync("git", ["status", "--porcelain", "--", TARGET], { cwd: REPO }).toString().trim();
if (status) { console.log("REFUSING TO RUN: " + TARGET + " is already modified."); process.exit(2); }

const original = fs.readFileSync(abs, "utf8");

// each: [label, expected rule id, mutate(text) -> text]
const injections = [
  ["wrong tel digit", "TELMATCH", t => t.replace("tel:01512038365", "tel:01512038366")],
  ["second H1", "H1COUNT", t => t.replace("</h1>", "</h1><h1>Second heading</h1>")],
  ["em dash in copy", "DASH", t => t.replace("We handle everything.", "We handle everything — all of it.")],
  ["http:// URL", "SCHEME", t => t.replace('href="https://www.clearchemist.co.uk"', 'href="http://www.clearchemist.co.uk"')],
  ["personal inbox", "PERSONALEMAIL", t => t.replace('name="destination" value=""', 'name="destination" value="rishi@rbhealth.co.uk"')],
  // PR8 3HN is Fishlocks Ainsdale. The first draft of this probe injected an
  // invented code one character away from it, which belongs to no branch, so
  // the rule was right not to fire and the probe was testing nothing. An
  // injection has to be a REAL foreign value or it proves the opposite of
  // what it claims. The invented code is deliberately not written out here:
  // check-postcodes.js scans this file and rightly refuses any postcode that
  // is in no branch and carries no registered reason.
  ["foreign postcode", "FOREIGNPOSTCODE", t => t.replace("L9 7AS", "L9 7AS and PR8 3HN")],
  ["dangling fragment", "FRAGMENT", t => t.replace('href="#switch-form-card"', 'href="#does-not-exist"')],
  ["hard-coded widget id", "WIDGETID", t => t.replace('data-branch="Clear Chemist"', 'data-branch="Clear Chemist" data-widget="691451f1f9b8831e135baacb"')],
  // Likewise this one first matched the phrase inside the paste-header
  // comment, which the audit strips before reading copy, so the H1 kept its
  // town and the rule correctly stayed silent. Target the element itself.
  ["town stripped from H1", "H1TOWN", t => t.replace(/<h1([^>]*)>[\s\S]*?<\/h1>/i, "<h1$1>Switch your prescriptions to Clear Chemist in under 30 seconds</h1>")]
];

let good = 0, bad = 0;
for (const [label, rule, mutate] of injections) {
  const mutated = mutate(original);
  if (mutated === original) { console.log("  INERT   " + label + " - injection changed nothing, probe is not testing this rule"); bad++; continue; }
  fs.writeFileSync(abs, mutated);
  let out = "";
  try { out = cp.execFileSync("node", [AUDIT], { cwd: REPO }).toString(); }
  catch (e) { out = (e.stdout || "").toString() + (e.stderr || "").toString(); }
  cp.execFileSync("git", ["checkout", "--", TARGET], { cwd: REPO });
  const caught = out.includes("[" + rule + "]");
  console.log("  " + (caught ? "CAUGHT  " : "MISSED  ") + label + "  (expected " + rule + ")");
  caught ? good++ : bad++;
}

const after = cp.execFileSync("git", ["status", "--porcelain", "--", TARGET], { cwd: REPO }).toString().trim();
console.log("\n" + good + " caught, " + bad + " missed. " + TARGET + (after ? " STILL MODIFIED - RESTORE BY HAND" : " restored clean."));
process.exit(bad || after ? 1 : 0);
