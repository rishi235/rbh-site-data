// Twentieth quality pass on item 3.11 (Gordon Short Chemist Crosby).
// Proves tools/check-seo-pattern.js by direct injection against this
// branch's own pages for the first time in 19 prior passes.
// Runs entirely against a git-archive scratch export, never opens the
// tracked repo for writing. Adjust ROOT below to point at the scratch
// export before re-running.
"use strict";
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var crypto = require("crypto");

var ROOT = process.argv[2] || "/tmp/scratch311b";
var CHECKER = path.join(ROOT, "tools", "check-seo-pattern.js");

function sha(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function run() {
  var r = cp.spawnSync(process.execPath, [CHECKER], { cwd: ROOT, encoding: "utf8" });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function tail(str, n) {
  var lines = str.split("\n");
  return lines.slice(Math.max(0, lines.length - n)).join("\n");
}

var targets = {
  pf: path.join(ROOT, "modules", "service", "pages", "pharmacy-first-gordon-short-crosby.html"),
  uti: path.join(ROOT, "modules", "service", "pages", "uti-treatment-gordon-short-crosby.html"),
  sw: path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-gordon-short-crosby.html"),
  sore: path.join(ROOT, "modules", "service", "pages", "sore-throat-treatment-gordon-short-crosby.html"),
  contra: path.join(ROOT, "modules", "service", "pages", "contraception-gordon-short-crosby.html"),
  shingles: path.join(ROOT, "modules", "service", "pages", "shingles-treatment-gordon-short-crosby.html")
};

var backups = {};
Object.keys(targets).forEach(function (k) { backups[k] = fs.readFileSync(targets[k], "utf8"); });
var baselineSha = {};
Object.keys(targets).forEach(function (k) { baselineSha[k] = sha(targets[k]); });

console.log("=== BASELINE ===");
var base = run();
console.log("exit " + base.code);
console.log(tail(base.out, 6));
console.log("");

function restore(k) {
  fs.writeFileSync(targets[k], backups[k], "utf8");
  var now = sha(targets[k]);
  if (now !== baselineSha[k]) throw new Error("RESTORE FAILED for " + k + ": sha mismatch");
  console.log("  restored " + k + ", sha256 confirmed identical to baseline");
}

function injection(name, key, mutate, expectFailSubstr) {
  console.log("=== INJECTION: " + name + " ===");
  var html = backups[key];
  var mutated = mutate(html);
  if (mutated === html) throw new Error("mutate() for " + name + " made no change - injection point not found");
  fs.writeFileSync(targets[key], mutated, "utf8");
  var r = run();
  console.log("exit " + r.code + " (expected non-zero)");
  var hit = r.out.indexOf(expectFailSubstr) !== -1;
  console.log("looked for: " + JSON.stringify(expectFailSubstr) + " -> " + (hit ? "FOUND" : "NOT FOUND"));
  if (!hit) console.log(tail(r.out, 30));
  restore(key);
  console.log("");
  return r.code !== 0 && hit;
}

var results = [];

results.push(["title-exact-match", injection(
  "title exact-match mismatch (Pharmacy First page)",
  "pf",
  function (html) {
    return html.replace(
      /(Weebly page SEO title:\s*)(.+)/,
      function (m, p1, p2) { return p1 + p2.replace("Crosby", "Nowhereville"); }
    );
  },
  "title '"
)]);

results.push(["h1-exact-match", injection(
  "h1 exact-match mismatch (UTI page)",
  "uti",
  function (html) {
    return html.replace(/<h1>([\s\S]*?)<\/h1>/, function (m, inner) {
      return "<h1>" + inner.replace("Crosby", "Nowhereville") + "</h1>";
    });
  },
  "h1 '"
)]);

results.push(["one-h1", injection(
  "second h1 element added (switch page)",
  "sw",
  function (html) {
    return html.replace(/<h1>/, "<h1>Pharmacy in Ainsdale</h1><h1>");
  },
  "h1 elements, expected exactly 1"
)]);

results.push(["one-title-line", injection(
  "duplicate 'Weebly page SEO title' line (Sore throat page)",
  "sore",
  function (html) {
    return html.replace(
      /(Weebly page SEO title:\s*.+\r?\n)/,
      function (m) { return m + "  Weebly page SEO title: Pharmacy in Ainsdale - Fishlocks Chemist\r\n"; }
    );
  },
  "'Weebly page SEO title' lines, expected exactly 1"
)]);

results.push(["one-desc-line", injection(
  "duplicate 'Weebly page SEO description' line (Contraception page)",
  "contra",
  function (html) {
    return html.replace(
      /(Weebly page SEO description:\s*.+\r?\n)/,
      function (m) { return m + "  Weebly page SEO description: Serving Ainsdale with contraception advice.\r\n"; }
    );
  },
  "'Weebly page SEO description' lines, expected exactly 1"
)]);

results.push(["cross-town-absence", injection(
  "another branch's seoTown 'Ainsdale' inserted into the SEO description (Shingles page)",
  "shingles",
  function (html) {
    return html.replace(
      /(Weebly page SEO description:\s*)(.+)/,
      function (m, p1, p2) { return p1 + p2.trim() + " We also welcome patients from Ainsdale."; }
    );
  },
  "names 'Ainsdale'"
)]);

console.log("=== CONTROL: unrelated FAQ reword (Insect bite page) ===");
var controlTarget = path.join(ROOT, "modules", "service", "pages", "insect-bite-treatment-gordon-short-crosby.html");
var controlBackup = fs.readFileSync(controlTarget, "utf8");
var controlSha = sha(controlTarget);
var controlMutated = controlBackup.replace(/pharmacist/i, "pharmacy team");
if (controlMutated === controlBackup) {
  console.log("  control mutate() found nothing to change - skipped, not counted as pass or fail");
} else {
  fs.writeFileSync(controlTarget, controlMutated, "utf8");
  var cr = run();
  console.log("exit " + cr.code + " (expected 0 - unrelated to any rule this checker reads)");
  fs.writeFileSync(controlTarget, controlBackup, "utf8");
  if (sha(controlTarget) !== controlSha) throw new Error("control restore failed");
  console.log("  restored control page, sha256 confirmed identical to baseline");
  results.push(["control-no-cross-fire", cr.code === 0]);
}
console.log("");

console.log("=== FINAL RESTORE VERIFICATION ===");
Object.keys(targets).forEach(function (k) {
  var now = sha(targets[k]);
  console.log("  " + k + ": " + (now === baselineSha[k] ? "OK identical to baseline" : "MISMATCH!!"));
  if (now !== baselineSha[k]) throw new Error("final verification failed for " + k);
});

console.log("=== POST-RESTORE FULL RE-RUN ===");
var post = run();
console.log("exit " + post.code + " (expected 0)");
console.log(tail(post.out, 4));

console.log("\n=== SUMMARY ===");
var allGood = true;
results.forEach(function (r) {
  console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
  if (!r[1]) allGood = false;
});
console.log(allGood ? "\nALL INJECTIONS BEHAVED AS EXPECTED" : "\nSOME INJECTIONS DID NOT BEHAVE AS EXPECTED");
process.exit(allGood ? 0 : 1);
