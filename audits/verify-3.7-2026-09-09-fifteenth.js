// Independent extraction for item 3.7 (Smartts Chemist, Bootle), fifteenth
// quality pass, 2026-09-09. Shares no code with tools/check-app-membership.js
// or any prior pass's script. Proves Smartts's own app-membership state by
// reading branches.json and the pages directly, from scratch.
//
// Scope: Smartts Bootle is one of only four hasApp:true branches, and sits
// directly beside SK Chemists Bootle (hasApp:false) in branches.json and in
// the same town - the exact adjacent-record danger case check-app-membership.js
// was written to guard. Fourteen prior passes on this item never proved that
// checker against Smartts by injection at all (confirmed by `grep -c smartts
// -i tools/check-app-membership.js` returning 0 before this pass).
//
// Run: node verify-3.7-2026-09-09-fifteenth.js <repo-root>
const fs = require("fs");
const path = require("path");

const REPO = process.argv[2] || ".";
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const smartts = data.branches.find(function (b) { return b.id === "smartts_bootle"; });
const sk = data.branches.find(function (b) {
  return b.brandLabel === "SK Chemists" && b.seoTown === "Bootle";
});

if (!smartts) { console.error("smartts_bootle not found in branches.json"); process.exit(2); }

console.log("Smartts Chemist Bootle: hasApp =", smartts.hasApp, "(expect true)");
if (sk) console.log("SK Chemists Bootle (adjacent record): hasApp =", sk.hasApp, "(expect false), id=" + sk.id);

var checks = 0, flags = 0;
function check(cond, label) {
  checks++;
  if (!cond) { flags++; console.log("  FLAG:", label); }
}

check(smartts.hasApp === true, "smartts_bootle.hasApp is not literally true");
if (sk) check(sk.hasApp === false, "SK Chemists Bootle hasApp is not literally false");

var switchFile = path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-smartts-bootle.html");
var switchSrc = fs.readFileSync(switchFile, "utf8");
check(/class="app-card"/.test(switchSrc), "switch page has no app-card element");
check(/Manage your prescriptions more easily through the RB Healthcare Pharmacy app\./.test(switchSrc),
  "switch page app-copy line does not read the canonical sentence");
check((switchSrc.match(/https:\/\/apps\.apple\.com[^"']+/g) || []).length === 1,
  "switch page does not carry exactly one Apple App Store link");
check((switchSrc.match(/https:\/\/play\.google\.com[^"']+/g) || []).length === 1,
  "switch page does not carry exactly one Google Play link");

var serviceDir = path.join(REPO, "modules", "service", "pages");
var smarttsServicePages = fs.readdirSync(serviceDir).filter(function (f) {
  return f.endsWith("-smartts-bootle.html");
});
check(smarttsServicePages.length === 11, "expected 11 non-switch Smartts service pages, found " + smarttsServicePages.length);
smarttsServicePages.forEach(function (f) {
  var src = fs.readFileSync(path.join(serviceDir, f), "utf8");
  check(!/RB Healthcare(?: Pharmacy)? app/i.test(src), f + " mentions the app outside the switch/landing families");
  check(!/apps\.apple\.com|play\.google\.com/i.test(src), f + " carries a store URL outside the switch/landing families");
});

var landingDir = path.join(REPO, "modules", "branch", "pages");
var smarttsLanding = fs.existsSync(landingDir)
  ? fs.readdirSync(landingDir).filter(function (f) { return f.indexOf("smartts") !== -1; })
  : [];
check(smarttsLanding.length === 0, "expected no Smartts branch landing page, found " + smarttsLanding.length);

["INDEX.md", "SEO.md"].forEach(function (name) {
  var file = path.join(REPO, "modules", "switch", "pages", name);
  var src = fs.readFileSync(file, "utf8");
  var smarttsMarked = new RegExp("## Smartts Chemist.{1,3}Bootle\\s+\\*\\(app member\\)\\*").test(src);
  var skMarked = new RegExp("## SK Chemists.{1,3}Bootle\\s+\\*\\(app member\\)\\*").test(src);
  check(smarttsMarked, name + " does not mark Smartts Chemist, Bootle as an app member");
  check(!skMarked, name + " incorrectly marks SK Chemists, Bootle as an app member");
});

console.log("");
console.log(checks + " checks, " + flags + " flags");
process.exit(flags ? 1 : 0);
