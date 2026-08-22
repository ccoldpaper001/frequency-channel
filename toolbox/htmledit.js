// ==============================
// htmledit.js - 代码编辑页面（HTML 预览与展示）
// ==============================
// 内容仅保存在内存变量中：切换页面不丢失，刷新页面后清空
// 不写入 localStorage、不写入文件、不进入 AI 记忆

var heContent='';// 内存中的编辑内容
var hePreviewTimer=null;

// 智能处理内容：剥离 ```html/```css 代码块标记，非完整文档自动包装
function heProcessContent(raw){
  if(!raw||!raw.trim())return '';
  var content=raw;
  // 剥离 markdown 代码块标记（```html、```css、``` 等），保留内部空行
  var blockMatch=content.match(/```(?:html|css|XML|xml)?\s*\n([\s\S]*?)\n?```/);
  if(blockMatch){
    content=blockMatch[1];
  }else{
    // 没有完整代码块，仅剥离首尾可能残留的 ``` 标记行
    content=content.replace(/^\s*```[a-zA-Z]*\s*\n/,'').replace(/\n?\s*```\s*$/,'');
  }
  // 判断是否为完整 HTML 文档（包含 <html 或 <!DOCTYPE 或 <body）
  var isFullDoc=/<!DOCTYPE|<html[\s>]|<body[\s>]/i.test(content);
  if(isFullDoc)return content;
  // 判断是否为纯 CSS（没有 HTML 标签，但包含 CSS 规则）
  var hasHtmlTag=/<[a-zA-Z][^>]*>/.test(content);
  var hasCssRule=/[.#]?[a-zA-Z0-9_\-\[\]:."'=,() >+~*]+\{[^}]*\}/.test(content);
  if(!hasHtmlTag&&hasCssRule){
    // 纯 CSS：包装成带示例结构的文档，直接应用样式
    return '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<style>\n'+content+'\n</style>\n</head>\n<body>\n<div style="padding:16px;color:#666;font:13px sans-serif">📋 检测到纯 CSS 代码，已自动应用为页面样式。<br>在下方添加 HTML 结构可查看实际效果。</div>\n</body>\n</html>';
  }
  // HTML 片段：自动包装成完整文档
  return '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n</head>\n<body>\n'+content+'\n</body>\n</html>';
}

// 写入 iframe 内容（srcdoc 在沙箱 iframe 中不受同源限制，是最可靠的方式）
function heWriteIframe(html){
  var iframe=$('hePreview');
  if(!iframe)return;
  iframe.srcdoc=html;
}

// 更新预览（防抖 500ms）
function heUpdatePreview(){
  clearTimeout(hePreviewTimer);
  hePreviewTimer=setTimeout(function(){
    var processed=heProcessContent(heContent);
    heWriteIframe(processed||'<div style="padding:20px;color:#999;font-family:sans-serif;font-size:13px">在左侧输入 HTML 代码后，此处将实时预览效果...<br><br>支持粘贴 ```html 代码块、HTML 片段或纯 CSS 代码</div>');
  },500);
}

// 编辑器输入事件
function heOnInput(){
  var ta=$('heEditor');
  if(!ta)return;
  heContent=ta.value;
  heUpdatePreview();
}

// 手动运行预览
function heRunPreview(){
  var ta=$('heEditor');
  if(ta)heContent=ta.value;
  var processed=heProcessContent(heContent);
  heWriteIframe(processed||'<div style="padding:20px;color:#999;font-family:sans-serif;font-size:13px">暂无内容可预览</div>');
  sbt('ok','▶️ 已运行预览');setTimeout(hst,1500);
}

// 复制代码
function heCopyCode(){
  var ta=$('heEditor');
  var content=ta?ta.value:heContent;
  if(!content.trim()){sbt('info','暂无内容可复制');setTimeout(hst,1500);return}
  copyToClipboard(content).then(function(){
    sbt('ok','✅ 代码已复制');setTimeout(hst,1500);
  }).catch(function(){
    sbt('err','复制失败');setTimeout(hst,2000);
  });
}

// 清空代码
async function heClearCode(){
  var ta=$('heEditor');
  var content=ta?ta.value:heContent;
  if(!content.trim()){sbt('info','内容已为空');setTimeout(hst,1500);return}
  if(!await showDialog('确认清空','确定清空编辑器中的所有代码吗？（此操作不可恢复）','confirm'))return;
  heContent='';
  if(ta)ta.value='';
  heUpdatePreview();
  sbt('ok','✅ 已清空');setTimeout(hst,2000);
}

// ==============================
// 代码生成页 - 生成结果实时预览
// ==============================
var cgPreviewTimer=null;

function cgUpdatePreview(){
  clearTimeout(cgPreviewTimer);
  cgPreviewTimer=setTimeout(function(){
    var ta=$('cgCodeResult');
    var wrap=$('cgPreviewWrap');
    var iframe=$('cgCodePreview');
    if(!ta||!wrap||!iframe)return;
    var content=ta.value;
    if(!content.trim()){wrap.style.display='none';return}
    wrap.style.display='';
    iframe.srcdoc=heProcessContent(content);
  },500);
}

// 初始化代码生成页预览（页面切换时调用，避免重复绑定）
function initCgCodePreview(){
  var ta=$('cgCodeResult');
  if(!ta)return;
  if(!ta.dataset.cgPrevBound){
    ta.addEventListener('input',cgUpdatePreview);
    ta.dataset.cgPrevBound='1';
  }
  cgUpdatePreview();
}

// 初始化代码编辑页面
function initHtmlEditPage(){
  var ta=$('heEditor');
  if(!ta)return;
  // 恢复内存中的内容（切换页面回来时保持）
  if(heContent&&ta.value!==heContent)ta.value=heContent;
  // 绑定事件（避免重复绑定）
  if(!ta.dataset.heBound){
    ta.addEventListener('input',heOnInput);
    ta.dataset.heBound='1';
    var runBtn=$('heRun');if(runBtn)runBtn.addEventListener('click',heRunPreview);
    var copyBtn=$('heCopy');if(copyBtn)copyBtn.addEventListener('click',heCopyCode);
    var clearBtn=$('heClear');if(clearBtn)clearBtn.addEventListener('click',heClearCode);
  }
  // 初始预览
  heUpdatePreview();
}
