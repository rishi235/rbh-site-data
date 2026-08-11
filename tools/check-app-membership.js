/*
  check-app-membership.js  (added 2026-08-11 on the item 3.8 quality pass)

  hasApp was the only field in branches.json that reaches a public page and was
  read by no checker.

  Why that matters here rather than in the abstract. hasApp decides whether a
  branch's switch page carries the "Download our app" card, with two live store
  buttons, and whether its landing page tells a patient they can manage repeat
  prescriptions in the app. Four branches of sixteen are app members today:
  Fishlocks Ainsdale, Fishlocks Eccleston, Clear Chemist Aintree and Smartts
  Bootle. The other twelve are not, and one of them is SK Chemists Bootle,
  which sits 1.5 miles from Smartts, in the same town, on the same postcode
  prefix, and directly beside it in branches.json. Flip that one boolean by a
  copy-paste between two adjacent records and SK publishes an app card for a
  service it does not run, while Smartts silently loses the one it does. Every
  visible line on both pages still reads correctly and all 22 other checkers
  stay green, because none of them opens the field.

  Same class as the widget diaries found on the 3.7 pass and the NHS review
  link found on the previous 3.8 pass: a per-branch identifier with no rule
  behind it, in a repo whose recurring fault is not wrong data but unpinned
  data.

  A second fault fell out of writing it. The estate named the app two ways.
  build-switch-pages.js says "the RB Healthcare Pharmacy app", which is the
  name on the App Store listing and in the app's own store description on both
  stores. build-branch-landing-pages.js said "the free RB Healthcare app",
  dropping Pharmacy, on the two live Fishlocks landing pages. Fixed at source
  and rule 5 now holds it.

  Three more fields - shortCode, branchNumber and pfBooking - are also read by
  no checker. They are deliberately not covered here: unlike hasApp, no
  generator reads them, so they reach no page and there is nothing public to
  guard. Recorded in the log rather than guessed at.
*/
/*
  What FAILS the run:
    - RULE 1, field present: a branch has no hasApp, or a hasApp that is not a
      real boolean. A missing field is falsey, so it fails closed and silently.
    - RULE 2, switch pages: a switch page carries the app card and its branch
      is not an app member, or is an app member and carries no card. Both
      directions, because presence rules alone cannot see a card on the wrong
      shop.
    - RULE 3, landing pages: same test on the branch landing page sentence.
    - RULE 4, absence elsewhere: any other generated page mentions the app or
      carries a store URL. No service, weight loss, travel clinic or
      contraception page is meant to, so a mention there is a paste that
      escaped its family.
    - RULE 5, one name: public copy naming the app uses the canonical name
      declared by the generator that owns the store buttons. "RB Healthcare
      app" without Pharmacy fails.
    - RULE 6, store URLs: a page carries a store URL that is not one of the two
      the generator declares, or the generator stops declaring them.
    - RULE 7, paste markers: the "*(app member)*" marker in the switch INDEX.md
      and SEO.md names exactly the app-member branches. That marker is what
      tells a paster which page is supposed to have a card, so it drifting is
      how a correct repo still produces a wrong paste.
    - a stale KNOWN key, same convention as KNOWN_DRIFT in check-cdn-pins.js.

  Run:  node tools/check-app-membership.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

const SWITCH_PAGES = path.join(REPO, "modules", "switch", "pages");
const BRANCH_PAGES = path.join(REPO, "modules", "branch", "pages");
const ALL_PAGE_DIRS = [
  SWITCH_PAGES,
  BRANCH_PAGES,
  path.join(REPO, "modules", "service", "pages")
];

// Public copy that may legitimately name the app in a non-canonical way, each
// with a reason and a question id. Empty today. A key that no longer fires
// FAILS the run, so the list cannot rot.
const KNOWN = {};

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

const failures = [];
const knownHits = {};

// ---- the generators, read as data under test -------------------------------
// The canonical name and the store URLs are READ from the generator that owns
// the app card rather than mirrored into a literal here. A checker holding its
// own copy of the string it is checking is the fault this repo has now found
// three times (check-seo-pattern's condition slugs, check-cdn-pins' page list,
// check-whatsapp-route's number).
const switchGenPath = path.join(REPO, "tools", "build-switch-pages.js");
const landingGenPath = path.join(REPO, "tools", "build-branch-landing-pages.js");

let CANON = null;
let STORE_URLS = [];

if (!fs.existsSync(switchGenPath)) {
  failures.push({ rule: "generator", where: "tools/build-switch-pages.js", text: "generator is missing" });
} else {
  const src = fs.readFileSync(switchGenPath, "utf8");
  const nameMatch = src.match(/class="app-copy">[^<]*?through the ([^<.]+?)\./);
  if (!nameMatch) {
    failures.push({
      rule: "generator",
      where: "tools/build-switch-pages.js",
      text: "owns the app card but no app name could be read out of its app-copy line"
    });
  } else {
    CANON = nameMatch[1].trim();
  }
  const urls = src.match(/https:\/\/(?:apps\.apple\.com|play\.google\.com)[^"']+/g) || [];
  STORE_URLS = Array.from(new Set(urls));
  if (STORE_URLS.length !== 2) {
    failures.push({
      rule: "store urls",
      where: "tools/build-switch-pages.js",
      text: "declares " + STORE_URLS.length + " store URL(s), expected exactly 2 (App Store and Google Play)"
    });
  }
}

// ---- RULE 1: the field itself ----------------------------------------------
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const branches = data.branches || [];
const members = {};   // "brandSlug-townSlug" -> true/false
const memberIds = [];

branches.forEach(function (b) {
  const key = b.brandSlug + "-" + b.townSlug;
  if (!Object.prototype.hasOwnProperty.call(b, "hasApp")) {
    failures.push({
      rule: "field present",
      where: "branches.json / " + b.id,
      text: "has no hasApp field, so it reads as not-an-app-member without ever saying so"
    });
    return;
  }
  if (typeof b.hasApp !== "boolean") {
    failures.push({
      rule: "field present",
      where: "branches.json / " + b.id,
      text: "hasApp is " + JSON.stringify(b.hasApp) + ", which is not a boolean"
    });
    return;
  }
  members[key] = b.hasApp;
  if (b.hasApp) memberIds.push(b.id);
});

// ---- helpers ---------------------------------------------------------------
function keyForFile(name) {
  const stem = name.replace(/\.html$/, "");
  let best = null;
  Object.keys(members).forEach(function (k) {
    if (stem.length >= k.length && stem.slice(-k.length) === k) {
      if (!best || k.length > best.length) best = k;
    }
  });
  return best;
}

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); });
}

// ---- RULES 2 and 3: the two families that render hasApp --------------------
let checkedPages = 0;
let cardPages = 0;

function checkFamily(dir, ruleName, detect, describe) {
  listHtml(dir).forEach(function (f) {
    const file = path.join(dir, f);
    const src = fs.readFileSync(file, "utf8");
    const key = keyForFile(f);
    if (key === null) {
      // An untypable page is a FAILURE, not a skip. A page nothing can match
      // to a branch and a page that passes used to look identical.
      failures.push({
        rule: ruleName,
        where: rel(file),
        text: "cannot be matched to a branch in branches.json, so its app state was never tested"
      });
      return;
    }
    checkedPages++;
    const has = detect(src);
    if (has) cardPages++;
    const want = members[key];
    if (has && !want) {
      failures.push({
        rule: ruleName,
        where: rel(file),
        text: describe + " but branches.json says this branch is not an app member"
      });
    } else if (!has && want) {
      failures.push({
        rule: ruleName,
        where: rel(file),
        text: "is an app member in branches.json but the page carries no " + describe.replace(/^carries the /, "")
      });
    }
  });
}

checkFamily(SWITCH_PAGES, "switch pages",
  function (s) { return /class="app-card"/.test(s); },
  "carries the app card");

checkFamily(BRANCH_PAGES, "landing pages",
  function (s) { return /Manage everything in the/.test(s); },
  "carries the app sentence");

// ---- RULES 4, 5 and 6: every generated page, plus the paste sheets ---------
// Rule 4 is the absence half. Rules 2 and 3 only ever open two folders, so a
// mention that lands in the service family would never be read by them.
const APP_MENTION = /RB Healthcare(?: Pharmacy)? app/gi;
const STORE_RE = /https:\/\/(?:apps\.apple\.com|play\.google\.com)[^"'\s)]+/g;

function scanCopy(file, isAppFamily) {
  const src = fs.readFileSync(file, "utf8");
  const where = rel(file);

  const mentions = src.match(APP_MENTION) || [];
  const stores = src.match(STORE_RE) || [];

  if (!isAppFamily && (mentions.length || stores.length)) {
    failures.push({
      rule: "absence elsewhere",
      where: where,
      text: "mentions the app or carries a store URL, and no page in this family is meant to"
    });
    return;
  }

  // RULE 5 - one name.
  mentions.forEach(function (m) {
    if (CANON && m.toLowerCase() !== CANON.toLowerCase()) {
      if (KNOWN[where]) { knownHits[where] = (knownHits[where] || 0) + 1; return; }
      failures.push({
        rule: "one name",
        where: where,
        text: 'names the app "' + m + '" but the generator that owns the store buttons calls it "' + CANON + '"'
      });
    }
  });

  // RULE 6 - store URLs.
  stores.forEach(function (u) {
    if (STORE_URLS.length === 2 && STORE_URLS.indexOf(u) === -1) {
      failures.push({
        rule: "store urls",
        where: where,
        text: "carries a store URL the generator does not declare: " + u
      });
    }
  });
}

ALL_PAGE_DIRS.forEach(function (dir) {
  const isAppFamily = (dir === SWITCH_PAGES || dir === BRANCH_PAGES);
  listHtml(dir).forEach(function (f) { scanCopy(path.join(dir, f), isAppFamily); });
});

// The paste sheets are public-facing instructions rather than public copy, but
// they carry the same strings and nothing had read them either.
[SWITCH_PAGES, BRANCH_PAGES].forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".md"); })
    .forEach(function (f) { scanCopy(path.join(dir, f), true); });
});

// ---- RULE 7: the paster's marker -------------------------------------------
// "*(app member)*" is what tells whoever pastes into Weebly that this page is
// supposed to have a card. A correct page and a wrong marker still produces a
// wrong paste, so the marker is checked against the same field the page is.
const MEMBER_COUNT = branches.filter(function (b) { return b.hasApp === true; }).length;
// The headings in INDEX.md join brand and town with an em dash. This file
// stays pure ASCII, so the dash class is written as escapes rather than typed.
const DASH_SPLIT = new RegExp("[\\u002D\\u2010-\\u2015]");

["INDEX.md", "SEO.md"].forEach(function (name) {
  const file = path.join(SWITCH_PAGES, name);
  if (!fs.existsSync(file)) {
    failures.push({ rule: "paste markers", where: "modules/switch/pages/" + name, text: "paste sheet is missing" });
    return;
  }
  const src = fs.readFileSync(file, "utf8");
  const marked = (src.match(/^## (.+?)\s+\*\(app member\)\*/gm) || [])
    .map(function (l) { return l.replace(/^## /, "").replace(/\s+\*\(app member\)\*.*$/, "").trim(); });
  if (marked.length !== MEMBER_COUNT) {
    failures.push({
      rule: "paste markers",
      where: rel(file),
      text: "marks " + marked.length + " page(s) as app members but branches.json has "
        + MEMBER_COUNT + " (" + memberIds.join(", ") + ")"
    });
  }
  // Every marked heading must belong to a branch that really is a member, and
  // it has to match on BRAND as well as town. Checking the town alone is not
  // enough in a town two brands trade in: Bootle holds both Smartts, which is
  // a member, and SK Chemists, which is not, so a marker that slid from one
  // heading to the other would have read as correct. Found by its own
  // negative test.
  marked.forEach(function (h) {
    const parts = h.split(DASH_SPLIT);
    const town = parts.pop().trim();
    const brand = parts.join("-").trim();
    const ok = branches.some(function (b) {
      return b.hasApp === true && b.seoTown === town && b.brandLabel === brand;
    });
    if (!ok) {
      failures.push({
        rule: "paste markers",
        where: rel(file),
        text: '"' + h + '" is marked as an app member and branches.json does not agree'
      });
    }
  });
});

// ---- the landing generator must gate on the field, not on a hardcoded list -
if (fs.existsSync(landingGenPath)) {
  const lsrc = fs.readFileSync(landingGenPath, "utf8");
  if (/RB Healthcare(?: Pharmacy)? app/i.test(lsrc) && !/hasApp/.test(lsrc)) {
    failures.push({
      rule: "landing pages",
      where: "tools/build-branch-landing-pages.js",
      text: "names the app but no longer gates it on hasApp, so every landing page would claim it"
    });
  }
}

const stale = Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; });

console.log("check-app-membership");
console.log("  " + memberIds.length + " app member(s) of " + branches.length + " branch(es): "
  + (memberIds.join(", ") || "none"));
if (CANON) console.log("  canonical name: \"" + CANON + "\" (read from build-switch-pages.js)");
if (STORE_URLS.length) console.log("  " + STORE_URLS.length + " store URL(s) declared in one generator, hardcoded nowhere else");
console.log("  " + checkedPages + " page(s) in the two families that render hasApp, " + cardPages + " carrying the app");
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + ": " + KNOWN[k]);
});

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
  console.log("Fix hasApp in branches.json, or the copy in the generator that owns it, then");
  console.log("regenerate. Do not edit a page by hand: the app card and the app sentence are");
  console.log("both emitted, and the next build overwrites anything typed into a page.");
  process.exit(1);
}
if (stale.length) process.exit(1);

console.log("");
console.log("check-app-membership: clean, every app card and app sentence matches hasApp, "
  + Object.keys(knownHits).length + " known exception(s).");
