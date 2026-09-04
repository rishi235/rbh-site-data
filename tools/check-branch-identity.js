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
    8. OUTBOUND   a review link printed on a page is the owning branch's own
                  googleReviewUrl or nhsReviewUrl, never another branch's. A
                  review link is the one outbound link on a branch page that
                  changes a third-party record: a patient who follows the
                  wrong one leaves a review on the wrong shop's Google or NHS
                  profile, and neither can be moved afterwards. A g.page or
                  NHS leave-a-review link matching no branch is a warning.
    9. SISTERLINK a link to another branch's landing page
                  (pharmacy-<brandSlug>-<townSlug>.html) points at a branch
                  that shares this branch's website host, and never at the
                  page's own branch. These links are relative, so one aimed
                  at a branch on another domain is a 404, and the "looking
                  for our other branch?" block is the whole point of item
                  2.2, the shared-domain split.
   10. SERVICELINK a link to a generated service page
                  (<service>-<brandSlug>-<townSlug>.html) points at the
                  page's OWN branch. Rule 9 covers the landing family only
                  and says so; every other family - pharmacy-first, the six
                  Pharmacy First conditions, uti, contraception, travel
                  clinic, weight loss, switch - was unchecked, so a service
                  page could send a patient to another shop's booking. Where
                  the two branches share a host the link resolves and books
                  the wrong pharmacy silently; where they do not it 404s and
                  the service route is simply dead.
   11. SISTERLABEL the visible TEXT of a sister-branch link matches what
                  build-branch-landing-pages.js's own sisterNote() would
                  render for it: the sister's branchName, with " in
                  <seoTown>" appended only when branchName does not already
                  end with that town (case-insensitive, word-boundary
                  anchored). Rule 9 proves the href always resolves to the
                  right sister; it says nothing about the label a patient
                  actually reads. A patient does not see the href - they see
                  "McCanns Chemist Sandringham in St Michael's" or just
                  "Fishlocks Chemist Eccleston", and a future seoTown or
                  branchName edit (seoTown already moved once, on McCanns
                  Sandringham, item 5.7) could leave that label stale, either
                  dropping a town that is genuinely needed to disambiguate or
                  wrongly duplicating one, while rule 9 stays green because
                  the link itself still resolves.

  Rule 11 was added on the 2026-09-04 quality pass of item 2.2 (seventh
  pass), after checking whether anything already covered the text a rule-9
  sisterlink prints alongside its (already-verified) href, and finding rule
  9 reads only the href. Proven correct on today's data first, not assumed:
  all three shared-domain pairs' sister links were read directly off the
  generated pages, and the one case that exercises the "does not end with
  town" branch of sisterNote()'s own regex in production - McCanns
  Sandringham, whose branchName still ends "Sandringham" while its seoTown
  moved to "St Michael's" under item 5.7 - already renders correctly today
  ("McCanns Chemist Sandringham in St Michael's" on the Aigburth page).
  Nothing was broken; the gap was that nothing would have caught it if a
  future edit broke it, since rule 9's own href check would stay green.

  Rule 10 was added on the 2026-08-12 quality pass of item 2.3, after the
  Pharmacy First link on a Cherry Lane service page was repointed at Coleman
  and Leighs, the other Walton branch, and all 29 checkers exited 0. Twelve
  injections were run that pass and this was the only miss: the phone,
  tel: link, postcode, street, brand name, domain, town and weight loss fee
  were all caught, and the swapped Google review link was caught by rule 8,
  which is that rule doing on Cherry Lane exactly what it was written for on
  Fishlocks. The gap was the one rule 9 had explicitly carved out.

  Rules 8 and 9 were added on the 2026-08-12 quality pass of item 2.2, after
  five injections into a landing page were run past all 29 checkers: a swapped
  service-area town was caught by check-jsonld and check-seo-sheets, and a
  swapped directions destination by check-map-embeds, but the sister-branch
  link could be repointed at another brand's page on another domain, and the
  Google and NHS review links could be swapped for the sister branch's, with
  every checker still exiting 0. The same shape as the earlier misses recorded
  in CLAUDE.md: the checkers that owned those fields (check-branch-links) read
  only branches.json, and the checkers that read the pages did not own the
  fields.

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
// Q18 (answered and applied 2026-08-30): the five service-family generators
// now read b.branchName for the JSON-LD name and data-branch, the same field
// build-branch-landing-pages already used, so a shared-brandLabel branch no
// longer collides with its sister on these two machine-readable fields. No
// exceptions remain open here.
var KNOWN = {};

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

