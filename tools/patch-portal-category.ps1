# One-off: add the Digital / Website category to the portal's build.js via API.
$ErrorActionPreference = 'Stop'
$r = gh api repos/rishi235/rbh-data-portal/contents/build.js | ConvertFrom-Json
$txt = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($r.content))
if ($txt -match "id: 'digital'") { Write-Output 'already present'; exit 0 }
$newLine = "  { id: 'digital',         label: 'Digital / Website',          desc: 'Full Audit June 2026 - agent progress and questions' },"
$patched = $txt -replace "(?m)^(\s*\{ id: 'covenant'.*)$", ('$1' + "`n" + $newLine)
if ($patched -eq $txt) { Write-Output 'PATCH FAILED - covenant line not matched'; exit 1 }
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($patched))
$payload = @{ message = 'Add Digital / Website report category for audit status page'
              content = $b64; sha = $r.sha } | ConvertTo-Json
$tmp = Join-Path $env:TEMP 'bjs-patch.json'
[IO.File]::WriteAllText($tmp, $payload, [Text.UTF8Encoding]::new($false))
$res = gh api -X PUT repos/rishi235/rbh-data-portal/contents/build.js --input $tmp | ConvertFrom-Json
Remove-Item $tmp
Write-Output ('Patched build.js, commit ' + $res.commit.sha.Substring(0,7))
