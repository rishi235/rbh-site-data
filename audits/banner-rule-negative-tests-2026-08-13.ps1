# Negative tests for RULE 11 in tools/check-switch-copy.js
# (item 3.3 quality pass, 2026-08-13). Every test mutates, runs, then restores.
# A rule that cannot be made to fail is not a rule.
Set-Location 'C:\Dev\rbh-site-data'

$checker = 'tools\check-switch-copy.js'
$bdir    = 'modules\switch\pages\banners'
$fish    = "$bdir\switch-prescriptions-fishlocks-ainsdale.txt"

function Run-Checker {
    param($label, $expectFail, $mustMatch)
    $out = (& node $checker 2>&1 | Out-String) -replace '\s+', ' '
    $code = $LASTEXITCODE
    $failed = ($code -ne 0)
    $ok = ($failed -eq $expectFail)
    if ($ok -and $mustMatch) { $ok = ($out -match $mustMatch) }
    Write-Host ("{0,-4} {1,-52} exit={2} {3}" -f $(if($ok){"PASS"}else{"BAD "}), $label, $code, $(if($ok){""}else{"<-- UNEXPECTED"}))
    if (-not $ok) { Write-Host ($out.Trim()) }
}

Write-Host "RULE 11 negative tests"
Write-Host "----------------------"

Run-Checker "T0 baseline, unmutated" $false 'OK - 15 switch page'

# T1 - a banner pointing at the sister branch's switch page.
Copy-Item $fish "$fish.bak"
(Get-Content $fish -Raw).Replace(
  '/switch-prescriptions-fishlocks-ainsdale.html',
  '/switch-prescriptions-fishlocks-eccleston.html') | Set-Content $fish -NoNewline
Run-Checker "T1 banner points at sister branch" $true 'another branch'
Move-Item "$fish.bak" $fish -Force

# T2 - a banner with no SWITCH_URL at all.
Copy-Item $fish "$fish.bak"
(Get-Content $fish -Raw) -replace 'var\s+SWITCH_URL\s*=\s*"[^"]+"', 'var SWITCH_URL_GONE = "x"' |
  Set-Content $fish -NoNewline
Run-Checker "T2 banner declares no SWITCH_URL" $true 'declares no SWITCH_URL'
Move-Item "$fish.bak" $fish -Force

# T3 - a banner file that resolves to no live branch.
Rename-Item $fish 'switch-prescriptions-fishlocks-nowhere.txt'
Run-Checker "T3 banner resolves to no live branch" $true 'resolves to no live branch'
Rename-Item "$bdir\switch-prescriptions-fishlocks-nowhere.txt" 'switch-prescriptions-fishlocks-ainsdale.txt'

# T4 - the folder emptied, so the rules would cover nothing.
Rename-Item $bdir 'banners-held'
Run-Checker "T4 banners folder missing" $true 'cover nothing'
Rename-Item 'modules\switch\pages\banners-held' 'banners'

# T5 - the decisive one. Drop one KNOWN entry while the conflict still exists.
# If 11b were a no-op, removing its excuse would change nothing and the run
# would stay green. It must go red, naming the shared host.
Copy-Item $checker "$checker.bak"
$src = [IO.File]::ReadAllText((Resolve-Path $checker))
$src = $src.Replace('"banner-shared-host::www.fishlockpharmacy.co.uk":',
                    '"banner-shared-host::DISABLED-FOR-TEST":')
[IO.File]::WriteAllText((Resolve-Path $checker), $src)
Run-Checker "T5 11b fires when its KNOWN excuse is removed" $true 'fishlockpharmacy.co.uk'
Move-Item "$checker.bak" $checker -Force

Run-Checker "T6 restored, clean again" $false 'OK - 15 switch page'
Write-Host "----------------------"
& git status --porcelain $bdir $checker
Write-Host "(no output above means every mutation was restored)"
