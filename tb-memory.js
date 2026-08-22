// ==============================
// memory.js - 记忆管理 + 自动总结（大总结/小总结）
// ==============================

// ===== 从 data.json 获取指定名称的提示词 =====
function getPromptByName(name){
  var data=loadDefaultPromptsData();
  var item=data.prompts.find(function(p){return p.name===name});
  return item?item.prompt:'';
}

function addMemory(role,content){
  aiMemory.push({role:role,content:content,t:Date.now()});
  if(aiMemory.length>100)aiMemory=aiMemory.slice(-100);
  saveCurrentSlot();
  renderMemory();renderUnsaved();
}

function renderMemory(){
  var box=$('memList');if(!box)return;
  var cnt=$('memCnt');if(cnt)cnt.textContent=aiMemory.length;
  if(!aiMemory.length){box.innerHTML='<div class="mem-empty">暂无对话记忆</div>';return}
  box.innerHTML=aiMemory.map(function(m,i){
    var time=new Date(m.t).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
    var roleLabel=m.role==='user'?' User':' AI';
    var preview=m.content.substring(0,200)+(m.content.length>200?'...':'');
    return '<div class="mem-item"><span class="mem-role '+m.role+'">'+roleLabel+'</span><span class="mem-content">'+escH(preview)+'</span><span class="mem-time">'+time+'</span><button class="mem-edit-btn" onclick="editMemory('+i+')" title="编辑这条记忆"></button></div>';
  }).join('');
}

// 未总结记忆展示
function renderUnsaved(){
  var box=$('memUnsaved');if(!box)return;
  var cnt=$('memUnsavedCnt');if(cnt)cnt.textContent=aiMemory.length;
  if(!aiMemory.length){box.innerHTML='<div class="mem-empty">所有记忆已总结 </div>';return}
  box.innerHTML=aiMemory.map(function(m,i){
    var time=new Date(m.t).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    var roleLabel=m.role==='user'?'':'';
    var preview=m.content.substring(0,120)+(m.content.length>120?'...':'');
    return '<div class="mem-item mem-unsaved"><span class="mem-role '+m.role+'">'+roleLabel+'</span><span class="mem-content">'+escH(preview)+'</span><span class="mem-time">'+time+'</span><button class="mem-edit-btn" onclick="editMemory('+i+')" title="编辑这条记忆"></button></div>';
  }).join('');
}

async function clearMemory(){if(!await showDialog('确认清空','确定清空当前记忆区的所有对话记忆和总结？','confirm'))return;aiMemory=[];memorySlots[currentSlot]=[];memorySummaries=[];memoryLargeSummaries=[];saveCurrentSlot();saveSummaries();saveLargeSummaries();renderMemory();renderSummaries();renderUnsaved();sbt('ok','已清空');setTimeout(hst,2000)}

// ===== 通用记忆编辑弹窗 =====
var memEditCallback=null;
function openMemEdit(opts){
  var modal=$('memEditModal');if(!modal)return;
  $('memEditTitle').textContent=opts.title||'编辑';
  $('memEditLabel').textContent=opts.label||'内容';
  $('memEditContent').value=opts.content||'';
  $('memEditRoleField').style.display=opts.showRole?'':'none';
  if(opts.showRole)$('memEditRole').value=opts.role||'user';
  memEditCallback=opts.onSave||null;
  modal.classList.add('active');
  setTimeout(function(){$('memEditContent').focus()},100);
}
function closeMemEdit(){
  var modal=$('memEditModal');if(modal)modal.classList.remove('active');
  memEditCallback=null;
}
function saveMemEdit(){
  var content=$('memEditContent').value;
  var role=$('memEditRole').value;
  if(memEditCallback)memEditCallback(content,role);
  closeMemEdit();
}

