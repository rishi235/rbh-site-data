/*
  check-address-region.js

  WHY THIS EXISTS
  addressRegion is the schema.org PostalAddress field. For a GB address it
  must hold the COUNTY, because that is the first-order administrative
  division Google reads out of LocalBusiness structured data. A borough or a
  district in that field is wrong, and no other checker could see it:
  check-nap proves every page AGREES with branches.json, which stays green
  even when branches.json itself carries the wrong value.

  Found by the item 3.3 quality pass on 2026-08-09: Fishlocks Eccleston
  carried "Chorley" (a borough of Lancashire) where every other branch
  carried a county. It had been noticed on 2026-08-05 and left, because the
  same field also feeds the landing page title, where "Eccleston, Chorley" is
  the stronger local search qualifier. The two uses are now separate fields:
  addressRegion is the county for schema, seoRegion is the optional title
  qualifier. This checker guards the schema half.

  RBH is a North West England group, so the allow-list is the four counties
  the estate can legitimately sit in. If the group ever buys outside the
  North West, add the county here rather than widening the rule.

  Exit code 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var data = JSON.parse(fs.readFileSync(path.join(ROOT, "branches.json"), "utf8"));

// Ceremonial counties covering RB Healthcare's estate.
var COUNTIES = [
  "Merseyside",
  "Greater Manchester",
  "Lancashire",
  "Cheshire"
];

var failures = [];
var warnings = [];
var checked = 0;

data.branches.forEach(function (b) {
  if (b.disposed) return;
  checked++;

  var region = b.addressRegion || "";

  if (!region) {
    failures.push(b.id + ": addressRegion is empty. Schema needs the county.");
    return;
  }

  if (COUNTIES.indexOf(region) === -1) {
    failures.push(
      b.id + ': addressRegion is "' + region + '", which is not one of the ' +
      "counties this group trades in (" + COUNTIES.join(", ") + "). " +
      "addressRegion must be the county, not a borough, district or town. " +
      "If it was meant as a search qualifier, put it in seoRegion instead."
    );
    return;
  }

  if (region === b.addressLocality) {
    failures.push(
      b.id + ': addressRegion equals addressLocality ("' + region + '"). ' +
      "One of them is wrong; the region must be the wider county."
    );
    return;
  }

  // seoRegion is optional. Where it is set it should differ from the county,
  // otherwise it is redundant and will drift.
  if (b.seoRegion && b.seoRegion === region) {
    warnings.push(
      b.id + ': seoRegion equals addressRegion ("' + region + '"), so it is ' +
      "doing nothing. Remove it, or the two will drift apart."
    );
  }
  if (b.seoRegion && b.seoRegion === b.seoTown) {
    warnings.push(
      b.id + ': seoRegion equals seoTown ("' + b.seoTown + '"), which would ' +
      "produce a landing title reading \"in X, X\"."
    );
  }
});

/*
  SECOND PASS: seoTown, the word every page title claims as the catchment.

  Added by the item 3.6 quality pass on 2026-08-10. seoTown drives the title,
  the description, the H1 and the permalink on every page a branch owns, so a
  seoTown that is not really a place is 12 pages aimed at a word nobody
  searches. Nothing could see that, because check-seo-pattern only proves the
  pages agree with seoTown, not that seoTown is sound.

  The test used here is the estate's own data rather than an opinion about
  geography: serviceAreaList is the list of places a branch says it serves,
  and for 15 of the 16 branches the seoTown is the first entry in it. The
  exception was McCanns Sandringham, whose pages said "in Sandringham" while its
  own service area list and its GBP pack both said Aigburth, St Michael's,
  Lark Lane and Dingle, and never Sandringham. Both now lead with St Michael's:
  the list on the item 5.2 pass, the pack on the item 5.7 pass, which also gave
  check-gbp-packs.js a rule so a pack and its seoTown cannot drift again.
  Raised as Q15, answered by Rishi
  on 2026-08-10 and applied as worklist item 5.7: the local word moved to
  St Michael's, the next place in the branch's own list, and townSlug was held
  at "sandringham" on purpose so no live permalink breaks and no redirects are
  needed. That deliberate hold is the one exception carried below.

  THE LEAD ENTRY RULE, added by the item 5.2 quality pass on 2026-08-13.
  The 2026-08-10 pass on the same item found McCanns Sandringham leading its
  own serviceAreaList with Aigburth, its SISTER branch's town on the shared
  mccannspharmacy.co.uk domain, and fixed the data. No rule was added, so the
  defect could come straight back. Everything below it in this file only ever
  said "harmless today", and it is not harmless on any branch that has a
  landing page.

  Proved by injection on 2026-08-13 rather than argued: putting Aigburth back
  at the head of that list and regenerating changed FIVE things on the live
  paste artefact - the Weebly SEO description, the paste sheet in SEO.md, the
  hero sentence, the delivery answer in the FAQ, and the order of areaServed
  in the Pharmacy schema. Twenty-nine of the thirty checkers stayed green. The
  thirtieth, check-editor-snapshot, failed only because branches.json had been
  edited at all, and its own message tells the operator to refresh the
  snapshot, which clears it and leaves the defect in place with a full green
  board. Same shape as the pfLink injection on the item 2.1 pass.

  Why the lead entry specifically. tools/build-branch-landing-pages.js trims
  the serving list from the END, a town at a time, until the description fits
  165 characters, so the FIRST entry is the one town guaranteed to survive
  truncation. Handing that position to another branch's town is the one
  ordering mistake that cannot be absorbed.

  The rule: serviceAreaList[0] must not be a place another live branch claims
  as its seoTown. Ordinary ordering preferences stay a warning, because
  Cherry Lane leads with Liverpool, which no branch owns, and that is a
  judgement call rather than a fault. Exceptions go in KNOWN_SEO_TOWN under
  the "areaLead" rule with a reason and a question id.
*/

