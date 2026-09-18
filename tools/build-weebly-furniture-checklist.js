/*
  build-weebly-furniture-checklist.js

  Generates WEEBLY_FURNITURE_CHECKLIST.md at the repo root: a per-site
  correction checklist for the estate-wide Weebly furniture sweep Rishi
  answered for on Q39 ("One Weebly furniture sweep across all 14 sites in
  a single supervised session, working from a per-site correction
  checklist this repo generates from branches.json. The faults are three
  repeating kinds, the correct values are already held here, and a
  checklist means the session is mechanical rather than investigative.")

  Q39's note explicitly invites an unattended run to build this: "The
  checklist in options 1 and 2 is work an unattended run can do, because
  it is a repo file composed from branches.json and needs no Weebly
  access. Say the word and a later run can build it." It had not been
  built as of the 2026-09-15 cross-reference addendum on Q39. This script
  is that build.

  WHAT THIS DOES: for every trading branch, prints the CORRECT values
  (trading name, full street, locality, postcode, region, phone, NHS
  mailbox, general email) read live from branches.json, so the paster
  never has to guess or re-derive a fact this repo already holds right.

  WHAT THIS DOES NOT DO: it does not know what the live Weebly furniture
  currently says on every page of every site - no generator or checker in
  this repo can reach hand-pasted Weebly chrome (that is the entire
  premise of Q36/Q37/Q39/Q41/Q43). Where a specific wrong value HAS been
  read live and recorded during the audit, it is quoted below the correct
  value with its source question id and the date it was last reconfirmed,
  so the paster can search-and-replace with confidence. Where a site has
  not yet been read for furniture faults, it says so plainly rather than
  implying it is clean - "not yet read" is not "verified correct".

  Run: node tools/build-weebly-furniture-checklist.js
  Out: WEEBLY_FURNITURE_CHECKLIST.md
*/

var fs = require("fs");
var path = require("path");

