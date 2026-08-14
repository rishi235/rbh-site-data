/*
  tools/check-uk-spelling.js - is the public copy written in UK English?

  Why this exists
  ---------------
  gbp-packs/TEMPLATE.md sets one copy rule for every pack: "UK English. No em
  dashes. No emojis. Plain English." CLAUDE.md sets the same rule for the
  whole estate. Until this file, TWO of those four clauses were held by a
  checker and two were not.

  The item 4.3 quality pass on 2026-08-13 found the gap by injection into
  gbp-packs/hirshmans-ainsdale.md. Three copy faults were planted in a pack
  whose FACTS are checked hard: a literal em dash in the business
  description, a real emoji in Post D, and US spelling. All three passed all
  29 checkers. The em dash and the emoji were closed the same day in
  check-em-dashes.js, which now holds all 16 pack files to pure ASCII and to
  no dash entity. US spelling was left open on purpose and recorded in that
  file's own header and in AGENT_LOG.md, because it needs a WORD LIST rather
  than a character test and half-building it was worse than leaving it named.
  This is that word list.

  Why a character test could never have caught it
  ----------------------------------------------
  Every rule in check-em-dashes.js asks what a BYTE is. An em dash is one
  code point, an emoji is one, and "not ASCII" is a decidable property of a
  file. "Organize" is pure ASCII, correctly spelled, and a perfectly ordinary
  English word. It is only wrong because it is the wrong SIDE of the
  Atlantic, which is knowledge and not arithmetic, so it has to be listed.

  The trap this rule sets for itself, and how it is avoided
  --------------------------------------------------------
  A word list is the easiest kind of checker to make useless. Run a naive
  \bcolor\b over this repo and it reports 614 hits in 187 files, every one of
  them the CSS property `color:#fff` or `background-color`. Run \bcheck\b and
  it reports 346, every one of them "free NHS blood pressure check", which is
  the correct UK wording of a service this estate sells. A checker that cries
  wolf gets widened until it means nothing, which is the failure the rest of
  this repo's tools exist to avoid.

  So the list is narrow in one direction and the READER is narrow in the
  other, and the two are separate defences:

  1. THE READER only ever sees copy. Not markup, not code, not identifiers.
     - .html and .txt: text nodes only, plus the values of the attributes a
       person or Google actually reads (alt, title, aria-label, placeholder,
       and meta/og content). <script> and <style> are dropped whole, and
       every other attribute is dropped with the tag. This is what kills
       `color:#fff`, `text-align:center`, `scrollIntoView({behavior:...})`
       and `Math.ceil` without any of those words having to leave the list.
     - .js: string literals only, comments blanked first. The copy a browser
       writes into a page with innerHTML is in a string; a property key,
       a method name and a variable are not copy and are not read.
     - .css: the value of `content:` and nothing else. That is the only
       place a stylesheet puts a word on a page.
     - .md: the whole file, less fenced code, less URLs, less quoted spans.
     - branches.json: string values, less URLs. Read for the reason
       check-em-dashes.js reads it: modules/emar/emar.js renders branch
       fields straight into the live page, and some of those fields reach no
       .html file in this repo.

  2. THE LIST only holds words with NO legitimate UK use in this copy.
     Deliberately EXCLUDED, each for a stated reason, because each is a wolf
     this checker would otherwise cry:
       check      "blood pressure check" is correct UK English and is the
                  name of a service on 178 files here.
       meter      a meter is a measuring device in UK English. A blood
                  glucose meter is spelled exactly this way. Only the UNIT
                  is metre, and this estate does not sell lengths.
       license    the VERB and "licensed premises" are correct UK English.
                  Only the noun takes a c, which needs grammar, not a list.
       practice   the UK NOUN, and this is a pharmacy: "GP practice"
                  appears throughout.
       program    correct UK English for a computer program.
       curb       "curb your appetite" is correct UK English; only the
                  kerbstone sense differs.
       story, disk, tire, inquiry, math, fetus, sulfur
                  all have a legitimate UK reading, and fetus and sulfur are
                  the spellings UK medical usage and the BNF actually use.
     Vocabulary is NOT in scope: drugstore, vacation, shot and refill are
     Americanisms rather than misspellings, and catching them needs a sense
     of register rather than a word list. Named here so the omission is a
     decision and not an oversight.

  What it checks
  --------------
    1. COPY    no listed US spelling appears in the visible copy of any
               public file. Reports the UK form to use.
    2. LIST    the list itself cannot rot: every entry's US and UK forms
               must differ, no entry's US form may be another entry's UK
               form (which would make the rule contradict itself), and the
               list may not shrink below a floor.
    3. READ    the reader must actually be reading. A file class that
               yields no copy at all, or a scan folder that has vanished,
               fails rather than passing silently. This is the fault this
               repo has now found six times: a checker that reports clean
               because it read nothing.

  Run:  node tools/check-uk-spelling.js
  Exits 1 on any failure.
*/
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");

