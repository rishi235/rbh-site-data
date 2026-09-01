#!/usr/bin/env python3
"""
Item 5.2 quality pass (seventh), 2026-09-01. Independent verification script.
Imports nothing from tools/, uses its own JSON-LD parsing and its own regexes.

New angle for this pass (not covered by any of the six prior passes' write-ups
in AGENT_WORKLIST.md): all six branches this item's landing pages belong to
are exactly the six branches in the whole estate where brandLabel != branchName
(Fishlocks x2, McCanns x2, Scorah x2 - see CLAUDE.md "Which pharmacy does a
page say it is"). That makes these six pages the highest-risk spot in the
estate for the bare-brandLabel JSON-LD/data-branch bug check-branch-identity.js
exists to catch, and the sharpest place to prove that checker still bites on
a page from this specific item rather than trusting the estate-wide green
board. Also checks the hasApp card is present iff the branch is an app member
(Fishlocks Ainsdale and Eccleston are; McCanns and Scorah are not), matching
check-app-membership.js's own scope.

Two negative tests run against a scratch copy of one page, outside the
tracked working tree, to prove the assertions here are not vacuous:
  1. JSON-LD name and data-branch swapped from branchName to the bare
     brandLabel -> must be caught.
  2. App-card sentence added to a page whose branch is not an app member
     -> must be caught.
The tracked file is never touched; the scratch copy is deleted at the end.
"""
import re, json, shutil, tempfile, os, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(REPO)

d = json.load(open('branches.json'))
byfile = {
    'pharmacy-fishlocks-ainsdale.html': 'fishlocks_ainsdale',
    'pharmacy-fishlocks-eccleston.html': 'fishlocks_eccleston',
    'pharmacy-mccanns-aigburth.html': 'mccanns_aigburth',
    'pharmacy-mccanns-sandringham.html': 'mccanns_sandringham',
    'pharmacy-scorah-bramhall.html': 'scorah_bramhall',
    'pharmacy-scorah-hazel-grove.html': 'scorah_hazel',
}
branches = {b['id']: b for b in d['branches']}

APP_MARKERS = ('RB Healthcare Pharmacy app', 'apps.apple.com', 'play.google.com')


def check_page(path, branch):
    txt = open(path, encoding='utf-8').read()
    problems = []

    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', txt, re.S)
    if not m:
        return ['no JSON-LD block found']
    obj = json.loads(m.group(1))
    top_name = obj.get('name')

    if top_name != branch['branchName']:
        problems.append(f'JSON-LD name is {top_name!r}, expected branchName {branch["branchName"]!r}')
    if top_name == branch['brandLabel'] and branch['brandLabel'] != branch['branchName']:
        problems.append(f'JSON-LD name is the bare brandLabel {branch["brandLabel"]!r} (ambiguous with sister branch)')

    data_branch_vals = set(re.findall(r'data-branch="([^"]*)"', txt))
    if data_branch_vals:
        if data_branch_vals != {branch['branchName']}:
            problems.append(f'data-branch is {data_branch_vals}, expected {{{branch["branchName"]!r}}}')

    has_app_marker = any(marker in txt for marker in APP_MARKERS)
    expect_app = bool(branch.get('hasApp'))
    if has_app_marker != expect_app:
        problems.append(f'app-card marker present={has_app_marker}, expected {expect_app} (hasApp={branch.get("hasApp")})')

    return problems


def run_real():
    print('=== REAL TRACKED PAGES ===')
    all_clean = True
    for fname, bid in byfile.items():
        b = branches[bid]
        path = os.path.join('modules', 'branch', 'pages', fname)
        problems = check_page(path, b)
        status = 'CLEAN' if not problems else 'DEFECT'
        print(f'{fname}: {status}')
        for p in problems:
            print(f'    - {p}')
            all_clean = False
    return all_clean


def run_negative_tests():
    print()
    print('=== NEGATIVE TESTS (scratch copy only, tracked files untouched) ===')
    scratch_dir = tempfile.mkdtemp(prefix='rbh-5-2-negtest-')
    try:
        fname = 'pharmacy-fishlocks-ainsdale.html'
        bid = byfile[fname]
        b = branches[bid]
        src = os.path.join('modules', 'branch', 'pages', fname)
        scratch = os.path.join(scratch_dir, fname)
        shutil.copyfile(src, scratch)

        # Test 1: bare brandLabel injected in place of branchName
        txt = open(scratch, encoding='utf-8').read()
        injected = txt.replace(b['branchName'], b['brandLabel'])
        # guard: injection must actually have changed something
        assert injected != txt, 'test 1 setup failed: nothing to replace'
        open(scratch, 'w', encoding='utf-8').write(injected)
        problems1 = check_page(scratch, b)
        caught1 = any('bare brandLabel' in p or 'JSON-LD name is' in p for p in problems1)
        print(f'Test 1 (bare brandLabel injection): {"CAUGHT" if caught1 else "MISSED -- SCRIPT IS UNSAFE"}')
        for p in problems1:
            print(f'    - {p}')

        # Test 2: app-card marker added to a non-member branch's page
        shutil.copyfile(src, scratch)
        b2 = branches['mccanns_aigburth']  # hasApp = False
        src2 = os.path.join('modules', 'branch', 'pages', 'pharmacy-mccanns-aigburth.html')
        scratch2 = os.path.join(scratch_dir, 'pharmacy-mccanns-aigburth.html')
        shutil.copyfile(src2, scratch2)
        txt2 = open(scratch2, encoding='utf-8').read()
        # pages are Weebly-embed fragments with no <body> tag, so append directly
        injected2 = txt2 + '\n<p>Download the RB Healthcare Pharmacy app today.</p>\n'
        assert injected2 != txt2, 'test 2 setup failed: nothing to inject'
        open(scratch2, 'w', encoding='utf-8').write(injected2)
        problems2 = check_page(scratch2, b2)
        caught2 = any('app-card marker' in p for p in problems2)
        print(f'Test 2 (app-card on non-member branch): {"CAUGHT" if caught2 else "MISSED -- SCRIPT IS UNSAFE"}')
        for p in problems2:
            print(f'    - {p}')

        return caught1 and caught2
    finally:
        shutil.rmtree(scratch_dir, ignore_errors=True)


if __name__ == '__main__':
    real_clean = run_real()
    negs_ok = run_negative_tests()
    print()
    print(f'Real pages clean: {real_clean}')
    print(f'Negative tests both caught (script proven non-vacuous): {negs_ok}')
    sys.exit(0 if (real_clean and negs_ok) else 1)
