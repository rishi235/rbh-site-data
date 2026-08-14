# Negative tests for check-opening-hours.js rule 7, added on the item 6.3
# quality pass, 2026-08-14 (two-hundred-and-second run).
#
# Rule 7: every clock time printed on a branch landing page must sit inside the
# opening hours card. The defect it closes: rules 1 to 6 read only the card and
# the JSON-LD, so an hours claim written anywhere else on the page was invisible
# to all 36 checkers.
#
# Each case mutates the tree, regenerates, runs the checker, then restores.
# Run from the repo root. Leaves the tree exactly as it found it.
#
# Note on Patch-File: the read must be materialised before the write. Piping
# Get-Content straight into Set-Content on the SAME path holds a read handle
# open and the write fails with a sharing violation, which silently turns every
# must-catch case into a false pass. That is how the first run of this script
# reported six wrong results.

Set-Location 'C:\Dev\rbh-site-data'

$GEN = 'tools\build-branch-landing-pages.js'
$CHK = 'tools\check-opening-hours.js'
$genBackup = [IO.File]::ReadAllText((Resolve-Path $GEN))
$chkBackup = [IO.File]::ReadAllText((Resolve-Path $CHK))
$results = @()

function Patch-File {
  param([string]$Path, [string]$Find, [string]$Replace)
  $full = (Resolve-Path $Path).Path
  $c = [IO.File]::ReadAllText($full)
  if (-not $c.Contains($Find)) { throw ("anchor not found in " + $Path + ": " + $Find.Substring(0,[Math]::Min(60,$Find.Length))) }
  [IO.File]::WriteAllText($full, $c.Replace($Find, $Replace))
}

