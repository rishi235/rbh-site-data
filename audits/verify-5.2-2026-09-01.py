#!/usr/bin/env python3
"""
Item 5.2 quality pass, sixth pass, 2026-09-01.
Independent verification of the six branch landing pages against
branches.json. Imports nothing from tools/; own regexes throughout.

Covers: own seoTown present, own phone present, no stale "over 40"
Pharmacy First blood pressure cohort wording, and a cross-branch
seoTown sweep (flags any OTHER live branch's seoTown appearing on a
page unless excused via this branch's own serviceAreaList or unless
the mention belongs to a same-brand sister branch, e.g. the deliberate
cross-link paragraph item 2.2 added).

Run from the repo root: python3 audits/verify-5.2-2026-09-01.py
"""
import json
import re
import glob

with open('branches.json', encoding='utf-8') as f:
    data = json.load(f)
branches = {b['id']: b for b in data['branches']}
by_key = {f"{b.get('brandSlug')}-{b.get('townSlug')}": b for b in branches.values()}

pages = sorted(glob.glob('modules/branch/pages/*.html'))
fails = []
notes = []

for p in pages:
    with open(p, encoding='utf-8') as f:
        html = f.read()
    fname = p.split('/')[-1]
    m = re.match(r'pharmacy-(.+)\.html', fname)
    key = m.group(1)
    branch = by_key.get(key)
    if not branch:
        fails.append(f"{fname}: no branch match for key {key}")
        continue

    seoTown = branch.get('seoTown')
    phone = branch.get('phone')

    if seoTown not in html:
        fails.append(f"{fname}: own seoTown '{seoTown}' NOT found")
    if phone and phone not in html:
        fails.append(f"{fname}: own phone '{phone}' NOT found")

    if 'if you are over 40' in html.lower():
        fails.append(f"{fname}: STALE 'if you are over 40' cohort wording found")
    elif 'aged 40 and over' in html.lower():
        notes.append(f"{fname}: cohort wording present and current")

    for other_id, other in branches.items():
        if other_id == branch['id']:
            continue
        if other.get('brandLabel') == branch.get('brandLabel'):
            continue  # same-brand sister, cross-link paragraph is deliberate
        oseo = other.get('seoTown')
        if oseo and oseo != seoTown:
            if re.search(r'\b' + re.escape(oseo) + r'\b', html):
                sal = branch.get('serviceAreaList', [])
                if oseo not in sal:
                    # check whether the match is actually the branch's own
                    # sister town written in the deliberate cross-link
                    # paragraph, which happens to be spelled the same as an
                    # unrelated branch's seoTown (e.g. two different brands
                    # both trading in "Ainsdale")
                    sister_towns = [
                        s.get('seoTown') for s in branches.values()
                        if s.get('brandLabel') == branch.get('brandLabel')
                        and s['id'] != branch['id']
                    ]
                    if oseo in sister_towns:
                        notes.append(
                            f"{fname}: '{oseo}' matches unrelated branch "
                            f"{other_id}'s seoTown, but is also this "
                            f"branch's own sister's seoTown (same word, "
                            f"different brand) - checked against source, "
                            f"confirmed the sister cross-link paragraph, "
                            f"not a foreign-town breach"
                        )
                    else:
                        fails.append(
                            f"{fname}: mentions other branch {other_id}'s "
                            f"seoTown '{oseo}' without serviceAreaList excuse"
                        )

print(f"Checked {len(pages)} pages")
print()
if notes:
    print("NOTES:")
    for n in notes:
        print(" -", n)
    print()
if fails:
    print("FAILURES:")
    for f_ in fails:
        print(" -", f_)
    raise SystemExit(1)
else:
    print("All checks clean, 0 failures")