// ===== 编辑单条记忆 =====
function editMemory(i){
  var m=aiMemory[i];if(!m)return;
  openMemEdit({
    title:' 编辑记忆',
    label:'记忆内容（角色：'+(m.role==='user'?' 用户':' AI')+'）',
    content:m.content,
    onSave:function(v){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      m.content=v.trim();
      saveCurrentSlot();
      renderMemory();renderUnsaved();
      sbt('ok',' 记忆已更新');setTimeout(hst,2000);
    }
  });
}

// ===== 记忆槽位管理 =====
function renderSlotList(){
  var sel=$('memSlotSel');if(!sel)return;
  var names=Object.keys(memorySlots);
  sel.innerHTML=names.map(function(n){return '<option value="'+escH(n)+'" '+(n===currentSlot?'selected':'')+'>'+escH(n)+'（'+(memorySlots[n]||[]).length+'条）</option>'}).join('');
}

function onSlotChange(){
  var v=$('memSlotSel').value;
  switchSlot(v);
  renderSlotList();
  sbt('ok',' 已切换到 '+v);setTimeout(hst,2000);
}

function newMemorySlot(){
  var name=prompt('新记忆区名称：','记忆'+(Object.keys(memorySlots).length+1));
  if(!name)return;
  if(memorySlots[name]){showDialog('提示','已存在同名记忆区');return}
  memorySlots[name]=[];
  saveCurrentSlot();
  switchSlot(name);
  renderSlotList();
  sbt('ok',' 已创建并切换到 '+name);setTimeout(hst,2000);
}

function renameMemorySlot(){
  var name=prompt('重命名当前记忆区：',currentSlot);
  if(!name||name===currentSlot)return;
  if(memorySlots[name]){showDialog('提示','已存在同名记忆区');return}
  memorySlots[name]=memorySlots[currentSlot];
  delete memorySlots[currentSlot];
  currentSlot=name;
  storage.setItem('qqy_current_slot',name);
  saveCurrentSlot();
  renderSlotList();
  sbt('ok',' 已重命名为 '+name);setTimeout(hst,2000);
}
function toggleMemory(){memoryEnabled=!memoryEnabled;storage.setItem('qqy_memory_enabled',memoryEnabled?'1':'0');$('memoryToggle').checked=memoryEnabled}

function buildMessages(systemPrompt,userContent){
  // 将所有 system 内容合并为一条消息，提高 API 兼容性（部分 API 对多条 system 敏感）
  var sysParts=[systemPrompt];
  // 大总结优先级最高
  if(memoryLargeSummaries.length>0){
    var largeText=memoryLargeSummaries.map(function(s,i){return '[大总结'+(i+1)+' - '+s.time+']\n'+s.content}).join('\n\n');
    sysParts.push(getPromptByName('大总结系统前缀')+'\n\n'+largeText);
  }
  // 小总结
  if(memorySummaries.length>0){
    var summaryText=memorySummaries.map(function(s,i){return '[小总结'+(i+1)+' - '+s.time+']\n'+s.content}).join('\n\n');
    sysParts.push(getPromptByName('小总结系统前缀')+'\n\n'+summaryText);
  }
  var messages=[{role:'system',content:sysParts.join('\n\n')}];
  // 原始记忆（未总结的）
  if(memoryEnabled&&aiMemory.length>0){
    var recent=aiMemory.slice(-memoryMaxRounds*2);
    for(var i=0;i<recent.length;i++){messages.push({role:recent[i].role,content:recent[i].content})}
  }
  messages.push({role:'user',content:userContent});
  return messages;
}

// 检查是否需要自动总结
function checkAutoSummary(){
  if(aiMemory.length>=memorySummaryThreshold*2){
    autoSummary('small');
  }
  // 检查是否需要大总结：小总结数量达到阈值
  if(memorySummaries.length>=memoryLargeThreshold){
    autoSummary('large');
  }
}