// Known live findings, keyed by branch id. Each entry is sourced from a
// specific QUESTIONS.json id and the AGENT_WORKLIST.md pass that most
// recently reconfirmed it. Do not add an entry here without a source -
// this file's whole value is that nothing in it is guessed.
var KNOWN_FINDINGS = {
  cherrylane_liverpool: {
    site: "cherrylanepharmacy.co.uk",
    source: "Q36",
    items: [
      'Site footer publishes the NHS mailbox as "pharmacy.FA226@mhs.net" ' +
        '(m instead of n) - should read "pharmacy.FA226@nhs.net". Confirmed ' +
        "live on at least five pages as of 2026-09-15: contraception-cherry-" +
        "lane-walton.html, switch-prescriptions-cherry-lane-walton.html, " +
        "pharmacy-first-cherry-lane-walton.html, weight-loss-clinic-walton.html " +
        "(legacy stub) and weight-loss-clinic-cherry-lane-walton.html " +
        "(current generated page). A 2026-08-11 hand-fix on index.html and " +
        "contact-us.html removed the NHS mailbox from the footer entirely " +
        "rather than correcting it (those two pages now show only " +
        "Cherry@rbhealth.co.uk, no NHS mailbox at all) - make every page " +
        "consistent by publishing the correct NHS mailbox, not by removing it.",
    ],
  },
  fishlocks_ainsdale: {
    site: "fishlockpharmacy.co.uk (shared with Eccleston)",
    source: "Q37",
    items: [
      'Weebly contact block heads its Ainsdale column "Fishlock Pharmacy, ' +
        'Ainsdale, Southport" - the word is "Fishlock", should be "Fishlocks".',
      'The legal line below reads "Fishlock Chemist (GPhC no. 1121085 and ' +
        '1034673)" - should be "Fishlocks Chemist".',
      'The same contact block prints the street as "17 Station Rd" - should ' +
        'be "17 Station Road" in full (branches.json, matches every ' +
        "generated page).",
      "A SEPARATE, CORRECT trust-bar footer block already exists on the " +
        'same pages, reading "Fishlocks Chemist - two local NHS pharmacies ' +
        'in Ainsdale & Eccleston" with the Ainsdale street given correctly ' +
        'in full - do not "fix" that block, it is already right. Check ' +
        "which block wins once the wrong contact block above is corrected.",
    ],
  },
  fishlocks_eccleston: {
    site: "fishlockpharmacy.co.uk (shared with Ainsdale)",
    source: "Q37",
    items: [
      'Weebly contact block heads its Eccleston column "Fishlock Pharmacy, ' +
        'Eccleston, Chorley" - should be "Fishlocks Chemist" (or "Fishlocks ' +
        'Pharmacy"), matching the Ainsdale column\'s own correction.',
      'The shared legal line "Fishlock Chemist (GPhC no. 1121085 and ' +
        '1034673)" covers both branches - fix once, fixes both.',
    ],
  },
  mccanns_aigburth: {
    site: "mccannspharmacy.co.uk (shared with Sandringham)",
    source: "Q39",
    items: [
      'Weebly-native contact block and legal footer name the business ' +
        '"McCann\'s Pharmacy" (apostrophe form) throughout - should be ' +
        '"McCanns Chemist" (no apostrophe), matching branches.json and all ' +
        "26 generated pages for this brand. Reconfirmed live 2026-09-15 as " +
        '"McCann\'s Pharmacy - Aigburth" in the footer.',
      'The same furniture abbreviates the sister branch\'s street to "112 ' +
        'Aigburth Rd" - should be "112 Aigburth Road" in full (this is ' +
        "Aigburth's own address, so getting it right matters for this " +
        "branch's own page too).",
    ],
  },
  mccanns_sandringham: {
    site: "mccannspharmacy.co.uk (shared with Aigburth)",
    source: "Q39",
    items: [
      'Same wrong brand name as Aigburth: "McCann\'s Pharmacy" should be ' +
        '"McCanns Chemist". Reconfirmed live 2026-09-15 as "McCann\'s ' +
        'Pharmacy - Sandringham Medical Centre" in the footer.',
      'The medical centre name is misspelled "Sandrigham" - should be ' +
        '"Sandringham".',
    ],
  },
  skchemists_bootle: {
    site: "skchemist.co.uk",
    source: "Q39 (addendum, item 4.11 eighteenth pass)",
    items: [
      "contactus.html's Feedback/Complaints paragraph is missing its phone " +
        'number entirely: "...give us a call on and speak to our pharmacist ' +
        'manager." - insert the branch phone, 0151 944 1013, before "and ' +
        'speak". Confirmed by screenshot and accessibility tree, not a ' +
        "text-extraction artefact - genuinely absent from the page.",
    ],
  },
  hirshmans_ainsdale: {
    site: "hirshmanspharmacy.co.uk",
    source: "Q41",
    items: [
      "The contact-us page's TOP contact block publishes the NHS mailbox " +
        "pharmacy.FW378@nhs.net as the patient contact address, alongside " +
        "the generated footer strip's Hirshmans@rbhealth.co.uk, with " +
        "nothing distinguishing which is for what. Decision made: replace " +
        "the nhs.net address in the top block with Hirshmans@rbhealth.co.uk, " +
        "so the page publishes one route to the branch. Keep the NHS " +
        "mailbox in branches.json for NHS use, just stop advertising it to " +
        "patients.",
      "The contact-us page's MIDDLE address block also publishes the nhs.net " +
        "address a second time (so it appears twice on one page against the " +
        "correct address once) - apply the same fix there.",
      'The top contact block splits the address across a line break as ' +
        '"56-62 Sherwood House," / "Station Road" and omits the postcode ' +
        "PR8 3HW entirely - should read the full address on one line ending " +
        "PR8 3HW, matching branches.json.",
      'The phone is printed unspaced as "01704577376" - should read ' +
        '"01704 577376" (spaced), matching the footer, the GBP pack and ' +
        "branches.json.",
      'The locality is printed across two lines as "Ainsdale" then ' +
        '"Southport" - not factually wrong (Southport is the correct Royal ' +
        "Mail post town for PR8 3HW) but inconsistent with the single " +
        'source of truth, which holds addressLocality "Ainsdale" only. ' +
        "Pick one rendering and use it everywhere on the page.",
      "The OLD (pre-replacement) Pharmacy First page for this branch " +
        '(pharmacy-first-service-ainsdale.html) is a separate, worse case: ' +
        'its own contact section prints the phone as "017014577376" (12 ' +
        "digits, does not dial at all) and the street as \"64 Station Road\" " +
        '(wrong number - should be "17 Station Road"). This page is no ' +
        "longer Post A's target after the 2026-09-14 repoint, so it is now " +
        "orphaned rather than a hard stop, but it is still live and " +
        "indexed and should be corrected or retired in the same sweep.",
      "The same nhs.net-instead-of-general-email pattern was also found on " +
        "this branch's OLD site-wide footer block, appearing on the old " +
        "Pharmacy First page, switch page, travel page and weight loss " +
        "page alike - fixing the footer element once should clear all of " +
        "them, but check each page after the fix rather than assuming.",
    ],
  },
  scorah_bramhall: {
    site: "scorah-chemists.co.uk (shared with Hazel Grove)",
    source: "Q43 (OPEN - see note below)",
    items: [
      'Site-wide footer strip reads "Bramhall: 61 North Park Road, ' +
        'Bramhall, SK7 3LQ" - the house number is truncated, should read ' +
        '"61-63 North Park Road" in full. This part is unambiguously wrong ' +
        "and safe to fix regardless of the open county question below. " +
        "Also found truncated the same way in the shared Pharmacy First " +
        "page's own Bramhall contact section, alongside an unspaced phone " +
        '"01614393744" (should read "0161 439 3744").',
      "DECISION PENDING, do not change without checking QUESTIONS.json Q43 " +
        'first: the Weebly contact block above the footer reads "61-63 ' +
        'North Park Road, Bramhall, Cheshire SK7 3LQ" - branches.json and ' +
        'this branch\'s own JSON-LD both say "Greater Manchester". Rishi\'s ' +
        "2026-09-01 portal reply did not pick an option outright (\"Unsure - " +
        "historically Timperly and Bramhall sat in Cheshire so people still " +
        'associate as such... need advise as cheshire travel clinic works ' +
        'well for bramhall"), so Q43 is still open. Fix the house number, ' +
        "leave the county word exactly as it reads until Q43 is answered.",
    ],
  },
  scorah_hazel: {
    site: "scorah-chemists.co.uk (shared with Bramhall)",
    source: "Q43 (OPEN - see note below)",
    items: [
      "The shared Pharmacy First page's Hazel Grove contact section prints " +
        'the phone and NHS email unspaced/uncapitalised: "Phone:01625872267" ' +
        '(should read "01625 872267", spaced, matching branches.json) and ' +
        '"Email:pharmacy.FKD04@nhs.net" run together with the label, no ' +
        "space after the colon.",
      "Same county question as Bramhall applies here if this branch's own " +
        "furniture states a county - branches.json holds Greater " +
        "Manchester; check Q43 before changing any county wording.",
    ],
  },
  riddings_timperley: {
    site: "the live Riddings Timperley site (pre-Phase-3 paste)",
    source: "worklist item 4.3 quality-pass notes",
    items: [
      'The contact block reads "Timperley, Cheshire" - branches.json holds ' +
        'addressRegion "Greater Manchester". Same open county question as ' +
        "Scorah (Q43's reasoning was partly anchored on this branch too - " +
        'Rishi\'s reply named "Timperly and Bramhall" together) - check Q43 ' +
        "before changing.",
      "This branch's switch page is still sitting on a pre-Phase-3 paste " +
        "more broadly: the live page is at the old permalink switch-" +
        "prescriptions.html rather than the branch-specific URL, its H1 " +
        'carries no town words, it shows a "Download our app" block despite ' +
        "this branch's hasApp being false, and its footer line still uses " +
        "en dashes instead of the corrected copy. This is a stale-paste " +
        "issue rather than a hand-typed value error, but it sits on the " +
        "same page and is worth clearing in the same visit.",
    ],
  },
};

