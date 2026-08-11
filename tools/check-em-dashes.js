/*
  check-em-dashes.js  (added 2026-08-09 as part of the Q7 fix)

  House rule: no em dashes anywhere in copy that reaches the public. Standard
  hyphens only. Q7 found two generated strings breaching it - the switch page
  body sentence and the switch page meta description, which becomes the Google
  snippet. Both were rewritten by splitting the sentence at a full stop.

  This checker exists so the same thing cannot come back unnoticed.

  What FAILS the run:
    - an em dash (U+2014) or en dash (U+2013) in visible page copy, meaning
      anywhere in a generated .html once HTML comments are stripped out
    - the SAME dashes written as HTML entities, which render identically in a
      browser but are invisible to a literal character search: &mdash; &ndash;
      &#8212; &#8211; and their hex forms &#x2014; &#x2013;
    - an em dash or en dash, literal or entity, in a pasteable value in the
      paste sheets, meaning the Page Title, Page Description or Meta Keywords
      lines that get typed into the Weebly SEO fields
    - the same, in the non-generated public copy listed in EXTRA_HTML: the
      hand-pasted Weebly blocks, and the DRAFT-*.html templates the weight loss
      and travel clinic generators name as their approved-copy source
    - a file listed in EXTRA_HTML that no longer exists, so the list cannot
      quietly stop covering anything
    - a pages folder that yields no paste sheet at all, so the sheet half of
      the rule cannot quietly stop covering anything either
    - an em dash or en dash, literal or entity, in the LIVE MODULE CODE under
      modules/ and core/, meaning the .js and .css every generated page loads
      from jsDelivr, with comments blanked. Three of those files write
      sentences into the page with innerHTML at run time, so that copy is as
      public as a page and is in no .html file in this repo
    - a live code folder that yields no .js or .css at all, so the module-code
      rule cannot quietly stop covering anything
    - ANY non-ASCII character at all in a switch banner paste file under
      modules/switch/pages/banners/, which is a stricter rule than the rest of
      this checker applies and is explained below
    - an empty or missing banners folder, so the stricter rule cannot quietly
      stop covering anything either

  Why the banners get an ASCII-only rule rather than a dash rule. A banner is
  not pasted into a page. It goes into Weebly > Settings > SEO > Header Code,
  site-wide, and whatever encoding that field applies is not the one the page
  body gets. Found on the item 4.15 quality pass, 2026-08-10: the close button
  was written as a literal multiplication sign and every branch site rendered
  it as mojibake, on every page carrying the banner, while an en dash in the
  page footer of the very same page rendered correctly. So the fault was not
  the character being non-ASCII in principle, it was the character being
  non-ASCII in THAT field. There is no way to test a paste field's encoding
  from here, so the rule is simply that a banner must be pure ASCII and any
  symbol must be written as an HTML entity, which innerHTML resolves anyway.

  Why the entity rule exists. The original checker matched literal characters
  only, and passed clean while all 15 generated weight loss pages carried two
  &ndash; each, 30 en dashes of public copy on the most compliance-sensitive
  page family in the estate. A source file can hold a dash in either form and
  a reader cannot tell them apart on the rendered page, so a rule that reads
  only one form is not a rule. Found on the item 3.9 quality pass, 2026-08-10,
  and fixed at source in tools/build-weight-loss-pages.js by splitting both
  sentences at a full stop, which is what Q7 settled for the literal case.

  Why the sheets are DISCOVERED rather than named. Until the item 3.6 quality
  pass on 2026-08-11 this checker read exactly two filenames per pages folder,
  "INDEX.md" and "SEO.md", and skipped a named file that did not exist without
  a word. Six generators write eleven paste sheets between them and five of
  them are named after their service, so five sheets had never been read at
  all: CONTRACEPTION-SEO.md, TRAVEL-CLINIC-SEO.md, WEIGHT-LOSS-SEO.md,
  TRAVEL-CLINIC-INDEX.md and WEIGHT-LOSS-INDEX.md. Three of those five carry
  the Weebly SEO strings for the weight loss and travel clinic families, which
  is where the entity-dash fault of the 3.9 pass lived on the page side, so
  the least-watched sheets were the ones belonging to the most
  compliance-sensitive copy in the estate. They are clean today, which is the
  only reason this is a latent hole rather than a live breach. The folder is
  now scanned for *.md, so a sheet a future generator adds is covered the day
  it is written rather than the day somebody remembers to list it, and a
  folder yielding no sheet fails instead of passing quietly.

  This is the fourth time this repo has found the same shape of fault: when a
  checker passes, ask WHICH FILES it read. check-seo-lengths rule 3 read the
  sheets and the H1 was not on one; check-nap read two phone shapes and the
  FAQ used a third; check-cdn-pins was built to look past the repo and still
  only looked inside it; this one named its files and the estate outgrew the
  names.

  The fifth time is the module-code rule below, and it is the worst of the
  five, because it was not latent. Every rule here read a FILE FORMAT: .html
  for a page, .md for a sheet, .txt for a banner. Public copy that a browser
  assembles from a .js string at run time matched none of those, so three
  &mdash; entities sat on the 14 live Pharmacy First overview pages, one per
  branch, two days after Q7 settled that they must not, while this checker
  reported clean, and they are still there today because the pages pin an
  older branch of this repo for their code. Found on the
  item 5.1 quality pass, 2026-08-11. Ask which files a checker reads, and then
  ask whether the copy is in a file at all.

  What is only REPORTED, not failed:
    - dashes inside <!-- HTML build comments -->, which no visitor sees
    - dashes inside block comments and whole-line // comments in the module
      code, which no visitor sees either
    - dashes in paste sheet headings, which are labels for whoever is pasting

  Run:  node tools/check-em-dashes.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const EM = "—";
const EN = "–";

// The entity spellings of the same two characters. A browser renders these
// identically to the literal form, so anything that reaches the public has to
// be checked for both. Kept as one source of truth for the test and the count.
const EM_ENTITY = /&(?:mdash|#8212|#[xX]2014);/g;
const EN_ENTITY = /&(?:ndash|#8211|#[xX]2013);/g;
const ENTITY_RE = /&(?:mdash|ndash|#8212|#8211|#[xX]2014|#[xX]2013);/g;

const LITERAL_RE = /[–—]/;
// One test used by every call site: does this line carry a dash in ANY form.
function hasDash(line){
  ENTITY_RE.lastIndex = 0;
  return LITERAL_RE.test(line) || ENTITY_RE.test(line);
}
// Report em vs en, and literal vs entity, so a failure says what to look for.
function dashKind(line){
  if (line.indexOf(EM) !== -1) return "em dash";
  if (line.indexOf(EN) !== -1) return "en dash";
  EM_ENTITY.lastIndex = 0;
  if (EM_ENTITY.test(line)) return "em dash (HTML entity)";
  return "en dash (HTML entity)";
}

// Folders holding generated pages that get pasted onto the live sites.
const PAGE_DIRS = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// Copy that reaches the public WITHOUT being a generated page, so nothing in
// PAGE_DIRS reads it. Two kinds, and both had to be added:
//
//   - the weebly-paste blocks and modules/switch/weebly.html, which are pasted
//     into a Weebly embed element by hand, so they are as public as any
//     generated page the moment somebody pastes them
//   - the DRAFT-*.html copy templates, which are not pasted anywhere, but ARE
//     the approved copy the weight loss and travel clinic generators name in
//     their own headers as the source they were built from
//
// The second one is why this list exists. The item 3.9 pass fixed 30 &ndash;
// entities in the generated weight loss pages, and the item 5.1 pass found the
// same two sentences still carrying &ndash; in the approved-copy draft those
// pages cite. The output was clean and its stated source was not, so the next
// person composing copy from the approved source would have reintroduced it
// and this checker would have passed. Found on the item 5.1 quality pass,
// 2026-08-10, and fixed at source by splitting both sentences at a full stop,
// which is what Q7 settled and what the generator already ships.
//
// Build comments are blanked before the check, exactly as for a page, so a
// dash in a governance note at the top of a draft is still not a failure.
//
// modules/emar/weebly carries no file extension, which is why it sat outside
// every scan in this checker until the item 5.1 quality pass on 2026-08-11.
// It is a hand-pasted Weebly block like modules/switch/weebly.html and is as
// public as one.
const EXTRA_HTML = [
  path.join(REPO, "modules", "switch", "weebly.html"),
  path.join(REPO, "modules", "emar", "weebly"),
  path.join(REPO, "modules", "service", "DRAFT-weight-loss-copy.html"),
  path.join(REPO, "modules", "service", "DRAFT-travel-clinic-copy.html"),
  path.join(REPO, "modules", "service", "weebly-paste", "cherry-lane-old-pharmacy-first-replacement.html"),
  path.join(REPO, "modules", "service", "weebly-paste", "cherry-lane-old-weight-loss-replacement.html")
];

// Lines in the paste sheets whose value is typed straight into Weebly.
const PASTEABLE_LINE = /^\s*-\s*\*\*(Page Title|Page Description|Meta Keywords):\*\*/;

