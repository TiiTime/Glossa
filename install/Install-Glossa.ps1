# Glossa installer — downloads extension, extracts locally, opens Brave/Chrome extensions page.
# Brave/Chrome block fully silent installs for non-store extensions (security).
$ErrorActionPreference = 'Stop'

$Repo = 'TiiTime/Glossa'
$InstallDir = Join-Path $env:LOCALAPPDATA 'Glossa\extension'
$TempZip = Join-Path $env:TEMP 'glossa-extension-download.zip'
$TempExtract = Join-Path $env:TEMP 'glossa-extension-extract'

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }

function Get-DownloadUrl {
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ 'User-Agent' = 'Glossa-Installer' }
        $asset = $release.assets | Where-Object { $_.name -eq 'glossa-extension.zip' } | Select-Object -First 1
        if ($asset.browser_download_url) { return $asset.browser_download_url }
    } catch { }

    return "https://github.com/$Repo/archive/refs/heads/master.zip"
}

function Expand-Extension($zipPath, $destDir) {
    if (Test-Path $TempExtract) { Remove-Item $TempExtract -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $TempExtract -Force

    $manifest = Get-ChildItem -Path $TempExtract -Recurse -Filter 'manifest.json' | Select-Object -First 1
    if (-not $manifest) { throw 'manifest.json not found in download.' }

    $srcDir = $manifest.Directory.FullName
    if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Copy-Item -Path (Join-Path $srcDir '*') -Destination $destDir -Recurse -Force
}

function Open-BrowserExtensions {
    $candidates = @(
        @{ Name = 'Brave'; Exe = "${env:ProgramFiles}\BraveSoftware\Brave-Browser\Application\brave.exe"; Url = 'brave://extensions' },
        @{ Name = 'Brave (x86)'; Exe = "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe"; Url = 'brave://extensions' },
        @{ Name = 'Chrome'; Exe = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"; Url = 'chrome://extensions' },
        @{ Name = 'Chrome (x86)'; Exe = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"; Url = 'chrome://extensions' }
    )
    foreach ($b in $candidates) {
        if (Test-Path $b.Exe) {
            Start-Process $b.Exe $b.Url
            return $b.Name
        }
    }
    Start-Process 'https://github.com/TiiTime/Glossa#installation-brave--chrome'
    return 'Browser (manual)'
}

Write-Host '=== Glossa Installer ===' -ForegroundColor Green
Write-Host "By Tii — free hover translator`n"

Write-Step 'Downloading latest Glossa...'
$url = Get-DownloadUrl
Invoke-WebRequest -Uri $url -OutFile $TempZip -UseBasicParsing
Write-Host "Downloaded: $url"

Write-Step "Installing to: $InstallDir"
Expand-Extension -zipPath $TempZip -destDir $InstallDir

Write-Step 'Opening extensions page...'
$browser = Open-BrowserExtensions

$msg = @"
Glossa wurde nach diesem Ordner installiert:

$InstallDir

Letzte Schritte (einmalig):
1. Entwicklermodus aktivieren (oben rechts)
2. „Entpackte Erweiterung laden“ klicken
3. Den Ordner oben auswählen

Hinweis: Brave/Chrome erlauben kein vollautomatisches Installieren
ohne Chrome Web Store — aus Sicherheitsgründen.

Browser: $browser
"@

Write-Host $msg -ForegroundColor Yellow
[System.Windows.Forms.MessageBox]::Show($msg, 'Glossa — Installation', 'OK', 'Information') | Out-Null

# Copy path to clipboard (optional convenience)
try {
    Set-Clipboard -Value $InstallDir
    Write-Host 'Installationspfad wurde in die Zwischenablage kopiert.' -ForegroundColor DarkGray
} catch { }

Write-Host "`nFertig." -ForegroundColor Green