// The website a branch's pages are served from. Relative links cannot cross it.
function hostOf(b) {
  return b.website
    ? b.website.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase()
    : "";
}

// Rule 8: every review link in the estate, and the branch it belongs to.
var reviewOwner = {};
var reviewField = {};
branches.forEach(function (b) {
  if (b.googleReviewUrl) {
    reviewOwner[b.googleReviewUrl] = b;
    reviewField[b.googleReviewUrl] = "the Google review link";
  }
  if (b.nhsReviewUrl) {
    reviewOwner[b.nhsReviewUrl] = b;
    reviewField[b.nhsReviewUrl] = "the NHS review link";
  }
});

// Rule 9: a landing page filename is pharmacy-<brandSlug>-<townSlug>.html.
// The leading token tells a landing link apart from the other page families,
// so pharmacy-first-fishlocks-ainsdale.html is not mistaken for one.
var brandSlugs = {};
branches.forEach(function (b) { if (b.brandSlug) brandSlugs[b.brandSlug] = true; });

var reviewLinksRead = 0;
var landingLinksRead = 0;
var serviceLinksRead = 0;
var sisterLabelsRead = 0;

// Rule 11: does b's own branchName already end with its own seoTown? Mirrors
// build-branch-landing-pages.js's sisterNote() regex exactly (word-boundary,
// case-insensitive, anchored at the end), so a change to that generator's
// logic and a change to this check drift apart loudly rather than silently.
function endsWithOwnTown(b) {
  var town = String(b.seoTown || "");
  if (!town) return false;
  var reSrc = "\\b" + town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$";
  return new RegExp(reSrc, "i").test(String(b.branchName || ""));
}
function expectedSisterLabel(sister) {
  return endsWithOwnTown(sister) ? sister.branchName : sister.branchName + " in " + sister.seoTown;
}

