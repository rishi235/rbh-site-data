#!/usr/bin/env python3
"""
Independent verification for item 3.5 (Hirshmans Chemist, Ainsdale), eighteenth
quality pass, 2026-09-14. Freshly written, no import from tools/.

Target: tools/check-switch-copy.js, never named once across seventeen prior
passes on this item despite CLAUDE.md describing it as the highest-commitment
page in the estate and switch-prescriptions-hirshmans-ainsdale.html already
having been used for injection on this item twice before (ninth pass, ninth
pass again for check-whatsapp-route/check-seo-pattern) but never against its
own body-copy rules.

Reads switch-prescriptions-hirshmans-ainsdale.html directly and branches.json
directly. Re-implements, independently, rules 6, 8, 9, 10 (the four rules with
a genuine per-branch answer) plus a presence check for the two KNOWN-pinned
rules 4 and 5 (expected PRESENT, matching KNOWN in check-switch-copy.js, not
absent) and rule 11a (banner self-reference).
"""
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAGE = os.path.join(ROOT, "modules", "switch", "pages", "switch-prescriptions-hirshmans-ainsdale.html")
BANNER = os.path.join(ROOT, "modules", "switch", "pages", "banners", "switch-prescriptions-hirshmans-ainsdale.txt")
BRANCHES = os.path.join(ROOT, "branches.json")

failures = []
checks = 0

def check(cond, msg):
    global checks
    checks += 1
    if not cond:
        failures.append(msg)

data = json.load(open(BRANCHES, encoding="utf-8"))
by_id = {b["id"]: b for b in data["branches"]}
b = by_id["hirshmans_ainsdale"]
html = open(PAGE, encoding="utf-8").read()

def text_of(fragment):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment)).strip()

# --- RULE 8, town -----------------------------------------------------------
mine = b["seoTown"]
pill_m = re.search(r'<span class="pill">([\s\S]*?)</span>', html)
trust_m = re.search(r'<div class="trust-bar">([\s\S]*?)</div>\s*</div>', html)
step2_m = re.search(r'<div class="step-no">2</div>[\s\S]*?<p>([\s\S]*?)</p>', html)
check(bool(pill_m) and bool(trust_m) and bool(step2_m), "rule 8: pill/trust-bar/step2 all found on page")
pill_txt = text_of(pill_m.group(1)) if pill_m else ""
trust_txt = text_of(trust_m.group(1)) if trust_m else ""
step2_txt = text_of(step2_m.group(1)) if step2_m else ""
check(mine in pill_txt, "rule 8: pill names own town Ainsdale")
check(mine in trust_txt, "rule 8: trust bar names own town Ainsdale")
check(mine in step2_txt, "rule 8: step 2 names own town Ainsdale")
foreign_towns = sorted({v["seoTown"] for v in by_id.values() if v.get("seoTown") and v["seoTown"] != mine})
combined = pill_txt + " " + trust_txt + " " + step2_txt
for t in foreign_towns:
    check(not re.search(r"\b" + re.escape(t) + r"\b", combined), "rule 8: does not name foreign town " + t)

# --- RULE 6, time claim -------------------------------------------------------
page_text = text_of(html)
nums = re.findall(r"\b(\d+)\s*seconds?\b", page_text, re.I)
check(len(nums) >= 1, "rule 6: at least one seconds figure present")
uniq = sorted(set(nums))
check(len(uniq) == 1, "rule 6: exactly one distinct seconds figure on the page (found " + str(uniq) + ")")
check(uniq == ["30"], "rule 6: the figure is 30 (H1 pattern estate-wide), found " + str(uniq))

# --- RULE 9, form and its sentence -------------------------------------------
grid_m = re.search(r'<div class="form-grid">([\s\S]*?)</div>\s*<input type="hidden"', html)
check(bool(grid_m), "rule 9: form grid found")
grid = grid_m.group(1) if grid_m else ""
step1_m = re.search(r'<div class="step-no">1</div>[\s\S]*?<p>([\s\S]*?)</p>', html)
step1 = text_of(step1_m.group(1)) if step1_m else ""
inputs = [(m.group(1), "required" in m.group(0)) for m in re.finditer(r'<input[^>]*name="([^"]+)"[^>]*>', grid)
          if m.group(1) not in ("destination", "website_url", "company")]
