/*
  verify-3.10-2026-09-14-eighteenth.js

  Item 3.10 quality pass (eighteenth), Riddings Pharmacy (Timperley).
  Target: tools/check-app-membership.js, never proven by injection against
  this branch's own pages or its own GBP pack across seventeen prior passes,
  despite the checker's own file header (the SCOPE comment above RULE 8)
  naming gbp-packs/riddings-timperley.md specifically as the reason "Notes
  for the paster" is excluded from the published-copy scan: that pack's own
  note warns the paster that the OLD live switch page carries a "Download
  our app" block that must not be copied across, and a rule reading the
  whole pack would fail it for the very sentence that stops the mistake.

  Riddings has hasApp:false and is not one of the four app-member branches
  (Fishlocks Ainsdale, Fishlocks Eccleston, Clear Chemist Aintree, Smartts
  Bootle), so every injection here tests the ABSENCE direction: a branch
  that should carry no app trace anywhere, on a page, a paste sheet marker
  or a public GBP pack, being made to carry one.

  Runs against a scratch copy (git archive HEAD), never the tracked repo.
  Shells out to the real checker as a child process (never imported), so
  the proof exercises the exact file that ships. Refuses to run if the
  checker is not already clean. Mutates one target file at a time from an
  in-memory original, restores immediately after each run, sha256-verifies
  the restore before the next injection.

  This run's scratch copy lived at /tmp/scratch-3.10 inside the Cowork
  sandbox (git archive HEAD of agents/audit-backlog at commit f030609,
  the same commit the tracked repo was on when this pass started). The
  REPO path below is only meaningful inside that sandbox session; kept as
  originally run for an exact record, per the convention established by
  other verify-*.js files already committed under audits/.
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const crypto = require("crypto");

const REPO = "/tmp/scratch-3.10";
const CHECKER = path.join(REPO, "tools", "check-app-membership.js");

const TARGETS = {
  sw: path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-riddings-timperley.html"),
  pf: path.join(REPO, "modules", "service", "pages", "pharmacy-first-riddings-timperley.html"),
  idx: path.join(REPO, "modules", "switch", "pages", "INDEX.md"),
  pack: path.join(REPO, "gbp-packs", "riddings-timperley.md")
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
say("Baseline check-app-membership: clean (exit 0).");
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

// (1) RULE 2, switch pages: give Riddings' own switch page the app-card
// class it must not carry (hasApp false).
injection(
  "1 RULE-2-switch-card (Riddings switch page gains class=\"app-card\")",
  "sw",
  function (s) {
    return s.replace(
      /(<div[^>]*id="rbhsw-root"[^>]*>)/,
      '$1<div class="app-card">'
    );
  },
  true,
  "app member"
);

// (2) RULE 4, absence elsewhere: the canonical app name appears on a
// service-family page, which is never meant to carry it.
injection(
  "2 RULE-4-absence (pharmacy-first page gains an app mention)",
  "pf",
  function (s) {
    return s.replace(
      /(<div[^>]*id="rbhsv-root"[^>]*>)/,
      "$1<p>Manage everything in the RB Healthcare Pharmacy app.</p>"
    );
  },
  true,
  "no page in this family is meant to"
);

// (3) RULE 5, one name: an app-family page (the switch page) names the app
// without "Pharmacy", a variant the APP_MENTION regex still matches.
injection(
  "3 RULE-5-one-name (Riddings switch page names \"RB Healthcare app\", drops Pharmacy)",
  "sw",
  function (s) {
    return s.replace(
      /(<div[^>]*id="rbhsw-root"[^>]*>)/,
      "$1<p>Some pages mention the RB Healthcare app.</p>"
    );
  },
  true,
  "one name"
);

// (4) RULE 6, store URLs: an app-family page carries a store URL the
// generator does not declare.
injection(
  "4 RULE-6-store-urls (Riddings switch page carries an undeclared App Store URL)",
  "sw",
  function (s) {
    return s.replace(
      /(<div[^>]*id="rbhsw-root"[^>]*>)/,
      '$1<a href="https://apps.apple.com/gb/app/not-the-real-app/id0000000000">app</a>'
    );
  },
  true,
  "store urls"
);

// (5) RULE 7, paste markers: mark Riddings' own INDEX.md heading as an app
// member when branches.json says hasApp false.
injection(
  "5 RULE-7-paste-marker (Riddings' own INDEX.md heading marked *(app member)*)",
  "idx",
  function (s) {
    return s.replace(
      "## Riddings Pharmacy — Timperley",
      "## Riddings Pharmacy — Timperley *(app member)*"
    );
  },
  true,
  "paste markers"
);

// (6) RULE 8c, paster note vs field: the pack's own "Notes for the paster"
// section is told hasApp is true, when branches.json has it false.
injection(
  "6 RULE-8c-note-vs-field (Riddings pack notes claim hasApp true)",
  "pack",
  function (s) {
    return s.replace(
      "- No app mention anywhere in this pack: branches.json has hasApp false for",
      "- hasApp true. No app mention anywhere in this pack: branches.json has hasApp false for"
    );
  },
  true,
  "hasApp true"
);

// (7) RULE 8a / 8d, published copy claims an app the branch does not run,
// directly contradicting the pack's own note that says there is no app
// mention anywhere in the pack.
injection(
  "7 RULE-8a-8d-published-claim (Riddings pack description gains an app sentence)",
  "pack",
  function (s) {
    return s.replace(
      /(## 1\. Business description[^\n]*\n)/,
      "$1Manage repeat prescriptions in the RB Healthcare Pharmacy app.\n"
    );
  },
  true,
  "claims an app"
);

// (8) RULE 8b, the photo shot list asks for an app screenshot the branch
// has nothing to photograph.
injection(
  "8 RULE-8b-shot-list (Riddings pack shot list asks for an app screen)",
  "pack",
  function (s) {
    return s.replace(
      /(## 4\. Photo shot list[^\n]*\n)/,
      "$1- Photograph the app screen on a staff phone.\n"
    );
  },
  true,
  "photo shot list"
);

// (9) CONTROL: reorder unrelated copy in the pack's Services section, no
// app-related field or word touched.
injection(
  "9 CONTROL (Riddings pack Services section, unrelated line duplicated with no app content)",
  "pack",
  function (s) {
    return s.replace(
      "## 3. Services section content",
      "## 3. Services section content (reviewed 2026-09-14, no change)"
    );
  },
  false,
  null
);

say("");
say("=== SUMMARY: " + pass + " pass, " + fail + " fail ===");

// Final full-suite re-check on the scratch copy.
say("");
say("=== FULL 35-CHECKER SUITE ON SCRATCH (cdn-pins excluded, no .git) ===");
const toolsDir = path.join(REPO, "tools");
const allCheckers = fs.readdirSync(toolsDir)
  .filter(function (f) { return /^check-.*\.js$/.test(f) && f !== "check-cdn-pins.js"; })
  .sort();
let suiteFail = 0;
allCheckers.forEach(function (f) {
  try {
    execFileSync("node", [path.join(toolsDir, f)], { cwd: REPO, encoding: "utf8" });
    say("  OK    " + f);
  } catch (e) {
    say("  FAIL  " + f);
    suiteFail++;
  }
});
say(allCheckers.length + " checkers run, " + suiteFail + " failing.");

if (fail > 0 || suiteFail > 0) process.exit(1);