var failures = [];
var notes = [];
var quotedEvidence = 0;

// ---------------------------------------------------------------------------
// THE LIST. US form -> UK form. Every entry is a word with no legitimate UK
// reading in this copy; see the exclusions in the header for the ones that
// were considered and left out. Forms are written out rather than derived,
// because deriving inflections invents words that are not English.
// ---------------------------------------------------------------------------
var SPELLINGS = {
  // -ise / -isation. House style throughout, and the CLAUDE.md word list
  // spells its own banned words this way.
  organize: "organise", organized: "organised", organizes: "organises",
  organizing: "organising", organization: "organisation",
  organizations: "organisations", organizational: "organisational",
  recognize: "recognise", recognized: "recognised", recognizing: "recognising",
  prioritize: "prioritise", prioritized: "prioritised",
  apologize: "apologise", apologized: "apologised",
  immunize: "immunise", immunized: "immunised",
  immunization: "immunisation", immunizations: "immunisations",
  specialize: "specialise", specialized: "specialised",
  specializing: "specialising", specialization: "specialisation",
  minimize: "minimise", minimized: "minimised",
  maximize: "maximise", maximized: "maximised",
  authorize: "authorise", authorized: "authorised",
  authorization: "authorisation", authorizations: "authorisations",
  personalize: "personalise", personalized: "personalised",
  realize: "realise", realized: "realised",
  emphasize: "emphasise", emphasized: "emphasised",
  summarize: "summarise", summarized: "summarised",
  standardize: "standardise", standardized: "standardised",
  sterilize: "sterilise", sterilized: "sterilised",
  utilize: "utilise", utilized: "utilised",
  normalize: "normalise", stabilize: "stabilise", stabilized: "stabilised",
  optimize: "optimise", optimized: "optimised",
  // -yse. "analysis" is spelled the same both sides and is NOT listed.
  analyze: "analyse", analyzed: "analysed", analyzing: "analysing",
  paralyze: "paralyse", paralyzed: "paralysed",
  // -our
  color: "colour", colors: "colours", colored: "coloured",
  colorful: "colourful",
  favor: "favour", favors: "favours", favorite: "favourite",
  favorites: "favourites", favorable: "favourable",
  behavior: "behaviour", behaviors: "behaviours",
  behavioral: "behavioural",
  labor: "labour", labors: "labours",
  honor: "honour", honored: "honoured",
  neighbor: "neighbour", neighbors: "neighbours",
  neighborhood: "neighbourhood",
  humor: "humour", odor: "odour", odors: "odours",
  vapor: "vapour", vapors: "vapours",
  flavor: "flavour", flavors: "flavours", flavored: "flavoured",
  rumor: "rumour", harbor: "harbour", endeavor: "endeavour",
  // -re
  center: "centre", centers: "centres", centered: "centred",
  fiber: "fibre", fibers: "fibres",
  liter: "litre", liters: "litres",
  theater: "theatre", theaters: "theatres",
  // -ogue
  catalog: "catalogue", catalogs: "catalogues",
  dialog: "dialogue", dialogs: "dialogues",
  analog: "analogue", monolog: "monologue",
  // -ence. "license" and "practice" are NOT listed; see the header.
  defense: "defence", offense: "offence", pretense: "pretence",
  // doubled consonant. The travel clinic copy is the live reason for these.
  traveling: "travelling", traveled: "travelled",
  traveler: "traveller", travelers: "travellers",
  canceled: "cancelled", canceling: "cancelling",
  counseling: "counselling", counseled: "counselled",
  counselor: "counsellor", counselors: "counsellors",
  labeled: "labelled", labeling: "labelling",
  modeling: "modelling", fueled: "fuelled", fueling: "fuelling",
  marveled: "marvelled", signaled: "signalled",
  // single l where UK doubles, and the reverse
  enroll: "enrol", enrolls: "enrols", enrollment: "enrolment",
  fulfill: "fulfil", fulfills: "fulfils", fulfillment: "fulfilment",
  skillful: "skilful", willful: "wilful", installment: "instalment",
  installments: "instalments",
  // ae / oe. Straight clinical vocabulary, which is why they are here.
  // "fetus" and "sulfur" are NOT listed; both are standard UK medical usage.
  pediatric: "paediatric", pediatrics: "paediatrics",
  pediatrician: "paediatrician",
  anemia: "anaemia", anemic: "anaemic",
  diarrhea: "diarrhoea", edema: "oedema",
  estrogen: "oestrogen", esophagus: "oesophagus",
  hemorrhoids: "haemorrhoids", hemorrhage: "haemorrhage",
  hemoglobin: "haemoglobin",
  orthopedic: "orthopaedic", gynecology: "gynaecology",
  gynecological: "gynaecological",
  leukemia: "leukaemia", ischemia: "ischaemia", ischemic: "ischaemic",
  anesthetic: "anaesthetic", anesthesia: "anaesthesia",
  anesthetist: "anaesthetist",
  celiac: "coeliac", orthopedics: "orthopaedics",
  // the rest
  aluminum: "aluminium", gray: "grey", grayed: "greyed",
  mold: "mould", molds: "moulds", molded: "moulded",
  skeptic: "sceptic", skeptical: "sceptical",
  jewelry: "jewellery", maneuver: "manoeuvre", plow: "plough",
  aging: "ageing", pajamas: "pyjamas", cozy: "cosy",
  donut: "doughnut"
  // "judgment" was considered and left out: it is the standard UK spelling in
  // legal usage, so it has a legitimate UK reading and fails this list's own
  // admission test, even though "judgement" is the right form in shop copy.
};

