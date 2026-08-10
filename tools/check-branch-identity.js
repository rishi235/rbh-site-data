/*
  tools/check-branch-identity.js - which pharmacy does this page say it is?

  Why this exists
  ---------------
  branches.json carries two names per branch and they are not the same field:

      brandLabel   the brand            "Scorah Chemists"
      branchName   this shop            "Scorah Chemists Hazel Grove"

  For ten of the sixteen branches the two are identical, so nothing turns on
  the choice. For six of them they are not, and those six are exactly the
  branches that share a brand AND a website with a sister shop:

      Fishlocks Chemist   Ainsdale / Eccleston    fishlockpharmacy.co.uk
      McCanns Chemist     Aigburth / Sandringham  mccannspharmacy.co.uk
      Scorah Chemists     Bramhall / Hazel Grove  scorah-chemists.co.uk

  For those six, the bare brandLabel cannot say which shop a page belongs to.
  It is the one string on the page that is supposed to answer that question,
  and it answers it with the name of two shops.

  Two places consume it, and neither is visible copy, which is why no
  existing checker reads them for this:

    1. JSON-LD "name". This is what Google reads to decide whether two
       addresses are one business or two. Handing it the same Pharmacy name
       at two postcodes on one domain is the entity-resolution problem item
       2.2 was created to fix, and the same class as the "@type" divergence
       fixed on the 3.10 pass.
    2. data-branch on #rbhsv-root / #rbhsw-root. service.js and switch.js
       read it to label an enquiry, a callback request and a WhatsApp
       message. On the switch pages it is worse than inert: the page bakes a
       town-specific "source" value ("Fishlocks Chemist Ainsdale Switch
       Page"), and switch.js OVERWRITES it with "Callback request - " +
       data-branch the moment a visitor toggles callback mode, so the one
       field that carried the town is replaced by one that does not.

  What it checks, per generated page
  ----------------------------------
    1. IDENTITY   a page carrying #rbhsv-root or #rbhsw-root carries a
                  non-empty data-branch on it.
    2. OWNER      data-branch is the owning branch's branchName or
                  brandLabel, and never another branch's name.
    3. SCHEMANAME the JSON-LD "name" is the owning branch's branchName or
                  brandLabel, and never another branch's name.
    4. AMBIGUOUS  the rule that matters. Where a branch's brandLabel is
                  carried by more than one trading branch, both fields above
                  must be the branchName. A bare brandLabel there names two
                  pharmacies at once.

  And across the estate
  ---------------------
    5. SITEUNIQUE two branches on one website host never declare the same
                  JSON-LD name.
    6. SPLIT      within one branch, every page declares the same JSON-LD
                  name and the same data-branch, so one branch cannot be two
                  entities depending on which generator built the page.
    7. DATA       in branches.json itself, branchName starts with brandLabel
                  (branch name = brand plus a qualifier, never a divergent
                  spelling), and a branch sharing a brandLabel has a
                  branchName that is not the bare brandLabel.

  Rules 5 and 6 are skipped for a branch already reported under rule 4,
  because there they are the same fault seen from another angle and would
  triple-count it.

  Expected values are composed from branches.json. Nothing is imported from
  the generators, so a generator reaching for the wrong field fails here.

  Exceptions go in KNOWN, keyed "<subject>::<rule>", with a reason and a
  question id. A KNOWN key that no longer breaks its rule fails the run, so
  the list cannot rot.

  Run:  node tools/check-branch-identity.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var PAGE_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "branch", "pages")
];

// ---------------------------------------------------------------------------
// KNOWN - a rule this repo is knowingly breaking while a decision is open.
// Key: "<subject>::<rule>". Remove the entry when the fix lands; a key that
// no longer breaks its rule fails the run.
// ---------------------------------------------------------------------------
var Q18_REASON =
  "Q18: this branch shares its brandLabel and its website with a sister " +
  "branch, so the bare brandLabel names two pharmacies. Five generators " +
  "(build-service-pages, build-switch-pages, build-weight-loss-pages, " +
  "build-travel-clinic-pages, build-contraception-pages) map " +
  "brand: b.brandLabel and use it for both the JSON-LD name and " +
  "data-branch, so 12 of this branch's 13 pages identify themselves by the " +
  "brand. The sixth generator, build-branch-landing-pages, uses " +
  "b.branchName, so the 13th page identifies the shop. Not changed " +
  "autonomously: the JSON-LD name is what Google reads to decide whether " +
  "two addresses are one business or two, so moving it is a search " +
  "decision, and it puts 72 pages into a Weebly repaste queue that is " +
  "already the bottleneck. Remove this entry when Q18 is answered and " +
  "applied.";

var KNOWN = {};
[
  "fishlocks_ainsdale",
  "fishlocks_eccleston",
  "mccanns_aigburth",
  "mccanns_sandringham",
  "scorah_bramhall",
  "scorah_hazel"
].forEach(function (id) {
  KNOWN[id + "::ambiguous"] = { question: "Q18", reason: Q18_REASON };
});

var failures = [];
var warnings = [];
var notes = [];
var knownHit = {};

function fail(subject, rule, msg) {
  var key = subject + "::" + rule;
  if (KNOWN[key]) { knownHit[key] = true; return true; }
  failures.push(msg);
  return false;
}
function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

// ---------------------------------------------------------------------------
// branches.json
// ---------------------------------------------------------------------------
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

var byId = {};
var byKey = {};
branches.forEach(function (b) {
  byId[b.id] = b;
  if (b.brandSlug && b.townSlug) byKey[b.brandSlug + "-" + b.townSlug] = b;
});

// How many trading branches carry each brandLabel?
var brandCount = {};
branches.forEach(function (b) {
  brandCount[b.brandLabel] = (brandCount[b.brandLabel] || 0) + 1;
});
function sharesBrand(b) { return brandCount[b.brandLabel] > 1; }

// Every branch name in the estate, so a page can be caught naming another shop.
var allNames = {};
branches.forEach(function (b) {
  allNames[b.branchName] = b.id;
  if (!allNames[b.brandLabel]) allNames[b.brandLabel] = b.id;
});

// ---------------------------------------------------------------------------
// Rule 7: the data itself, before any page is read.
// ---------------------------------------------------------------------------
branches.forEach(function (b) {
  if (!b.branchName || !b.brandLabel) {
    fail(b.id, "data", b.id + ": branchName or brandLabel is missing from " +
      "branches.json, so no page can name this branch");
    return;
  }
  if (b.branchName !== b.brandLabel && b.branchName.indexOf(b.brandLabel) !== 0) {
    fail(b.id, "data", b.id + ': branchName "' + b.branchName + '" does not ' +
      'start with brandLabel "' + b.brandLabel + '". A branch name is the ' +
      "brand plus a qualifier; a divergent spelling means the two fields " +
      "name different businesses");
  }
  if (sharesBrand(b) && b.branchName === b.brandLabel) {
    fail(b.id, "data", b.id + ': brandLabel "' + b.brandLabel + '" is shared ' +
      "with a sister branch and branchName is the same string, so nothing in " +
      "branches.json can tell the two shops apart");
  }
});

// ---------------------------------------------------------------------------
// Walk the generated pages.
// ---------------------------------------------------------------------------
var keys = Object.keys(byKey).sort(function (a, b) { return b.length - a.length; });

function ownerOf(slug) {
  for (var i = 0; i < keys.length; i++) {
    if (slug === keys[i] || slug.slice(-(keys[i].length + 1)) === "-" + keys[i]) {
      return byKey[keys[i]];
    }
  }
  return null;
}

function rootAttr(html, name) {
  var root = /<div id="rbhs[vw]-root"([^>]*)>/.exec(html);
  if (!root) return undefined;            // no module root on this page
  var m = new RegExp(name + '="([^"]*)"').exec(root[1]);
  return m ? m[1] : null;                 // root present, attribute absent
}

function schemaName(html) {
  var m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return undefined;
  try {
    var obj = JSON.parse(m[1]);
    return typeof obj.name === "string" ? obj.name : null;
  } catch (e) {
    return null;
  }
}

var pages = [];
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (f) {
    if (!/\.html$/.test(f)) return;
    pages.push({ file: f, path: path.join(dir, f), html: fs.readFileSync(path.join(dir, f), "utf8") });
  });
});

var seen = {};        // branchId -> { dataBranch: {value:[files]}, schema: {value:[files]} }
var ambiguous = {};   // branchId -> true, so rules 5 and 6 do not re-report it
var counted = 0;
var withRoot = 0;
var withSchema = 0;

pages.forEach(function (p) {
  var slug = p.file.replace(/\.html$/, "");
  var b = ownerOf(slug);
  if (!b) {
    failures.push(rel(p.path) + ": no branch in branches.json owns this " +
      "filename, so nothing can say which pharmacy the page belongs to");
    return;
  }
  counted++;
  var rec = seen[b.id] = seen[b.id] || { dataBranch: {}, schema: {} };

  // Rule 1 and 2: data-branch.
  var db = rootAttr(p.html, "data-branch");
  if (db !== undefined) {
    withRoot++;
    if (db === null || db === "") {
      fail(slug, "identity", rel(p.path) + " carries a module root but no " +
        'data-branch, so an enquiry from it is labelled "our pharmacy"');
    } else {
      (rec.dataBranch[db] = rec.dataBranch[db] || []).push(p.file);
      if (db !== b.branchName && db !== b.brandLabel) {
        fail(slug, "owner", rel(p.path) + ': data-branch="' + db + '" but ' +
          "the page belongs to " + b.id + ' ("' + b.branchName + '")' +
          (allNames[db] ? " - that is " + allNames[db] + "'s name, so an " +
            "enquiry from this page is filed against the wrong pharmacy" : ""));
      }
    }
  }

  // Rule 3: JSON-LD name.
  var sn = schemaName(p.html);
  if (sn !== undefined) {
    withSchema++;
    if (sn === null) {
      fail(slug, "schemaname", rel(p.path) + ": the JSON-LD block has no " +
        "usable \"name\", so the structured data names no business");
    } else {
      (rec.schema[sn] = rec.schema[sn] || []).push(p.file);
      if (sn !== b.branchName && sn !== b.brandLabel) {
        fail(slug, "schemaname", rel(p.path) + ': JSON-LD name "' + sn +
          '" but the page belongs to ' + b.id + ' ("' + b.branchName + '")' +
          (allNames[sn] ? " - that is " + allNames[sn] + "'s name, so Google " +
            "is told this address belongs to another pharmacy" : ""));
      }
    }
  }

  // Rule 4: the bare brandLabel is not an identity where a brand is shared.
  if (sharesBrand(b)) {
    var bad = [];
    if (db === b.brandLabel && db !== b.branchName) bad.push("data-branch");
    if (sn === b.brandLabel && sn !== b.branchName) bad.push("JSON-LD name");
    if (bad.length) {
      ambiguous[b.id] = true;
      fail(b.id, "ambiguous", rel(p.path) + ": " + bad.join(" and ") +
        ' read "' + b.brandLabel + '", which is also the name of this ' +
        "branch's sister shop on the same website. It cannot say which of " +
        "the two this page is; branchName (\"" + b.branchName + "\") can");
    }
  }
});

// ---------------------------------------------------------------------------
// Rule 6: one branch, one identity, whichever generator built the page.
// ---------------------------------------------------------------------------
Object.keys(seen).forEach(function (id) {
  if (ambiguous[id]) return;              // already reported under rule 4
  ["dataBranch", "schema"].forEach(function (field) {
    var values = Object.keys(seen[id][field]);
    if (values.length < 2) return;
    var label = field === "schema" ? "JSON-LD name" : "data-branch";
    fail(id, "split", id + ": its pages declare " + values.length +
      " different values for " + label + " (" +
      values.map(function (v) {
        return '"' + v + '" on ' + seen[id][field][v].length + " page(s)";
      }).join(", ") + "), so one branch presents itself as more than one " +
      "business depending on which generator built the page");
  });
});

// ---------------------------------------------------------------------------
// Rule 5: two branches on one host must not declare the same JSON-LD name.
// ---------------------------------------------------------------------------
var byHost = {};
branches.forEach(function (b) {
  if (!b.website || !seen[b.id]) return;
  var host = b.website.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  (byHost[host] = byHost[host] || []).push(b);
});
Object.keys(byHost).forEach(function (host) {
  var group = byHost[host];
  if (group.length < 2) return;
  var claimed = {};
  group.forEach(function (b) {
    Object.keys(seen[b.id].schema).forEach(function (name) {
      (claimed[name] = claimed[name] || []).push(b);
    });
  });
  Object.keys(claimed).forEach(function (name) {
    var owners = claimed[name];
    if (owners.length < 2) return;
    if (owners.every(function (b) { return ambiguous[b.id]; })) return;
    fail(host, "siteunique", host + ': branches ' +
      owners.map(function (b) { return b.id; }).join(" and ") +
      ' both publish JSON-LD name "' + name + '" on one website, at ' +
      owners.map(function (b) { return b.postalCode; }).join(" and ") +
      ", so Google is handed two Pharmacy records with one name and two " +
      "addresses and has to guess whether they are one business or two");
  });
});

// ---------------------------------------------------------------------------
// Stale KNOWN keys.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (k) {
  if (!knownHit[k]) {
    failures.push("KNOWN entry " + k + " (" + KNOWN[k].question + ") no longer " +
      "breaks its rule - remove it from check-branch-identity.js so the list " +
      "cannot rot");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
var sharedBrands = Object.keys(brandCount).filter(function (n) {
  return brandCount[n] > 1;
});
notes.push(sharedBrands.length + " brand(s) carried by more than one trading " +
  "branch, where brandLabel alone cannot identify a shop: " +
  sharedBrands.join(", "));

console.log("check-branch-identity");
console.log("  " + counted + " page(s) matched to a branch, " + withRoot +
  " with a module root, " + withSchema + " with a JSON-LD block");
console.log("  " + branches.length + " trading branch(es), " +
  Object.keys(byHost).filter(function (h) { return byHost[h].length > 1; }).length +
  " website(s) shared by a pair");
console.log("");

warnings.forEach(function (w) { console.log("  WARN  " + w); });
notes.forEach(function (n) { console.log("  NOTE  " + n); });
Object.keys(knownHit).forEach(function (k) {
  console.log("  KNOWN " + k + " (" + KNOWN[k].question + "): " + KNOWN[k].reason);
});

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("\ncheck-branch-identity: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-branch-identity: clean, every page names the branch it " +
  "belongs to" +
  (Object.keys(knownHit).length ? ", " + Object.keys(knownHit).length +
    " known issue(s) awaiting a decision" : "") + ".");
process.exit(0);
