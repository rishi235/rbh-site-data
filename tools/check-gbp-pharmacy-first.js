#!/usr/bin/env node
"use strict";

// check-gbp-pharmacy-first.js
//
// Guards the Pharmacy First CLINICAL copy inside the GBP content packs:
// which conditions a pack names, the ages it attaches to them, and the
// promise it makes about them.
//
// WHY THIS EXISTS (item 4.4 quality pass, 2026-08-14).
// tools/check-gbp-packs.js is 2,360 lines and reads every FACT in a pack:
// name, address, house number, post town, postcode, phone, hours, days,
// day-time pairing, review link, profile website, categories, service
// labels, catchment towns, button targets, button labels, post length,
// pricing, medicine names and efficacy claims. It reads not one condition
// name. Proved by scanning it: "sinusitis", "sore throat", "earache",
// "impetigo", "shingles" and "insect bite" appear nowhere in that file.
//
// Fourteen of the fifteen packs publish the seven Pharmacy First conditions
// twice each, once in the Services section and once in Post A, and both
// blocks are pasted verbatim into a public Google Business Profile. So the
// clinical scope of an NHS service was stated 28 times in public copy and
// read by nothing. A pack that dropped a condition, added an eighth, or
// attached the wrong age range would publish a wrong clinical claim on a
// Google profile with all 34 checkers green.
//
// This is the same shape as the gap the item 3.11 pass closed one run
// earlier on the generated pages (tools/check-pharmacy-first-symptoms.js):
// clinical copy composed once, rendered many times, guarded nowhere. The
// generated pages now have four clinical checkers (symptoms, eligibility,
// safety net, cost). The packs had none.
//
// SCOPE DISCIPLINE. The lesson recorded on the 183rd run, after the first
// draft of the symptoms checker fired on 28 clean pages, is: when a checker
// fires OR passes, ask WHICH TEXT IT READ. A rule that reads a whole pack
// cannot be right here, because a branch may one day legitimately offer a
// SHINGLES VACCINATION, which is a private travel or NHS vaccination
// service and not Pharmacy First at all. So every clinical rule below reads
// the Pharmacy First blocks only, located structurally, and a condition
// word found outside those blocks is handled by its own rule with a
// deliberate exception list rather than by silence.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PACK_DIR = path.join(ROOT, "gbp-packs");
const GENERATOR = path.join(__dirname, "build-service-pages.js");

const fails = [];
const fail = (file, msg) => fails.push(`${file}: ${msg}`);

// ---------------------------------------------------------------------------
// The canon, read from the generator that builds the live condition pages.
//
// Not copied. Read. tools/build-service-pages.js owns CONDITIONS and
// CONDITION_ORDER and renders them onto 98 live condition pages, so reading
// the same declarations here means the packs and the site cannot drift: a
// pathway added, removed or renamed for the site is seen by this file on the
// next run. Requiring the generator would REGENERATE every page as a side
// effect, so only the declaration head is taken, which is everything above
// and including CONDITION_ORDER and contains no file write.
// ---------------------------------------------------------------------------
function loadCanon() {
  const src = fs.readFileSync(GENERATOR, "utf8");
  const lines = src.split(/\r?\n/);
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^const CONDITION_ORDER\s*=/.test(lines[i])) { end = i; break; }
  }
  if (end < 0) {
    throw new Error(
      'tools/build-service-pages.js no longer declares CONDITION_ORDER at the top level. ' +
      'That declaration is what this checker reads the Pharmacy First canon from, so the ' +
      'pack copy would silently stop being compared against the site. Restore it, or point ' +
      'loadCanon() at whatever replaced it.'
    );
  }
  const head = lines.slice(0, end + 1).join("\n");
  const fn = new Function(
    "require", "module", "exports", "__dirname", "__filename",
    head + "\nreturn { CONDITIONS, CONDITION_ORDER };"
  );
  return fn(require, { exports: {} }, {}, __dirname, GENERATOR);
}

