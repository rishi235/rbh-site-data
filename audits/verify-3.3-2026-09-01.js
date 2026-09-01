// Independent seventh-pass extraction for item 3.3 (Fishlocks Chemist, Ainsdale
// and Eccleston). Written fresh for this run, own regexes throughout, imports
// nothing from tools/. Reads the 26 Fishlocks pages (11 service pages per
// branch + 1 switch page per branch + 1 branch landing page per branch) plus
// the six paste sheets, and checks the same facts the sixth pass (2026-08-31)
// checked, so a regression since then would be caught even though the repo
// checkers already passed clean.
const fs = require('fs');
const path = require('path');

const branches = JSON.parse(fs.readFileSync('branches.json', 'utf8')).branches;
const ain = branches.find(b => b.id === 'fishlocks_ainsdale');
const ecc = branches.find(b => b.id === 'fishlocks_eccleston');
if (!ain || !ecc) { console.error('FAIL: branch records not found'); process.exit(1); }

let checks = 0, failures = 0;
function check(label, cond) {
  checks++;
  if (!cond) { failures++; console.log('FAIL: ' + label); }
}

const serviceDir = 'modules/service/pages';
const switchDir = 'modules/switch/pages';
const branchDir = 'modules/branch/pages';

const serviceSlugs = ['contraception', 'earache-treatment', 'impetigo-treatment',
  'insect-bite-treatment', 'pharmacy-first', 'shingles-treatment', 'sinusitis-treatment',
  'sore-throat-treatment', 'travel-clinic', 'uti-treatment', 'weight-loss-clinic'];

function pagesFor(b, slug) {
  return path.join(serviceDir, `${slug}-${b.brandSlug}-${b.townSlug}.html`);
}

const allPages = [];
for (const b of [ain, ecc]) {
  for (const slug of serviceSlugs) allPages.push({ b, other: b === ain ? ecc : ain, file: pagesFor(b, slug), family: 'service' });
  allPages.push({ b, other: b === ain ? ecc : ain, file: path.join(switchDir, `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`), family: 'switch' });
  allPages.push({ b, other: b === ain ? ecc : ain, file: path.join(branchDir, `pharmacy-${b.brandSlug}-${b.townSlug}.html`), family: 'branch' });
}
check('26 pages expected', allPages.length === 26);

function stripComments(html) { return html.replace(/<!--[\s\S]*?-->/g, ''); }
function wordBoundary(str, word) {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${esc}\\b`, 'i').test(str);
}

for (const { b, other, file, family } of allPages) {
  if (!fs.existsSync(file)) { failures++; console.log(`FAIL: missing page ${file}`); checks++; continue; }
  const raw = fs.readFileSync(file, 'utf8');
  const visible = stripComments(raw);

  // exactly one H1
  const h1s = [...visible.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  check(`${file}: exactly one H1`, h1s.length === 1);
  const h1text = h1s.length ? h1s[0][1].replace(/<[^>]+>/g, '').trim() : '';

  // own town present in H1
  if (h1s.length) check(`${file}: H1 carries own seoTown (${b.seoTown})`, wordBoundary(h1text, b.seoTown));

  // sister town absent from H1 unless excused via own serviceAreaList
  if (h1s.length) {
    const namesSister = wordBoundary(h1text, other.seoTown);
    const excused = b.serviceAreaList.some(t => t.toLowerCase() === other.seoTown.toLowerCase());
    check(`${file}: H1 does not name sister town (${other.seoTown}) unless excused`, !namesSister || excused);
  }

  // own phone present, sister phone absent
  check(`${file}: own phone (${b.phone}) present`, visible.includes(b.phone));
  check(`${file}: sister phone (${other.phone}) absent`, !visible.includes(other.phone));

  // own postcode present, sister postcode absent (JSON-LD / contact card)
  check(`${file}: own postcode (${b.postalCode}) present`, visible.includes(b.postalCode));
  check(`${file}: sister postcode (${other.postalCode}) absent`, !visible.includes(other.postalCode));

  // "Eccleston in Eccleston" / "Ainsdale in Ainsdale" style double-town bug
  check(`${file}: no doubled own-town phrase`, !new RegExp(`${b.seoTown}\\s+in\\s+${b.seoTown}`, 'i').test(visible));
}

// paste sheets: title/description/H1-adjacent fields agree with the pages, and
// carry the branch's own town, for the six sheet files this module writes.
const sheetFiles = [
  path.join(serviceDir, 'SEO.md'), path.join(serviceDir, 'INDEX.md'),
  path.join(switchDir, 'SEO.md'), path.join(switchDir, 'INDEX.md'),
  path.join(branchDir, 'SEO.md'), path.join(branchDir, 'INDEX.md'),
];
for (const sheet of sheetFiles) {
  if (!fs.existsSync(sheet)) { failures++; console.log(`FAIL: missing sheet ${sheet}`); checks++; continue; }
  const text = fs.readFileSync(sheet, 'utf8');
  // split into blocks by permalink or page heading; find Fishlocks Ainsdale/Eccleston blocks
  for (const b of [ain, ecc]) {
    const slugPattern = `${b.brandSlug}-${b.townSlug}`;
    const blockMatches = text.split(/\n(?=#|- \*\*Page Title)/).filter(blk => blk.toLowerCase().includes(slugPattern));
    check(`${sheet}: at least one block for ${b.id}`, blockMatches.length >= 1);
    for (const blk of blockMatches) {
      const titleLines = [...blk.matchAll(/- \*\*Page Title:\*\*\s*(.+)/g)];
      const descLines = [...blk.matchAll(/- \*\*Page Description:\*\*\s*(.+)/g)];
      check(`${sheet} [${slugPattern}]: at most one Page Title label per block`, titleLines.length <= 1);
      check(`${sheet} [${slugPattern}]: at most one Page Description label per block`, descLines.length <= 1);
      if (titleLines.length) check(`${sheet} [${slugPattern}]: title carries own town`, wordBoundary(titleLines[0][1], b.seoTown));
      if (descLines.length) check(`${sheet} [${slugPattern}]: description carries own town`, wordBoundary(descLines[0][1], b.seoTown));
    }
  }
}

// switch banners (item 3.3's fourth-pass Q63 finding): each branch's switch
// page's own SWITCH_URL-style link, if present inline, must point at its own
// branch, not the sister's.
for (const b of [ain, ecc]) {
  const other = b === ain ? ecc : ain;
  const swFile = path.join(switchDir, `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`);
  const raw = fs.readFileSync(swFile, 'utf8');
  const ownLink = `switch-prescriptions-${b.brandSlug}-${b.townSlug}.html`;
  const sisterLink = `switch-prescriptions-${other.brandSlug}-${other.townSlug}.html`;
  check(`${swFile}: does not self-reference the sister branch's switch page`, !raw.includes(sisterLink) || raw.includes(ownLink));
}

console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
