#!/usr/bin/env node
/*
  check-gbp-packs.js
  Phase 4 of the audit backlog: verify every GBP content pack in gbp-packs/
  against the pack rules in gbp-packs/TEMPLATE.md and the facts in
  branches.json, the single source of truth. Read-only: reports, changes
  nothing.
  Run from anywhere:  node tools/check-gbp-packs.js
  Exit code 0 = clean, 1 = failures found.
  Checks, per pack:
    - Branch id line present and resolves to a live branch in branches.json
    - Coverage: every non-disposed branch has a pack, no orphan packs
    - Business description under the 750 character GBP limit, and the
      character count the pack states about itself is true
    - No medicine brand names or INNs anywhere (POM advertising is not
      permitted to the public)
    - No efficacy claims
    - No em dashes, no emojis (house style)
    - Every post under the 1,500 character limit
    - Phone and postcode match branches.json; no other branch's phone or
      postcode appears in the pack
    - The five template sections and the four posts are all present
    - The Categories section sets Pharmacy as primary and lists every
      secondary category the branch's services earn (Build Pack v2 4.1)
    - The Services section lists every service the branch's widget set in
      branches.json says it offers, and the description mentions them
      too where the 750 characters allow (Build Pack v2 4.1)
    - And the reverse: no category or service bullet claims something the
      branch's widget set does not give it, so a profile cannot advertise a
      service the shop does not run. Bullets only, so a pack may still say
      in prose that a service is NOT offered, as clear-aintree.md does
    - No pasted copy reads a branch name as if it were a place ("at
      Sandringham"), where that word is in no branch's seoTown and in no
      serviceAreaList. The branch and its town both get named instead
    - The catchment list in the pack leads with the branch's own seoTown,
      the word every page the branch owns leads with, so the profile and
      the site target the same town
    - Shared-domain branches point the GBP profile website at their own
      branch landing page, not at the shared homepage. Master Plan v2
      section 3: two branches on one website cannot rank twice in the same
      map, so the second branch "leans on its own GBP listing and on
      branch-specific landing pages". Two profiles pointing at one homepage
      throws that away. And the other direction: a branch that owns its
      domain outright must carry a Website line and it must be that
      homepage, not a page inside the site
    - The "Name on GBP" line states this branch's trading name from
      branches.json, and not a sister branch's
    - The Photo shot list actually lists at least 10 shots, names the vinyl
      storefront, and tells the paster to action any pending Google updates
      while they are in the profile (Build Pack v2 4.1, TEMPLATE.md
      section 4). Until the item 4.3 quality pass this section was only ever
      checked for its heading
    - A sister branch named in a pack is a real, live branch on the same
      brand, and the sentence names that sister's own seoTown. Two packs
      carry the claim inside the business description, which is pasted
      verbatim into a public Google profile, and it is the one fact in a
      pack that is about ANOTHER branch. A disposal or a rename would leave
      the sentence standing and correct-looking. Found on the item 4.5
      quality pass, 2026-08-11
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PACK_DIR = path.join(ROOT, "gbp-packs");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const branches = data.branches;

const digits = (s) => String(s || "").replace(/\D/g, "");
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Medicine names must not appear in public-facing pharmacy marketing.
// Brand names and INNs for the weight loss and related POM classes. The list
// moved into tools/pom-names.js on the item 3.13 quality pass, 2026-08-11,
// because by then the same class of list had been typed out in three separate
// checkers and a fourth was about to be written. Membership is unchanged.
const MEDICINE_NAMES = require("./pom-names.js").WEIGHT_LOSS;

// Hard efficacy claims. Anything here is a failure, not a style note.
const EFFICACY_FAIL = [
  "guaranteed", "guarantee weight", "best results", "proven results",
  "clinically proven", "miracle", "before and after", "before/after",
  "lose up to", "up to 22.5", "% of your body weight", "percent of your body",
  "fastest way", "rapid weight loss", "melt away", "shed pounds",
  "results you can see", "no side effects", "completely safe", "risk free",
  "risk-free", "cure",
];

// Softer wording worth a human look but not an automatic failure.
const EFFICACY_WARN = [
  "transform", "life changing", "life-changing", "amazing", "incredible",
  "dramatic",
];

const EM_DASH = /[—–―]/;
const EMOJI = /\p{Extended_Pictographic}/u;

// Day names in week order, plus a token that reads every abbreviation the
// packs use. Read by the hours-days rule below. The token is a source string
// rather than a RegExp so it can be built into both a standalone scan and a
// day-range scan without carrying a stale lastIndex between them.
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SRC = "\\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\\b";
const dayIndexOf = (w) => DAY_NAMES.findIndex((d) => d.slice(0, 3).toLowerCase() === w.slice(0, 3).toLowerCase());

// Accepted exceptions to the catchment-order rule, keyed "<branch id>::areaOrder".
// Each needs a reason and a question id, and the check fails on a key that no
// longer breaks its rule, so the list cannot go stale. Same convention as
// KNOWN_SEO_TOWN in check-address-region.js and KNOWN in check-seo-lengths.js.
const KNOWN_AREA_ORDER = {};
const seenAreaKnown = {};

// Accepted exceptions to the branch-name-as-place rule, keyed
// "<branch id>::branchWordAsPlace::<word>". Same anti-rot convention: a key
// that no longer matches a real breach fails the run.
const KNOWN_BRANCH_WORD = {};
const seenBranchWordKnown = {};

// Accepted exceptions to the two "the branch does not offer this" rules, keyed
// "<branch id>::serviceNotOffered::<widget key>" or
// "<branch id>::categoryNotEarned::<category name>". Use one only where the
// branch genuinely runs a service that branches.json does not model yet, and
// say so with a question id. Same anti-rot convention as the maps above: a key
// that no longer matches a real breach fails the run, so the list cannot rot.
const KNOWN_NOT_OFFERED = {};
const seenNotOfferedKnown = {};

// Accepted exceptions to the profile-basics rules, keyed
// "<branch id>::gbpName", "<branch id>::streetAddress",
// "<branch id>::reviewLink" or "<branch id>::profileWebsite". Same anti-rot
// convention: a key that no longer matches a real breach fails the run.
const KNOWN_IDENTITY = {};
const seenIdentityKnown = {};

// Accepted exceptions to the photo shot list rules, keyed
// "<branch id>::photoCount", "<branch id>::photoVinyl" or
// "<branch id>::photoGoogleUpdates". Same anti-rot convention: a key that no
// longer matches a real breach fails the run.
const KNOWN_PHOTOS = {};
const seenPhotosKnown = {};

// Accepted exceptions to the sister-branch rule, keyed
// "<branch id>::sisterBranch". Use one only where a pack deliberately names
// a sister the estate no longer models as one, and say so with a question
// id. Same anti-rot convention: a key that no longer matches a real breach
// fails the run.
const KNOWN_SISTER = {};
const seenSisterKnown = {};

// Accepted exceptions to the hours-days rule, keyed "<branch id>::hoursDays".
// Use one only where a pack deliberately states a day the branch's own
// openingHours does not support, and say so with a question id. Same anti-rot
// convention: a key that no longer matches a real breach fails the run.
const KNOWN_HOURS_DAYS = {};
const seenHoursDaysKnown = {};

const fails = [];
const warns = [];
const stats = [];
const VERBOSE = process.argv.includes("--verbose");
const fail = (file, msg) => fails.push(`${file}: ${msg}`);
const warn = (file, msg) => warns.push(`${file}: ${msg}`);

// A branch is expected to have a pack if it is a real trading branch:
// not disposed, and not the head office (which has no phone or ODS code).
const isPackable = (b) =>
  !b.disposed && b.id !== "rbh_head_office_aintree" && !!b.phone;

const packFiles = fs.readdirSync(PACK_DIR)
  .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md")
  .sort();

// Every .html page this repo generates, by filename. Pack links that point
// at a page not in this set are live-only pages the repo does not build, so
// nothing here can keep them correct.
const GENERATED = new Set();
for (const d of ["service", "switch", "branch"]) {
  const dir = path.join(ROOT, "modules", d, "pages");
  if (fs.existsSync(dir)) fs.readdirSync(dir).forEach((f) => GENERATED.add(f.toLowerCase()));
}

const byId = new Map(branches.map((b) => [b.id, b]));
const seenIds = new Map();

// Branch landing pages, as built by tools/build-branch-landing-pages.js.
// Same slug rule, read from branches.json, so the two cannot drift.
const landingSlug = (b) =>
  b.brandSlug && b.townSlug ? `pharmacy-${b.brandSlug}-${b.townSlug}.html` : null;

// Which website hosts carry more than one live branch. A branch on a shared
// host needs its GBP profile pointed at its own landing page; a branch that
// owns its domain outright is correct to point at the homepage.
const hostCount = new Map();
for (const b of branches) {
  if (b.disposed || !b.website) continue;
  const h = String(b.website).replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  hostCount.set(h, (hostCount.get(h) || 0) + 1);
}

// Every word the estate treats as a place, read from branches.json: every
// branch's seoTown plus every entry in every serviceAreaList. Nothing is
// hardcoded, so a town added to a catchment list becomes a recognised place
// on the next run without anyone editing this file.
const PLACE_WORDS = new Set();
for (const b of branches) {
  if (b.seoTown) PLACE_WORDS.add(String(b.seoTown).toLowerCase());
  for (const t of b.serviceAreaList || []) PLACE_WORDS.add(String(t).toLowerCase());
}

// Branch names that are not places. brandLabel is the trading brand
// ("McCanns Chemist"), so what is left of branchName is the word that tells
// two branches of one brand apart ("Sandringham"). Usually that word is also
// the town, and those are dropped here: only the ones that name no place
// survive, and only those can be misread as a location.
const BRANCH_WORDS = branches
  .filter((b) => isPackable(b) && b.branchName && b.brandLabel)
  .map((b) => ({
    word: b.branchName.replace(b.brandLabel, "").trim(),
    branchName: b.branchName,
    seoTown: b.seoTown || "",
  }))
  .filter((x) => x.word && !PLACE_WORDS.has(x.word.toLowerCase()));

// Section headings the template requires, in order.
const REQUIRED_SECTIONS = [
  /^##\s*1\.\s*Business description/m,
  /^##\s*2\.\s*Categories/m,
  /^##\s*3\.\s*Services section content/m,
  /^##\s*4\.\s*Photo shot list/m,
  /^##\s*5\.\s*Post drafts/m,
];
const REQUIRED_POSTS = [
  /^###\s*Post A\b/m,
  /^###\s*Post B\b/m,
  /^###\s*Post C\b/m,
  /^###\s*Post D\b/m,
];

// Pull the business description body: everything between the section 1
// heading and the next "## " heading, minus the heading line itself.
function descriptionOf(text) {
  const m = text.match(/^##\s*1\.\s*Business description[^\n]*\n([\s\S]*?)(?=^##\s)/m);
  return m ? m[1].trim() : null;
}

// Split the post drafts section into the individual posts, keeping the
// post body only (drop the "Button:" line, which is not posted copy).
function postsOf(text) {
  const sec = text.match(/^##\s*5\.\s*Post drafts[^\n]*\n([\s\S]*)$/m);
  if (!sec) return [];
  const parts = sec[1].split(/^###\s*/m).slice(1);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    const label = nl === -1 ? p.trim() : p.slice(0, nl).trim();
    let body = nl === -1 ? "" : p.slice(nl + 1);
    body = body.split(/^Notes for the paster:/m)[0];
    body = body.replace(/^Button:.*$/gm, "").trim();
    return { label, body };
  });
}