let CONDITIONS, CONDITION_ORDER;
try {
  ({ CONDITIONS, CONDITION_ORDER } = loadCanon());
} catch (err) {
  console.error("check-gbp-pharmacy-first: " + err.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Lay synonyms.
//
// The canon names a pathway as clinical shorthand ("UTI", "Infected insect
// bite"). A pack writes for a patient reading a Google profile ("uncomplicated
// water infections in women"). Both are correct copy, so the matcher has to
// know both. The canon name and longName are always accepted; the entries
// below add only the lay forms the packs actually use.
//
// PINNED BOTH WAYS by rule 1 below: a pathway added to CONDITION_ORDER with no
// entry here fails the run rather than quietly becoming unmatchable, which
// would turn the completeness rule vacuous for that condition.
// ---------------------------------------------------------------------------
const SYNONYMS = {
  "uti": [/\buncomplicated UTIs?\b/i, /\bUTIs?\b/i, /\bwater infections?\b/i, /\burinary tract infections?\b/i],
  "sore-throat": [/\bsore throats?\b/i],
  "sinusitis": [/\bsinusitis\b/i],
  "earache": [/\bearache\b/i, /\bear infections?\b/i],
  "impetigo": [/\bimpetigo\b/i],
  "shingles": [/\bshingles\b/i],
  "insect-bite": [/\binfected insect bites?\b/i, /\binsect bites?\b/i],
};

// Conditions a pharmacy plausibly treats or advises on but which are NOT in
// the Pharmacy First seven. Naming one inside Pharmacy First copy tells a
// patient the NHS will assess it free of charge at this counter, which it will
// not, and sends them on a wasted journey. Blocklist by design: these are the
// specific drafting errors worth naming in the failure message.
const OUTSIDE_PF = [
  "conjunctivitis", "cystitis", "thrush", "hay fever", "eczema", "acne",
  "chest infection", "tonsillitis", "cold sore", "head lice", "threadworm",
  "ringworm", "chickenpox", "scabies", "ear wax", "athlete's foot",
];

// Condition words that may legitimately appear OUTSIDE the Pharmacy First
// blocks, keyed "<pack file>::<pathway key>". Empty today, and rule 10
// explains what to do when it should not be. Every entry carries the question
// or reason that justified it, and stale entries are reported by rule 11 so
// the list cannot outlive the copy it excuses.
const KNOWN_NON_PF = {
  // "scorah-bramhall.md::shingles": { reason: "shingles vaccination is a private service, not Pharmacy First", question: "Qnn" },
};
const usedNonPf = new Set();

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten"];

// ---------------------------------------------------------------------------
// Locating the Pharmacy First blocks.
//
// Structural, not keyword based. A keyword search for "Pharmacy First" would
// pull in the paster notes, the pfLink URL and the post button, none of which
// are patient-facing prose, and would miss a condition list that had drifted
// out of its bullet. These two blocks are the copy a patient actually reads.
// ---------------------------------------------------------------------------
// Line endings are normalised to \n before anything reads a pack, and the
// rest of this file only ever sees the normalised text.
//
// THIS IS NOT TIDINESS, it is the fix for the defect this checker's first run
// found in itself. The packs are stored CRLF. In a JavaScript regex with the
// m flag, $ matches at EVERY line terminator, and \r is a line terminator, so
// the "end of block" alternative in both patterns below fired at the end of
// the block's FIRST PHYSICAL LINE. Both scopes collapsed to one line each.
//
// The visible symptom was rule 9 reporting all seven conditions in all
// fourteen packs, 98 failures on clean copy. The dangerous symptom was
// silent: with only the first line in scope, rules 3 to 8 saw no condition
// at all, took their "names nothing, skip" branch, and did nothing, while
// the checker reported success. A green checker reading one line in ten is
// worse than no checker, because it retires the question.
//
// So $ is gone, replaced by (?![\s\S]), which is true end of input and
// nothing else, and the text is normalised so \r cannot end a line anywhere.
// Rule 2b below then refuses to accept a located block that names no
// condition, which is the structural assertion that would have caught this
// without anyone reading the regex.
const normalise = (s) => s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

function pfScopes(text) {
  const out = [];

  // The Services section bullet. Runs from its own "- " to the next "- ",
  // the next non-bullet label line ("Private services:") or the next heading.
  const svc = text.match(
    /^-[ \t]*NHS Pharmacy First:[\s\S]*?(?=\n-[ \t]|\n[A-Za-z][^\n]*:[ \t]*\n|\n##[ \t]|(?![\s\S]))/m
  );
  if (svc) {
    out.push({
      label: 'Services section "NHS Pharmacy First" bullet',
      body: svc[0],
      raw: svc[0],
    });
  }

  // Post A, body only: the heading names the post and the "Button:" line is
  // a paster instruction, so neither is patient prose.
  //
  // body and raw are kept apart deliberately, and the first draft of this
  // file got it wrong. RULE 9 subtracts the Pharmacy First blocks from the
  // pack before looking for stray condition words, and it subtracts by
  // matching the span back against the source. body has the "Button:" line
  // filtered out, so it no longer appears verbatim in the pack and the
  // subtraction silently did nothing: Post A survived into the "outside"
  // text, and rule 9 reported all seven conditions in all fourteen packs, 98
  // failures on copy that is completely clean. raw is the untouched span, so
  // subtraction works on it; body is what the clinical rules read.
  const postA = text.match(/^###[ \t]+Post A\b[^\n]*\n([\s\S]*?)(?=\n###[ \t]|\nNotes for the paster|\n##[ \t]|(?![\s\S]))/m);
  if (postA) {
    const body = postA[1].split(/\n/).filter((l) => !/^[ \t]*Button:/.test(l)).join("\n");
    out.push({ label: "Post A", body, raw: postA[0] });
  }

  return out;
}

const flat = (s) => s.replace(/\s+/g, " ").trim();
const namesAny = (key, s) => {
  const c = CONDITIONS[key];
  const res = (SYNONYMS[key] || []).slice();
  if (c && c.name) res.push(new RegExp("\\b" + c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i"));
  if (c && c.longName) res.push(new RegExp("\\b" + c.longName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i"));
  return res.some((re) => re.test(s));
};

// ---------------------------------------------------------------------------
// RULE 1. The two-way pin on the canon.
//
// A pathway added to the site with no synonym entry here would be unmatchable,
// so the completeness rule would pass a pack that never mentions it. That is
// the failure mode that makes a checker look green while doing nothing, and it
// is the one this repo has now hit four times, so it gets a rule of its own.
// ---------------------------------------------------------------------------
const canonKeys = Object.keys(CONDITIONS);
for (const k of CONDITION_ORDER) {
  if (!canonKeys.includes(k)) {
    fail("tools/build-service-pages.js", `CONDITION_ORDER lists "${k}" but CONDITIONS has no such pathway`);
  }
  if (!SYNONYMS[k]) {
    fail("tools/check-gbp-pharmacy-first.js", `pathway "${k}" is in CONDITION_ORDER but has no SYNONYMS entry here, so no pack could ever be shown to name it and rule 3 would pass every pack vacuously for this condition. Add the lay wording the packs use`);
  }
}
for (const k of canonKeys) {
  if (!CONDITION_ORDER.includes(k)) {
    fail("tools/build-service-pages.js", `CONDITIONS defines "${k}" but CONDITION_ORDER omits it, so it is built but never ordered`);
  }
}
for (const k of Object.keys(SYNONYMS)) {
  if (!CONDITION_ORDER.includes(k)) {
    fail("tools/check-gbp-pharmacy-first.js", `SYNONYMS has an entry for "${k}", which is no longer a pathway in CONDITION_ORDER. Remove it, or the packs are being checked against a condition the site no longer runs`);
  }
}

// ---------------------------------------------------------------------------
// branches.json, to decide which packs OUGHT to carry Pharmacy First copy.
// ---------------------------------------------------------------------------
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
const branches = Array.isArray(raw) ? raw : (raw.branches || Object.values(raw)[0]);
const byId = new Map(branches.map((b) => [b.id, b]));

const packFiles = fs.readdirSync(PACK_DIR)
  .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md")
  .sort();

let packsWithPfWidget = 0;
let packsRead = 0;
let scopesRead = 0;

for (const file of packFiles) {
  const rel = "gbp-packs/" + file;
  const text = normalise(fs.readFileSync(path.join(PACK_DIR, file), "utf8"));

  const idm = text.match(/^[ \t]*Branch id:[ \t]*([A-Za-z0-9_]+)/m);
  if (!idm) continue; // check-gbp-packs.js owns the missing-id failure
  const b = byId.get(idm[1]);
  if (!b || b.disposed) continue;

  const hasPf = !!(b.widgets && b.widgets.pharmacyFirst);
  if (hasPf) packsWithPfWidget++;

  const scopes = pfScopes(text);

  // -------------------------------------------------------------------------
  // RULE 2. Coverage, both directions.
  // A branch that runs the service must publish it, and a branch that does not
  // must not advertise an NHS service it cannot deliver.
  // -------------------------------------------------------------------------
  if (hasPf && scopes.length === 0) {
    fail(rel, 'branches.json gives this branch a pharmacyFirst widget, but the pack has neither an "- NHS Pharmacy First:" service bullet nor a "### Post A" body, so the profile would say nothing about a free NHS service the branch actually runs');
    continue;
  }
  if (!hasPf) {
    const stray = CONDITION_ORDER.filter((k) => namesAny(k, flat(text)));
    if (stray.length) {
      fail(rel, `branches.json gives this branch no pharmacyFirst widget, but the pack names ${stray.join(", ")}. A Google profile advertising a free NHS assessment the branch cannot deliver sends patients to the wrong counter`);
    }
    continue;
  }

  packsRead++;

  for (const scope of scopes) {
    scopesRead++;
    const body = flat(scope.body);
    const where = `${scope.label}`;

    // -----------------------------------------------------------------------
    // RULE 3. Completeness. Every one of the seven, in every block that
    // publishes the list. A dropped condition is a patient who reads the
    // profile, does not see their illness, and books a GP appointment the
    // pharmacy exists to save.
    // -----------------------------------------------------------------------
    const named = CONDITION_ORDER.filter((k) => namesAny(k, body));

    // -----------------------------------------------------------------------
    // RULE 2b. A located block that names NO condition is a mislocated block,
    // not an empty one, because both of these blocks publish the list in all
    // fourteen packs. Without this, a scope pattern that silently matched too
    // little would send every rule below down its "names nothing, skip"
    // branch and the checker would report success having read almost nothing.
    // That is precisely what the CRLF defect described above did on this
    // file's first run, and this is the assertion that catches that class of
    // fault by structure rather than by anyone re-reading the regex.
    // -----------------------------------------------------------------------
    if (named.length === 0) {
      fail(rel, `${where} was located but names none of the ${CONDITION_ORDER.length} Pharmacy First conditions. Both Pharmacy First blocks publish the condition list, so either the block has lost its clinical copy or the pattern that locates it in tools/check-gbp-pharmacy-first.js is matching too little and every rule below it is running on the wrong text`);
      continue;
    }

    if (named.length < CONDITION_ORDER.length) {
      const missing = CONDITION_ORDER.filter((k) => !named.includes(k));
      fail(rel, `${where} names ${named.length} of the ${CONDITION_ORDER.length} Pharmacy First conditions and omits ${missing.join(", ")}. This block is pasted verbatim into the public Google profile, so an omitted condition is a service the branch runs and the profile denies`);
    }

    // -----------------------------------------------------------------------
    // RULE 4. No condition outside the NHS scope, named inside the block that
    // promises a free NHS assessment.
    // -----------------------------------------------------------------------
    for (const o of OUTSIDE_PF) {
      const re = new RegExp("\\b" + o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      if (re.test(body)) {
        fail(rel, `${where} names "${o}" inside the Pharmacy First copy, but it is not one of the ${CONDITION_ORDER.length} conditions in the NHS service (tools/build-service-pages.js). The block promises a free NHS assessment, so this tells a patient the NHS will treat "${o}" here free of charge when it will not`);
      }
    }

    // RULE 5 is not here. It reads the whole of the published copy, below,
    // for the reason recorded there.

    // -----------------------------------------------------------------------
    // RULE 6. Age ranges, read from the canon rather than typed here.
    //
    // Two of the seven pathways carry an age range narrow enough that getting
    // it wrong turns eligible patients away or pulls ineligible ones in. The
    // numbers come out of CONDITIONS[...].ageNote, so an NHS change to the
    // service updates the site and this rule together.
    // -----------------------------------------------------------------------
    const ageNums = (key) => {
      const n = ((CONDITIONS[key] || {}).ageNote || "").match(/\d+/g);
      return n || [];
    };

    const utiAges = ageNums("uti"); // canon: "Women aged 16 to 64"
    const utiClaim = body.match(/\bwom[ea]n\s+aged\s+(\d+)\s+to\s+(\d+)/i);
    if (utiClaim && utiAges.length === 2) {
      if (utiClaim[1] !== utiAges[0] || utiClaim[2] !== utiAges[1]) {
        fail(rel, `${where} publishes the urinary tract infection service for "women aged ${utiClaim[1]} to ${utiClaim[2]}", but the canon holds "${CONDITIONS.uti.ageNote}" (tools/build-service-pages.js). The profile and the branch's own condition page would state different NHS eligibility`);
      }
    }

    // Earache is the paediatric pathway. Publishing it for adults is the
    // error that fills a consultation room with people who cannot be seen.
    const earAges = ageNums("earache"); // canon: "Age 1 to 17"
    if (/\bearache\b[^.]{0,40}\badults?\b/i.test(body) || /\badults?\b[^.]{0,20}\bearache\b/i.test(body)) {
      fail(rel, `${where} attaches "adults" to earache, but the canon holds "${CONDITIONS.earache.ageNote}" for that pathway (tools/build-service-pages.js): it is the children and young people service. Publishing it for adults on a Google profile brings in patients the pharmacist cannot treat under Pharmacy First`);
    }
    const earClaim = body.match(/\bearache\b[^.]{0,40}?aged\s+(\d+)\s+to\s+(\d+)/i);
    if (earClaim && earAges.length === 2) {
      if (earClaim[1] !== earAges[0] || earClaim[2] !== earAges[1]) {
        fail(rel, `${where} publishes earache for ages ${earClaim[1]} to ${earClaim[2]}, but the canon holds "${CONDITIONS.earache.ageNote}"`);
      }
    }

    // -----------------------------------------------------------------------
    // RULE 7. The hedge. Pharmacy First is an ASSESSMENT that may or may not
    // lead to treatment, and the pharmacist may refer instead. Copy promising
    // treatment outright is the same fault the house weight loss standards
    // bar on a consultation: stating an outcome the clinician has not reached
    // (compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md). Every pack carries
    // "where appropriate" today, and this keeps it that way.
    // -----------------------------------------------------------------------
    if (/\b(treat|treatment)\b/i.test(body) && !/\bwhere appropriate\b/i.test(body)) {
      fail(rel, `${where} promises treatment for the Pharmacy First conditions without the "where appropriate" qualifier. Pharmacy First is a free NHS assessment that may or may not lead to a supply, and the pharmacist may refer instead, so unqualified copy on a public profile promises an outcome no clinician has reached`);
    }

    // -----------------------------------------------------------------------
    // RULE 8. Free, and no price. The service being free of charge is the
    // single fact that makes a patient choose the pharmacy over a GP wait.
    // A price beside it is worse than an omission: it is a charge for an NHS
    // service, published as an advertisement.
    // -----------------------------------------------------------------------
    if (!/\bfree\b/i.test(body) && !/\bno charge\b/i.test(body)) {
      fail(rel, `${where} does not say the Pharmacy First service is free. It is a free NHS service and TEMPLATE.md requires the wording to stay close to the NHS service description, so a profile that omits it loses the one fact that sends a patient to the pharmacy instead of the GP`);
    }
    const price = body.match(/(?:£\s?\d|\bfrom\s+£|\b\d+\s*pounds\b)/i);
    if (price) {
      fail(rel, `${where} carries a price ("${price[0].trim()}") inside the Pharmacy First copy. This is a free NHS service, so a price on the public profile both contradicts the service and reads as a charge for NHS care`);
    }
  }

  // -------------------------------------------------------------------------
  // RULE 5. The count claim, read across ALL published copy rather than
  // inside the two Pharmacy First blocks.
  //
  // THIS PLACEMENT IS THE SECOND DEFECT THIS FILE'S OWN NEGATIVE TESTS FOUND.
  // Rule 5 first sat inside the block loop with everything else, and the test
  // that changes "seven common conditions" to "eight" passed the checker.
  // The reason is worth keeping: the count is claimed THREE times in a pack,
  // not twice. Section 1's business description says "under NHS Pharmacy
  // First our pharmacists assess and treat seven common conditions free of
  // charge", and the business description is neither the service bullet nor
  // Post A, so it sat outside every scope this file had. The test's
  // String.replace hit that first occurrence, the two blocks kept saying
  // "seven", and the checker reported success on a pack whose most-read
  // block had just been falsified.
  //
  // The business description is the 750 characters Google shows first. So the
  // count claim is checked wherever it is published, and only the paster
  // notes are cut, because those are instructions to Rishi or Dane and not
  // copy any patient sees.
  // -------------------------------------------------------------------------
  const published = text.replace(/^Notes for the paster:[\s\S]*$/m, " ");
  const want = NUMBER_WORDS[CONDITION_ORDER.length] || String(CONDITION_ORDER.length);
  const countRe = /\b([A-Za-z]+)\s+common conditions\b/g;
  let cm;
  while ((cm = countRe.exec(flat(published))) !== null) {
    if (cm[1].toLowerCase() !== want) {
      fail(rel, `published copy says "${cm[1]} common conditions", but the canon in tools/build-service-pages.js holds ${CONDITION_ORDER.length} Pharmacy First pathways ("${want}"). The pack then lists them, so the profile contradicts its own sentence`);
    }
  }
}

// ---------------------------------------------------------------------------
// RULE 9. Condition words OUTSIDE the Pharmacy First blocks.
//
// This is the rule the scope discipline at the top of this file is for. A
// condition word loose in a pack is not automatically wrong: a branch could
// legitimately advertise a SHINGLES VACCINATION, which is a vaccination
// service and not Pharmacy First, and a pack naming it would be correct copy.
// What it must never be is ACCIDENTAL, because a patient reading "shingles"
// in a private services bullet has no way to tell whether the free NHS
// assessment applies to them.
//
// So this reports rather than assumes, and an entry in KNOWN_NON_PF settles
// it deliberately, the same allowlist convention RECOGNISED_SERVICES and
// RECOGNISED_CATEGORIES use in tools/check-gbp-packs.js. The list is empty
// today because no pack has such a mention, so this rule starts clean and
// fires the first time one appears.
// ---------------------------------------------------------------------------
for (const file of packFiles) {
  const rel = "gbp-packs/" + file;
  const text = normalise(fs.readFileSync(path.join(PACK_DIR, file), "utf8"));
  const idm = text.match(/^[ \t]*Branch id:[ \t]*([A-Za-z0-9_]+)/m);
  if (!idm) continue;
  const b = byId.get(idm[1]);
  if (!b || b.disposed || !(b.widgets && b.widgets.pharmacyFirst)) continue;

  const scopes = pfScopes(text);
  if (!scopes.length) continue;

  // Everything that is not a Pharmacy First block, and not a paster note or a
  // URL. Notes and links are instructions to Rishi or Dane, not published
  // copy, and the pfLink leaf legitimately contains "pharmacy-first".
  let outside = text;
  for (const s of scopes) {
    if (!outside.includes(s.raw)) {
      fail(rel, `internal: the ${s.label} span could not be subtracted from the pack, so rule 9 would read Pharmacy First copy as if it were stray. This is a fault in tools/check-gbp-pharmacy-first.js, not in the pack`);
      continue;
    }
    outside = outside.replace(s.raw, " ");
  }
  outside = outside
    .replace(/^Notes for the paster:[\s\S]*$/m, " ")
    .replace(/https?:\/\/\S+/g, " ");

  for (const k of CONDITION_ORDER) {
    if (!namesAny(k, flat(outside))) continue;
    const key = `${file}::${k}`;
    if (KNOWN_NON_PF[key]) { usedNonPf.add(key); continue; }
    fail(rel, `names "${k}" outside the Pharmacy First blocks, in copy that is not the service bullet or Post A. If this is a different service, a shingles vaccination for instance, it is correct copy and belongs in KNOWN_NON_PF in tools/check-gbp-pharmacy-first.js with its reason. If it is not, a condition word loose in the pack leaves a patient unable to tell whether the free NHS assessment covers them`);
  }
}

// ---------------------------------------------------------------------------
// RULE 10. Stale exceptions. An allowlist entry that no longer excuses
// anything is a hole nobody will close, so it fails the run. Same convention
// as KNOWN_AREA_ORDER in tools/check-gbp-packs.js.
// ---------------------------------------------------------------------------
for (const key of Object.keys(KNOWN_NON_PF)) {
  if (!usedNonPf.has(key)) {
    const e = KNOWN_NON_PF[key];
    fails.push(`tools/check-gbp-pharmacy-first.js: stale exception KNOWN_NON_PF["${key}"] no longer matches anything in the packs. Remove it (${e.question || e.reason}).`);
  }
}

// ---------------------------------------------------------------------------
// RULE 11 and 12. Coverage guards, so this file cannot pass by reading
// nothing. A renamed folder, a changed heading or a reshaped pack would
// otherwise leave every rule above running zero times and exiting 0, which is
// the failure mode this repo has now been bitten by more than once.
// ---------------------------------------------------------------------------
const expectedPacks = branches.filter(
  (b) => !b.disposed && b.widgets && b.widgets.pharmacyFirst
).length;

if (packsRead !== expectedPacks) {
  fails.push(`tools/check-gbp-pharmacy-first.js: read Pharmacy First copy in ${packsRead} packs, but branches.json has ${expectedPacks} live branches with a pharmacyFirst widget. Every one of them should have a pack this checker can read, so the difference is either a missing pack or a pack this checker can no longer parse`);
}
if (scopesRead < packsRead * 2) {
  fails.push(`tools/check-gbp-pharmacy-first.js: found ${scopesRead} Pharmacy First blocks across ${packsRead} packs, and each pack publishes the condition list twice, in the Services bullet and in Post A. Fewer than ${packsRead * 2} means a block is no longer being located, so its copy is going unread while this checker reports success`);
}

if (fails.length) {
  console.error(`check-gbp-pharmacy-first: ${fails.length} problem(s)\n`);
  for (const f of fails) console.error("  " + f + "\n");
  process.exit(1);
}

console.log(
  `check-gbp-pharmacy-first: OK - ${CONDITION_ORDER.length} pathways read from the generator, ` +
  `${scopesRead} Pharmacy First blocks across ${packsRead} packs, all clean.`
);
