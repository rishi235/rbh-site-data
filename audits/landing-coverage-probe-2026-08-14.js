/*
  Item 5.2 quality pass, 2026-08-14 (199th run).

  Independent instrument. Imports nothing from tools/. Answers two questions.

  QUESTION 1. WHICH of the repo's checkers actually READ the six item 5.2
  branch landing pages, and their two paste sheets, when they run?
  Method: spawn each tools/check-*.js under a --require preload that hooks
  fs.readFileSync / fs.readFile / fs.promises.readFile and records every
  absolute path opened. No checker is modified.

  QUESTION 2. WHAT age-shaped strings appear in the READABLE text of those six
  pages at all? This is the safety measurement taken BEFORE rule 9 of
  check-pharmacy-first-eligibility.js was widened to read them: if an opening
  time, postcode, phone number or street number matched the age pattern, the
  widening would have failed something that was passing. It does not: the only
  hit on any page is the blood pressure cohort itself.

  The age pattern and the unit guard below are COPIES of the two in that
  checker, deliberately duplicated rather than imported, so this probe can
  disagree with it. If they ever drift, that is a finding, not a bug here.

  Exits 1 if any age-shaped string on a landing page is something other than
  the pinned NHS blood pressure cohort.

  Usage: node audits/landing-coverage-probe-2026-08-14.js
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const LANDING_DIR = path.join(ROOT, "modules", "branch", "pages");

const TARGETS = fs.readdirSync(LANDING_DIR)
  .filter(f => /\.html$/.test(f) || f === "INDEX.md" || f === "SEO.md")
  .map(f => path.join(LANDING_DIR, f));

const HOOK = path.join(__dirname, "_readhook-2026-08-14.js");
fs.writeFileSync(HOOK, `
const fs = require("fs");
const path = require("path");
const seen = new Set();
function note(p) { try { seen.add(path.resolve(String(p))); } catch (e) {} }
const _rfs = fs.readFileSync; fs.readFileSync = function (p) { note(p); return _rfs.apply(fs, arguments); };
const _rf = fs.readFile; fs.readFile = function (p) { note(p); return _rf.apply(fs, arguments); };
if (fs.promises && fs.promises.readFile) {
  const _prf = fs.promises.readFile;
  fs.promises.readFile = function (p) { note(p); return _prf.apply(fs.promises, arguments); };
}
process.on("exit", function () {
  try { fs.writeFileSync(process.env.RBH_PROBE_OUT, Array.from(seen).join("\\n")); } catch (e) {}
});
`);

const checkers = fs.readdirSync(path.join(ROOT, "tools"))
  .filter(f => /^check-.*\.js$/.test(f)).sort();

const OUT = path.join(__dirname, "_probe-out-2026-08-14.txt");
const rows = [];

for (const c of checkers) {
  try { fs.unlinkSync(OUT); } catch (e) {}
  let exit = 0;
  try {
    execFileSync(process.execPath, ["--require", HOOK, path.join(ROOT, "tools", c)],
      { cwd: ROOT, stdio: "ignore", env: Object.assign({}, process.env, { RBH_PROBE_OUT: OUT }) });
  } catch (e) { exit = e.status == null ? 1 : e.status; }
  let read = [];
  try { read = fs.readFileSync(OUT, "utf8").split("\n").filter(Boolean); } catch (e) {}
  const set = new Set(read);
  const hit = TARGETS.filter(t => set.has(t));
  rows.push({ checker: c, exit, hitCount: hit.length, hits: hit.map(h => path.basename(h)) });
}

try { fs.unlinkSync(OUT); } catch (e) {}
try { fs.unlinkSync(HOOK); } catch (e) {}

const total = TARGETS.length;
console.log("TARGETS (" + total + "): " + TARGETS.map(t => path.basename(t)).join(", "));
console.log("");
const all = rows.filter(r => r.hitCount === total);
const some = rows.filter(r => r.hitCount > 0 && r.hitCount < total);
const none = rows.filter(r => r.hitCount === 0);
console.log("READS EVERY TARGET (" + all.length + "): " + all.map(r => r.checker).join(", "));
console.log("");
console.log("READS SOME (" + some.length + "):");
some.forEach(r => console.log("  " + r.checker + "  [" + r.hitCount + "/" + total + "] " + r.hits.join(", ")));
console.log("");
console.log("READS NONE (" + none.length + "): " + none.map(r => r.checker).join(", "));
const bad = rows.filter(r => r.exit !== 0);
if (bad.length) console.log("\nNON-ZERO EXITS: " + bad.map(r => r.checker + "(" + r.exit + ")").join(", "));

// --- QUESTION 2: every age-shaped string in the readable text ---------------

const AGE = /(?:aged|age)\s+(\d{1,2})(?:\s*(?:to|-|and)\s*(\d{1,2}))?|\bunder\s+(\d{1,2})\b|\bover\s+(\d{1,2})\b/gi;
const UNIT_AFTER = /^\s*(?:second|minute|hour|day|week|month|year|character|word|photo|shot|mile|metre|meter|item|patient|prescription)s?\b/i;
const PINNED = /\baged\s+40\s+(?:and|or)\s+over\b/i;

function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

console.log("\n--- age-shaped strings in the readable text of each landing page ---");
let offenders = 0;
let hits = 0;
TARGETS.filter(t => /\.html$/.test(t)).forEach(t => {
  visible(fs.readFileSync(t, "utf8")).split(/[.!?]\s+/)
    .map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean)
    .forEach(seg => {
      AGE.lastIndex = 0;
      let m;
      while ((m = AGE.exec(seg)) !== null) {
        if (UNIT_AFTER.test(seg.slice(m.index + m[0].length))) continue;
        hits++;
        const ok = PINNED.test(m[0]) || PINNED.test(seg);
        if (!ok) offenders++;
        console.log("  " + (ok ? "PINNED  " : "OFF-PIN ") + path.basename(t) +
          '  "' + m[0] + '"  ::  ' + seg.slice(0, 100));
      }
    });
});
console.log("  " + hits + " age-shaped string(s) across " +
  TARGETS.filter(t => /\.html$/.test(t)).length + " pages, " + offenders + " off-pin.");
if (offenders) process.exit(1);
