# Regenerates extension icons from webstore/assets/glossa-logo-source.png
$ErrorActionPreference = 'Stop'
$export = Join-Path $PSScriptRoot 'export-store-assets.ps1'
if (-not (Test-Path $export)) {
    Write-Error "Missing $export"
}
& $export
