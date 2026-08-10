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
      throws that away.
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
// Brand names and INNs for the weight loss and related POM classes.
const MEDICINE_NAMES = [
  "wegovy", "ozempic", "saxenda", "victoza", "rybelsus", "mounjaro",
  "zepbound", "xenical", "orlistat", "alli", "mysimba", "contrave",
  "semaglutide", "tirzepatide", "liraglutide", "phentermine", "duromine",
  "naltrexone", "bupropion", "setmelanotide", "metreleptin",
];

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
    const re = new RegExp(`\\b(?:in|at|near|around)\\s+${escapeRe(bw.word)}\\b`, "gi");
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
