Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
foreach ($size in 16, 48, 128) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(30, 30, 46))
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(137, 180, 250))
    $fontSize = [Math]::Max(8, [int]($size * 0.55))
    $font = New-Object System.Drawing.Font 'Segoe UI', $fontSize, ([System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $g.DrawString('G', $font, $brush, $rect, $sf)
    $g.Dispose()
    $path = Join-Path $dir "icon$size.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Wrote $path"
}
