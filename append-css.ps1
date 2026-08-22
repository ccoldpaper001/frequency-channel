$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css'
$add = @"

/* 自适应居中：以网页视口为基准 */
#toolbox-root .main-content{width:100%;display:block}
#toolbox-root .page.active{max-width:min(1000px,100%);margin-left:auto;margin-right:auto;width:100%}
"@
[System.IO.File]::AppendAllText($p, $add, $enc)
Write-Output 'done'