function Rebuild {
  foreach($g in @('build-branch-landing-pages.js','build-contraception-pages.js','build-service-pages.js','build-switch-pages.js','build-travel-clinic-pages.js','build-weight-loss-pages.js')){
    $null = & node ("tools\" + $g) 2>&1
  }
}

function Run-Case {
  param([string]$Name, [ValidateSet('catch','pass')][string]$Expect, [scriptblock]$Mutate)
  $err = $null
  try { & $Mutate } catch { $err = $_.Exception.Message }
  if ($err) {
    $script:results += ("{0,-58} SETUP FAILED: {1}" -f $Name, $err)
  } else {
    Rebuild
    $null = & node $CHK 2>&1
    $caught = ($LASTEXITCODE -ne 0)
    $verdict = if(($Expect -eq 'catch') -eq $caught){'AS EXPECTED'}else{'*** WRONG ***'}
    $got = if($caught){'caught'}else{'passed'}
    $script:results += ("{0,-58} expect={1,-6} got={2,-6} {3}" -f $Name,$Expect,$got,$verdict)
  }
  [IO.File]::WriteAllText((Resolve-Path $GEN).Path, $genBackup)
  [IO.File]::WriteAllText((Resolve-Path $CHK).Path, $chkBackup)
  git checkout -- branches.json 2>&1 | Out-Null
  Rebuild
}

# --- MUST CATCH ------------------------------------------------------------

# 1. The defect itself: an FAQ answer claiming straight-through hours, the
#    Smartts Mon-Fri 9am-6pm fault, on branches that close for lunch.
Run-Case 'FAQ prose hours claim (the defect)' 'catch' {
  Patch-File $GEN "'            <details><summary>Where do I park?" `
    "'            <details><summary>What time are you open?</summary><div class=`"answer`">We are open Monday to Friday, 9am to 6pm.</div></details>\n' +`r`n    '            <details><summary>Where do I park?"
}

# 2. A time hidden in an ATTRIBUTE only, never rendered as visible text.
#    Published to Google and to a screen reader just the same.
Run-Case 'time in a title attribute only (not visible text)' 'catch' {
  Patch-File $GEN "'            <h2 class=`"h2`">Opening hours</h2>\n' +" `
    "'            <h2 class=`"h2`" title=`"Open until 6pm`">Opening hours</h2>\n' +"
}

# 3. A time in the hero copy, above the card.
Run-Case 'time in hero copy above the card' 'catch' {
  Patch-File $GEN "'      <div class=`"trust-item`"><strong>Private consultation room</strong>" `
    "'      <div class=`"trust-item`"><strong>Open from 8.30am</strong><span>Early start</span></div>\n' +`r`n    '      <div class=`"trust-item`"><strong>Private consultation room</strong>"
}

# 4. Minutes written with a full stop, the house style ("1.30pm"), so the
#    reader is not fooled by the punctuation the site writes itself.
Run-Case 'time with full-stop minutes (1.30pm)' 'catch' {
  Patch-File $GEN "'            <details><summary>Where do I park?" `
    "'            <details><summary>Lunch?</summary><div class=`"answer`">We close at 1.30pm for lunch.</div></details>\n' +`r`n    '            <details><summary>Where do I park?"
}

# 5. A stale exception key must itself fail, so the list cannot rot into a
#    blanket exemption.
Run-Case 'stale KNOWN_TIME_OUTSIDE_CARD key' 'catch' {
  Patch-File $CHK 'var KNOWN_TIME_OUTSIDE_CARD = {};' `
    'var KNOWN_TIME_OUTSIDE_CARD = { "pharmacy-mccanns-aigburth.html::3pm": "Q99 never agreed" };'
}

# 6. Coverage floor: a reader that finds nothing must not pass everything.
Run-Case 'coverage floor when the time reader matches nothing' 'catch' {
  Patch-File $CHK 'var TIME_RE = /\b\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)\b/gi;' `
    'var TIME_RE = /\bZZZNEVERMATCHESZZZ\b/gi;'
}

# 7. If the card markup changes so the card stops being blanked, the checker
#    must fail loudly rather than fall silently open.
Run-Case 'card row markup changed (must not fail open)' 'catch' {
  Patch-File $GEN "'<div class=`"contact-line`"><p><strong>' + esc(r[0]) + ':</strong> ' + esc(r[1]) + '</p></div>'" `
    "'<div class=`"contact-line`"><p><b>' + esc(r[0]) + ':</b> ' + esc(r[1]) + '</p></div>'"
}

# --- MUST PASS (false-positive guards) -------------------------------------

# 8. The untouched tree.
Run-Case 'untouched tree' 'pass' { }

# 9. An exception key that genuinely matches is honoured, on every page that
#    carries the copy.
Run-Case 'matching KNOWN_TIME_OUTSIDE_CARD entry is honoured' 'pass' {
  Patch-File $GEN "'            <details><summary>Where do I park?" `
    "'            <details><summary>Deliveries</summary><div class=`"answer`">Order by 3pm for next-day delivery.</div></details>\n' +`r`n    '            <details><summary>Where do I park?"
  $keys = @()
  foreach($f in @('pharmacy-fishlocks-ainsdale.html','pharmacy-fishlocks-eccleston.html','pharmacy-mccanns-aigburth.html','pharmacy-mccanns-sandringham.html','pharmacy-scorah-bramhall.html','pharmacy-scorah-hazel-grove.html')){
    $keys += ('"' + $f + '::3pm": "Q99 delivery cut-off, not an opening time"')
  }
  Patch-File $CHK 'var KNOWN_TIME_OUTSIDE_CARD = {};' ('var KNOWN_TIME_OUTSIDE_CARD = { ' + ($keys -join ', ') + ' };')
}

# 10. A legitimate hours change in the DATA must still pass: rule 7 polices
#     where a time is printed, not what it says, so a real edit regenerates
#     cleanly and does not trip it.
Run-Case 'legitimate hours edit in branches.json regenerates clean' 'pass' {
  node -e "var fs=require('fs');var d=JSON.parse(fs.readFileSync('branches.json','utf8'));for(var i=0;i<d.branches.length;i++){if(d.branches[i].id==='mccanns_aigburth'){var s=d.branches[i].openingHours.specification;for(var j=0;j<s.length;j++){if(s[j].closes==='18:00')s[j].closes='17:30';}}}fs.writeFileSync('branches.json',JSON.stringify(d,null,2)+'\n','utf8');"
}

# 11. A 24-hour time inside the JSON-LD block must not be swept, or every page
#     would flag its own schema.
Run-Case 'JSON-LD 24-hour times are not swept' 'pass' { }

Write-Output ''
Write-Output 'RULE 7 NEGATIVE TESTS'
Write-Output '---------------------'
$results | ForEach-Object { Write-Output ('  ' + $_) }
Write-Output ''
$wrong = ($results | Where-Object { $_ -like '*WRONG*' -or $_ -like '*SETUP FAILED*' }).Count
Write-Output ("  " + $results.Count + " cases, " + $wrong + " unexpected")
