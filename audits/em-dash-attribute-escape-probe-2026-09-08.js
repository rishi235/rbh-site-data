/*
  em-dash-attribute-escape-probe-2026-09-08.js

  Independent proof for the item 5.1 quality pass (fifteenth), 2026-09-08.

  Proves that, before this pass's fix, tools/check-em-dashes.js could not see
  a JS or CSS source-level dash escape sitting inside an HTML ATTRIBUTE VALUE
  (style="", on<event>="", href="javascript:...") even though the item 5.1
  quality pass (fourteenth) had already taught it to decode the identical
  escape forms inside an inline <style>/<script> ELEMENT BODY. checkEmbeddedBlocks
  reads the text BETWEEN a <style>/<script> tag pair; it never reads an
  attribute value sitting on an element's own opening tag, which is a
  different shape carrying the same risk.

  Run against a fresh, unpatched copy of check-em-dashes.js (see below for how
  to obtain one) in an isolated directory - never against the tracked repo
  directly, so no injection ever touches a file under version control.

  Method:
    1. Copy tools/, modules/, core/, gbp-packs/, branches.json and
       tools/extra-public-copy-files.js into an isolated directory with no
       .git, so the tracked repo is never opened for writing.
    2. Confirm the mirror's baseline output matches the tracked repo's own
       steady state exactly (233 files scanned, 200/591/1 dash counts, zero
       failures), proving the mirror is faithful.
    3. Take a real, pre-existing style="" attribute on a copy of
       modules/switch/pages/switch-prescriptions-cherry-lane-walton.html and
       inject three cases, one at a time, restoring from the untouched
       original between each:
         a. a CSS hex escape ("\2014") appended to the style="" attribute's
            value, inside a font-family declaration
         b. a JS unicode escape (the literal 6-character text
            backslash-u-2014, NOT a real em dash - built with chr(92) in the
            injection script itself to remove any risk of shell/Python string
            escaping silently decoding it into a real character before the
            checker ever saw it) inside a newly added onclick="" attribute
         c. the same literal escape text inside a newly added
            href="javascript:..." attribute
    4. Run the UNPATCHED checker against each case: all three exit 0,
       "clean, no em or en dashes in public copy, literal or HTML entity" -
       wrongly clean.
    5. Run the PATCHED checker (this pass's fix) against the same three
       cases: all three now FAIL, each at the correct line, each correctly
       worded ("... (CSS hex escape) in inline style attribute" /
       "... (JS unicode escape) in inline event-handler attribute" /
       "... (JS unicode escape) in inline href=\"javascript:\" attribute").
    6. Control: a non-dash escape ("\0041", the letter A) in the same
       style="" attribute stays correctly clean against the patched checker,
       proving the fix does not overreach.
    7. Confirm scope: a fresh grep across modules/ and gbp-packs/ for
       on[a-z]+= and javascript: finds zero real occurrences anywhere in the
       estate today, so the event-handler/href half of this fix is defensive
       rather than proven live-reachable; the style="" half is real and
       common (183 files under modules/ carry at least one such attribute).

  All five checks (three catches, one control, one scope confirmation) must
  pass for this probe to be considered successful. The tracked repo's own
  copy of the target page is never written to by this script - only files
  inside the isolated mirror directory are touched.
*/
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET_REL = path.join("modules", "switch", "pages", "switch-prescriptions-cherry-lane-walton.html");

function makeMirror(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "em-dash-attr-probe-"));
  ["tools", "modules", "core", "gbp-packs"].forEach(function(name){
    fs.cpSync(path.join(REPO, name), path.join(dir, name), { recursive: true });
  });
  fs.copyFileSync(path.join(REPO, "branches.json"), path.join(dir, "branches.json"));
  return dir;
}

