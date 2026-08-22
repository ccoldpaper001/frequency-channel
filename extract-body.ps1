$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/index.html'
$src = [System.IO.File]::ReadAllText($p, $enc)
$bodyStart = [regex]::Match($src, '<body[^>]*>').Index
$bodyStartTag = [regex]::Match($src, '<body[^>]*>').Value.Length + $bodyStart
$bodyEnd = $src.LastIndexOf('</body>')
$body = $src.Substring($bodyStartTag, $bodyEnd - $bodyStartTag)
# 只移除真正的外链脚本标签
$body = [regex]::Replace($body, '(?s)<script[^>]*src=[^>]*>\s*</script>', '')
[System.IO.File]::WriteAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/body.html', $body, $enc)
foreach ($id in @('page-ai','page-manual','page-component','page-analyzer','page-codegen','page-replace','page-htmledit','page-svgconv','page-selectors','page-memory')) {
  Write-Output ($id + ': ' + $body.Contains($id))
}
Write-Output ('length: ' + $body.Length)