// The switch banner paste files. Pasted into Weebly's site-wide Header Code
// field, which mangles non-ASCII characters, so these are held to ASCII only.
const BANNER_DIR = path.join(REPO, "modules", "switch", "pages", "banners");
const NON_ASCII_RE = /[^\x00-\x7F]/g;

// The live module code. Every generated page loads modules/<name>/<name>.js
// and .css, plus core/site-data.js, from jsDelivr, and three of those files
// build sentences with innerHTML at run time. That copy is on the page a
// patient reads and it is in no .html file anywhere in this repo, so until the
// item 5.1 quality pass on 2026-08-11 nothing here had ever read it.
//
// It was not a latent hole. modules/service/service.js was writing three
// &mdash; entities onto all 14 Pharmacy First overview pages, one per branch:
// the green self-refer banner, the explainer video card and the "Prefer to
// walk in?" card. That is the exact breach Q7 was raised about and item 5.1
// fixed on the switch pages on 2026-08-09, and it was still on those 14 pages
// two days later, because the rule was written to read pages and this copy is
// not on one. Fixed at source the same way Q7 settled: split at a full stop.
//
// Discovered by scanning rather than named, for the reason the sheets are.
// A folder yielding no code file fails, so the rule cannot quietly stop
// covering anything.
const CODE_DIRS = [path.join(REPO, "modules"), path.join(REPO, "core")];
const CODE_EXT = /\.(?:js|css)$/i;

