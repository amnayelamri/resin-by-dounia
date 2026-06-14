Add-Type -AssemblyName System.Drawing

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Creer l'icone RD (32x32) ──────────────────────────────────────────────────
$size = 64
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Fond transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Cercle blush (#f2ddd5)
$blush = [System.Drawing.Color]::FromArgb(255, 242, 221, 213)
$brushBg = New-Object System.Drawing.SolidBrush($blush)
$g.FillEllipse($brushBg, 1, 1, $size - 3, $size - 3)

# Contour dore leger (#c9a96e)
$gold = [System.Drawing.Color]::FromArgb(80, 201, 169, 110)
$penGold = New-Object System.Drawing.Pen($gold, 1.5)
$g.DrawEllipse($penGold, 1, 1, $size - 3, $size - 3)

# Texte "RD" (#2c1810)
$dark      = [System.Drawing.Color]::FromArgb(255, 44, 24, 16)
$brushText = New-Object System.Drawing.SolidBrush($dark)
$fontStyle = [System.Drawing.FontStyle]::Regular

# Essaie Georgia, sinon Times New Roman, sinon serif generique
$fontFamilies = @("Georgia", "Times New Roman", "Palatino Linotype", "Serif")
$font = $null
foreach ($ff in $fontFamilies) {
    try {
        $testFont = New-Object System.Drawing.Font($ff, 20, $fontStyle)
        if ($testFont.Name -eq $ff) { $font = $testFont; break }
        $testFont.Dispose()
    } catch {}
}
if ($null -eq $font) {
    $font = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
}

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 2, $size, $size)
$g.DrawString("RD", $font, $brushText, $rect, $sf)

$font.Dispose()
$g.Dispose()

# Sauvegarder en ICO
$iconPath = Join-Path $projectPath "resin-rd.ico"
$hIcon    = $bmp.GetHicon()
$icon     = [System.Drawing.Icon]::FromHandle($hIcon)
$fs       = New-Object System.IO.FileStream($iconPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp.Dispose()

Write-Host "  Icone creee : $iconPath" -ForegroundColor Cyan

# ── Creer le raccourci sur le bureau ──────────────────────────────────────────
$desktop      = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Resin by Dounia.lnk"
$startBat     = Join-Path $projectPath "start.bat"

$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath       = $startBat
$sc.WorkingDirectory = $projectPath
$sc.IconLocation     = "$iconPath,0"
$sc.Description      = "Resin by Dounia - Lancer les serveurs"
$sc.WindowStyle      = 1
$sc.Save()

Write-Host ""
Write-Host "  Raccourci cree sur le bureau !" -ForegroundColor Green
Write-Host "  $shortcutPath" -ForegroundColor White
Write-Host ""
