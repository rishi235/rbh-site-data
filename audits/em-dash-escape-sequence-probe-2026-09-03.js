/*
  em-dash-escape-sequence-probe-2026-09-03.js

  Item 5.1, quality pass (eleventh). Tests whether tools/check-em-dashes.js's
  live module code rule (added item 5.1, eighth-pass-equivalent, 2026-08-11;
  most recently widened for numeric HTML entity padding on the tenth pass,
  2026-09-02) can see a dash written as a JAVASCRIPT unicode escape sequence
  inside a .js string literal, or a CSS hex escape inside a .css string,
  rather than as a literal character or an HTML entity.

  Both are real encodings a browser/JS engine decodes to the identical em or
  en dash character at run time:
    - JS: "\u2014" (fixed 4-digit form) and "\u{2014}" (ES6 code-point form,
      any digit count) inside a string or template literal
    - CSS: "\2014" (1-6 hex digits, CSS Syntax Level 3 escape, optionally
      followed by a trailing space that is consumed as part of the escape)
      inside a string value, e.g. a content: property

  The checker reads .js/.css files as raw text and tests each line with
  hasDash(), which matches the literal character, &mdash;/&ndash;, and
  padded/unpadded HTML numeric entities. None of those patterns match a JS or
  CSS source-level escape, because the backslash-u or backslash-hex sequence
  is plain ASCII text until something (the JS engine, or the CSS parser)
  decodes it - which is exactly the class of gap this file's own header has
  now recorded five times for other reasons (files, code-vs-data, sheet
  files, sheet lines, numeric entity padding).

  Refuses to run if either target file already carries an uncommitted diff.
  Records sha256 before any mutation, restores by direct write immediately
  after each checker run and BEFORE moving to the next case, and verifies the
  restoration by sha256 every time. Never layers one injection on another.

  Run against the UNFIXED checker: proves the gap (cases A-E expected clean,
  wrongly). Run again after the fix lands in tools/check-em-dashes.js: proves
  the fix (cases A-E expected caught) and that it does not overreach (the two
  CONTROL cases stay clean).
*/
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const jsFile = path.join(REPO, "modules", "service", "service.js");
const cssFile = path.join(REPO, "modules", "switch", "switch.css");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function gitDirty(relPath) {
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", relPath], { cwd: REPO }).toString();
    return out.trim().length > 0;
  } catch (e) {
    return true; // fail safe: if we cannot tell, treat as dirty and refuse
  }
}

[jsFile, cssFile].forEach(function (f) {
  const rel = path.relative(REPO, f);
  if (gitDirty(rel)) {
    console.error("REFUSING TO RUN: " + rel + " already has an uncommitted diff. Aborting probe with no changes made.");
    process.exit(2);
  }
});

const jsOriginal = fs.readFileSync(jsFile, "utf8");
const cssOriginal = fs.readFileSync(cssFile, "utf8");
const jsShaBefore = sha256(jsFile);
const cssShaBefore = sha256(cssFile);

function runChecker() {
  try {
    const out = execFileSync("node", ["tools/check-em-dashes.js"], { cwd: REPO }).toString();
    return { code: 0, out: out };
  } catch (e) {
    return {
      code: typeof e.status === "number" ? e.status : 1,
      out: (e.stdout ? e.stdout.toString() : "") + (e.stderr ? e.stderr.toString() : "")
    };
  }
}

function restore() {
  fs.writeFileSync(jsFile, jsOriginal, "utf8");
  fs.writeFileSync(cssFile, cssOriginal, "utf8");
  const okJs = sha256(jsFile) === jsShaBefore;
  const okCss = sha256(cssFile) === cssShaBefore;
  if (!okJs || !okCss) {
    console.error("RESTORE FAILED - sha256 mismatch after write-back. MANUAL INTERVENTION NEEDED.");
    console.error("service.js restored ok: " + okJs + " | switch.css restored ok: " + okCss);
    process.exit(3);
  }
}

const ANCHOR = "See how the free NHS service works. No GP appointment or referral needed.";
if (jsOriginal.indexOf(ANCHOR) === -1) {
  console.error("Anchor sentence not found in modules/service/service.js - file has drifted since this probe was written. Aborting.");
  process.exit(4);
}

const results = [];

