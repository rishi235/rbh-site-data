/*
  verify-2.2-2026-09-06-ninth.js

  Item 2.2 (Fishlocks Ainsdale/Eccleston shared-domain branch landing pages),
  ninth quality pass. Eight prior passes had proved NAP, the SISTERLINK/
  OUTBOUND link targets (rules 8/9), the SISTERLABEL text (rule 11), the
  Pharmacy First cost claim, the WhatsApp-by-design absence, and hasApp
  gating on these two pages by injection against the real checker. check-
  jsonld.js had only ever caught something on these two pages as a SIDE
  EFFECT of a foreign-fact injection aimed at a different checker (a swapped
  service-area town on the third pass, which happens to also be areaServed) -
  never a direct injection proving its own remaining rules: "@type" (rule 2),
  "name" (rule 3, the exact shape of the Q18 defect this checker exists to
  catch - a branch landing page falling back to the bare shared brandLabel),
  "url" (rule 4), addressRegion specifically (rule 5 - previously only
  streetAddress/addressLocality/postalCode were exercised via the map/
  service-area injections, never the region field), and "email" (rule 7).

  This script shares no code with tools/check-jsonld.js beyond invoking it as
  a child process against an ISOLATED SCRATCH COPY of the repository (built
  here via `git archive HEAD`), never against the tracked working tree. The
  tracked repo is not opened for writing at any point; every mutation happens
  in the scratch copy, and each file is restored from the original string
  immediately after the checker output is captured, sha256-reconfirmed
  before the next case.

  Two negative controls are included alongside the five positive cases, to
  prove no overreach: an insignificant whitespace change to the telephone
  (tidy() must still collapse it, rule 6 unaffected) and a change to opening
  hours (outside check-jsonld's eight rules entirely).

  Run:  node audits/verify-2.2-2026-09-06-ninth.js
  (builds its own scratch mirror at $SCRATCH_2_2_NINTH or
   /tmp/scratch-2.2-verify-ninth; standalone, no external state required)
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = path.join(__dirname, "..");
const SCRATCH = process.env.SCRATCH_2_2_NINTH || "/tmp/scratch-2.2-verify-ninth";

function sha256(p) { return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); }

function buildScratch() {
  if (fs.existsSync(SCRATCH)) fs.rmSync(SCRATCH, { recursive: true, force: true });
  fs.mkdirSync(SCRATCH, { recursive: true });
  execFileSync("sh", ["-c", `git archive HEAD | tar -x -C "${SCRATCH}"`], { cwd: REPO, stdio: "inherit" });
}

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-jsonld.js"], { cwd: SCRATCH, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function mutateAndTest(label, file, mutateFn, expectFail, expectSnippet) {
  const full = path.join(SCRATCH, file);
  const before = fs.readFileSync(full, "utf8");
  const beforeHash = sha256(full);
  const mutated = mutateFn(before);
  if (mutated === before) {
    console.log(`[**FAIL**] ${label}\n    transform did not change the file - pattern not found\n`);
    return false;
  }
  fs.writeFileSync(full, mutated, "utf8");
  const result = runChecker();
  fs.writeFileSync(full, before, "utf8");
  const restored = sha256(full) === beforeHash;

  const failed = result.code !== 0;
  const sawSnippet = expectSnippet ? result.out.indexOf(expectSnippet) !== -1 : true;
  const pass = restored && (failed === expectFail) && (!expectFail || sawSnippet);

  console.log(`[${pass ? "PASS" : "**FAIL**"}] ${label}`);
  console.log(`    expected ${expectFail ? "CAUGHT" : "clean"}, got ${failed ? "caught (exit " + result.code + ")" : "clean (exit 0)"}`);
  if (expectSnippet) console.log(`    expected snippet: ${JSON.stringify(expectSnippet)} -> ${sawSnippet ? "found" : "NOT FOUND"}`);
  console.log(`    file restored byte-identical: ${restored}`);
  if (!pass) console.log("    ---- checker output ----\n" + result.out.split("\n").map(l => "    " + l).join("\n"));
  console.log("");
  return pass;
}

const AINSDALE = "modules/branch/pages/pharmacy-fishlocks-ainsdale.html";
const ECCLESTON = "modules/branch/pages/pharmacy-fishlocks-eccleston.html";

console.log("Building isolated scratch copy via git archive HEAD ...");
buildScratch();
console.log(`Scratch built at ${SCRATCH}\n`);

let allPass = true;

console.log("=== Baseline: check-jsonld.js clean before any mutation ===");
const baseline = runChecker();
console.log(baseline.code === 0 ? "baseline clean (exit 0)\n" : "BASELINE NOT CLEAN - aborting\n" + baseline.out);
if (baseline.code !== 0) process.exit(1);

allPass = mutateAndTest(
  "1. Ainsdale @type Pharmacy -> MedicalBusiness (rule 2)",
  AINSDALE,
  html => html.replace('"@type": "Pharmacy"', '"@type": "MedicalBusiness"'),
  true, '"@type" is "MedicalBusiness"'
) && allPass;

allPass = mutateAndTest(
  "2. Eccleston name -> bare brandLabel 'Fishlocks Chemist' (rule 3, Q18 shape)",
  ECCLESTON,
  html => html.replace('"name": "Fishlocks Chemist Eccleston"', '"name": "Fishlocks Chemist"'),
  true, "It is this branch's other name"
) && allPass;

allPass = mutateAndTest(
  "3. Ainsdale url -> sister's filename (rule 4)",
  AINSDALE,
  html => html.replace(
    '"url": "https://www.fishlockpharmacy.co.uk/pharmacy-fishlocks-ainsdale.html"',
    '"url": "https://www.fishlockpharmacy.co.uk/pharmacy-fishlocks-eccleston.html"'
  ),
  true, '"url" is'
) && allPass;

allPass = mutateAndTest(
  "4. Eccleston addressRegion Lancashire -> Merseyside (rule 5, region field specifically)",
  ECCLESTON,
  html => html.replace('"addressRegion": "Lancashire"', '"addressRegion": "Merseyside"'),
  true, "addressRegion"
) && allPass;

allPass = mutateAndTest(
  "5. Ainsdale email -> Eccleston's mailbox (rule 7)",
  AINSDALE,
  html => html.replace('"email": "Ainsdale@rbhealth.co.uk"', '"email": "Eccleston@rbhealth.co.uk"'),
  true, '"email" is'
) && allPass;

allPass = mutateAndTest(
  "6. [control] Ainsdale telephone gains a double space -> must stay clean (tidy() rule 6)",
  AINSDALE,
  html => html.replace('"telephone": "01704 575478"', '"telephone": "01704  575478"'),
  false
) && allPass;

allPass = mutateAndTest(
  "7. [control] Ainsdale opening hours 'opens' changed -> outside check-jsonld's 8 rules, must stay clean",
  AINSDALE,
  html => html.replace('"opens": "08:45"', '"opens": "09:00"'),
  false
) && allPass;

console.log(allPass ? "ALL CASES BEHAVED AS EXPECTED" : "AT LEAST ONE CASE DID NOT BEHAVE AS EXPECTED - SEE ABOVE");
process.exit(allPass ? 0 : 1);
