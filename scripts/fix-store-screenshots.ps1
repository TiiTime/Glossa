# Ensures Chrome Web Store screenshots: exactly 1280x800, 24-bit PNG, no alpha.
# Optionally strips bottom-right version badge from exported screenshots.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$assets = Join-Path $root 'webstore\assets'
$bg = [System.Drawing.Color]::FromArgb(30, 30, 46)

function Clear-BottomRightBadge([System.Drawing.Graphics]$g, [int]$w, [int]$h) {
    $bw = [Math]::Min(300, [int]($w * 0.24))
    $bh = [Math]::Min(110, [int]($h * 0.14))
    $x = $w - $bw
    $y = $h - $bh
    $rect = New-Object System.Drawing.Rectangle $x, $y, $bw, $bh
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        $rect,
        [System.Drawing.Color]::FromArgb(17, 17, 27),
        [System.Drawing.Color]::FromArgb(24, 24, 37),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()
}

function Save-StoreScreenshot([string]$srcPath, [string]$destPath, [int]$w, [int]$h, [switch]$StripBadge) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $tmp = "$destPath.fixing.png"
    try {
        $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear($bg)

        $scale = [Math]::Min($w / $src.Width, $h / $src.Height)
        $nw = [int][Math]::Round($src.Width * $scale)
        $nh = [int][Math]::Round($src.Height * $scale)
        $x = [int](($w - $nw) / 2)
        $y = [int](($h - $nh) / 2)
        $g.DrawImage($src, $x, $y, $nw, $nh)
        if ($StripBadge) { Clear-BottomRightBadge $g $w $h }
        $g.Dispose()
        $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
    } finally {
        $src.Dispose()
    }

    if (Test-Path $destPath) { Remove-Item $destPath -Force }
    Move-Item -Force $tmp $destPath
    Write-Host "Fixed $destPath$(if ($StripBadge) { ' (badge stripped)' })"
}

$shots = @(
    @{ Name = 'screenshot-01-hover.png'; Strip = $true },
    @{ Name = 'screenshot-02-selection.png'; Strip = $true },
    @{ Name = 'screenshot-03-settings.png'; Strip = $false },
    @{ Name = 'promo-screenshot-1280x800.png'; Strip = $false }
)

foreach ($shot in $shots) {
    $path = Join-Path $assets $shot.Name
    if (-not (Test-Path $path)) {
        Write-Warning "Missing $path"
        continue
    }
    $params = @{
        srcPath   = $path
        destPath  = $path
        w         = 1280
        h         = 800
        StripBadge = $shot.Strip
    }
    Save-StoreScreenshot @params
}

$promoSmall = Join-Path $assets 'promo-tile-440x280.png'
if (Test-Path $promoSmall) {
    Save-StoreScreenshot $promoSmall $promoSmall 440 280
}

Write-Host 'Verifying:'
foreach ($shot in $shots) {
    $path = Join-Path $assets $shot.Name
    if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile($path)
        Write-Host "$($shot.Name) : $($img.Width)x$($img.Height) format=$($img.PixelFormat)"
        $img.Dispose()
    }
}

Write-Host 'Done.'
