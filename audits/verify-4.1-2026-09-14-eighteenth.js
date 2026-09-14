// Item 4.1 quality pass (eighteenth), 2026-09-14, unattended run.
// Proves the three check-gbp-packs.js rules never yet tested against
// gbp-packs/fishlocks-ainsdale.md across the item's first seventeen passes:
// the bank holiday special-hours paster-note rule (added item 4.5 pass,
// 2026-08-30), the lead-pricing rule and the body-image/social-proof rule
// (both compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md section 5/7 derived).
// Confirmed absent from this item's history by grep before writing this file
// (zero hits for "lead pricing", "body image", "bank holiday" in the item's
// own AGENT_WORKLIST.md paragraph range, 2026-09-14).
//
// Method: byte-copy restore (never git checkout, per the lesson recorded
// against the rule9-landing-negative-tests harness), sha256-reconfirmed
// identical before each next injection. Run directly against the tracked
// file; final restore reconfirmed byte-identical; full 36-checker suite
// re-run clean after.

const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");

const FILE = "gbp-packs/fishlocks-ainsdale.md";
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

const baseline = fs.readFileSync(FILE, "utf8");
const baselineSha = sha(FILE);
console.log("Baseline sha256:", baselineSha);
if (baselineSha !== "7592bad3e7a4ba0f50b7ef997b927eb65f52ac9e1ae1d6d97e63f6a9c2de3e30") {
  console.log("WARNING: baseline sha differs from the standing regression anchor recorded on prior passes.");
}

function restore() {
  fs.writeFileSync(FILE, baseline, "utf8");
  const s = sha(FILE);
  if (s !== baselineSha) throw new Error("restore failed, sha mismatch: " + s);
}

function runChecker() {
  try {
    execSync("node tools/check-gbp-packs.js", { encoding: "utf8", stdio: "pipe" });
    return { exit: 0, out: "" };
  } catch (e) {
    return { exit: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function fishlocksLines(out) {
  return out.split("\n").filter((l) => l.includes("fishlocks-ainsdale.md"));
}

console.log("\n=== INJECTION 1: bank holiday note removed from Notes for the paster ===");
{
  const text = baseline;
  const marker = "- Bank holiday special hours: while in the profile, open Google's special\n  hours and mark every remaining 2026 date in branches.json\n  bankHolidays.dates2026 as Closed. All RB Healthcare stores close on bank\n  holidays (Q79, confirmed by Rishi 2026-08-27; tradingPolicy \"closed\",\n  estate-wide, no branch exception). Google shows a bank holiday as Open\n  unless special hours say otherwise. The dates are deliberately not retyped\n  here so they cannot drift; read them from branches.json at paste time.\n  Added on the item 4.5 quality pass, 2026-08-30.\n";
  if (!text.includes(marker)) {
    console.log("MARKER NOT FOUND - pack wording has changed since this script was written, skipping injection 1");
  } else {
    fs.writeFileSync(FILE, text.replace(marker, ""), "utf8");
    const r = runChecker();
    console.log("exit:", r.exit);
    console.log(fishlocksLines(r.out).filter((l) => /bank holiday/i.test(l)).join("\n") || "(no matching FAIL line found)");
    restore();
    console.log("Restored, sha ok:", sha(FILE) === baselineSha);
  }
}

console.log("\n=== INJECTION 2: lead price added to Post C ===");
{
  const old = "medicines. Book your consultation today.";
  const text = baseline;
  if ((text.match(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length !== 1) {
    console.log("ANCHOR NOT UNIQUE - skipping injection 2");
  } else {
    fs.writeFileSync(FILE, text.replace(old, "medicines. Weight loss from just £99 a month. Book your consultation today."), "utf8");
    const r = runChecker();
    console.log("exit:", r.exit);
    console.log(fishlocksLines(r.out).filter((l) => /price|lead/i.test(l)).join("\n") || "(no matching FAIL line found)");
    restore();
    console.log("Restored, sha ok:", sha(FILE) === baselineSha);
  }
}

console.log("\n=== INJECTION 3: body-image pressure framing added to Post C ===");
{
  const old = "medicines. Book your consultation today.";
  const text = baseline;
  fs.writeFileSync(FILE, text.replace(old, "medicines. Don't let your weight hold you back any longer. Book your consultation today."), "utf8");
  const r = runChecker();
  console.log("exit:", r.exit);
  console.log(fishlocksLines(r.out).filter((l) => /body|hold you back/i.test(l)).join("\n") || "(no matching FAIL line found)");
  restore();
  console.log("Restored, sha ok:", sha(FILE) === baselineSha);
}

console.log("\n=== CONTROL: harmless bullet reorder in Notes for the paster, no content change ===");
{
  const oldBlock = "- Post buttons: if GBP only offers \"Learn more\", use it with the same links.\n- Check the four category names against what GBP's picker actually offers on\n  the day; pick the closest match.\n";
  const newBlock = "- Check the four category names against what GBP's picker actually offers on\n  the day; pick the closest match.\n- Post buttons: if GBP only offers \"Learn more\", use it with the same links.\n";
  const text = baseline;
  if (!text.includes(oldBlock)) {
    console.log("BLOCK NOT FOUND - skipping control");
  } else {
    fs.writeFileSync(FILE, text.replace(oldBlock, newBlock), "utf8");
    const r = runChecker();
    console.log("exit:", r.exit, "(expect 0)");
    console.log(fishlocksLines(r.out).filter((l) => l.includes("FAIL")).join("\n") || "(no FAIL lines, as expected)");
    restore();
    console.log("Restored, sha ok:", sha(FILE) === baselineSha);
  }
}

console.log("\n=== FINAL STATE ===");
console.log("Final sha256:", sha(FILE), "matches baseline:", sha(FILE) === baselineSha);
