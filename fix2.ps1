$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/tb.css'
$nl = [char]10
$c = [System.IO.File]::ReadAllText($p, $enc)
$c = $c + $nl + '/* fix: remove leftover sidebar offset */' + $nl
$c = $c + '#toolbox-root .main-content{margin-left:0 !important;width:auto;padding:0}' + $nl
$c = $c + '#toolbox-root .page.active{width:90%;margin:0 auto}' + $nl
[System.IO.File]::WriteAllText($p, $c, $enc)

# 版本号升到 21
$idx = [System.IO.File]::ReadAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/index.html', $enc)
$idx = $idx.Replace('style.css?v=20260822-20', 'style.css?v=20260822-21')
$idx = $idx.Replace('tb.css?v=20260822-20', 'tb.css?v=20260822-21')
$idx = $idx.Replace('app.js?v=20260822-20', 'app.js?v=20260822-21')
$idx = $idx.Replace('supabase-config.js?v=20260822-20', 'supabase-config.js?v=20260822-21')
[System.IO.File]::WriteAllText('C:/Users/cold paper/.zcode/workspace/default/frequency-channel/index.html', $idx, $enc)
Write-Output 'done'
