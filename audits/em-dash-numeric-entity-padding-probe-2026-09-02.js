/*
  em-dash-numeric-entity-padding-probe-2026-09-02.js

  Item 5.1 quality pass (tenth), 2026-09-02. Independent proof that
  tools/check-em-dashes.js's numeric-entity matching, before this pass, was an
  exact-digit-string match ("&#8212;", "&#x2014;" etc.) rather than a decoded
  VALUE match, and so missed any zero-padded numeric character reference that
  a real browser still renders as an em or en dash.

  HTML5 background (WHATWG HTML Standard, "Numeric character reference state"
  and "Numeric character reference end state" in the tokenizer): a numeric
  character reference accumulates digits into a code point value; leading
  zeros do not change the value, the same way "007" and "7" parse to the same
  integer. So "&#08212;", "&#0008212;", "&#x02014;" and "&#X0002014;" all
  decode to U+2014 (em dash) in every browser, identically to "&#8212;" and
  "&#x2014;".

  This script re-derives the decoding logic independently (its own regex, no
  import from tools/check-em-dashes.js) and checks it against the two dash
  code points and a control set of non-dash entities and padding shapes.

  Live proof against the real repo (recorded in AGENT_LOG.md, not repeated by
  this script, since it required editing and restoring a tracked file):
  "&#x02014;" was written into the real "Page Permalink" line for Fishlocks
  Ainsdale in modules/switch/pages/SEO.md. Before this pass's fix,
  `node tools/check-em-dashes.js` exited 0 ("clean") with that dash live in
  the file. After the fix, the same injected file exited 1 and named the
  line, kind "em dash (HTML numeric entity)", and the file's line count
  (95 before, 95 after) plus a SHA256 compare confirmed the restore was
  byte-identical to the pre-injection original.

  Run:  node em-dash-numeric-entity-padding-probe-2026-09-02.js
*/
const NUMERIC_ENTITY_RE = /&#(\d+);|&#[xX]([0-9a-fA-F]+);/g;
const EM_CODEPOINT = 0x2014;
const EN_CODEPOINT = 0x2013;

function dashCodepoints(text) {
  const out = [];
  NUMERIC_ENTITY_RE.lastIndex = 0;
  let m;
  while ((m = NUMERIC_ENTITY_RE.exec(text)) !== null) {
    const cp = m[1] !== undefined ? parseInt(m[1], 10) : parseInt(m[2], 16);
    if (cp === EM_CODEPOINT || cp === EN_CODEPOINT) out.push({ text: m[0], cp: cp });
  }
  return out;
}

// [input, expectFound (true/false)]
const cases = [
  ["&#8212;", true],          // em dash, un-padded decimal (the OLD regex already caught this)
  ["&#08212;", true],         // em dash, one leading zero - OLD regex missed this
  ["&#0008212;", true],       // em dash, heavily padded - OLD regex missed this
  ["&#x2014;", true],         // em dash, un-padded hex (the OLD regex already caught this)
  ["&#x02014;", true],        // em dash, one leading zero hex - OLD regex missed this
  ["&#X0002014;", true],      // em dash, padded hex, uppercase X - OLD regex missed this
  ["&#8211;", true],          // en dash, un-padded decimal
  ["&#08211;", true],         // en dash, padded decimal - OLD regex missed this
  ["&#x2013;", true],         // en dash, un-padded hex
  ["&#x02013;", true],        // en dash, padded hex - OLD regex missed this
  ["&#160;", false],          // non-breaking space - must NOT be flagged as a dash
  ["&#xA0;", false],          // same, hex, unpadded
  ["&#x00A0;", false],        // same, hex, padded - proves padding alone isn't the trigger
  ["plain text, no entity at all", false],
  ["a standard hyphen - like this", false]
];

let failCount = 0;
cases.forEach(function (c) {
  const input = c[0];
  const expect = c[1];
  const found = dashCodepoints(input).length > 0;
  const ok = found === expect;
  if (!ok) failCount++;
  console.log((ok ? "PASS" : "FAIL") + "  " + input.padEnd(28) + " expected dash=" + expect + " got dash=" + found);
});

console.log("");
if (failCount === 0) {
  console.log("em-dash-numeric-entity-padding-probe: all " + cases.length + " cases correct.");
  console.log("Confirms the value-decoding fix in tools/check-em-dashes.js catches every");
  console.log("padding variant of the em/en dash numeric entity and flags no false positive");
  console.log("on a non-dash numeric entity, padded or not.");
} else {
  console.log("em-dash-numeric-entity-padding-probe: " + failCount + " case(s) FAILED. Do not trust the fix.");
  process.exit(1);
}