const failures = [];
const notes = { commentDashes: 0, headingDashes: 0, filesScanned: 0 };

function rel(p){ return path.relative(REPO, p).replace(/\\/g, "/"); }

// Replace the contents of HTML comments with spaces, keeping line numbers and
// column positions intact so reported line numbers still match the real file.
function blankComments(text){
  return text.replace(/<!--[\s\S]*?-->/g, function(block){
    return block.replace(/[^\n]/g, " ");
  });
}

function countDashes(text){
  const lit = text.match(/[–—]/g);
  ENTITY_RE.lastIndex = 0;
  const ent = text.match(ENTITY_RE);
  return (lit ? lit.length : 0) + (ent ? ent.length : 0);
}

function checkHtmlFile(file){
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  const visible = blankComments(raw);
  notes.commentDashes += countDashes(raw) - countDashes(visible);
  visible.split(/\r?\n/).forEach(function(line, i){
    if (hasDash(line)) {
      failures.push({
        file: rel(file),
        line: i + 1,
        kind: dashKind(line),
        text: line.trim().slice(0, 140)
      });
    }
  });
}

function checkPasteSheet(file){
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  raw.split(/\r?\n/).forEach(function(line, i){
    if (!hasDash(line)) return;
    if (PASTEABLE_LINE.test(line)) {
      failures.push({
        file: rel(file),
        line: i + 1,
        kind: dashKind(line),
        text: line.trim().slice(0, 140)
      });
    } else {
      notes.headingDashes += countDashes(line);
    }
  });
}

// A banner fails on ANY non-ASCII character, in a comment or not. Unlike a
// page, nothing here is invisible to the paste: the whole file is typed into
// one field, and a character that field cannot carry is a rendering fault
// wherever in the file it sits.
function checkBannerFile(file){
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  raw.split(/\r?\n/).forEach(function(line, i){
    NON_ASCII_RE.lastIndex = 0;
    const found = line.match(NON_ASCII_RE);
    if (!found) return;
    const codes = found.map(function(ch){
      return "U+" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0");
    }).join(" ");
    failures.push({
      file: rel(file),
      line: i + 1,
      kind: "non-ASCII in banner paste (" + codes + ")",
      text: line.trim().slice(0, 140)
    });
  });
}

// A code file is checked with its comments blanked, because a dash in a note
// to the next developer reaches nobody. Two shapes are blanked and only two:
// /* ... */ blocks, and lines that are a // comment from the first non-space
// character. A trailing // comment after live code is deliberately NOT
// blanked, because the only safe way to find one is to blank from the first
// "//" on the line, and that would also blank every https:// URL and any
// string literal following it. Erring towards a failure that a human reads is
// right for a checker; erring towards silence is what put the three &mdash;
// on 14 live pages in the first place.
function blankCodeComments(text){
  const noBlocks = text.replace(/\/\*[\s\S]*?\*\//g, function(block){
    return block.replace(/[^\n]/g, " ");
  });
  return noBlocks.split("\n").map(function(line){
    return /^\s*\/\//.test(line) ? line.replace(/[^\n]/g, " ") : line;
  }).join("\n");
}

