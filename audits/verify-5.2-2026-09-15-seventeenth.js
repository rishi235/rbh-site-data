// Item 5.2, seventeenth quality pass, 2026-09-15 (unattended run).
// Fresh angle: tools/check-em-dashes.js has never been named at all across
// this item's sixteen prior passes, despite PAGE_DIRS in that checker
// explicitly including modules/branch/pages (item 5.2's own four pages).
// Proves it by direct injection against pharmacy-scorah-hazel-grove.html,
// a page never used as an injection target in this item's history (prior
// targets were pharmacy-mccanns-aigburth.html on passes 14-16).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");
const TARGET = path.join(REPO, "modules", "branch", "pages", "pharmacy-scorah-hazel-grove.html");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitStatusPorcelain() {
  try {
    return execFileSync("git", ["status", "--porcelain", "--", "modules", "core", "branches.json", "gbp-packs"], { cwd: REPO }).toString();
  } catch (e) {
    return "ERROR: " + e.message;
  }
}

const KNOWN_PREEXISTING_UNTRACKED = new Set([
  "?? gbp-packs/.fuse_hidden0000000400000001",
  "?? modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak"
]);
const preStatus = gitStatusPorcelain();
const preStatusLines = preStatus.split("\n").map(l => l.trim()).filter(Boolean);
const unexpectedPre = preStatusLines.filter(l => !KNOWN_PREEXISTING_UNTRACKED.has(l));
if (unexpectedPre.length) {
  console.error("REFUSING TO RUN: tree not clean before injection (unexpected):\n" + unexpectedPre.join("\n"));
  process.exit(1);
}
console.log("Pre-existing untracked debris confirmed (known, not touched):", preStatusLines.join(" | ") || "(none)");

const original = fs.readFileSync(TARGET);
const originalSha = sha256(original);
console.log("Target:", TARGET);
console.log("Original sha256:", originalSha);
console.log("Original size:", original.length);

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-em-dashes.js"], { cwd: REPO }).toString();
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "") };
  }
}

function restore() {
  fs.writeFileSync(TARGET, original);
  const nowSha = sha256(fs.readFileSync(TARGET));
  if (nowSha !== originalSha) {
    console.error("RESTORE FAILED, sha mismatch:", nowSha, "expected", originalSha);
    process.exit(2);
  }
  console.log("Restored OK, sha256 reconfirmed:", nowSha);
}

// Baseline: checker should be clean before any injection
const baseline = runChecker();
console.log("\n=== BASELINE (before injection) ===");
console.log("exit code:", baseline.code);
console.log(baseline.out.split("\n").slice(-6).join("\n"));

// INJECTION 1: literal em dash (U+2014) into the hero-sub visible paragraph
const origText = original.toString("utf8");
const needle = "Call in, phone us or book online.";
if (!origText.includes(needle)) {
  console.error("Anchor text not found, aborting before any write.");
  process.exit(3);
}
const injected1 = origText.replace(needle, "Call in — phone us or book online.");
fs.writeFileSync(TARGET, injected1, "utf8");
console.log("\n=== INJECTION 1: literal em dash (\\u2014) in hero-sub paragraph ===");
const result1 = runChecker();
console.log("exit code:", result1.code);
console.log(result1.out.split("\n").filter(l => l.toLowerCase().includes("dash") || l.includes("scorah-hazel-grove") || l.includes("FAIL")).join("\n") || result1.out.split("\n").slice(-10).join("\n"));
restore();

// INJECTION 2: HTML entity &mdash; in the same location
const injected2 = origText.replace(needle, "Call in &mdash; phone us or book online.");
fs.writeFileSync(TARGET, injected2, "utf8");
console.log("\n=== INJECTION 2: &mdash; entity in hero-sub paragraph ===");
const result2 = runChecker();
console.log("exit code:", result2.code);
console.log(result2.out.split("\n").filter(l => l.toLowerCase().includes("dash") || l.includes("scorah-hazel-grove") || l.includes("FAIL")).join("\n") || result2.out.split("\n").slice(-10).join("\n"));
restore();

// INJECTION 3 (control): benign rewording with a standard hyphen, should pass clean
const injected3 = origText.replace(needle, "Call in, phone us, or book online - whichever suits you.");
fs.writeFileSync(TARGET, injected3, "utf8");
console.log("\n=== INJECTION 3 (control): benign hyphenated rewording, should stay clean ===");
const result3 = runChecker();
console.log("exit code:", result3.code);
console.log(result3.out.split("\n").slice(-4).join("\n"));
restore();

const finalStatus = gitStatusPorcelain();
const finalStatusLines = finalStatus.split("\n").map(l => l.trim()).filter(Boolean);
const unexpectedFinal = finalStatusLines.filter(l => !KNOWN_PREEXISTING_UNTRACKED.has(l));
console.log("\n=== FINAL git status (modules/core/branches.json/gbp-packs) ===");
console.log(unexpectedFinal.length === 0 ? "(clean, only known pre-existing debris remains)" : "UNEXPECTED: " + unexpectedFinal.join(" | "));

console.log("\n=== SUMMARY ===");
console.log("Injection 1 (literal em dash) caught:", result1.code !== 0);
console.log("Injection 2 (&mdash; entity) caught:", result2.code !== 0);
console.log("Injection 3 (control, hyphen only) stayed clean:", result3.code === 0);
