/*
  check-branch-links.js

  WHY THIS EXISTS
  Every other link checker in this repo reads pages. Nothing read the link
  fields inside branches.json itself, even though those fields are the source
  the landing pages and the GBP packs copy from. A malformed URL there is
  invisible until it has already been printed onto a page or a pack.

  Found by the item 3.8 quality pass on 2026-08-10. Thirteen of the fourteen
  trading branches carried an nhsReviewUrl ending "/leave-a-review", the NHS
  form that actually takes a review. Gordon Short Crosby stopped one segment
  short, at the ODS code, which lands the patient on the profile page instead.
  It had not reached a page only because Gordon Short has no landing page yet.

  WHAT IT CHECKS, per branch in branches.json
  - odsCode is unique across the estate.
  - nhsEmail is exactly pharmacy.<odsCode>@nhs.net.
  - nhsReviewUrl is https://www.nhs.uk/services/pharmacy/<slug>/X<odsCode>/leave-a-review
  - googleReviewUrl is a https://g.page/r/<id>/review link, and no two
    branches share one, or reviews for one shop land on another's listing.
  - website is https, has no trailing slash and no path.
  - pfLink sits on the branch's own website host, ends .html, and names a
    Pharmacy First page the branch itself owns.

  That last rule was added by the item 2.1 quality pass on 2026-08-12. The
  host rule alone is blind on a shared domain: Fishlocks Ainsdale and
  Fishlocks Eccleston are both on fishlockpharmacy.co.uk, as are the two
  McCanns branches and the two Scorahs, so a pfLink pointing at the sister
  branch's page passes the host test, ends .html, and resolves 200. It was
  proved by injection: with fishlocks_ainsdale.pfLink swapped to the Eccleston
  page, all 29 checkers passed once the editor snapshot was refreshed, which
  is the ordinary workflow after any data edit. pfLink is the field item 2.1
  found stale in the first place, and it feeds both the landing page route and
  the GBP pack Pharmacy First button, so a silent swap sends a patient to the
  wrong pharmacy's booking page. check-branch-identity.js rule 10 does this
  resolution for links printed on pages, but never sees a data field.

  A branch with no odsCode (head office) is skipped for the NHS rules. A
  trading branch that has an odsCode but no nhsReviewUrl is a WARNING, not a
  failure, because Clear Chemist Aintree is deliberately different.

  Exceptions go in KNOWN with a reason and a question id, same convention as
  KNOWN_DRIFT in check-cdn-pins.js. A KNOWN key that no longer breaks a rule
  fails the run, so the list cannot rot.

  Exit code 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

// key format: "<branchId>.<field>"
var KNOWN = {
  "tiffenbergs_longmoor.pfLink":
    "Q8 / item 5.3: the Post A Pharmacy First link for this branch has no " +
    ".html ending. It is one of the 11 pfLink values Q8 covers, so it is " +
    "left alone until that question is answered and all 11 move together."
};

var failures = [];
var warnings = [];
var usedKnown = {};

function fail(id, field, msg) {
  var key = id + "." + field;
  if (KNOWN[key]) { usedKnown[key] = true; return; }
  failures.push("  FAIL  " + key + ": " + msg);
}
function warn(id, field, msg) {
  warnings.push("  WARN  " + id + "." + field + ": " + msg);
}

var odsSeen = {};
var googleSeen = {};

// A generated service page is "<service>-<brandSlug>-<townSlug>.html", so the
// branch a page name belongs to is the longest branch key the name ends with.
// Longest wins because one branch key can end with another. This is the same
// resolution rule 10 of check-branch-identity.js uses on page hrefs; here it is
// applied to the pfLink field in the data, which rule 10 never sees.
var byKey = {};
data.branches.forEach(function (b) {
  if (b.disposed) return;
  if (b.brandSlug && b.townSlug) byKey[b.brandSlug + "-" + b.townSlug] = b;
});

function branchFromPageName(name) {
  var best = null;
  var bestLen = -1;
  Object.keys(byKey).forEach(function (k) {
    var suffix = "-" + k;
    if (name.length > suffix.length &&
        name.slice(-suffix.length) === suffix &&
        k.length > bestLen) {
      bestLen = k.length;
      best = byKey[k];
    }
  });
  return best;
}

function hostOf(b) { return b.website || ""; }

data.branches.forEach(function (b) {
  if (b.disposed) return;

  // ---- odsCode uniqueness -------------------------------------------------
  if (b.odsCode) {
    if (odsSeen[b.odsCode]) {
      fail(b.id, "odsCode", "duplicate of " + odsSeen[b.odsCode] +
        " (" + b.odsCode + "). An ODS code identifies one pharmacy contract.");
    }
    odsSeen[b.odsCode] = b.id;
  }

  // ---- nhsEmail -----------------------------------------------------------
  if (b.nhsEmail) {
    if (!b.odsCode) {
      fail(b.id, "nhsEmail", "nhsEmail is set but odsCode is not, so the " +
        "address cannot be verified against anything.");
    } else {
      var wantEmail = "pharmacy." + b.odsCode + "@nhs.net";
      if (b.nhsEmail !== wantEmail) {
        fail(b.id, "nhsEmail", 'is "' + b.nhsEmail + '", expected "' + wantEmail + '".');
      }
    }
  }

  // ---- nhsReviewUrl -------------------------------------------------------
  if (b.nhsReviewUrl) {
    if (!b.odsCode) {
      fail(b.id, "nhsReviewUrl", "nhsReviewUrl is set but odsCode is not.");
    } else {
      var re = new RegExp(
        "^https://www\\.nhs\\.uk/services/pharmacy/[a-z0-9-]+/X" +
        b.odsCode + "/leave-a-review$");
      if (!re.test(b.nhsReviewUrl)) {
        fail(b.id, "nhsReviewUrl", 'is "' + b.nhsReviewUrl + '". Expected ' +
          "https://www.nhs.uk/services/pharmacy/<slug>/X" + b.odsCode +
          "/leave-a-review. Anything short of /leave-a-review lands the " +
          "patient on the profile page instead of the review form.");
      }
    }
  } else if (b.odsCode) {
    warn(b.id, "nhsReviewUrl", "trading branch with an ODS code but no NHS " +
      "review link, so nothing can point patients at its NHS reviews.");
  }

  // ---- googleReviewUrl ----------------------------------------------------
  if (b.googleReviewUrl) {
    if (!/^https:\/\/g\.page\/r\/[A-Za-z0-9_-]+\/review$/.test(b.googleReviewUrl)) {
      fail(b.id, "googleReviewUrl", 'is "' + b.googleReviewUrl +
        '", expected https://g.page/r/<id>/review.');
    }
    if (googleSeen[b.googleReviewUrl]) {
      fail(b.id, "googleReviewUrl", "is the same link as " +
        googleSeen[b.googleReviewUrl] + ", so a review meant for one branch " +
        "would land on the other's listing.");
    }
    googleSeen[b.googleReviewUrl] = b.id;
  }

  // ---- website ------------------------------------------------------------
  if (b.website) {
    if (!/^https:\/\/[a-z0-9.-]+$/.test(b.website)) {
      fail(b.id, "website", 'is "' + b.website + '". Expected https, a bare ' +
        "host, no trailing slash and no path, because other fields are " +
        "compared against it.");
    }
  }

  // ---- pfLink -------------------------------------------------------------
  if (b.pfLink) {
    if (!b.website) {
      fail(b.id, "pfLink", "pfLink is set but website is not, so the host " +
        "cannot be verified.");
    } else if (b.pfLink.indexOf(b.website + "/") !== 0) {
      fail(b.id, "pfLink", 'is "' + b.pfLink + '", which is not on this ' +
        "branch's own site (" + b.website + ").");
    }
    if (!/\.html$/.test(b.pfLink)) {
      fail(b.id, "pfLink", 'is "' + b.pfLink + '" and does not end .html, ' +
        "which Weebly pages normally need.");
    }

    // Ownership. The host rule above cannot see a sister-branch link, because
    // two branches of one brand share a website. Resolve the filename to the
    // branch that owns it and require it to be this branch. A name that
    // resolves to nothing is one of the legacy "pharmacy-first-service-<town>"
    // links Q8 / item 5.3 owns, and is deliberately left alone here.
    var leaf = b.pfLink.split("/").pop().replace(/\.html$/i, "");
    var owner = branchFromPageName(leaf);
    if (owner && owner.id !== b.id) {
      fail(b.id, "pfLink", 'is "' + b.pfLink + '", a Pharmacy First page ' +
        'belonging to ' + owner.id + ' ("' + owner.branchName + '"), not to ' +
        'this branch ("' + b.branchName + '"). ' +
        (hostOf(owner) === hostOf(b)
          ? "Both branches are served from " + (hostOf(b) || "no host") +
            ", so the link resolves and every Pharmacy First route this " +
            "field feeds - the landing page and the GBP pack button - " +
            "quietly books the patient into the wrong pharmacy."
          : "It also sits off this branch's own host."));
    }
  }
});

// ---- stale KNOWN entries ---------------------------------------------------
Object.keys(KNOWN).forEach(function (key) {
  if (!usedKnown[key]) {
    failures.push("  FAIL  stale KNOWN entry " + key + ": it no longer " +
      "breaks any rule, so remove it from KNOWN in this checker.");
  }
});

console.log("check-branch-links");
console.log("  " + data.branches.length + " branch record(s) read from branches.json");
warnings.forEach(function (w) { console.log(w); });
Object.keys(usedKnown).forEach(function (k) {
  console.log("  KNOWN " + k + ": " + KNOWN[k]);
});

if (failures.length) {
  failures.forEach(function (f) { console.log(f); });
  console.log("check-branch-links: " + failures.length + " failure(s).");
  process.exit(1);
}

console.log("check-branch-links: clean, every link field in branches.json " +
  "resolves to the branch that owns it (" + warnings.length + " warning(s), " +
  Object.keys(usedKnown).length + " known issue(s) awaiting a decision).");