// Accepted exceptions, keyed "<branch id>::<rule>". Each needs a reason and a
// question id, and the check fails on a key that no longer breaks its rule, so
// the list cannot go stale.
var KNOWN_SEO_TOWN = {
  "mccanns_sandringham::townSlug": {
    question: "Q15",
    reason: "townSlug is deliberately held at 'sandringham' while seoTown reads " +
      "'St Michael's'. Rishi's answer moved the local word in the copy but kept " +
      "the permalinks, so no live URL breaks and no redirects are needed. The " +
      "title and the URL naming different places is the accepted cost."
  }
};

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalise(s) {
  return String(s).toLowerCase().replace(/['’]/g, "").replace(/\s+/g, " ").trim();
}

var seenKnown = {};
var byDomain = {};

// Which live branches claim each town as their seoTown. A town can have more
// than one owner across DIFFERENT domains, which is allowed and normal:
// Ainsdale is claimed by Fishlocks and Hirshmans, Bootle by Smartts and SK,
// Aintree by Clear Chemist and Tiffenbergs, Walton by Cherry Lane and
// Coleman and Leighs. Only same-domain collisions are a fault, and the pass
// further down already catches those.
var townOwners = {};
data.branches.forEach(function (b) {
  if (b.disposed || !b.seoTown) return;
  var t = normalise(b.seoTown);
  townOwners[t] = townOwners[t] || [];
  townOwners[t].push(b);
});

function hostOf(b) {
  return String(b.website || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
}

data.branches.forEach(function (b) {
  if (b.disposed) return;
  if (!b.seoTown) return; // head office has no seoTown, which is correct

  var areas = (b.serviceAreaList || []).map(normalise);
  var town = normalise(b.seoTown);
  var known = KNOWN_SEO_TOWN[b.id + "::seoTownInList"];

  if (areas.indexOf(town) === -1) {
    if (known) {
      seenKnown[b.id + "::seoTownInList"] = true;
      warnings.push(
        "KNOWN " + b.id + ': seoTown "' + b.seoTown + '" is not in its own ' +
        "serviceAreaList [" + (b.serviceAreaList || []).join(", ") + "]. " +
        known.question + ": " + known.reason
      );
    } else {
      failures.push(
        b.id + ': seoTown "' + b.seoTown + '" does not appear in its own ' +
        "serviceAreaList [" + (b.serviceAreaList || []).join(", ") + "]. " +
        "Every page for this branch claims that word in its title, H1 and " +
        "permalink, so either the word is wrong or the service area list is."
      );
    }
  }

  // ---- the lead entry -----------------------------------------------------
  // serviceAreaList[0] is the town the landing page copy leads with and the
  // only one guaranteed to survive the 165-character trim, so it must not be
  // a town another branch owns. Ordering that merely puts the branch's own
  // seoTown second stays a warning.
  var firstRaw = (b.serviceAreaList || [])[0];
  if (firstRaw && areas[0] !== town) {
    var leadKnown = KNOWN_SEO_TOWN[b.id + "::areaLead"];
    var owners = (townOwners[areas[0]] || []).filter(function (o) { return o.id !== b.id; });

    if (owners.length && leadKnown) {
      seenKnown[b.id + "::areaLead"] = true;
      warnings.push(
        "KNOWN " + b.id + ': serviceAreaList leads with "' + firstRaw +
        '", which belongs to ' + owners.map(function (o) { return o.id; }).join(" and ") +
        ". " + leadKnown.question + ": " + leadKnown.reason
      );
    } else if (owners.length) {
      var sameDomain = owners.filter(function (o) { return hostOf(o) && hostOf(o) === hostOf(b); });
      failures.push(
        b.id + ': serviceAreaList leads with "' + firstRaw + '", which is the ' +
        "seoTown of " + owners.map(function (o) {
          return o.id + ' ("' + o.branchName + '")';
        }).join(" and ") + ', not of this branch ("' + b.seoTown + '"). ' +
        "The first entry is what the landing page description, the paste " +
        "sheet, the hero sentence, the FAQ delivery answer and the areaServed " +
        "schema all lead with, and the description trims from the end, so " +
        "this is the one town that cannot be trimmed away. " +
        (sameDomain.length
          ? "Worse here: " + sameDomain.map(function (o) { return o.id; }).join(" and ") +
            " shares the domain " + hostOf(b) + ", so this branch would spend " +
            "its strongest local word advertising its own sister shop. This is " +
            "the exact fault the item 5.2 pass found on 2026-08-10."
          : "Put this branch's own town first, or drop the entry.")
      );
    } else {
      warnings.push(
        b.id + ': seoTown "' + b.seoTown + '" is in serviceAreaList but not ' +
        'first ("' + firstRaw + '" is). No branch owns "' + firstRaw + '" as ' +
        "its seoTown, so this is an ordering judgement rather than a fault, " +
        "but the first entry is the one the copy leads with."
      );
    }
  }

  if (b.townSlug && b.townSlug !== slugify(b.seoTown)) {
    var knownSlug = KNOWN_SEO_TOWN[b.id + "::townSlug"];
    if (knownSlug) {
      seenKnown[b.id + "::townSlug"] = true;
      warnings.push(
        "KNOWN " + b.id + ': townSlug "' + b.townSlug + '" is not the slug of ' +
        'seoTown "' + b.seoTown + '" (would be "' + slugify(b.seoTown) + '"). ' +
        knownSlug.question + ": " + knownSlug.reason
      );
    } else {
      failures.push(
        b.id + ': townSlug "' + b.townSlug + '" is not the slug of seoTown "' +
        b.seoTown + '" (expected "' + slugify(b.seoTown) + '"). Permalinks and ' +
        "titles would then name different places."
      );
    }
  }

  if (b.website) {
    var host = b.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    byDomain[host] = byDomain[host] || [];
    byDomain[host].push({ id: b.id, town: town, label: b.seoTown });
  }
});

// Branches sharing a domain must not share a seoTown, or their titles and
// permalinks collide and the two listings compete with each other.
Object.keys(byDomain).forEach(function (host) {
  var group = byDomain[host];
  if (group.length < 2) return;
  group.forEach(function (a, i) {
    group.slice(i + 1).forEach(function (c) {
      if (a.town === c.town) {
        failures.push(
          a.id + " and " + c.id + ' share the domain ' + host + ' and both use ' +
          'seoTown "' + a.label + '", so their page titles and permalinks collide.'
        );
      }
    });
  });
});

Object.keys(KNOWN_SEO_TOWN).forEach(function (key) {
  if (!seenKnown[key]) {
    failures.push(
      "KNOWN_SEO_TOWN carries " + key + " but that branch no longer breaks the " +
      "rule. Remove the entry rather than leaving it to rot."
    );
  }
});

console.log("check-address-region");
console.log("  " + checked + " trading branches checked against " +
  COUNTIES.length + " permitted counties, their seoTown against their " +
  "own serviceAreaList, and the lead entry of that list against every " +
  "other branch's seoTown");

warnings.forEach(function (w) { console.log("  WARN  " + w); });
failures.forEach(function (f) { console.log("  FAIL  " + f); });

if (failures.length) {
  console.log("");
  console.log("check-address-region: " + failures.length + " failure(s).");
  process.exit(1);
}

console.log("");
console.log("check-address-region: clean, every addressRegion is a county" +
  (warnings.length ? " (" + warnings.length + " warning(s))" : "") + ".");
