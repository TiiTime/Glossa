# Builds glossa-extension.zip for GitHub Releases (extension root at zip top level).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'glossa-extension'
$zip = Join-Path $dist 'glossa-extension.zip'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$files = @(
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js',
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