function withJsInjection(label, replacement, expectClean) {
  const injected = jsOriginal.replace(ANCHOR, replacement);
  fs.writeFileSync(jsFile, injected, "utf8");
  const r = runChecker();
  results.push({
    case: label,
    exitCode: r.code,
    caught: r.code !== 0,
    expectClean: !!expectClean,
    outputTail: r.out.split("\n").slice(-8).join("\n")
  });
  restore();
}

function withCssInjection(label, appended, expectClean) {
  const injected = cssOriginal + appended;
  fs.writeFileSync(cssFile, injected, "utf8");
  const r = runChecker();
  results.push({
    case: label,
    exitCode: r.code,
    caught: r.code !== 0,
    expectClean: !!expectClean,
    outputTail: r.out.split("\n").slice(-8).join("\n")
  });
  restore();
}

// Case A: JS 4-digit \u2014 (em dash) in a real live-code sentence.
withJsInjection(
  "A: JS \\u2014 (4-digit em dash escape) in service.js's real video-card sentence",
  "See how the free NHS service works \\u2014 no GP appointment or referral needed.",
  false
);

// Case B: JS ES6 code-point form \u{2014}.
withJsInjection(
  "B: JS \\u{2014} (ES6 code-point em dash escape) in the same real sentence",
  "See how the free NHS service works \\u{2014} no GP appointment or referral needed.",
  false
);

// Case C: JS 4-digit \u2013 (en dash).
withJsInjection(
  "C: JS \\u2013 (4-digit en dash escape) in the same real sentence",
  "See how the free NHS service works \\u2013 no GP appointment or referral needed.",
  false
);

// Case D: CSS hex escape \2014 (em dash), unpadded, in a real live stylesheet.
withCssInjection(
  "D: CSS \\2014 (em dash hex escape) appended as a real declaration to switch.css",
  "\n.rbh-test-dash-probe::after{content:\"\\2014\"}\n",
  false
);

// Case E: CSS hex escape \002013 (en dash), padded with trailing space per CSS Syntax Level 3.
withCssInjection(
  "E: CSS \\002013(space) (en dash hex escape, padded + trailing space) appended to switch.css",
  "\n.rbh-test-dash-probe-2::after{content:\"\\002013 \"}\n",
  false
);

// CONTROL 1: \u0041 ('A') is not a dash and must stay clean after any fix.
withJsInjection(
  "CONTROL 1: JS \\u0041 ('A', not a dash) must NOT be flagged",
  "See how the free NHS service works \\u0041 no GP appointment or referral needed.",
  true
);

// CONTROL 2: the same escape sequence inside a whole-line // comment must stay
// in the comment-dash notes bucket, not FAIL - proves a fix does not overreach
// past this file's own comment-blanking rule.
{
  const anchor2 = "// 3) Explainer video as a distinct tile, placed UNDER \"How Pharmacy First works\"";
  if (jsOriginal.indexOf(anchor2) === -1) {
    results.push({ case: "CONTROL 2: SKIPPED - comment anchor not found (file drifted)", exitCode: null, caught: null, expectClean: true, outputTail: "" });
  } else {
    const injected = jsOriginal.replace(anchor2, anchor2 + " \\u2014 test, must stay a comment dash, not a failure");
    fs.writeFileSync(jsFile, injected, "utf8");
    const r = runChecker();
    results.push({
      case: "CONTROL 2: JS \\u2014 inside a whole-line // comment must stay clean (comment, not public)",
      exitCode: r.code,
      caught: r.code !== 0,
      expectClean: true,
      outputTail: r.out.split("\n").slice(-8).join("\n")
    });
    restore();
  }
}

console.log("Final restore check: service.js sha256 match = " + (sha256(jsFile) === jsShaBefore) + ", switch.css sha256 match = " + (sha256(cssFile) === cssShaBefore));
console.log("");
results.forEach(function (r) {
  const verdict = r.expectClean
    ? (r.caught === false ? "OK (stayed clean as expected)" : (r.caught === true ? "WRONG - flagged when it should stay clean" : "SKIPPED"))
    : (r.caught === true ? "CAUGHT" : "MISSED (gap)");
  console.log("---- " + r.case);
  console.log("  exit code: " + r.exitCode + " | verdict: " + verdict);
});

fs.writeFileSync(
  path.join(__dirname, "em-dash-escape-sequence-probe-2026-09-03-results.json"),
  JSON.stringify(results, null, 2)
);
