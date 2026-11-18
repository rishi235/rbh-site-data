/*
  check-whatsapp-route.js  (added 2026-08-10 on the item 3.13 quality pass, Q21;
  RULE 1 rewired 2026-08-30 when Q21 was answered and applied; RULES 1, 2 and 4
  rewired again 2026-11-18 on the item 4.9 quality pass, twenty-fourth pass -
  see the note below the Q21 paragraph.)

  The WhatsApp destination is the third way a patient can reach a branch from a
  generated page, after the phone number and the callback form. Nothing had ever
  read it.

  Why it exists. Every other contact detail on a page is derived from
  branches.json and guarded: the phone by check-nap, the review link and the
  NHS mailbox by check-branch-links, the booking diary by check-booking-routes.
  The WhatsApp number used to not be in branches.json at all, and was hardcoded
  SEVEN times instead - once as `const WHATSAPP` in each of the five
  service-family generators, and once as `DEFAULT_WHATSAPP` in each of
  modules/service/service.js and modules/switch/switch.js - and it reaches a
  page as the data-wa attribute on the module root, which service.js and
  switch.js read to build the wa.me link behind "Send via WhatsApp instead".

  All seven agreed at the time, which was the whole problem: seven copies that
  agree are indistinguishable from one source of truth right up to the moment
  somebody edits one of them, and then some pages send patient enquiries to a
  number nobody is watching while every visible line on the page still reads
  correctly. Same silent class as the switch pages that were found still
  posting prescription switch requests to a personal inbox (Q13), and the same
  shape as the duplicated switch-page CONFIG raised as Q19.

  Q21 answered this: branches.json now carries a `whatsapp` field per branch
  (all 16 hold 447521775631 today), and the five service-family generators
  read `b.whatsapp` per page instead of declaring their own constant. The two
  module runtime defaults (DEFAULT_WHATSAPP in service.js and switch.js) were
  deliberately left as hardcoded literals, per Rishi's decision, so as not to
  touch the CDN-pinned assets - see the KNOWN-adjacent note on RULE 2 below.
  modules/emar/emar.js's WHATSAPP_E164 remains a genuinely different number,
  unrelated and untouched, see KNOWN.

  THE BUG THIS FILE HAD UNTIL THE ITEM 4.9 TWENTY-FOURTH PASS (2026-11-18):
  the whole point of moving the number into branches.json per branch was to
  let a branch with its own real WhatsApp line (Clear Chemist Aintree is the
  live, standing example - Q21/Q28 - its own site has published 07512 330 076
  for months while branches.json still holds the estate default for it) carry
  its OWN value instead of the shared one. The checker never allowed for that:
  RULE 1 failed the ENTIRE run, all sixteen branches, the moment any single
  branch's declared value differed from the rest, and RULE 4 compared every
  page's data-wa to one global "agreed" number that silently stopped existing
  the moment branches disagreed - so the one page that was supposed to differ
  was never checked against its own branch, and neither was anything else, for
  as long as the divergence lasted. Proven by injection on this pass: setting
  clearchemist_aintree.whatsapp to its own real number failed all 16 branches
  at once, including the 15 that had not changed. Fixed below: RULE 1 no
  longer requires estate-wide agreement, RULE 4 resolves each page to its OWN
  branch (the same brandSlug-townSlug suffix match check-nap.js and
  check-booking-routes.js already use) and compares against that branch's own
  declared value, and RULE 2 compares a runtime default against the MAJORITY
  declared value (what a page with no data-wa would actually reach) and
  reports rather than fails when the estate itself is not unanimous, since at
  that point "agreement" is no longer a single number to be right or wrong
  about.
*/
/*
  What FAILS the run:
    - RULE 1, source agreement: a generator has regressed to hardcoding a
      `const WHATSAPP` literal instead of reading branches.json (declaring one
      again is exactly the pre-Q21 shape this file exists to stop); or
      branches.json is missing a branch's `whatsapp` field. A branch
      legitimately declaring a DIFFERENT number from the rest is no longer a
      failure on its own - that is exactly what the per-branch field exists to
      allow - but see RULE 3 and RULE 4 for what still is.
    - RULE 2, runtime default agreement: REPORTED, not failed, when a module JS
      DEFAULT_WHATSAPP disagrees with the MAJORITY declared value (what a page
      with no data-wa would actually reach). Kept as a report rather than a
      failure once the estate itself is not unanimous, since there is then no
      single number the default could be unconditionally "wrong" against.
    - RULE 3, format: any declared or emitted number is not a UK mobile in
      E.164 without the plus (447 followed by nine digits). wa.me rejects
      anything else, so a malformed value is a dead button, not a wrong one.
    - RULE 4, page agreement: a generated page carries a data-wa that is not
      the number ITS OWN branch declares (resolved by the brandSlug-townSlug
      filename suffix, the same way check-nap.js and check-booking-routes.js
      resolve a page to a branch). A page whose filename resolves to no branch
      fails here too, the same convention those two checkers use.
    - RULE 5, unreplaced token: a generated page still carries a {{TOKEN}}
      placeholder. The DRAFT-*.html copy templates are excluded by name,
      because carrying tokens is what makes them templates.
    - RULE 6, orphan button: a page carries a WhatsApp button but no data-wa on
      its module root, so it would silently fall back to the runtime default
      instead of the number the generator meant to set.

  What is only REPORTED, not failed:
    - a page carrying data-wa with no WhatsApp button and no callback form, so
      the attribute is inert. 29 pages are in that position today (15 travel
      clinic, 14 Pharmacy First overview) and it is not a fault, but it is the
      difference between a page that can be contacted and one that can only be
      booked, which is the substance of Q20.
    - module JS listed in KNOWN below, each with a reason and a question id,
      the same convention as KNOWN_DRIFT in check-cdn-pins.js.

  A KNOWN entry that no longer triggers FAILS the run, so the list cannot rot.

  Run:  node tools/check-whatsapp-route.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

const PAGE_DIRS = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// Module JS that deliberately carries a DIFFERENT WhatsApp number, accepted
// with a reason. Key is the repo-relative path.
const KNOWN = {
  "modules/emar/emar.js":
    "Not a defect and not in scope for the public site. emar.js drives the Borough Care eMAR screens run out of "
    + "Scorah Bramhall, which is a separate function from the branch service pages and answers on its own line. "
    + "It is listed here so the divergence is visible and stays deliberate: if the public number ever changes, "
    + "this entry is the reminder that the eMAR number is a separate decision, not a copy that was missed."
};

// Generators that emit a module root, and are therefore expected to read
// branches.json's whatsapp field per page. build-branch-landing-pages is
// deliberately absent: its pages carry no module root, no booking mount and
// no WhatsApp route.
const GENERATORS = [
  "build-service-pages.js",
  "build-switch-pages.js",
  "build-weight-loss-pages.js",
  "build-travel-clinic-pages.js",
  "build-contraception-pages.js"
];

const E164_UK_MOBILE = /^447\d{9}$/;

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

const failures = [];
const notes = [];
const knownHits = {};

// ---- RULE 1: no generator may hardcode the number again --------------------
// Post-Q21, the number lives in branches.json, not in a per-generator
// constant. A generator that declares `const WHATSAPP = "..."` again has
// regressed to exactly the shape this checker was built to catch, so that is
// now a failure in itself rather than something to read and compare.
GENERATORS.forEach(function (g) {
  const file = path.join(REPO, "tools", g);
  if (!fs.existsSync(file)) {
    failures.push({ rule: "source agreement", where: "tools/" + g, text: "generator is missing" });
    return;
  }
  const src = fs.readFileSync(file, "utf8");
  const m = src.match(/const\s+WHATSAPP\s*=\s*"([^"]*)"/);
  if (m) {
    failures.push({
      rule: "source agreement",
      where: "tools/" + g,
      text: "declares a hardcoded const WHATSAPP = \"" + m[1] + "\" again; Q21 moved this to branches.json's "
        + "whatsapp field, read per branch as b.whatsapp"
    });
  }
});

// ---- RULE 1 (data): branches.json is the source of truth now --------------
// Read as data under test rather than required in, so a branch missing the
// field fails here instead of quietly emitting nothing onto the pages built
// from it. Unlike the pre-2026-11-18 version of this rule, a branch declaring
// a DIFFERENT value from the rest is not itself a failure - see the header
// note on why that used to break the one case (Clear Chemist Aintree) this
// field was meant to let through.
const branchesFile = path.join(REPO, "branches.json");
const branchesData = JSON.parse(fs.readFileSync(branchesFile, "utf8"));
const declared = {};       // "branches.json::<id>" -> number, for reporting
const byBranchId = {};     // "<id>" -> branch object, for RULE 4's page lookup
(branchesData.branches || []).forEach(function (b) {
  if (b.disposed) return;
  const key = "branches.json::" + b.id;
  if (!b.whatsapp) {
    failures.push({ rule: "source agreement", where: key, text: "no whatsapp field" });
    return;
  }
  declared[key] = b.whatsapp;
  byBranchId[b.id] = b;
});

const declaredValues = Object.keys(declared).map(function (k) { return declared[k]; });
const distinctValues = Array.from(new Set(declaredValues));

// The majority value: what MOST branches say. Used only to judge a runtime
// default (RULE 2) and for the summary line - never to judge a page, which
// RULE 4 now checks against its own branch directly. When every branch
// agrees this is simply that one value, the same as the old AGREED.
const counts = {};
declaredValues.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
let MAJORITY = null;
let majorityCount = -1;
Object.keys(counts).forEach(function (v) {
  if (counts[v] > majorityCount) { MAJORITY = v; majorityCount = counts[v]; }
});
const unanimous = distinctValues.length === 1;

// ---- RULE 3 (declarations): format ----------------------------------------
Object.keys(declared).forEach(function (k) {
  if (!E164_UK_MOBILE.test(declared[k])) {
    failures.push({
      rule: "format",
      where: k,
      text: declared[k] + " is not a UK mobile in E.164 without the plus (447 plus nine digits)"
    });
  }
});

// ---- RULE 2: the runtime defaults must agree -------------------------------
// Walk every module JS rather than naming service.js and switch.js, so a new
// module that grows a WhatsApp route is caught the day it appears.
function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  });
  return out;
}

const moduleJs = walk(path.join(REPO, "modules"), []);
const runtime = {};
moduleJs.forEach(function (file) {
  const src = fs.readFileSync(file, "utf8");
  // Same reason as the branches.json values above: capture the value, then
  // judge it, so a malformed default is reported rather than silently unseen.
  const m = src.match(/var\s+(?:DEFAULT_WHATSAPP|WHATSAPP_E164)\s*=\s*"([^"]*)"/);
  if (!m) return;
  const key = rel(file);
  runtime[key] = m[1];

  if (!E164_UK_MOBILE.test(m[1])) {
    failures.push({ rule: "format", where: key, text: m[1] + " is not a UK mobile in E.164 without the plus" });
    return;
  }
  if (MAJORITY && m[1] !== MAJORITY) {
    if (KNOWN[key]) { knownHits[key] = (knownHits[key] || 0) + 1; return; }
    if (unanimous) {
      // Every branch agrees and the runtime default does not: still a hard
      // failure, exactly as before - this is the shape RULE 2 was built for.
      failures.push({
        rule: "runtime default",
        where: key,
        text: "falls back to " + m[1] + " but branches.json agrees on " + MAJORITY
          + ", so a page with no data-wa would reach a different number"
      });
    } else {
      // Branches no longer agree with each other, so there is no single
      // number the default is unconditionally wrong against - reported so
      // it stays visible, not failed.
      notes.push("runtime default " + key + " = " + m[1] + " does not match the majority "
        + "declared value " + MAJORITY + " (" + majorityCount + "/" + declaredValues.length
        + " branches); not failed because branches.json itself is not unanimous - see RULE 1");
    }
  }
});

// Resolve a generated page's filename to its owning branch, the same
// longest-suffix brandSlug-townSlug match check-nap.js and
// check-booking-routes.js already use, so RULE 4 can hold each page to its
// OWN branch's declared number instead of one global value.
function findBranchForFile(file) {
  const stem = file.replace(/\.html$/, "");
  let best = null;
  Object.keys(byBranchId).forEach(function (id) {
    const b = byBranchId[id];
    if (!b.brandSlug || !b.townSlug) return;
    const suffix = b.brandSlug + "-" + b.townSlug;
    if (stem.endsWith(suffix)) {
      if (!best || suffix.length > best.suffix.length) best = { b: b, suffix: suffix };
    }
  });
  return best ? best.b : null;
}

// ---- RULES 4, 5, 6: the generated pages ------------------------------------
let pageCount = 0;
let withWa = 0;
let inert = 0;
const inertPages = [];

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); }).forEach(function (f) {
    const file = path.join(dir, f);
    const src = fs.readFileSync(file, "utf8");
    pageCount++;

    // RULE 5 - unreplaced token anywhere in a generated page.
    const tokens = src.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (tokens) {
      Array.from(new Set(tokens)).forEach(function (t) {
        failures.push({
          rule: "unreplaced token",
          where: rel(file),
          text: "still carries the template placeholder " + t
        });
      });
    }

    const root = src.match(/<div id="rbhs[vw]-root"[^>]*>/);
    const waAttr = src.match(/data-wa="([^"]*)"/);
    const hasButton = /id="(svc-wa|switch-wa|switch-wa-hero)"/.test(src);
    const hasForm = /(Prefer us to call you|Request a callback)/i.test(src);

    // RULE 6 - a button with no destination on the root falls back silently.
    if (hasButton && !waAttr) {
      failures.push({
        rule: "orphan button",
        where: rel(file),
        text: "carries a WhatsApp button but no data-wa on its module root, so it would fall back to the runtime default"
      });
    }

    if (!waAttr) return;
    withWa++;

    // RULE 4 - page agreement, against THIS page's own branch, not a single
    // estate-wide value (which would not exist once branches diverge, and
    // even when they do not, would miss the real check: the branch).
    const owner = findBranchForFile(f);
    if (!owner) {
      failures.push({
        rule: "page agreement",
        where: rel(file),
        text: "filename resolves to no branch in branches.json, so its data-wa cannot be verified"
      });
    } else if (waAttr[1] !== owner.whatsapp) {
      failures.push({
        rule: "page agreement",
        where: rel(file),
        text: 'data-wa="' + waAttr[1] + '" but ' + owner.id + " (its own branch) declares " + owner.whatsapp
      });
    } else if (!E164_UK_MOBILE.test(waAttr[1])) {
      failures.push({
        rule: "format",
        where: rel(file),
        text: 'data-wa="' + waAttr[1] + '" is not a UK mobile in E.164 without the plus'
      });
    }

    if (root && !hasButton && !hasForm) { inert++; inertPages.push(rel(file)); }
  });
});

// A KNOWN entry that no longer fires means the position changed; the entry
// must go, so a stale key fails the run.
// Only judged when branches.json is unanimous. If it is not, RULE 2 never
// fails a runtime default (it only reports), so knownHits cannot be earned
// and every KNOWN entry would look stale for a reason that has nothing to do
// with the entry itself - which would bury the real fault under a misleading
// one.
const stale = unanimous
  ? Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; })
  : [];

console.log("check-whatsapp-route");
console.log("  " + Object.keys(declared).length + " branch(es) declaring whatsapp in branches.json, "
  + Object.keys(runtime).length + " runtime default(s), "
  + withWa + " of " + pageCount + " generated page(s) carry data-wa");
if (unanimous) {
  console.log("  agreed number: " + MAJORITY
    + "  (declared per branch in branches.json, held in no generator constant)");
} else {
  console.log("  branches.json is NOT unanimous: " + distinctValues.length + " distinct value(s) across "
    + declaredValues.length + " branches (majority " + MAJORITY + ", " + majorityCount + " branch(es)); "
    + "each page is still checked against its own branch (RULE 4)");
}
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + " = " + runtime[k] + ": " + KNOWN[k]);
});
notes.forEach(function (n) { console.log("  NOTE  " + n); });
if (inert) {
  const fams = {};
  inertPages.forEach(function (p) {
    const n = p.replace(/^.*\//, "");
    const fam = n.indexOf("travel-clinic-") === 0 ? "travel clinic"
      : n.indexOf("pharmacy-first-") === 0 ? "Pharmacy First overview" : "other";
    fams[fam] = (fams[fam] || 0) + 1;
  });
  console.log("  NOTE  " + inert + " page(s) carry data-wa with no WhatsApp button and no callback form, so the "
    + "attribute is inert and the page can be booked but not contacted: "
    + Object.keys(fams).map(function (k) { return fams[k] + " " + k; }).join(", ") + " (Q20)");
}

if (stale.length) {
  console.log("");
  console.log("FAILURES - KNOWN entries that no longer apply (remove them):");
  stale.forEach(function (k) { console.log("  FAIL  stale KNOWN key: " + k); });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) {
    console.log("  FAIL  [" + f.rule + "] " + f.where + ": " + f.text);
  });
  console.log("");
  console.log("The WhatsApp number lives in branches.json's whatsapp field, per branch. Fix it");
  console.log("there, then regenerate the five service-family generators. Do not fix a page by");
  console.log("hand; the next regeneration overwrites it.");
  process.exit(1);
}
if (stale.length) process.exit(1);

console.log("");
console.log("check-whatsapp-route: clean, every page's WhatsApp route reaches its own branch's number, "
  + Object.keys(knownHits).length + " known exception(s).");
