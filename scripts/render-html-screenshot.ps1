# Renders an HTML mockup to PNG via headless Chrome (Chrome Web Store dimensions).
param(
    [Parameter(Mandatory = $true)][string]$HtmlFile,
    [Parameter(Mandatory = $true)][string]$OutFile,
    [int]$Width = 1280,
    [int]$Height = 800
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$html = if ([System.IO.Path]::IsPathRooted($HtmlFile)) { $HtmlFile } else { Join-Path $root $HtmlFile }
$out = if ([System.IO.Path]::IsPathRooted($OutFile)) { $OutFile } else { Join-Path $root $OutFile }
$tmp = "$out.rendering.png"

if (-not (Test-Path $html)) {
    Write-Error "Missing $html"
}

$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
)
$browser = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) {
    Write-Error 'Chrome or Edge not found.'
}

$htmlPath = (Resolve-Path $html).Path -replace '\\', '/'
$tmpPath = $tmp -replace '\\', '/'
$fileUrl = "file:///$htmlPath"

if (Test-Path $tmp) { Remove-Item $tmp -Force }

$browserArgs = @(
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    "--window-size=$Width,$Height",
    '--virtual-time-budget=2500',
    '--run-all-compositor-stages-before-draw',
    "--screenshot=$tmpPath",
    $fileUrl
)
& $browser @browserArgs | Out-Null

if (-not (Test-Path $tmp)) {
    Write-Error "Screenshot not created: $tmp"
}

if (Test-Path $out) { Remove-Item $out -Force }
Move-Item -Force $tmp $out
Write-Host "Wrote $out ($Width x $Height)"
