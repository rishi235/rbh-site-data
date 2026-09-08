// Item 3.4 quality pass (fifteenth), 2026-09-08.
// Proves tools/check-map-embeds.js by direct injection against Cherry Lane
// Pharmacy's own generated pages for the first time (grep of the item's
// entire section, all fourteen prior passes, for "check-map-embeds" returns
// zero hits).
//
// Discipline matches the thirteen prior injection instruments on this item:
// no import from tools/ beyond invoking the real checker as a child process,
// refuses to run if any target already carries a git diff, records every
// target's sha256 before mutation, restores by direct fs.writeFileSync from
// an in-memory Buffer immediately after capturing the checker's output and
// before any assertion, sha256-reconfirms after every restore.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const CHECKER = path.join(REPO, "tools", "check-map-embeds.js");

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

function gitDiffEmpty(relPath) {
  const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
  return out.trim() === "";
}

function runChecker() {
  try {
    const out = execFileSync("node", [CHECKER], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const targets = [
  "modules/service/pages/contraception-cherry-lane-walton.html",
  "modules/service/pages/impetigo-treatment-cherry-lane-walton.html",
  "modules/service/pages/sinusitis-treatment-cherry-lane-walton.html",
  "modules/switch/pages/switch-prescriptions-cherry-lane-walton.html"
];

console.log("=== PRECONDITION: refuse to run if any target already carries a diff ===");
targets.forEach(function (t) {
  if (!gitDiffEmpty(t)) {
    console.error("REFUSING: " + t + " already has a git diff");
    process.exit(2);
  }
  console.log("  clean: " + t);
});

const baselineBuf = {};
const baselineSha = {};
targets.forEach(function (t) {
  const p = path.join(REPO, t);
  baselineBuf[t] = fs.readFileSync(p);
  baselineSha[t] = sha(baselineBuf[t]);
});

console.log("");
console.log("=== BASELINE: check-map-embeds.js on the clean tree ===");
const base = runChecker();
console.log("exit " + base.code);
if (base.code !== 0) { console.error("Baseline is not clean, aborting."); process.exit(3); }

function inject(label, target, mutateFn, expectFragment) {
  console.log("");
  console.log("=== INJECTION: " + label + " (" + target + ") ===");
  const p = path.join(REPO, target);
  const original = baselineBuf[target].toString("utf8");
  const mutated = mutateFn(original);
  if (mutated === original) {
    console.error("MUTATION NO-OP for " + label + " - test authoring error");
    process.exit(4);
  }
  fs.writeFileSync(p, mutated, "utf8");
  const result = runChecker();
  // restore immediately, before any assertion
  fs.writeFileSync(p, baselineBuf[target]);
  const restoredSha = sha(fs.readFileSync(p));
  const restoredOk = restoredSha === baselineSha[target];
  console.log("  checker exit: " + result.code + " (expect 1)");
  const caught = result.code === 1 && result.out.indexOf(expectFragment) !== -1;
  console.log("  caught expected fragment '" + expectFragment + "': " + caught);
  console.log("  restored byte-identical: " + restoredOk);
  if (!caught || !restoredOk) {
    console.error("FAIL on " + label);
    process.exit(5);
  }
  return true;
}

// (1) RULE "the address" - map query town swapped from Liverpool to Bootle
// (a real, different live branch's postal town), the exact citation-
// consistency shape CLAUDE.md documents for this item's own fourth-pass
// defect, and the same shape the 3.4 fourteenth pass proved for check-jsonld
// rule 8 - proving it separately here for check-map-embeds' own RULE 3.
inject(
  "RULE the address - map query town swapped Liverpool -> Bootle",
  "modules/service/pages/contraception-cherry-lane-walton.html",
  function (src) {
    const re = /(maps\?q=)202%20Cherry%20Lane%2C%20Liverpool%2C%20L4%208SG(&output=embed)/;
    if (!re.test(src)) throw new Error("expected map query substring not found");
    return src.replace(re, "$1202%20Cherry%20Lane%2C%20Bootle%2C%20L4%208SG$2");
  },
  "the address"
);

// (2) RULE "agreement" - contact card address diverges from the map (map left
// alone, contact card line changed) on a different, untried page.
inject(
  "RULE agreement - contact card address diverges from the map",
  "modules/service/pages/impetigo-treatment-cherry-lane-walton.html",
  function (src) {
    const re = /(<div class="contact-line"><p>)202 Cherry Lane, Liverpool, L4 8SG(<\/p><\/div>)/;
    if (!re.test(src)) throw new Error("expected contact-line address not found");
    return src.replace(re, "$1202 Cherry Lane, Bootle, L4 8SG$2");
  },
  "agreement"
);

// (3) RULE "encoding" - a raw comma introduced into the map query, breaking
// the embed silently (page still renders, map slot goes empty).
inject(
  "RULE encoding - raw comma injected into the map query",
  "modules/service/pages/sinusitis-treatment-cherry-lane-walton.html",
  function (src) {
    const re = /(maps\?q=)202%20Cherry%20Lane%2C%20Liverpool%2C%20L4%208SG(&output=embed)/;
    if (!re.test(src)) throw new Error("expected map query substring not found");
    return src.replace(re, "$1202%20Cherry%20Lane, Liverpool%2C%20L4%208SG$2");
  },
  "encoding"
);

// (4) RULE "coverage" - a second, duplicate map embed pasted onto a page that
// already has one (the shape of a hand-pasted second map).
inject(
  "RULE coverage - a second map embed pasted onto the page",
  "modules/switch/pages/switch-prescriptions-cherry-lane-walton.html",
  function (src) {
    const m = src.match(/<iframe[^>]*class="map"[^>]*src="[^"]+"[^>]*>[\s\S]*?<\/iframe>/);
    if (!m) throw new Error("expected map iframe not found");
    return src.replace(m[0], m[0] + m[0]);
  },
  "coverage"
);

console.log("");
console.log("=== FINAL: check-map-embeds.js re-run after all restores ===");
const fin = runChecker();
console.log("exit " + fin.code);
if (fin.code !== 0) { console.error("Final run not clean"); process.exit(6); }

console.log("");
console.log("=== FINAL sha256 confirmation, all four targets byte-identical to baseline ===");
targets.forEach(function (t) {
  const now = sha(fs.readFileSync(path.join(REPO, t)));
  const ok = now === baselineSha[t];
  console.log("  " + t + ": " + (ok ? "OK" : "MISMATCH"));
  if (!ok) process.exit(7);
});

console.log("");
console.log("ALL PASSED: 4/4 injections caught by check-map-embeds.js on first attempt, all targets restored byte-identical.");
