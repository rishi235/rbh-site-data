#!/usr/bin/env node
// Item 4.4 (Scorah Chemists Bramhall GBP pack) twenty-second quality pass.
// Fresh angle: check-gbp-packs.js's hours-are-DAYS rule family (the three
// day-membership legs, plus the day-time PAIRING rule) has never been proven
// by fault injection against scorah-bramhall.md specifically in twenty-one
// prior passes, despite the checker's own source comment (tools/check-gbp-packs.js,
// around line 2718) naming Scorah Bramhall as one of six branches structurally
// exposed to the pairing fault (a time that differs between days: this branch's
// weekday 9:00am-6:00pm vs Saturday 9:00am-1:00pm). check-opening-hours.js was
// proven against Scorah's generated PAGES on item 3.2's thirteenth pass, but
// that is a different checker reading a different surface (the pages, not the
// GBP pack's own hours line) and does not touch this rule at all.
//
// Four injections against gbp-packs/scorah-bramhall.md's own "- Hours:" line,
// each restored and sha256-confirmed before the next, plus one control.

const fs = require("fs");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = "/sessions/trusting-laughing-cannon/mnt/rbh-site-data";
const PACK = `${REPO}/gbp-packs/scorah-bramhall.md`;

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-gbp-packs.js"], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}
function runFullSuite() {
  const files = fs.readdirSync(`${REPO}/tools`).filter(
    (f) => f.startsWith("check-") && f.endsWith(".js") && f !== "check-live-hours.js"
  );
  const results = [];
  for (const f of files) {
    try {
      execFileSync("node", [`tools/${f}`], { cwd: REPO, encoding: "utf8" });
      results.push([f, 0]);
    } catch (e) {
      results.push([f, e.status]);
    }
  }
  return results;
}

const log = [];
function say(s) { log.push(s); console.log(s); }

const baselineSha = sha256(PACK);
say(`BASELINE sha256: ${baselineSha}`);
const baselineContent = fs.readFileSync(PACK, "utf8");
const baselineSuite = runFullSuite();
const baselineFailures = baselineSuite.filter(([, code]) => code !== 0);
say(`BASELINE full suite: ${baselineSuite.length} checkers, ${baselineFailures.length} non-zero exits: ${JSON.stringify(baselineFailures)}`);

function restore() {
  fs.writeFileSync(PACK, baselineContent);
  const s = sha256(PACK);
  if (s !== baselineSha) throw new Error(`RESTORE FAILED, sha256 ${s} != baseline ${baselineSha}`);
  say(`  restored, sha256 confirmed ${s}`);
}

function injectAndCheck(label, mutate, expectSubstr) {
  say(`\n--- INJECTION: ${label} ---`);
  let content = baselineContent;
  content = mutate(content);
  if (content === baselineContent) throw new Error(`mutate() for "${label}" did not change the file - test is not actually exercising anything`);
  fs.writeFileSync(PACK, content);
  const { code, out } = runChecker();
  const fired = out.includes(expectSubstr);
  say(`  exit code: ${code}`);
  say(`  expected substring found: ${fired}`);
  if (!fired) {
    say(`  FULL OUTPUT (for diagnosis):\n${out}`);
  } else {
    const hitLines = out.split("\n").filter((l) => l.includes("scorah-bramhall") || l.includes(expectSubstr));
    say(`  matching output line(s):\n    ${hitLines.join("\n    ")}`);
  }
  restore();
  return fired;
}

const results = {};

// 1. DAY-membership leg: a day branches.json holds OPEN but the hours line
//    does not claim as open. Drop "Saturday" from the Saturday segment,
//    leaving its hours stated but unattributed to any day name.
results.dayOpenNotStated = injectAndCheck(
  "day rule leg 2 (Saturday open in data, not claimed open)",
  (c) => c.replace(
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed",
    "- Hours: Monday to Friday 9:00am to 6:00pm, 9:00am to 1:00pm,\n  Sunday closed"
  ),
  "does not state Saturday as open"
);

// 2. DAY-membership leg: a day branches.json holds CLOSED but the hours line
//    neither claims it open nor claims it closed. Drop the "Sunday closed"
//    clause entirely.
results.dayClosedNotStated = injectAndCheck(
  "day rule leg 3 (Sunday closed in data, not stated at all)",
  (c) => c.replace(
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed",
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm"
  ),
  "does not state Sunday as closed"
);

