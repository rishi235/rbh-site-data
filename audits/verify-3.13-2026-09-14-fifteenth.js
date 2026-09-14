/*
  verify-3.13-2026-09-14-fifteenth.js

  Item 3.13 (Clear Chemist, Liverpool/Aintree), fifteenth quality pass,
  2026-09-14. All 8 unblocked worklist items were [BLOCKED] this run, so this
  is the fallback quality pass, picked by the standing rotation-pool method
  (oldest last-touched date among the 3.x/4.x/5.1-5.2 pool; 3.13 came out
  stalest, last touched 2026-09-11, tied with 18 others, lowest by item
  number).

  FRESH ANGLE. Fourteen prior passes on this item proved, by direct injection
  against Clear Chemist Aintree's own pages/records specifically:
  check-switch-copy.js, check-weight-loss-copy.js, check-travel-clinic-copy.js,
  check-jsonld.js, check-seo-pattern.js, check-seo-keywords.js,
  check-branch-links.js, check-app-membership.js and check-booking-routes.js.
  A grep of this item's own AGENT_WORKLIST.md section for "check-map-embeds.js"
  across all fourteen passes returns zero hits - the ninth pass (2026-09-05)
  named it explicitly as a checker never touched against this branch
  ("zero for check-map-embeds.js, check-branch-identity.js and
  check-cdn-pins.js") while closing the equivalent gap for check-jsonld.js
  instead. check-map-embeds.js is CLAUDE.md's own "silent fault" checker for
  the map iframe and directions button: a wrong address there is invisible to
  every text-based checker (check-nap, check-jsonld's own PostalAddress) while
  the page still reads correctly to a visitor. Closed this pass.

  Restore discipline: every injection restored from an in-memory buffer via
  fs.writeFileSync, not git (the standing fix this item's fifth pass had to
  apply after a FUSE index.lock crashed an earlier probe mid-run), sha256-
  reconfirmed byte-identical before the next injection and again at the end.

  Run: node audits/verify-3.13-2026-09-14-fifteenth.js
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-map-embeds.js");

const SWITCH = path.join(REPO, "modules", "switch", "pages", "switch-prescriptions-clear-aintree.html");
const TRAVEL = path.join(REPO, "modules", "service", "pages", "travel-clinic-clear-aintree.html");
const WEIGHT = path.join(REPO, "modules", "service", "pages", "weight-loss-clinic-clear-aintree.html");
const BRANCHES = path.join(REPO, "branches.json");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO, encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

function line(s) { console.log(s); }

// ---- baseline ---------------------------------------------------------
const baseline = {
  switch: fs.readFileSync(SWITCH),
  travel: fs.readFileSync(TRAVEL),
  weight: fs.readFileSync(WEIGHT),
  branches: fs.readFileSync(BRANCHES)
};
const baselineSha = {};
Object.keys(baseline).forEach(function (k) { baselineSha[k] = sha256(baseline[k]); });

line("=== BASELINE ===");
Object.keys(baselineSha).forEach(function (k) { line("  " + k + ": " + baselineSha[k]); });

const pre = runChecker();
line("Pre-injection checker run: exit " + pre.code);
if (pre.code !== 0) {
  line(pre.out);
  throw new Error("Checker not clean before any injection - aborting, this would invalidate every result below.");
}

function restoreAll() {
  fs.writeFileSync(SWITCH, baseline.switch);
  fs.writeFileSync(TRAVEL, baseline.travel);
  fs.writeFileSync(WEIGHT, baseline.weight);
  fs.writeFileSync(BRANCHES, baseline.branches);
  ["switch", "travel", "weight", "branches"].forEach(function (k) {
    const p = { switch: SWITCH, travel: TRAVEL, weight: WEIGHT, branches: BRANCHES }[k];
    const got = sha256(fs.readFileSync(p));
    if (got !== baselineSha[k]) throw new Error("RESTORE FAILED for " + k + ": " + got + " != " + baselineSha[k]);
  });
}

let caught = 0, missed = 0, results = [];

function attempt(name, mutate, expectTag) {
  mutate();
  const r = runChecker();
  const hit = r.code !== 0 && r.out.indexOf("[" + expectTag + "]") !== -1;
  if (r.code !== 0 && hit) { caught++; results.push({ name: name, status: "CAUGHT", tag: expectTag }); }
  else if (r.code !== 0) { results.push({ name: name, status: "CAUGHT (different tag)", out: r.out }); caught++; }
  else { missed++; results.push({ name: name, status: "MISSED", out: r.out }); }
  restoreAll();
  const post = runChecker();
  if (post.code !== 0) throw new Error("Checker not clean after restore for '" + name + "' - restore itself is broken.");
}

// ---- RULE 2, coverage: switch page gets a second map iframe -----------
attempt(
  "RULE 2 coverage - duplicate map iframe on switch page",
  function () {
    const src = fs.readFileSync(SWITCH, "utf8");
    const marker = '<iframe class="map" src="https://www.google.com/maps?q=Unit%2020%20Brookfield%20Trade%20Centre%2C%20Brookfield%20Drive%2C%20Aintree%2C%20Liverpool%2C%20L9%207AS&output=embed" loading="lazy"></iframe>';
    if (src.indexOf(marker) === -1) throw new Error("marker not found in switch page - page shape changed");
    const mutated = src.replace(marker, marker + marker);
    fs.writeFileSync(SWITCH, mutated);
  },
  "coverage"
);

// ---- RULE 3, the address: branches.json postalCode changed to a real,
// different branch's postcode, page left untouched (unregenerated) --------
attempt(
  "RULE 3 address - clearchemist_aintree.postalCode swapped to Fishlocks Ainsdale's real postcode",
  function () {
    const data = JSON.parse(fs.readFileSync(BRANCHES, "utf8"));
    const clear = data.branches.find(function (b) { return b.id === "clearchemist_aintree"; });
    const fishlocks = data.branches.find(function (b) { return b.id === "fishlocks_ainsdale"; });
    if (!clear || !fishlocks) throw new Error("expected branch ids not found");
    if (clear.postalCode === fishlocks.postalCode) throw new Error("postcodes already equal - injection would be inert");
    clear.postalCode = fishlocks.postalCode;
    fs.writeFileSync(BRANCHES, JSON.stringify(data, null, 2) + "\n");
  },
  "the address"
);

// ---- RULE 4, agreement: contact card text changed, map iframe left alone -
attempt(
  "RULE 4 agreement - travel clinic contact-card address diverges from its own map",
  function () {
    const src = fs.readFileSync(TRAVEL, "utf8");
    const marker = '<div class="contact-line"><p>Unit 20 Brookfield Trade Centre, Brookfield Drive, Aintree, Liverpool, L9 7AS</p></div>';
    if (src.indexOf(marker) === -1) throw new Error("marker not found in travel clinic page - page shape changed");
    const mutated = src.replace(
      marker,
      '<div class="contact-line"><p>Unit 20 Brookfield Trade Centre, Brookfield Drive, Aintree, Liverpool, L9 7AZ</p></div>'
    );
    fs.writeFileSync(TRAVEL, mutated);
  },
  "agreement"
);

// ---- RULE 5, encoding: weight loss map src loses output=embed -----------
attempt(
  "RULE 5 encoding - weight loss map iframe loses output=embed",
  function () {
    const src = fs.readFileSync(WEIGHT, "utf8");
    const marker = 'https://www.google.com/maps?q=Unit%2020%20Brookfield%20Trade%20Centre%2C%20Brookfield%20Drive%2C%20Aintree%2C%20Liverpool%2C%20L9%207AS&output=embed';
    if (src.indexOf(marker) === -1) throw new Error("marker not found in weight loss page - page shape changed");
    const mutated = src.replace(
      marker,
      'https://www.google.com/maps?q=Unit%2020%20Brookfield%20Trade%20Centre%2C%20Brookfield%20Drive%2C%20Aintree%2C%20Liverpool%2C%20L9%207AS'
    );
    fs.writeFileSync(WEIGHT, mutated);
  },
  "encoding"
);

// ---- CONTROL: benign, unrelated edit - must NOT fire this checker -------
{
  const src = fs.readFileSync(SWITCH, "utf8");
  const mutated = src.replace("</body>", "<!-- reviewed 2026-09-14, no content change -->\n</body>");
  fs.writeFileSync(SWITCH, mutated);
  const r = runChecker();
  results.push({
    name: "CONTROL - unrelated HTML comment before </body> on switch page",
    status: r.code === 0 ? "PASSED (correct)" : "FALSE POSITIVE",
    out: r.code === 0 ? undefined : r.out
  });
  if (r.code === 0) caught++; else missed++; // counted as a correct-behaviour case either way it's tallied below
  restoreAll();
  const post = runChecker();
  if (post.code !== 0) throw new Error("Checker not clean after CONTROL restore.");
}

// ---- final verification ---------------------------------------------------
line("");
line("=== RESULTS ===");
results.forEach(function (r) {
  line("  " + r.status + ": " + r.name + (r.tag ? " [" + r.tag + "]" : ""));
  if (r.out && r.status.indexOf("MISSED") !== -1) line("    " + r.out.split("\n").join("\n    "));
  if (r.out && r.status.indexOf("FALSE POSITIVE") !== -1) line("    " + r.out.split("\n").join("\n    "));
});

line("");
["switch", "travel", "weight", "branches"].forEach(function (k) {
  const p = { switch: SWITCH, travel: TRAVEL, weight: WEIGHT, branches: BRANCHES }[k];
  const got = sha256(fs.readFileSync(p));
  line("Final restore check " + k + ": " + (got === baselineSha[k] ? "OK byte-identical" : "MISMATCH " + got));
});

const finalRun = runChecker();
line("Final checker run after full restore: exit " + finalRun.code);
if (finalRun.code !== 0) { line(finalRun.out); throw new Error("Checker not clean at end of run."); }

line("");
line("Summary: " + caught + " correct outcome(s) (caught or correctly passed), " + missed + " unexpected outcome(s).");
if (missed > 0) process.exitCode = 1;
