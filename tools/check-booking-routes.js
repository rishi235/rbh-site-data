/*
  tools/check-booking-routes.js - the booking chain, end to end.

  Why this exists
  ---------------
  A generated service page does NOT carry its Appointedd widget id. The page
  ships an empty mount:

      <div id="rbhsv-booking"></div>
      <!-- widget rendered by service.js from branches.json -->

  modules/service/service.js then reads the LIVE URL, splits it into a service
  slug and a brandSlug-townSlug key, looks that key up in branches.json, and
  renders the widget id it finds. That was a deliberate fix: six pages once
  hard-coded the wrong id and sent bookings into another branch's diary
  (verified 2026-07-17), so the data layer became the single source of truth.

  The cost of that design is a chain nothing checked:

      branches.json (brandSlug + townSlug + widgets)
        -> generated filename
        -> paste-sheet permalink
        -> live URL
        -> service.js routing table
        -> Appointedd widget id

  check-seo-sheets already ties the filename to the permalink. Everything
  after that was unguarded. A link that breaks anywhere along it does not
  show up as a wrong word on a page: it shows up as an empty white booking
  box, or as a patient booked into the wrong diary, while every visible line
  on the page still reads correctly. That is the same class of silent fault
  as the map iframe in check-jsonld.js.

  What it checks, per page carrying a booking mount
  -------------------------------------------------
    1. ROUTE       the filename parses under service.js's OWN routing regex.
    2. BRANCH      the brandSlug-townSlug key resolves to exactly one
                   non-disposed branch in branches.json.
    3. WIDGET      that branch holds a usable widget id for the page's
                   service, under service.js's own fallback rules.
    4. BRANCHATTR  data-branch on #rbhsv-root names the branch the URL
                   resolves to. It is what labels the enquiry email and the
                   WhatsApp message, so a wrong one misfiles a real enquiry.
    5. SERVICEATTR data-service is present and every page of the same service
                   slug carries the same wording.

  And across the estate
  ---------------------
    6. KEYUNIQUE   no two trading branches share a brandSlug-townSlug key,
                   which would make the URL ambiguous.
    7. DIARY       within one branch, two different services never share one
                   Appointedd id. (Sister branches sharing an id is normal:
                   Scorah, McCanns and Fishlocks each run one weight loss and
                   one travel diary across their pair. That is reported, not
                   failed.)
    8. TABLES      service.js's routing regex and its SERVICE_WIDGET_KEYS map
                   list exactly the same service slugs, and every slug the
                   repo actually generates a booking page for is in them.
    9. FALLBACK    the one that matters. service.js lets a page fall back to
                   the branch's Pharmacy First diary when it has no widget of
                   its own. That is right for the seven Pharmacy First
                   conditions, because Pharmacy First is the service that
                   covers them. It is wrong for a separate service with its
                   own diary. Which is which is NOT hardcoded here: a service
                   counts as a Pharmacy First condition if and only if the
                   branch's own Pharmacy First overview page links to it.
                   Anything else must appear in NO_FALLBACK_SERVICE_KEYS.

  Expected values are composed from branches.json and from the generated
  pages. service.js's two tables are read as DATA UNDER TEST, not imported,
  so a service added to the generators and forgotten in service.js fails here
  rather than shipping as an empty booking box.

  Exceptions go in KNOWN, keyed "<subject>::<rule>", with a reason and a
  question id. A KNOWN key that no longer breaks its rule fails the run, so
  the list cannot rot.

  Run:  node tools/check-booking-routes.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var SERVICE_JS = path.join(ROOT, "modules", "service", "service.js");

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
var KNOWN = {
  "contraception::fallback": {
    question: "Q17",
    reason:
      "The NHS Pharmacy Contraception Service has its own Appointedd diary at " +
      "all 14 branches that offer it, and no branch's Pharmacy First overview " +
      "links to it, so falling back to the Pharmacy First diary would book a " +
      "patient into the wrong service. Fixing it means editing service.js, " +
      "which is a CDN-pinned asset: today modules/service/service.js is " +
      "byte-identical between origin/main and the pinned ref " +
      "service-module-phase1, and Q13's recommended fix (fast-forward the " +
      "pinned branch to main) is free only while that stays true. The fault " +
      "is latent - check-page-coverage only earns a contraception page where " +
      "the branch holds a contraception widget - so the fix belongs in the " +
      "same supervised session that answers Q13, not in an unattended run " +
      "that would make Q13 more expensive."
  }
};

var failures = [];
var warnings = [];
var notes = [];
var knownHit = {};

function fail(subject, rule, msg) {
  var key = subject + "::" + rule;
  if (KNOWN[key]) { knownHit[key] = true; return; }
  failures.push(msg);
}
function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

// ---------------------------------------------------------------------------
// Read service.js's routing tables as data under test.
// ---------------------------------------------------------------------------
if (!fs.existsSync(SERVICE_JS)) {
  console.log("check-booking-routes\n\n  FAIL " + rel(SERVICE_JS) + " not found");
  process.exit(1);
}
var js = fs.readFileSync(SERVICE_JS, "utf8");

function objectBlock(name) {
  var start = js.indexOf("var " + name + " = {");
  if (start === -1) return null;
  var end = js.indexOf("};", start);
  if (end === -1) return null;
  return js.slice(start, end);
}

var swkBlock = objectBlock("SERVICE_WIDGET_KEYS");
var nfBlock = objectBlock("NO_FALLBACK_SERVICE_KEYS");
if (!swkBlock) failures.push("could not find SERVICE_WIDGET_KEYS in " + rel(SERVICE_JS));
if (!nfBlock) failures.push("could not find NO_FALLBACK_SERVICE_KEYS in " + rel(SERVICE_JS));

var SERVICE_WIDGET_KEYS = {};
if (swkBlock) {
  var pair;
  var pairRe = /"([a-z0-9-]+)"\s*:\s*"([A-Za-z0-9_]+)"/g;
  while ((pair = pairRe.exec(swkBlock))) SERVICE_WIDGET_KEYS[pair[1]] = pair[2];
}

var NO_FALLBACK = {};
if (nfBlock) {
  var nf;
  var nfRe = /"([A-Za-z0-9_]+)"\s*:\s*true/g;
  while ((nf = nfRe.exec(nfBlock))) NO_FALLBACK[nf[1]] = true;
}

// The routing regex: pull the service-slug alternation out of the literal
// that service.js matches location.pathname against.
var routeSlugs = [];
var routeSrc = /location\.pathname\.match\(\s*\/\^\\\/\(([^)]+)\)/.exec(js);
if (!routeSrc) {
  failures.push("could not read the routing regex in " + rel(SERVICE_JS) +
    " - if its shape changed, this checker must be updated with it");
} else {
  routeSlugs = routeSrc[1].split("|");
}

// ---------------------------------------------------------------------------
// Rule 8: the two tables must describe the same set of services.
// ---------------------------------------------------------------------------
var swkSlugs = Object.keys(SERVICE_WIDGET_KEYS).sort();
if (routeSlugs.length) {
  var routeSorted = routeSlugs.slice().sort();
  routeSorted.forEach(function (s) {
    if (swkSlugs.indexOf(s) === -1) {
      fail(s, "tables", "service.js: the routing regex accepts \"" + s +
        "\" but SERVICE_WIDGET_KEYS has no entry for it, so the page would " +
        "match a route and then render no widget");
    }
  });
  swkSlugs.forEach(function (s) {
    if (routeSorted.indexOf(s) === -1) {
      fail(s, "tables", "service.js: SERVICE_WIDGET_KEYS lists \"" + s +
        "\" but the routing regex does not accept it, so that page is never " +
        "routed and its booking mount stays empty");
    }
  });
}

// ---------------------------------------------------------------------------
// branches.json
// ---------------------------------------------------------------------------
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

// Rule 6: routing keys unique.
var byKey = {};
branches.forEach(function (b) {
  if (!b.brandSlug || !b.townSlug) return;
  var k = b.brandSlug + "-" + b.townSlug;
  (byKey[k] = byKey[k] || []).push(b);
});
Object.keys(byKey).forEach(function (k) {
  if (byKey[k].length > 1) {
    fail(k, "keyunique", "routing key \"" + k + "\" is shared by " +
      byKey[k].map(function (b) { return b.id; }).join(" and ") +
      " - one live URL, two branches, so a booking could land in either diary");
  }
});

// Rule 7: within a branch, two services must not share one diary.
var sharedAcrossBranches = 0;
var idOwners = {};
branches.forEach(function (b) {
  var w = b.widgets || {};
  var seen = {};
  Object.keys(w).forEach(function (k) {
    (seen[w[k]] = seen[w[k]] || []).push(k);
    (idOwners[w[k]] = idOwners[w[k]] || []).push(b.id);
  });
  Object.keys(seen).forEach(function (id) {
    if (seen[id].length > 1) {
      fail(b.id, "diary", b.id + ": services " + seen[id].join(" and ") +
        " share one Appointedd id (" + id + "), so a booking for one lands " +
        "in the other's diary");
    }
  });
});
Object.keys(idOwners).forEach(function (id) {
  var owners = idOwners[id].filter(function (v, i, a) { return a.indexOf(v) === i; });
  if (owners.length > 1) sharedAcrossBranches++;
});

// ---------------------------------------------------------------------------
// Walk the generated pages.
// ---------------------------------------------------------------------------
var ROUTE_RE = routeSlugs.length
  ? new RegExp("^(" + routeSlugs.join("|") + ")-([a-z0-9-]+?)(?:\\.html?)?$")
  : null;

var pages = [];
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (f) {
    if (!/\.html$/.test(f)) return;
    pages.push({ dir: dir, file: f, html: fs.readFileSync(path.join(dir, f), "utf8") });
  });
});

function attr(html, name) {
  var root = /<div id="rbhsv-root"([^>]*)>/.exec(html);
  if (!root) return null;
  var m = new RegExp(name + '="([^"]*)"').exec(root[1]);
  return m ? m[1] : null;
}

var serviceWording = {};   // slug -> { wording: [files] }
var routed = 0;
var mounts = 0;

pages.forEach(function (p) {
  if (p.html.indexOf('id="rbhsv-booking"') === -1) return;
  mounts++;
  var slug = p.file.replace(/\.html$/, "");

  if (!ROUTE_RE) return;
  var m = ROUTE_RE.exec(slug);
  if (!m) {
    fail(slug, "route", slug + ".html carries a booking mount but its filename " +
      "does not parse under service.js's routing regex, so the widget is never " +
      "rendered and the page shows an empty booking box");
    return;
  }
  var serviceSlug = m[1];
  var branchKey = m[2];
  var widgetKey = SERVICE_WIDGET_KEYS[serviceSlug];

  var b = byKey[branchKey] ? byKey[branchKey][0] : null;
  if (!b) {
    fail(slug, "branch", slug + ".html routes to branch key \"" + branchKey +
      "\", which matches no trading branch in branches.json, so no widget is " +
      "rendered");
    return;
  }
  routed++;

  // Rule 3: a usable widget, under service.js's own fallback rules.
  var w = b.widgets || {};
  var own = w[widgetKey];
  var usable = own;
  if (!usable && !NO_FALLBACK[widgetKey]) usable = w.pharmacyFirst;
  if (!usable) {
    fail(slug, "widget", slug + ".html needs widgets." + widgetKey + " on " +
      b.id + " and there is none" +
      (NO_FALLBACK[widgetKey] ? " (this service must not fall back)" : "") +
      ", so the booking box renders empty");
  }

  // Rule 4: data-branch names the branch the URL resolves to.
  var dBranch = attr(p.html, "data-branch");
  if (dBranch === null) {
    fail(slug, "branchattr", slug + ".html has a booking mount but no " +
      "data-branch on #rbhsv-root, so an enquiry from it is labelled " +
      '"our pharmacy"');
  } else if (dBranch !== b.branchName && dBranch !== b.brandLabel) {
    fail(slug, "branchattr", slug + '.html: data-branch="' + dBranch +
      '" but the URL resolves to ' + b.id + ' ("' + b.branchName +
      '"), so an enquiry from this page is filed against the wrong pharmacy');
  }

  // Rule 5: data-service present and consistent per service slug.
  var dService = attr(p.html, "data-service");
  if (dService === null || dService === "") {
    fail(slug, "serviceattr", slug + ".html has a booking mount but no " +
      "data-service on #rbhsv-root, so the enquiry is labelled " +
      '"Pharmacy service"');
  } else {
    serviceWording[serviceSlug] = serviceWording[serviceSlug] || {};
    (serviceWording[serviceSlug][dService] = serviceWording[serviceSlug][dService] || []).push(slug);
  }
});

Object.keys(serviceWording).forEach(function (s) {
  var wordings = Object.keys(serviceWording[s]);
  if (wordings.length > 1) {
    fail(s, "serviceattr", "service \"" + s + "\" is described " + wordings.length +
      " different ways in data-service, so the same service reaches the helpdesk " +
      "under different names: " + wordings.map(function (wd) {
        return '"' + wd + '" x' + serviceWording[s][wd].length;
      }).join(", "));
  }
});

// Rule 8b: every service slug the repo generates a booking page for is routable.
Object.keys(serviceWording).forEach(function (s) {
  if (!SERVICE_WIDGET_KEYS[s]) {
    fail(s, "tables", "the repo generates booking pages for \"" + s +
      "\" but service.js has no SERVICE_WIDGET_KEYS entry for it");
  }
});

// ---------------------------------------------------------------------------
// Rule 9: only a Pharmacy First condition may fall back to the Pharmacy First
// diary. Which services are Pharmacy First conditions is read from the
// Pharmacy First overview pages themselves, not hardcoded here.
// ---------------------------------------------------------------------------
var pfConditions = {};
pages.forEach(function (p) {
  if (p.file.indexOf("pharmacy-first-") !== 0) return;
  var key = p.file.replace(/^pharmacy-first-/, "").replace(/\.html$/, "");
  Object.keys(SERVICE_WIDGET_KEYS).forEach(function (s) {
    if (s === "pharmacy-first") return;
    if (p.html.indexOf(s + "-" + key + ".html") !== -1) pfConditions[s] = true;
  });
});

Object.keys(SERVICE_WIDGET_KEYS).forEach(function (s) {
  if (s === "pharmacy-first") return;
  var widgetKey = SERVICE_WIDGET_KEYS[s];
  if (pfConditions[s]) {
    if (NO_FALLBACK[widgetKey]) {
      fail(s, "fallback", "\"" + s + "\" is linked from the Pharmacy First " +
        "overview, so it is a Pharmacy First condition and should be allowed " +
        "to fall back to that diary, but it is listed in " +
        "NO_FALLBACK_SERVICE_KEYS");
    }
    return;
  }
  // Not a Pharmacy First condition. Does any branch actually run it on the
  // Pharmacy First diary? If not, a fallback there is always wrong.
  var holders = 0, sharesPf = 0;
  branches.forEach(function (b) {
    var w = b.widgets || {};
    if (!w[widgetKey]) return;
    holders++;
    if (w[widgetKey] === w.pharmacyFirst) sharesPf++;
  });
  if (holders && sharesPf === 0 && !NO_FALLBACK[widgetKey]) {
    fail(s, "fallback", "\"" + s + "\" is not linked from any Pharmacy First " +
      "overview and has its own diary at all " + holders + " branch(es) that " +
      "offer it, so service.js falling back to the Pharmacy First widget would " +
      "book a patient into the wrong service. It is missing from " +
      "NO_FALLBACK_SERVICE_KEYS");
  }
});

// ---------------------------------------------------------------------------
// Stale KNOWN keys.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (k) {
  if (!knownHit[k]) {
    failures.push("KNOWN entry " + k + " (" + KNOWN[k].question + ") no longer " +
      "breaks its rule - remove it from check-booking-routes.js so the list " +
      "cannot rot");
  }
});

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-booking-routes");
console.log("  " + mounts + " page(s) with a booking mount, " + routed + " routed to a branch");
console.log("  service.js routes " + routeSlugs.length + " service slug(s); " +
  Object.keys(NO_FALLBACK).length + " may not fall back to the Pharmacy First diary");
console.log("  " + Object.keys(pfConditions).length + " Pharmacy First condition(s) read from the overview pages");
console.log("  " + sharedAcrossBranches + " widget id(s) shared between sister branches (one diary per pair, expected)");
console.log("");

warnings.forEach(function (w) { console.log("  WARN  " + w); });
notes.forEach(function (n) { console.log("  NOTE  " + n); });
Object.keys(knownHit).forEach(function (k) {
  console.log("  KNOWN " + k + " (" + KNOWN[k].question + "): " + KNOWN[k].reason);
});

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("\ncheck-booking-routes: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-booking-routes: clean, every booking mount routes to the right " +
  "branch and the right diary" +
  (Object.keys(knownHit).length ? ", " + Object.keys(knownHit).length + " known issue(s) awaiting a decision" : "") + ".");
process.exit(0);
