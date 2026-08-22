// ==============================
// replace.js - 选择符快捷替换
// ==============================

var rpSourceSet='',rpTargetSet='';
var rpSourceSels=new Set(),rpTargetSels=new Set();
var rpAnalysisResult='';

function renderRpSetOptions(){
  var all=Object.assign({},SELECTOR_SETS,customSets);
  var opts=Object.keys(all).map(function(k){return '<option value="'+escH(k)+'">'+escH(all[k].name)+'</option>'}).join('');
  var src=$('rpSourceSet'),tgt=$('rpTargetSet');
  if(src)src.innerHTML=opts;
  if(tgt)tgt.innerHTML=opts;
}

// 罗马数字转换（1-10 用罗马数字，超过 10 用阿拉伯数字）
function rpRoman(n){
  var map=['','Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'];
  return n<=10?map[n]:String(n);
}

function renderRpSelList(side){
  var setKey=side==='source'?rpSourceSet:rpTargetSet;
  var boxId=side==='source'?'rpSourceSels':'rpTargetSels';
  var selSet=side==='source'?rpSourceSels:rpTargetSels;
  var box=$(boxId);if(!box)return;
  var all=Object.assign({},SELECTOR_SETS,customSets);
  var set=all[setKey];
  if(!set){box.innerHTML='<div class="cs-empty">请选择选择符集</div>';return}
  var html='';
  var orderArr=Array.from(selSet);
  set.selectors.forEach(function(g){
    g.s.forEach(function(s,i){
      var h=(g.hints&&g.hints[i])||'';
      var checked=selSet.has(s)?'checked':'';
      var ordIdx=orderArr.indexOf(s);
      var badge=ordIdx>=0?'<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:16px;border-radius:4px;background:var(--p);color:#fff;font-size:10px;flex-shrink:0;padding:0 3px;font-weight:600">'+rpRoman(ordIdx+1)+'</span>':'';
      html+='<label style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:4px;cursor:pointer;font-size:12px">'+
        '<input type="checkbox" '+checked+' onchange="rpToggleSel(\''+side+'\',\''+s.replace(/'/g,"\\'")+'\',this.checked)">'+
        badge+
        '<span style="font-family:monospace">'+escH(s)+'</span>'+
        (h?'<span style="color:var(--td);font-size:11px">'+escH(h)+'</span>':'')+
      '</label>';
    });
  });
  box.innerHTML=html||'<div class="cs-empty">该集暂无可选选择符</div>';
}

function rpToggleSel(side,sel,checked){
  var selSet=side==='source'?rpSourceSels:rpTargetSels;
  if(checked)selSet.add(sel);else selSet.delete(sel);
  rpUpdateCount();
  renderRpSelList(side);
  rpRenderMapPreview();
}

function rpSelAll(side,selectAll){
  var setKey=side==='source'?rpSourceSet:rpTargetSet;
  var selSet=side==='source'?rpSourceSels:rpTargetSels;
  var all=Object.assign({},SELECTOR_SETS,customSets);
  var set=all[setKey];if(!set)return;
  if(selectAll){set.selectors.forEach(function(g){g.s.forEach(function(s){selSet.add(s)})})}
  else{selSet.clear()}
  renderRpSelList(side);rpUpdateCount();
}

function rpUpdateCount(){
  var sc=$('rpSourceCnt'),tc=$('rpTargetCnt');
  if(sc)sc.textContent=rpSourceSels.size;
  if(tc)tc.textContent=rpTargetSels.size;
}

// 搜索过滤选择符列表
function rpFilterList(side,keyword){
  var boxId=side==='source'?'rpSourceSels':'rpTargetSels';
  var box=$(boxId);if(!box)return;
  var kw=keyword.toLowerCase().trim();
  var labels=box.querySelectorAll('label');
  labels.forEach(function(label){
    if(!kw){label.style.display='';return}
    var text=label.textContent.toLowerCase();
    label.style.display=text.indexOf(kw)>=0?'':'none';
  });
}

function rpOnSetChange(side){
  var sel=side==='source'?$('rpSourceSet'):$('rpTargetSet');
  if(side==='source'){rpSourceSet=sel.value;rpSourceSels.clear()}
  else{rpTargetSet=sel.value;rpTargetSels.clear()}
  renderRpSelList(side);rpUpdateCount();
  rpRenderMapPreview();
}

function rpSwap(){
  var tmpSet=rpSourceSet;
  var tmpSels=new Set(rpSourceSels);
  rpSourceSet=rpTargetSet;rpSourceSels=new Set(rpTargetSels);
  rpTargetSet=tmpSet;rpTargetSels=tmpSels;
  if($('rpSourceSet'))$('rpSourceSet').value=rpSourceSet;
  if($('rpTargetSet'))$('rpTargetSet').value=rpTargetSet;
  renderRpSelList('source');renderRpSelList('target');rpUpdateCount();
  rpRenderMapPreview();
  sbt('ok','已交换源和目标');setTimeout(hst,1500);
}

function rpRenderMapPreview(){
  var box=$('rpMapPreview');if(!box)return;
  var src=Array.from(rpSourceSels),tgt=Array.from(rpTargetSels);
  var len=Math.max(src.length,tgt.length);
  if(len===0){box.innerHTML='<div class="cs-empty">勾选选择符后，此处将显示替换对应关系</div>';return}
  var html='';
  for(var i=0;i<len;i++){
    var s=src[i]||'<span style="color:var(--td)">（无）</span>';
    var t=tgt[i]||'<span style="color:var(--td)">（无）</span>';
    var mark=rpRoman(i+1);
    html+='<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px">'+
      '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:16px;border-radius:4px;background:var(--p);color:#fff;font-size:10px;flex-shrink:0;padding:0 3px;font-weight:600">'+mark+'</span>'+
      '<span style="font-family:monospace">'+(src[i]?escH(src[i]):s)+'</span>'+
      '<span style="color:var(--p);font-weight:600">&gt;</span>'+
      '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:16px;border-radius:4px;background:var(--p);color:#fff;font-size:10px;flex-shrink:0;padding:0 3px;font-weight:600">'+mark+'</span>'+
      '<span style="font-family:monospace">'+(tgt[i]?escH(tgt[i]):t)+'</span>'+
    '</div>';
  }
  box.innerHTML=html;
}

function rpBuildMap(){
  var src=Array.from(rpSourceSels),tgt=Array.from(rpTargetSels);
  var map={};
  var len=Math.min(src.length,tgt.length);
  for(var i=0;i<len;i++){map[src[i]]=tgt[i]}
  return map;
}

function rpEscapeSel(sel){
  return sel.replace(/[.*+?^${}()|[\]\\]/g,function(m){return '\\'+m});
}

function rpDoReplace(){
  var map=rpBuildMap();
  var keys=Object.keys(map);
  if(keys.length===0){showDialog('提示','请先在两侧各选择至少一个选择符（按勾选顺序一一对应替换）');return}
  var css=$('rpCssInput').value.trim();
  if(!css){showDialog('提示','请先粘贴需要替换的CSS代码');return}
  var count=0;
  keys.forEach(function(oldSel){
    var newSel=map[oldSel];
    var escaped=rpEscapeSel(oldSel);
    var regex=new RegExp(escaped+'(?![a-zA-Z0-9_-])','g');
    var before=css;
    css=css.replace(regex,newSel);
    if(before!==css)count++;
  });
  if(count===0){showDialog('提示','未在粘贴的CSS中找到匹配的选择符');return}
  $('rpResultBox').style.display='block';
  $('rpResult').value=css;
  sbt('ok',' 已替换 '+count+' 处选择符');setTimeout(hst,2500);
}

function rpGetApi(){
  var apiSel=$('rpApi');
  if(apiSel&&apiSel.value){
    var preset=apiPresets.find(function(p){return p.name===apiSel.value});
    if(preset)return{url:preset.url,key:preset.key,model:preset.model};
  }
  return{url:akUrl,key:ak,model:akModel};
}

function renderRpApiOptions(){
  var sel=$('rpApi');if(!sel)return;
  var html='<option value="">主API（当前API配置）</option>';
  html+=apiPresets.map(function(p){return '<option value="'+escH(p.name)+'">'+escH(p.name)+'（'+escH(p.model||'')+'）</option>'}).join('');
  sel.innerHTML=html;
}

async function rpAiAnalyze(){
  var map=rpBuildMap();
  var keys=Object.keys(map);
  if(keys.length===0){showDialog('提示','请先选择要替换的选择符');return}
  var api=rpGetApi();
  if(!api.key){sbt('err','请先设置API');$('akm').classList.add('active');return}
  var all=Object.assign({},SELECTOR_SETS,customSets);
  var srcInfo=keys.map(function(s){
    var info=s;
    var set=all[rpSourceSet];
    if(set){set.selectors.forEach(function(g){var idx=g.s.indexOf(s);if(idx>=0&&g.hints&&g.hints[idx])info+='（备注：'+g.hints[idx]+'，分组：'+g.g+'）'})}
    return info;
  }).join('\n');
  var tgtInfo=keys.map(function(s){
    var t=map[s];var info=t;
    var set=all[rpTargetSet];
    if(set){set.selectors.forEach(function(g){var idx=g.s.indexOf(t);if(idx>=0&&g.hints&&g.hints[idx])info+='（备注：'+g.hints[idx]+'，分组：'+g.g+'）'})}
    return info;
  }).join('\n');
  var css=$('rpCssInput').value.trim()||'（未粘贴CSS代码）';
  var btn=$('rpAiAnalyze');btn.disabled=true;btn.textContent=' 分析中...';
  var sysPrompt='你是CSS选择符替换分析专家。分析用户的替换计划，指出：1.每个替换是否合理 2.可能的风险 3.修正建议。用简洁中文分点回答。';
  var userContent='【替换计划】\n源选择符：\n'+srcInfo+'\n\n目标选择符：\n'+tgtInfo+'\n\n【当前CSS】\n'+css.substring(0,3000);
  try{
    var res=await fetch(buildApiUrl(api.url,'/chat/completions'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.key},body:JSON.stringify({model:api.model,messages:[{role:'system',content:sysPrompt},{role:'user',content:userContent}],temperature:.3,max_tokens:2000})});
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    rpAnalysisResult=((d.choices[0].message&&d.choices[0].message.content)||'').trim();
    rememberAIResult('选择符分析',rpAnalysisResult);
    $('rpAnalysisBox').style.display='block';
    $('rpAnalysisResult').value=rpAnalysisResult;
    if(memoryEnabled){addMemory('user','【选择符替换分析】'+userContent.substring(0,500));addMemory('assistant',rpAnalysisResult);checkAutoSummary()}
    sbt('ok',' 分析完成');setTimeout(hst,2000);
  }catch(err){var fullReq=sysPrompt+'\n\n[用户请求]\n'+userContent;var detail=typeof getApiSnapshot==='function'?getApiSnapshot(fullReq):null;if(typeof logAiError==='function')logAiError('替换分析',err.message||String(err),detail);showDialog('分析失败',err.message)}
  finally{btn.disabled=false;btn.textContent=' AI分析替换问题'}
}

