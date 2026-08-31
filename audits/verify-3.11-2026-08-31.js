const fs = require("fs");
const path = require("path");
const branches = JSON.parse(fs.readFileSync("branches.json","utf8")).branches;
const b = branches.find(x => x.id === "gordonshorts_crosby");
const files = [
  "modules/service/pages/contraception-gordon-short-crosby.html",
  "modules/service/pages/earache-treatment-gordon-short-crosby.html",
  "modules/service/pages/impetigo-treatment-gordon-short-crosby.html",
  "modules/service/pages/insect-bite-treatment-gordon-short-crosby.html",
  "modules/service/pages/pharmacy-first-gordon-short-crosby.html",
  "modules/service/pages/shingles-treatment-gordon-short-crosby.html",
  "modules/service/pages/sinusitis-treatment-gordon-short-crosby.html",
  "modules/service/pages/sore-throat-treatment-gordon-short-crosby.html",
  "modules/service/pages/travel-clinic-gordon-short-crosby.html",
  "modules/service/pages/uti-treatment-gordon-short-crosby.html",
  "modules/service/pages/weight-loss-clinic-gordon-short-crosby.html",
  "modules/switch/pages/switch-prescriptions-gordon-short-crosby.html"
];
// gather all other branches' distinguishing strings to check for cross-contamination
const others = branches.filter(x => x.id !== b.id);
let checks = 0, fails = [];
function fail(f, msg){ fails.push(f+": "+msg); }
for (const rel of files) {
  const p = path.join(".", rel);
  if (!fs.existsSync(p)) { fail(rel, "MISSING FILE"); continue; }
  const raw = fs.readFileSync(p, "utf8");
  const noComments = raw.replace(/<!--[\s\S]*?-->/g, "");
  checks++;
  // 1. own phone visible (spaced) and tel: link (unspaced)
  const spacedPhone = b.phone;
  const unspacedPhone = b.phone.replace(/\s+/g,"");
  checks++; if (!raw.includes(spacedPhone)) fail(rel, "missing spaced phone "+spacedPhone);
  checks++; if (!raw.includes('tel:'+unspacedPhone) && !raw.includes('tel:+44'+unspacedPhone.slice(1))) fail(rel, "missing correct tel: link");
  // 2. own postcode present
  checks++; if (!raw.includes(b.postalCode)) fail(rel, "missing own postcode "+b.postalCode);
  // 3. own street address present
  checks++; if (!raw.includes(b.streetAddress)) fail(rel, "missing street address");
  // 4. own review url
  checks++; if (!raw.includes(b.googleReviewUrl)) fail(rel, "missing own googleReviewUrl");
  // 5. H1 carries seoTown
  const h1m = raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  checks++;
  if (!h1m) fail(rel, "no H1 found");
  else if (!h1m[1].includes(b.seoTown)) fail(rel, "H1 missing seoTown '"+b.seoTown+"': "+h1m[1].slice(0,120));
  // 6. brand spelling - correct form only, no "Gordon Shorts"
  checks++; if (/Gordon Shorts/i.test(noComments)) fail(rel, "misspelled 'Gordon Shorts' found in visible copy");
  // 7. no other branch's phone/postcode/review url/brand name
  for (const o of others) {
    if (o.phone && raw.includes(o.phone)) fail(rel, "contains OTHER branch phone ("+o.branchName+") "+o.phone);
    if (o.postalCode && o.postalCode !== b.postalCode && raw.includes(o.postalCode)) fail(rel, "contains OTHER branch postcode ("+o.branchName+") "+o.postalCode);
    if (o.googleReviewUrl && raw.includes(o.googleReviewUrl)) fail(rel, "contains OTHER branch googleReviewUrl ("+o.branchName+")");
  }
  checks += others.length*3;
  // 8. JSON-LD present and parses, name matches
  const ldm = raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  checks++;
  if (!ldm) fail(rel, "no JSON-LD block");
  else {
    try {
      const ld = JSON.parse(ldm[1]);
      checks++;
      if (ld.name !== b.branchName && ld.name !== b.brandLabel) fail(rel, "JSON-LD name mismatch: "+ld.name);
      checks++;
      if (!ld.address || ld.address.streetAddress !== b.streetAddress || ld.address.postalCode !== b.postalCode || ld.address.addressRegion !== b.addressRegion) fail(rel, "JSON-LD address mismatch");
      checks++;
      if (ld.telephone !== b.phone) fail(rel, "JSON-LD telephone mismatch: "+ld.telephone);
    } catch(e) { fail(rel, "JSON-LD parse error: "+e.message); }
  }
  // 9. non-ASCII check outside comments, allow GBP sign on weight loss page
  const nonAsciiMatches = noComments.match(/[^\x00-\x7F]/g) || [];
  const allowedPound = rel.includes("weight-loss-clinic");
  const badNonAscii = nonAsciiMatches.filter(c => !(allowedPound && c === "\u00a3"));
  checks++;
  if (badNonAscii.length > 0) fail(rel, "unexpected non-ASCII chars: "+JSON.stringify([...new Set(badNonAscii)]));
  // 10. no em dash anywhere outside comments
  checks++;
  if (noComments.includes("\u2014") || noComments.includes("\u2013")) fail(rel, "em/en dash found in visible copy");
}
console.log("Files checked:", files.length, "Total checks:", checks, "Failures:", fails.length);
if (fails.length) { console.log(fails.join("\n")); process.exitCode = 1; }