// Sites with no confirmed furniture finding yet, so the checklist does
// not imply they are clean - only that nobody has read them for this yet.
var UNREAD_NOTE =
  "Not yet read for furniture faults on this audit. Verify every value " +
  "above (trading name, street, postcode, phone, NHS mailbox) against the " +
  "live site's contact block and footer during the sweep, the same three " +
  "fault kinds found elsewhere: a wrong or abbreviated trading name, an " +
  "abbreviated street, and a mistyped address or mailbox.";

function fmtBranch(b, data) {
  var lines = [];
  lines.push("### " + b.branchName + " (`" + b.id + "`)");
  lines.push("");
  lines.push("Correct values (from branches.json, lastUpdated " + data.lastUpdated + "):");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|---|---|");
  lines.push("| Trading name | " + b.branchName + " |");
  if (b.brandLabel !== b.branchName) {
    lines.push("| Brand (shared with sister branch) | " + b.brandLabel + " |");
  }
  lines.push(
    "| Address | " +
      b.streetAddress +
      ", " +
      b.addressLocality +
      ", " +
      b.postalCode +
      " |"
  );
  lines.push("| County (addressRegion) | " + b.addressRegion + " |");
  lines.push("| Phone | " + (b.phone || "-") + " |");
  lines.push("| NHS mailbox | " + (b.nhsEmail || "-") + " |");
  lines.push("| General email | " + (b.email || "-") + " |");
  lines.push("| Website | " + (b.website || "-") + " |");
  lines.push("");

  var known = KNOWN_FINDINGS[b.id];
  if (known) {
    lines.push("**Known live faults (" + known.site + ", source " + known.source + "):**");
    lines.push("");
    known.items.forEach(function (item) {
      lines.push("- " + item);
    });
  } else {
    lines.push("**" + UNREAD_NOTE + "**");
  }
  lines.push("");
  return lines.join("\n");
}