// 小总结：总结最近的对话（带竞态锁，防止连续触发重复总结）
var summaryInProgress=false;
async function autoSummary(type){
  if(!ak||!akUrl)return;
  if(summaryInProgress)return;
  summaryInProgress=true;
  var isSmall=type!=='large';
  var toSummarize=aiMemory.slice(0,memorySummaryThreshold*2);
  var dialogText=toSummarize.map(function(m){return (m.role==='user'?'用户':'AI')+': '+m.content}).join('\n');
  var sp=isSmall
    ?getPromptByName('小总结指令')
    :getPromptByName('大总结指令');
  var content=isSmall?dialogText:memorySummaries.map(function(s,i){return '[小总结'+(i+1)+'] '+s.content}).join('\n');
  try{
    var res=await fetch(buildApiUrl(akUrl,'/chat/completions'),{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+ak},
      body:JSON.stringify({model:akModel,messages:[{role:'system',content:sp},{role:'user',content:content}],temperature:.3,max_tokens:isSmall?500:800})
    });
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    if(!d.choices||!d.choices[0])throw new Error('AI 返回格式异常（可能是服务繁忙，请稍后重试）');
    var summaryContent=d.choices[0].message&&d.choices[0].message.content;if(!summaryContent)throw new Error('AI返回内容为空');var summary=summaryContent.trim();
    var time=new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    if(isSmall){
      memorySummaries.push({content:summary,time:time,t:Date.now(),type:'small'});
      if(memorySummaries.length>20)memorySummaries=memorySummaries.slice(-20);
      saveSummaries();
      aiMemory=aiMemory.slice(memorySummaryThreshold*2);
      saveCurrentSlot();
    }else{
      memoryLargeSummaries.push({content:summary,time:time,t:Date.now(),type:'large'});
      if(memoryLargeSummaries.length>5)memoryLargeSummaries=memoryLargeSummaries.slice(-5);
      saveLargeSummaries();
      // 清空小总结（已合并到大总结）
      memorySummaries=[];
      saveSummaries();
    }
    renderMemory();renderSummaries();renderUnsaved();
  }catch(e){console.error('Summary failed:',e)}
  finally{summaryInProgress=false}
}

async function summaryNow(){
  if(!ak){sbt('err','请先设置API');return}
  if(aiMemory.length===0){sbt('err','暂无记忆可总结');return}
  if(summaryInProgress){sbt('err','正在总结中，请稍候');setTimeout(hst,2000);return}
  var btn=$('memSummaryNow');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> 总结中...'}
  hst();
  try{
    await autoSummary('small');
    sbt('ok',' 小总结完成');setTimeout(hst,2000);
  }catch(e){
    if(typeof logAiError==='function')logAiError('小总结',e.message||String(e));
    sbt('err','小总结失败：'+(e.message||e));setTimeout(hst,3000);
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML=' 立即小总结'}
  }
}

async function largeSummaryNow(){
  if(!ak){sbt('err','请先设置API');return}
  if(memorySummaries.length===0&&aiMemory.length===0){sbt('err','暂无小总结和记忆，无法大总结');return}
  if(summaryInProgress){sbt('err','正在总结中，请稍候');setTimeout(hst,2000);return}
  var btn=$('memLargeSummaryNow');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> 总结中...'}
  hst();
  try{
    if(aiMemory.length>=2){await autoSummary('small')}
    await autoSummary('large');
    sbt('ok',' 大总结完成');setTimeout(hst,2000);
  }catch(e){
    if(typeof logAiError==='function')logAiError('大总结',e.message||String(e));
    sbt('err','大总结失败：'+(e.message||e));setTimeout(hst,3000);
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML=' 立即大总结'}
  }
}

