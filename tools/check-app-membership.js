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
    - RULE 8, the GBP packs: a pack whose branch is not an app member claims an
      app in the copy that is pasted into the public Google profile, or in the
      photo shot list; or the pack's paster note states a hasApp value
      branches.json does not hold; or the note says the pack mentions no app
      and the pasted copy does. Added on the item 4.5 quality pass,
      2026-08-14. See the block above RULE 8 for why.
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

// ---- RULE 8: the GBP content packs -----------------------------------------
// WHY (item 4.5 quality pass, 2026-08-14).
//
// This file was written on the 3.8 pass because hasApp "was the only field in
// branches.json that reaches a public page and was read by no checker". It then
// stopped at the generated pages. It never opened gbp-packs/, and neither did
// anything else: "hasApp" appears nowhere in tools/check-gbp-packs.js, all
// 2,417 lines of it, and check-app-membership.js is not among the fourteen
// checkers that read the pack directory.
//
// That left the field unguarded on the surface where it is MOST exposed. Four
// packs actively publish app copy into the business description and the posts
// (clear-aintree, fishlocks-ainsdale, fishlocks-eccleston, smartts-bootle,
// which are exactly the four app members), and ten more carry a paster note
// asserting what branches.json says about this branch. All of it is pasted
// into, or acted on inside, a public Google Business Profile, and none of it
// was read.
//
// Proved by injection on this run, all three restored afterwards:
//   - "You can order repeat prescriptions through our app." added to the
//     business description of scorah-hazel-grove.md (hasApp false), with the
//     stated character count kept honest and the description left at 704 of
//     the 750 limit: ALL 36 CHECKERS PASSED.
//   - the same claim added to that pack's Post B: ALL 36 PASSED.
//   - the reverse, every app claim stripped from the posts of
//     smartts-bootle.md (hasApp true): ALL 36 PASSED.
// Two earlier injections did fire, and neither fired on the app. Adding the
// sentence without correcting the stated count failed the description length
// and count rules, and an "- App ordering:" service bullet failed the
// unrecognised-service rule. Asking which text the checker actually read is
// what separated those from a real guard, and is the discipline recorded on
// the 183rd run.
//
// This is the same shape as the fault this file was created for. There, one
// boolean copy-pasted between two adjacent records would give SK Chemists
// Bootle an app card it does not run while Smartts, 1.5 miles away, silently
// lost the one it does. Here the same flip would leave the pack's note telling
// the paster the opposite of the truth, and the paster acts on the note.
//
// SCOPE. Rule 8a reads only the copy that reaches the public profile: the
// business description, the Services section and the post bodies. The preamble
// and the "Notes for the paster" block are excluded, exactly as the town rule
// in check-gbp-packs.js excludes them, because they are never pasted. That
// exclusion is load-bearing rather than tidy: riddings-timperley.md's note
// tells the paster that the OLD live switch page carries a "Download our app"
// block with App Store and Google Play buttons and must not be copied across.
// A rule that read the whole pack would fail that pack for the sentence
// warning against the very thing this rule exists to stop. The photo shot list
// is read too, by 8b, because a pack telling a paster to photograph an app
// screen for a branch with no app is the same false claim in picture form.
//
// A pack is NOT required to mention the app or to carry the note. Ten packs
// carry the note and two app members do not (fishlocks-ainsdale carries app
// copy and no note, cherry-lane-walton carries neither), and choosing not to
// advertise a service is a marketing decision, not a false claim. Only a
// contradiction fails.
const PACK_DIR = path.join(REPO, "gbp-packs");

// "app" and "apps" as whole words only. Without the boundaries this matches
// "happy", "appointment", "apply" and "appropriate", every one of which is
// ordinary pharmacy copy present in these packs.
const PACK_APP_WORD = /\bapps?\b/i;
const PACK_STORE_NAME = /\bApp Store\b|\bGoogle Play\b/i;
// STORE_RE above is declared /g, and a /g regex carries lastIndex between
// .test() calls, so calling it twice on the same string returns true then
// false. Rule 8 asks the same question of four blocks in every one of fifteen
// packs, so that would have made the answer depend on call order. A
// non-global twin is built from its source rather than the pattern being
// retyped, which is the same reason DAY_SRC exists in check-gbp-packs.js.
const PACK_STORE_URL = new RegExp(STORE_RE.source, "i");

