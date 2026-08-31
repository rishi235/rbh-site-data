/*
  check-service-links.js  (added 2026-08-10 on the item 3.7 quality pass, Q16)

  Two rules, both about what a generated page sends a patient towards and what
  it promises them on the way.

  Why it exists. The Smartts switch page is the only generated page in the
  estate carrying a hand-written services grid: six tiles with hardcoded URLs
  and hardcoded sales copy, sitting in tools/build-switch-pages.js since the
  page was first built. Nothing checked either half. The grid was found
  pointing at weight-loss-clinic-bootle.html, an old live-only page that names
  three prescription-only medicines and claims a percentage weight loss, while
  the repo has generated a compliant replacement (weight-loss-clinic-smartts-
  bootle.html) since Phase 3. The same tile described the clinic as "Support
  that delivers results", which is an efficacy claim on a weight loss service.

  Advertising prescription-only medicines to the public is not permitted, and
  the house rule on weight loss copy is no medicine names and no efficacy
  claims. A checker that only reads titles and headings cannot see either
  problem, because both live in a link target and a nine-word tile.

  What FAILS the run:
    - RULE 1, stale target: a generated page links to a page on one of our own
      branch domains that this repo does not generate. Either the repo owns the
      page and the link should point at the generated slug, or the page is
      live-only and nothing here can keep it correct. Both need saying out loud.
    - RULE 1, cross-host target: the target page IS generated here, but for a
      different branch domain, so it is a live 404 on the site the link sits on.
      Added by the item 6.2 quality pass, 2026-08-14.
    - RULE 1, subpath: an estate link with a directory in its path. Weebly
      publishes every page at the site root, so a directory cannot resolve.
      Added by the item 6.2 quality pass, 2026-08-14.
    - RULE 1, unverifiable estate path: a link to an estate host with a path
      that is not a .html page, so there is no generated file it can be matched
      against. Riddings /clinic-prices, cross-linked from eight sites and dead
      on all eight, is this shape. Added by the item 6.2 quality pass.
    - RULE 2, claim: efficacy or results-claim wording in visible page copy.
    - RULE 3, medicine: a POM name from tools/pom-names.js in visible page
      copy, whole page, every generated page. Added by the item 3.9 quality
      pass, 2026-08-30, after an injected "Mounjaro" in the body of a
      Pharmacy First condition page passed all 36 checkers: the four
      copy checkers each read their own page family and
      check-pharmacy-first-symptoms rule 8 reads the symptoms block only,
      so general visible copy on the service pages was read by no medicine
      rule at all. The full five-group union appears on 0 of the 182
      generated pages, measured before the rule was added, so this is
      enforcement of the position every generator already declares, not
      new policy. If a page family's position is ever relaxed (the
      inner-page exemption in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md),
      record the page and name in KNOWN_POM with the question id rather
      than deleting the name from pom-names.js.

  RULE 1 reads all three link shapes the generators emit: absolute estate .html
  links, RELATIVE hrefs, and estate paths with no .html. Until 2026-08-13 it
  matched the first shape only, which was 6 of the 421 estate-internal links on
  the 177 pages. KNOWN keys are "<host>/<path>", one shape for every link, since
  a relative href resolves on the host of the page it sits on. Bare homepage
  links (a host with no path) are counted but never failed: a homepage always
  exists.

  RULE 1 RESOLVES BY HOST, NOT BY FILENAME, since 2026-08-14. It used to ask
  only whether a basename existed somewhere in the estate. Every generated page
  is published to exactly one Weebly site, at that site's root, so that question
  was the wrong one: fishlockpharmacy.co.uk does not serve riddingspharmacy.co.uk's
  pages. A relative cross-branch link passed the old rule and 404s live, which is
  the dead-cross-link class item 6.2 exists to catch, and all 244 relative links
  sat in that blind spot. Pages are attributed to a host by their
  "<brandSlug>-<townSlug>" suffix from branches.json, so the two Fishlocks
  branches, the two Scorahs and the two McCanns correctly share one host each and
  may link to one another. Proved by injection on 2026-08-14: a relative link to
  another branch's page, and a link with a directory in its path, both passed the
  old rule and both fail now. No defect was in the blind spot on the day it was
  closed: all 421 estate-internal links resolve on the host they land on.

  What is only REPORTED, not failed:
    - links to pages on our domains that are listed in KNOWN below, each with a
      reason and a question id, same convention as KNOWN_DRIFT in
      check-cdn-pins.js and KNOWN in check-seo-lengths.js.

  A KNOWN entry that no longer triggers FAILS the run, so the list cannot rot
  once a question is answered and the fix lands.

  EXTRA PUBLIC-COPY FILES, added on the item 6.2 quality pass (fourth),
  2026-08-31. Until this pass, RULE 1, RULE 2 and RULE 3 all read PAGE_DIRS
  only: the 177 generated pages. Six files carry live public copy without
  being a generated page - two hand-pasted Weebly embeds, two DRAFT-*.html
  content specs the weight loss and travel clinic generators cite as their
  approved-copy source, and two Cherry Lane "old page" replacement blocks -
  see tools/extra-public-copy-files.js, which check-em-dashes.js has scanned
  since the item 3.9 and 5.1 quality passes. RULE 2 (claims) and RULE 3 (POM
  medicine names) exist specifically to keep outcome promises and
  prescription-only medicine names out of public copy, and the item 3.9 pass
  already found DRAFT-weight-loss-copy.html carrying a stale &ndash; the
  generated pages had already been fixed for, so this is the same class of
  file this repo already knew carried risk, sitting outside the one checker
  built for exactly that risk. Zero hits on all six when this was added: the
  gap was latent, not a live breach. RULE 1 also now resolves the two Cherry
  Lane replacement files against their real branch host (both paste over a
  live URL naming Cherry Lane by branch, in modules/service/weebly-paste/),
  since both carry a real relative link this repo can and should verify; the
  other four files are store-agnostic (no single branch to resolve a relative
  href against) and carry no relative estate link today, only external CDN
  links, same-page anchors, tel: links and unstamped {{TOKEN}} placeholders,
  so RULE 1 skips a relative href on them only when it is a {{TOKEN}}
  placeholder, and otherwise reports it as unattributable rather than
  silently passing, the same "stop rather than quietly weaken the rule"
  convention already used for a generated page with no matching branch host.

  Run:  node tools/check-service-links.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");

const PAGE_DIRS = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// The six non-generated public-copy files - see tools/extra-public-copy-files.js
// for what each one is and why it is checked here since 2026-08-31. One list,
// shared with check-em-dashes.js, so the two checkers cannot drift apart on
// what counts as public copy.
const EXTRA_FILES = require("./extra-public-copy-files.js").EXTRA_HTML_SEGMENTS
  .map(function (segs) { return path.join.apply(path, [REPO].concat(segs)); });

// The two EXTRA_FILES that carry a real, branch-specific relative link RULE 1
// can resolve: both Cherry Lane replacement blocks paste over a dead live URL
// naming Cherry Lane by branch. Keyed by the file's REPO-relative path (as
// rel() renders it) to the same "<brandSlug>-<townSlug>" key used to attribute
// a generated page to a host, so the host is read from branches.json rather
// than hardcoded a second time. The other four EXTRA_FILES are store-agnostic
// templates with no single branch to resolve against, so they are absent here
// on purpose, not by oversight.
const EXTRA_LINK_HOST_SLUG = {
  "modules/service/weebly-paste/cherry-lane-old-pharmacy-first-replacement.html": "cherry-lane-walton",
  "modules/service/weebly-paste/cherry-lane-old-weight-loss-replacement.html": "cherry-lane-walton"
};

// Link targets on our own domains that this repo does not generate, accepted
// for now with a reason. Key is "<host><path>".
const KNOWN = {
  "www.smarttschemist.co.uk/weight-loss-clinic-bootle.html":
    "Q16: old live-only weight loss page naming Wegovy, Mounjaro and Orlistat with a 22.5% claim and a price. "
    + "The compliant replacement weight-loss-clinic-smartts-bootle.html is generated here but the tile still "
    + "points at the old page. Repointing it needs the new page pasted live first, so it is Rishi's call.",
  "www.smarttschemist.co.uk/pharmacy-first-service-bootle.html":
    "Q8/Q16: old live-only Pharmacy First page. Same class as the 11 GBP pack links held under item 5.3, which is "
    + "blocked because the repo change is tied to a Weebly paste.",
  "www.smarttschemist.co.uk/blood-testing.html":
    "Q16: live-only service page. Blood tests are not a branches.json widget, so no generator owns this page.",
  "www.smarttschemist.co.uk/vaccinations.html":
    "Q16: live-only service page, used by both the Vaccinations tile and the Travel Clinic tile. The repo does "
    + "generate travel-clinic-smartts-bootle.html, so the Travel Clinic tile has a generated page to point at.",
  "www.smarttschemist.co.uk/medical-cannabis.html":
    "Q16: live-only service page. No generator owns it; wording is held to eligibility only."
};

// Claim strings accepted for now with a reason, same convention as KNOWN.
// Key is "<relative file path>::<the offending phrase>".
const KNOWN_CLAIM = {
  "modules/switch/pages/switch-prescriptions-smartts-bootle.html::Support that delivers results.":
    "Q16: the Weight Loss Clinic tile on the Smartts switch page promises an outcome, which the house rule on "
    + "weight loss copy does not allow. It is hardcoded in the CONFIG block of tools/build-switch-pages.js and is "
    + "the only claim of its kind in the estate. Not rewritten autonomously because it is patient-facing "
    + "regulatory copy, which is Rishi's call; the replacement wording is offered in Q16."
};

// Results and efficacy wording. Deliberately narrow: it targets promises about
// outcome, not ordinary service description. The list moved into
// tools/claim-patterns.js on the item 3.6 quality pass, 2026-08-11, so that
// this checker (which reads the 177 generated pages) and
// check-seo-keywords.js (which reads the Meta Keywords lines on the paste
// sheets) apply one list rather than two copies of it.
const CLAIM_PATTERNS = require("./claim-patterns.js").CLAIM_PATTERNS;

// RULE 3 names: one list, defined once in tools/pom-names.js. The run stops
// outright on an empty union so a silently empty list can never present
// itself as a clean estate (the run-151 lesson).
const pom = require("./pom-names.js");
const POM_NAMES = pom.union(pom.WEIGHT_LOSS, pom.PHARMACY_FIRST,
  pom.CONTRACEPTION, pom.TRAVEL_VACCINES, pom.ANTIMALARIALS);
if (!POM_NAMES.length) {
  console.log("check-service-links");
  console.log("  FAIL empty POM name union from tools/pom-names.js");
  process.exit(1);
}

// Accepted medicine mentions, "<relative file path>::<name>" -> reason with
// a question id. Empty today: no generated page names any medicine.
const KNOWN_POM = {};

function rel(p) { return path.relative(REPO, p).replace(/\\/g, "/"); }

// Blank out HTML comments, keeping line numbers intact, so build notes that
// discuss the rules are not read as breaches of them.
function blankComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, function (block) {
    return block.replace(/[^\n]/g, " ");
  });
}

const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const estateHosts = new Set();
const hostOfSlug = new Map();   // "<brandSlug>-<townSlug>" -> host
data.branches.forEach(function (b) {
  if (b.disposed || !b.website) return;
  const host = b.website.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  estateHosts.add(host);
  if (b.brandSlug && b.townSlug) hostOfSlug.set((b.brandSlug + "-" + b.townSlug).toLowerCase(), host);
});

// Every page this repo generates, mapped to the ONE host that publishes it.
// Longest slug first, so scorah-hazel-grove is not swallowed by a shorter match.
const slugs = Array.from(hostOfSlug.keys()).sort(function (a, b) { return b.length - a.length; });
const generated = new Map();    // "<basename>.html" -> host
const unattributed = [];
PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); }).forEach(function (f) {
    const name = f.toLowerCase();
    const slug = slugs.find(function (s) { return name.replace(/\.html$/, "").endsWith("-" + s); });
    if (!slug) { unattributed.push(name); return; }
    generated.set(name, hostOfSlug.get(slug));
  });
});
// A page nothing can attribute to a host cannot be checked at all, so it must
// stop the run rather than quietly weaken the rule for every other page.
if (unattributed.length) {
  console.log("check-service-links");
  console.log("  FAIL  page(s) not attributable to a branch host: " + unattributed.join(", "));
  process.exit(1);
}

const failures = [];
const knownHits = {};
const knownClaimHits = {};
const knownPomHits = {};
let pageCount = 0;
let extraCount = 0;
let linkCount = 0;
let estateLinkCount = 0;

// Shared by generated pages and the six EXTRA_FILES since the item 6.2
// quality pass (fourth), 2026-08-31 - previously this was the inline body of
// the PAGE_DIRS loop below. selfHost is the host a RELATIVE href on this file
// resolves on; pass null when the file is store-agnostic and cannot be
// attributed to one branch, in which case RULE 1 still checks any ABSOLUTE
// estate-host href, still skips a relative {{TOKEN}} placeholder (not a real
// URL - build-weight-loss-pages.js and build-travel-clinic-pages.js stamp a
// real value in per store), but reports any OTHER relative href as
// unattributable rather than silently passing it, the same "stop rather than
// quietly weaken the rule" convention already used below for a generated page
// with no matching branch host. RULE 2 and RULE 3 are unaffected by selfHost,
// since neither needs a host.
function scanFile(file, selfHost) {
  const visible = blankComments(fs.readFileSync(file, "utf8"));

  {
    // RULE 1 - link targets
    //
    // WIDENED on the item 6.2 quality pass, 2026-08-13. The rule used to match
    // one link shape only: an ABSOLUTE link, to an estate host, ending .html.
    // The generators emit three shapes, and that pattern read 6 of the 421
    // estate-internal links on the 177 generated pages. The other 415 were
    // covered by no rule at all:
    //   - 244 RELATIVE hrefs (contraception-*.html, earache-treatment-*.html
    //     and the rest of the service cross-links). These are the exact class
    //     item 6.2 is about, a dead cross-link or a stale permalink, and the
    //     Riddings switch permalink found live by the 6.2 sweep is this shape.
    //   - 171 bare-host homepage links (https://www.cherrylanepharmacy.co.uk
    //     with no path). Legitimate, but they were not counted either, so the
    //     "estate link" tally under-reported the estate by a factor of 70.
    //   - extensionless estate paths. None in the repo today, but /clinic-prices
    //     is precisely the shape the 6.2 sweep found broken live on 8 sites,
    //     and the old pattern could not have seen it if a generator emitted it.
    // No defect was in the blind spot on the day it was widened: all 244
    // relative targets resolve to pages this repo generates. The gap was the
    // finding, the same shape as the check-em-dashes.js gap on 2026-08-12.
    let m;
    // BOTH quote styles since 2026-08-30 (third 6.2 quality pass). Every href
    // the generators emit today is double-quoted (1,705 of 1,705), but the rule
    // read double quotes only, so a single-quoted href - hand-added, or emitted
    // by a future generator change - was read by no rule at all. Proved by
    // injection before the widening: a single-quoted link to a dead estate page
    // and a single-quoted cross-host link both passed this checker; the same
    // target double-quoted failed. Clean-tree counts are identical before and
    // after (177 pages, 987 links, 421 estate, 6 known), so the rule is not
    // weaker anywhere it was already strong.
    const re = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    while ((m = re.exec(visible))) {
      const href = (m[1] !== undefined ? m[1] : m[2]).trim();
      if (!href || /^(mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
      linkCount++;

      // Host, then path up to any query string or fragment. NOT anchored at the
      // end: an absolute URL carrying a query (fonts.googleapis.com/css2?family=)
      // must still be recognised as absolute, or it falls through to the
      // relative branch and is reported against a host it never had.
      const abs = href.match(/^(?:https?:)?\/\/([^\/"?#]+)([^"?#]*)/i);
      let host;
      let pth;

      if (abs) {
        host = abs[1].toLowerCase();
        if (!estateHosts.has(host)) continue;   // external, out of scope by design
        pth = abs[2] || "/";
      } else {
        // Relative href: resolves on the host of the page it sits on, which is
        // why selfHost, not the estate as a whole, is the right question to ask.
        // Same-page anchors and query strings are stripped first.
        if (href.indexOf("{{") !== -1) continue; // unstamped template token, not a real URL
        if (!selfHost) {
          failures.push({
            file: rel(file),
            rule: "unattributed relative link",
            text: "relative href \"" + href + "\" but this file has no single branch host to check it against"
          });
          continue;
        }
        host = selfHost;
        pth = href.split("?")[0].split("#")[0];
        if (!pth) continue;                     // same-page anchor only
      }
      estateLinkCount++;

      pth = pth.replace(/^\/+/, "");
      if (pth === "") continue;                 // homepage, always exists

      const key = host + "/" + pth.toLowerCase();

      // Weebly publishes every page at the site root, so a directory in the
      // path cannot resolve, whatever the filename on the end of it is.
      if (pth.indexOf("/") !== -1) {
        if (KNOWN[key]) { knownHits[key] = (knownHits[key] || 0) + 1; continue; }
        failures.push({
          file: rel(file),
          rule: "subpath",
          text: "links to " + key + ", and Weebly publishes at the site root, so a directory cannot resolve"
        });
        continue;
      }

      const owner = generated.get(pth.toLowerCase());
      if (owner === host) continue;             // generated for this host, resolves
      if (KNOWN[key]) { knownHits[key] = (knownHits[key] || 0) + 1; continue; }

      // Generated here but for another branch domain: the file exists, the link
      // still 404s, and only a host-aware rule can tell the two apart.
      if (owner !== undefined) {
        failures.push({
          file: rel(file),
          rule: "cross-host target",
          text: "links to " + key + ", but that page is generated for " + owner + ", so it 404s on " + host
        });
        continue;
      }

      // An estate path with no .html is a page this repo cannot own or keep
      // correct, so it needs a reason on the record rather than silence.
      const rule = /\.html$/i.test(pth) ? "stale target" : "unverifiable estate path";
      failures.push({
        file: rel(file),
        rule: rule,
        text: "links to " + key + ", which this repo does not generate"
      });
    }

    // RULE 2 - claims in visible copy
    visible.split(/\r?\n/).forEach(function (line, i) {
      // One report per line: a single sentence can trip two patterns at once
      // ("lose up to 22.5% of your body weight" trips both), and reporting it
      // twice makes the output read as two defects.
      const pair = CLAIM_PATTERNS.find(function (p) { return p[0].test(line); });
      if (!pair) return;
      const claimKey = Object.keys(KNOWN_CLAIM).find(function (k) {
        const parts = k.split("::");
        return parts[0] === rel(file) && line.indexOf(parts[1]) !== -1;
      });
      if (claimKey) { knownClaimHits[claimKey] = (knownClaimHits[claimKey] || 0) + 1; return; }
      failures.push({
        file: rel(file),
        rule: "claim",
        text: "line " + (i + 1) + " (" + pair[1] + "): " + line.trim().slice(0, 160)
      });
    });

    // RULE 3 - POM medicine name in visible copy, whole page
    visible.split(/\r?\n/).forEach(function (line, i) {
      const hit = pom.findMedicine(line, POM_NAMES);
      if (!hit) return;
      const pomKey = rel(file) + "::" + hit;
      if (KNOWN_POM[pomKey]) { knownPomHits[pomKey] = (knownPomHits[pomKey] || 0) + 1; return; }
      failures.push({
        file: rel(file),
        rule: "medicine",
        text: "line " + (i + 1) + ": names \"" + hit + "\" in visible copy"
      });
    });
  }
}

PAGE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function (f) { return f.endsWith(".html"); }).forEach(function (f) {
    const file = path.join(dir, f);
    pageCount++;
    // The host this page is published to. A relative href on it resolves here
    // and nowhere else, which is what makes a cross-branch link a live 404.
    const selfHost = generated.get(f.toLowerCase());
    scanFile(file, selfHost);
  });
});

// The six non-generated public-copy files - see tools/extra-public-copy-files.js
// and the header comment above. A listed file that no longer exists fails the
// run rather than being skipped quietly, the same convention as the
// unattributed-page check above and as check-em-dashes.js's own copy of this
// list.
const missingExtra = [];
EXTRA_FILES.forEach(function (file) {
  if (!fs.existsSync(file)) { missingExtra.push(rel(file)); return; }
  extraCount++;
  const slug = EXTRA_LINK_HOST_SLUG[rel(file)];
  const selfHost = slug ? (hostOfSlug.get(slug) || null) : null;
  scanFile(file, selfHost);
});
if (missingExtra.length) {
  console.log("check-service-links");
  console.log("  FAIL  file(s) listed in tools/extra-public-copy-files.js but not present: "
    + missingExtra.join(", "));
  process.exit(1);
}

// A KNOWN entry that no longer fires means the fix landed; the entry must go.
const stale = Object.keys(KNOWN).filter(function (k) { return !knownHits[k]; })
  .concat(Object.keys(KNOWN_CLAIM).filter(function (k) { return !knownClaimHits[k]; }))
  .concat(Object.keys(KNOWN_POM).filter(function (k) { return !knownPomHits[k]; }));

console.log("check-service-links");
console.log("  " + pageCount + " generated page(s), " + extraCount
  + " non-generated public-copy file(s), " + linkCount + " link(s), "
  + estateLinkCount + " of them to our own " + estateHosts.size + " branch domains");
Object.keys(knownHits).forEach(function (k) {
  console.log("  KNOWN " + k + " (" + knownHits[k] + " reference(s)): " + KNOWN[k]);
});
Object.keys(knownClaimHits).forEach(function (k) {
  console.log("  KNOWN CLAIM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_CLAIM[k]);
});
Object.keys(knownPomHits).forEach(function (k) {
  console.log("  KNOWN POM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_POM[k]);
});

if (stale.length) {
  console.log("");
  console.log("FAILURES - KNOWN entries that no longer apply (remove them):");
  stale.forEach(function (k) { console.log("  FAIL  stale KNOWN key: " + k); });
}

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + "):");
  failures.forEach(function (f) {
    console.log("  FAIL  [" + f.rule + "] " + f.file + ": " + f.text);
  });
  console.log("");
  console.log("Fix at source in the generator, then regenerate. A tile that promises an");
  console.log("outcome, or points at a page this repo cannot keep compliant, is the two");
  console.log("ways a weight loss service ends up advertising what it must not.");
}

if (failures.length || stale.length) process.exit(1);

console.log("");
console.log("check-service-links: clean, "
  + (Object.keys(knownHits).length + Object.keys(knownClaimHits).length + Object.keys(knownPomHits).length)
  + " known issue(s) awaiting a decision.");