function renderSummaries(){
  // 小总结
  var box=$('memSummaries');if(box){
    if(!memorySummaries.length){box.innerHTML='<div class="mem-empty">暂无小总结</div>'}
    else{
      box.innerHTML=memorySummaries.map(function(s,i){
        return '<div class="mem-summary-item small"><div class="summary-time"> 小总结 '+(i+1)+' · '+s.time+' <button class="mem-edit-btn" onclick="editSummary('+i+')" title="编辑"></button><button class="mem-edit-btn" onclick="deleteSummary('+i+')" title="删除这条小总结" style="color:#f87171"></button></div>'+escH(s.content)+'</div>';
      }).join('');
    }
  }
  // 大总结
  var lbox=$('memLargeSummaries');if(lbox){
    if(!memoryLargeSummaries.length){lbox.innerHTML='<div class="mem-empty">暂无大总结</div>'}
    else{
      lbox.innerHTML=memoryLargeSummaries.map(function(s,i){
        return '<div class="mem-summary-item large"><div class="summary-time"> 大总结 '+(i+1)+' · '+s.time+' <button class="mem-edit-btn" onclick="editLargeSummary('+i+')" title="编辑"></button><button class="mem-edit-btn" onclick="deleteLargeSummary('+i+')" title="删除这条大总结" style="color:#f87171"></button></div>'+escH(s.content)+'</div>';
      }).join('');
    }
  }
  // 未总结记忆
  renderUnsaved();
}

// ===== AI 错误日志 =====
var aiErrorLog=[];
try{aiErrorLog=JSON.parse(storage.getItem('qqy_ai_error_log')||'[]')}catch(e){aiErrorLog=[]}

function logAiError(source,msg,detail){
  var time=new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var entry={source:source,msg:msg,time:time,t:Date.now()};
  if(detail)entry.detail=detail;
  aiErrorLog.unshift(entry);
  if(aiErrorLog.length>15)aiErrorLog=aiErrorLog.slice(0,15);
  try{storage.setItem('qqy_ai_error_log',JSON.stringify(aiErrorLog))}catch(e){}
  renderAiErrorLog();
  var panel=$('aiErrPanel'),dot=$('aiErrDot');
  if(dot&&(!panel||!panel.classList.contains('active')))dot.style.display='block';
}

function getApiSnapshot(reqText){
  var snap={url:akUrl,model:akModel,keyPreview:ak?(ak.substring(0,6)+'...'):'(未设置)',preset:currentApiPreset||'(默认)'};
  if(reqText)snap.request=reqText.length>8000?reqText.substring(0,8000)+'...':reqText;
  return snap;
}

function toggleAiErrPanel(){
  var panel=$('aiErrPanel');if(!panel)return;
  var opening=!panel.classList.contains('active');
  panel.classList.toggle('active');
  if(opening){var dot=$('aiErrDot');if(dot)dot.style.display='none'}
}

function renderAiErrorLog(){
  var box=$('aiErrLog');if(!box)return;
  var toggle=$('aiErrToggle');
  if(!aiErrorLog.length){box.innerHTML='<div class="mem-empty">暂无错误记录</div>';if(toggle)toggle.style.display='none';return}
  box.innerHTML=aiErrorLog.map(function(e,i){
    var detailBtn=e.detail?' <span style="cursor:pointer;color:var(--p);font-size:10px" onclick="event.stopPropagation();toggleErrDetail('+i+')">[详情]</span>':'';
    var detailHtml=e.detail?'<div id="errDetail'+i+'" style="display:none;margin-top:6px;padding:8px;background:var(--bg);border-radius:4px;font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto"><b>API:</b> '+escH(e.detail.url||'')+'\n<b>模型:</b> '+escH(e.detail.model||'')+'\n<b>Key:</b> '+escH(e.detail.keyPreview||'')+'\n<b>预设:</b> '+escH(e.detail.preset||'')+(e.detail.request?'\n<b>请求内容:</b>\n'+escH(e.detail.request):'')+'</div>':'';
    return '<div class="ai-err-item"><div class="ai-err-head"><span class="ai-err-source">'+escH(e.source)+'</span><span class="ai-err-time">'+e.time+detailBtn+'</span></div><div class="ai-err-msg">'+escH(e.msg)+'</div>'+detailHtml+'</div>';
  }).join('');
  if(toggle)toggle.style.display=aiErrorLog.length>4?'':'none';
}

function toggleErrDetail(i){
  var el=$('errDetail'+i);
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}

function clearAiErrorLog(){
  if(!aiErrorLog.length){sbt('info','日志已为空');setTimeout(hst,1500);return}
  aiErrorLog=[];
  try{storage.removeItem('qqy_ai_error_log')}catch(e){}
  renderAiErrorLog();
  sbt('ok','已清空');setTimeout(hst,1500);
}

