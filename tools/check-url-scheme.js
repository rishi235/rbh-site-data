#!/usr/bin/env node
/*
  tools/check-url-scheme.js  (added 2026-08-13 on worklist item 6.6)

  WHY THIS EXISTS
  ---------------
  Item 6.6 is about http:// and https:// versions of the same page being
  indexed separately and splitting clicks. Run 135 checked the repo half and
  recorded the answer in the worklist: no generated page and no branches.json
  field carries an http:// URL, every one is https, so the repo is neither the
  cause nor the fix. That was true when it was written, it is still true today,
  and NOTHING HELD IT. It was a one-off sweep whose result lived only in prose.
  A single http:// href pasted into a generator would put an insecure estate
  URL onto up to 177 live pages, which is a fresh crawlable vote for exactly
  the duplicate item 6.6 exists to close, and all 30 checkers would stay green.
  Rule 1 turns that sweep into a standing one.

  Rule 2 is the finding this checker was actually written for, and it is not in
  the pages at all. GBP_MANUAL.md section 5 records the website field of all 16
  Google Business Profiles as read one by one on 2026-08-09. Nine of them are
  http://. The manual's own section 4 says "The correct URL for each branch is
  the website field in branches.json. That file is the source of truth, not
  what is currently in GBP", and all 16 values in branches.json are https. The
  manual's own section 6 item 2 says "Nine profiles point at http, six at
  https. All should be https."

  And yet the Verdict column of the table calls every one of those nine rows
  "correct". One of them reads, in full, "correct, http". So the same document
  records the divergence in its open-items list and clears it in its state
  table, and the state table is the half a later sweep reads to decide what
  still needs doing. That is the defect: not the nine insecure URLs, which were
  already known, but a state table that marks them correct and can therefore
  retire them by accident. Rule 2 makes the table answer to branches.json.

  WHAT THIS CHECKER DELIBERATELY DOES NOT CLAIM
  ---------------------------------------------
  It does not claim the GBP website field explains the click split in item 6.6.
  That was tested against the GSC numbers already recorded there and it does
  not survive. Cherry Lane is the ONE of the three measured branches whose GBP
  is correctly https, and it has by far the worst split of the three: 342
  clicks on the http homepage against 13 on https, where Riddings (GBP http)
  is 151 to 105 and McCanns (GBP http) is 190 to 119. If the citation drove
  the split, Cherry Lane would be the clean one. It is the worst one. So a
  wrong GBP scheme is a wasted redirect hop and a business telling Google that
  the insecure URL is its home, which is worth correcting on its own terms, but
  correcting it should not be expected to move the numbers in 6.6.

  RULES
  -----
  1. INSECURE  no http:// URL may appear on a generated page, in a Weebly
               paste block, in a GBP pack, or in a URL-valued field of
               branches.json. XML and RDF namespace URIs are identifiers
               rather than links and are allowed by NAMESPACE_PREFIXES.
               Narrative surfaces are exempt: the log, the worklist, the
               manual, QUESTIONS.json, the status page, anything under
               audits/, and this file all quote insecure URLs on purpose,
               because quoting them is how the finding is recorded.
  2. GBPSITE   every website value in the GBP_MANUAL.md section 5 table must
               equal that profile's branches.json website value. One trailing
               slash is ignored: on a homepage "https://host/" and
               "https://host" are the same resource, and branches.json stores
               the unslashed form because check-branch-links.js requires it.
               A difference of SCHEME or of PATH is a real divergence.
  3. MAPPED    PROFILE_TO_BRANCH must name a real branch id and must cover
               every row of the table, so a profile cannot be added to the
               manual and then checked by nothing.

  Divergences accepted for now go in KNOWN with a reason and a question id,
  the same convention as KNOWN_DRIFT in check-cdn-pins.js and KNOWN in
  check-seo-lengths.js and check-service-links.js. A KNOWN key that no longer
  breaks a rule FAILS the run, so the list cannot rot once the fix lands.

  Read-only. Run:  node tools/check-url-scheme.js  [--verbose]
  Exit 0 = clean, 1 = failures.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var VERBOSE = process.argv.indexOf("--verbose") !== -1;
var SELF = "tools/check-url-scheme.js";

var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches;

// Directories whose contents are published: generated pages, the paste blocks
// that go into Weebly by hand, and the GBP packs. Rule 1 applies here.
var PUBLISHED_DIRS = [
  "modules/service/pages",
  "modules/switch/pages",
  "modules/branch/pages",
  "modules/service/weebly-paste",
  "gbp-packs"
];

// Shared paste templates carry no branch fact but are still public copy.
var PUBLISHED_FILES = [
  "modules/switch/weebly.html"
];

// Surfaces that RECORD insecure URLs rather than publish them. Same idea as
// NARRATIVE_FILES in check-postcodes.js: the audit has to be able to write
// down what it found. A listed file that has left the repo fails as a stale
// exemption, so the list cannot rot.
var NARRATIVE_FILES = [
  "AGENT_LOG.md",
  "AGENT_WORKLIST.md",
  "GBP_MANUAL.md",
  "QUESTIONS.json",
  "CHANGELOG.md",
  "README.md",
  "CLAUDE.md",
  SELF
];
// status/index.html was removed from this list 2026-09-01: the file it named
// was retired per Q42 (see check-seo-pattern.js's KNOWN_NON_PAGE_BUILDER note).

// Namespace URIs. These are identifiers, not fetchable links, and they are
// http:// by specification: rewriting them to https breaks the document.
var NAMESPACE_PREFIXES = [
  "http://www.w3.org/",
  "http://purl.org/",
  "http://ogp.me/",
  "http://schemas.microsoft.com/",
  "http://www.opengis.net/"
];

// Fields of a branches.json entry that hold a URL. pfBooking is a boolean and
// is not one, which is worth saying because it reads like one.
var URL_FIELDS = ["website", "googleReviewUrl", "nhsReviewUrl", "pfLink"];

// GBP profile display name (column 1 of the section 5 table) -> branch id.
// The manual names profiles the way Google shows them, which is not the
// branchName, so the mapping has to be written down.
var PROFILE_TO_BRANCH = {
  "Cherry Lane": "cherrylane_liverpool",
  "Clear Chemist": "clearchemist_aintree",
  "Coleman and Leighs": "colemanleigh_liverpool",
  "Fishlocks Eccleston": "fishlocks_eccleston",
  "Fishlocks Ainsdale": "fishlocks_ainsdale",
  "Gordon Short": "gordonshorts_crosby",
  "Hirshmans": "hirshmans_ainsdale",
  "McCanns Aigburth": "mccanns_aigburth",
  "McCanns Sandringham": "mccanns_sandringham",
  "RB Healthcare head office": "rbh_head_office_aintree",
  "Riddings": "riddings_timperley",
  "Scorah Bramhall": "scorah_bramhall",
  "Scorah Hazel Grove": "scorah_hazel",
  "SK Chemists": "skchemists_bootle",
  "Smartts": "smartts_bootle",
  "Tiffenbergs": "tiffenbergs_longmoor"
};

// Divergences accepted for now, keyed "<profile name>". Every one of these is
// a live Google Business Profile edit, which is a write to a public listing
// and therefore Rishi's call, not an unattended run's.
var KNOWN = {
  "Clear Chemist":
    "Q66: GBP publishes http where branches.json says https. Nine profiles are in this state, "
    + "recorded in GBP_MANUAL.md section 6 item 2 since the 2026-08-09 sweep. Fixing it is a live "
    + "edit to a verified Google listing, so it is held for Rishi.",
  "Fishlocks Eccleston": "Q66: as Clear Chemist. Also shares a root URL with Fishlocks Ainsdale, which is GBP_MANUAL section 6 item 3.",
  "Fishlocks Ainsdale": "Q66: as Clear Chemist. Also shares a root URL with Fishlocks Eccleston, which is GBP_MANUAL section 6 item 3.",
  "McCanns Aigburth":
    "Q66: the only row that diverges on PATH as well as scheme. GBP points at "
    + "http://www.mccannspharmacy.co.uk/contact-us.html where branches.json says "
    + "https://www.mccannspharmacy.co.uk. Sister branch McCanns Sandringham points at the https root, "
    + "so the two halves of one shared domain disagree.",
  "RB Healthcare head office": "Q66: as Clear Chemist. Head office is also miscategorised as a Pharmacy, which is GBP_MANUAL section 6 item 5.",
  "Riddings": "Q66: as Clear Chemist. One of the three branches whose http/https click split was measured in GSC for item 6.6.",
  "Scorah Bramhall": "Q66: as Clear Chemist. Also shares a root URL with Scorah Hazel Grove, which is GBP_MANUAL section 6 item 3.",
  "Scorah Hazel Grove": "Q66: as Clear Chemist. Also shares a root URL with Scorah Bramhall, which is GBP_MANUAL section 6 item 3.",
  "SK Chemists": "Q66: as Clear Chemist."
};

var failures = [];
var warnings = [];
var usedKnown = {};
var SKIP_DIRS = { ".git": 1, "node_modules": 1, ".vscode": 1 };
var TEXT_EXT = /\.(html|md|js|json|txt|css)$/i;
var HTTP_RE = /http:\/\/[^\s"'<>)\]]+/g;

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function fail(m) { failures.push("  FAIL  " + m); }
function warn(m) { warnings.push("  WARN  " + m); }
function isNamespace(u) {
  return NAMESPACE_PREFIXES.some(function (p) { return u.indexOf(p) === 0; });
}
// One trailing slash only. Anything more is a real difference in the path.
function unslash(u) { return String(u || "").trim().replace(/\/$/, ""); }

// ---------------------------------------------------------------------------
// RULE 1: no insecure URL on any published surface.
// ---------------------------------------------------------------------------
var publishedScanned = 0;
var insecureFound = 0;
var narrativeQuotes = 0;

function isPublished(r) {
  if (PUBLISHED_FILES.indexOf(r) !== -1) return true;
  return PUBLISHED_DIRS.some(function (d) { return r.indexOf(d + "/") === 0; });
}

function scan(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS[e.name]) scan(p); return; }
    if (!TEXT_EXT.test(e.name)) return;

    var r = rel(p);
    // branches.json is read field by field further down, which names the
    // offending FIELD rather than a line of JSON. Reading it as text as well
    // would report the same value twice, once usefully and once as noise.
    if (r === "branches.json") return;
    var narrative = NARRATIVE_FILES.indexOf(r) !== -1 || r.indexOf("audits/") === 0;
    var published = isPublished(r);
    if (published) publishedScanned++;

    var text = fs.readFileSync(p, "utf8");
    var m;
    HTTP_RE.lastIndex = 0;
    while ((m = HTTP_RE.exec(text)) !== null) {
      var url = m[0];
      if (isNamespace(url)) continue;
      if (narrative) { narrativeQuotes++; continue; }
      insecureFound++;
      if (published) {
        fail("INSECURE " + r + ": published surface carries " + url
          + ". An insecure estate URL on a live page is a crawlable duplicate of the https page, which is item 6.6.");
      } else {
        warn("INSECURE " + r + " carries " + url
          + ". Not a published surface, so this does not fail the run, but it is worth knowing where it came from.");
      }
    }
  });
}

scan(ROOT);

// branches.json URL fields, read as data rather than as text, so a field that
// holds an insecure URL is named as a field and not as a line of JSON.
var urlValuesChecked = 0;
branches.forEach(function (b) {
  URL_FIELDS.forEach(function (f) {
    var v = b[f];
    if (!v || typeof v !== "string") return;
    urlValuesChecked++;
    if (/^http:\/\//i.test(v)) {
      fail("INSECURE branches.json " + b.id + "." + f + " = " + v
        + ". Every generated page and GBP pack copies this field, so one insecure value here reaches many published surfaces.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 2 and RULE 3: the GBP_MANUAL state table must answer to branches.json.
// ---------------------------------------------------------------------------
var MANUAL = "GBP_MANUAL.md";
var manualPath = path.join(ROOT, MANUAL);
var rowsRead = 0;
var seenProfiles = {};

if (!fs.existsSync(manualPath)) {
  fail("MISSING  " + MANUAL + " is not in the repo, so the GBP website state table cannot be checked.");
} else {
  var byId = {};
  branches.forEach(function (b) { byId[b.id] = b; });

  fs.readFileSync(manualPath, "utf8").split(/\r?\n/).forEach(function (line, idx) {
    if (line.indexOf("|") !== 0) return;
    var cells = line.split("|").map(function (c) { return c.trim(); });
    // "| Profile | Website | Verdict |" splits to ["", profile, website, verdict, ""]
    if (cells.length < 4) return;
    var profile = cells[1];
    var value = cells[2];
    if (!profile || profile === "Profile" || /^-+$/.test(profile)) return;
    if (!/^https?:\/\//i.test(value)) return;

    rowsRead++;
    seenProfiles[profile] = true;

    var id = PROFILE_TO_BRANCH[profile];
    if (!id) {
      fail("MAPPED   " + MANUAL + ":" + (idx + 1) + ": profile \"" + profile
        + "\" is in the table but not in PROFILE_TO_BRANCH, so its website value is checked by nothing.");
      return;
    }
    var b = byId[id];
    if (!b) {
      fail("MAPPED   PROFILE_TO_BRANCH maps \"" + profile + "\" to branch id " + id + ", which is not in branches.json.");
      return;
    }

    var want = unslash(b.website);
    var got = unslash(value);
    if (got === want) {
      if (KNOWN[profile]) {
        fail("STALE    KNOWN names \"" + profile + "\" but its GBP website now matches branches.json (" + want
          + "). Remove the entry.");
      }
      return;
    }

    var wantScheme = (want.match(/^https?:/i) || [""])[0].toLowerCase();
    var gotScheme = (got.match(/^https?:/i) || [""])[0].toLowerCase();
    var why = [];
    if (gotScheme !== wantScheme) why.push("SCHEME (" + gotScheme + "// against " + wantScheme + "//)");
    if (got.replace(/^https?:/i, "") !== want.replace(/^https?:/i, "")) why.push("PATH");

    if (KNOWN[profile]) { usedKnown[profile] = true; return; }
    fail("GBPSITE  " + MANUAL + ":" + (idx + 1) + ": " + profile + " publishes " + value
      + " but branches.json " + id + ".website is " + b.website
      + ". Differs on " + why.join(" and ") + ".");
  });

  // Rule 3, second half: a mapping entry for a profile the table no longer
  // lists is a stale key, the same contract as KNOWN.
  Object.keys(PROFILE_TO_BRANCH).forEach(function (p) {
    if (!seenProfiles[p]) {
      fail("MAPPED   PROFILE_TO_BRANCH names \"" + p + "\" but no row of the " + MANUAL
        + " table carries that profile. Remove the entry or restore the row.");
    }
  });
}

// KNOWN entries that never fired: either the profile left the table or it was
// never in it. Either way the exemption is excusing nothing.
Object.keys(KNOWN).forEach(function (p) {
  if (!usedKnown[p]) {
    fail("STALE    KNOWN names \"" + p + "\" but no row of the " + MANUAL
      + " table broke a rule for it. Remove the entry.");
  }
});

NARRATIVE_FILES.forEach(function (f) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    fail("STALE    NARRATIVE_FILES names " + f + ", which is not in the repo. Remove the entry or restore the file.");
  }
});

if (VERBOSE) {
  console.log("GBP website table, row by row:");
  Object.keys(PROFILE_TO_BRANCH).forEach(function (p) {
    var b = branches.filter(function (x) { return x.id === PROFILE_TO_BRANCH[p]; })[0];
    console.log("  " + (KNOWN[p] ? "held " : "ok   ") + p + "  ->  " + (b ? b.website : "(no branch)"));
  });
  console.log("");
}

warnings.forEach(function (w) { console.log(w); });
failures.forEach(function (f) { console.log(f); });

console.log("\n" + publishedScanned + " published file(s) scanned, "
  + urlValuesChecked + " branches.json URL value(s), "
  + rowsRead + " GBP table row(s), "
  + insecureFound + " insecure URL(s) outside narrative surfaces, "
  + narrativeQuotes + " quoted in narrative surfaces, "
  + Object.keys(usedKnown).length + " held under KNOWN: "
  + failures.length + " failure(s), " + warnings.length + " warning(s).");

process.exit(failures.length ? 1 : 0);
