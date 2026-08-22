$enc = [System.Text.Encoding]::UTF8
$b = [System.IO.File]::ReadAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/body.html', $enc)
# 统计 page 内的高频容器 class
$classes = @{}
foreach ($m in [regex]::Matches($b, 'class="([^"]+)"')) {
  foreach ($c in ($m.Groups[1].Value -split '\s+')) {
    if ($c) { $classes[$c] = 1 + $(if ($classes.ContainsKey($c)) { $classes[$c] } else { 0 }) }
  }
}
$classes.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 40 | ForEach-Object { Write-Output ($_.Name + ' x' + $_.Value) }