// ===== 删除单条小总结 =====
async function deleteSummary(i){
  if(!memorySummaries[i])return;
  if(!await showDialog('确认删除','确定删除小总结 '+(i+1)+' 吗？','confirm'))return;
  memorySummaries.splice(i,1);
  saveSummaries();
  renderSummaries();
  sbt('ok',' 小总结已删除');setTimeout(hst,2000);
}

// ===== 删除单条大总结 =====
async function deleteLargeSummary(i){
  if(!memoryLargeSummaries[i])return;
  if(!await showDialog('确认删除','确定删除大总结 '+(i+1)+' 吗？','confirm'))return;
  memoryLargeSummaries.splice(i,1);
  saveLargeSummaries();
  renderSummaries();
  sbt('ok',' 大总结已删除');setTimeout(hst,2000);
}

async function clearSummaries(){
  if(!await showDialog('确认清空','确定清空当前记忆区的所有总结（大总结+小总结）？','confirm'))return;
  memorySummaries=[];memoryLargeSummaries=[];
  saveSummaries();saveLargeSummaries();
  renderSummaries();sbt('ok','已清空所有总结');setTimeout(hst,2000);
}

function saveMemConfig(){
  memoryMaxRounds=parseInt($('memRounds').value)||6;
  memorySummaryThreshold=parseInt($('memThreshold').value)||10;
  memoryLargeThreshold=parseInt(($('memLargeThreshold')||{value:'3'}).value)||3;
  storage.setItem('qqy_mem_rounds',String(memoryMaxRounds));
  storage.setItem('qqy_mem_summary_threshold',String(memorySummaryThreshold));
  storage.setItem('qqy_mem_large_threshold',String(memoryLargeThreshold));
  sbt('ok',' 已保存');setTimeout(hst,2000);
}

// ===== 新增记忆 =====
function addMemoryManual(){
  openMemEdit({
    title:'＋ 新增记忆',
    label:'记忆内容',
    content:'',
    showRole:true,
    role:'user',
    onSave:function(v,role){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      aiMemory.push({role:role,content:v.trim(),t:Date.now()});
      saveCurrentSlot();renderMemory();renderUnsaved();
      sbt('ok',' 记忆已添加');setTimeout(hst,2000);
    }
  });
}

// ===== 编辑大总结 =====
function editLargeSummary(i){
  var s=memoryLargeSummaries[i];if(!s)return;
  openMemEdit({
    title:' 编辑大总结',
    label:'大总结内容',
    content:s.content,
    onSave:function(v){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      s.content=v.trim();
      saveLargeSummaries();
      renderSummaries();
      sbt('ok',' 大总结已更新');setTimeout(hst,2000);
    }
  });
}

// ===== 编辑小总结 =====
function editSummary(i){
  var s=memorySummaries[i];if(!s)return;
  openMemEdit({
    title:' 编辑小总结',
    label:'小总结内容',
    content:s.content,
    onSave:function(v){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      s.content=v.trim();
      saveSummaries();
      renderSummaries();
      sbt('ok',' 小总结已更新');setTimeout(hst,2000);
    }
  });
}

// ===== 新增大总结 =====
function addLargeSummary(){
  openMemEdit({
    title:'＋ 新增大总结',
    label:'大总结内容',
    content:'',
    onSave:function(v){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      var time=new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      memoryLargeSummaries.push({content:v.trim(),time:time,t:Date.now(),type:'large'});
      saveLargeSummaries();
      renderSummaries();
      sbt('ok',' 大总结已添加');setTimeout(hst,2000);
    }
  });
}

// ===== 新增小总结 =====
function addSummary(){
  openMemEdit({
    title:'＋ 新增小总结',
    label:'小总结内容',
    content:'',
    onSave:function(v){
      if(!v.trim()){showDialog('提示','内容不能为空');return}
      var time=new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      memorySummaries.push({content:v.trim(),time:time,t:Date.now(),type:'small'});
      saveSummaries();
      renderSummaries();
      sbt('ok',' 小总结已添加');setTimeout(hst,2000);
    }
  });
}

