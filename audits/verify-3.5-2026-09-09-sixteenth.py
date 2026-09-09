#!/usr/bin/env python3
"""
Independent extraction for item 3.5 (Hirshmans Chemist, Ainsdale), sixteenth
quality pass, 2026-09-09. Written fresh, no import from tools/check-seo-
keywords.js, so this is a second, separate implementation of rules 1-8
against Hirshmans Chemist Ainsdale's own 12 Meta Keywords lines only.

Reads branches.json for the expected facts and the five SEO.md paste sheets
(SEO.md, CONTRACEPTION-SEO.md, TRAVEL-CLINIC-SEO.md, WEIGHT-LOSS-SEO.md,
modules/switch/pages/SEO.md) for the pasted values, scoped to blocks whose
Page Permalink ends "-hirshmans-ainsdale".
"""
import json, re, sys, os

REPO = sys.argv[1] if len(sys.argv) > 1 else "."

with open(os.path.join(REPO, "branches.json"), encoding="utf-8") as f:
    data = json.load(f)

live = [b for b in data["branches"] if not b.get("disposed") and b.get("brandSlug") and b.get("townSlug") and b.get("seoTown")]
by_id = {b["id"]: b for b in live}
hirshmans = next(b for b in live if b["id"] == "hirshmans_ainsdale")

town_owners = {}
for b in live:
    town_owners.setdefault(b["seoTown"], []).append(b["id"])
brand_owners = {}
for b in live:
    brand_owners.setdefault(b["brandLabel"], []).append(b["id"])

def word_re(s):
    esc = re.escape(s)
    return re.compile(r"(^|[^a-z0-9])" + esc + r"([^a-z0-9]|$)", re.IGNORECASE)

def norm_town(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())

OUTWARD_TOKEN = re.compile(r"\b[A-Z]{1,2}[0-9][0-9A-Z]?\b")

def outward(b):
    return b["postalCode"].split(" ")[0].upper()

CLAIM_WORDS = ["results", "guaranteed", "fastest", "best", "lose weight fast",
               "rapid weight loss", "proven", "clinically proven", "% off",
               "cheapest", "number one", "#1", "risk-free"]

def find_claim(text):
    low = text.lower()
    for w in CLAIM_WORDS:
        if w in low:
            return w
    return None

SHEETS = [
    "modules/service/pages/SEO.md",
    "modules/service/pages/CONTRACEPTION-SEO.md",
    "modules/service/pages/TRAVEL-CLINIC-SEO.md",
    "modules/service/pages/WEIGHT-LOSS-SEO.md",
    "modules/switch/pages/SEO.md",
]

blocks = []
for sheet in SHEETS:
    path = os.path.join(REPO, sheet)
    if not os.path.exists(path):
        continue
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()
    cur = None
    for line in lines:
        if line.startswith("## "):
            if cur is not None:
                blocks.append(cur)
            cur = {"sheet": sheet, "heading": line[3:].strip(), "permalink": "", "keywords": ""}
            continue
        if cur is None:
            continue
        m = re.match(r"^-\s+\*\*Page Permalink:\*\*\s*(.*)$", line)
        if m:
            cur["permalink"] = m.group(1).strip().lower().removesuffix(".html")
            continue
        m = re.match(r"^-\s+\*\*Meta Keywords:\*\*\s*(.*)$", line)
        if m:
            cur["keywords"] = m.group(1).strip()
    if cur is not None:
        blocks.append(cur)

hirshmans_blocks = [b for b in blocks if b["permalink"].endswith("-hirshmans-ainsdale") or b["permalink"] == "hirshmans-ainsdale"]

print(f"Found {len(hirshmans_blocks)} Hirshmans Chemist Ainsdale Meta Keywords blocks across {len(SHEETS)} sheets")

failures = []
checked = 0

for blk in hirshmans_blocks:
    where = f'{blk["sheet"]} :: "{blk["heading"]}" ({blk["permalink"]})'
    kw = blk["keywords"]
    if not kw:
        failures.append(f"{where}: RULE1 pairing - permalink present, Meta Keywords blank")
        continue
    checked += 1
    b = hirshmans

    # RULE 3 presence
    if not word_re(b["seoTown"]).search(kw):
        failures.append(f"{where}: RULE3 presence - missing own seoTown '{b['seoTown']}'. Got: {kw}")

    # RULE 4 absence
    areas = [a.lower() for a in b.get("serviceAreaList", [])]
    for t, owners in town_owners.items():
        if t == b["seoTown"]:
            continue
        if not word_re(t).search(kw):
            continue
        if t.lower() in areas:
            continue
        failures.append(f"{where}: RULE4 absence - names '{t}' (seoTown of {owners}), not in serviceAreaList. Got: {kw}")

    # RULE 5 brand
    for n, owners in brand_owners.items():
        if n == b["brandLabel"]:
            continue
        if word_re(n).search(kw):
            failures.append(f"{where}: RULE5 brand - names '{n}' (brand of {owners}). Got: {kw}")

    # RULE 6 postcode
    mine = outward(b)
    for tok in OUTWARD_TOKEN.finditer(kw):
        if tok.group(0).upper() != mine:
            failures.append(f"{where}: RULE6 postcode - carries '{tok.group(0)}', not own outward code '{mine}'. Got: {kw}")

    # RULE 7 claim
    claim = find_claim(kw)
    if claim:
        failures.append(f"{where}: RULE7 claim - carries claim wording '{claim}'. Got: {kw}")

    # RULE 8 retired town word
    retired = b["townSlug"].replace("-", " ")
    if norm_town(retired) != norm_town(b["seoTown"]):
        served_now = any(norm_town(a) == norm_town(retired) for a in b.get("serviceAreaList", []))
        if not served_now and word_re(retired).search(kw):
            failures.append(f"{where}: RULE8 retired - carries retired townSlug word '{retired}'. Got: {kw}")
    else:
        print(f"  (RULE8 correctly inert for {blk['permalink']}: townSlug '{b['townSlug']}' equals seoTown '{b['seoTown']}', no retired word)")

print(f"Checked {checked} Meta Keywords line(s) for Hirshmans Chemist Ainsdale")
if failures:
    print(f"\nFAILURES ({len(failures)}):")
    for f in failures:
        print("  FAIL " + f)
    sys.exit(1)
print("\nAll clear: every Hirshmans Chemist Ainsdale Meta Keywords line independently verified against rules 1, 3-8.")
