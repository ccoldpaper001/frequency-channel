$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css'
$add = @"

/* 选择符卡片（打钩项）文字左对齐 */
#toolbox-root .ai-sel-item{text-align:left;justify-content:flex-start}

/* 工具页面内容水平居中 */
#toolbox-root .page.active{max-width:960px;margin:0 auto}
#toolbox-root .main-content{padding:16px}
"@
[System.IO.File]::AppendAllText($p, $add, $enc)
Write-Output 'done'