// Rule 10: a generated service page is "<service>-<brandSlug>-<townSlug>.html",
// so the branch is the longest branch key the filename ends with. Longest wins
// because one branch key can end with another (a short townSlug inside a longer
// one), and the longer match is the more specific branch.
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

  // Every href on the page, read once for rules 8 and 9.
  var hrefs = [];
  var hrefRe = /href="([^"]+)"/g;
  var hm;
  while ((hm = hrefRe.exec(p.html)) !== null) hrefs.push(hm[1]);

  hrefs.forEach(function (h) {
    // Rule 8: a review link belongs to the branch whose page prints it.
    var owner = reviewOwner[h];
    if (owner) {
      reviewLinksRead++;
      if (owner.id !== b.id) {
        fail(slug, "outbound", rel(p.path) + ": publishes " + reviewField[h] +
          ' "' + h + '", which belongs to ' + owner.id + ' ("' +
          owner.branchName + '"), but the page belongs to ' + b.id + ' ("' +
          b.branchName + '"). A patient following it rates the wrong shop, ' +
          "on a third-party profile neither this repo nor a repaste can " +
          "move the review back off");
      }
    } else if (/^https:\/\/g\.page\/r\//.test(h) ||
               /^https:\/\/www\.nhs\.uk\/services\/pharmacy\/[^"]*leave-a-review/.test(h)) {
      reviewLinksRead++;
      warnings.push(rel(p.path) + ": review link " + h + " matches no " +
        "googleReviewUrl or nhsReviewUrl in branches.json, so nothing can " +
        "say which pharmacy it sends a review to");
    }

    // Rule 10: a service-family page link belongs to the page's own branch.
    // Rule 9 owns the landing family, so a landing link is skipped here and
    // not reported twice.
    var pm = /^([a-z0-9][a-z0-9-]*)\.html$/.exec(h);
    if (pm) {
      var pageName = pm[1];
      var l9 = /^pharmacy-([a-z0-9]+(?:-[a-z0-9-]+)?)$/.exec(pageName);
      var isLanding = !!(l9 && brandSlugs[l9[1].split("-")[0]]);
      if (!isLanding) {
        var svcOwner = branchFromPageName(pageName);
        if (svcOwner) {
          serviceLinksRead++;
          if (svcOwner.id !== b.id) {
            fail(slug, "servicelink", rel(p.path) + ': links to "' + h +
              '", a service page belonging to ' + svcOwner.id + ' ("' +
              svcOwner.branchName + '"), but the page belongs to ' + b.id +
              ' ("' + b.branchName + '"). ' +
              (hostOf(svcOwner) === hostOf(b)
                ? "Both branches are served from " + (hostOf(b) || "no host") +
                  ", so the link resolves and the patient is quietly booked " +
                  "into the wrong pharmacy's service."
                : svcOwner.id + " is served from " +
                  (hostOf(svcOwner) || "no host") + " and the link is " +
                  "relative, so it 404s and the service route is dead."));
          }
        }
      }
    }

    // Rule 9: a link to a sister branch's landing page stays on this website.
    var lm = /^pharmacy-([a-z0-9]+(?:-[a-z0-9-]+)?)\.html$/.exec(h);
    if (!lm) return;
    var firstToken = lm[1].split("-")[0];
    if (!brandSlugs[firstToken]) return;   // another page family, not a landing link
    landingLinksRead++;
    var target = byKey[lm[1]];
    if (!target) {
      fail(slug, "sisterlink", rel(p.path) + ': links to "' + h + '", a ' +
        "branch landing page filename that no trading branch in " +
        "branches.json owns, so the cross-link points at a page this repo " +
        "cannot account for");
      return;
    }
    if (target.id === b.id) {
      fail(slug, "sisterlink", rel(p.path) + ': its branch landing link ' +
        'points back at its own branch ("' + h + '"), so the "looking for ' +
        'our other branch?" block sends the patient nowhere');
      return;
    }
    if (hostOf(target) !== hostOf(b)) {
      fail(slug, "sisterlink", rel(p.path) + ': links to "' + h + '", the ' +
        "landing page of " + target.id + " on " + (hostOf(target) || "no host") +
        ", but this page is served from " + (hostOf(b) || "no host") +
        ". The link is relative, so it cannot reach another website and 404s");
    }
  });

  // Rule 11: the visible text of a sister-branch link, checked against what
  // build-branch-landing-pages.js's own sisterNote() would render for it.
  // A separate pass over p.html because the text sits between the anchor
  // tags, not in an attribute, so the generic hrefRe sweep above cannot see
  // it. Matches only a bare "<a href=\"pharmacy-...html\">text</a>" with no
  // nested markup, which is the exact shape sisterNote() emits and not the
  // shape of the service tiles (those carry a class attribute and nested
  // <strong>/<span> tags), so this cannot cross-match a service-grid tile.
  var sisterAnchorRe = /<a href="(pharmacy-[a-z0-9][a-z0-9-]*\.html)">([^<]*)<\/a>/g;
  var sm;
  while ((sm = sisterAnchorRe.exec(p.html)) !== null) {
    var slHref = sm[1];
    var slText = sm[2];
    var slMatch = /^pharmacy-([a-z0-9]+(?:-[a-z0-9-]+)?)\.html$/.exec(slHref);
    if (!slMatch) continue;
    var slFirstToken = slMatch[1].split("-")[0];
    if (!brandSlugs[slFirstToken]) continue;   // not a landing link
    var sisterB = byKey[slMatch[1]];
    if (!sisterB || sisterB.id === b.id) continue;   // rule 9 already reports this
    sisterLabelsRead++;
    var expectedLabel = expectedSisterLabel(sisterB);
    if (slText !== expectedLabel) {
      fail(slug, "sisterlabel", rel(p.path) + ': its link to "' + slHref +
        '" reads "' + slText + '", but build-branch-landing-pages.js\'s own ' +
        'sisterNote() logic would render "' + expectedLabel + '" for ' +
        sisterB.id + ' (branchName "' + sisterB.branchName +
        '" against seoTown "' + sisterB.seoTown + '"). A patient reads the ' +
        "label, not the href, so a stale one still misdirects even though " +
        "rule 9 confirms the link itself resolves correctly");
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
console.log("  " + reviewLinksRead + " review link(s), " + landingLinksRead +
  " branch landing link(s), " + serviceLinksRead +
  " service page link(s) and " + sisterLabelsRead +
  " sister-link label(s) read on those pages");
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
