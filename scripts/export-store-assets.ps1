# Resize logo and store assets to required dimensions.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$assets = Join-Path $root 'webstore\assets'
$logo = Join-Path $assets 'glossa-logo-source.png'

if (-not (Test-Path $logo)) {
    Write-Error "Missing $logo - place the logo source image first."
}

function Save-Resize($srcPath, $destPath, $w, $h) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::FromArgb(30, 30, 46))
    $scale = [Math]::Min($w / $img.Width, $h / $img.Height)
    $nw = [int]($img.Width * $scale)
    $nh = [int]($img.Height * $scale)
    $x = ($w - $nw) / 2
    $y = ($h - $nh) / 2
    $g.DrawImage($img, $x, $y, $nw, $nh)
    $g.Dispose()
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Wrote $destPath"
}

New-Item -ItemType Directory -Force -Path $assets | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $root 'icons') | Out-Null

foreach ($size in 16, 48, 128) {
    Save-Resize $logo (Join-Path $root "icons\icon$size.png") $size $size
    if ($size -eq 128) {
        Save-Resize $logo (Join-Path $assets 'icon-128.png') 128 128
    }
}

# Promo / screenshots - scale source PNGs if present
$maps = @(
    @{ Src = 'glossa-screenshot-hover-source.png'; Dst = 'screenshot-01-hover.png'; W = 1280; H = 800 },
    @{ Src = 'glossa-screenshot-selection-source.png'; Dst = 'screenshot-02-selection.png'; W = 1280; H = 800 },
    @{ Src = 'glossa-promo-tile-source.png'; Dst = 'promo-tile-440x280.png'; W = 440; H = 280 }
)
foreach ($m in $maps) {
    $src = Join-Path $assets $m.Src
    if (Test-Path $src) {
        Save-Resize $src (Join-Path $assets $m.Dst) $m.W $m.H
    }
}

Write-Host 'Done.'
