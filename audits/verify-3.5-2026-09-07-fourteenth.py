import json, re, sys, os
from urllib.parse import unquote, quote

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(ROOT)

data = json.load(open("branches.json", encoding="utf-8"))
branches = [b for b in data["branches"] if not b.get("disposed")]
me = next(b for b in branches if b["id"] == "hirshmans_ainsdale")
want_addr = ", ".join([me["streetAddress"], me["addressLocality"], me["postalCode"]])

pages = [
    "modules/service/pages/contraception-hirshmans-ainsdale.html",
    "modules/service/pages/earache-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/impetigo-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/insect-bite-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/pharmacy-first-hirshmans-ainsdale.html",
    "modules/service/pages/shingles-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/sinusitis-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/sore-throat-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/travel-clinic-hirshmans-ainsdale.html",
    "modules/service/pages/uti-treatment-hirshmans-ainsdale.html",
    "modules/service/pages/weight-loss-clinic-hirshmans-ainsdale.html",
    "modules/switch/pages/switch-prescriptions-hirshmans-ainsdale.html",
]

checks = 0
failures = []
def check(name, cond, detail=""):
    global checks
    checks += 1
    if not cond:
        failures.append(name + (": " + detail if detail else ""))

EMBED_RE = re.compile(r'<iframe[^>]*class="map"[^>]*src="([^"]+)"[^>]*>')
CONTACT_ADDR_RE = re.compile(r'<div class="contact-line"><p>([^<]*\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})</p></div>')
DIR_RE = re.compile(r'https://www\.google\.com/maps/dir/\?api=1&destination=([^"\'\s<>]+)')
ANY_MAPS_RE = re.compile(r'https://www\.google\.com/maps[^"\'\s<>]*')

dirs_checked = 0
for p in pages:
    src = open(p, encoding="utf-8").read()
    embeds = EMBED_RE.findall(src)
    check(p + " has exactly 1 map embed", len(embeds) == 1, str(len(embeds)))
    if len(embeds) != 1:
        continue
    url = embeds[0]
    qm = re.match(r'^https://www\.google\.com/maps\?q=([^&]*)&output=embed$', url)
    check(p + " map url shape", bool(qm), url)
    if not qm:
        continue
    raw = qm.group(1)
    check(p + " no raw space/comma in query", not re.search(r'[\s,]', raw), raw)
    try:
        got = unquote(raw)
        decode_ok = True
    except Exception:
        got = None
        decode_ok = False
    check(p + " query decodes", decode_ok)
    if got is not None:
        check(p + " query is proper percent-encoding of its own value", quote(got, safe="") == raw, raw + " vs re-encoded " + quote(got, safe=""))
        check(p + " map address matches branches.json", got == want_addr, got + " != " + want_addr)
        cm = CONTACT_ADDR_RE.search(src)
        check(p + " contact card address present", bool(cm))
        if cm:
            check(p + " contact card matches map query", cm.group(1).strip() == got,
                  cm.group(1).strip() + " != " + got)
    # directions button
    for d in DIR_RE.finditer(src):
        dirs_checked += 1
        dest = unquote(d.group(1))
        check(p + " directions dest matches map", dest == got, dest + " != " + str(got))
    # no stray maps urls
    seen_extra = 0
    for a in ANY_MAPS_RE.finditer(src):
        u = a.group(0)
        if u == url: continue
        if u.startswith("https://www.google.com/maps/dir/?api=1&destination="): continue
        seen_extra += 1
    check(p + " no stray maps urls", seen_extra == 0, str(seen_extra))

print("hirshmans_ainsdale check-map-embeds independent verification (12 pages)")
print("checks run:", checks)
print("directions buttons found (expect 0, no branch landing page for this branch):", dirs_checked)
print("failures:", len(failures))
for f in failures:
    print("  FAIL", f)
if failures:
    sys.exit(1)
print("RESULT: clean")
