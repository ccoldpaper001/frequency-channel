$enc = [System.Text.Encoding]::UTF8
$p = 'C:/Users/cold paper/.zcode/workspace/default/frequency-channel/toolbox/scoped.css'
$add = @"

/* 排版模仿论坛：字体、卡片、按钮风格统一 */
#toolbox-root{font-family:'Microsoft YaHei',system-ui,sans-serif}
#toolbox-root .page-header{background:#fff;border:none;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:16px 20px;margin-bottom:20px}
#toolbox-root h2{font-size:17px}
#toolbox-root .ai-section,#toolbox-root .cp-section,#toolbox-root .mem-section{background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:20px;border:1px solid #fff}
#toolbox-root .ai-section-title{font-size:15px;font-weight:600;color:#222}
#toolbox-root .md-field{background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:20px;margin-bottom:20px;border:1px solid #fff}
#toolbox-root .br-single{border:1px solid #e8e8e8;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
#toolbox-root .btn{background:#111;color:#fff;border:none;border-radius:6px;padding:10px 18px;cursor:pointer}
#toolbox-root .btn:hover{background:#000}
#toolbox-root .btn:disabled{background:#999;cursor:not-allowed}
#toolbox-root .btn-sm,#toolbox-root .btn-s{padding:6px 14px;font-size:13px}
#toolbox-root .btn-p{background:#111;color:#fff}
#toolbox-root .cp-btn{background:#fff;color:#222;border:1px solid #ccc;border-radius:6px;cursor:pointer}
#toolbox-root .cp-btn:hover{border-color:#111}
#toolbox-root input,#toolbox-root textarea,#toolbox-root select{border:1px solid #ccc;border-radius:6px;background:#fff;color:#222}
"@
[System.IO.File]::AppendAllText($p, $add, $enc)
Write-Output 'done'
