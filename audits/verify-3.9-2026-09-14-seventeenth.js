/*
  verify-3.9-2026-09-14-seventeenth.js

  Item 3.9 quality pass (seventeenth), Coleman and Leighs Pharmacy (Walton).
  Target: tools/check-map-embeds.js, never proven by injection against this
  branch's own pages across sixteen prior passes, despite the checker's own
  file header naming Coleman and Leighs by name as the worked example for why
  the map value and the contact-card value have to be checked against each
  other (its addressLocality is Liverpool, its seoTown is Walton).

  Runs against a scratch copy (git archive HEAD), never the tracked repo.
  Shells out to the real checker as a child process (never imported), so the
  proof exercises the exact file that ships, not a re-implementation of it.
  Refuses to run if the checker is not already clean. Mutates one target file
  at a time from an in-memory original, restores immediately after each run,
  sha256-verifies the restore before the next injection.

  This run's scratch copy lived at /sessions/vibrant-upbeat-thompson/mnt/
  outputs/scratch-3.9 inside the Cowork sandbox (git archive HEAD of
  agents/audit-backlog at commit matching the tracked repo when this pass
  started). The REPO path below is only meaningful inside that sandbox
  session; kept as originally run for an exact record, per the convention
  established by other verify-*.js files already committed under audits/.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = "/sessions/vibrant-upbeat-thompson/mnt/outputs/scratch-3.9";
const CHECKER = path.join(REPO, "tools", "check-map-embeds.js");

const TARGETS = {
  pf: path.join(REPO, "modules", "service", "pages", "pharmacy-first-coleman-leigh-walton.html"),
  wl: path.join(REPO, "modules", "service", "pages", "weight-loss-clinic-coleman-leigh-walton.html"),
  sw: path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-coleman-leigh-walton.html")
};

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { rc: 0, out: out };
  } catch (e) {
    return { rc: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

const log = [];
function say(s) { log.push(s); console.log(s); }

// ---- baseline ---------------------------------------------------------
const originals = {};
const baselineSha = {};
Object.keys(TARGETS).forEach(function (k) {
  originals[k] = fs.readFileSync(TARGETS[k], "utf8");
  baselineSha[k] = sha256(TARGETS[k]);
});

say("BASELINE sha256:");
Object.keys(TARGETS).forEach(function (k) {
  say("  " + k + " " + rel(TARGETS[k]) + " " + baselineSha[k]);
});

const base = runChecker();
if (base.rc !== 0) {
  say("REFUSING TO RUN: checker is not clean on the scratch copy before any injection.");
  say(base.out);
  process.exit(1);
}
say("Baseline check-map-embeds: clean (exit 0).");
say("");

let pass = 0;
let fail = 0;

function restore(k) {
  fs.writeFileSync(TARGETS[k], originals[k], "utf8");
  const got = sha256(TARGETS[k]);
  if (got !== baselineSha[k]) {
    say("  RESTORE FAILED for " + k + " - sha256 mismatch after restore!");
    process.exit(2);
  }
}

function injection(name, key, mutate, expectFail, expectSubstr) {
  const before = originals[key];
  const mutated = mutate(before);
  if (mutated === before) {
    say("SKIP " + name + ": mutation produced no change (injection point not found)");
    return;
  }
  fs.writeFileSync(TARGETS[key], mutated, "utf8");
  const res = runChecker();
  const caught = res.rc !== 0;
  const substrOk = expectSubstr ? res.out.indexOf(expectSubstr) !== -1 : true;
  const ok = expectFail ? (caught && substrOk) : !caught;
  say((ok ? "PASS" : "FAIL") + " " + name + " -> exit " + res.rc + (expectSubstr ? (substrOk ? " (substring found)" : " (SUBSTRING MISSING: " + expectSubstr + ")") : ""));
  if (!ok) {
    say("  --- checker output ---");
    say(res.out);
    fail++;
  } else {
    pass++;
  }
  restore(key);
  const got = sha256(TARGETS[key]);
  say("  restored, sha256 " + (got === baselineSha[key] ? "MATCHES baseline" : "MISMATCH!!"));
}

say("=== INJECTIONS ===");

// (1) RULE 3, the address: swap the map query to another live branch's
// address entirely (Fishlocks Ainsdale), on the Pharmacy First page.
injection(
  "1 RULE-3-address (pf page, map repointed to Fishlocks Ainsdale's address)",
  "pf",
  function (s) {
    return s.replace(
      'src="https://www.google.com/maps?q=241%20Walton%20Village%2C%20Liverpool%2C%20L4%206TH&output=embed"',
      'src="https://www.google.com/maps?q=' + encodeURIComponent("13 Station Road, Ainsdale, Southport, PR8 3HW") + '&output=embed"'
    );
  },
  true,
  "the address"
);

// (2) RULE 4, agreement: change only the map query's postcode segment,
// leaving the contact-card line untouched, so the two disagree with each
// other even though the map's new value belongs to no real branch.
injection(
  "2 RULE-4-agreement (pf page, map postcode diverges from contact card)",
  "pf",
  function (s) {
    return s.replace(
      'src="https://www.google.com/maps?q=241%20Walton%20Village%2C%20Liverpool%2C%20L4%206TH&output=embed"',
      'src="https://www.google.com/maps?q=' + encodeURIComponent("241 Walton Village, Liverpool, L4 9ZZ") + '&output=embed"'
    );
  },
  true,
  "agreement"
);

// (3) RULE 5, encoding: insert a raw, unencoded comma into the map query so
// it fails the "no raw space or comma" check even though decoding would
// otherwise succeed.
injection(
  "3 RULE-5-encoding-raw-comma (weight loss page, unencoded comma in query)",
  "wl",
  function (s) {
    return s.replace(
      /src="https:\/\/www\.google\.com\/maps\?q=([^"]+)&output=embed"/,
      function (m, q) { return 'src="https://www.google.com/maps?q=' + q + ',&output=embed"'; }
    );
  },
  true,
  "encoding"
);

// (4) RULE 5, encoding: drop output=embed from the map src.
injection(
  "4 RULE-5-encoding-no-output-embed (switch page, output=embed removed)",
  "sw",
  function (s) {
    return s.replace("&output=embed\"", "\"");
  },
  true,
  "encoding"
);

// (5) RULE 2, coverage: remove the map iframe from the switch page entirely.
injection(
  "5 RULE-2-coverage-missing-map (switch page, iframe removed)",
  "sw",
  function (s) {
    return s.replace(/<iframe class="map"[^>]*><\/iframe>\s*/, "");
  },
  true,
  "coverage"
);

// (6) CONTROL: change an unrelated field on the same page (the review link
// text, not the map or contact-card address) and confirm no failure fires.
injection(
  "6 CONTROL-unrelated-field (pf page, review link text only)",
  "pf",
  function (s) {
    return s.replace("Read our latest reviews", "See what our customers say");
  },
  false,
  null
);

say("");
say("=== SUMMARY: " + pass + " pass, " + fail + " fail (out of " + (pass + fail) + ") ===");

// Final restore confirmation.
say("");
say("FINAL sha256 (should match baseline exactly):");
Object.keys(TARGETS).forEach(function (k) {
  const got = sha256(TARGETS[k]);
  say("  " + k + " " + (got === baselineSha[k] ? "OK" : "MISMATCH") + " " + got);
});

const finalCheck = runChecker();
say("");
say("Final full run of check-map-embeds on the restored scratch copy: exit " + finalCheck.rc);
say(finalCheck.out);

process.exit(fail > 0 || finalCheck.rc !== 0 ? 1 : 0);