// The "Button:" line of each post, which postsOf deliberately strips out of
// the body so it cannot inflate a character count. Read separately here
// because the button is the only clickable thing on a GBP post, so it is the
// one line on the post that decides where a click actually lands.
function buttonsOf(text) {
  const sec = text.match(/^##\s*5\.\s*Post drafts[^\n]*\n([\s\S]*)$/m);
  if (!sec) return [];
  const parts = sec[1].split(/^###\s*/m).slice(1);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    const label = nl === -1 ? p.trim() : p.slice(0, nl).trim();
    const rest = (nl === -1 ? "" : p.slice(nl + 1)).split(/^Notes for the paster:/m)[0];
    const line = (rest.match(/^Button:.*$/m) || [""])[0].trim();
    const url = (line.match(/https?:\/\/[^\s)"'<>]+/) || [""])[0].replace(/[.,]$/, "");
    const letter = (label.match(/^Post\s+([A-Z])\b/) || [])[1] || "";
    return { label, letter, line, url };
  });
}

// Case-insensitive whole-word search that reports the line it was found on.
function findTerms(text, terms) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const term of terms) {
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    lines.forEach((line, i) => {
      if (re.test(line)) hits.push({ term, line: i + 1, text: norm(line).slice(0, 90) });
    });
  }
  return hits;
}