function buildMarkdown(data) {
var trading = data.branches.filter(function (b) {
  return !b.disposed && b.id !== "rbh_head_office_aintree";
});

var md = [];
md.push("# Weebly furniture correction checklist");
md.push("");
md.push(
  "Generated by tools/build-weebly-furniture-checklist.js from branches.json " +
    "(lastUpdated " + data.lastUpdated + "). Do not hand-edit - re-run the " +
    "generator after any branches.json change or any new furniture finding " +
    "is logged."
);
md.push("");
md.push(
  "Built for the estate-wide Weebly furniture sweep Rishi approved on Q39: " +
    'one supervised session across all trading sites, "working from a ' +
    'per-site correction checklist this repo generates from branches.json", ' +
    "so the session is mechanical rather than investigative."
);
md.push("");
md.push(
  "**What this file is not**: a live audit. No generator or checker in " +
    "this repo can read hand-pasted Weebly chrome, which is the entire " +
    "reason this checklist has to exist and be worked through by eyes in " +
    "the Weebly editor. Sites marked with a known fault below have been " +
    "read live and the fault confirmed with a source and date. Sites " +
    "marked \"not yet read\" have not been checked at all - that is not " +
    "the same as clean."
);
md.push("");
md.push(
  "Three repeating fault kinds seen so far (Q39): a wrong or abbreviated " +
    "trading name, an abbreviated street, and a mistyped address or " +
    "mailbox. A few sites have also shown unspaced phone numbers, split " +
    "address lines, or a county name that disagrees with branches.json - " +
    "check those too while in each site."
);
md.push("");
md.push("---");
md.push("");

trading.forEach(function (b) {
  md.push(fmtBranch(b, data));
});

md.push("---");
md.push("");
md.push(
  "## Sites confirmed with at least one live furniture fault: " +
    Object.keys(KNOWN_FINDINGS).length +
    " of " +
    trading.length +
    " trading branches"
);
md.push("");
md.push(
  "Grouped by shared website, that is 7 distinct sites with a confirmed " +
    "fault (cherrylanepharmacy.co.uk, fishlockpharmacy.co.uk, " +
    "mccannspharmacy.co.uk, skchemist.co.uk, hirshmanspharmacy.co.uk, " +
    "scorah-chemists.co.uk, and the Riddings Timperley site) against an " +
    "estate of around 14 distinct sites (several branches share a domain). " +
    "The remaining sites - Clear Chemist Aintree, Smartts Chemist Bootle, " +
    "Coleman and Leighs Pharmacy Walton, Gordon Short Chemist Crosby and " +
    "Tiffenbergs Chemist Longmoor - have not yet had their contact block " +
    "and footer read specifically for this fault family (separate, already-" +
    "tracked findings exist for some of them on other subjects, such as " +
    "stale trading-name pastes on generated pages, which is a different " +
    "class of fault to the hand-typed furniture this checklist covers)."
);
md.push("");
md.push(
  "After the sweep: update this file's KNOWN_FINDINGS (in the generator, " +
    "not by hand) to remove cleared items, or clear the whole entry once a " +
    "site reads clean, and re-run the generator so the checklist stops " +
    "listing a fault that has already been fixed."
);
md.push("");

return md.join("\n");
}

// CLI entry point only - lets tools/check-weebly-furniture-freshness.js
// require() buildMarkdown() and KNOWN_FINDINGS below to prove the checked-in
// file still matches what this generator would produce right now, without
// re-running (or duplicating) this script's own write-to-disk behaviour.
if (require.main === module) {
  var data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "branches.json"), "utf8")
  );
  var trading = data.branches.filter(function (b) {
    return !b.disposed && b.id !== "rbh_head_office_aintree";
  });
  var md = buildMarkdown(data);

  fs.writeFileSync(
    path.join(__dirname, "..", "WEEBLY_FURNITURE_CHECKLIST.md"),
    md
  );

  console.log(
    "Generated WEEBLY_FURNITURE_CHECKLIST.md: " +
      trading.length +
      " branches, " +
      Object.keys(KNOWN_FINDINGS).length +
      " with confirmed findings."
  );
}

module.exports = { buildMarkdown: buildMarkdown, KNOWN_FINDINGS: KNOWN_FINDINGS };