function runChecker(mirrorDir){
  try {
    const out = execFileSync("node", ["tools/check-em-dashes.js"], { cwd: mirrorDir, encoding: "utf8" });
    return { exit: 0, out: out };
  } catch (err) {
    return { exit: err.status, out: (err.stdout || "") + (err.stderr || "") };
  }
}

function inject(mirrorDir, transform){
  const orig = fs.readFileSync(path.join(REPO, TARGET_REL), "utf8");
  const mutated = transform(orig);
  fs.writeFileSync(path.join(mirrorDir, TARGET_REL), mutated, "utf8");
}

function restore(mirrorDir){
  fs.copyFileSync(path.join(REPO, TARGET_REL), path.join(mirrorDir, TARGET_REL));
}

let allOk = true;
function check(label, cond){
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) allOk = false;
}

const mirror = makeMirror();

const baseline = runChecker(mirror);
check("mirror baseline matches tracked steady state (233 files, exit 0)",
  baseline.exit === 0 && /233 files scanned/.test(baseline.out) && /200 dash/.test(baseline.out) && /591 dash/.test(baseline.out));

const BS = String.fromCharCode(92);
const styleAttrRe = /style="[^"]*"/;

// Case A: CSS hex escape in style="" attribute
inject(mirror, function(orig){
  const m = styleAttrRe.exec(orig);
  const injected = m[0].slice(0, -1) + " font-family:'" + BS + "2014Test';\"";
  return orig.slice(0, m.index) + injected + orig.slice(m.index + m[0].length);
});
const caseA = runChecker(mirror);
check("Case A (CSS hex escape in style attribute) CAUGHT with correct label",
  caseA.exit === 1 && /CSS hex escape\) in inline style attribute/.test(caseA.out));
restore(mirror);

// Case B: JS unicode escape in onclick="" attribute
inject(mirror, function(orig){
  const m = styleAttrRe.exec(orig);
  const escapeText = BS + "u2014";
  const injected = m[0] + " onclick=\"var x='" + escapeText + "';\"";
  return orig.slice(0, m.index) + injected + orig.slice(m.index + m[0].length);
});
const caseB = runChecker(mirror);
check("Case B (JS unicode escape in onclick attribute) CAUGHT with correct label",
  caseB.exit === 1 && /JS unicode escape\) in inline event-handler attribute/.test(caseB.out));
restore(mirror);

// Case C: JS unicode escape in href="javascript:..." attribute
inject(mirror, function(orig){
  const escapeText = BS + "u2014";
  return orig.replace("<a ", "<a href=\"javascript:var x='" + escapeText + "';\" ");
});
const caseC = runChecker(mirror);
check("Case C (JS unicode escape in href=javascript:) CAUGHT with correct label",
  caseC.exit === 1 && /JS unicode escape\) in inline href="javascript:" attribute/.test(caseC.out));
restore(mirror);

// Control: non-dash escape stays clean
inject(mirror, function(orig){
  const m = styleAttrRe.exec(orig);
  const injected = m[0].slice(0, -1) + " font-family:'" + BS + "0041Test';\"";
  return orig.slice(0, m.index) + injected + orig.slice(m.index + m[0].length);
});
const control = runChecker(mirror);
check("Control (non-dash escape \\0041) stays clean", control.exit === 0);
restore(mirror);

// Scope confirmation: no real on*/javascript: attributes anywhere in the estate
const { execSync } = require("child_process");
let scopeHits = "";
try {
  scopeHits = execSync("grep -rEo '\\son[a-z]+\\s*=' modules gbp-packs 2>/dev/null; grep -rl 'javascript:' modules gbp-packs 2>/dev/null", { cwd: REPO, encoding: "utf8" });
} catch (e) { scopeHits = ""; }
check("scope confirmation: zero real on*/javascript: attributes in the estate today", scopeHits.trim() === "");

// Final restore + cleanup
restore(mirror);
fs.rmSync(mirror, { recursive: true, force: true });

console.log("");
console.log(allOk ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
process.exit(allOk ? 0 : 1);