function packSection(text, headingRe) {
  const m = text.match(headingRe);
  if (!m) return "";
  const rest = text.slice(m.index + m[0].length);
  return rest.split(/^## /m)[0];
}

function packClaimsApp(s) {
  return PACK_APP_WORD.test(s) || PACK_STORE_NAME.test(s) || PACK_STORE_URL.test(s);
}

let packsRead = 0;
if (fs.existsSync(PACK_DIR)) {
  fs.readdirSync(PACK_DIR)
    .filter(function (f) { return f.endsWith(".md") && f !== "TEMPLATE.md"; })
    .sort()
    .forEach(function (f) {
      const file = path.join(PACK_DIR, f);
      const text = fs.readFileSync(file, "utf8");
      const where = "gbp-packs/" + f;

      const idm = text.match(/^Branch id:\s*([A-Za-z0-9_]+)/m);
      if (!idm) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "has no \"Branch id:\" line, so its app claims could not be tested against any branch"
        });
        return;
      }
      const b = branches.filter(function (x) { return x.id === idm[1]; })[0];
      if (!b) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "names branch id \"" + idm[1] + "\", which is not in branches.json"
        });
        return;
      }
      packsRead++;
      const isMember = b.hasApp === true;

      // The copy that reaches the public profile. "Button:" lines are cut for
      // the same reason check-gbp-packs.js cuts them when measuring a post:
      // the button is a picker choice and a link, never posted prose.
      const desc = packSection(text, /^## 1\. Business description[^\n]*\n/m);
      const svc = packSection(text, /^## 3\. Services[^\n]*\n/m);
      let posts = packSection(text, /^## 5\. Post drafts[^\n]*\n/m);
      posts = posts.split(/^Notes for the paster:/m)[0];
      posts = posts.split(/\r?\n/).filter(function (l) {
        return !/^\s*Button:/.test(l);
      }).join("\n");
      const published = [desc, svc, posts].join("\n");

      const shots = packSection(text, /^## 4\. Photo shot list[^\n]*\n/m);
      const notes = (text.split(/^Notes for the paster:/m)[1] || "");

      // 8a - the public copy against the field.
      if (!isMember && packClaimsApp(published)) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the copy pasted into the public Google profile claims an app, but branches.json has hasApp false for "
            + b.id + ". A profile advertising an app the branch does not run sends a patient to a store for nothing"
        });
      }

      // 8b - the shot list against the field.
      if (!isMember && packClaimsApp(shots)) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the photo shot list asks for an app shot, but branches.json has hasApp false for " + b.id
        });
      }

      // 8c - the paster note against the field.
      const saysTrue = /hasApp\s+true/i.test(notes);
      const saysFalse = /hasApp\s+false/i.test(notes);
      if (saysTrue && saysFalse) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the paster notes state both hasApp true and hasApp false for this branch"
        });
      } else if (saysTrue && !isMember) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the paster note tells the paster branches.json has hasApp true, but it has false for "
            + b.id + ", so the note invites an app claim onto a profile that must not carry one"
        });
      } else if (saysFalse && isMember) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the paster note tells the paster branches.json has hasApp false, but it has true for "
            + b.id + ", so the branch's own app would be kept off its profile"
        });
      }

      // 8d - the note against the pack it describes.
      if (/No app mention anywhere in this pack/i.test(notes) && packClaimsApp(published)) {
        failures.push({
          rule: "gbp packs",
          where: where,
          text: "the paster note says there is no app mention anywhere in this pack, but the pasted copy carries one"
        });
      }
    });
}

const stale = Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; });

console.log("check-app-membership");
console.log("  " + memberIds.length + " app member(s) of " + branches.length + " branch(es): "
  + (memberIds.join(", ") || "none"));
if (CANON) console.log("  canonical name: \"" + CANON + "\" (read from build-switch-pages.js)");
if (STORE_URLS.length) console.log("  " + STORE_URLS.length + " store URL(s) declared in one generator, hardcoded nowhere else");
console.log("  " + checkedPages + " page(s) in the two families that render hasApp, " + cardPages + " carrying the app");
console.log("  " + packsRead + " GBP pack(s) read for app claims in the copy pasted to the public profile");
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
