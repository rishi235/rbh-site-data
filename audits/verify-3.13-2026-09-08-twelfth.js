"use strict";
// Independent extraction, item 3.13 quality pass: prove check-branch-links.js's
// applicable rules against Clear Chemist Aintree's own branches.json fields,
// written fresh with no import from tools/.
var fs = require("fs");
var b = JSON.parse(fs.readFileSync("branches.json", "utf8"));
var clear = b.branches.find(function (x) { return x.id === "clearchemist_aintree"; });
if (!clear) { console.log("FAIL: clearchemist_aintree not found"); process.exit(1); }

var checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  if (!cond) { fails++; console.log("FLAG " + name + ": " + detail); }
}

// odsCode present and looks like an ODS code (5 chars, alnum)
check("odsCode present", !!clear.odsCode, "no odsCode");
check("odsCode shape", /^[A-Z0-9]{5}$/.test(clear.odsCode || ""), "odsCode=" + clear.odsCode);

// odsCode uniqueness across estate
var odsCounts = {};
b.branches.forEach(function (x) { if (!x.disposed && x.odsCode) odsCounts[x.odsCode] = (odsCounts[x.odsCode] || 0) + 1; });
check("odsCode unique", odsCounts[clear.odsCode] === 1, "count=" + odsCounts[clear.odsCode]);

// nhsEmail = pharmacy.<odsCode>@nhs.net
var wantEmail = "pharmacy." + clear.odsCode + "@nhs.net";
check("nhsEmail matches odsCode", clear.nhsEmail === wantEmail, "got " + clear.nhsEmail + " want " + wantEmail);

// nhsReviewUrl: Clear Aintree deliberately has none (documented exception)
check("nhsReviewUrl absent (deliberate)", !clear.nhsReviewUrl, "unexpectedly present: " + clear.nhsReviewUrl);

// googleReviewUrl shape
check("googleReviewUrl shape", /^https:\/\/g\.page\/r\/[A-Za-z0-9_-]+\/review$/.test(clear.googleReviewUrl || ""), "got " + clear.googleReviewUrl);

// googleReviewUrl uniqueness across estate
var googleCounts = {};
b.branches.forEach(function (x) { if (!x.disposed && x.googleReviewUrl) googleCounts[x.googleReviewUrl] = (googleCounts[x.googleReviewUrl] || 0) + 1; });
check("googleReviewUrl unique", googleCounts[clear.googleReviewUrl] === 1, "count=" + googleCounts[clear.googleReviewUrl]);

// website shape: https, bare host, no trailing slash, no path
check("website shape", /^https:\/\/[a-z0-9.-]+$/.test(clear.website || ""), "got " + clear.website);

// pfLink: Clear Aintree has none (private/paid brand, no NHS Pharmacy First page)
check("pfLink absent (private brand, no NHS PF page)", !clear.pfLink, "unexpectedly present: " + clear.pfLink);

console.log(checks + " checks, " + fails + " flag(s)");
process.exit(fails ? 1 : 0);
