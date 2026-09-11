/*
  em-dash-code-attribute-probe-2026-09-11.js

  Item 5.1 quality pass (eighteenth), 2026-09-11. Self-contained, independently
  re-runnable proof that tools/check-em-dashes.js's checkCodeFile() now catches
  a CSS hex escape ("\2014"/"\2013") sitting inside a style="" / on<event>="" /
  href="javascript:..." attribute VALUE embedded as a plain string constant in
  a .js module (service.js, emar.js and switch.js all build HTML fragments this
  way and hand them to innerHTML at run time), which the fourteenth, fifteenth
  and sixteenth passes' equivalent fix (checkEmbeddedBlocks/checkEmbeddedAttributes)
  had only ever been wired into checkHtmlFile and checkBannerFile, never
  checkCodeFile.

  Runs entirely against a throwaway temp mirror (no .git). The tracked repo's
  own copy of modules/service/service.js and tools/check-em-dashes.js is never
  opened for writing by this script - confirmed by sha256 before and after.

  Usage: node audits/em-dash-code-attribute-probe-2026-09-11.js
  Exits 0 and prints "ALL CHECKS PASSED" only if every assertion below holds.
*/

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const TARGET_REL = path.join("modules", "service", "service.js");
const TARGET_ABS = path.join(REPO, TARGET_REL);
const CHECKER_ABS = path.join(REPO, "tools", "check-em-dashes.js");

function sha256(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function runChecker(mirror) {
  try {
    execFileSync(process.execPath, [path.join(mirror, "tools", "check-em-dashes.js")], {
      cwd: mirror,
      stdio: "pipe"
    });
    return { code: 0, out: "" };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "").toString() + (e.stderr || "").toString() };
  }
}

const trackedBefore = sha256(TARGET_ABS);
const checkerBeforeTracked = sha256(CHECKER_ABS);

const mirror = fs.mkdtempSync(path.join(os.tmpdir(), "emdash18-probe-"));
["tools", "modules", "core"].forEach(function (d) {
  copyDir(path.join(REPO, d), path.join(mirror, d));
});
fs.mkdirSync(path.join(mirror, "gbp-packs"), { recursive: true });
if (fs.existsSync(path.join(REPO, "gbp-packs"))) copyDir(path.join(REPO, "gbp-packs"), path.join(mirror, "gbp-packs"));
fs.copyFileSync(path.join(REPO, "branches.json"), path.join(mirror, "branches.json"));

let pass = true;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) pass = false;
}

// Baseline: unmodified mirror must be clean, matching the tracked repo's own steady state.
let r = runChecker(mirror);
check("baseline mirror clean before any injection", r.code === 0);

const mirrorTarget = path.join(mirror, TARGET_REL);
let src = fs.readFileSync(mirrorTarget, "utf8");
const anchor = "style='background:#009639;color:#fff;text-align:center;font-weight:600;";
check("injection anchor exists in service.js", src.indexOf(anchor) !== -1);

// Case 1: CSS hex escape for em dash inside a style attribute value - must be CAUGHT.
const injected = src.replace(anchor, anchor + "--em:\\2014;");
fs.writeFileSync(mirrorTarget, injected, "utf8");
r = runChecker(mirror);
check("CSS hex escape (em) in style attribute inside .js file is CAUGHT", r.code !== 0);
check("failure names the correct file and 'CSS hex escape' label", /service\.js/.test(r.out) && /CSS hex escape.*inline style attribute/.test(r.out));

// Case 2: en dash form, same shape - must be CAUGHT.
const injectedEn = src.replace(anchor, anchor + "--en:\\2013;");
fs.writeFileSync(mirrorTarget, injectedEn, "utf8");
r = runChecker(mirror);
check("CSS hex escape (en) in style attribute inside .js file is CAUGHT", r.code !== 0);

// Control: a non-dash escape in the same position must stay CLEAN (no false positive).
const control = src.replace(anchor, anchor + "--letter:\\0041;");
fs.writeFileSync(mirrorTarget, control, "utf8");
r = runChecker(mirror);
check("non-dash escape (letter A) in the same position stays CLEAN", r.code === 0);

// Restore mirror target, re-confirm clean.
fs.writeFileSync(mirrorTarget, src, "utf8");
r = runChecker(mirror);
check("mirror clean again after restore", r.code === 0);

// Tracked repo must never have been touched by this script.
check("tracked service.js unchanged (sha256)", sha256(TARGET_ABS) === trackedBefore);
check("tracked check-em-dashes.js unchanged (sha256)", sha256(CHECKER_ABS) === checkerBeforeTracked);

fs.rmSync(mirror, { recursive: true, force: true });

console.log("");
console.log(pass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
process.exit(pass ? 0 : 1);
