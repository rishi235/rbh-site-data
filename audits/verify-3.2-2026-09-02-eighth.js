const fs = require("fs");
const path = require("path");
const REPO = "C:/Dev/rbh-site-data";
const branches = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8")).branches;
const scorah = branches.filter(b => /scorah/i.test(b.brandSlug || ""));

const sheetFiles = [
  "modules/service/pages/SEO.md",
  "modules/service/pages/CONTRACEPTION-SEO.md",
  "modules/service/pages/TRAVEL-CLINIC-SEO.md",
  "modules/service/pages/WEIGHT-LOSS-SEO.md",
  "modules/switch/pages/SEO.md",
  "modules/branch/pages/SEO.md"
];

// Parse all sheets into permalink -> {title, description, keywords, sourceFile}
const sheetData = {};
sheetFiles.forEach(rel => {
  const p = path.join(REPO, rel);
  if (!fs.existsSync(p)) { console.log("(no such sheet: " + rel + ")"); return; }
  const txt = fs.readFileSync(p, "utf8");
  const blocks = txt.split(/^##\s+/m).slice(1);
  blocks.forEach(block => {
    const permMatch = /\*\*Page Permalink:\*\*\s*([^\r\n]+)/.exec(block);
    const titleMatch = /\*\*Page Title:\*\*\s*([^\r\n]+)/.exec(block);
    const descMatch = /\*\*Page Description:\*\*\s*([^\r\n]+)/.exec(block);
    const kwMatch = /\*\*Meta Keywords:\*\*\s*([^\r\n]+)/.exec(block);
    if (permMatch) {
      const perm = permMatch[1].trim();
      sheetData[perm] = {
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null,
        keywords: kwMatch ? kwMatch[1].trim() : null,
        sourceFile: rel
      };
    }
  });
});
console.log("Total permalink entries parsed from sheets: " + Object.keys(sheetData).length);

let checks = 0, fails = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { fails++; console.log("FAIL: " + msg); }
}

const pagesDir = path.join(REPO, "modules/service/pages");
const branchDir = path.join(REPO, "modules/branch/pages");
const switchDir = path.join(REPO, "modules/switch/pages");
const allFiles = [];
[pagesDir, branchDir, switchDir].forEach(d => {
  if (fs.existsSync(d)) fs.readdirSync(d).filter(f => f.endsWith(".html")).forEach(f => allFiles.push(path.join(d, f)));
});

scorah.forEach(b => {
  const key = b.brandSlug + "-" + b.townSlug;
  const files = allFiles.filter(f => path.basename(f).includes(key));
  console.log("--- " + key + " (seoTown=" + b.seoTown + ") : " + files.length + " files ---");
  files.forEach(f => {
    const base = path.basename(f);
    const permalink = base.replace(/\.html$/, "");
    const sheet = sheetData[permalink];
    check(!!sheet, base + ": no sheet entry found for permalink '" + permalink + "'");
    if (sheet) {
      check(sheet.title && sheet.title.toLowerCase().includes(b.seoTown.toLowerCase()), base + ": sheet title missing own seoTown (title=" + sheet.title + ")");
      check(sheet.title && sheet.title.length <= 65, base + ": sheet title exceeds 65 chars (" + (sheet.title||"").length + ": " + sheet.title + ")");
      check(sheet.description && sheet.description.toLowerCase().includes(b.seoTown.toLowerCase()), base + ": sheet description missing own seoTown");
      check(sheet.description && sheet.description.length >= 80 && sheet.description.length <= 165, base + ": sheet description length out of 80-165 band (" + (sheet.description||"").length + ")");
      // permalink itself carries town slug (Build Pack 1.4: title, URL, H1)
      check(permalink.includes(b.townSlug), base + ": PERMALINK does not include townSlug '" + b.townSlug + "'");
    }
    const txt = fs.readFileSync(f, "utf8");
    const h1s = txt.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
    check(h1s.length === 1, base + ": expected exactly 1 h1, found " + h1s.length);
    if (h1s.length >= 1) {
      const h1text = h1s[0].replace(/<[^>]+>/g, "").trim();
      check(h1text.toLowerCase().includes(b.seoTown.toLowerCase()), base + ": h1 missing own seoTown (h1=" + h1text + ")");
    }
    // cross-town check against sheet title+description+h1
    branches.forEach(other => {
      if (other.id === b.id || other.disposed) return;
      const otherTown = (other.seoTown || "").toLowerCase();
      if (!otherTown || otherTown === b.seoTown.toLowerCase()) return;
      const re = new RegExp("\\b" + otherTown.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      const excused = (b.serviceAreaList || []).some(s => s.toLowerCase() === otherTown);
      const hay = (sheet ? (sheet.title + " " + sheet.description) : "") + " " + h1s.map(x=>x.replace(/<[^>]+>/g,"")).join(" ");
      if (re.test(hay) && !excused) {
        console.log("FLAG (needs KNOWN/pin check): " + base + " mentions '" + other.seoTown + "' (branch " + other.id + "), not excused via serviceAreaList");
      }
    });
  });
});
console.log("\nTOTAL CHECKS: " + checks + "  FAILURES: " + fails);
