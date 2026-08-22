$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css'
$add = @"

/* 复选框/选项文字统一左对齐 */
#toolbox-root label{text-align:left;justify-content:flex-start}
#toolbox-root input[type='checkbox'],#toolbox-root input[type='radio']{width:auto;flex-shrink:0}
"@
[System.IO.File]::AppendAllText($p, $add, $enc)
Write-Output 'done'