// The floor. The list may grow; it may not quietly shrink to nothing.
var LIST_FLOOR = 120;

// ---------------------------------------------------------------------------
// Rule 2: the list cannot rot.
// ---------------------------------------------------------------------------
var US_FORMS = Object.keys(SPELLINGS);
var UK_SET = {};
US_FORMS.forEach(function (us) { UK_SET[SPELLINGS[us]] = us; });

if (US_FORMS.length < LIST_FLOOR) {
  failures.push("the word list holds " + US_FORMS.length + " entries but the " +
    "floor is " + LIST_FLOOR + ". A list this rule depends on cannot be " +
    "allowed to shrink quietly; if entries were removed on purpose, lower " +
    "the floor in the same commit and say why");
}
US_FORMS.forEach(function (us) {
  var uk = SPELLINGS[us];
  if (us === uk) {
    failures.push('word list entry "' + us + '" maps to itself, so it can ' +
      "only ever report a word as wrong and offer the same word as the fix");
  }
  if (UK_SET[us] !== undefined && UK_SET[us] !== us) {
    failures.push('word list entry "' + us + '" is flagged as US spelling ' +
      'and is also offered as the UK fix for "' + UK_SET[us] + '", so the ' +
      "rule contradicts itself");
  }
});

// ---------------------------------------------------------------------------
// THE READER. Each file class yields copy and nothing else. See the header
// for why every one of these narrowings is load-bearing.
// ---------------------------------------------------------------------------

// Attributes a person or Google actually reads. Everything else goes with
// the tag, which is what keeps style, class, href and data-* out of scope.
var COPY_ATTR = /\s(?:alt|title|aria-label|placeholder|content)\s*=\s*("([^"]*)"|'([^']*)')/gi;

