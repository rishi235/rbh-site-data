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
    - an em dash or en dash in a pasteable value in the paste sheets, meaning
      the Page Title, Page Description or Meta Keywords lines that get typed
      into the Weebly SEO fields

  What is only REPORTED, not failed:
    - dashes inside <!-- HTML build comments -->, which no visitor sees
    - dashes in paste sheet headings, which are labels for whoever is pasting

  Run:  node tools/check-em-dashes.js
*/
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const EM = "—";
const EN = "–";
const DASH_RE = /[–—]/;

// Folders holding generated pages that get pasted onto the live sites.
const PAGE_DIRS = [
  path.join(REPO, "modules", "switch", "pages"),
  path.join(REPO, "modules", "service", "pages"),
  path.join(REPO, "modules", "branch", "pages")
];

// Lines in the paste sheets whose value is typed straight into Weebly.
const PASTEABLE_LINE = /^\s*-\s*\*\*(Page Title|Page Description|Meta Keywords):\*\*/;

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
  const m = text.match(/[–—]/g);
  return m ? m.length : 0;
}

function checkHtmlFile(file){
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  const visible = blankComments(raw);
  notes.commentDashes += countDashes(raw) - countDashes(visible);
  visible.split(/\r?\n/).forEach(function(line, i){
    if (DASH_RE.test(line)) {
      failures.push({
        file: rel(file),
        line: i + 1,
        kind: line.indexOf(EM) !== -1 ? "em dash" : "en dash",
        text: line.trim().slice(0, 140)
      });
    }
  });
}

function checkPasteSheet(file){
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  notes.filesScanned++;
  raw.split(/\r?\n/).forEach(function(line, i){
    if (!DASH_RE.test(line)) return;
    if (PASTEABLE_LINE.test(line)) {
      failures.push({
        file: rel(file),
        line: i + 1,
        kind: line.indexOf(EM) !== -1 ? "em dash" : "en dash",
        text: line.trim().slice(0, 140)
      });
    } else {
      notes.headingDashes += countDashes(line);
    }
  });
}

let pageCount = 0;
PAGE_DIRS.forEach(function(dir){
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(function(f){ return f.endsWith(".html"); }).forEach(function(f){
    checkHtmlFile(path.join(dir, f));
    pageCount++;
  });
  checkPasteSheet(path.join(dir, "INDEX.md"));
  checkPasteSheet(path.join(dir, "SEO.md"));
});

console.log("check-em-dashes: " + pageCount + " generated pages plus paste sheets ("
  + notes.filesScanned + " files scanned)");
console.log("  " + notes.commentDashes + " dash(es) inside HTML build comments - not public, not a failure");
console.log("  " + notes.headingDashes + " dash(es) in paste sheet headings - paster labels, not pasted values");

if (failures.length) {
  console.log("");
  console.log("FAILURES (" + failures.length + ") - dashes in copy that reaches the public:");
  failures.forEach(function(f){
    console.log("  FAIL  " + f.file + " line " + f.line + " (" + f.kind + "): " + f.text);
  });
  console.log("");
  console.log("Fix at source in the generator, then regenerate. Split the sentence at a");
  console.log("full stop rather than swapping in a hyphen where a hyphen would read badly.");
  process.exit(1);
}

console.log("");
console.log("check-em-dashes: clean, no em or en dashes in public copy.");
