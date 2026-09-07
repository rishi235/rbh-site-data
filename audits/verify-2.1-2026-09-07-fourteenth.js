/*
  verify-2.1-2026-09-07-fourteenth.js

  Item 2.1 (Fishlocks Ainsdale), fourteenth quality pass, 2026-09-07.

  FRESH ANGLE: across thirteen prior passes on this item, tools/check-app-
  membership.js had never been named once, despite Fishlocks Ainsdale being
  one of only four app-member branches in the whole estate (the other three
  are Fishlocks Eccleston, Clear Chemist Aintree, Smartts Bootle) and despite
  the checker's own docstring using this exact branch's sister-domain shape
  (Fishlocks Ainsdale/Eccleston share fishlockpharmacy.co.uk, the same way
  Smartts/SK Chemists share a town in the checker's own worked example) as
  the reason the field needs a rule at all. No prior pass on this item has
  proven RULES 2, 3, 4, 5 or 8e directly against this branch's own pages and
  pack.

  Five injections, each applied to a freshly restored copy of the original,
  each targeting one rule:
    1. RULE 2 (switch pages)   - the app-card block removed from the switch
       page, leaving the branch a member with no card.
    2. RULE 3 (landing pages)  - the app sentence's identifying phrase
       reworded on the branch landing page.
    3. RULE 4 (absence elsewhere) - an app mention spliced into a
       service-family page (the Pharmacy First overview), which is not one
       of the two families the field is allowed to reach.
    4. RULE 5 (one name)      - "RB Healthcare Pharmacy app" shortened to
       "RB Healthcare app" on the switch page, dropping the word the
       generator's own canonical string requires.
    5. RULE 8e (GBP pack positive) - the app sentence deleted from
       gbp-packs/fishlocks-ainsdale.md's business description, leaving a
       member branch's public-profile copy silent about a service it runs.

  Discipline matching prior passes on this item: refuses to run if any target
  already carries a git diff; captures each file's original bytes before any
  mutation; restores by direct fs.writeFileSync from the in-memory buffer
  immediately after capturing the checker's output and before any assertion;
  sha256-reconfirms byte-identical restoration before the next injection and
  again at the end.
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-app-membership.js");

const TARGETS = {
  switchPage: path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-fishlocks-ainsdale.html"),
  landingPage: path.join(REPO, "modules", "branch", "pages", "pharmacy-fishlocks-ainsdale.html"),
  overviewPage: path.join(REPO, "modules", "service", "pages", "pharmacy-first-fishlocks-ainsdale.html"),
  pack: path.join(REPO, "gbp-packs", "fishlocks-ainsdale.md")
};

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(file) {
  const rel = path.relative(REPO, file);
  const out = execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: REPO }).toString();
  return out.trim() === "";
}

// ---- pre-flight: refuse if any target already carries a diff ---------------
Object.entries(TARGETS).forEach(function ([name, file]) {
  if (!gitDiffEmpty(file)) {
    console.error("REFUSING TO RUN: " + name + " (" + path.relative(REPO, file) + ") already carries a git diff.");
    process.exit(2);
  }
});

const originals = {};
Object.entries(TARGETS).forEach(function ([name, file]) {
  originals[name] = fs.readFileSync(file);
});

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

function restore(name) {
  fs.writeFileSync(TARGETS[name], originals[name]);
  const now = sha256(fs.readFileSync(TARGETS[name]));
  const want = sha256(originals[name]);
  if (now !== want) {
    console.error("RESTORE FAILED for " + name + ": sha256 mismatch after write-back.");
    process.exit(3);
  }
  if (!gitDiffEmpty(TARGETS[name])) {
    console.error("RESTORE FAILED for " + name + ": git diff not empty after write-back.");
    process.exit(3);
  }
}

let allCaught = true;

// ---- baseline: confirm checker starts clean --------------------------------
console.log("=== BASELINE ===");
const baseline = runChecker();
console.log("exit=" + baseline.code);
if (baseline.code !== 0) {
  console.log(baseline.out);
  console.error("Checker did not start clean. Aborting before any injection.");
  process.exit(4);
}
console.log("Baseline clean (exit 0). Proceeding.\n");

// ---- INJECTION 1: RULE 2, switch page app card removed ---------------------
console.log("=== INJECTION 1: RULE 2 (switch pages) - remove the app card ===");
{
  const src = originals.switchPage.toString("utf8");
  const cardStart = src.indexOf('<div class="app-card">');
  if (cardStart === -1) { console.error("Could not find app-card block."); process.exit(5); }
  // Find the matching closing </div> for this card by a simple balanced scan.
  let depth = 0, i = cardStart, end = -1;
  const divOpen = /<div\b/g, divClose = /<\/div>/g;
  // Simple approach: scan tag by tag from cardStart.
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = cardStart;
  let m;
  while ((m = tagRe.exec(src))) {
    if (m[0].startsWith("<div")) depth++;
    else depth--;
    if (depth === 0) { end = m.index + m[0].length; break; }
  }
  if (end === -1) { console.error("Could not find end of app-card block."); process.exit(5); }
  const mutated = src.slice(0, cardStart) + src.slice(end);
  if (mutated === src) { console.error("Mutation had no effect (INJECTION 1)."); process.exit(5); }
  fs.writeFileSync(TARGETS.switchPage, mutated, "utf8");
  const result = runChecker();
  console.log("exit=" + result.code);
  const hit = result.out.split("\n").filter(function (l) { return l.includes("switch pages") && l.includes("fishlocks-ainsdale"); });
  hit.forEach(function (l) { console.log("  " + l.trim()); });
  restore("switchPage");
  const caught = result.code !== 0 && hit.length > 0;
  console.log(caught ? "CAUGHT\n" : "NOT CAUGHT (unexpected)\n");
  allCaught = allCaught && caught;
}

// ---- INJECTION 2: RULE 3, landing page app sentence reworded ---------------
console.log("=== INJECTION 2: RULE 3 (landing pages) - reword the app sentence ===");
{
  const src = originals.landingPage.toString("utf8");
  const needle = "Manage everything in the free RB Healthcare Pharmacy app.";
  if (!src.includes(needle)) { console.error("Could not find the app sentence to reword."); process.exit(5); }
  const mutated = src.replace(needle, "You can also do this using our online tools.");
  fs.writeFileSync(TARGETS.landingPage, mutated, "utf8");
  const result = runChecker();
  console.log("exit=" + result.code);
  const hit = result.out.split("\n").filter(function (l) { return l.includes("landing pages") && l.includes("fishlocks-ainsdale"); });
  hit.forEach(function (l) { console.log("  " + l.trim()); });
  restore("landingPage");
  const caught = result.code !== 0 && hit.length > 0;
  console.log(caught ? "CAUGHT\n" : "NOT CAUGHT (unexpected)\n");
  allCaught = allCaught && caught;
}

// ---- INJECTION 3: RULE 4, app mention spliced into a service-family page ---
console.log("=== INJECTION 3: RULE 4 (absence elsewhere) - app mention on the PF overview page ===");
{
  const src = originals.overviewPage.toString("utf8");
  const needle = "Free NHS treatment for seven common conditions, with no GP appointment needed.";
  // fall back: just splice after <body if the exact sentence differs
  let mutated;
  if (src.includes(needle)) {
    mutated = src.replace(needle, needle + " You can also manage this via the RB Healthcare Pharmacy app.");
  } else {
    const bodyIdx = src.indexOf("<body");
    const gt = src.indexOf(">", bodyIdx);
    mutated = src.slice(0, gt + 1) + "<p>You can also manage this via the RB Healthcare Pharmacy app.</p>" + src.slice(gt + 1);
  }
  if (mutated === src) { console.error("Mutation had no effect (INJECTION 3)."); process.exit(5); }
  fs.writeFileSync(TARGETS.overviewPage, mutated, "utf8");
  const result = runChecker();
  console.log("exit=" + result.code);
  const hit = result.out.split("\n").filter(function (l) { return l.includes("absence elsewhere") && l.includes("pharmacy-first-fishlocks-ainsdale"); });
  hit.forEach(function (l) { console.log("  " + l.trim()); });
  restore("overviewPage");
  const caught = result.code !== 0 && hit.length > 0;
  console.log(caught ? "CAUGHT\n" : "NOT CAUGHT (unexpected)\n");
  allCaught = allCaught && caught;
}

// ---- INJECTION 4: RULE 5, wrong app name on the switch page ----------------
console.log("=== INJECTION 4: RULE 5 (one name) - drop \"Pharmacy\" from the app name ===");
{
  const src = originals.switchPage.toString("utf8");
  const needle = "RB Healthcare Pharmacy app";
  if (!src.includes(needle)) { console.error("Could not find canonical app name on switch page."); process.exit(5); }
  const mutated = src.replace(needle, "RB Healthcare app");
  fs.writeFileSync(TARGETS.switchPage, mutated, "utf8");
  const result = runChecker();
  console.log("exit=" + result.code);
  const hit = result.out.split("\n").filter(function (l) { return l.includes("one name") && l.includes("fishlocks-ainsdale"); });
  hit.forEach(function (l) { console.log("  " + l.trim()); });
  restore("switchPage");
  const caught = result.code !== 0 && hit.length > 0;
  console.log(caught ? "CAUGHT\n" : "NOT CAUGHT (unexpected)\n");
  allCaught = allCaught && caught;
}

// ---- INJECTION 5: RULE 8e, GBP pack app sentence removed -------------------
console.log("=== INJECTION 5: RULE 8e (GBP pack positive) - remove the app sentence from the pack ===");
{
  const src = originals.pack.toString("utf8");
  const needle = "You can also manage\nrepeats through our app. Pop in and speak to the team - real people, not a\ncall centre.";
  let mutated;
  if (src.includes(needle)) {
    mutated = src.replace(needle, "Pop in and speak to the team - real people, not a\ncall centre.");
  } else {
    // fall back to a plain-text substring match ignoring the exact line wrap
    const plain = src.replace(/\r\n/g, "\n");
    const idx = plain.search(/You can also manage\s+repeats through our app\.\s*/);
    if (idx === -1) { console.error("Could not find the app sentence in the pack."); process.exit(5); }
    mutated = plain.replace(/You can also manage\s+repeats through our app\.\s*/, "");
  }
  if (mutated === src.replace(/\r\n/g, "\n") || mutated === src) {
    // still attempt direct write if genuinely different from original
  }
  fs.writeFileSync(TARGETS.pack, mutated, "utf8");
  const result = runChecker();
  console.log("exit=" + result.code);
  const hit = result.out.split("\n").filter(function (l) { return l.includes("gbp packs") && l.includes("fishlocks-ainsdale.md"); });
  hit.forEach(function (l) { console.log("  " + l.trim()); });
  restore("pack");
  const caught = result.code !== 0 && hit.length > 0;
  console.log(caught ? "CAUGHT\n" : "NOT CAUGHT (unexpected)\n");
  allCaught = allCaught && caught;
}

// ---- final re-confirmation ---------------------------------------------------
console.log("=== FINAL STATE ===");
Object.entries(TARGETS).forEach(function ([name, file]) {
  const now = sha256(fs.readFileSync(file));
  const want = sha256(originals[name]);
  const ok = now === want && gitDiffEmpty(file);
  console.log("  " + name + ": " + (ok ? "byte-identical, git-clean" : "MISMATCH"));
  if (!ok) allCaught = false;
});

const finalCheck = runChecker();
console.log("\nFinal check-app-membership.js re-run: exit=" + finalCheck.code + (finalCheck.code === 0 ? " (clean)" : " (UNEXPECTED FAILURE)"));

console.log("\n" + (allCaught && finalCheck.code === 0 ? "ALL 5 INJECTIONS CAUGHT, ALL FILES RESTORED CLEAN." : "FAILURE: see above."));
process.exit(allCaught && finalCheck.code === 0 ? 0 : 1);
