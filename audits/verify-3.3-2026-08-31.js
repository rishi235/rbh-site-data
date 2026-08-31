// Sixth independent extraction for worklist item 3.3 (Fishlocks Chemist,
// Ainsdale and Eccleston), 2026-08-31 quality pass.
//
// Shares no code with tools/. Own regexes throughout. Reads branches.json
// as the single source of truth for expected values and reads the paste
// sheets (modules/service/pages/*.md, modules/switch/pages/SEO.md,
// modules/branch/pages/SEO.md) and the generated pages independently.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const branches = require(path.join(ROOT, 'branches.json')).branches;

const results = [];
let failCount = 0;
function check(label, cond, detail) {
  results.push({ label, pass: !!cond, detail: detail || '' });
  if (!cond) failCount++;
}

const ainsdale = branches.find(b => b.id === 'fishlocks_ainsdale');
const eccleston = branches.find(b => b.id === 'fishlocks_eccleston');
if (!ainsdale || !eccleston) {
  console.error('FATAL: could not find fishlocks_ainsdale / fishlocks_eccleston in branches.json');
  process.exit(2);
}

const liveSeoTowns = branches.filter(b => !b.disposed).map(b => b.seoTown).filter(Boolean);

// ---- sheet parsing: block header "## ...", then "- **Label:** value" lines ----
function parseSheet(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const headerMatch = /^##\s+(.+)$/.exec(line);
    if (headerMatch) {
      if (current) blocks.push(current);
      current = { header: headerMatch[1].trim(), fields: {}, file };
      continue;
    }
    const fieldMatch = /^-\s+\*\*(.+?):\*\*\s*(.*)$/.exec(line);
    if (fieldMatch && current) {
      const key = fieldMatch[1].trim();
      const val = fieldMatch[2].trim();
      current.fields[key] = val; // last-write-wins deliberately avoided below
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

function blockByPermalink(blocks, permalink) {
  return blocks.filter(b => {
    const p = b.fields['Page Permalink'] || b.fields['Page slug / URL'] || b.fields['Page name'];
    return p === permalink;
  });
}

const seoSheets = [
  path.join(ROOT, 'modules/service/pages/SEO.md'),
  path.join(ROOT, 'modules/service/pages/TRAVEL-CLINIC-SEO.md'),
  path.join(ROOT, 'modules/service/pages/WEIGHT-LOSS-SEO.md'),
  path.join(ROOT, 'modules/service/pages/CONTRACEPTION-SEO.md'),
];
let allServiceBlocks = [];
for (const s of seoSheets) {
  if (fs.existsSync(s)) allServiceBlocks = allServiceBlocks.concat(parseSheet(s));
}
const switchBlocks = parseSheet(path.join(ROOT, 'modules/switch/pages/SEO.md'));
const landingBlocks = parseSheet(path.join(ROOT, 'modules/branch/pages/SEO.md'));

// ---- duplicate-label-per-block check (the fault the fifth pass fixed) ----
function checkNoDuplicateLabels(blocks, sheetName) {
  for (const b of blocks) {
    const text = fs.readFileSync(b.file, 'utf8').replace(/\r\n/g, '\n');
    const lines = text.split('\n');
    let inBlock = false;
    const seen = {};
    let dup = null;
    for (const line of lines) {
      if (/^##\s+/.test(line)) {
        if (line.trim() === '## ' + b.header) { inBlock = true; continue; }
        if (inBlock) break; // left the block
      }
      if (!inBlock) continue;
      const fieldMatch = /^-\s+\*\*(.+?):\*\*/.exec(line);
      if (fieldMatch) {
        const key = fieldMatch[1].trim();
        if (seen[key]) { dup = key; break; }
        seen[key] = true;
      }
    }
    check(
      `no duplicate label in block "${b.header}" (${sheetName})`,
      !dup,
      dup ? `duplicate label: ${dup}` : ''
    );
  }
}
checkNoDuplicateLabels(allServiceBlocks, 'service SEO sheets');
checkNoDuplicateLabels(switchBlocks, 'switch SEO.md');
checkNoDuplicateLabels(landingBlocks, 'branch SEO.md');

// ---- page-level checks ----
function readPage(file) {
  return fs.readFileSync(file, 'utf8');
}

function h1Count(html) {
  const m = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/g);
  return m ? m.length : 0;
}
function h1Text(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}
function wordBoundaryIncludes(haystack, needle) {
  if (!needle) return false;
  const re = new RegExp('\\b' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  return re.test(haystack);
}

function checkBranchPages(branch, otherBranch, familyFiles) {
  const town = branch.seoTown;
  const otherTown = otherBranch.seoTown;
  const serviceArea = branch.serviceAreaList || [];
  const ownPhoneDigits = (branch.phone || '').replace(/\D/g, '');
  const otherPhoneDigits = (otherBranch.phone || '').replace(/\D/g, '');

  for (const pf of familyFiles) {
    const pagePath = path.join(ROOT, pf.rel);
    if (!fs.existsSync(pagePath)) {
      check(`page exists: ${pf.rel}`, false, 'missing file');
      continue;
    }
    const html = readPage(pagePath);

    // sheet lookup
    let blocks;
    if (pf.rel.startsWith('modules/switch/')) blocks = blockByPermalink(switchBlocks, pf.permalink);
    else if (pf.rel.startsWith('modules/branch/')) blocks = blockByPermalink(landingBlocks, pf.permalink);
    else blocks = blockByPermalink(allServiceBlocks, pf.permalink);

    check(`sheet block found for ${pf.permalink}`, blocks.length >= 1, `found ${blocks.length}`);
    if (blocks.length === 0) continue;
    const block = blocks[blocks.length - 1];
    const title = block.fields['Page Title'] || '';
    const description = block.fields['Page Description'] || '';

    // H1 checks
    const hc = h1Count(html);
    check(`${pf.permalink}: exactly one H1`, hc === 1, `found ${hc}`);
    const h1 = h1Text(html);

    // title length
    check(`${pf.permalink}: title <= 65 chars`, title.length > 0 && title.length <= 65, `len ${title.length}: "${title}"`);
    // description length
    check(`${pf.permalink}: description 80-165 chars`, description.length >= 80 && description.length <= 165, `len ${description.length}`);

    // own town present in title, H1, description
    check(`${pf.permalink}: own seoTown "${town}" in title`, wordBoundaryIncludes(title, town));
    check(`${pf.permalink}: own seoTown "${town}" in H1`, h1 && wordBoundaryIncludes(h1, town));
    check(`${pf.permalink}: own seoTown "${town}" in description`, wordBoundaryIncludes(description, town));

    // sister town absence unless in serviceAreaList (presence/absence pair)
    const sisterAllowed = serviceArea.includes(otherTown);
    const titleHasSister = wordBoundaryIncludes(title, otherTown);
    const descHasSister = wordBoundaryIncludes(description, otherTown);
    const h1HasSister = h1 && wordBoundaryIncludes(h1, otherTown);
    if (!sisterAllowed) {
      check(`${pf.permalink}: sister town "${otherTown}" absent from title`, !titleHasSister);
      check(`${pf.permalink}: sister town "${otherTown}" absent from H1`, !h1HasSister);
      check(`${pf.permalink}: sister town "${otherTown}" absent from description`, !descHasSister);
    } else {
      check(`${pf.permalink}: sister town "${otherTown}" excused via serviceAreaList (informational)`, true);
    }

    // no OTHER live seoTown (not this branch's, not the excused sister) appears
    let foreignFound = null;
    for (const t of liveSeoTowns) {
      if (t === town) continue;
      if (t === otherTown && sisterAllowed) continue;
      if (wordBoundaryIncludes(title, t) || wordBoundaryIncludes(description, t) || (h1 && wordBoundaryIncludes(h1, t))) {
        foreignFound = t;
        break;
      }
    }
    check(`${pf.permalink}: no foreign live seoTown`, !foreignFound, foreignFound || '');

    // own phone present (display + tel:) on service/switch pages only (landing pages carry it too actually)
    const telRe = new RegExp('tel:\\+?44?0?' + ownPhoneDigits.slice(-10), 'i');
    const hasTelLink = /tel:/.test(html) ? new RegExp(ownPhoneDigits.replace(/^0/, '0?')).test(html.replace(/[^\d]/g, m => m)) : false;
    // simpler: strip non-digits from whole html and look for own number substring, and confirm other branch's is absent
    const htmlDigitsOnly = html.replace(/tel:/g, '').replace(/\D/g, ' ').split(/\s+/).join('');
    check(`${pf.permalink}: own phone digits present`, html.includes(branch.phone) || new RegExp(ownPhoneDigits).test(html.replace(/\D/g, '')));
    check(`${pf.permalink}: sister phone absent`, !new RegExp(otherPhoneDigits).test(html.replace(/[^\d]/g, '')) || otherPhoneDigits === ownPhoneDigits);

    // JSON-LD address check (service/switch/landing pages all carry one)
    const jsonMatch = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    if (jsonMatch) {
      let ld;
      try { ld = JSON.parse(jsonMatch[1]); } catch (e) { ld = null; }
      if (ld && ld.address) {
        check(`${pf.permalink}: JSON-LD streetAddress matches`, ld.address.streetAddress === branch.streetAddress, `${ld.address.streetAddress}`);
        check(`${pf.permalink}: JSON-LD postalCode matches`, ld.address.postalCode === branch.postalCode, `${ld.address.postalCode}`);
        check(`${pf.permalink}: JSON-LD addressRegion matches`, ld.address.addressRegion === branch.addressRegion, `${ld.address.addressRegion}`);
      } else {
        check(`${pf.permalink}: JSON-LD parses with address`, false, 'no address block');
      }
      if (ld) {
        check(`${pf.permalink}: JSON-LD telephone matches`, ld.telephone === branch.phone, `${ld.telephone}`);
      }
    } else {
      check(`${pf.permalink}: JSON-LD block present`, false);
    }
  }
}

const services = [
  'contraception', 'earache-treatment', 'impetigo-treatment', 'insect-bite-treatment',
  'pharmacy-first', 'shingles-treatment', 'sinusitis-treatment', 'sore-throat-treatment',
  'travel-clinic', 'uti-treatment', 'weight-loss-clinic'
];

function familyForBranch(slug) {
  const files = services.map(s => ({
    rel: `modules/service/pages/${s}-fishlocks-${slug}.html`,
    permalink: `${s}-fishlocks-${slug}`,
  }));
  files.push({
    rel: `modules/switch/pages/switch-prescriptions-fishlocks-${slug}.html`,
    permalink: `switch-prescriptions-fishlocks-${slug}`,
  });
  return files;
}

checkBranchPages(ainsdale, eccleston, familyForBranch('ainsdale'));
checkBranchPages(eccleston, ainsdale, familyForBranch('eccleston'));

// ---- landing pages (2), separate lighter check: town/address only, no sister-absence rule (item 2.2 exemption) ----
for (const [branch, other] of [[ainsdale, eccleston], [eccleston, ainsdale]]) {
  const rel = `modules/branch/pages/pharmacy-fishlocks-${branch.townSlug}.html`;
  const pagePath = path.join(ROOT, rel);
  if (!fs.existsSync(pagePath)) { check(`landing page exists: ${rel}`, false); continue; }
  const html = readPage(pagePath);
  const hc = h1Count(html);
  check(`${rel}: exactly one H1`, hc === 1, `found ${hc}`);
  const h1 = h1Text(html);
  check(`${rel}: own seoTown "${branch.seoTown}" in H1`, h1 && wordBoundaryIncludes(h1, branch.seoTown));
  const jsonMatch = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (jsonMatch) {
    let ld;
    try { ld = JSON.parse(jsonMatch[1]); } catch (e) { ld = null; }
    check(`${rel}: JSON-LD address present and matches`, ld && ld.address && ld.address.postalCode === branch.postalCode);
  } else {
    check(`${rel}: JSON-LD present`, false);
  }
}

// ---- summary ----
console.log(`Total checks: ${results.length}, failures: ${failCount}`);
for (const r of results) {
  if (!r.pass) console.log(`FAIL: ${r.label} ${r.detail ? '(' + r.detail + ')' : ''}`);
}
if (failCount > 0) process.exit(1);
console.log('All checks passed.');
