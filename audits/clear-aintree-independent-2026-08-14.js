/*
  audits/clear-aintree-independent-2026-08-14.js
  Item 3.13 quality pass, Clear Chemist (Aintree), 2026-08-14. Second machine
  pass; the first was 2026-08-13 and raised Q65.

  Independent by construction: its own file discovery, its own regexes and its
  own reading of branches.json. It imports NOTHING from tools/, so the
  generators are not being tested against themselves.

  It deliberately does NOT re-raise Q65 (the pages promise a walk-in service
  the branch record says does not exist) or Q20 (the inert data-wa on the
  travel page). Both are open and re-stating them would be noise.

  What is new here, and why. The repo's own rule is "when a checker passes,
  ask WHICH FILES it read". Applied to this branch the question is which
  checkers SKIP it, because Clear Chemist is the estate's exception on almost
  every axis: no openingHours, no pfLink, pfBooking false, no nhsReviewUrl,
  two widgets rather than five, and an address shared with head office. Two
  skips are explicit in the tooling:

    - tools/sweep-broken-links.js SKIP_HOSTS excludes www.clearchemist.co.uk
      outright, so no link on these three pages has ever been status-checked.
    - tools/check-nap.js skips the street sweep for this branch because it
      shares "Unit 20 Brookfield Trade Centre" with RB Healthcare Ltd Head
      Office, so that string is not foreign on either.

  Section D below measures what the first skip actually leaves exposed.

  Run:  node audits/clear-aintree-independent-2026-08-14.js
*/
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const REPO = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(REPO, "branches.json"), "utf8"));
const branches = data.branches;
const me = branches.find(b => b.id === "clearchemist_aintree");
const others = branches.filter(b => b.id !== "clearchemist_aintree" && b.id !== "rbh_head_office_aintree");

let checks = 0, fails = 0, notes = [];
const ok = () => { checks++; };
const bad = (page, rule, msg) => { checks++; fails++; console.log("  FAIL  [" + rule + "] " + page + " :: " + msg); };
const assert = (cond, page, rule, msg) => cond ? ok() : bad(page, rule, msg);

// ---- own file discovery -----------------------------------------------------
function walk(dir, out) {
  out = out || [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name === ".git" || d.name === "node_modules") continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (d.name.toLowerCase().endsWith(".html")) out.push(p);
  }
  return out;
}
const allHtml = walk(path.join(REPO, "modules"));
const pages = allHtml.filter(f => /clear-aintree\.html$/i.test(path.basename(f)));

console.log("Item 3.13 independent pass - Clear Chemist (Aintree), 2026-08-14");
console.log(allHtml.length + " html files under modules/, " + pages.length + " belong to this branch.\n");

const digits = s => (s || "").replace(/\D/g, "");
const myDigits = digits(me.phone);

