$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css'
$add = @"

/* 输入框与内容卡片宽度自适应容器 */
#toolbox-root input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']):not([type='file']),
#toolbox-root textarea,
#toolbox-root select{width:100%;max-width:100%;box-sizing:border-box}
"@
[System.IO.File]::AppendAllText($p, $add, $enc)
Write-Output 'done'
