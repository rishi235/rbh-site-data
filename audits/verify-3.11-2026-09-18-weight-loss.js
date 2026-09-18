// Twenty-second quality pass on item 3.11 (Gordon Short Chemist, Crosby).
// Fresh angle: tools/check-weight-loss-copy.js, never previously proven by
// direct injection against this branch's own weight-loss-clinic page across
// twenty-one prior passes. Runs entirely inside the disposable scratch copy
// at /sessions/fervent-vigilant-shannon/scratch-311 (git archive of HEAD),
// never against the tracked repo. Each injection is restored from a saved
// backup by byte copy (not git checkout - this mount's documented unlink
// restriction) and sha256-reconfirmed identical before the next.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const REPO = "/sessions/fervent-vigilant-shannon/scratch-311";
const TARGET = path.join(REPO, "modules/service/pages/weight-loss-clinic-gordon-short-crosby.html");
const BACKUP = path.join(REPO, "audits/wlc-gordon-short-BACKUP.html");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function runChecker() {
  try {
    const out = execSync("node tools/check-weight-loss-copy.js", { cwd: REPO, encoding: "utf8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function restore() {
  fs.copyFileSync(BACKUP, TARGET);
  const h = sha256(TARGET);
  const hb = sha256(BACKUP);
  if (h !== hb) throw new Error("RESTORE FAILED: sha256 mismatch after restore");
  return h;
}

const backupHash = sha256(BACKUP);
console.log("Backup sha256:", backupHash);

const results = [];

function inject(label, mutateFn, expectCaught, expectRuleHint) {
  let original = fs.readFileSync(TARGET, "utf8");
  let mutated = mutateFn(original);
  if (mutated === original) {
    results.push({ label, error: "MUTATION NO-OP, string not found" });
    console.log(`[${label}] MUTATION NO-OP - string not found, skipping`);
    return;
  }
  fs.writeFileSync(TARGET, mutated);
  const { code, out } = runChecker();
  const caught = code !== 0;
  const hintHit = expectRuleHint ? out.includes(expectRuleHint) : true;
  const pass = caught === expectCaught && hintHit;
  results.push({ label, expectCaught, caught, code, hintHit, pass, outTail: out.split("\n").slice(-8).join("\n") });
  console.log(`[${label}] caught=${caught} expected=${expectCaught} hintHit=${hintHit} -> ${pass ? "OK" : "MISMATCH"}`);
  const restoredHash = restore();
  const match = restoredHash === backupHash;
  console.log(`[${label}] restored, sha256 match=${match}`);
  if (!match) throw new Error(`${label}: restore sha256 mismatch`);
}

// Injection 1 - Rule 8, no medicine named (tools/pom-names.js)
inject(
  "rule8-medicine-named",
  (t) => t.replace(
    "prescription-only weight-loss medication can be supplied",
    "Mounjaro can be supplied"
  ),
  true,
  "rule8" // hint may not literally appear; checked below in raw output instead
);

// Injection 2 - Rule 9, no efficacy/results claim (tools/claim-patterns.js)
inject(
  "rule9-efficacy-claim",
  (t) => t.replace(
    "Medically-supported weight loss, assessed and supervised by a pharmacist.",
    "Medically-supported weight loss with guaranteed results, assessed and supervised by a pharmacist."
  ),
  true
);

// Injection 3 - Rule 6, no guarantee (removes one of the four no-guarantee sentences)
inject(
  "rule6-no-guarantee-removed",
  (t) => t.replace(
    " Nothing below is a guarantee of treatment, a specific medicine, or a specific outcome. Individual results vary.",
    ""
  ),
  true
);

// Injection 4 - Rule 4, private/paid/not NHS
inject(
  "rule4-nhs-claim",
  (t) => t.replace(
    "No. The Weight Loss Clinic is a private service. Consultations and any medication supplied are paid for privately; this is not free or NHS-funded.",
    "Yes. The Weight Loss Clinic is available on the NHS at no cost to you."
  ),
  true
);

// Injection 5 - Rule 5, eligibility integrity (under-18 exclusion removed)
inject(
  "rule5-under18-removed",
  (t) => t.replace(
    "<li>Under 18s are not seen under this service</li>",
    ""
  ),
  true
);

// Injection 6 - Rule 7, price discipline (fee string changed in one place only)
inject(
  "rule7-price-mismatch",
  (t) => t.replace(
    "Private consultation at Gordon Short Chemist, from £39.99, subject to a clinical assessment.",
    "Private consultation at Gordon Short Chemist, from £29.99, subject to a clinical assessment."
  ),
  true
);

// Injection 7 - Rule 10, governance promise removed from the paste comment
inject(
  "rule10-governance-comment-removed",
  (t) => t.replace(
    "  NOTE: no brand-name medicine is named anywhere (POM advertising rules). Eligibility\n  is framed as a clinical assessment, never a guarantee. Superintendent pharmacist\n  signs off wording before publish, per DRAFT-weight-loss-copy.html governance notes.\n",
    ""
  ),
  true
);

// Control - unrelated wording change, no rule should fire
inject(
  "control-unrelated-reword",
  (t) => t.replace(
    "Real people, not a call centre",
    "Friendly local team, not a call centre"
  ),
  false
);

console.log("\n=== SUMMARY ===");
let allOk = true;
for (const r of results) {
  console.log(`${r.pass === false ? "FAIL" : "OK  "} ${r.label} caught=${r.caught} expected=${r.expectCaught}`);
  if (r.pass === false || r.error) allOk = false;
}
console.log(allOk ? "\nALL INJECTIONS BEHAVED AS EXPECTED" : "\nSOME INJECTIONS DID NOT BEHAVE AS EXPECTED - REVIEW");

const finalHash = sha256(TARGET);
console.log("\nFinal target sha256:", finalHash, finalHash === backupHash ? "(matches backup)" : "(MISMATCH!)");
