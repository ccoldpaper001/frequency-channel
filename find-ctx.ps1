$enc = [System.Text.Encoding]::UTF8
$src = [System.IO.File]::ReadAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/index.html', $enc)
$i = $src.IndexOf('page-component')
while ($i -ge 0) {
  $start = [Math]::Max(0, $i - 150)
  $chunk = $src.Substring($start, [Math]::Min(220, $src.Length - $start))
  $chunk = $chunk -replace "`r", '' -replace "`n", ' '
  Write-Output ('...' + $chunk + '...')
  Write-Output '---'
  $i = $src.IndexOf('page-component', $i + 1)
}
