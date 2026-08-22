$enc = [System.Text.Encoding]::UTF8
$src = [System.IO.File]::ReadAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/index.html', $enc)
Write-Output ('index length: ' + $src.Length)
$bodyM = [regex]::Match($src, '(?s)<body[^>]*>(.*?)</body>')
$body = $bodyM.Groups[1].Value
Write-Output ('body length: ' + $body.Length)
Write-Output ('body has page-analyzer: ' + $body.Contains('page-analyzer'))
$idx = $src.IndexOf('page-analyzer')
Write-Output ('page-analyzer at index: ' + $idx + ' / body starts at: ' + $bodyM.Groups[1].Index)
# 找出 body 内所有的 script 标签位置
$rx = [regex]'<script[^>]*>'
foreach ($m in $rx.Matches($src)) {
  Write-Output ('script tag at ' + $m.Index + ': ' + $m.Value)
}
