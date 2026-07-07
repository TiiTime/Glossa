# Rebuilds all Chrome Web Store screenshots and promo images.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$render = Join-Path $PSScriptRoot 'render-html-screenshot.ps1'

Write-Host 'Exporting from source PNGs...'
& (Join-Path $PSScriptRoot 'export-store-assets.ps1')

Write-Host 'Rendering settings screenshot...'
& $render `
    -HtmlFile (Join-Path $root 'webstore\assets\settings-screenshot.html') `
    -OutFile (Join-Path $root 'webstore\assets\screenshot-03-settings.png')

Write-Host 'Rendering promo screenshot (1280x800)...'
& $render `
    -HtmlFile (Join-Path $root 'webstore\assets\promo-screenshot.html') `
    -OutFile (Join-Path $root 'webstore\assets\promo-screenshot-1280x800.png')

Write-Host 'Fixing dimensions / stripping badges...'
& (Join-Path $PSScriptRoot 'fix-store-screenshots.ps1')

Write-Host 'All store assets ready.'