function htmlCopy(raw) {
  // Drop script and style whole, keeping newlines so line numbers survive.
  var t = raw.replace(/<script\b[\s\S]*?<\/script>/gi, blankKeepNl)
             .replace(/<style\b[\s\S]*?<\/style>/gi, blankKeepNl)
             .replace(/<!--[\s\S]*?-->/g, blankKeepNl);
  var out = [];
  var m;
  COPY_ATTR.lastIndex = 0;
  while ((m = COPY_ATTR.exec(t)) !== null) {
    out.push({ text: m[2] !== undefined ? m[2] : m[3], index: m.index });
  }
  // Text nodes: blank every tag, leaving what sat between them.
  var textOnly = t.replace(/<[^>]*>/g, blankKeepNl);
  out.push({ text: textOnly, index: 0, whole: true });
  return out;
}

function blankKeepNl(s) { return s.replace(/[^\n]/g, " "); }

function jsCopy(raw) {
  // Comments are a note to the next reader, not copy. Same treatment as
  // check-em-dashes.js and check-brand-spelling.js, so the three cannot
  // drift over what "live module code" means.
  var t = raw.replace(/\/\*[\s\S]*?\*\//g, blankKeepNl)
             .split("\n").map(function (l) {
               return /^\s*\/\//.test(l) ? blankKeepNl(l) : l;
             }).join("\n");
  // String literals only. A property key, a method name and a variable are
  // not copy; the words a browser writes into a page with innerHTML are.
  var out = [];
  var re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  var m;
  var state = { inTag: false };
  while ((m = re.exec(t)) !== null) {
    var s = m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]);
    if (s) out.push({ text: stripFragmentMarkup(s, state), index: m.index });
  }
  out.unbalanced = state.inTag;
  return out;
}

// A string literal in this repo's module code is usually a piece of HTML, and
// it is usually only PART of one, because the markup is built by joining
// literals with +. Left unhandled this is the one thing that would make a
// spelling list unusable here: the inline CSS inside those tags reads
// "color", "center" and "background-color", and the checker reported 14 of
// them on its first run, every one a false alarm.
//
// A regex over one literal cannot do this, because a literal can sit ENTIRELY
// INSIDE a tag and contain neither "<" nor ">":
//
//     "Call <a href='" + telHref + "' style='color:#fff;font-weight:700;" +
//       "text-decoration:underline;'>" + name + "</a>"
//
// The second literal is pure CSS and has no angle bracket to key on. The
// first two attempts at this missed it. So the state is carried ACROSS the
// literals of a file, in source order, which is the order the browser joins
// them in: a tag opened in one literal stays open until a later one closes
// it, and everything between is markup rather than copy.
//
// "<" only opens a tag when a letter or "/" follows it, which is the real
// HTML rule and is what keeps ordinary copy such as "blood pressure < 140"
// readable. A tag left open at the end of a file would silently blank the
// rest of it, so that is reported as a finding rather than trusted.
function stripFragmentMarkup(s, state) {
  var out = "";
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (state.inTag) {
      out += (c === "\n") ? "\n" : " ";
      if (c === ">") state.inTag = false;
    } else if (c === "<" && /[a-zA-Z\/!]/.test(s[i + 1] || "")) {
      state.inTag = true;
      out += " ";
    } else {
      out += c;
    }
  }
  return out;
}

function cssCopy(raw) {
  // The only place a stylesheet puts a word on a page.
  var out = [];
  var re = /content\s*:\s*("([^"]*)"|'([^']*)')/gi;
  var m;
  while ((m = re.exec(raw)) !== null) {
    out.push({ text: m[2] !== undefined ? m[2] : m[3], index: m.index });
  }
  return out;
}

