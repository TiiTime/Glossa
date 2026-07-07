# Renders webstore/assets/screenshot-03-settings.png from settings-screenshot.html (1280x800).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$render = Join-Path $PSScriptRoot 'render-html-screenshot.ps1'

& $render `
    -HtmlFile (Join-Path $root 'webstore\assets\settings-screenshot.html') `
    -OutFile (Join-Path $root 'webstore\assets\screenshot-03-settings.png')

& (Join-Path $PSScriptRoot 'fix-store-screenshots.ps1')
