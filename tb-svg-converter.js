// ==============================
// svg-converter.js - SVG图标代码格式转换
// ==============================

var svgConverterContent='';
var svgPreviewSize=64;
var svgPreviewColor='#333333';

// 初始化 SVG 转换页面
function initSvgConverterPage(){
  var ta=$('svgInput');
  if(!ta)return;
  if(!ta.dataset.svgBound){
    ta.addEventListener('input',svgOnInput);
    ta.dataset.svgBound='1';
    var convertBtn=$('svgConvert');if(convertBtn)convertBtn.addEventListener('click',svgDoConvert);
    var clearBtn=$('svgClear');if(clearBtn)clearBtn.addEventListener('click',svgClearAll);
    var copyBtn=$('svgCopy');if(copyBtn)copyBtn.addEventListener('click',svgCopyResult);
    var sizeInput=$('svgSize');if(sizeInput)sizeInput.addEventListener('input',svgUpdatePreview);
    var colorInput=$('svgColor');if(colorInput)colorInput.addEventListener('input',svgUpdatePreview);
  }
  svgUpdatePreview();
}

// 输入事件
function svgOnInput(){
  var ta=$('svgInput');
  if(!ta)return;
  svgConverterContent=ta.value;
  svgUpdatePreview();
}

// 更新预览
function svgUpdatePreview(){
  var preview=$('svgPreview');
  var sizeInput=$('svgSize');
  var colorInput=$('svgColor');
  if(sizeInput){var v=parseInt(sizeInput.value);svgPreviewSize=(v>=16&&v<=512)?v:64}
  if(colorInput)svgPreviewColor=colorInput.value||'#333333';
  if(!preview)return;
  var svg=svgConverterContent.trim();
  if(!svg){
    preview.innerHTML='<div style="color:var(--td);font-size:12px;padding:20px;text-align:center">粘贴 SVG 代码后预览</div>';
    return;
  }
  try{
    var processed=svgProcessForPreview(svg);
    preview.innerHTML='<div style="width:'+svgPreviewSize+'px;height:'+svgPreviewSize+'px;margin:0 auto;display:flex;align-items:center;justify-content:center">'+processed+'</div>';
  }catch(e){
    preview.innerHTML='<div style="color:#f87171;font-size:12px;padding:20px;text-align:center">SVG 解析失败：'+e.message+'</div>';
  }
}

// 处理 SVG 用于预览
function svgProcessForPreview(svg){
  var match=svg.match(/<svg[\s\S]*?<\/svg>/i);
  if(!match)return svg;
  var result=match[0];
  if(svgPreviewColor&&svgPreviewColor!=='#333333'){
    result=result.replace(/fill="[^"]*"/g,'fill="'+svgPreviewColor+'"');
    result=result.replace(/stroke="[^"]*"/g,'stroke="'+svgPreviewColor+'"');
  }
  result=result.replace(/width="[^"]*"/g,'width="100%"');
  result=result.replace(/height="[^"]*"/g,'height="100%"');
  return result;
}

// 执行转换
function svgDoConvert(){
  var input=$('svgInput');
  var output=$('svgOutput');
  if(!input||!output)return;
  var svg=input.value.trim();
  if(!svg){showDialog('提示','请先粘贴 SVG 代码');return}
  var converted=svgConvertToDataUri(svg);
  output.value=converted;
  sbt('ok',' 转换完成');setTimeout(hst,2000);
}