async function rpAiReplace(){
  if(!rpAnalysisResult){showDialog('提示','请先执行AI分析');return}
  if(!await showDialog('确认替换','AI将根据分析结果执行智能替换，是否继续？','confirm'))return;
  var api=rpGetApi();
  var map=rpBuildMap();
  var keys=Object.keys(map);
  var css=$('rpCssInput').value.trim();
  if(!css){showDialog('提示','请先粘贴需要替换的CSS代码');return}
  var btn=$('rpAiReplace');btn.disabled=true;btn.textContent=' 替换中...';
  var lockReq=($('rpLockReq')&&$('rpLockReq').value.trim())||'只修改选择符名称，不要修改任何CSS属性值、数值、颜色和结构';
  var sysPrompt='你是CSS选择符替换专家。根据分析结果对CSS执行精确替换。只输出替换后的完整CSS，不要解释。锁定要求：'+lockReq;
  var userContent='【替换映射】\n'+keys.map(function(s){return s+' → '+map[s]}).join('\n')+'\n\n【锁定要求】\n'+lockReq+'\n\n【分析结论】\n'+rpAnalysisResult+'\n\n【待替换CSS】\n'+css;
  try{
    var res=await fetch(buildApiUrl(api.url,'/chat/completions'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.key},body:JSON.stringify({model:api.model,messages:[{role:'system',content:sysPrompt},{role:'user',content:userContent}],temperature:.2,max_tokens:4096})});
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    var newCss=d.choices[0].message.content.replace(/^```css\s*/i,'').replace(/```\s*$/i,'').trim();
    $('rpResultBox').style.display='block';
    $('rpResult').value=newCss;
    if(memoryEnabled){addMemory('user','【AI辅助替换】'+userContent.substring(0,500));addMemory('assistant',newCss.substring(0,500));checkAutoSummary()}
    sbt('ok',' AI辅助替换完成');setTimeout(hst,2000);
  }catch(err){var fullReq=sysPrompt+'\n\n[用户请求]\n'+userContent;var detail=typeof getApiSnapshot==='function'?getApiSnapshot(fullReq):null;if(typeof logAiError==='function')logAiError('AI辅助替换',err.message||String(err),detail);showDialog('替换失败',err.message)}
  finally{btn.disabled=false;btn.textContent=' AI辅助替换'}
}

function initReplacePage(){
  renderRpSetOptions();
  renderRpApiOptions();
  // 初始化时读取下拉框的默认选中值，确保选择符列表正确显示
  var srcSel=$('rpSourceSet'),tgtSel=$('rpTargetSet');
  rpSourceSet=srcSel&&srcSel.options.length>0?srcSel.value:'';
  rpTargetSet=tgtSel&&tgtSel.options.length>1?tgtSel.options[1].value:(tgtSel&&tgtSel.options.length>0?tgtSel.value:'');
  if(tgtSel&&tgtSel.options.length>1)tgtSel.selectedIndex=1;
  renderRpSelList('source');renderRpSelList('target');
  rpUpdateCount();
  rpRenderMapPreview();
}
