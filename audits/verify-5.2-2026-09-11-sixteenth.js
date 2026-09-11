/*
  verify-5.2-2026-09-11-sixteenth.js

  Item 5.2 quality pass (sixteenth), unattended run, rotation-pool pick (5.2
  named as next-stalest by item 2.1's own sixteenth-pass forward note,
  2026-09-10, and confirmed unmoved since: still last-touched 2026-09-10 by
  this run's own re-scan of AGENT_WORKLIST.md dates, tied with twelve other
  items at that date, but the only one of those twelve explicitly forward-
  noted by a same-day later pass).

  NEW ANGLE: of the fifteen prior passes on this item, none had ever run
  tools/check-map-embeds.js itself against any of item 5.2's own four pages
  (McCanns Aigburth, McCanns Sandringham, Scorah Bramhall, Scorah Hazel
  Grove) and proven it by injection, despite this checker's own header
  naming branch landing pages as the primary reason it exists: they are the
  only page family in the estate carrying a second copy of the map query, in
  the "Get directions" button, which "does not merely tell a patient where
  the shop is, it drives them there" (RULE 6, directions, has no equivalent
  on any other page family). check-whatsapp-route.js and check-app-
  membership.js were also untested against this item but apply to branch
  pages only trivially (no module root, no WhatsApp button, no app card on
  this page family by generator design); check-map-embeds.js is the
  substantive gap.

  METHOD: same discipline as prior passes on this and sibling items - refuse
  to run on a dirty tree, capture original bytes and sha256 before any
  mutation, restore by direct fs.writeFileSync immediately after capturing
  the checker's output and before any assertion, sha256-reconfirm byte-
  identical restoration after every injection and again at the end. Target:
  modules/branch/pages/pharmacy-mccanns-aigburth.html. Shells out to the
  real tools/check-map-embeds.js as a child process (not a re-implementation).
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = "/sessions/great-wonderful-hawking/mnt/rbh-site-data";
const TARGET = path.join(REPO, "modules/branch/pages/pharmacy-mccanns-aigburth.html");
const CHECKER = path.join(REPO, "tools/check-map-embeds.js");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function log(...args) { console.log(...args); }

function gitPorcelain() {
  try {
    return execFileSync("/usr/bin/git", ["status", "--porcelain", "--", "modules", "core", "branches.json", "gbp-packs"], {
      cwd: REPO, encoding: "utf8", env: process.env
    });
  } catch (e) {
    return "GIT_ERROR: " + (e.stdout || e.message);
  }
}

// Refuse to run on a dirty tree (beyond the two standing untracked artefacts).
const preStatus = gitPorcelain();
const preLines = preStatus.split("\n").filter(function (l) { return l.trim(); });
const unexpected = preLines.filter(function (l) {
  return l.indexOf("gbp-packs/.fuse_hidden0000000400000001") === -1
    && l.indexOf("modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak") === -1;
});
if (unexpected.length) {
  log("REFUSING TO RUN: tree is not clean beyond the two known standing artefacts:");
  log(preStatus);
  process.exit(1);
}
log("Pre-flight git status: clean (only the two known standing untracked artefacts present).");

const original = fs.readFileSync(TARGET);
const originalSha = sha256(original);
log("Baseline sha256 of " + path.relative(REPO, TARGET) + ": " + originalSha);

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// Baseline run - must be clean before any injection.
const baseline = runChecker();
log("\n--- BASELINE RUN (before any injection) ---");
log("exit code: " + baseline.code);
if (baseline.code !== 0) {
  log(baseline.out);
  log("REFUSING TO PROCEED: checker does not pass cleanly on the unmodified tree.");
  process.exit(1);
}
log("check-map-embeds.js passes cleanly on the unmodified tree.");

function restore() {
  fs.writeFileSync(TARGET, original);
  const nowSha = sha256(fs.readFileSync(TARGET));
  if (nowSha !== originalSha) {
    log("FATAL: restore did not reproduce the original bytes. sha256 now " + nowSha);
    process.exit(2);
  }
}

function injectAndRun(label, mutateFn, expectSubstring) {
  const src = original.toString("utf8");
  const mutated = mutateFn(src);
  if (mutated === src) {
    log("  NO-OP GUARD TRIPPED: mutation for '" + label + "' did not change the file. Aborting this injection.");
    return { noop: true };
  }
  fs.writeFileSync(TARGET, mutated, "utf8");
  const result = runChecker();
  restore();
  const caught = result.code !== 0 && result.out.indexOf(expectSubstring) !== -1;
  log("\n--- INJECTION: " + label + " ---");
  log("exit code: " + result.code);
  log("expected substring found: " + caught);
  if (!caught) {
    log("FULL OUTPUT:\n" + result.out);
  } else {
    const line = result.out.split("\n").filter(function (l) { return l.indexOf(expectSubstring) !== -1; })[0];
    log("matched line: " + line.trim());
  }
  return { noop: false, caught: caught };
}

const results = [];

// RULE 2 - coverage: duplicate the map embed.
results.push(["RULE 2 coverage (duplicate embed)", injectAndRun(
  "RULE 2 coverage (duplicate embed)",
  function (s) {
    const marker = '<iframe class="map" src="https://www.google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%207BP&output=embed" loading="lazy"></iframe>';
    if (s.indexOf(marker) === -1) return s;
    return s.replace(marker, marker + marker);
  },
  "carries 2 map embed(s), expected exactly 1"
)]);

// RULE 3 - the address: repoint the map query at the sister branch's real
// postcode (McCanns Sandringham, L17 4JP), the exact silent-wrong-building
// fault the checker's own header names.
results.push(["RULE 3 the address (sister branch postcode)", injectAndRun(
  "RULE 3 the address (sister branch postcode)",
  function (s) {
    return s.replace(
      "https://www.google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%207BP&output=embed",
      "https://www.google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%204JP&output=embed"
    );
  },
  "branches.json gives this branch"
)]);

// RULE 4 - agreement: change only the contact-card printed address, leaving
// the map iframe untouched, so the two disagree.
results.push(["RULE 4 agreement (contact card diverges from map)", injectAndRun(
  "RULE 4 agreement (contact card diverges from map)",
  function (s) {
    const marker = '<div class="contact-line"><p>112 Aigburth Road, Liverpool, L17 7BP</p></div>';
    if (s.indexOf(marker) === -1) return s;
    return s.replace(marker, '<div class="contact-line"><p>112 Aigburth Road, Liverpool, L17 4JP</p></div>');
  },
  "contact card reads"
)]);

// RULE 5 - encoding: insert a raw space into the map query.
results.push(["RULE 5 encoding (raw space in query)", injectAndRun(
  "RULE 5 encoding (raw space in query)",
  function (s) {
    return s.replace(
      "https://www.google.com/maps?q=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%207BP&output=embed",
      "https://www.google.com/maps?q=112%20Aigburth Road%2C%20Liverpool%2C%20L17%207BP&output=embed"
    );
  },
  "raw space or comma"
)]);

// RULE 6 - directions: repoint the "Get directions" destination away from
// the map query on the same page, leaving the map itself untouched.
results.push(["RULE 6 directions (destination diverges from map)", injectAndRun(
  "RULE 6 directions (destination diverges from map)",
  function (s) {
    return s.replace(
      "https://www.google.com/maps/dir/?api=1&destination=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%207BP",
      "https://www.google.com/maps/dir/?api=1&destination=112%20Aigburth%20Road%2C%20Liverpool%2C%20L17%204JP"
    );
  },
  "directions button routes to"
)]);

// Final restore confirmation and full-suite re-run.
const finalSha = sha256(fs.readFileSync(TARGET));
log("\n--- FINAL STATE ---");
log("Final sha256 of target: " + finalSha + " (matches baseline: " + (finalSha === originalSha) + ")");

const postStatus = gitPorcelain();
const postLines = postStatus.split("\n").filter(function (l) { return l.trim(); });
const postUnexpected = postLines.filter(function (l) {
  return l.indexOf("gbp-packs/.fuse_hidden0000000400000001") === -1
    && l.indexOf("modules/service/pages/notarealservice-fishlocks-ainsdale.html.bak") === -1;
});
log("git status after restore, unexpected entries: " + postUnexpected.length);
if (postUnexpected.length) log(postStatus);

log("\n--- SUMMARY ---");
let allCaught = true;
results.forEach(function (r) {
  const label = r[0];
  const res = r[1];
  if (res.noop) {
    log("  NO-OP: " + label);
    allCaught = false;
  } else {
    log("  " + (res.caught ? "CAUGHT" : "MISSED") + ": " + label);
    if (!res.caught) allCaught = false;
  }
});
log("\nAll injections caught as expected: " + allCaught);
log(finalSha === originalSha ? "Target file confirmed byte-identical to baseline." : "TARGET FILE DID NOT RESTORE CLEANLY - MANUAL CHECK NEEDED.");
process.exit(allCaught && finalSha === originalSha ? 0 : 1);
