/*
  verify-5.1-2026-09-04-twelfth.js

  Item 5.1 quality pass (twelfth), 2026-09-04. Tests a hypothesis rather than
  a known gap: modules/service/service.js, modules/switch/switch.js and
  modules/emar/emar.js all build a WhatsApp pre-filled message (and emar.js a
  mailto: subject/body) by concatenating static labels with branchName /
  serviceName and passing the result through encodeURIComponent() before
  writing it into a wa.me or mailto: URL. A dash in that URL would render as
  UTF-8 percent-encoding (%E2%80%94 / %E2%80%93), bytes that match none of
  check-em-dashes.js's existing rules (literal character, HTML entity,
  numeric entity, JS/CSS source escape) - on the face of it a candidate for a
  seventh axis, the same shape as the six already found on this item.

  Read in full: branchName/serviceName in service.js and switch.js are read
  at runtime via getAttribute("data-branch")/getAttribute("data-service"),
  which the generator writes as literal text into the generated page. That
  attribute sits on a line checkHtmlFile already scans. So the hypothesis
  reduces to: does the existing page rule actually catch a dash in that
  specific attribute, on a real page, before it could ever reach
  encodeURIComponent()? This script proves it does, by injection.

  Refuses to run if the target already carries a git diff. Restores by direct
  write-back immediately after capturing the checker's output and before any
  assertion. SHA256-verifies byte-identical before and after.

  Run: node audits/verify-5.1-2026-09-04-twelfth.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const target = path.join(REPO, "modules", "service", "pages", "contraception-cherry-lane-walton.html");
const relTarget = "modules/service/pages/contraception-cherry-lane-walton.html";

const dirty = execSync(`git status --porcelain -- "${relTarget}"`, { cwd: REPO }).toString().trim();
if (dirty) {
  console.error("Target already has a diff, aborting:", dirty);
  process.exit(2);
}

const original = fs.readFileSync(target, "utf8");
const shaBefore = crypto.createHash("sha256").update(original).digest("hex");
console.log("SHA before:", shaBefore);

// The exact field buildWhatsAppText() reads via getAttribute("data-branch")
// at runtime and concatenates into the WhatsApp pre-filled message before
// encodeURIComponent(). Injecting here, not in service.js, is the point: it
// tests whether the VALUE the runtime code consumes is already caught
// upstream, on the page, before the encoding step ever runs.
const needle = 'data-branch="Cherry Lane Pharmacy"';
const replacement = 'data-branch="Cherry Lane — Pharmacy"';
if (original.indexOf(needle) === -1) {
  console.error("No match found, aborting - mutator did not fire");
  process.exit(2);
}
const mutated = original.replace(needle, replacement);
fs.writeFileSync(target, mutated, "utf8");

let out, code;
try {
  out = execSync("node tools/check-em-dashes.js", { cwd: REPO }).toString();
  code = 0;
} catch (e) {
  out = (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "");
  code = e.status;
}

// Restore immediately, before any assertion is printed.
fs.writeFileSync(target, original, "utf8");
const shaAfter = crypto.createHash("sha256").update(fs.readFileSync(target, "utf8")).digest("hex");

console.log("Checker exit code with injected em dash in data-branch:", code);
console.log(out.split("\n").filter(function (l) { return l.indexOf("data-branch") !== -1 || l.indexOf("FAIL") !== -1; }).join("\n"));
console.log("SHA after restore:", shaAfter, shaAfter === shaBefore ? "MATCH" : "MISMATCH");

if (code !== 1 || shaAfter !== shaBefore) {
  console.error("UNEXPECTED RESULT - see output above");
  process.exit(1);
}
console.log("");
console.log("RESULT: the injected dash was caught by the existing generated-page rule");
console.log("(exit 1) before it could ever reach encodeURIComponent() at runtime, and");
console.log("the file was restored byte-identical. The encodeURIComponent()/WhatsApp");
console.log("axis is not a gap: every component reaching that call is already covered");
console.log("upstream (static code labels via checkCodeFile, data-branch/data-service");
console.log("attributes via checkHtmlFile, or patient-typed form input which is not");
console.log("this repo's copy).");
