// One-shot patch: add RULE 3 (whole-page POM name scan) to
// tools/check-service-links.js. Run once, then delete or keep as the record
// of the exact edit. Exits 1 if any anchor is missing or already patched.
'use strict';
const fs = require('fs');
const F = 'C:\\Dev\\rbh-site-data\\tools\\check-service-links.js';
let s = fs.readFileSync(F, 'utf8');
if (s.includes('RULE 3')) { console.error('already patched'); process.exit(1); }
let edits = 0;
const EOL = s.includes(String.fromCharCode(13,10)) ? String.fromCharCode(13,10) : String.fromCharCode(10);
function rep(anchor, replacement) {
  anchor = anchor.split(String.fromCharCode(10)).join(EOL);
  replacement = replacement.split(String.fromCharCode(10)).join(EOL);
  if (!s.includes(anchor)) { console.error('ANCHOR MISSING: ' + anchor.slice(0, 60)); process.exit(1); }
  s = s.replace(anchor, replacement);
  edits++;
}

// 1. Header: document the new rule.
rep('    - RULE 2, claim: efficacy or results-claim wording in visible page copy.',
    '    - RULE 2, claim: efficacy or results-claim wording in visible page copy.\n' +
    '    - RULE 3, medicine: a POM name from tools/pom-names.js in visible page\n' +
    '      copy, whole page, every generated page. Added by the item 3.9 quality\n' +
    '      pass, 2026-08-30, after an injected "Mounjaro" in the body of a\n' +
    '      Pharmacy First condition page passed all 36 checkers: the four\n' +
    '      copy checkers each read their own page family and\n' +
    '      check-pharmacy-first-symptoms rule 8 reads the symptoms block only,\n' +
    '      so general visible copy on the service pages was read by no medicine\n' +
    '      rule at all. The full five-group union appears on 0 of the 182\n' +
    '      generated pages, measured before the rule was added, so this is\n' +
    '      enforcement of the position every generator already declares, not\n' +
    '      new policy. If a page family\'s position is ever relaxed (the\n' +
    '      inner-page exemption in compliance/WEIGHT_LOSS_LIVE_PAGE_ASSESSMENT.md),\n' +
    '      record the page and name in KNOWN_POM with the question id rather\n' +
    '      than deleting the name from pom-names.js.');

// 2. Declarations after CLAIM_PATTERNS.
rep('const CLAIM_PATTERNS = require("./claim-patterns.js").CLAIM_PATTERNS;',
    'const CLAIM_PATTERNS = require("./claim-patterns.js").CLAIM_PATTERNS;\n' +
    '\n' +
    '// RULE 3 names: one list, defined once in tools/pom-names.js. The run stops\n' +
    '// outright on an empty union so a silently empty list can never present\n' +
    '// itself as a clean estate (the run-151 lesson).\n' +
    'const pom = require("./pom-names.js");\n' +
    'const POM_NAMES = pom.union(pom.WEIGHT_LOSS, pom.PHARMACY_FIRST,\n' +
    '  pom.CONTRACEPTION, pom.TRAVEL_VACCINES, pom.ANTIMALARIALS);\n' +
    'if (!POM_NAMES.length) {\n' +
    '  console.log("check-service-links");\n' +
    '  console.log("  FAIL empty POM name union from tools/pom-names.js");\n' +
    '  process.exit(1);\n' +
    '}\n' +
    '\n' +
    '// Accepted medicine mentions, "<relative file path>::<name>" -> reason with\n' +
    '// a question id. Empty today: no generated page names any medicine.\n' +
    'const KNOWN_POM = {};');

// 3. Tracker beside knownClaimHits.
rep('const knownClaimHits = {};',
    'const knownClaimHits = {};\nconst knownPomHits = {};');

// 4. RULE 3 body after the RULE 2 forEach.
rep('        text: "line " + (i + 1) + " (" + pair[1] + "): " + line.trim().slice(0, 160)\n' +
    '      });\n' +
    '    });',
    '        text: "line " + (i + 1) + " (" + pair[1] + "): " + line.trim().slice(0, 160)\n' +
    '      });\n' +
    '    });\n' +
    '\n' +
    '    // RULE 3 - POM medicine name in visible copy, whole page\n' +
    '    visible.split(/\\r?\\n/).forEach(function (line, i) {\n' +
    '      const hit = pom.findMedicine(line, POM_NAMES);\n' +
    '      if (!hit) return;\n' +
    '      const pomKey = rel(file) + "::" + hit;\n' +
    '      if (KNOWN_POM[pomKey]) { knownPomHits[pomKey] = (knownPomHits[pomKey] || 0) + 1; return; }\n' +
    '      failures.push({\n' +
    '        file: rel(file),\n' +
    '        rule: "medicine",\n' +
    '        text: "line " + (i + 1) + ": names \\"" + hit + "\\" in visible copy"\n' +
    '      });\n' +
    '    });');

// 5. Stale-KNOWN sweep covers KNOWN_POM too.
rep('  .concat(Object.keys(KNOWN_CLAIM).filter(function (k) { return !knownClaimHits[k]; }));',
    '  .concat(Object.keys(KNOWN_CLAIM).filter(function (k) { return !knownClaimHits[k]; }))\n' +
    '  .concat(Object.keys(KNOWN_POM).filter(function (k) { return !knownPomHits[k]; }));');

// 6. Report KNOWN POM hits beside KNOWN CLAIM hits.
rep('Object.keys(knownClaimHits).forEach(function (k) {\n' +
    '  console.log("  KNOWN CLAIM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_CLAIM[k]);\n' +
    '});',
    'Object.keys(knownClaimHits).forEach(function (k) {\n' +
    '  console.log("  KNOWN CLAIM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_CLAIM[k]);\n' +
    '});\n' +
    'Object.keys(knownPomHits).forEach(function (k) {\n' +
    '  console.log("  KNOWN POM " + k.split("::")[1] + " in " + k.split("::")[0] + ": " + KNOWN_POM[k]);\n' +
    '});');

// 7. Count the known-POM entries in the clean line.
rep('  + (Object.keys(knownHits).length + Object.keys(knownClaimHits).length)',
    '  + (Object.keys(knownHits).length + Object.keys(knownClaimHits).length + Object.keys(knownPomHits).length)');

fs.writeFileSync(F, s);
console.log('patched, ' + edits + ' edits');