function mdCopy(raw) {
  var t = raw.replace(/```[\s\S]*?```/g, blankKeepNl)   // fenced code
             .replace(/`[^`\n]*`/g, blankKeepNl)        // inline code
             .replace(/https?:\/\/\S+/g, blankKeepNl);  // URLs
  return [{ text: t, index: 0, whole: true }];
}

// A quoted span in a pack is a recorded reading of what a LIVE page says, so
// the pack is reporting it rather than claiming it. Same precedent as
// check-brand-spelling.js and check-gbp-packs.js.
function maskQuotes(text) {
  return text.replace(/"[^"\n]*"/g, blankKeepNl);
}

function jsonCopy(raw) {
  var out = [];
  var re = /:\s*"((?:[^"\\]|\\.)*)"/g;
  var m;
  while ((m = re.exec(raw)) !== null) {
    if (/^https?:\/\//.test(m[1])) continue;
    out.push({ text: m[1], index: m.index });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The copy in scope. Same estate as check-em-dashes.js and
// check-brand-spelling.js, deliberately: three checkers reading three
// different sets of "public copy" is how a rule goes missing in a watched
// folder, which is exactly the fault this file was written to close.
// ---------------------------------------------------------------------------
var SCAN_DIRS = [
  path.join(ROOT, "modules", "service", "pages"),
  path.join(ROOT, "modules", "switch", "pages"),
  path.join(ROOT, "modules", "switch", "pages", "banners"),
  path.join(ROOT, "modules", "branch", "pages"),
  path.join(ROOT, "modules", "service", "weebly-paste"),
  path.join(ROOT, "gbp-packs")
];
var SCAN_FILES = [
  path.join(ROOT, "modules", "switch", "weebly.html"),
  path.join(ROOT, "modules", "emar", "weebly"),
  path.join(ROOT, "modules", "service", "DRAFT-weight-loss-copy.html"),
  path.join(ROOT, "modules", "service", "DRAFT-travel-clinic-copy.html"),
  path.join(ROOT, "branches.json")
];
var CODE_DIRS = [path.join(ROOT, "modules"), path.join(ROOT, "core")];

function rel(p) { return path.relative(ROOT, p).replace(/\\/g, "/"); }

var targets = [];
SCAN_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is in the scan list and is not there any " +
      "more - either the copy moved and this list needs updating, or a " +
      "folder of public copy has gone unwatched");
    return;
  }
  fs.readdirSync(dir).forEach(function (f) {
    if (/\.(html|md|txt)$/i.test(f)) targets.push(path.join(dir, f));
  });
});
SCAN_FILES.forEach(function (f) {
  if (!fs.existsSync(f)) {
    failures.push(rel(f) + " is in the scan list and is not there any more " +
      "- CLAUDE.md names it as public copy, so its disappearance is a " +
      "finding, not a pass");
    return;
  }
  targets.push(f);
});

function walkCode(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCode(full, out);
    else if (/\.(?:js|css)$/i.test(entry.name)) out.push(full);
  });
  return out;
}
var codeCount = 0;
CODE_DIRS.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    failures.push(rel(dir) + " is a live code folder and it is gone, so the " +
      "run-time copy rule covers nothing there");
    return;
  }
  walkCode(dir, []).sort().forEach(function (f) { targets.push(f); codeCount++; });
});
if (!codeCount) {
  failures.push("no .js or .css found under modules/ or core/, so the " +
    "run-time copy rule read nothing. Every generated page loads these " +
    "files from jsDelivr, so an empty read is a finding, not a pass");
}

// ---------------------------------------------------------------------------
// Rule 1: the copy itself.
// ---------------------------------------------------------------------------
var PATTERNS = US_FORMS.map(function (us) {
  return { us: us, uk: SPELLINGS[us], re: new RegExp("\\b" + us + "\\b", "gi") };
});

function lineOf(text, index) {
  return text.slice(0, index).split(/\r\n|\r|\n/).length;
}

var readCounts = { html: 0, md: 0, js: 0, css: 0, json: 0, other: 0 };
var copyChars = { html: 0, md: 0, js: 0, css: 0, json: 0 };

targets.forEach(function (p) {
  var raw = fs.readFileSync(p, "utf8");
  var ext = (p.match(/\.([a-z]+)$/i) || [, ""])[1].toLowerCase();
  var kind, chunks;

  if (ext === "md") {
    kind = "md";
    chunks = mdCopy(maskQuotes(raw));
  } else if (ext === "js") {
    kind = "js";
    chunks = jsCopy(raw);
    if (chunks.unbalanced) {
      failures.push(rel(p) + ": a tag opened in a string literal is never " +
        "closed in a later one, so from that point on this file's copy was " +
        "read as markup and skipped. That is a silent blind spot, not a " +
        "pass - fix the markup or the reader before trusting this file");
    }
  } else if (ext === "css") {
    kind = "css";
    chunks = cssCopy(raw);
  } else if (ext === "json") {
    kind = "json";
    chunks = jsonCopy(raw);
  } else {
    // .html, .txt banners, and modules/emar/weebly, which carries no
    // extension at all and is a pasted Weebly block like any other.
    kind = "html";
    chunks = htmlCopy(raw);
  }
  readCounts[kind]++;
  chunks.forEach(function (c) { copyChars[kind] += c.text.replace(/\s+/g, "").length; });

  chunks.forEach(function (c) {
    PATTERNS.forEach(function (pat) {
      pat.re.lastIndex = 0;
      var m;
      while ((m = pat.re.exec(c.text)) !== null) {
        var at = c.whole ? lineOf(c.text, m.index) : lineOf(raw, c.index);
        failures.push(rel(p) + ":" + at + ': reads "' + m[0] +
          '". UK English is "' + pat.uk + '"');
      }
    });
  });

  // A US spelling inside a quoted reading of a live page is evidence of what
  // that page says, not this file saying it. Reported, never failed.
  if (kind === "md") {
    var quoted = raw.replace(/```[\s\S]*?```/g, blankKeepNl)
                    .replace(/https?:\/\/\S+/g, blankKeepNl);
    PATTERNS.forEach(function (pat) {
      pat.re.lastIndex = 0;
      var q;
      while ((q = pat.re.exec(quoted)) !== null) {
        var masked = maskQuotes(quoted);
        if (masked.slice(q.index, q.index + q[0].length).trim() === "") {
          quotedEvidence++;
          notes.push(rel(p) + ":" + lineOf(raw, q.index) + ' records "' +
            q[0] + '" inside quotation marks, read as a note of what a live ' +
            'page says rather than as this file claiming it');
        }
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Rule 3: the reader must actually have read something. A file class that
// yields no copy at all is a finding, not a pass. This repo has now found
// the same shape six times: a checker reporting clean because it read
// nothing.
// ---------------------------------------------------------------------------
["html", "md", "js", "json"].forEach(function (k) {
  if (readCounts[k] && !copyChars[k]) {
    failures.push(readCounts[k] + " " + k + " file(s) were opened and the " +
      "reader extracted no copy from any of them, so this rule passed them " +
      "without reading a word. The extractor for that file class is broken");
  }
});
if (!readCounts.html || !readCounts.md || !readCounts.js) {
  failures.push("one of the three main copy classes (html, md, js) yielded " +
    "no files at all, so a whole class of public copy went unread");
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
console.log("check-uk-spelling");
console.log("  " + US_FORMS.length + " US spelling(s) held against their UK " +
  "forms, floor " + LIST_FLOOR);
console.log("  " + readCounts.html + " page/paste/banner file(s), " +
  readCounts.md + " pack/sheet file(s), " + readCounts.js + " live script(s), " +
  readCounts.css + " stylesheet(s), " + readCounts.json + " data file(s)");
console.log("  copy read: markup " + copyChars.html + " chars, markdown " +
  copyChars.md + ", script strings " + copyChars.js + ", stylesheet content " +
  copyChars.css + ", data strings " + copyChars.json);
console.log("");

notes.forEach(function (n) { console.log("  NOTE  " + n); });

if (failures.length) {
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("\ncheck-uk-spelling: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("check-uk-spelling: clean, the public copy is written in UK " +
  "English" + (quotedEvidence ? ", " + quotedEvidence + " quoted reading(s) " +
  "of a live page read as evidence" : "") + ".");
process.exit(0);
