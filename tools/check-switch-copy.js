/*
  tools/check-switch-copy.js - switch landing page body copy verifier.

  Why this exists
  ---------------
  Fifteen live pages ask a patient to move their prescriptions to us. They are
  the highest-commitment pages in the estate: every other page asks somebody to
  book, read or call, and this one asks them to change where their medication
  comes from, then collects their name, their date of birth and a way of
  contacting them in order to start it.

  Every word of that is composed in tools/build-switch-pages.js, and until this
  checker nothing in the repo read any of it.

  The switch pages were not unchecked by oversight. They are covered the same
  ways every generated page is: check-page-coverage earns the page,
  check-seo-pattern holds the title and H1, check-seo-sheets, check-seo-lengths
  and check-seo-keywords hold the four Weebly fields, check-nap holds the
  address and the phone in all three of its shapes including the FAQ's "Call us
  on", check-jsonld holds the schema block, check-map-embeds holds the map,
  check-branch-links holds the review link, check-branch-identity holds
  data-branch, check-whatsapp-route holds the chat button, check-cdn-pins holds
  the two pinned assets, check-em-dashes holds the characters. Every one of
  those reads the frame. None reads what the page promises inside it.

  That is the same gap found three times already on the service side: the
  sixty-third run for Pharmacy First eligibility, the sixty-eighth for
  contraception, the sixty-ninth for the travel clinic. Each time the copy was
  correct and simply had no rule behind it. This is the fourth, and this time
  the copy is not correct.

  What the pass found
  -------------------
  The page tells a patient two different things about who contacts their GP.

    hero-proof      "We contact your GP. We handle everything. You do nothing."
    hero-points[0]  "We handle the full switch for you"
    SEO description "We contact your GP and handle everything."

  and then, lower down the same page:

    trust bar       "We help handle the transfer process"
    step 2          "guides the next step to move your prescriptions across"
    FAQ             "Do I need to contact my GP myself?"
                    "Not always. We help guide the process and handle what we
                     can from our side. If anything extra is needed, we will
                     tell you clearly."

  The FAQ answers, in the negative, the exact question the hero answers in the
  absolute. Three hedged statements against three unconditional ones, on all
  fifteen pages, and the unconditional version is the one Google shows, because
  it is the meta description.

  Which of the two is true is an operational fact and a copy decision, not
  something a checker settles. This file holds the contradiction visible and
  pins it against the question it is waiting on. The same applies to "No
  interruption to your medication", which is an unconditional promise about
  continuity of supply sitting in the same list.

  What it enforces
  ----------------
  The copy and the branch config are read OUT of the generator rather than
  mirrored here, the lesson of the fifty-second run: a hand-copied list in a
  checker goes stale silently and a new line never gets typed. The claim rules
  are absolute instead, so editing the generator cannot make them pass by
  agreeing with itself.

    - RULE 1, source: the generator still exposes the copy and the CONFIG this
      checker reads. If a refactor moves either somewhere this parser cannot
      see, the run fails rather than quietly checking nothing.
    - RULE 2, pages: every branch the generator builds has its page on disk,
      and every page on disk is one the generator builds.
    - RULE 3, verbatim: every static line of body copy in the generator appears
      on every page, word for word, with branch values resolved, so a page
      cannot borrow another branch's town inside a sentence.
    - RULE 4, one answer per question: a page may not both promise
      unconditionally that we handle the GP side and hedge the same thing
      elsewhere. Currently breached on all fifteen pages and pinned in KNOWN.
    - RULE 5, continuity: a page may not guarantee that medication will not be
      interrupted. Currently breached on all fifteen pages and pinned in KNOWN.
    - RULE 6, the time claim: the seconds figure is one number per page and the
      same number on all fifteen, so nobody is told thirty on one branch's page
      and sixty on another's.
    - RULE 7, no medicines and no clinical claim: switching pharmacy is
      logistics. No page names a prescription-only medicine or claims a
      clinical outcome, the same rule the weight loss, contraception and travel
      clinic pages run under.
    - RULE 8, town: the pill, the trust bar and step 2 name this branch's own
      town, and no page names a different branch's town in its body copy.
      Branches that genuinely share a town are exempt from the second half.
    - RULE 9, the form and the sentence about the form: step 1 tells the
      patient which fields are asked for and which are optional. The form must
      agree. Add a field and the sentence goes stale in silence.
    - RULE 10, the collection notice: every page carries a sentence at the
      point of collection saying what the details are used for. Whether one
      sentence is enough is asked separately; that it is present is held here.
    - a stale KNOWN key fails, the same convention as KNOWN_DRIFT in
      check-cdn-pins.js, so an accepted breach cannot outlive its reason.

  Run:  node tools/check-switch-copy.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var GENERATOR = path.join(ROOT, "tools", "build-switch-pages.js");
var PAGE_DIR = path.join(ROOT, "modules", "switch", "pages");
var BRANCHES = path.join(ROOT, "branches.json");

// Accepted breaches, keyed "<rule>::<what>", each with the reason it stands.
// A key that no longer breaks its rule fails the run, so this list cannot rot.
var KNOWN = {
  "gp-story::hero promises unconditionally and the FAQ hedges":
    "Raised as Q49 on 2026-08-11. All fifteen switch pages carry three " +
    "unconditional statements about the GP side of a switch, in the hero " +
    "paragraph, the first hero bullet and the Weebly SEO description Google " +
    "shows, and three hedged statements about the same thing, in the trust " +
    "bar, step 2 and the FAQ answer to \"Do I need to contact my GP myself?\". " +
    "Whether we do in fact contact every patient's GP is an operational fact " +
    "about how the switch is run, and which of the two versions goes on the " +
    "page is a public advertising decision. Neither is an agent's to take, so " +
    "the contradiction is pinned here and the copy is left untouched. Remove " +
    "this entry when the answer lands and one version is used throughout.",
  "continuity::no interruption to your medication":
    "Raised as Q49 on 2026-08-11, same question. The first hero bullet list " +
    "promises \"No interruption to your medication\" without qualification, on " +
    "all fifteen pages. Continuity across a pharmacy transfer depends on where " +
    "the patient is in their cycle and on the GP practice acting, so this is " +
    "the same class of claim as the GP promise above and is answered by the " +
    "same decision. Remove this entry when that copy is settled.",

  // The three shared-domain sites. See RULE 11 below for why the conflict is
  // pinned rather than failed: which branch a shared banner should point at is
  // a live conversion decision, not a build defect an agent can settle. One
  // entry per host so that a site which STOPS being shared, or a fourth which
  // starts, changes this list rather than passing quietly.
  "banner-shared-host::www.fishlockpharmacy.co.uk":
    "Raised as Q63 on 2026-08-13, found on the item 3.3 quality pass. " +
    "Fishlocks Ainsdale and Fishlocks Eccleston trade on one domain and the " +
    "generator writes a banner file for each, but Weebly Header Code is a " +
    "single site-wide field, so only one can be pasted. Whichever is used, the " +
    "sister branch's thirteen pages all carry a banner pointing at the other " +
    "branch's switch page. Remove this entry when Q63 is answered and applied.",
  "banner-shared-host::www.mccannspharmacy.co.uk":
    "Raised as Q63 on 2026-08-13, same defect, McCanns Aigburth and McCanns " +
    "St Michael's on one domain. Remove this entry when Q63 is applied.",
  "banner-shared-host::www.scorah-chemists.co.uk":
    "Raised as Q63 on 2026-08-13, same defect, Scorah Bramhall and Scorah " +
    "Hazel Grove on one domain. Remove this entry when Q63 is applied."
};
var knownUsed = {};

var failures = [];
function fail(rule, what, message) {
  var key = rule + "::" + what;
  if (Object.prototype.hasOwnProperty.call(KNOWN, key)) { knownUsed[key] = true; return; }
  failures.push("[" + rule + "] " + message);
}

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function rx(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function flat(s) { return String(s).replace(/\s+/g, " ").trim(); }
function textOf(h) { return flat(h.replace(/<[^>]+>/g, " ")); }

var genSrc = fs.readFileSync(GENERATOR, "utf8");
var genBody = genSrc.replace(/^[\s\S]*?\*\//, "");
var data = JSON.parse(fs.readFileSync(BRANCHES, "utf8"));
var byId = {};
data.branches.forEach(function (b) { byId[b.id] = b; });

// ---------------------------------------------------------------------------
// Read the branch config out of the generator as data under test.
//
// CONFIG is a plain object literal of strings and arrays of strings. It is
// evaluated rather than mirrored here so that adding a branch, or moving a
// town, puts the new value under these rules without anyone editing this file.
// ---------------------------------------------------------------------------
var CONFIG = null;
(function readConfig() {
  var start = genBody.indexOf("const CONFIG = {");
  if (start === -1) return;
  var open = genBody.indexOf("{", start);
  var depth = 0, end = -1;
  for (var i = open; i < genBody.length; i++) {
    var ch = genBody[i];
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return;
  try {
    CONFIG = new Function("return (" + genBody.slice(open, end + 1) + ");")();
  } catch (e) {
    CONFIG = null;
  }
})();

// ---------------------------------------------------------------------------
// Read the body copy out of the generator.
//
// The page is one template literal, so a line of copy sits in the source
// verbatim except where a branch value is spliced in as ${esc(c.town)} or
// ${esc(b.phone)}. Those are kept as templates and resolved per branch in
// rule 3. Extraction is scoped to the classes that carry copy, which is what
// keeps the contact card, the schema block and the form inputs out of it:
// those are frame and are already held by check-nap, check-jsonld,
// check-map-embeds and check-branch-links.
// ---------------------------------------------------------------------------
// Four sections of the page are conditional on a branch field: the video, the
// app card, the review card and the services grid. Their copy is real copy and
// is held to the same rules, but only on the branches that earn it, so they are
// lifted out here with the gate that decides them and checked BOTH ways in
// rule 3: present where the gate is true, absent where it is false. Dropping
// them instead would leave four blocks of public copy unread, which is the
// mistake this whole file exists to stop repeating.
var CONDITIONAL = [];
var uncond = genBody.replace(/const\s+(\w+)\s*=\s*([bc]\.\w+)\s*\?\s*`([\s\S]*?)`\s*:\s*"";/g,
  function (whole, name, gate, body) {
    CONDITIONAL.push({ name: name, gate: gate, body: body });
    return "";
  });

function collectFrom(src, re) {
  var out = [], m;
  re.lastIndex = 0;
  while ((m = re.exec(src)) !== null) {
    var s = flat(m[1]);
    if (s) out.push(s);
  }
  return out;
}
function collect(re) { return collectFrom(uncond, re); }

var heroProof = collect(/<p class="hero-proof">([\s\S]*?)<\/p>/g);
var heroSub = collect(/<p class="hero-sub">([\s\S]*?)<\/p>/g);
var pill = collect(/<span class="pill">([\s\S]*?)<\/span>/g);
var helpRow = collect(/<div class="hero-help-row">([\s\S]*?)<\/div>/g);
var bullets = collect(/<li>([\s\S]*?)<\/li>/g);
var trustTitles = collect(/<div class="trust-item"><strong>([\s\S]*?)<\/strong>/g);
var trustLines = collect(/<div class="trust-item"><strong>[\s\S]*?<\/strong><span>([\s\S]*?)<\/span>/g);
var stepHeads = collect(/<div class="step-no">\d+<\/div><h3>([\s\S]*?)<\/h3>/g);
var stepText = collect(/<div class="step-no">\d+<\/div><h3>[\s\S]*?<\/h3><p>([\s\S]*?)<\/p>/g);
var leads = collect(/<p class="lead">([\s\S]*?)<\/p>/g);
var summaries = collect(/<summary>([\s\S]*?)<\/summary>/g);
var answers = collect(/<div class="answer">([\s\S]*?)<\/div>/g);
var privacy = collect(/<p class="privacy">([\s\S]*?)<\/p>/g);
var formSub = collect(/<p class="form-sub"[^>]*>([\s\S]*?)<\/p>/g);
var metaFn = genBody.match(/function switchMeta\(c\)\{[\s\S]*?return `([\s\S]*?)`;/);
var metaTemplate = metaFn ? flat(metaFn[1]) : "";

// Every static line of body copy that every page carries, as templates to
// resolve per branch.
var COPY = []
  .concat(heroProof, heroSub, pill, helpRow, bullets, trustTitles, trustLines,
          stepHeads, stepText, leads, summaries, answers, privacy, formSub);

// The same, per conditional block, with the gate that earns it.
CONDITIONAL.forEach(function (block) {
  block.copy = []
    .concat(collectFrom(block.body, /<h2 class="h2">([\s\S]*?)<\/h2>/g),
            collectFrom(block.body, /<p class="lead"[^>]*>([\s\S]*?)<\/p>/g),
            collectFrom(block.body, /<p class="app-copy">([\s\S]*?)<\/p>/g),
            collectFrom(block.body, /<div class="app-head"><strong>([\s\S]*?)<\/strong>/g))
    .filter(function (s) { return s.indexOf("${") !== 0; });
});

// ---------------------------------------------------------------------------
// RULE 1, source. Counts are floors, not fingerprints: adding copy is fine,
// losing the ability to see it is not.
// ---------------------------------------------------------------------------
if (!CONFIG || typeof CONFIG !== "object") {
  failures.push("[source] " + rel(GENERATOR) + ": the CONFIG object could not be " +
    "read out of the generator, so every rule below would run against nothing. " +
    "Fix the extraction here rather than mirroring CONFIG into this file.");
  CONFIG = {};
}
var ids = Object.keys(CONFIG);
if (ids.length < 15) {
  failures.push("[source] " + rel(GENERATOR) + ": CONFIG holds " + ids.length +
    " branch(es). The estate builds fifteen switch pages, so the parser has " +
    "lost sight of most of them.");
}
if (heroProof.length !== 1 || heroSub.length !== 1) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + heroProof.length +
    " hero-proof line(s) and " + heroSub.length + " hero paragraph(s). The " +
    "hero-proof line carries the promise rules 4 and 5 exist to hold.");
}
if (bullets.length < 4) {
  failures.push("[source] " + rel(GENERATOR) + ": found only " + bullets.length +
    " <li> line(s) of copy. The hero bullet list is where the continuity " +
    "promise is typed, so rule 5 must be able to see it.");
}
if (summaries.length < 4 || answers.length < 4) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + summaries.length +
    " FAQ question(s) and " + answers.length + " answer(s). The FAQ carries the " +
    "hedged half of the GP statement, which is what rule 4 compares against.");
}
if (summaries.length !== answers.length) {
  failures.push("[source] " + rel(GENERATOR) + ": " + summaries.length +
    " FAQ question(s) but " + answers.length + " answer(s), so at least one " +
    "question on a live page has no answer behind it.");
}
if (trustLines.length < 4 || stepText.length < 3) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + trustLines.length +
    " trust line(s) and " + stepText.length + " step(s). Both carry hedged " +
    "statements rule 4 reads.");
}
if (privacy.length !== 1) {
  failures.push("[source] " + rel(GENERATOR) + ": found " + privacy.length +
    " collection notice line(s). Rule 10 holds exactly one.");
}
if (!metaTemplate) {
  failures.push("[source] " + rel(GENERATOR) + ": switchMeta() could not be read, " +
    "so the sentence Google actually shows is outside every rule below.");
}

// ---------------------------------------------------------------------------
// RULE 2, pages. Every branch the generator builds has its page, and every
// page in the folder is one the generator builds.
// ---------------------------------------------------------------------------
var pages = {};   // id -> { file, html, text }
var expected = {};
ids.forEach(function (id) {
  var c = CONFIG[id];
  var file = path.join(PAGE_DIR, "switch-prescriptions-" + c.brandSlug + "-" + c.townSlug + ".html");
  expected[path.basename(file)] = id;
  if (!fs.existsSync(file)) {
    failures.push("[pages] " + rel(file) + ": the generator builds a switch page " +
      "for " + id + " and it is not on disk, so this checker cannot read it and " +
      "a live page may be running on copy nothing here has seen.");
    return;
  }
  var html = fs.readFileSync(file, "utf8");
  pages[id] = { file: file, html: html, text: textOf(html) };
});
fs.readdirSync(PAGE_DIR).filter(function (f) { return f.endsWith(".html"); }).forEach(function (f) {
  if (!expected[f]) {
    failures.push("[pages] " + rel(path.join(PAGE_DIR, f)) + ": a switch page with " +
      "no branch behind it in the generator's CONFIG. Either it is stale and " +
      "should go, or a branch has been dropped from CONFIG while its page stayed " +
      "live.");
  }
});

// ---------------------------------------------------------------------------
// Resolve a copy template for one branch. The generator splices branch values
// in as ${esc(c.field)} or ${esc(b.field)}; anything else left over means this
// parser has met a construction it does not understand, which rule 3 reports
// rather than skipping.
// ---------------------------------------------------------------------------
function resolve(tpl, id) {
  var c = CONFIG[id], b = byId[id] || {};
  var unresolved = null;
  var out = tpl.replace(/\$\{([^}]*)\}/g, function (whole, expr) {
    var m = /^esc\((c|b|pat)\.(\w+)\)$/.exec(expr.trim());
    if (m) {
      var src = m[1] === "b" ? b : c;
      var v = src[m[2]];
      if (v === undefined) { unresolved = whole; return whole; }
      return esc(v);
    }
    var direct = /^(c|b)\.(\w+)$/.exec(expr.trim());
    if (direct) {
      var s2 = direct[1] === "b" ? b : c;
      var v2 = s2[direct[2]];
      if (v2 === undefined) { unresolved = whole; return whole; }
      return String(v2);
    }
    unresolved = whole;
    return whole;
  });
  return { text: out, unresolved: unresolved };
}

// ---------------------------------------------------------------------------
// RULE 3, verbatim. Every static line of copy appears on every page, word for
// word, with this branch's values in it.
// ---------------------------------------------------------------------------
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  COPY.forEach(function (tpl) {
    var r = resolve(tpl, id);
    if (r.unresolved) {
      fail("verbatim", "unparsed " + r.unresolved, rel(p.file) + ": the copy line \"" +
        tpl.slice(0, 70) + "\" contains " + r.unresolved + ", which this parser " +
        "cannot resolve, so it is being compared unresolved. Teach resolve() the " +
        "construction rather than dropping the line.");
      return;
    }
    var want = flat(r.text);
    if (p.html.indexOf(want) === -1 && textOf(want) && p.text.indexOf(textOf(want)) === -1) {
      fail("verbatim", id + " missing line", rel(p.file) + ": the generator writes " +
        "\"" + want.slice(0, 110) + "\" and the page does not carry it. Either the " +
        "page is a stale build or a branch value has been resolved wrongly.");
    }
  });

  // Conditional sections, both ways round.
  var c = CONFIG[id], b = byId[id] || {};
  CONDITIONAL.forEach(function (block) {
    var g = /^([bc])\.(\w+)$/.exec(block.gate);
    if (!g) {
      fail("verbatim", "unreadable gate " + block.gate, rel(GENERATOR) + ": the " +
        block.name + " section is gated on \"" + block.gate + "\", which this " +
        "checker cannot evaluate, so its copy is going unread on every page.");
      return;
    }
    var earned = !!(g[1] === "b" ? b : c)[g[2]];
    block.copy.forEach(function (tpl) {
      var r = resolve(tpl, id);
      if (r.unresolved) return;   // reported by the unconditional pass above
      var want = flat(r.text);
      var present = p.html.indexOf(want) !== -1 || p.text.indexOf(textOf(want)) !== -1;
      if (earned && !present) {
        fail("verbatim", id + " missing " + block.name, rel(p.file) + ": this " +
          "branch sets " + block.gate + ", so the generator writes the " +
          block.name + " line \"" + want.slice(0, 90) + "\", and the page does " +
          "not carry it.");
      }
      if (!earned && present) {
        fail("verbatim", id + " unearned " + block.name, rel(p.file) + ": the page " +
          "carries the " + block.name + " line \"" + want.slice(0, 90) + "\" and " +
          "this branch does not set " + block.gate + ", so the page is promising " +
          "something the data says it does not have.");
      }
    });
  });
});

// ---------------------------------------------------------------------------
// RULE 4, one answer per question.
//
// A page may not answer "who deals with my GP" twice, once as a promise and
// once as a hedge. Both lists are absolute, written here rather than read from
// the generator, so rewording the copy to agree with itself cannot make the
// rule pass. The SEO description is included because it is the sentence Google
// puts in front of the patient before they ever reach the page.
// ---------------------------------------------------------------------------
var ABSOLUTE = [
  { re: /\bWe contact your GP\b(?!\s+(?:where|when|if))/i, what: "\"We contact your GP\", unqualified" },
  { re: /\bWe handle everything\b/i, what: "\"We handle everything\"" },
  { re: /\bYou do nothing\b/i, what: "\"You do nothing\"" },
  { re: /\bWe handle the full switch\b/i, what: "\"We handle the full switch for you\"" }
];
var HEDGED = [
  { re: /\bNot always\b/i, what: "\"Not always\" in the GP FAQ answer" },
  { re: /\bhandle what we can\b/i, what: "\"handle what we can from our side\"" },
  { re: /\bWe help handle\b/i, what: "\"We help handle the transfer process\"" },
  { re: /\bWe help guide\b/i, what: "\"We help guide the process\"" },
  { re: /\bguides the next step\b/i, what: "\"guides the next step\"" }
];

Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var meta = metaTemplate ? resolve(metaTemplate, id).text : "";
  var hay = p.text + " " + flat(meta);
  var abs = ABSOLUTE.filter(function (x) { return x.re.test(hay); }).map(function (x) { return x.what; });
  var hed = HEDGED.filter(function (x) { return x.re.test(hay); }).map(function (x) { return x.what; });
  if (abs.length && hed.length) {
    fail("gp-story", "hero promises unconditionally and the FAQ hedges",
      rel(p.file) + ": the page tells a patient two different things about who " +
      "deals with their GP. Unconditional: " + abs.join("; ") + ". Hedged: " +
      hed.join("; ") + ". One of the two is what actually happens; both cannot " +
      "be on the same page, and the unconditional version is the one in the " +
      "meta description Google shows.");
  }
});

// ---------------------------------------------------------------------------
// RULE 5, continuity. A pharmacy transfer depends on where the patient is in
// their cycle and on the practice acting, so a flat promise that nothing will
// be interrupted is a promise we do not control. A hedged form is fine.
// ---------------------------------------------------------------------------
var CONTINUITY = /\b(?:no|zero)\s+(?:interruption|break|gap|disruption)\b[^.<]*\b(?:to your |in your |in )?(?:medication|medicines|prescription|supply)\b/i;
var CONTINUITY_HEDGE = /\b(?:usually|normally|in most cases|aim to|we aim|wherever possible|where possible|subject to)\b/i;
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var m = CONTINUITY.exec(p.text);
  if (!m) return;
  var window_ = p.text.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90);
  if (CONTINUITY_HEDGE.test(window_)) return;
  fail("continuity", "no interruption to your medication",
    rel(p.file) + ": the page promises \"" + flat(m[0]) + "\" with nothing " +
    "qualifying it. Continuity across a transfer is not ours alone to " +
    "guarantee, so this needs either a hedge or a decision that we do in fact " +
    "guarantee it.");
});

// ---------------------------------------------------------------------------
// RULE 6, the time claim. One number per page, the same number on all fifteen.
// ---------------------------------------------------------------------------
var seen = {};
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var nums = [], m;
  var re = /\b(\d+)\s*seconds?\b/gi;
  while ((m = re.exec(p.text)) !== null) nums.push(m[1]);
  if (!nums.length) {
    fail("time-claim", id + " no figure", rel(p.file) + ": the page carries no " +
      "seconds figure at all, although the H1 pattern and the form both state " +
      "one, so either the build is stale or the claim has been dropped from one " +
      "place and not the other.");
    return;
  }
  var uniq = nums.filter(function (v, i) { return nums.indexOf(v) === i; });
  if (uniq.length > 1) {
    fail("time-claim", id + " two figures", rel(p.file) + ": the page states " +
      uniq.join(" and ") + " seconds in different places. A patient reading both " +
      "learns only that neither is meant literally.");
  }
  uniq.forEach(function (v) { (seen[v] = seen[v] || []).push(path.basename(p.file)); });
});
var figures = Object.keys(seen);
if (figures.length > 1) {
  failures.push("[time-claim] the estate states more than one seconds figure: " +
    figures.map(function (f) {
      return f + " on " + seen[f].length + " page(s)";
    }).join(", ") + ". The claim is about the same form on every page, so it " +
    "must be the same number on every page.");
}

// ---------------------------------------------------------------------------
// RULE 7, no medicines and no clinical claim. Switching pharmacy is logistics.
// The moment this copy names a prescription-only medicine it becomes POM
// advertising, and the moment it claims an outcome it becomes a clinical
// claim, on a page that is not a clinical service page at all.
// ---------------------------------------------------------------------------
// The names moved into tools/pom-names.js on the item 3.13 quality pass,
// 2026-08-11, because by then the same class of list had been typed out in
// three separate checkers and a fourth was about to be written. The three
// groups below are the three services a switch page could drift into naming a
// medicine from. The weight loss group is WIDER than the nine names this
// checker used to hold: there was never a reason a switch page could name
// Rybelsus but not Wegovy, and the difference was an accident of which day
// each list was typed.
var pom = require("./pom-names.js");
var POM = pom.union(pom.WEIGHT_LOSS, pom.PHARMACY_FIRST, pom.CONTRACEPTION);
var CLINICAL = [
  { re: /\b(?:cure|cures|guaranteed results|clinically proven|proven to)\b/i, what: "an outcome claim" },
  { re: /\bbetter (?:health|outcomes) (?:if|when) you switch\b/i, what: "a health outcome tied to switching" }
];
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  POM.forEach(function (name) {
    if (new RegExp("\\b" + rx(name) + "\\b", "i").test(p.text)) {
      fail("no-medicines", id + " names " + name, rel(p.file) + ": the switch " +
        "page names " + name + ". This is public advertising copy for a page " +
        "about moving prescriptions, and naming a prescription-only medicine on " +
        "it is not permitted.");
    }
  });
  CLINICAL.forEach(function (c) {
    if (c.re.test(p.text)) {
      fail("no-medicines", id + " clinical claim", rel(p.file) + ": the switch " +
        "page makes " + c.what + ". Changing pharmacy does not change treatment, " +
        "so the page has no basis for it.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 8, town. The pill, the trust bar and step 2 each name a town, and it
// must be this branch's own. Branches that genuinely share a town are exempt
// from the second half, which is the same pairing check-seo-lengths rule 4
// makes for headings.
// ---------------------------------------------------------------------------
var townOf = {};
ids.forEach(function (id) { townOf[id] = CONFIG[id] && CONFIG[id].town; });
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var mine = townOf[id];
  if (!mine) return;
  ["<span class=\"pill\">", "trust-item", "step-no"].forEach(function () {});
  var pillLine = (p.html.match(/<span class="pill">([\s\S]*?)<\/span>/) || [])[1] || "";
  var trustBar = (p.html.match(/<div class="trust-bar">([\s\S]*?)<\/div>\s*<\/div>/) || [])[1] || "";
  var step2 = (p.html.match(/<div class="step-no">2<\/div>[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || "";
  [["pill", pillLine], ["trust bar", trustBar], ["step 2", step2]].forEach(function (pair) {
    if (!pair[1]) {
      fail("town", id + " missing " + pair[0], rel(p.file) + ": the " + pair[0] +
        " could not be read, so the one place this branch names its own town in " +
        "body copy is outside this rule.");
      return;
    }
    if (textOf(pair[1]).indexOf(mine) === -1) {
      fail("town", id + " wrong town in " + pair[0], rel(p.file) + ": the " +
        pair[0] + " does not name " + mine + ", which is this branch's own town " +
        "in the generator's CONFIG.");
    }
  });
  Object.keys(townOf).forEach(function (other) {
    if (other === id) return;
    var t = townOf[other];
    if (!t || t === mine) return;   // genuinely shared towns are not a fault
    if (new RegExp("\\b" + rx(t) + "\\b").test(textOf(pillLine + " " + trustBar + " " + step2))) {
      fail("town", id + " names " + t, rel(p.file) + ": the body copy names " +
        t + ", which is " + other + "'s town, not this branch's. On a shared " +
        "domain that is how two branches end up competing for one place.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 9, the form and the sentence about the form.
//
// Step 1 tells the patient exactly which details are wanted and which are
// optional. The form is a few lines below it in the same file, so the two are
// easy to change apart. This reads the real inputs and holds the sentence to
// them: a field added without a word of copy fails, and so does a required
// field the sentence calls optional.
// ---------------------------------------------------------------------------
var FIELD_WORDS = {
  first_name: /\bfirst name\b/i,
  last_name: /\blast name\b/i,
  dob: /\bdate of birth\b/i,
  mobile: /\bmobile\b/i,
  email: /\bemail\b/i
};
var IGNORED_INPUTS = { destination: 1, website_url: 1, company: 1 };

Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var grid = (p.html.match(/<div class="form-grid">([\s\S]*?)<\/div>\s*<input type="hidden"/) || [])[1] || "";
  if (!grid) {
    fail("form-copy", id + " no form grid", rel(p.file) + ": the form grid could " +
      "not be read, so the fields this page asks a patient for are outside this " +
      "rule while the sentence describing them is not.");
    return;
  }
  var step1 = (p.html.match(/<div class="step-no">1<\/div>[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || "";
  var sentence = textOf(step1);
  var inputs = [], m;
  var re = /<input[^>]*\bname="([^"]+)"[^>]*>/g;
  while ((m = re.exec(grid)) !== null) {
    if (IGNORED_INPUTS[m[1]]) continue;
    inputs.push({ name: m[1], required: /\brequired\b/.test(m[0]) });
  }
  if (!inputs.length) {
    fail("form-copy", id + " no inputs", rel(p.file) + ": the form grid holds no " +
      "named inputs, so either the form is broken or this parser has lost it.");
    return;
  }
  inputs.forEach(function (f) {
    var word = FIELD_WORDS[f.name];
    if (!word) {
      fail("form-copy", id + " undescribed field " + f.name, rel(p.file) + ": the " +
        "form asks for a field named \"" + f.name + "\" that this rule has no " +
        "wording for. A patient is told in step 1 what will be asked; add the " +
        "field to FIELD_WORDS and say it in the copy, or take the field out.");
      return;
    }
    if (!word.test(sentence)) {
      fail("form-copy", id + " unmentioned " + f.name, rel(p.file) + ": the form " +
        "asks for " + f.name + " and step 1 does not mention it, so the page " +
        "under-states what it collects.");
      return;
    }
    var optionalInCopy = new RegExp("(mobile|email)[^.]*\\boptional\\b", "i").test(sentence) &&
      (f.name === "mobile" || f.name === "email");
    if (f.required && optionalInCopy) {
      fail("form-copy", id + " " + f.name + " required but called optional",
        rel(p.file) + ": step 1 calls " + f.name + " optional and the input is " +
        "marked required.");
    }
    if (!f.required && !optionalInCopy && (f.name === "mobile" || f.name === "email")) {
      fail("form-copy", id + " " + f.name + " optional but not said so",
        rel(p.file) + ": " + f.name + " is optional in the form and step 1 does " +
        "not say so, so the page over-states what it needs.");
    }
  });
});

// ---------------------------------------------------------------------------
// RULE 10, the collection notice. The form takes a name, a date of birth and a
// way of contacting somebody, for a health purpose. Every page must carry a
// sentence at the point of collection saying what the details are for.
// Whether one sentence is a sufficient notice is asked separately at Q50; that
// there is one, on every page, next to the form rather than lost in a footer,
// is held here.
// ---------------------------------------------------------------------------
Object.keys(pages).forEach(function (id) {
  var p = pages[id];
  var line = (p.html.match(/<p class="privacy">([\s\S]*?)<\/p>/) || [])[1] || "";
  var text = textOf(line);
  if (!text) {
    fail("collection-notice", id + " none", rel(p.file) + ": the form collects a " +
      "name, a date of birth and contact details and the page carries no " +
      "statement of what they are used for at the point of collection.");
    return;
  }
  if (!/\b(?:use|used|only use)\b/i.test(text) || !/\b(?:switch|request|prescription)\b/i.test(text)) {
    fail("collection-notice", id + " vague", rel(p.file) + ": the collection " +
      "notice reads \"" + text + "\", which does not say what the details are " +
      "used for.");
  }
  var formPos = p.html.indexOf("<form id=\"switch-form\"");
  var formEnd = p.html.indexOf("</form>", formPos);
  var noticePos = p.html.indexOf("<p class=\"privacy\">");
  if (formPos === -1 || noticePos < formPos || noticePos > formEnd) {
    fail("collection-notice", id + " misplaced", rel(p.file) + ": the collection " +
      "notice is not inside the form a patient is filling in, so it is not at " +
      "the point of collection.");
  }
});

// ---------------------------------------------------------------------------
// RULE 11 - the banner, and the three sites that host two branches.
// (item 3.3 quality pass, 2026-08-13)
// ---------------------------------------------------------------------------
// Everything above this line reads the switch PAGES. The switch module also
// emits modules/switch/pages/banners/*.txt, one per branch, and nothing read
// them for MEANING: check-em-dashes holds them to ASCII and check-brand-spelling
// holds the brand string. That is the whole of the cover. Neither asks the one
// question a banner raises, which is where it sends somebody.
//
// It matters because of what the field is. The banner goes into Weebly >
// Settings > SEO > Header Code, which is SITE-WIDE, and it hard-codes one
// SWITCH_URL. The generator's own paster note calls this "one file per site".
// That is true of twelve of the fifteen and false of the other three:
// Fishlocks, McCanns and Scorah each trade two branches on ONE domain, so two
// banner files compete for one Header Code field and only one can be pasted.
// Whichever wins, every page on that domain carries a banner pointing at one
// branch's switch page - including all thirteen pages belonging to the sister
// branch.
//
// That is the shared-domain self-competition items 2.2 and 3.2 exist to stop,
// arriving through the one artefact neither item looked at. Item 2.2 built the
// branch landing pages precisely so each branch on a shared domain has
// something of its own to convert on; the banner sits above all of them and
// sends the traffic one way.
//
// Which branch should win, or whether the banner should pick its URL from the
// page path so each side keeps its own, is a conversion decision about live
// public copy and not an agent's to take. So 11b is DETECTED and pinned to Q63
// in KNOWN, while 11a - that a banner points at its own branch - is enforced
// outright, because that one needs no decision.
var BANNER_DIR = path.join(PAGE_DIR, "banners");
var bannerFiles = fs.existsSync(BANNER_DIR)
  ? fs.readdirSync(BANNER_DIR).filter(function (f) { return f.endsWith(".txt"); })
  : [];
var bannerOwner = {};

if (!bannerFiles.length) {
  // Missing or empty must fail, or the rules below quietly cover nothing -
  // the same guard check-em-dashes puts on this folder.
  failures.push("[banner] " + rel(BANNER_DIR) + ": no banner paste files, so the " +
    "banner rules cover nothing. Run tools/build-switch-pages.js.");
} else {
  var liveForBanner = JSON.parse(fs.readFileSync(BRANCHES, "utf8")).branches
    .filter(function (b) { return !b.disposed && b.brandSlug && b.townSlug && b.website; });
  var bySlugPair = {};
  liveForBanner.forEach(function (b) { bySlugPair[b.brandSlug + "-" + b.townSlug] = b; });

  function hostOf(b) {
    return String(b.website).replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  }

  // 11a. Every banner points at its OWN branch's switch page.
  bannerFiles.forEach(function (f) {
    var slug = f.replace(/^switch-prescriptions-/, "").replace(/\.txt$/, "");
    var b = bySlugPair[slug];
    if (!b) {
      failures.push("[banner] " + rel(path.join(BANNER_DIR, f)) + ": resolves to no live " +
        "branch, so nothing maintains it and nothing checks where it sends people.");
      return;
    }
    bannerOwner[f] = b;
    var src = fs.readFileSync(path.join(BANNER_DIR, f), "utf8");
    var m = /var\s+SWITCH_URL\s*=\s*"([^"]+)"/.exec(src);
    if (!m) {
      failures.push("[banner] " + rel(path.join(BANNER_DIR, f)) + ": declares no SWITCH_URL, " +
        "so the button in the site-wide header goes nowhere this checker can read.");
      return;
    }
    var want = "/switch-prescriptions-" + slug + ".html";
    if (m[1] !== want) {
      failures.push("[banner] " + rel(path.join(BANNER_DIR, f)) + ": SWITCH_URL is '" + m[1] +
        "' but this banner belongs to " + b.id + ", whose switch page is '" + want + "'. The " +
        "site-wide header would send every visitor on that site to another branch's page.");
    }
  });

  // 11b. Two banners, one Header Code field.
  var bannersByHost = {};
  Object.keys(bannerOwner).forEach(function (f) {
    var h = hostOf(bannerOwner[f]);
    (bannersByHost[h] = bannersByHost[h] || []).push(f);
  });
  Object.keys(bannersByHost).sort().forEach(function (h) {
    var group = bannersByHost[h].sort();
    if (group.length < 2) return;
    fail("banner-shared-host", h,
      rel(BANNER_DIR) + ": " + group.length + " banner files are written for the single site " +
      h + " (" + group.join(", ") + "), but Header Code is one site-wide field, so only one " +
      "can be pasted. Every page on " + h + ", including the sister branch's own pages, would " +
      "carry a banner pointing at one branch's switch page.");
  });
}

// ---------------------------------------------------------------------------
// A KNOWN entry that no longer breaks its rule has outlived its reason and
// fails the run, the same convention as KNOWN_DRIFT in check-cdn-pins.js.
// ---------------------------------------------------------------------------
Object.keys(KNOWN).forEach(function (key) {
  if (!knownUsed[key]) {
    failures.push("[known] the accepted breach \"" + key + "\" no longer breaks " +
      "its rule. The copy has been settled or changed, so remove the entry from " +
      "KNOWN in " + rel(__filename) + " rather than leaving a stale excuse in " +
      "place.");
  }
});

// ---------------------------------------------------------------------------
if (failures.length) {
  console.error("check-switch-copy: " + failures.length + " failure(s)\n");
  failures.forEach(function (f) { console.error("  " + f); });
  process.exit(1);
}
var accepted = Object.keys(KNOWN).length;
console.log("check-switch-copy: OK - " + Object.keys(pages).length +
  " switch page(s), " + COPY.length + " line(s) of body copy, " +
  bannerFiles.length + " banner(s) read for where they send people, 11 rules" +
  (accepted ? ", " + accepted + " accepted breach(es) pinned to a question" : "") + ".");
