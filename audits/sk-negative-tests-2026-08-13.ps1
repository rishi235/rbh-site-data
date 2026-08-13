# Negative tests for audits/sk-independent-2026-08-13.js (item 3.8, run 150).
# A checker that has never failed has not been shown to work. Each test injects
# one real fault into a real file, confirms the script fails, and reverts with
# git checkout in a finally block so a crash cannot leave the repo dirty.
$ErrorActionPreference = 'Stop'
Set-Location 'C:\Dev\rbh-site-data'

function Invoke-NegTest {
  param([string]$Name, [string]$File, [string]$Find, [string]$Replace)
  try {
    $p = Join-Path 'C:\Dev\rbh-site-data' $File
    # Read and write as no-BOM UTF-8 via .NET rather than Get-Content /
    # Set-Content. Windows PowerShell 5.1 writes ANSI by default, so an
    # injected em dash landed as byte 0x97 and node, reading the file as UTF-8,
    # saw a replacement character instead of U+2014. The dash test then
    # reported MISS and looked like a hole in the checker when it was a fault
    # in this harness. Anything injecting a non-ASCII character has to control
    # the encoding on both sides.
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $raw = [System.IO.File]::ReadAllText($p, $utf8)
    if ($raw -notmatch [regex]::Escape($Find)) {
      Write-Output "SETUP FAIL  $Name - anchor not present in $File"
      return
    }
    [System.IO.File]::WriteAllText($p, ($raw -replace [regex]::Escape($Find), $Replace), $utf8)
    $null = node 'audits\sk-independent-2026-08-13.js' 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Output "PASS  $Name - injected fault was caught" }
    else { Write-Output "MISS  $Name - injected fault passed unnoticed" }
  }
  finally {
    git checkout -- $File | Out-Null
  }
}

Invoke-NegTest 'wrong phone digit on a service page' `
  'modules\service\pages\uti-treatment-sk-chemists-bootle.html' `
  '0151 944 1013' '0151 944 1014'

Invoke-NegTest 'another branch postcode on a service page' `
  'modules\service\pages\shingles-treatment-sk-chemists-bootle.html' `
  '516 Stanley Road, Bootle, L20 5DW' '516 Stanley Road, Bootle, L20 9HH'

Invoke-NegTest 'JSON-LD url points at another page' `
  'modules\service\pages\earache-treatment-sk-chemists-bootle.html' `
  '/earache-treatment-sk-chemists-bootle.html",' '/earache-treatment-smartts-bootle.html",'

Invoke-NegTest 'sheet SEO title diverges from the page comment' `
  'modules\service\pages\SEO.md' `
  'UTI treatment in Bootle - SK Chemists' 'UTI treatment in Aintree - Hirshmans Pharmacy'

# Targets a SERVICE page, not the switch page. Another process on this box
# holds a SHARED read handle on switch-prescriptions-sk-chemists-bootle.html.
# That is enough to fail Set-Content and any exclusive open, which aborted this
# suite before its last two tests ran, but it does NOT block the generator:
# build-switch-pages.js rewrote that same file byte-identically at 08:42:37 on
# 2026-08-13 while the handle was still open, because node's writeFileSync asks
# for compatible sharing. So this is a quirk of how this harness writes, not a
# repo defect and not a block on any build. Recorded in AGENT_LOG.md.
Invoke-NegTest 'em dash injected into visible page copy' `
  'modules\service\pages\sinusitis-treatment-sk-chemists-bootle.html' `
  'Real people, not a call centre' ('Real people ' + [char]0x2014 + ' not a call centre')

Invoke-NegTest 'hard-coded widget id on a service page' `
  'modules\service\pages\uti-treatment-sk-chemists-bootle.html' `
  '<div id="rbhsv-booking"' '<div data-widget="66b9d657d71f677c6d5e602b" id="rbhsv-booking"'

Write-Output ''
Write-Output 'Worktree state after the run (should be empty):'
git status --short