for (const abs of pages) {
  const rel = abs.replace(REPO + path.sep, "").replace(/\\/g, "/");
  const raw = fs.readFileSync(abs, "utf8");
  // Visible copy = the file minus HTML comments. The build header comment
  // carries em dashes deliberately and no visitor sees it, which is why
  // check-em-dashes.js reports rather than fails them.
  const body = raw.replace(/<!--[\s\S]*?-->/g, "");
  const text = body.replace(/<script[\s\S]*?<\/script>/gi, " ")
                   .replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const header = (raw.match(/<!--[\s\S]*?-->/) || [""])[0];
  console.log("--- " + rel);

  // ---- A. structure ---------------------------------------------------------
  const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  assert(h1s.length === 1, rel, "H1COUNT", "expected exactly 1 H1, found " + h1s.length);
  const h1 = h1s[0] || "";
  assert(/Aintree/.test(h1), rel, "H1TOWN", 'H1 does not carry seoTown "Aintree": ' + h1);
  assert(/Clear Chemist/.test(h1), rel, "H1BRAND", "H1 does not carry the brand: " + h1);
  assert(!/Liverpool/.test(h1), rel, "H1LOCALITY", "H1 falls back to postal locality Liverpool (Build Pack 5.1)");
  assert(/aintree/.test(path.basename(rel)) && /clear/.test(path.basename(rel)), rel, "SLUG", "filename missing townSlug/brandSlug");

  // heading order: no skipped level
  const levels = [...body.matchAll(/<h([1-6])[^>]*>/gi)].map(m => +m[1]);
  let skipped = null, prev = 0;
  levels.forEach(l => { if (prev && l > prev + 1) skipped = prev + "->" + l; prev = l; });
  assert(!skipped, rel, "HORDER", "heading level skipped (" + skipped + ")");

  // paste header SEO strings
  const title = (header.match(/SEO title:\s*(.+)/i) || [])[1];
  const desc = (header.match(/SEO description:\s*(.+)/i) || [])[1];
  assert(!!title, rel, "SEOTITLE", "no SEO title in the paste header");
  assert(!!desc, rel, "SEODESC", "no SEO description in the paste header");
  if (title) {
    const t = title.trim();
    assert(t.length <= 65, rel, "TITLELEN", "SEO title is " + t.length + " chars (limit 65): " + t);
    assert(/Aintree/.test(t), rel, "TITLETOWN", "SEO title omits the seoTown: " + t);
  }
  if (desc) {
    const d = desc.trim();
    assert(d.length >= 80 && d.length <= 165, rel, "DESCLEN", "SEO description is " + d.length + " chars (want 80-165)");
  }

  // ---- B. facts vs branches.json -------------------------------------------
  assert(text.includes(me.phone), rel, "PHONEVIS", "display phone " + me.phone + " is not crawlable text");
  const tels = [...body.matchAll(/href="tel:([^"]+)"/gi)].map(m => digits(m[1]));
  assert(tels.length > 0, rel, "TELPRESENT", "no tel: link");
  tels.forEach(t => assert(t === myDigits, rel, "TELMATCH", "tel: link " + t + " != branches.json " + myDigits));
  assert(text.includes(me.postalCode), rel, "POSTCODE", "own postcode " + me.postalCode + " absent");
  assert(body.includes(me.googleReviewUrl), rel, "REVIEW", "googleReviewUrl does not match branches.json");
  assert(body.includes(me.website), rel, "WEBSITE", "website does not match branches.json");
  assert(new RegExp('data-branch="' + me.branchName + '"').test(body), rel, "DATABRANCH", "data-branch != branchName");

  // no other branch's identity anywhere on the page
  others.forEach(o => {
    if (o.phone) {
      assert(!text.includes(o.phone), rel, "FOREIGNPHONE", "carries " + o.branchName + " phone " + o.phone);
      assert(!body.includes("tel:" + digits(o.phone)), rel, "FOREIGNTEL", "carries " + o.branchName + " tel link");
    }
    if (o.postalCode) assert(!text.includes(o.postalCode), rel, "FOREIGNPOSTCODE", "carries " + o.branchName + " postcode " + o.postalCode);
    if (o.seoTown && o.seoTown !== me.seoTown) assert(!new RegExp("\\b" + o.seoTown + "\\b").test(text), rel, "FOREIGNTOWN", "names another branch's town " + o.seoTown);
    if (o.brandLabel && o.brandLabel !== me.brandLabel) assert(!text.includes(o.brandLabel), rel, "FOREIGNBRAND", "names another brand " + o.brandLabel);
  });

  // map embed carries this branch's address
  const map = (body.match(/https:\/\/www\.google\.com\/maps\?q=([^"&]+)/) || [])[1];
  if (map) {
    const q = decodeURIComponent(map);
    assert(q.includes(me.streetAddress) && q.includes(me.postalCode), rel, "MAPADDR", "map embed address != branches.json: " + q);
  }

  // ---- C. policy ------------------------------------------------------------
  assert(!/http:\/\//.test(body), rel, "SCHEME", "contains an http:// URL");
  assert(!/[—–]/.test(text), rel, "DASH", "em or en dash in visible copy");
  assert(!/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(text), rel, "EMOJI", "emoji in visible copy");
  assert(!/rishi@/i.test(body), rel, "PERSONALEMAIL", "personal rishi@ address present (Build Pack 5.6)");
  // Appointedd widget ids are 24-hex; none may be hard-coded into a page.
  const hard = [...body.matchAll(/\b[0-9a-f]{24}\b/gi)].map(m => m[0]);
  assert(hard.length === 0, rel, "WIDGETID", "hard-coded 24-hex widget id in page (Build Pack 5.3): " + hard.join(", "));

  // fragment targets resolve on the same page
  const ids = new Set([...body.matchAll(/\bid="([^"]+)"/gi)].map(m => m[1]));
  [...body.matchAll(/href="#([^"]+)"/gi)].map(m => m[1]).forEach(f =>
    assert(ids.has(f), rel, "FRAGMENT", 'href="#' + f + '" has no matching id on the page'));

  // ---- CDN pins resolve in git, and the pinned file exists at that ref ------
  // Two traps here, both hit on the first run of this script and both fixed
  // rather than believed. (1) execSync goes through cmd, which eats the "^"
  // in "^{commit}", so every ref appeared broken. execFile takes no shell.
  // (2) a pin may name a ref that exists on GitHub but only as a remote
  // tracking ref in this clone - "service-module-phase1" is exactly that -
  // and jsDelivr resolves against GitHub, not against this clone. So a bare
  // miss is retried as origin/<ref> before it is called a failure.
  const gitOk = args => {
    try { return cp.execFileSync("git", args, { cwd: REPO, stdio: "pipe" }).toString().trim(); }
    catch (e) { return null; }
  };
  [...body.matchAll(/cdn\.jsdelivr\.net\/gh\/rishi235\/rbh-site-data@([^/]+)\/([^"?]+)/gi)].forEach(m => {
    const ref = m[1], file = m[2];
    let use = gitOk(["rev-parse", "--verify", ref + "^{commit}"]) ? ref
            : (gitOk(["rev-parse", "--verify", "origin/" + ref + "^{commit}"]) ? "origin/" + ref : null);
    assert(!!use, rel, "PINREF", "pinned ref " + ref + " resolves neither locally nor as origin/" + ref);
    if (use) {
      assert(gitOk(["cat-file", "-e", use + ":" + file]) !== null, rel, "PINFILE",
        file + " does not exist at pinned ref " + ref + " (resolved as " + use + ")");
    }
  });
}

// ---- D. what the sweep skip actually leaves exposed -------------------------
console.log("\n--- D. coverage map: what skips this branch, and what it costs");
const sweep = fs.readFileSync(path.join(REPO, "tools", "sweep-broken-links.js"), "utf8");
const skipHosts = (sweep.match(/SKIP_HOSTS\s*=\s*\{([^}]*)\}/) || [])[1] || "";
console.log("  sweep-broken-links.js SKIP_HOSTS: " + skipHosts.trim());
const estateLinks = [];
pages.forEach(abs => {
  const body = fs.readFileSync(abs, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  [...body.matchAll(/href="(https?:\/\/[^"]+)"/gi)].forEach(m => {
    if (/clearchemist\.co\.uk|rbhealth\.co\.uk/i.test(m[1])) estateLinks.push(path.basename(abs) + " -> " + m[1]);
  });
});
console.log("  links on these 3 pages pointing at the skipped hosts: " + estateLinks.length);
estateLinks.forEach(l => console.log("    " + l));
const deep = estateLinks.filter(l => {
  const u = l.split(" -> ")[1].replace(/^https?:\/\/[^/]+/, "");
  return u && u !== "/" && u !== "";
});
console.log("  of which DEEP links (a path, so capable of 404ing): " + deep.length);
if (deep.length === 0) {
  console.log("  => the skip is currently harmless: every link to the skipped host is the site root,");
  console.log("     which cannot 404 while the site exists. Worth re-testing whenever a deep link is added.");
} else {
  deep.forEach(d => console.log("    UNVERIFIED DEEP LINK: " + d));
}

console.log("\n" + checks + " checks, " + fails + " failures.");
process.exit(fails ? 1 : 0);
