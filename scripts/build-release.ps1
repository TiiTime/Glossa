# Builds glossa-extension.zip for GitHub Releases (extension root at zip top level).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'glossa-extension'
$zip = Join-Path $dist 'glossa-extension.zip'

$manifest = Get-Content -LiteralPath (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$releaseNotes = Get-Content -LiteralPath (Join-Path $root 'release-notes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($releaseNotes.version -ne $manifest.version) {
    throw 'release-notes.json version must match manifest.json before packaging.'
}

& (Join-Path $PSScriptRoot 'sync-update-notes.ps1')

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$files = @(
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
    'languages.js',
    'updates.html',
    'updates.css',
    'updates.js',
    'release-notes.json',
    'LICENSE'
)
foreach ($f in $files) {
    Copy-Item (Join-Path $root $f) (Join-Path $stage $f)
}
Copy-Item (Join-Path $root 'icons') (Join-Path $stage 'icons') -Recurse

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -Force

Write-Host "Built: $zip"
Get-Item $zip | Format-List FullName, Length, LastWriteTime