function checkCodeFile(file){
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  const visible = blankCodeComments(raw);
  notes.commentDashes += countDashes(raw) - countDashes(visible);
  visible.split(/\r?\n/).forEach(function(line, i){
    if (hasDash(line)) {
      failures.push({
        file: rel(file),
        line: i + 1,
        kind: dashKind(line) + " in live module code",
        text: line.trim().slice(0, 140)
      });
    }
  });
}

function walkCode(dir, out){
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function(entry){
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCode(full, out);
    else if (CODE_EXT.test(entry.name)) out.push(full);
  });
  return out;
}

let codeCount = 0;
CODE_DIRS.forEach(function(dir){
  if (!fs.existsSync(dir)) {
    failures.push({
      file: rel(dir),
      line: 0,
      kind: "missing folder",
      text: "a live code folder is gone, so the module-code rule covers nothing there."
    });
    return;
  }
  walkCode(dir, []).sort().forEach(function(file){
    checkCodeFile(file);
    codeCount++;
  });
});
if (codeCount === 0) {
  failures.push({
    file: "modules, core",
    line: 0,
    kind: "no code files",
    text: "no .js or .css found in the live module folders, so the module-code rule covers nothing."
  });
}

let bannerCount = 0;
if (!fs.existsSync(BANNER_DIR)) {
  failures.push({
    file: rel(BANNER_DIR),
    line: 0,
    kind: "missing folder",
    text: "the switch banner folder is gone, so the ASCII-only banner rule covers nothing."
  });
} else {
  fs.readdirSync(BANNER_DIR).filter(function(f){ return f.endsWith(".txt"); }).forEach(function(f){
    checkBannerFile(path.join(BANNER_DIR, f));
    bannerCount++;
  });
  if (bannerCount === 0) {
    failures.push({
      file: rel(BANNER_DIR),
      line: 0,
      kind: "empty folder",
      text: "no banner files found, so the ASCII-only banner rule covers nothing. Run tools/build-switch-pages.js."
    });
  }
}

let pageCount = 0;
let sheetCount = 0;
PAGE_DIRS.forEach(function(dir){
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function(f){ return f.endsWith(".html"); }).forEach(function(f){
    checkHtmlFile(path.join(dir, f));
    pageCount++;
  });
  // Every .md a generator writes into a pages folder is a paste sheet. Scan
  // rather than name, so a sheet added by a future generator is covered from
  // the day it is written. See "Why the sheets are DISCOVERED" above.
  const sheets = fs.readdirSync(dir).filter(function(f){ return f.endsWith(".md"); }).sort();
  if (!sheets.length) {
    failures.push({
      file: rel(dir),
      line: 0,
      kind: "no paste sheet",
      text: "this pages folder holds no .md paste sheet, so the sheet half of the rule covers nothing here. Re-run the generator that writes it."
    });
  }
  sheets.forEach(function(f){
    checkPasteSheet(path.join(dir, f));
    sheetCount++;
  });
});

// The non-generated public copy. A listed file that no longer exists fails the
// run rather than being skipped quietly, the same convention as the KNOWN lists
// in the other checkers: a list nobody notices going stale is not a rule.
let extraCount = 0;
EXTRA_HTML.forEach(function(file){
  if (!fs.existsSync(file)) {
    failures.push({
      file: rel(file),
      line: 0,
      kind: "missing file",
      text: "listed in EXTRA_HTML but not present. Remove the entry or restore the file."
    });
    return;
  }
  checkHtmlFile(file);
  extraCount++;
});

console.log("check-em-dashes: " + pageCount + " generated pages, " + extraCount
  + " non-generated copy file(s), " + codeCount
  + " live module code file(s), " + bannerCount
  + " switch banner(s) held to ASCII only, " + sheetCount
  + " paste sheet(s) discovered (" + notes.filesScanned + " files scanned)");
console.log("  " + notes.commentDashes + " dash(es) inside build or code comments - not public, not a failure");
console.log("  " + notes.headingDashes + " dash(es) in paste sheet headings - paster labels, not pasted values");

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + ") - dashes, or banner characters, in copy that reaches the public:");
  failures.forEach(function(f){
    console.log("  FAIL  " + f.file + " line " + f.line + " (" + f.kind + "): " + f.text);
  });
  console.log("");
  console.log("Fix at source in the generator, then regenerate. Split the sentence at a");
  console.log("full stop rather than swapping in a hyphen where a hyphen would read badly.");
  process.exit(1);
}

console.log("");
console.log("check-em-dashes: clean, no em or en dashes in public copy, literal or HTML entity.");
