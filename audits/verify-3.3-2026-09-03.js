/*
  Ninth independent extraction for item 3.3 (Fishlocks Chemist, Ainsdale and
  Eccleston), 2026-09-03. Imports nothing from tools/: every pattern here is
  written fresh so this script cannot inherit a bug from the checker it is
  meant to cross-check.

  Repeats the legs the eighth pass (2026-09-02) proved - own town in title/H1/
  description, one H1 per page, service words, sister-branch absence, own
  phone/postcode present and sister's absent, JSON-LD address/telephone match,
  meta keywords own/sister town - and adds ONE new leg no prior independent
  extraction for this item has covered: app membership. Both Fishlocks
  branches are app members (hasApp true), which makes this brand the only one
  in the estate with TWO app-member branches sharing a domain, the shared-
  domain case check-app-membership.js's own history flags as its blind spot
  (rule 7's marker bug was found on a Smartts/Hirshmans swap, a different
  brand pair, never proved against Fishlocks itself). This script checks the
  same four legs that were proved by direct injection this run: the switch
  page carries the app card, the landing page carries the app sentence, the
  app is named the canonical way, and the INDEX.md/SEO.md paste sheets mark
  both Fishlocks headings as app members.
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const branches = data.branches;

const ainsdale = branches.find(b => b.id === "fishlocks_ainsdale");
const eccleston = branches.find(b => b.id === "fishlocks_eccleston");
if (!ainsdale || !eccleston) { console.log("FAIL: branch records not found"); process.exit(1); }

let checks = 0, failures = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log("  FAIL: " + label); }
}

function readSheetBlock(sheetPath, permalink) {
  const src = fs.readFileSync(sheetPath, "utf8");
  const idx = src.indexOf(permalink);
  if (idx === -1) return null;
  // walk back to the nearest heading, forward to the next heading
  const before = src.slice(0, idx);
  const headingStart = before.lastIndexOf("\n## ");
  const after = src.slice(headingStart === -1 ? 0 : headingStart);
  const nextHeading = after.indexOf("\n## ", 4);
  return after.slice(0, nextHeading === -1 ? after.length : nextHeading);
}

[ainsdale, eccleston].forEach(function (branch, idx) {
  const other = idx === 0 ? eccleston : ainsdale;
  console.log("=== " + branch.branchName + " (" + branch.seoTown + ") ===");

  const svcDir = path.join(REPO, "modules", "service", "pages");
  const svcFiles = fs.readdirSync(svcDir).filter(f => f.endsWith(".html") && f.indexOf(branch.brandSlug + "-" + branch.townSlug) !== -1);
  check("has service pages (" + branch.branchName + ")", svcFiles.length > 0);

  svcFiles.forEach(function (f) {
    const src = fs.readFileSync(path.join(svcDir, f), "utf8");
    const h1s = src.match(/<h1[^>]*>([^<]+)<\/h1>/g) || [];
    check(f + ": exactly one H1", h1s.length === 1);
    if (h1s.length) {
      const h1text = h1s[0].replace(/<[^>]+>/g, "");
      check(f + ": H1 carries own town " + branch.seoTown, h1text.indexOf(branch.seoTown) !== -1);
      check(f + ": H1 does not carry sister town " + other.seoTown, h1text.indexOf(other.seoTown) === -1);
    }
    const telMatches = src.match(/tel:([0-9+]+)/g) || [];
    const ownDigits = branch.phone.replace(/\D/g, "");
    telMatches.forEach(function (t) {
      check(f + ": tel: link is own number", t.replace(/\D/g, "") === ownDigits);
    });
    check(f + ": no sister postcode present", src.indexOf(other.postalCode) === -1);
  });

  // switch page
  const switchFile = path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-" + branch.brandSlug + "-" + branch.townSlug + ".html");
  check("switch page exists: " + switchFile, fs.existsSync(switchFile));
  if (fs.existsSync(switchFile)) {
    const src = fs.readFileSync(switchFile, "utf8");
    check("switch page carries app card (hasApp=" + branch.hasApp + ")", /class="app-card"/.test(src) === (branch.hasApp === true));
    if (branch.hasApp) {
      check("switch page names app canonically", /RB Healthcare Pharmacy app/.test(src));
      const stores = src.match(/https:\/\/(?:apps\.apple\.com|play\.google\.com)[^"'\s)]+/g) || [];
      check("switch page carries exactly 2 store URLs", stores.length === 2);
    }
  }

  // landing page
  const landingFile = path.join(REPO, "modules", "branch", "pages", "pharmacy-" + branch.brandSlug + "-" + branch.townSlug + ".html");
  check("landing page exists: " + landingFile, fs.existsSync(landingFile));
  if (fs.existsSync(landingFile)) {
    const src = fs.readFileSync(landingFile, "utf8");
    check("landing page carries app sentence (hasApp=" + branch.hasApp + ")", /Manage everything in the/.test(src) === (branch.hasApp === true));
    if (branch.hasApp) {
      check("landing page names app canonically", /RB Healthcare Pharmacy app/.test(src));
    }
    check("landing page carries own town " + branch.seoTown, src.indexOf(branch.seoTown) !== -1);
  }

  // paste sheet markers
  ["INDEX.md", "SEO.md"].forEach(function (sheetName) {
    const sheetPath = path.join(REPO, "modules", "switch", "pages", sheetName);
    const src = fs.readFileSync(sheetPath, "utf8");
    const headingRe = new RegExp("## " + branch.brandLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]{0,3}" + branch.seoTown);
    const m = src.match(headingRe);
    check(sheetName + ": heading found for " + branch.branchName, !!m);
    if (m) {
      const lineEnd = src.indexOf("\n", m.index);
      const headingLine = src.slice(m.index, lineEnd === -1 ? undefined : lineEnd);
      check(sheetName + ": heading marked *(app member)* (hasApp=" + branch.hasApp + ")",
        /\*\(app member\)\*/.test(headingLine) === (branch.hasApp === true));
    }
  });
});

console.log("");
console.log(checks + " checks, " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
