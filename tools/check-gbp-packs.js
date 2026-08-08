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
