/*
  check-whatsapp-route.js  (added 2026-08-10 on the item 3.13 quality pass, Q21)

  The WhatsApp destination is the third way a patient can reach a branch from a
  generated page, after the phone number and the callback form. Nothing had ever
  read it.

  Why it exists. Every other contact detail on a page is derived from
  branches.json and guarded: the phone by check-nap, the review link and the
  NHS mailbox by check-branch-links, the booking diary by check-booking-routes.
  The WhatsApp number is not in branches.json at all. It is hardcoded SEVEN
  times - once as `const WHATSAPP` in each of the five service-family
  generators, and once as `DEFAULT_WHATSAPP` in each of modules/service/
  service.js and modules/switch/switch.js - and it reaches a page as the
  data-wa attribute on the module root, which service.js and switch.js read to
  build the wa.me link behind "Send via WhatsApp instead".

  All seven agree today. That is the whole problem: seven copies that agree are
  indistinguishable from one source of truth right up to the moment somebody
  edits one of them, and then some pages send patient enquiries to a number
  nobody is watching while every visible line on the page still reads correctly.
  Same silent class as the switch pages that were found still posting
  prescription switch requests to a personal inbox (Q13), and the same shape as
  the duplicated switch-page CONFIG raised as Q19.
*/
/*
  What FAILS the run:
    - RULE 1, generator agreement: two generators declare different WhatsApp
      constants.
    - RULE 2, runtime default agreement: a module JS DEFAULT_WHATSAPP disagrees
      with the generator constant. That default is what a page falls back to
      when data-wa is missing, so a divergence here is invisible until it fires.
    - RULE 3, format: any declared or emitted number is not a UK mobile in
      E.164 without the plus (447 followed by nine digits). wa.me rejects
      anything else, so a malformed value is a dead button, not a wrong one.
    - RULE 4, page agreement: a generated page carries a data-wa that is not
      the agreed number.
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

// Generators that emit a module root, and are therefore expected to declare
// the number. build-branch-landing-pages is deliberately absent: its pages
// carry no module root, no booking mount and no WhatsApp route.
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

// ---- RULE 1: the generators must agree -------------------------------------
// Read as data under test rather than required in, so a generator that stops
// declaring the constant fails here instead of quietly emitting nothing.
const declared = {};
GENERATORS.forEach(function (g) {
  const file = path.join(REPO, "tools", g);
  if (!fs.existsSync(file)) {
    failures.push({ rule: "generator agreement", where: "tools/" + g, text: "generator is missing" });
    return;
  }
  const src = fs.readFileSync(file, "utf8");
  // Capture whatever is between the quotes, not just digits. Matching \d+ here
  // meant a malformed value ("+447...") failed to match at all, so the checker
  // reported the constant as ABSENT rather than as malformed - it went blind
  // exactly where it needed to be loud. Found on its own negative test.
  const m = src.match(/const\s+WHATSAPP\s*=\s*"([^"]*)"/);
  if (!m) {
    failures.push({
      rule: "generator agreement",
      where: "tools/" + g,
      text: "emits a module root but declares no WHATSAPP constant"
    });
    return;
  }
  declared["tools/" + g] = m[1];
});

const declaredValues = Array.from(new Set(Object.keys(declared).map(function (k) { return declared[k]; })));
if (declaredValues.length > 1) {
  Object.keys(declared).forEach(function (k) {
    failures.push({ rule: "generator agreement", where: k, text: "declares " + declared[k] });
  });
}
// The agreed number: what the generators say, when they say one thing.
const AGREED = declaredValues.length === 1 ? declaredValues[0] : null;

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
  // Same reason as the generator constant above: capture the value, then judge
  // it, so a malformed default is reported rather than silently unseen.
  const m = src.match(/var\s+(?:DEFAULT_WHATSAPP|WHATSAPP_E164)\s*=\s*"([^"]*)"/);
  if (!m) return;
  const key = rel(file);
  runtime[key] = m[1];

  if (!E164_UK_MOBILE.test(m[1])) {
    failures.push({ rule: "format", where: key, text: m[1] + " is not a UK mobile in E.164 without the plus" });
    return;
  }
  if (AGREED && m[1] !== AGREED) {
    if (KNOWN[key]) { knownHits[key] = (knownHits[key] || 0) + 1; return; }
    failures.push({
      rule: "runtime default",
      where: key,
      text: "falls back to " + m[1] + " but the generators emit " + AGREED
        + ", so a page with no data-wa would reach a different number"
    });
  }
});

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

    // RULE 4 - page agreement.
    if (AGREED && waAttr[1] !== AGREED) {
      failures.push({
        rule: "page agreement",
        where: rel(file),
        text: 'data-wa="' + waAttr[1] + '" but the generators emit ' + AGREED
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
// Only judged when the generators agree. If they do not, there is no agreed
// number to compare a runtime default against, so nothing can fire and every
// KNOWN entry would look stale - which would bury the real fault under a
// misleading one.
const stale = AGREED
  ? Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; })
  : [];

console.log("check-whatsapp-route");
console.log("  " + Object.keys(declared).length + " generator constant(s), "
  + Object.keys(runtime).length + " runtime default(s), "
  + withWa + " of " + pageCount + " generated page(s) carry data-wa");
if (AGREED) {
  console.log("  agreed number: " + AGREED
    + "  (declared in " + (Object.keys(declared).length + Object.keys(runtime).length - Object.keys(knownHits).length)
    + " place(s), held in no data file)");
}
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + " = " + runtime[k] + ": " + KNOWN[k]);
});
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
  console.log("The WhatsApp number is not in branches.json, so there is no source to fix it");
  console.log("at. Until Q21 settles where it should live, every copy has to be changed in");
  console.log("the same commit: the five generators, then both module defaults, then");
  console.log("regenerate. Do not fix a page by hand; the next regeneration overwrites it.");
  process.exit(1);
}
if (stale.length) process.exit(1);

console.log("");
console.log("check-whatsapp-route: clean, every WhatsApp route reaches the agreed number, "
  + Object.keys(knownHits).length + " known exception(s).");
