# Item 5.2 quality pass, 2026-08-14 (199th run).
# Negative tests for the widening of rule 9 in check-pharmacy-first-eligibility.js
# to the six branch landing pages. Every case injects a fault, runs the checker,
# asserts it FAILS with the expected message, then restores.
#
# RESTORE IS BY BYTE COPY, NOT git checkout. The first draft of this harness used
# git checkout and destroyed the uncommitted fix it was written to test, because
# HEAD still carried the defect. A harness must not depend on the work being
# committed first.
#
# Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File audits\rule9-landing-negative-tests-2026-08-14.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$CHECK = "tools\check-pharmacy-first-eligibility.js"
$PAGE  = "modules\branch\pages\pharmacy-scorah-bramhall.html"
$GEN   = "tools\build-branch-landing-pages.js"
$PACK  = "gbp-packs\mccanns-sandringham.md"
$LANDING = "modules\branch\pages"

$snapDir = Join-Path $env:TEMP ("rule9snap-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $snapDir | Out-Null
$snapshot = @{}
foreach ($f in @($GEN, $PACK) + (Get-ChildItem $LANDING -Filter *.html | ForEach-Object { $_.FullName })) {
  $dest = Join-Path $snapDir ([IO.Path]::GetFileName($f))
  Copy-Item $f $dest -Force
  $snapshot[$f] = $dest
}
$results = @()

function Restore-All {
  foreach ($k in $snapshot.Keys) { Copy-Item $snapshot[$k] $k -Force }
}

function Assert-Case($label, $expectText) {
  $out = & node $CHECK 2>&1 | Out-String
  $code = $LASTEXITCODE
  $ok = if ($expectText) { ($code -ne 0) -and ($out -match [regex]::Escape($expectText)) } else { $code -eq 0 }
  $script:results += [pscustomobject]@{ Case = $label; Pass = $ok }
  "{0,-60} {1}" -f $label, $(if ($ok) { "PASS" } else { "*** UNEXPECTED (exit $code) ***" })
  Restore-All
}

"BASELINE"
Assert-Case "untouched tree passes" $null

"`nCASE 1 - the defect this pass found, put back in the GENERATOR"
(Get-Content $GEN -Raw).Replace(
  'Free NHS blood pressure checks for adults aged 40 and over.',
  'Free NHS blood pressure checks if you are over 40.') | Set-Content $GEN -NoNewline
& node $GEN | Out-Null
Assert-Case "generator back to 'over 40' fails on all six pages" "states age 40"
& node $GEN | Out-Null

"`nCASE 2 - wrong cohort injected straight onto a PAGE"
(Get-Content $PAGE -Raw).Replace('adults aged 40 and over', 'adults aged 30 and over') | Set-Content $PAGE -NoNewline
Assert-Case "page states 'aged 30 and over' -> fails" "states age 30"

"`nCASE 3 - right number, WRONG service (the phrase-not-number test)"
# The tile HEADING must move too. The first attempt changed only the blurb and
# the checker passed, correctly: after tag stripping the tile heading "Blood
# pressure checks" sits in the same sentence, so the cohort really was named
# beside its own service. That was a bad injection, not a hole in the rule.
$c3 = (Get-Content $PAGE -Raw).
  Replace('Blood pressure checks', 'Travel health checks').
  Replace('blood pressure checks for adults aged 40 and over',
          'travel health checks for adults aged 40 and over')
$c3 | Set-Content $PAGE -NoNewline
Assert-Case "cohort attached to the wrong service -> fails" "attached to the wrong service"

"`nCASE 4 - REGRESSION: the pack half of rule 9 still bites"
(Get-Content $PACK -Raw).Replace('aged 40 and over', 'aged 30 and over') | Set-Content $PACK -NoNewline
Assert-Case "pack states 'aged 30 and over' -> still fails" "states age 30"

"`nCASE 5 - the empty-directory guard (checker COPY, no real file moved)"
$tmp = "audits\_rule9-guard-tmp.js"
(Get-Content $CHECK -Raw).Replace(
  'path.join(ROOT, "modules", "branch", "pages")',
  'path.join(ROOT, "modules", "branch", "pages-that-do-not-exist")') | Set-Content $tmp -NoNewline
$out = & node $tmp 2>&1 | Out-String
$guarded = ($LASTEXITCODE -ne 0) -and ($out -match "no landing pages found")
$results += [pscustomobject]@{ Case = "missing landing dir fails rather than passing quietly"; Pass = $guarded }
"{0,-60} {1}" -f "missing landing dir fails, does not pass quietly", $(if ($guarded) { "PASS" } else { "*** UNEXPECTED ***" })
Remove-Item $tmp -Force

"`nAFTER RESTORE"
Assert-Case "untouched tree passes again" $null
& node $GEN | Out-Null
Remove-Item $snapDir -Recurse -Force

$dirty = git status --porcelain | Where-Object { $_ -notmatch "audits/" -and $_ -notmatch "check-pharmacy-first-eligibility|build-branch-landing-pages|modules/branch/pages" }
if ($dirty) { "TREE HAS UNEXPECTED CHANGES:`n$dirty" } else { "no file outside this pass's own edits was left modified" }
$bad = @($results | Where-Object { -not $_.Pass }).Count
"$($results.Count) case(s), $bad unexpected"
if ($bad -gt 0) { exit 1 }