check(len(inputs) == 5, "rule 9: five real inputs found (first_name, last_name, dob, mobile, email)")
field_words = {
    "first_name": r"\bfirst name\b",
    "last_name": r"\blast name\b",
    "dob": r"\bdate of birth\b",
    "mobile": r"\bmobile\b",
    "email": r"\bemail\b",
}
for name, required in inputs:
    word = field_words.get(name)
    check(word is not None, "rule 9: field " + name + " has a known word to check")
    if word:
        check(bool(re.search(word, step1, re.I)), "rule 9: step 1 sentence mentions " + name)
    optional_in_copy = bool(re.search(r"(mobile|email)[^.]*\boptional\b", step1, re.I)) and name in ("mobile", "email")
    if name in ("mobile", "email"):
        check(not required, "rule 9: " + name + " input is not marked required")
        check(optional_in_copy, "rule 9: step 1 calls " + name + " optional")
    if name in ("first_name", "last_name", "dob"):
        check(required, "rule 9: " + name + " input is marked required")

# --- RULE 10, collection notice ----------------------------------------------
notice_m = re.search(r'<p class="privacy">([\s\S]*?)</p>', html)
check(bool(notice_m), "rule 10: collection notice paragraph found")
notice = text_of(notice_m.group(1)) if notice_m else ""
check(bool(re.search(r"\b(use|used|only use)\b", notice, re.I)), "rule 10: notice states a use-word")
check(bool(re.search(r"\b(switch|request|prescription)\b", notice, re.I)), "rule 10: notice names the purpose")
form_start = html.find('<form id="switch-form"')
form_end = html.find("</form>", form_start)
notice_pos = html.find('<p class="privacy">')
check(form_start != -1 and form_start < notice_pos < form_end, "rule 10: notice sits inside the form, at the point of collection")

# --- RULE 4/5, KNOWN-pinned contradiction expected PRESENT (Q49) -------------
absolute_patterns = [
    r"\bWe contact your GP\b(?!\s+(?:where|when|if))",
    r"\bWe handle everything\b",
    r"\bYou do nothing\b",
    r"\bWe handle the full switch\b",
]
hedged_patterns = [
    r"\bNot always\b",
    r"\bhandle what we can\b",
    r"\bWe help handle\b",
    r"\bWe help guide\b",
    r"\bguides the next step\b",
]
abs_hits = [p for p in absolute_patterns if re.search(p, page_text, re.I)]
hed_hits = [p for p in hedged_patterns if re.search(p, page_text, re.I)]
check(len(abs_hits) >= 1 and len(hed_hits) >= 1,
      "rule 4 (KNOWN Q49): the page still carries both the unconditional GP promise and the hedged FAQ answer, matching the standing accepted breach - not silently resolved without QUESTIONS.json being updated")
continuity_m = re.search(r"\b(?:no|zero)\s+(?:interruption|break|gap|disruption)\b[^.<]*\b(?:to your |in your |in )?(?:medication|medicines|prescription|supply)\b", page_text, re.I)
check(bool(continuity_m), "rule 5 (KNOWN Q49): the unconditional continuity promise is still present, matching the standing accepted breach")
if continuity_m:
    window = page_text[max(0, continuity_m.start()-90):continuity_m.end()+90]
    hedge = re.search(r"\b(?:usually|normally|in most cases|aim to|we aim|wherever possible|where possible|subject to)\b", window, re.I)
    check(hedge is None, "rule 5 (KNOWN Q49): the continuity promise remains unhedged (no qualifying word nearby), matching the standing breach exactly rather than a partial fix")

# --- RULE 11a, banner self-reference ------------------------------------------
banner_src = open(BANNER, encoding="utf-8").read()
m = re.search(r'var\s+SWITCH_URL\s*=\s*"([^"]+)"', banner_src)
check(bool(m), "rule 11a: banner declares SWITCH_URL")
check(m.group(1) == "/switch-prescriptions-hirshmans-ainsdale.html" if m else False,
      "rule 11a: banner SWITCH_URL points at Hirshmans' own switch page")
# Hirshmans is not one of the three shared-domain hosts (fishlockpharmacy,
# mccannspharmacy, scorah-chemists), so rule 11b should not fire for it.
host = b["website"].replace("https://", "").replace("http://", "").rstrip("/").lower()
check(host == "www.hirshmanspharmacy.co.uk", "rule 11b: host is not one of the three shared-domain hosts")

print("checks: %d, failures: %d" % (checks, len(failures)))
if failures:
    for f in failures:
        print("FAIL:", f)
    sys.exit(1)
print("ALL CLEAN")