for (const file of packFiles) {
  const full = path.join(PACK_DIR, file);
  const text = fs.readFileSync(full, "utf8");

  // --- branch identity -----------------------------------------------
  const idm = text.match(/^Branch id:\s*([a-z0-9_]+)/m);
  if (!idm) {
    fail(file, 'no "Branch id: <id>" line, so the pack cannot be checked against branches.json');
    continue;
  }
  const id = idm[1];
  const b = byId.get(id);
  if (!b) {
    fail(file, `branch id "${id}" is not in branches.json`);
    continue;
  }
  if (b.disposed) fail(file, `branch id "${id}" is marked disposed in branches.json`);
  if (seenIds.has(id)) fail(file, `branch id "${id}" is also used by ${seenIds.get(id)}`);
  seenIds.set(id, file);

  // --- structure ------------------------------------------------------
  REQUIRED_SECTIONS.forEach((re, i) => {
    if (!re.test(text)) fail(file, `missing template section ${i + 1}`);
  });
  REQUIRED_POSTS.forEach((re, i) => {
    if (!re.test(text)) fail(file, `missing Post ${"ABCD"[i]}`);
  });

  // --- the GBP profile website on a shared domain -----------------------
  // Master Plan v2 section 3: Fishlocks, McCanns and Scorah each run two
  // branches on one website, so the second branch "leans on its own GBP
  // listing and on branch-specific landing pages". If both profiles point
  // at the same homepage, Google gets one page for two listings and neither
  // profile carries a local target, which is the whole reason the landing
  // pages were built (items 2.2 and 5.2). Only enforced where the landing
  // page actually exists in the repo, so this cannot fail for a branch that
  // has nothing to point at yet.
  const ownHostForSite = String(b.website || "")
    .replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  const slug = landingSlug(b);
  const sharesHost = (hostCount.get(ownHostForSite) || 0) > 1;
  if (sharesHost && slug && GENERATED.has(slug)) {
    const siteLine = (text.match(/^-\s*Website[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
    if (!siteLine) {
      fail(file, `no "- Website" line in the profile basics, so the paster has nothing telling them to use the ${slug} landing page`);
    } else if (!siteLine.toLowerCase().includes(slug)) {
      fail(file, `profile website does not point at this branch's landing page ${slug}. ${ownHostForSite} carries ${hostCount.get(ownHostForSite)} live branches, so pointing the profile at the shared homepage gives both listings the same page (Master Plan v2 section 3)`);
    }
  } else if (!sharesHost && b.website) {
    // The other half of the same rule, and until the item 4.2 quality pass on
    // 2026-08-11 it did not exist. TEMPLATE.md states both directions: a
    // shared-domain branch points the profile at its own landing page, and
    // "a branch that owns its domain outright points at the homepage as
    // normal". Only the first half was enforced, so for the nine branches
    // that own their domain the Website line was never read at all.
    //
    // Two faults that line can carry, both silent. It can be missing, and
    // then the pack tells the paster everything about the profile except
    // where to send the traffic. Or it can point at a deep page, and then
    // every visitor Google sends from the profile lands on one service page
    // instead of the shop's front door: the branch's own homepage stops
    // collecting the profile's traffic and its other services stop being
    // one click away. Neither breaks any rule already here. The foreign-host
    // case is already caught, by the link rule further down, because every
    // website in branches.json carries "pharmacy", "chemist" or "rbhealth"
    // in its host, so that rule reads them all.
    //
    // This is not hypothetical for the website field in particular. The
    // supervised GBP check on 2026-08-09 found Google had silently replaced
    // the website on at least one profile with an NHS page. The pack is what
    // the paster restores the correct value from, so it has to be right and
    // it has to be there.
    const siteLine = (text.match(/^-\s*Website[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
    const key = `${b.id}::profileWebsite`;
    const known = KNOWN_IDENTITY[key];
    const identityFail = (msg) => {
      if (known) { seenIdentityKnown[key] = true; warn(file, `KNOWN ${msg} ${known.question}: ${known.reason}`); }
      else fail(file, msg);
    };
    const onOwnHost = (siteLine.match(/https?:\/\/[^\s)"'<>]+/g) || [])
      .map((u) => u.replace(/[.,]$/, ""))
      .filter((u) => u.replace(/^https?:\/\//, "").split("/")[0].toLowerCase() === ownHostForSite);
    if (!siteLine) {
      identityFail(`no "- Website" line in the profile basics, so the pack tells the paster everything about the profile except where to send its traffic. This branch owns ${ownHostForSite} outright, so the line should carry that homepage (TEMPLATE.md)`);
    } else if (!onOwnHost.length) {
      identityFail(`the "- Website" line carries no address on ${ownHostForSite}, which is this branch's own website in branches.json, so the paster has nothing to set the profile website from.`);
    } else {
      const deep = onOwnHost.filter((u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "").includes("/"));
      if (deep.length) {
        identityFail(`profile website points at "${deep[0]}", a page inside the site rather than the homepage. This branch owns ${ownHostForSite} outright, so TEMPLATE.md sends the profile to the homepage: a deep link hands every visitor Google sends from the profile a single service page instead of the shop's front door. The landing-page rule above is for shared domains only, and ${ownHostForSite} carries one live branch.`);
      }
    }
  }

  // --- categories against the services the branch actually offers -------
  // Build Pack v2 section 4.1 asks for the secondary categories that apply:
  // Travel clinic, Vaccination centre and Weight loss service. The pack is
  // the paster's instruction sheet, so a category missing here is a category
  // that never gets added in GBP, and the profile stays out of those map
  // results. Which ones apply is read from the branch's widget set in
  // branches.json rather than from the pack, so the two cannot drift.
  // Vaccination centre follows the travel clinic: a travel clinic is where
  // the branch gives travel vaccinations, which is what the category names.
  const catSec = (text.match(/^##\s*2\.\s*Categories[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1] || "";
  if (!/primary:\s*pharmacy/i.test(catSec)) {
    fail(file, "Categories section does not set Pharmacy as the primary category");
  }
  const widgets = b.widgets || {};
  const CATEGORY_RULES = [
    { earned: !!widgets.travelClinic, name: "Travel clinic", because: "the branch has a travel clinic" },
    { earned: !!widgets.travelClinic, name: "Vaccination centre", because: "the branch's travel clinic gives vaccinations" },
    { earned: !!widgets.weightLoss, name: "Weight loss service", because: "the branch has a weight loss clinic" },
  ];
  for (const rule of CATEGORY_RULES) {
    if (!rule.earned) continue;
    if (!catSec.toLowerCase().includes(rule.name.toLowerCase())) {
      fail(file, `Categories section does not list "${rule.name}", but ${rule.because} per branches.json (Build Pack v2 section 4.1)`);
    }
  }
  // The same rule the other way round. TEMPLATE.md says a pack must not list
  // a service the branch has no widget for, and until the item 4.8 pass
  // nothing enforced that half: the loops above only ever fired on an
  // OMISSION. A category the branch has not earned is the more expensive
  // direction of the two. An omission costs RBH a listing in one map search.
  // A category or service the branch does not run puts the branch in a search
  // it cannot serve, so somebody travels to the shop for a service that is
  // not there, and Google measures the profile against what patients find.
  // Only the pack's own BULLET LINES are read, not the section prose, because
  // a correct pack may say in a note that a service is NOT offered:
  // clear-aintree.md does exactly that, and reading the whole section would
  // fail the one pack that handles this best.
  // A bullet is a line opening with "- " PLUS the indented lines that wrap it,
  // because every pack wraps at about 70 characters and a category list often
  // runs "- ...: Travel clinic,\n  Weight loss service, Vaccination centre".
  // Reading only the "- " lines would miss the wrapped half and the rule would
  // silently cover a third of what it claims to. Any line that starts back at
  // column 0 without a "- " closes the list, which is what keeps a prose note
  // like clear-aintree.md's "Note: branches.json shows no Pharmacy First..."
  // out of the claim text.
  const bulletsOf = (section) => {
    const out = [];
    let inBullet = false;
    for (const line of String(section || "").split("\n")) {
      if (/^\s*-\s+/.test(line)) { inBullet = true; out.push(line.trim()); continue; }
      if (inBullet && /^\s+\S/.test(line)) { out.push(line.trim()); continue; }
      inBullet = false;
    }
    return out.join(" ");
  };
  const catBullets = bulletsOf(catSec);
  for (const rule of CATEGORY_RULES) {
    if (rule.earned) continue;
    if (catBullets.toLowerCase().includes(rule.name.toLowerCase())) {
      const key = `${b.id}::categoryNotEarned::${rule.name}`;
      if (KNOWN_NOT_OFFERED[key]) { seenNotOfferedKnown[key] = true; continue; }
      fail(file, `Categories section lists "${rule.name}", but branches.json does not give this branch the widget that earns it, so the profile would enter map searches for a service the branch does not run. Remove it, or add the service to branches.json first`);
    }
  }

  // --- services section against the services the branch actually offers --
  // Build Pack v2 section 4.1 asks for the services section to be filled.
  // A service the branch genuinely runs but the pack does not list is a
  // service that never reaches the profile, so it never shows in the map
  // results for that search. As with categories, which services apply is
  // read from the branch's widget set in branches.json, not from the pack,
  // so the two cannot drift. Whitespace is flattened first because packs
  // wrap their lines, and a wrapped "Pharmacy\nFirst" would otherwise read
  // as missing.
  const SERVICE_RULES = [
    { key: "pharmacyFirst", name: "Pharmacy First", re: /pharmacy first/i },
    { key: "bloodPressure", name: "NHS blood pressure check", re: /blood pressure/i },
    { key: "contraception", name: "NHS contraception service", re: /contracept/i },
    { key: "weightLoss", name: "Weight loss clinic", re: /weight loss|weight management/i },
    { key: "travelClinic", name: "Travel clinic", re: /travel/i },
  ];
  const svcSec = norm((text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]);
  const descFlat = norm((text.match(/^##\s*1\.\s*Business description[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]);
  for (const rule of SERVICE_RULES) {
    if (!widgets[rule.key]) continue;
    if (!rule.re.test(svcSec)) {
      fail(file, `Services section does not list "${rule.name}", but branches.json gives this branch a ${rule.key} widget (Build Pack v2 section 4.1)`);
    }
    if (!rule.re.test(descFlat)) {
      warn(file, `business description does not mention "${rule.name}", which branches.json says the branch offers - worth including if the 750 characters allow`);
    }
  }
  // And the reverse, on the service bullets only, for the reason given above
  // the category version: a Services entry for something the branch does not
  // run is a promise made to a patient who then makes a journey for it.
  const svcBullets = norm(bulletsOf((text.match(/^##\s*3\.\s*Services section content[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1]));
  for (const rule of SERVICE_RULES) {
    if (widgets[rule.key]) continue;
    if (!rule.re.test(svcBullets)) continue;
    const key = `${b.id}::serviceNotOffered::${rule.key}`;
    if (KNOWN_NOT_OFFERED[key]) { seenNotOfferedKnown[key] = true; continue; }
    fail(file, `Services section lists "${rule.name}", but branches.json gives this branch no ${rule.key} widget, so the profile would advertise a service the branch does not run. Remove it, or add the service to branches.json first`);
  }

  // --- the photo shot list ------------------------------------------------
  // Until the item 4.3 quality pass on 2026-08-11, section 4 was read for its
  // heading and nothing else: REQUIRED_SECTIONS proved the "## 4. Photo shot
  // list" line existed, and a pack could have carried an empty section under
  // it and passed. Every other section of the pack has a rule behind it, and
  // this is the section Build Pack v2 puts a number on.
  //
  // Three things the section owes the paster, all from Build Pack v2 4.1 and
  // TEMPLATE.md section 4.
  //
  // The count. Build Pack v2 asks for "10+ photos", and TEMPLATE.md turns
  // that into "list 10 shots". Every pack in the estate sits exactly on 10,
  // one on 11, so there is no headroom at all: delete a single bullet while
  // editing a pack and the profile it builds drops under the requirement with
  // nothing to notice. Photo count is one of the few GBP inputs Google
  // measures directly, so a short set costs the profile map ranking, and the
  // pack is the only place the paster is told how many to take.
  //
  // The vinyl. The new storefront vinyl is the one shot that has to be on the
  // profile the day it is fitted, because it is what makes the listing look
  // current, and it is the shot nobody thinks of unless the sheet says so.
  //
  // The pending Google updates. Google queues its own suggested edits against
  // a profile - hours, categories, an address someone "corrected" - and they
  // publish if nobody acts on them. The 2026-08-09 supervised check found
  // Google had silently replaced the website on at least one profile. The
  // paster is already inside the profile when they load the photos, which is
  // the one moment those queued edits are free to clear, so TEMPLATE.md puts
  // the reminder here. mccanns-sandringham.md was missing it, found by this
  // rule and fixed at the same pass.
  const photoSecRaw = (text.match(/^##\s*4\.\s*Photo shot list[^\n]*\n([\s\S]*?)(?=^##\s)/m) || [])[1] || "";
  const photoSec = norm(photoSecRaw);
  const photoBullets = photoSecRaw.split("\n").filter((l) => /^-\s+\S/.test(l)).length;
  const photoFail = (suffix, msg) => {
    const key = `${b.id}::${suffix}`;
    const known = KNOWN_PHOTOS[key];
    if (known) { seenPhotosKnown[key] = true; warn(file, `KNOWN ${msg} ${known.question}: ${known.reason}`); }
    else fail(file, msg);
  };
  const PHOTO_MIN = 10;
  if (photoBullets < PHOTO_MIN) {
    photoFail("photoCount", `Photo shot list names ${photoBullets} shot${photoBullets === 1 ? "" : "s"}, and Build Pack v2 4.1 asks for at least ${PHOTO_MIN}. The pack is the only sheet telling the paster how many photos to take, so a short list is a short profile`);
  }
  if (!/vinyl/i.test(photoSec)) {
    photoFail("photoVinyl", "Photo shot list does not mention the vinyl storefront, which Build Pack v2 4.1 asks for in the photo set and TEMPLATE.md section 4 repeats. It is the shot that makes the listing look current and the one nobody takes unless the sheet says so");
  }
  if (!/pending google update|google updates/i.test(photoSec)) {
    photoFail("photoGoogleUpdates", 'Photo shot list does not remind the paster to action any pending Google updates while they are in the profile (TEMPLATE.md section 4). Google\'s own suggested edits to hours, categories and the address publish themselves if nobody clears them, and loading the photos is the one visit where clearing them is free');
  }

  // --- catchment order: the profile must lead with the branch's own town --
  // seoTown is the word every page this branch owns leads with: its title,
  // its description, its H1 and its areaServed schema. The catchment list in
  // the pack is the same claim made on the GBP profile, and Google reads the
  // profile and the site together. A pack that leads with a different town
  // aims the profile at a town the pages do not target, and where two
  // branches share a domain that is usually the sister branch's own town,
  // which is the overlap the branch landing pages exist to stop.
  //
  // Added by the item 5.7 quality pass on 2026-08-10. Item 5.7 moved McCanns
  // Sandringham's seoTown from Sandringham to St Michael's and regenerated
  // every page the branch owns, but the pack had been drafted on 2026-08-04
  // from the old serviceAreaList order and nothing read the two against each
  // other, so the profile copy still led with Aigburth: the town its sister
  // branch further along the same road already targets. Every other pack in
  // the estate already led with its own seoTown, so this encodes a convention
  // the packs keep rather than inventing one.
  //
  // Only a genuine catchment RUN counts: three or more serviceAreaList towns
  // joined by nothing but commas and "and". Any mention of a town would not
  // do, because McCanns Sandringham sits at 1b Aigburth Road and a street
  // name is an address, not a catchment claim.
  const areaList = (b.serviceAreaList || []).filter(Boolean);
  if (b.seoTown && areaList.length >= 3) {
    // Longest first, so "North Liverpool" wins over "Liverpool".
    const alt = areaList.slice().sort((x, y) => y.length - x.length).map(escapeRe).join("|");
    const runRe = new RegExp(`(?:${alt})(?:\\s*,\\s*(?:${alt}))+(?:\\s*,?\\s+and\\s+(?:${alt}))?`, "g");
    const flat = text.replace(/\s*\n\s*/g, " ");
    const key = `${id}::areaOrder`;
    for (const run of flat.match(runRe) || []) {
      const towns = run.split(/\s*,\s*|\s+and\s+/).map((t) => t.trim()).filter(Boolean);
      if (towns.length < 3) continue;
      if (towns[0] === b.seoTown) continue;
      const known = KNOWN_AREA_ORDER[key];
      if (known) {
        seenAreaKnown[key] = true;
        warn(file, `KNOWN catchment list leads with "${towns[0]}", not this branch's seoTown "${b.seoTown}". ${known.question}: ${known.reason}`);
      } else {
        fail(file, `catchment list leads with "${towns[0]}", but this branch's seoTown in branches.json is "${b.seoTown}", which is the word every page it owns leads with. The profile and the site would target different towns. Found: "${run}"`);
      }
    }
  }

  // --- a branch name used as if it were a place -------------------------
  // Some branches are named after something that is not a town: McCanns
  // Chemist Sandringham is named after the parade it stands on, not a place
  // anybody searches for. Item 5.7 settled that on Rishi's Q15 answer by
  // moving that branch's seoTown to St Michael's, and every page the branch
  // owns now leads with St Michael's, including the sister cross-link on the
  // Aigburth landing page, which reads "McCanns Chemist Sandringham in
  // St Michael's".
  //
  // A pack that writes "in Sandringham" or "at Sandringham" therefore puts a
  // word on the Google profile that the estate's own data does not treat as
  // a place: it is in no branch's seoTown and in no branch's
  // serviceAreaList. Google reads the profile and the site together, so the
  // profile would name a location none of the pages claim, which adds no
  // local signal and contradicts the site. Where two branches share a road
  // and a domain, as the two McCanns do, the sister-branch sentence is also
  // the one line that tells a reader which shop is which, so getting the
  // other branch's town into it is the point of the sentence.
  //
  // Which words count as places is read from branches.json, never hardcoded,
  // so adding a town to a catchment list retires the rule for that word by
  // itself. Only "in/at/near/around <word>" counts: a bare branch name is a
  // name, which is correct usage and must not be flagged.
  //
  // The paster notes are excluded. They are instructions to a human, not
  // copy that gets pasted into GBP, and they need to be able to quote the
  // wrong form in order to warn against it. Same treatment postsOf gives
  // them.
  const pasteable = text.split(/^Notes for the paster:/m)[0].replace(/\s*\n\s*/g, " ");
  for (const bw of BRANCH_WORDS) {
    // "local to" joined the prepositions on the item 4.2 quality pass,
    // 2026-08-11, because a real breach had been sitting behind it since
    // item 5.7 landed. mccanns-sandringham.md told the paster to use the
    // landing page "so the profile stays local to Sandringham", written on
    // 2026-08-04 when Sandringham was still that branch's seoTown. Q15 moved
    // the local word to St Michael's and every generated page followed, but
    // this line did not, and the rule read only in/at/near/around, so the one
    // sentence in the pack that names the town the profile is being aimed at
    // was the one construction it could not see.
    const re = new RegExp(`\\b(?:in|at|near|around|local to)\\s+${escapeRe(bw.word)}\\b`, "gi");
    const hits = pasteable.match(re) || [];
    if (!hits.length) continue;
    const key = `${id}::branchWordAsPlace::${bw.word}`;
    const known = KNOWN_BRANCH_WORD[key];
    if (known) {
      seenBranchWordKnown[key] = true;
      warn(file, `KNOWN "${hits[0]}" reads "${bw.word}" as a place. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `"${hits[0]}" reads "${bw.word}" as a place, but "${bw.word}" is the branch name of ${bw.branchName} and is not a place in branches.json: it is no branch's seoTown and appears in no serviceAreaList. That branch's local word is "${bw.seoTown}", which is what all of its pages lead with. Name the branch and its town, as the landing pages do: "${bw.branchName} in ${bw.seoTown}".`);
    }
  }

  // --- business description length ------------------------------------
  const desc = descriptionOf(text);
  if (desc === null) {
    fail(file, "business description body could not be read");
  } else {
    // GBP counts the pasted description. Packs wrap lines for readability,
    // so join wrapped lines to a single paragraph before counting.
    const oneLine = desc.replace(/\s*\n\s*/g, " ").trim();
    if (oneLine.length > 750) {
      fail(file, `business description is ${oneLine.length} characters, over the 750 GBP limit`);
    }
    // The heading usually states its own count. If it does, it must be true.
    const stated = text.match(/^##\s*1\.\s*Business description[^\n]*?this is (\d+)/mi);
    if (stated) {
      const claimed = Number(stated[1]);
      if (Math.abs(claimed - oneLine.length) > 5) {
        fail(file, `description heading claims ${claimed} characters, actual is ${oneLine.length}`);
      }
    }
  }

  // --- post lengths ----------------------------------------------------
  const postLens = [];
  for (const p of postsOf(text)) {
    const len = p.body.replace(/\s*\n\s*/g, " ").trim().length;
    postLens.push(`${p.label.split(" ")[1] || p.label}=${len}`);
    if (len > 1500) fail(file, `${p.label} is ${len} characters, over the 1,500 limit`);
  }
  stats.push({
    file,
    desc: desc === null ? "n/a" : desc.replace(/\s*\n\s*/g, " ").trim().length,
    posts: postLens.join(" "),
  });

  // --- advertising compliance ------------------------------------------
  for (const h of findTerms(text, MEDICINE_NAMES)) {
    fail(file, `line ${h.line}: medicine name "${h.term}" - POM advertising to the public is not permitted. Context: ${h.text}`);
  }
  for (const h of findTerms(text, EFFICACY_FAIL)) {
    fail(file, `line ${h.line}: efficacy claim "${h.term}". Context: ${h.text}`);
  }
  for (const h of findTerms(text, EFFICACY_WARN)) {
    warn(file, `line ${h.line}: check wording "${h.term}". Context: ${h.text}`);
  }

  // --- house style -------------------------------------------------------
  text.split(/\r?\n/).forEach((line, i) => {
    if (EM_DASH.test(line)) fail(file, `line ${i + 1}: em dash, house style is standard hyphens only. Context: ${norm(line).slice(0, 90)}`);
    if (EMOJI.test(line)) fail(file, `line ${i + 1}: emoji, house style is no emojis. Context: ${norm(line).slice(0, 90)}`);
  });

  // --- facts against branches.json ---------------------------------------
  const packDigits = text.match(/\b0\d[\d\s]{8,13}\b/g) || [];
  const ownPhone = digits(b.phone);
  for (const raw of packDigits) {
    const d = digits(raw);
    if (d.length < 10 || d === ownPhone) continue;
    const other = branches.find((x) => digits(x.phone) === d);
    if (other) fail(file, `phone ${norm(raw)} belongs to ${other.branchName}, not ${b.branchName}`);
    else warn(file, `phone-like number ${norm(raw)} is not ${b.branchName}'s number in branches.json`);
  }
  if (ownPhone && digits(text).indexOf(ownPhone) === -1) {
    fail(file, `branch phone ${b.phone} does not appear anywhere in the pack`);
  }

  // --- pack links against the pages this repo actually generates ---------
  const ownHost = String(b.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  for (const link of text.match(/https?:\/\/[^\s)"'<>]+/g) || []) {
    const clean = link.replace(/[.,]$/, "");
    const host = clean.replace(/^https?:\/\//, "").split("/")[0];
    if (!/pharmacy|chemist|rbhealth/i.test(host)) continue;
    if (ownHost && host.toLowerCase() !== ownHost.toLowerCase()) {
      fail(file, `link points at ${host}, but this branch's website is ${ownHost}: ${clean}`);
      continue;
    }
    const seg = clean.split("/").slice(3).join("/");
    if (!seg) continue;
    if (!/\.html$/i.test(seg)) {
      warn(file, `link has no .html ending, which Weebly pages normally need: ${clean}`);
      continue;
    }
    if (!GENERATED.has(seg.toLowerCase())) {
      warn(file, `link target "${seg}" is not a page this repo generates, so it is a live-only page no checker here can keep correct`);
    }
  }

  // --- post buttons point at this branch's own page ----------------------
  // The link rule above proves every link in the pack is on the right host
  // and that the page exists. It cannot see WHICH page a given post should
  // carry, so a Post D pointing at the weight loss page, or at the SISTER
  // branch's travel page on the same shared host, passes it clean. That
  // matters more than it reads: the button is the only clickable thing on a
  // Google post, Fishlocks, McCanns and Scorah each run two branches on one
  // domain, so on those six packs the wrong leaf is not a 404 that anyone
  // would notice, it is a working page for the wrong pharmacy, and the Q10
  // work on 2026-08-07 pasted these packs into live profiles.
  //
  // The correct page is DERIVED from branches.json rather than listed here,
  // using the same <type>-<brandSlug>-<townSlug>.html rule the generators
  // build with (tools/build-switch-pages.js) and the same rule landingSlug
  // uses above, so a branch renamed in branches.json moves its expected
  // buttons with it and the two cannot drift.
  const pageFor = (kind) =>
    b.brandSlug && b.townSlug ? `${kind}-${b.brandSlug}-${b.townSlug}.html` : null;
  const BUTTON_PAGE = {
    B: { kind: "switch-prescriptions", what: "switch page" },
    C: { kind: "weight-loss-clinic", what: "weight loss clinic page" },
    D: { kind: "travel-clinic", what: "travel clinic page" },
  };
  for (const p of buttonsOf(text)) {
    if (!p.letter) continue;
    if (!p.line) {
      fail(file, `${p.label} has no "Button:" line, so the post would publish with nothing to click and no way through to the page it is about`);
      continue;
    }
    if (!p.url) {
      fail(file, `${p.label} has a "Button:" line carrying no link: ${p.line}`);
      continue;
    }
    const leaf = p.url.split("/").pop().toLowerCase();

    if (p.letter === "A") {
      // Pharmacy First. Two destinations are correct and which one applies is
      // worklist item 5.3's business: the live pfLink in branches.json today,
      // or this branch's own generated page once 5.3 repoints those links.
      // A branch with no pfLink and no pharmacyFirst widget runs no Pharmacy
      // First service at all, so its Post A is a different post (Clear Chemist
      // labels its own "replaces Pharmacy First") and the rule does not apply.
      if (!b.pfLink && !(b.widgets || {}).pharmacyFirst) continue;
      const own = pageFor("pharmacy-first");
      const okPf = !!b.pfLink && p.url === b.pfLink;
      const okOwn = !!own && leaf === own.toLowerCase() && GENERATED.has(own.toLowerCase());
      if (!okPf && !okOwn) {
        fail(file, `${p.label} button goes to "${leaf}", but this branch's Pharmacy First destination in branches.json is ${b.pfLink || "(pfLink not set)"}, and the only other correct target is its own generated page ${own || "(no brandSlug or townSlug)"}`);
      }
      continue;
    }

    const rule = BUTTON_PAGE[p.letter];
    if (!rule) continue;
    const want = pageFor(rule.kind);
    if (!want) {
      fail(file, `branches.json gives this branch no brandSlug or townSlug, so the ${rule.what} ${p.label} should link to cannot be worked out`);
      continue;
    }
    if (leaf !== want.toLowerCase()) {
      fail(file, `${p.label} button goes to "${leaf}", but this branch's ${rule.what} is "${want}", built as <type>-<brandSlug>-<townSlug>.html from branches.json. On a shared domain a wrong leaf is the sister branch's page, which loads fine and sends the click to the wrong pharmacy`);
      continue;
    }
    if (!GENERATED.has(want.toLowerCase())) {
      fail(file, `${p.label} button goes to "${want}", which is the right name for this branch's ${rule.what} but is not a page this repo generates, so the post would publish a button onto a page nothing here builds`);
    }
  }

  const pcRe = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g;
  const ownPc = norm(b.postalCode).toUpperCase().replace(/\s+/g, "");
  const foundPcs = new Set((text.match(pcRe) || []).map((p) => p.toUpperCase().replace(/\s+/g, "")));
  if (ownPc && !foundPcs.has(ownPc)) {
    fail(file, `branch postcode ${b.postalCode} does not appear anywhere in the pack`);
  }
  for (const pc of foundPcs) {
    if (pc === ownPc) continue;
    const other = branches.find((x) => norm(x.postalCode).toUpperCase().replace(/\s+/g, "") === pc);
    if (other) fail(file, `postcode ${pc} belongs to ${other.branchName}, not ${b.branchName}`);
  }

  // --- the street address and the review link ----------------------------
  // Two fields no checker had ever read in a pack, found on the item 4.7
  // quality pass, 2026-08-11. Both are pure copy in a markdown file, so the
  // repo's other guards cannot see them: check-nap and check-jsonld read
  // generated pages, and check-branch-links reads the fields in
  // branches.json rather than anything that quotes them.
  //
  // Both are the same silent class as the map iframe in check-jsonld and the
  // booking chain in check-booking-routes: a wrong value here reads perfectly
  // well, breaks no rule anything else enforces, and only shows up in the
  // world.
  //
  // The street address is the line that puts a pin on Google Maps. It is not
  // hypothetical that a sister branch's number could be pasted into the wrong
  // pack: three brands run two shops each, and McCanns runs both of its shops
  // on ONE road, at 1b Aigburth Road and 112 Aigburth Road. The postcode rule
  // above would not catch a swapped house number, because a pack that quoted
  // the sister's street but its own postcode passes every existing rule.
  //
  // The review link is the line the whole profile is judged on. Every branch's
  // link is https://g.page/r/<opaque id>/review, so two of them differ only in
  // a string no human proof-reads. Paste the sister's and this shop's review
  // requests land on the sister's profile: one profile's rating grows on
  // another's custom, and nothing anywhere reports it. check-branch-links
  // already proves the field in branches.json is well formed and unique per
  // branch, which is exactly why the remaining risk is in the copying.
  const flatText = norm(text).toLowerCase();

  // The name the paster sets on the profile. Added by the item 4.2 quality
  // pass, 2026-08-11, for the same reason as the two fields below: it is a
  // profile-basics line that nothing had ever read.
  //
  // It is the field the whole listing is identified by, and it is the one
  // Google acts on by itself. Its own rule is that the name must be the
  // real-world name of the business, so a name carrying extra service words
  // is a name Google can edit or suspend without asking, and the pack is
  // what the profile gets restored from when it does. Three brands run two
  // shops each, and those pairs differ by a single word, so a pack that
  // states the sister's name renames the wrong shop on Google: exactly the
  // class of fault the street-address rule below was added for.
  //
  // Exact match against branchName in branches.json, the trading name every
  // generated page in the estate already leads with, so the profile and the
  // site cannot claim to be two businesses. Where a listing genuinely needs
  // a different name, KNOWN_IDENTITY takes it with a question id rather than
  // the rule being loosened. Note this reads the pack's INSTRUCTION, not
  // what Google currently shows: cherry-lane-walton.md records in prose that
  // the live listing reads "Cherry Lane Pharmacy - Travel Vaccination and
  // Simple Weight Loss Clinic" and that changing it is a separate decision,
  // which is a pack correctly reporting a divergence, not claiming it.
  const nameLine = (text.match(/^-\s*Name on GBP:[^\n]*(?:\n\s{2,}[^\n]*)*/m) || [])[0] || "";
  const statedName = norm(nameLine.replace(/^-\s*Name on GBP:/, ""));
  const nameKey = `${b.id}::gbpName`;
  const nameKnown = KNOWN_IDENTITY[nameKey];
  const nameFail = (msg) => {
    if (nameKnown) { seenIdentityKnown[nameKey] = true; warn(file, `KNOWN ${msg} ${nameKnown.question}: ${nameKnown.reason}`); }
    else fail(file, msg);
  };
  if (!nameLine) {
    nameFail(`no "- Name on GBP:" line in the profile basics, so the pack does not say what the listing should be called. The trading name in branches.json is "${b.branchName}".`);
  } else if (statedName !== norm(b.branchName)) {
    const other = branches.find((x) => x.id !== b.id && norm(x.branchName) === statedName);
    nameFail(other
      ? `the "- Name on GBP:" line reads "${statedName}", which is ${other.branchName}'s trading name in branches.json, not this branch's "${b.branchName}", so the paster would rename the wrong shop on Google.`
      : `the "- Name on GBP:" line reads "${statedName}", but branches.json gives this branch the trading name "${b.branchName}", which is the name every generated page it owns leads with. Google's own rule is that a listing carries the real-world business name, so the profile and the site must not claim to be two businesses.`);
  }

  const ownStreet = norm(b.streetAddress || "");
  if (ownStreet && flatText.indexOf(ownStreet.toLowerCase()) === -1) {
    const key = `${b.id}::streetAddress`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN branch street address "${b.streetAddress}" does not appear in the pack. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `branch street address "${b.streetAddress}" does not appear anywhere in the pack, so the paster has nothing to set the profile address from`);
    }
  }
  for (const other of branches) {
    if (other.id === b.id) continue;
    const s = norm(other.streetAddress || "");
    // Two entries genuinely share premises (Clear Chemist Aintree and the head
    // office are both Unit 20 Brookfield Trade Centre), so an identical string
    // is not a foreign address at all.
    if (!s || s.toLowerCase() === ownStreet.toLowerCase()) continue;
    if (flatText.indexOf(s.toLowerCase()) === -1) continue;
    const key = `${b.id}::streetAddress`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN pack carries ${other.branchName}'s street address. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `street address "${other.streetAddress}" belongs to ${other.branchName}, not ${b.branchName}, so the profile would put the pin on another branch`);
    }
  }

  const ownReview = norm(b.googleReviewUrl || "");
  if (ownReview && flatText.indexOf(ownReview.toLowerCase()) === -1) {
    const key = `${b.id}::reviewLink`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN branch review link does not appear in the pack. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `branch review link ${b.googleReviewUrl} does not appear anywhere in the pack, so the paster has no way to check the profile points at this branch's reviews`);
    }
  }
  for (const other of branches) {
    if (other.id === b.id) continue;
    const r = norm(other.googleReviewUrl || "");
    if (!r || r.toLowerCase() === ownReview.toLowerCase()) continue;
    if (flatText.indexOf(r.toLowerCase()) === -1) continue;
    const key = `${b.id}::reviewLink`;
    const known = KNOWN_IDENTITY[key];
    if (known) {
      seenIdentityKnown[key] = true;
      warn(file, `KNOWN pack carries ${other.branchName}'s review link. ${known.question}: ${known.reason}`);
    } else {
      fail(file, `review link ${other.googleReviewUrl} belongs to ${other.branchName}, not ${b.branchName}, so this branch's review requests would land on another branch's profile`);
    }
  }

  // --- opening hours on the profile --------------------------------------
  // TEMPLATE.md's first rule names three things that must come from
  // branches.json and nowhere else: "No invented hours, phones or claims."
  // Phones were guarded above, both directions, and postcodes with them.
  // Hours were not read at all until the item 4.9 quality pass on
  // 2026-08-10, although they are the one fact on a Google profile that
  // sends a patient to a locked door, and the profile is where most people
  // read them: tools/check-opening-hours.js guards the generated pages and
  // stops at the repo boundary.
  //
  // Two rules, and which one applies is decided by branches.json.
  //
  // A branch WITH hours: every clock time the pack states must be a time
  // the branch's own openingHours specification contains, and every time in
  // the specification must appear in the pack. A drifted closing time is
  // otherwise invisible, because no other checker reads a pack for it.
  //
  // A branch WITHOUT hours: Clear Chemist Aintree is the only one, and its
  // pack is the model. The rule is a PRESENCE check, that the hours line
  // tells the paster the data is missing and not to paste or guess. It is
  // deliberately not an absence check on clock times, because that would
  // fail the one pack that handles this best: clear-aintree.md quotes the
  // times the branch's own website publishes, as evidence for the question
  // that closes the gap, and quoting evidence is the opposite of inventing
  // hours. Same trap the item 4.8 pass had to design around.
  // The bullet plus every indented line that wraps it. Deliberately NOT a
  // /m regex. These files are CRLF, and under /m JavaScript treats a bare \r
  // as a line terminator, so both /^/ and /$/ fire at every CRLF: a /m
  // lookahead ends the match at the first line break and the rule silently
  // reads one line of a four-line bullet while looking like it read all of
  // it. Every pack wraps its hours at about 70 characters, so under /m this
  // rule would have checked Monday to Friday and never seen Saturday. Same
  // under-reading fault the item 4.8 pass had to design around in the bullet
  // reader above. Without /m, ^ and $ mean start and end of file, which is
  // what the alternation below wants.
  const hoursLine = (text.match(/(?:^|\n)-[ \t]*Hours:[\s\S]*?(?=\r?\n-[ \t]|\r?\n[ \t]*\r?\n|\r?\n##[ \t]|$)/) || [])[0] || "";
  const toMinutes = (h, m, ap) => {
    let hh = Number(h);
    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${m || "00"}`;
  };
  // Two kinds of time in an hours line are not a claim about when the shop
  // is open, and reading them as one would fail the two packs that do this
  // best. A parenthetical marked as history: scorah-hazel-grove.md records
  // "(previously Sat 9:00am to 1:00pm)" so the paster knows to check GBP is
  // not still showing a Saturday that ceased on 24 June 2026, which is the
  // opposite of stating hours. And a quoted span: clear-aintree.md quotes
  // the times the branch's own website publishes as evidence for the
  // question that closes its missing-hours gap. A genuine lunch closure
  // stays in scope, because "(closed 1:00pm to 2:00pm)" carries no history
  // word, and its times are in the specification anyway.
  const hoursClaim = hoursLine
    .replace(/\([^)]*\b(?:previously|formerly|ceased|used to|was)\b[^)]*\)/gi, " ")
    .replace(/"[^"]*"/g, " ");
  const packTimes = new Set();
  for (const m of hoursClaim.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi)) {
    packTimes.add(toMinutes(m[1], m[2], m[3].toLowerCase()));
  }
  const spec = (b.openingHours && b.openingHours.specification) || null;
  if (!hoursLine) {
    fail(file, 'no "- Hours:" line in the profile basics, so the paster has nothing telling them what to set on the profile');
  } else if (spec && spec.length) {
    const dataTimes = new Set();
    for (const s of spec) { dataTimes.add(s.opens); dataTimes.add(s.closes); }
    for (const t of packTimes) {
      if (!dataTimes.has(t)) {
        fail(file, `hours line states ${t}, which is not an opening or closing time in this branch's openingHours in branches.json (${[...dataTimes].sort().join(", ")}). GBP hours send patients to the door, so the pack and the data must agree`);
      }
    }
    for (const t of dataTimes) {
      if (!packTimes.has(t)) {
        fail(file, `branches.json has this branch opening or closing at ${t}, but that time does not appear in the pack's hours line, so the profile would be set from an incomplete picture`);
      }
    }
  } else if (!/not recorded in branches\.json/i.test(hoursLine) ||
             !/do not (paste|invent|guess)/i.test(hoursLine)) {
    fail(file, "branches.json holds no openingHours for this branch, so the hours line must say the data is not recorded and tell the paster not to paste, invent or guess hours. It does not");
  }

  // --- the hours line names the right DAYS, not just the right times -----
  // The rule above reads clock times and nothing else. Days are never read,
  // by it or by anything else in this file, and a Google profile is set day
  // by day. So the estate's loudest hours fault passes every check it has:
  // "Monday to SATURDAY 8:45am to 6:00pm" on the Fishlocks Ainsdale pack
  // states only 08:45 and 18:00, both of which are in that branch's own
  // specification, and every time in the specification appears on the line,
  // so the clock-time rule is satisfied in both directions and the pack
  // publishes a Saturday opening for a shop branches.json holds as closed.
  // That is the locked-door fault the hours rule exists to stop, arriving
  // through the day rather than through the time. It runs the other way
  // too: "Monday to Thursday" drops Friday from the profile silently,
  // because Friday's times are the same as every other weekday's and the
  // clock-time rule cannot tell a missing day from a shared one.
  //
  // Three checks, all composed from branches.json so nothing is hardcoded.
  // A day stated as open must be open in the specification; every day the
  // specification opens must be stated; and a day branches.json holds as
  // closed must be stated as closed, because GBP keeps whatever the profile
  // already says for a day the paster is not told about, which is how a
  // ceased Saturday survives a repaste (scorah-hazel-grove.md exists to
  // stop exactly that, and states both closed days explicitly).
  //
  // Parentheticals are removed before reading, because in this estate a
  // parenthetical is always a lunch closure or a history note and never a
  // day claim: "(closed 1:00pm to 2:00pm)" would otherwise read Monday to
  // Friday as closed on hirshmans-ainsdale.md, and "(previously Sat 9:00am
  // to 1:00pm)" would read a ceased Saturday as a live one. The claim then
  // ends at the first full stop that starts a new sentence, so the paster
  // instructions after it are not read as hours: scorah-hazel-grove.md
  // names Saturday twice more in prose telling the paster to check GBP is
  // not still showing it.
  //
  // Whitespace is collapsed first, for the CRLF reason set out above: every
  // pack wraps this line, and a line-bounded read would see Monday to
  // Friday and never reach the Saturday and Sunday that follow it.
  if (hoursLine && spec && spec.length) {
    const daysClaim = (hoursLine
      .replace(/\([^)]*\)/g, " ")
      .replace(/"[^"]*"/g, " ")
      .replace(/\s+/g, " ")
      .split(/\.\s+(?=[A-Z])|\.\s*$/)[0] || "");
    const expandRanges = (s) =>
      s.replace(new RegExp(`${DAY_SRC}\\s*(?:to|-|through|thru|until)\\s*${DAY_SRC}`, "gi"), (m, a, z) => {
        const from = dayIndexOf(a);
        const to = dayIndexOf(z);
        if (from < 0 || to < 0 || to < from) return m;
        return ` ${DAY_NAMES.slice(from, to + 1).join(" ")} `;
      });
    const claimedOpen = new Set();
    const claimedClosed = new Set();
    for (const seg of daysClaim.split(/[,;]/)) {
      const bucket = /\bclosed\b/i.test(seg) ? claimedClosed : claimedOpen;
      for (const m of expandRanges(seg).matchAll(new RegExp(DAY_SRC, "gi"))) {
        const i = dayIndexOf(m[1]);
        if (i >= 0) bucket.add(DAY_NAMES[i]);
      }
    }
    const dataOpen = new Set();
    for (const s of spec) for (const d of (s.dayOfWeek || [])) dataOpen.add(d);
    const dataClosed = new Set(
      (b.openingHours && b.openingHours.closedDays && b.openingHours.closedDays.length)
        ? b.openingHours.closedDays
        : DAY_NAMES.filter((d) => !dataOpen.has(d))
    );
    const openList = DAY_NAMES.filter((d) => dataOpen.has(d)).join(", ") || "none";
    const breaches = [];
    for (const d of DAY_NAMES) {
      if (claimedOpen.has(d) && !dataOpen.has(d)) {
        breaches.push(`the hours line states the branch is open on ${d}, but branches.json opens it only on ${openList}. A profile that publishes a day the shop is shut sends patients to a locked door`);
      } else if (dataOpen.has(d) && !claimedOpen.has(d)) {
        breaches.push(`branches.json opens this branch on ${d}, but the hours line does not state ${d} as an open day, so the profile would be set from an incomplete picture and that day would be published wrong or left as Google has it`);
      } else if (dataClosed.has(d) && !claimedClosed.has(d) && !claimedOpen.has(d)) {
        breaches.push(`branches.json holds ${d} as a closed day, but the hours line does not state ${d} as closed. GBP keeps whatever the profile already shows for a day the paster is not told about, so a closure the group has made never reaches the listing`);
      }
    }
    if (breaches.length) {
      const key = `${b.id}::hoursDays`;
      const known = KNOWN_HOURS_DAYS[key];
      if (known) {
        seenHoursDaysKnown[key] = true;
        breaches.forEach((br) => warn(file, `KNOWN ${br}. ${known.question}: ${known.reason}`));
      } else {
        breaches.forEach((br) => fail(file, br));
      }
    } else if (KNOWN_HOURS_DAYS[`${b.id}::hoursDays`]) {
      seenHoursDaysKnown[`${b.id}::hoursDays`] = false;
    }
  }

  // --- a lunch closure must tell the paster to enter TWO ranges -----------
  // Seven of the sixteen branches close for lunch, so a weekday appears
  // twice in openingHours.specification. The rule above proves the pack's
  // hours LINE is right and stops there, and that is not the whole journey.
  // A pack can state "9:00am to 1:00pm and 2:00pm to 6:00pm" perfectly and
  // still reach Google as a single 9 to 6 range, because one range per day
  // is what Google's hours editor offers first and adding the second is a
  // step the paster has to know to take. What the profile then says is that
  // the pharmacy is open through the hour it is shut: the same locked-door
  // fault the hours rule exists to stop, arriving through the paster rather
  // than through the data, at the one place most patients actually read.
  //
  // Not hypothetical. Every live page on smarttschemist.co.uk prints
  // 9:00am to 6:00pm for all five weekdays, and the site footer repeats it,
  // for a branch whose NHS-confirmed hours close 1:00pm to 2:00pm (found on
  // the item 3.7 pass, 2026-08-10, and wider than the page Q16 recorded).
  // The habit already exists on the estate's own website. The pack is the
  // last thing standing between it and the profile.
  //
  // Two packs already carry the instruction, so this enforces house
  // practice rather than inventing it: tiffenbergs-aintree.md ("GBP hours
  // need two time ranges per weekday") and gordon-short-crosby.md ("enter
  // split hours in GBP, not 9 to 6 straight through"). Found on the item
  // 4.10 quality pass, 2026-08-10, when the other five split-day packs
  // turned out to say nothing.
  //
  // Whitespace is collapsed before matching, for the CRLF reason set out
  // above and one more: the guidance wraps mid-sentence in
  // gordon-short-crosby.md, so any line-bounded read would miss it and
  // report a pack that does this correctly as a pack that does not.
  const splitDay = (() => {
    if (!spec) return null;
    const seen = {};
    for (const s of spec) {
      for (const d of (s.dayOfWeek || [])) {
        seen[d] = (seen[d] || 0) + 1;
        if (seen[d] > 1) return d;
      }
    }
    return null;
  })();
  if (splitDay) {
    const flat = text.replace(/\s+/g, " ");
    const RANGES = "two (?:separate )?(?:time )?ranges|split hours";
    const tellsPaster =
      new RegExp(`(?:gbp|google|profile)[^.]{0,140}?(?:${RANGES})`, "i").test(flat) ||
      new RegExp(`(?:${RANGES})[^.]{0,140}?(?:gbp|google|profile)`, "i").test(flat);
    if (!tellsPaster) {
      fail(file, `this branch closes for lunch (${splitDay} appears twice in openingHours), so the pack must tell the paster the profile needs two time ranges for that day rather than one. Google's hours editor offers a single range first, and a single range publishes the pharmacy as open through the hour it is shut`);
    }
  }

  // --- a sister branch named in prose must be a real, live sister --------
  // Three packs tell a reader that this shop has a sister branch and name
  // the town it is in. scorah-hazel-grove.md says "Our sister branch is in
  // Bramhall", scorah-bramhall.md says "our sister branch in Hazel Grove is
  // close by", and both of those sentences sit INSIDE the business
  // description, which is pasted verbatim into a public Google profile.
  // mccanns-sandringham.md carries the third in a paster note.
  //
  // Nothing read them. Every other fact in the profile basics is composed
  // from branches.json and guarded - the name, the address, the phone, the
  // postcode, the review link, the profile website, the hours, and since
  // the item 4.4 pass the target of every post button. A sister claim is
  // the one fact in a pack that is about ANOTHER branch, and it was typed
  // by hand and agreed with nothing.
  //
  // The fault it lets through is not hypothetical for this group. Wilmslow
  // was disposed on 1 June 2026, which is why the generators had to learn
  // to skip a disposed branch at item 1.4. A disposal takes a branch out of
  // branches.json's live set and out of every generated page automatically,
  // and it would leave this sentence standing, on a public profile, sending
  // patients to a pharmacy the group no longer owns. A rename does the same
  // thing more quietly: change a seoTown and the sister's own pages all
  // move, while the sentence naming it keeps the old word.
  //
  // Two rules, both composed from branches.json so nothing is hardcoded:
  // a pack may only claim a sister if this branch really has one, meaning
  // another live branch carrying the same brandLabel; and the sentence must
  // name that sister's seoTown. Reading is sentence-bounded and whitespace
  // is collapsed first, for the CRLF reason set out above and because both
  // live examples wrap mid-sentence.
  const flatForSister = text.replace(/\s+/g, " ");
  const sisterSentences = (flatForSister.match(/[^.]*\bsister branch(?:es)?\b[^.]*\./gi) || []);
  if (sisterSentences.length) {
    const sisters = branches.filter(
      (o) => isPackable(o) && o.id !== b.id && o.brandLabel && o.brandLabel === b.brandLabel
    );
    const key = `${b.id}::sisterBranch`;
    const known = KNOWN_SISTER[key];
    const towns = sisters.map((o) => o.seoTown).filter(Boolean);
    const named = sisterSentences.filter((s) =>
      towns.some((t) => new RegExp(`\\b${escapeRe(t)}\\b`, "i").test(s))
    );
    let breach = null;
    if (!sisters.length) {
      breach = `the pack claims a sister branch, but no other live branch in branches.json carries the brand ${b.brandLabel}. A pack description is pasted verbatim into a public Google profile, so this would send patients to a pharmacy the group does not have`;
    } else if (!named.length) {
      breach = `the pack claims a sister branch but names no town belonging to one. This branch's live sisters are ${sisters.map((o) => `${o.branchName} (${o.seoTown})`).join(", ")}, and the sentence reads "${sisterSentences[0].trim()}"`;
    }
    if (breach) {
      if (known) {
        seenSisterKnown[key] = true;
        warn(file, `KNOWN ${breach}. ${known.question}: ${known.reason}`);
      } else {
        fail(file, breach);
      }
    } else if (known) {
      // Recorded here rather than silently ignored: the anti-rot sweep
      // below turns an exception that stopped applying into a failure.
      seenSisterKnown[key] = false;
    }
  }
}

// --- the exception list cannot rot ---------------------------------------
// A KNOWN_AREA_ORDER key that no longer describes a real breach is a note
// nobody will delete and a rule quietly narrowed, so it fails the run. Same
// anti-rot convention as KNOWN_SEO_TOWN, KNOWN_DRIFT and KNOWN_CLAIM.
for (const key of Object.keys(KNOWN_AREA_ORDER)) {
  if (!seenAreaKnown[key]) {
    fails.push(`stale exception: KNOWN_AREA_ORDER["${key}"] no longer matches a pack that breaks the catchment-order rule. Remove it (${KNOWN_AREA_ORDER[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_BRANCH_WORD)) {
  if (!seenBranchWordKnown[key]) {
    fails.push(`stale exception: KNOWN_BRANCH_WORD["${key}"] no longer matches a pack that reads a branch name as a place. Remove it (${KNOWN_BRANCH_WORD[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_NOT_OFFERED)) {
  if (!seenNotOfferedKnown[key]) {
    fails.push(`stale exception: KNOWN_NOT_OFFERED["${key}"] no longer matches a pack claiming a service or category the branch does not have. Remove it (${KNOWN_NOT_OFFERED[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_IDENTITY)) {
  if (!seenIdentityKnown[key]) {
    fails.push(`stale exception: KNOWN_IDENTITY["${key}"] no longer matches a pack with a profile-basics fault in its name, street address, review link or website. Remove it (${KNOWN_IDENTITY[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_PHOTOS)) {
  if (!seenPhotosKnown[key]) {
    fails.push(`stale exception: KNOWN_PHOTOS["${key}"] no longer matches a pack with a short photo shot list, no vinyl storefront shot or no pending-Google-updates reminder. Remove it (${KNOWN_PHOTOS[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_SISTER)) {
  if (!seenSisterKnown[key]) {
    fails.push(`stale exception: KNOWN_SISTER["${key}"] no longer matches a pack claiming a sister branch that is not a live branch on the same brand. Remove it (${KNOWN_SISTER[key].question}).`);
  }
}
for (const key of Object.keys(KNOWN_HOURS_DAYS)) {
  if (!seenHoursDaysKnown[key]) {
    fails.push(`stale exception: KNOWN_HOURS_DAYS["${key}"] no longer matches a pack whose hours line names days the branch's openingHours does not support. Remove it (${KNOWN_HOURS_DAYS[key].question}).`);
  }
}

// --- coverage both ways --------------------------------------------------
for (const b of branches) {
  if (!isPackable(b)) continue;
  if (![...seenIds.keys()].includes(b.id)) {
    fails.push(`coverage: ${b.branchName} (${b.id}) is a live branch with no pack in gbp-packs/`);
  }
}

// --- report ---------------------------------------------------------------
const packable = branches.filter(isPackable).length;
console.log(`check-gbp-packs: ${packFiles.length} packs, ${packable} live branches in branches.json`);
if (VERBOSE) {
  console.log("\nDescription and post character counts (limits: 750 / 1500):");
  stats.forEach((s) => console.log(`  ${s.file.padEnd(28)} desc=${String(s.desc).padStart(3)}  ${s.posts}`));
}
if (warns.length) {
  console.log(`\n${warns.length} warning(s) - human judgement, not automatic failures:`);
  warns.forEach((w) => console.log(`  WARN  ${w}`));
}
if (fails.length) {
  console.log(`\n${fails.length} failure(s):`);
  fails.forEach((f) => console.log(`  FAIL  ${f}`));
  process.exit(1);
}
console.log("\n0 failures.");
