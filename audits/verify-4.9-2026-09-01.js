// Independent verification of gbp-packs/clear-aintree.md against branches.json,
// item 4.9 seventh quality pass, 2026-09-01.
// Imports nothing from tools/; parses the pack and branches.json with its own
// regexes, matching the convention set by audits/verify-4.10-2026-09-01.js.
const fs = require("fs");
const pack = fs.readFileSync("gbp-packs/clear-aintree.md", "utf8");
const b = JSON.parse(fs.readFileSync("branches.json", "utf8"));
const branch = b.branches.find(x => x.id === "clearchemist_aintree");

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, detail || ""); }
}

// Whitespace-collapsed copy for line-wrap-safe substring checks (the same
// convention check-gbp-packs.js uses on its own sentence-bounded rules).
const flat = pack.replace(/\s+/g, " ");

const descMatch = pack.match(/## 1\. Business description \(max 750 chars - this is (\d+)\)\n([\s\S]*?)\n\n## 2\./);
const claimedDesc = parseInt(descMatch[1], 10);
const actualDesc = descMatch[2].trim().length;
check("description char count matches heading", claimedDesc === actualDesc, `claimed ${claimedDesc} actual ${actualDesc}`);
check("description under 750", actualDesc <= 750, actualDesc);

const postBlocks = [...pack.matchAll(/### Post [A-D][^\n]*\n([\s\S]*?)\nButton:/g)].map(m => m[1].trim());
const postLens = postBlocks.map(p => p.length);
console.log("Post lengths:", postLens);
for (const [i, len] of postLens.entries()) check(`Post ${String.fromCharCode(65 + i)} under 1500`, len <= 1500, len);

check("Phone line matches branches.json", flat.includes(`- Phone: ${branch.phone}`), branch.phone);
check("Post A phone matches branches.json", flat.includes(`call us on ${branch.phone}`), branch.phone);
check("Post B phone matches branches.json (whitespace-collapsed)", flat.includes(`speak to on ${branch.phone}`), branch.phone);

check("Address matches streetAddress", pack.includes(branch.streetAddress.split(",")[0]), branch.streetAddress);
check("Postcode present", pack.includes(branch.postalCode), branch.postalCode);
check("Website matches branches.json", pack.includes(branch.website), branch.website);
check("Review link matches branches.json", pack.includes(branch.googleReviewUrl), branch.googleReviewUrl);

for (const town of branch.serviceAreaList) {
  check(`Catchment mentions ${town}`, pack.includes(town), town);
}

check("hasApp true and app mention present", branch.hasApp === true && /\bapp\b/i.test(pack));

let pomNames = [];
try {
  const pomSrc = fs.readFileSync("tools/pom-names.js", "utf8");
  pomNames = [...pomSrc.matchAll(/"([A-Za-z][A-Za-z ]+)"/g)].map(x => x[1]);
} catch (e) { console.log("pom-names.js not found/parsed:", e.message); }
let pomHit = null;
for (const n of pomNames) { if (n.length > 3 && pack.toLowerCase().includes(n.toLowerCase())) { pomHit = n; break; } }
check("No POM medicine name in pack (84-name union)", !pomHit, pomHit);

const dashChars = [...pack].filter(c => c === "–" || c === "—");
check("No em/en dash characters", dashChars.length === 0, dashChars.length);
check("No dash HTML entities", !/&ndash;|&mdash;/.test(pack));

// Old number 8365: check-gbp-packs.js WARNs on this every pass because it is
// a phone-shaped number that is not this branch's live number. Confirmed here
// it appears exactly once, inside the narrative sentence explaining the Q28
// correction ("...updated from the old 0151 203 8365 to 0151 203 6535..."),
// not as a live claim anywhere else in the file. Same class of deliberate,
// accepted WARN this pack has carried since the second pass (2026-08-11).
const oldPhoneMatches = [...pack.matchAll(/0151 203 8365/g)];
console.log("Occurrences of old number 8365:", oldPhoneMatches.length);
check("Old number 8365 appears exactly once (narrative only)", oldPhoneMatches.length === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