// 转换 SVG 为 data URI 格式
function svgConvertToDataUri(svg){
  var match=svg.match(/<svg[\s\S]*?<\/svg>/i);
  if(!match)return svg;
  var result=match[0];
  // 处理颜色
  if(svgPreviewColor&&svgPreviewColor!=='#333333'){
    result=result.replace(/fill="[^"]*"/g,'fill="'+svgPreviewColor+'"');
    result=result.replace(/stroke="[^"]*"/g,'stroke="'+svgPreviewColor+'"');
  }
  // 移除 width 和 height 属性，使用 viewBox
  result=result.replace(/\s+width="[^"]*"/g,'');
  result=result.replace(/\s+height="[^"]*"/g,'');
  // 编码为 data URI
  var encoded=encodeURIComponent(result)
    .replace(/'/g,'%27')
    .replace(/"/g,'%22')
    .replace(/%20/g,' ');
  var css='background-image: url(\'data:image/svg+xml,'+encoded+'\');';
  return css;
}

// 复制结果
function svgCopyResult(){
  var output=$('svgOutput');
  if(!output||!output.value.trim()){sbt('info','暂无内容可复制');setTimeout(hst,1500);return}
  copyToClipboard(output.value).then(function(){
    sbt('ok',' 已复制');setTimeout(hst,1500);
  }).catch(function(){
    sbt('err','复制失败');setTimeout(hst,2000);
  });
}

// 清空
async function svgClearAll(){
  if(!await showDialog('确认清空','确定清空所有内容吗？','confirm'))return;
  var input=$('svgInput');
  var output=$('svgOutput');
  if(input)input.value='';
  if(output)output.value='';
  svgConverterContent='';
  svgUpdatePreview();
  sbt('ok',' 已清空');setTimeout(hst,2000);
}

// ==============================
// 资源链接管理（预设 + 自定义）
// ==============================
var resLinks=JSON.parse(storage.getItem('qqy_res_links')||'null');
if(!resLinks){
  resLinks=[
    {name:'阿里巴巴图标库',url:'https://www.iconfont.cn/',note:'矢量图标下载'},
    {name:'Font Awesome',url:'https://fontawesome.com/',note:'英文图标库'},
    {name:'Google Fonts',url:'https://fonts.google.com/',note:'免费字体'},
    {name:'FontSpace',url:'https://www.fontspace.com/',note:'免费字体下载'}
  ];
  storage.setItem('qqy_res_links',JSON.stringify(resLinks));
}

function saveResLinks(){storage.setItem('qqy_res_links',JSON.stringify(resLinks))}

function toggleResPanel(){
  var panel=$('resPanel'),arrow=$('resArrow');
  if(!panel)return;
  var opening=panel.style.display!=='block';
  panel.style.display=opening?'block':'none';
  if(arrow)arrow.style.transform=opening?'rotate(90deg)':'';
  if(opening)renderResList();
}

function renderResList(){
  var box=$('resList');if(!box)return;
  if(resLinks.length===0){box.innerHTML='<div style="font-size:11px;color:var(--td);padding:8px;text-align:center">暂无链接，点击「添加链接」创建</div>';return}
  box.innerHTML=resLinks.map(function(l,i){
    return '<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--bg2);border-radius:4px;font-size:11px">'+
      '<a href="'+escH(l.url)+'" target="_blank" onclick="event.stopPropagation()" style="flex:1;color:var(--p);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escH(l.url)+'">'+escH(l.name)+'</a>'+
      (l.note?'<span style="color:var(--td);font-size:10px;flex-shrink:0">'+escH(l.note)+'</span>':'')+
      '<span style="cursor:pointer;color:var(--td);flex-shrink:0" onclick="editResLink('+i+')" title="编辑"></span>'+
      '<span style="cursor:pointer;color:#f87171;flex-shrink:0" onclick="delResLink('+i+')" title="删除"></span>'+
    '</div>';
  }).join('');
}

async function addResLink(){
  var name=await showDialog('添加链接','请输入链接名称：','prompt');
  if(!name)return;
  var url=await showDialog('添加链接','请输入链接地址（含 https://）：','prompt');
  if(!url)return;
  var note=await showDialog('添加链接','请输入备注（可选）：','prompt')||'';
  resLinks.push({name:name,url:url,note:note});
  saveResLinks();renderResList();
  sbt('ok',' 已添加');setTimeout(hst,1500);
}

async function editResLink(i){
  var l=resLinks[i];if(!l)return;
  var name=await showDialog('编辑链接','链接名称：','prompt',l.name);
  if(!name)return;
  var url=await showDialog('编辑链接','链接地址：','prompt',l.url);
  if(!url)return;
  var note=await showDialog('编辑链接','备注（可选）：','prompt',l.note||'')||'';
  resLinks[i]={name:name,url:url,note:note};
  saveResLinks();renderResList();
  sbt('ok',' 已保存');setTimeout(hst,1500);
}

async function delResLink(i){
  var l=resLinks[i];if(!l)return;
  if(!await showDialog('确认删除','删除链接「'+l.name+'」？','confirm'))return;
  resLinks.splice(i,1);
  saveResLinks();renderResList();
  sbt('ok','已删除');setTimeout(hst,1500);
}
