# Negative tests for check-opening-hours.js's bankHolidays block validation
# (item 6.7, added 2026-08-29). Written on the item 6.7 quality pass,
# 2026-09-01, because the original implementation run negative-tested this
# logic inline and left no persisted script behind - unlike rule 7's sibling
# file (opening-hours-rule7-negative-tests-2026-08-14.ps1), which this one
# follows in shape.
#
# What is under test: branches.json carries a bankHolidays block (gov.uk
# dates2026, tradingPolicy) that check-opening-hours.js validates directly
# (bad date, bad policy, duplicate date all fail) and that check-live-hours.js
# separately reads to LABEL a live Closed snippet near one of those dates
# rather than raising it as a defect. The risk this guards against: a bad
# entry in that block silently stops labelling holidays correctly, or worse,
# starts swallowing a genuine hours defect that happens to land near a listed
# date. Case 4 below is the swallow check: a real, non-holiday mismatch must
# still fail with the bankHolidays block fully intact and unmodified.
#
# Each case mutates branches.json or a single generated landing page, runs
# the checker, then restores via git checkout. No rebuild step is needed:
# check-opening-hours.js reads modules/branch/pages and branches.json
# directly, it does not regenerate either.
#
# Run from the repo root. Leaves the tree exactly as it found it.

Set-Location 'C:\Dev\rbh-site-data'

$CHK = 'tools\check-opening-hours.js'
$DATA = 'branches.json'
$PAGE = 'modules\branch\pages\pharmacy-mccanns-aigburth.html'
$results = @()

function Restore {
  git checkout -- $DATA $PAGE 2>&1 | Out-Null
}

function Run-Case {
  param([string]$Name, [ValidateSet('catch','pass')][string]$Expect, [scriptblock]$Mutate)
  Restore
  $err = $null
  try { & $Mutate } catch { $err = $_.Exception.Message }
  if ($err) {
    $script:results += ("{0,-58} SETUP FAILED: {1}" -f $Name, $err)
  } else {
    $null = & node $CHK 2>&1
    $caught = ($LASTEXITCODE -ne 0)
    $verdict = if(($Expect -eq 'catch') -eq $caught){'AS EXPECTED'}else{'*** WRONG ***'}
    $got = if($caught){'caught'}else{'passed'}
    $script:results += ("{0,-58} expect={1,-6} got={2,-6} {3}" -f $Name,$Expect,$got,$verdict)
  }
  Restore
}

# --- MUST CATCH ------------------------------------------------------------

# 1. A bank holiday date that is not a real ISO yyyy-mm-dd string. Left
#    unguarded, check-live-hours.js would silently fail to match it against
#    any live date and stop labelling that holiday at all.
Run-Case 'malformed date in dates2026 (31/08/2026)' 'catch' {
  node -e "var fs=require('fs');var d=JSON.parse(fs.readFileSync('branches.json','utf8'));d.bankHolidays.dates2026[0]='31/08/2026';fs.writeFileSync('branches.json',JSON.stringify(d,null,2)+'\n','utf8');"
}

# 2. A tradingPolicy value outside the three allowed states. An unlabelled
#    date list invites exactly the false read Q79 exists to prevent.
Run-Case 'tradingPolicy set to an unrecognised value ("shut")' 'catch' {
  node -e "var fs=require('fs');var d=JSON.parse(fs.readFileSync('branches.json','utf8'));d.bankHolidays.tradingPolicy='shut';fs.writeFileSync('branches.json',JSON.stringify(d,null,2)+'\n','utf8');"
}

# 3. The same date listed twice. Harmless to the labelling itself, but a
#    duplicate is evidence the list is being hand-edited without care, and
#    the rule that catches it here is what would also catch a stray comma
#    turning one date into two.
Run-Case 'duplicate date in dates2026' 'catch' {
  node -e "var fs=require('fs');var d=JSON.parse(fs.readFileSync('branches.json','utf8'));d.bankHolidays.dates2026.push(d.bankHolidays.dates2026[0]);fs.writeFileSync('branches.json',JSON.stringify(d,null,2)+'\n','utf8');"
}

# 4. THE SWALLOW CHECK. bankHolidays is left completely untouched. A genuine
#    Tuesday mismatch is injected into a live landing page, the same
#    defect class as the original 6.3 finding, on a date nowhere near any
#    listed holiday. The bank-holiday awareness must not be able to excuse
#    this: check-opening-hours.js does not consult dates2026 when comparing
#    a page's visible row to branches.json at all, so this proves the two
#    code paths stay separate rather than the labelling logic creeping into
#    the comparison logic.
Run-Case 'genuine Tuesday hours mismatch, no holiday nearby' 'catch' {
  (Get-Content $PAGE -Raw) -replace [regex]::Escape('<strong>Tuesday:</strong> 9am to 1pm, 2pm to 6pm'), '<strong>Tuesday:</strong> 2pm to 6pm' | Set-Content $PAGE -NoNewline
}

# --- MUST PASS (false-positive guards) -------------------------------------

# 5. The untouched tree.
Run-Case 'untouched tree' 'pass' { }

# 6. A legitimate addition to dates2026 (a real future ISO date) must not
#    itself trip anything - the rule polices shape and uniqueness, not the
#    number of dates carried.
Run-Case 'legitimate new date appended to dates2026' 'pass' {
  node -e "var fs=require('fs');var d=JSON.parse(fs.readFileSync('branches.json','utf8'));d.bankHolidays.dates2026.push('2027-01-01');fs.writeFileSync('branches.json',JSON.stringify(d,null,2)+'\n','utf8');"
}

Write-Output ''
Write-Output 'BANK HOLIDAY (ITEM 6.7) NEGATIVE TESTS'
Write-Output '---------------------------------------'
$results | ForEach-Object { Write-Output ('  ' + $_) }
Write-Output ''
$wrong = ($results | Where-Object { $_ -like '*WRONG*' -or $_ -like '*SETUP FAILED*' }).Count
Write-Output ("  " + $results.Count + " cases, " + $wrong + " unexpected")
