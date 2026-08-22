$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/config.js'
$c = [System.IO.File]::ReadAllText($p, $enc)
$old = "xhr.open('GET','data.json',false);"
$new = "xhr.open('GET',(window.__TOOLBOX_DIR__||'')+'data.json',false);"
if ($c.Contains($old)) {
  $c = $c.Replace($old, $new)
  [System.IO.File]::WriteAllText($p, $c, $enc)
  Write-Output 'patched'
} else {
  Write-Output 'pattern not found'
}
