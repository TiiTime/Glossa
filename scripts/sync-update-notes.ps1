# Embed the complete release history in updates.html, including both languages.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$notes = Get-Content -LiteralPath (Join-Path $root 'release-notes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$htmlPath = Join-Path $root 'updates.html'
$html = [IO.File]::ReadAllText($htmlPath)
$sections = foreach ($release in $notes.releases) {
    $version = [Net.WebUtility]::HtmlEncode([string]$release.version)
    if ($release.de.Count -ne $release.en.Count) { throw "Release $version needs matching DE/EN entries." }
    $items = for ($i = 0; $i -lt $release.de.Count; $i++) {
        $de = [Net.WebUtility]::HtmlEncode([string]$release.de[$i])
        $en = [Net.WebUtility]::HtmlEncode([string]$release.en[$i])
        "<li data-en=`"$en`">$de</li>"
    }
    "<section class=`"release-group`" data-release-version=`"$version`"><h3>Version $version</h3><ul>$($items -join "`n")</ul></section>"
}
$pattern = '(?s)(<!-- release-notes:start -->).*?(<!-- release-notes:end -->)'
if (-not [regex]::IsMatch($html, $pattern)) { throw 'Missing release-note markers in updates.html.' }
$replacement = "<!-- release-notes:start -->`n$($sections -join "`n")`n<!-- release-notes:end -->"
$html = [regex]::Replace($html, $pattern, [Text.RegularExpressions.MatchEvaluator]{ param($match) $replacement })
[IO.File]::WriteAllText($htmlPath, $html, [Text.UTF8Encoding]::new($false))
