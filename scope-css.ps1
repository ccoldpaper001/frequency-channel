$enc = [System.Text.Encoding]::UTF8
$css = [System.IO.File]::ReadAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/styles.css', $enc)

$rx = New-Object System.Text.RegularExpressions.Regex('([^{}]+)\{([^{}]*)\}')
$ev = {
  param($m)
  $sel = $m.Groups[1].Value
  if ($sel -match '@') { return $m.Value }
  $parts = ($sel -split ',') | ForEach-Object {
    $s = $_.Trim()
    if ($s -eq '') { return $s }
    if ($s -eq ':root' -or $s -eq 'body' -or $s -eq 'html') { '#toolbox-root' }
    elseif ($s.StartsWith('#toolbox-root')) { $s }
    else { '#toolbox-root ' + $s }
  }
  ($parts -join ',') + '{' + $m.Groups[2].Value + '}'
}
$out = $rx.Replace($css, $ev)
$out += "`n/* 嵌入模式：隐藏工具箱自带侧边栏 */`n#toolbox-root .sidebar{display:none}`n#toolbox-root .main-content{margin-left:0}`n"
[System.IO.File]::WriteAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css', $out, $enc)
Write-Output ('scoped bytes: ' + (Get-Item 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css').Length)