// 3. DAY-membership leg: a day claimed OPEN that the data holds CLOSED.
//    Claim Sunday open with invented hours instead of closed.
results.dayOpenButDataClosed = injectAndCheck(
  "day rule leg 1 (Sunday claimed open, data holds it closed)",
  (c) => c.replace(
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed",
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday 10:00am to 4:00pm"
  ),
  "the branch is open on Sunday"
);

// 4. PAIRING rule: swap the weekday closing time and the Saturday closing
//    time between segments. Set of times unchanged (9:00am, 1:00pm, 6:00pm
//    all still appear somewhere), set of days unchanged (Mon-Fri, Sat, Sun
//    all still named correctly), so both DAY rules and the plain clock-time
//    rule are satisfied in both directions - only the day-to-time PAIRING
//    rule can catch this. This is exactly the fault class item 4.14 found
//    live at Gordon Short Crosby on 2026-08-12 (weekday/Saturday closing
//    times swapped), reproduced here for the first time against Bramhall's
//    own pack.
{
  let content = baselineContent.replace(
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed",
    "- Hours: Monday to Friday 9:00am to 1:00pm, Saturday 9:00am to 6:00pm,\n  Sunday closed"
  );
  if (content === baselineContent) throw new Error("pairing mutate() no-op");
  fs.writeFileSync(PACK, content);
  const { code, out } = runChecker();
  const lines = out.split("\n").filter((l) => /scorah-bramhall/i.test(l));
  say(`\n--- INJECTION: pairing rule (weekday/Saturday closing times swapped) ---`);
  say(`  exit code: ${code}`);
  say(`  matching output lines:\n    ${lines.join("\n    ")}`);
  restore();
  results.pairingSwap = lines.some((l) => /fail/i.test(l) && /(wrong day|bound|pair|does not match|swap)/i.test(l)) || lines.some((l) => /FAIL/.test(l));
}

// CONTROL: an honest paraphrase of the same line that changes no day and no
// time-to-day binding, to prove the rule family is not over-sensitive.
{
  say(`\n--- CONTROL: honest paraphrase (no day/time change) ---`);
  const content = baselineContent.replace(
    "- Hours: Monday to Friday 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed",
    "- Hours: Mon to Fri 9:00am to 6:00pm, Saturday 9:00am to 1:00pm,\n  Sunday closed"
  );
  if (content === baselineContent) {
    say("  control mutate() no-op, skipping");
    results.control = null;
  } else {
    fs.writeFileSync(PACK, content);
    const { code, out } = runChecker();
    const dayLines = out.split("\n").filter((l) => /scorah-bramhall/i.test(l) && /(hours|day|pair)/i.test(l));
    say(`  exit code: ${code}`);
    say(`  hours/day-related lines mentioning scorah-bramhall: ${JSON.stringify(dayLines)}`);
    restore();
    results.control = { code, clean: dayLines.length === 0 };
  }
}

say(`\n=== FINAL RESTORE VERIFICATION ===`);
const finalSha = sha256(PACK);
say(`Final sha256: ${finalSha} (matches baseline: ${finalSha === baselineSha})`);

say(`\n=== FINAL FULL SUITE RE-RUN ===`);
const finalSuite = runFullSuite();
const finalFailures = finalSuite.filter(([, code]) => code !== 0);
say(`Final full suite: ${finalSuite.length} checkers, ${finalFailures.length} non-zero exits: ${JSON.stringify(finalFailures)}`);

say(`\n=== SUMMARY ===`);
say(JSON.stringify(results, null, 2));

const allCaught = results.dayOpenNotStated && results.dayClosedNotStated && results.dayOpenButDataClosed && results.pairingSwap;
say(`\nAll four fault-injections caught on first attempt: ${allCaught}`);
say(`Final sha256 matches baseline: ${finalSha === baselineSha}`);
say(`Final full suite clean (matches baseline failure count ${baselineFailures.length}): ${finalFailures.length === baselineFailures.length}`);

fs.writeFileSync(`${REPO}/audits/verify-4.4-2026-09-18-twentysecond-output.txt`, log.join("\n") + "\n");
say(`\nLog written to audits/verify-4.4-2026-09-18-twentysecond-output.txt`);
