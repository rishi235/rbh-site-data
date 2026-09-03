# Independent tenth-pass verification for worklist item 2.1 (Fishlocks Chemist
# Ainsdale). Written fresh for this run, sharing no code with anything under
# tools/. Where the eighth pass injection-tested the switch page and the ninth
# pass injection-tested the travel clinic page, this pass injection-tests the
# one page owned by this branch that had never had a dedicated injection round
# in this item's nine-pass history: the branch landing page itself,
# modules/branch/pages/pharmacy-fishlocks-ainsdale.html. That page carries more
# machine-read and human-read surfaces than any other page type this branch
# owns (JSON-LD opening hours, the visible hours card, the app-membership
# tile, the blood pressure eligibility cohort, the map embed, the sister-
# branch link), so it was the highest-value untested page left for this item.
#
# Five injections, each restored by direct file write (fs-level byte copy from
# a saved original), never by "git checkout", per the standing lesson in
# CLAUDE.md's item 5.2 note: "a test harness must restore by byte copy, not
# from git, or it can only be run after the work it is testing has already
# been committed". Each injection is applied to a byte-identical restored copy
# of the original (not layered on the previous injection), the checker is run
# once, its full output captured, and the file is restored again immediately
# afterwards and sha256-verified against the original before the next
# injection proceeds. A final restoration and sha256 check runs after all five.
#
# Usage: python3 verify-2.1-2026-09-03-tenth.py
# (run from the repo root; paths below are relative to it)

import subprocess, hashlib, sys, os

F = "modules/branch/pages/pharmacy-fishlocks-ainsdale.html"
ORIG_BACKUP = "pharmacy-fishlocks-ainsdale.orig.html"  # saved before any mutation, this run


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def read_orig():
    return open(ORIG_BACKUP, "r", encoding="utf-8").read()


def restore():
    content = read_orig()
    with open(F, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    assert sha(F) == sha(ORIG_BACKUP), "RESTORE FAILED - sha mismatch"


def run_checker(script):
    r = subprocess.run(["node", script], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def inject(old, new, label):
    content = read_orig()
    assert old in content, f"[{label}] old string not found: {old!r}"
    assert content.count(old) == 1, f"[{label}] old string not unique: {old!r} count={content.count(old)}"
    mutated = content.replace(old, new, 1)
    with open(F, "w", encoding="utf-8", newline="") as f:
        f.write(mutated)


def main():
    if not os.path.exists(ORIG_BACKUP):
        # First run in a fresh checkout: seed the backup from the current
        # (assumed clean) working tree, the same as copying it by hand before
        # starting, so this script is self-contained and re-runnable.
        with open(F, "r", encoding="utf-8") as src, open(ORIG_BACKUP, "w", encoding="utf-8", newline="") as dst:
            dst.write(src.read())

    orig_sha = sha(ORIG_BACKUP)
    print("orig sha:", orig_sha)
    assert sha(F) == orig_sha, "file not at original state before starting"

    tests = [
        ("JSONLD-HOURS",
         '"opens": "08:45",\n      "closes": "18:00"',
         '"opens": "08:45",\n      "closes": "17:00"',
         "tools/check-opening-hours.js"),
        ("VISIBLE-SATURDAY",
         '<div class="contact-line"><p><strong>Saturday:</strong> Closed</p></div>',
         '<div class="contact-line"><p><strong>Saturday:</strong> 9am to 1pm</p></div>',
         "tools/check-opening-hours.js"),
        ("DATA-BRANCH-FOREIGN",
         'data-branch="Fishlocks Chemist Ainsdale"',
         'data-branch="Smartts Chemist Bootle"',
         "tools/check-branch-identity.js"),
        ("BP-COHORT-WORDING",
         "Free NHS blood pressure checks for adults aged 40 and over. Just ask in store.",
         "Free NHS blood pressure checks for adults over 40. Just ask in store.",
         "tools/check-pharmacy-first-eligibility.js"),
        ("MAP-FOREIGN-POSTCODE",
         "q=17%20Station%20Road%2C%20Ainsdale%2C%20PR8%203HN&output=embed",
         "q=17%20Station%20Road%2C%20Ainsdale%2C%20L20%209HH&output=embed",
         "tools/check-map-embeds.js"),
    ]

    results = []
    for label, old, new, checker in tests:
        restore()  # clean baseline before each injection
        inject(old, new, label)
        rc, out = run_checker(checker)
        caught = rc != 0
        results.append((label, checker, caught, out[-1500:]))
        restore()  # restore immediately after capturing output, before any assertion
        print(f"[{label}] checker={checker} exitcode={'FAIL(caught)' if caught else 'PASS(0=MISSED)'}")

    restore()
    final_sha = sha(F)
    print("final sha matches orig:", final_sha == orig_sha)

    print()
    print("=== SUMMARY ===")
    for label, checker, caught, out in results:
        print(f"{label}: {checker} -> {'CAUGHT' if caught else 'MISSED'}")

    print()
    print("=== DETAIL (last part of output for each) ===")
    for label, checker, caught, out in results:
        print(f"--- {label} ({checker}) ---")
        print(out)
        print()

    if any(not caught for _, _, caught, _ in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