// ===== 导出记忆 =====
function exportMemory(){
  var data={
    type:'qqy-memory',
    version:'2.0',
    exportTime:new Date().toLocaleString('zh-CN'),
    currentSlot:currentSlot,
    memorySlots:memorySlots,
    memorySummariesBySlot:memorySummariesBySlot,
    memoryLargeSummariesBySlot:memoryLargeSummariesBySlot,
    // 兼容旧版字段
    memorySummaries:memorySummaries,
    memoryLargeSummaries:memoryLargeSummaries
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='qqy-记忆-'+currentSlot+'-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  sbt('ok',' 记忆已导出');setTimeout(hst,2000);
}

// ===== 导入记忆 =====
function importMemory(){
  $('memImportFile').click();
}

function handleMemoryImport(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=async function(ev){
    try{
      var data=JSON.parse(ev.target.result);
      // 类型校验：必须是 qqy-memory 类型
      if(data.type!=='qqy-memory'){
        showDialog('导入失败','这不是记忆数据文件！\n\n请确认您导入的是从「记忆管理」页面导出的 JSON 文件。');
        return;
      }
      // 数据结构校验
      if(!data.memorySlots||typeof data.memorySlots!=='object'){
        showDialog('导入失败','记忆数据格式错误（缺少 memorySlots 字段）');
        return;
      }
      if(!await showDialog('确认导入','确定导入记忆数据吗？\n\n导入的记忆区将与本地记忆区合并（同名记忆区会被覆盖，其余保留）。','confirm'))return;
      // 合并导入：逐个槽位合并，不丢弃本地其他槽位
      var importedSlots=Object.keys(data.memorySlots);
      importedSlots.forEach(function(name){memorySlots[name]=data.memorySlots[name]});
      // 合并总结（优先使用新版按槽位结构，兼容旧版全局结构）
      if(data.memorySummariesBySlot&&typeof data.memorySummariesBySlot==='object'){
        for(var sk in data.memorySummariesBySlot){memorySummariesBySlot[sk]=data.memorySummariesBySlot[sk]}
      }else if(Array.isArray(data.memorySummaries)&&data.memorySummaries.length){
        memorySummariesBySlot[data.currentSlot||currentSlot]=data.memorySummaries;
      }
      if(data.memoryLargeSummariesBySlot&&typeof data.memoryLargeSummariesBySlot==='object'){
        for(var lk in data.memoryLargeSummariesBySlot){memoryLargeSummariesBySlot[lk]=data.memoryLargeSummariesBySlot[lk]}
      }else if(Array.isArray(data.memoryLargeSummaries)&&data.memoryLargeSummaries.length){
        memoryLargeSummariesBySlot[data.currentSlot||currentSlot]=data.memoryLargeSummaries;
      }
      if(data.currentSlot&&memorySlots[data.currentSlot]){
        currentSlot=data.currentSlot;
        storage.setItem('qqy_current_slot',currentSlot);
      }
      aiMemory=memorySlots[currentSlot]||[];
      memorySummaries=memorySummariesBySlot[currentSlot]||(memorySummariesBySlot[currentSlot]=[]);
      memoryLargeSummaries=memoryLargeSummariesBySlot[currentSlot]||(memoryLargeSummariesBySlot[currentSlot]=[]);
      storage.setItem('qqy_memory_slots',JSON.stringify(memorySlots));
      saveSummaries();saveLargeSummaries();
      renderSlotList();renderMemory();renderSummaries();renderUnsaved();
      sbt('ok',' 记忆导入成功（已合并 '+importedSlots.length+' 个记忆区）');setTimeout(hst,2000);
    }catch(err){
      showDialog('导入失败','JSON 解析错误\n\n'+err.message);
    }
  };
  reader.readAsText(file);
  e.target.value='';
}
