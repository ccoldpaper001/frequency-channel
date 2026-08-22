// ==============================
// ai.js - AI生成 + 提示词数据库
// ==============================

// ===== AI页选择符网格 =====
function renderAiSelGrid(){
  var all=getAllSels();
  $('aiSelGrid').innerHTML=all.map(function(a){
    var checked=selectedSels.has(a.s)?'checked':'';
    return '<div class="ai-sel-item '+checked+'" data-sel="'+escH(a.s)+'" onclick="toggleAiSel(this.dataset.sel)"><span class="chip-cn">'+a.g+'</span><span class="chip-code">'+a.s+'</span></div>';
  }).join('');
  updateAiSelCnt();
}
function toggleAiSel(sel){
  if(selectedSels.has(sel))selectedSels.delete(sel);else selectedSels.add(sel);
  renderAiSelGrid();rsel();
  var cnt=$('selCnt');if(cnt)cnt.textContent=selectedSels.size;
}
function updateAiSelCnt(){var c=$('aiSelCnt');if(c)c.textContent=selectedSels.size}

// ===== AI生成页 提示词管理（基础提示词可切换，修改实时同步数据库） =====
function loadPromptUI(){
  var all=getAllPrompts();
  var keys=Object.keys(all);
  if(keys.indexOf(currentPromptKey)<0)currentPromptKey=keys[0]||'';
  $('promptSel').innerHTML=keys.map(function(k){return '<option value="'+escH(k)+'" '+(k===currentPromptKey?'selected':'')+'>'+escH(k)+'</option>'}).join('');
  $('promptTa').value=all[currentPromptKey]||'';
}

function onPromptSelChange(){
  var v=$('promptSel').value;
  currentPromptKey=v;$('promptTa').value=getAllPrompts()[v]||'';
  storage.setItem('qqy_current_prompt',v);
  bindSetPrompt(currentSetKey,currentPromptKey);
}

// 文本框修改实时同步到提示词数据库
function onPromptTaInput(){
  var content=$('promptTa').value;
  if(!currentPromptKey)return;
  var item=promptDB.find(function(p){return p.type==='ai-gen'&&p.name===currentPromptKey});
  if(item){item.prompt=content;savePromptDB()}
  else{
    // 当前提示词不在数据库中时，自动创建条目避免修改静默丢失（创建前做重名防御）
    var dup=promptDB.find(function(p){return p.name===currentPromptKey&&p.type==='ai-gen'});
    if(dup){dup.prompt=content}
    else{promptDB.push({name:currentPromptKey,type:'ai-gen',note:'',prompt:content,api:'',builtin:false})}
    savePromptDB();
  }
}

// ===== 从 data.json 获取模板并渲染占位符 =====
function renderPromptTemplate(name,placeholders){
  var data=loadDefaultPromptsData();
  var item=data.prompts.find(function(p){return p.name===name});
  if(!item)return '';
  var text=item.prompt;
  for(var k in placeholders){
    text=text.replace(new RegExp('\{\{'+k+'\}\}','g'),placeholders[k]);
  }
  return text;
}

// ===== 构建AI提示词（发送顺序：基础提示词 → 选择符 → 用户额外要求） =====
function buildAiPrompt(){
  var basePrompt=getAllPrompts()[currentPromptKey]||'';
  var reqEl=$('ri');var req=reqEl?reqEl.value.trim():'';
  // 动态替换选择符占位符为当前选择符集的最新列表
  var dynamicRef='  '+getSelectorReference();
  var sp;
  if(basePrompt.indexOf('{{SELECTORS}}')>=0){
    sp=basePrompt.replace(/\{\{SELECTORS\}\}/g,dynamicRef);
  }else{
    // 兼容旧提示词（无占位符）：动态选择符列表附加到提示词末尾，确保始终使用最新选择符
    sp=basePrompt+'\n\n'+renderPromptTemplate('AI生成-兼容旧提示词模板',{SELECTORS:dynamicRef});
  }
  if(selectedSels.size>0){sp+='\n\n'+renderPromptTemplate('AI生成-只修改选择符模板',{SELECTED_SELS:Array.from(selectedSels).join(', ')})}
  var curCss=buildCss();if(curCss)sp+='\n\n'+renderPromptTemplate('AI生成-已有CSS模板',{CURRENT_CSS:curCss});
  if(req)sp+='\n\n'+renderPromptTemplate('AI生成-用户额外要求模板',{USER_REQUEST:req});
  sp+='\n\n'+renderPromptTemplate('AI生成-重要规则模板',{});
  return sp;
}

// ===== AI生成（智能判断：有选中则只修改选中，无选中则生成全部） =====
async function hg(skipMem){
  if(isP)return;
  if(!ak){sbt('err','请先设置API');$('akm').classList.add('active');return}
  var isMulti=selectedSels.size>0;
  isP=true;$('gb').disabled=true;$('gb').innerHTML='<span class="spin"></span> 生成中...';hst();
  try{
    var reqEl=$('ri');var req=reqEl?reqEl.value.trim():'';
    var sp=buildAiPrompt();
    var userContent=isMulti
      ?'只修改以下'+selectedSels.size+'个选择符的CSS：\n'+Array.from(selectedSels).join(', ')+(req?'\n需求：'+req:'')
      :'请生成CSS'+(req?'，需求：'+req:'');
    var messages=buildMessages(sp,userContent);
    var res=await fetch(buildApiUrl(akUrl,'/chat/completions'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ak},body:JSON.stringify({model:akModel,messages:messages,temperature:isMulti?.6:.7,max_tokens:4096})});
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    if(!d.choices||!d.choices[0])throw new Error('接口返回异常（可能是503服务不可用，请检查API配置）');
    var rawContent=d.choices[0].message&&d.choices[0].message.content;if(!rawContent)throw new Error('AI返回内容为空');var css=rawContent.replace(/^```css\s*/i,'').replace(/```\s*$/i,'').trim();
    if(memoryEnabled&&!skipMem){addMemory('user',userContent);addMemory('assistant',css);checkAutoSummary()}
    parseCssToStates(css);rsb();
    sbt('ok',isMulti?' 已修改'+selectedSels.size+'个区块':' 已填入编辑器');
    lastAiGen={css:css,type:isMulti?'multi':'all'};lastAiRequest={system:sp,user:userContent};showLastAiCss();
  }catch(err){var fullReq=sp+'\n\n[用户请求]\n'+userContent;var detail=typeof getApiSnapshot==='function'?getApiSnapshot(fullReq):null;if(typeof logAiError==='function')logAiError('AI生成',err.message||String(err),detail);sbt('err','AI生成失败：'+err.message)}
  finally{isP=false;$('gb').disabled=false;$('gb').innerHTML='<span></span> 生成'}
}

// ===== 此次AI生成的代码（显示 + 重说） =====
var lastAiGen=null;var lastAiRequest=null;

function showLastAiCss(){
  if(!lastAiGen)return;
  var sec=$('lastAiSection');if(sec)sec.style.display='block';
  var ta=$('lastAiCss');if(ta)ta.value=lastAiGen.css;
}

// ===== 查看本次请求的完整提示词 =====
function toggleLastAiReq(){
  var box=$('lastAiReqBox');if(!box)return;
  if(box.style.display==='none'){
    if(!lastAiRequest){sbt('err','暂无请求记录');setTimeout(hst,1500);return}
    var ta=$('lastAiReqText');
    if(ta)ta.value='【系统提示词】\n'+lastAiRequest.system+'\n\n【用户消息】\n'+lastAiRequest.user;
    box.style.display='block';
  }else{box.style.display='none'}
}

function copyLastAiReq(){
  var ta=$('lastAiReqText');if(!ta||!ta.value){sbt('err','暂无请求内容');setTimeout(hst,1500);return}
  navigator.clipboard.writeText(ta.value).then(function(){sbt('ok','已复制请求内容');setTimeout(hst,1500)}).catch(function(){ta.select();document.execCommand('copy');sbt('ok','已复制请求内容');setTimeout(hst,1500)});
}

function retryLastAi(){
  if(!lastAiGen){sbt('err','暂无可重试的生成记录');return}
  // 重说的内容不加入记忆
  hg(true)
}

// ===== 解析CSS到states =====
function parseCssToStates(css){
  var knownSels={};getAllSels().forEach(function(a){knownSels[a.s]=true});
  var parts=css.split('}').filter(function(p){return p.trim()});
  for(var pi=0;pi<parts.length;pi++){
    var p=parts[pi];var idx=p.lastIndexOf('{');if(idx===-1)continue;
    var cmtMatch=p.match(/\/\*\s*([^*]+?)\s*\*\//);
    var title=cmtMatch?cmtMatch[1].trim():'';
    var sel=p.substring(0,idx).trim().replace(/\/\*[\s\S]*?\*\//g,'');
    var props=p.substring(idx+1).trim().replace(/!important/g,'');
    if(!sel||!props)continue;
    if(!knownSels[sel])continue;
    if(!states[sel])states[sel]={};
    if(title)states[sel]._title=title;
    var gv=function(n){var m=props.match(new RegExp(n+'\\s*:\\s*([^;]+)','i'));return m?m[1].trim():''};
    var bg=gv('background(?:-color)?|background');var color=gv('(?:-webkit-text-fill-)?color');
    var br=gv('border-radius');var pad=gv('padding');var fs=gv('font-size');
    var w=gv('width');var h=gv('height');var op=gv('opacity');
    var sh=gv('box-shadow');var tsh=gv('text-shadow');
    var ta=gv('text-align');var fw=gv('font-weight');var fi=gv('font-style');
    var bgimg=gv('background-image');var ff=gv('font-family');var bgbl=gv('backdrop-filter');
    var bgsz=gv('background-size');var bgpos=gv('background-position');
    var bgrpt=gv('background-repeat');var bgattach=gv('background-attachment');
    if(bgimg){states[sel]._bg_type='image';states[sel]._bgimg=bgimg}
    else if(bg){if(bg==='transparent')states[sel]._bg_type='transparent';else if(bg.indexOf('gradient')>=0){states[sel]._bg_type='gradient';states[sel]._bg=bg}else{states[sel]._bg_type='solid';states[sel]._bg_color=bg;states[sel]._bg=bg}}
    if(bgsz)states[sel]._bgsz=bgsz;if(bgpos)states[sel]._bgpos=bgpos;if(bgrpt)states[sel]._bgrpt=bgrpt;if(bgattach)states[sel]._bgattach=bgattach;
    if(color&&color!=='transparent')states[sel]._color=color;
    if(br){var n=parseInt(br);if(!isNaN(n))states[sel]._br=String(n)}
    if(pad)states[sel]._pad=pad;if(fs)states[sel]._fs=fs;
    if(w)states[sel]._w=w;if(h)states[sel]._h=h;
    if(op&&op!=='1')states[sel]._op=op;
    if(sh&&sh!=='none'){states[sel]._sh_on='1';var cm=sh.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);var sc=cm?cm[0]:'rgba(0,0,0,0.3)';var nums=sh.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|none|!important/g,'').trim().split(/\s+/).filter(Boolean);states[sel]._sh_x=nums[0]||'0';states[sel]._sh_y=nums[1]||'0';states[sel]._sh_blur=nums[2]||'0';states[sel]._sh_spread=nums[3]||'0';states[sel]._sh_color=sc}
    if(tsh&&tsh!=='none'){states[sel]._tsh_on='1';var cm2=tsh.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);var sc2=cm2?cm2[0]:'rgba(255,255,255,0.5)';var nums2=tsh.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|none|!important/g,'').trim().split(/\s+/).filter(Boolean);states[sel]._tsh_x=nums2[0]||'0';states[sel]._tsh_y=nums2[1]||'0';states[sel]._tsh_blur=nums2[2]||'0';states[sel]._tsh_color=sc2}
    if(ta)states[sel]._ta=ta;
    if(fw&&parseInt(fw)>=600)states[sel]._fw='1';
    if(fi==='italic')states[sel]._fi='1';
    if(ff)states[sel]._ff=ff;
    if(bgbl){var m=bgbl.match(/blur\((\d+)px\)/);if(m)states[sel]._bgbl=m[1]}
  }
}

// ===== 提示词数据库页面 =====
var editingCpIdx=-1;

function renderCpApiOptions(selected){
  var sel=$('cpApi');if(!sel)return;
  var html='<option value="">默认（当前API配置）</option>';
  html+=apiPresets.map(function(p){
    return '<option value="'+escH(p.name)+'" '+(selected===p.name?'selected':'')+'>'+escH(p.name)+'（'+escH(p.model||'')+'）</option>';
  }).join('');
  sel.innerHTML=html;
}

function renderCpList(){
  var list=$('cpList');if(!list)return;
  if(promptDB.length===0){
    list.innerHTML='<div style="color:var(--td);padding:8px;font-size:12px">暂无提示词，点击「新建提示词」创建</div>';
    return;
  }
  // 按类型分组
  var groups={};
  var typeOrder=['ai-gen','ai-analyze','component'];
  promptDB.forEach(function(cp,i){
    var type=cp.type||'other';
    if(!groups[type])groups[type]=[];
    groups[type].push({cp:cp,idx:i});
  });
  // 渲染分组
  var html='';
  typeOrder.forEach(function(type){
    var items=groups[type];
    if(!items||!items.length)return;
    var label=PROMPT_TYPE_NAMES[type]||type;
    var isCollapsed=collapsedTypes[type];
    html+='<div class="prompt-group">';
    html+='<div class="prompt-group-header" onclick="togglePromptGroup(\''+type+'\')" style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg2);border-radius:8px;margin-bottom:6px;font-weight:600;font-size:13px;user-select:none">';
    html+='<span class="group-arrow" style="transition:transform .2s;display:inline-block">'+(isCollapsed?'▶':'▼')+'</span>';
    html+='<span>'+label+'</span>';
    html+='<span style="font-size:11px;color:var(--td);font-weight:400">（'+items.length+'条）</span>';
    html+='</div>';
    html+='<div class="prompt-group-body" data-group-type="'+type+'" style="display:'+(isCollapsed?'none':'block')+'">';
    items.forEach(function(item){
      var cp=item.cp,i=item.idx;
      var typeName=PROMPT_TYPE_NAMES[cp.type]||cp.type;
      var typeTag='<span style="display:inline-block;padding:1px 6px;background:rgba(126,85,255,.12);color:var(--pl);border-radius:4px;font-size:10px;margin-left:6px">'+escH(typeName)+'</span>';
      var builtinTag=cp.builtin?'<span style="display:inline-block;padding:1px 6px;background:rgba(56,239,125,.12);color:#2d8659;border-radius:4px;font-size:10px;margin-left:6px">默认</span>':'';
      var apiTag=cp.api?'<span style="display:inline-block;padding:1px 6px;background:rgba(56,239,125,.12);color:#2d8659;border-radius:4px;font-size:10px;margin-left:6px"> '+escH(cp.api)+'</span>':'';
      var pubTag=cp.is_public
        ?'<span style="display:inline-block;padding:1px 6px;background:rgba(56,239,125,.12);color:#2d8659;border-radius:4px;font-size:10px">公开</span>'
        :'<span style="display:inline-block;padding:1px 6px;background:rgba(120,120,130,.15);color:var(--td);border-radius:4px;font-size:10px">私密</span>';
      var pubBtn='<button class="cp-btn btn-sm" style="margin-left:auto;flex-shrink:0" '+(cp.is_public?'title="撤回公开，仅自己可见"':'title="公开到预设词广场，所有人可见"')+' onclick="event.stopPropagation();toggleCpPublic('+i+')">'+(cp.is_public?'设为私密':'设为公开')+'</button>';
      html+='<div class="cp-card" onclick="loadCpTemplate('+i+')" id="cpCard'+i+'">'+
        '<div class="cp-card-title" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span>'+escH(cp.name)+'</span>'+typeTag+apiTag+pubTag+pubBtn+'</div>'+
        '<div class="cp-card-desc">'+escH(cp.note||'')+'</div>'+
        '<div class="cp-collapse">'+
          '<div class="cp-card-prompt">'+escH((cp.prompt||'').substring(0,400))+(cp.prompt&&cp.prompt.length>400?'...':'')+'</div>'+
          '<div class="cp-card-actions"><button class="cp-btn btn-sm" onclick="event.stopPropagation();loadCpTemplate('+i+')">编辑</button><button class="cp-btn btn-sm" style="border-color:rgba(239,68,68,.3);color:#f87171" onclick="event.stopPropagation();deleteCpTemplate('+i+')">删除</button></div>'+
        '</div>'+
      '</div>';
    });
    html+='</div></div>';
  });
  // 处理未分类的
  var otherItems=groups['other'];
  if(otherItems&&otherItems.length){
    html+='<div class="prompt-group"><div class="prompt-group-header" style="padding:10px 14px;background:var(--bg2);border-radius:8px;margin-bottom:6px;font-weight:600;font-size:13px"> 其他（'+otherItems.length+'条）</div><div class="prompt-group-body">';
    otherItems.forEach(function(item){
      var cp=item.cp,i=item.idx;
      html+='<div class="cp-card" onclick="loadCpTemplate('+i+')" id="cpCard'+i+'"><div class="cp-card-title">'+escH(cp.name)+'</div></div>';
    });
    html+='</div></div>';
  }
  list.innerHTML=html;
}

// ===== 提示词公开/私密（与预设词广场按 用户+标题 匹配同步，默认私密） =====
async function cpPlazaRecordId(title){
  var uid=localStorage.getItem('forum_uid');
  if(typeof db==='undefined'||!uid)return null;
  try{
    var q=await db.from('prompt_presets').select('id').eq('user_id',uid).eq('title',title).limit(1);
    return (q.data&&q.data[0]&&q.data[0].id)||null;
  }catch(e){return null}
}
async function syncCpPlaza(cp,oldName){
  // 同步提示词的公开状态和内容到预设词广场；oldName 用于改名后定位旧记录
  var uid=localStorage.getItem('forum_uid');
  if(typeof db==='undefined'||!uid)return {ok:false,err:null};
  try{
    var recId=await cpPlazaRecordId(oldName||cp.name);
    if(cp.is_public){
      var payload={title:cp.name,content:cp.prompt||'',is_public:true,author_nickname:(typeof myProfile!=='undefined'&&myProfile&&myProfile.nickname)||''};
      if(recId){
        var u=await db.from('prompt_presets').update(payload).eq('id',recId);
        return {ok:!u.error,err:u.error};
      }
      var ins=await db.from('prompt_presets').insert(Object.assign({user_id:uid},payload));
      return {ok:!ins.error,err:ins.error};
    }
    if(recId){
      var d=await db.from('prompt_presets').update({is_public:false}).eq('id',recId);
      return {ok:!d.error,err:d.error};
    }
    return {ok:true,err:null};
  }catch(e){return {ok:false,err:e}}
}
async function toggleCpPublic(i){
  var cp=promptDB[i];if(!cp)return;
  if(typeof db==='undefined'||!localStorage.getItem('forum_uid')){showDialog('提示','请先在论坛登录后再设置公开');return}
  var makePublic=!cp.is_public;
  if(makePublic&&!await showDialog('确认公开','确定把「'+cp.name+'」设为公开吗？预设词广场的所有人都将看到它。','confirm'))return;
  cp.is_public=makePublic;
  var r=await syncCpPlaza(cp);
  if(!r.ok){
    cp.is_public=!makePublic;
    renderCpList();
    showDialog('同步失败',(r.err&&r.err.message)||'网络错误，请稍后再试');return;
  }
  savePromptDB();renderCpList();
  sbt('ok',makePublic?' 已设为公开，广场可见':' 已设为私密，仅自己可见');setTimeout(hst,2000);
}
var _cpPlazaSyncTimer=null;
function scheduleCpPlazaSync(idx){
  // 公开的提示词被编辑时延迟同步到广场，避免每个按键都发请求
  clearTimeout(_cpPlazaSyncTimer);
  _cpPlazaSyncTimer=setTimeout(function(){
    var cp=promptDB[idx];
    if(cp&&cp.is_public)syncCpPlaza(cp);
  },1500);
}

function toggleCpCard(i){
  var card=$('cpCard'+i);
  if(card)card.classList.toggle('expanded');
}

function saveCpInline(){
  if(editingCpIdx<0||!promptDB[editingCpIdx])return;
  var nameEl=$('cpEditName'),typeEl=$('cpEditType'),noteEl=$('cpEditNote'),promptEl=$('cpEditPrompt');
  if(!nameEl||!promptEl)return;
  promptDB[editingCpIdx].name=nameEl.value.trim()||promptDB[editingCpIdx].name;
  promptDB[editingCpIdx].type=typeEl?typeEl.value:promptDB[editingCpIdx].type;
  promptDB[editingCpIdx].note=noteEl?noteEl.value.trim():'';
  promptDB[editingCpIdx].prompt=promptEl.value;
  savePromptDB();
  if(promptDB[editingCpIdx].is_public)scheduleCpPlazaSync(editingCpIdx);
  var card=$('cpCard'+editingCpIdx);
  if(card){
    var titleEl=card.querySelector('.cp-card-title');
    if(titleEl)titleEl.textContent=promptDB[editingCpIdx].name;
  }
}

function newCpTemplate(){
  editingCpIdx=-1;
  $('cpName').value='';$('cpType').value='ai-gen';$('cpNote').value='';$('cpPrompt').value='';
  renderCpApiOptions('');
}

function loadCpTemplate(i){
  var cp=promptDB[i];if(!cp)return;
  editingCpIdx=i;
  var card=$('cpCard'+i);
  if(!card)return;
  // 自动展开所在分组
  var groupBody=card.closest('.prompt-group-body');
  if(groupBody&&groupBody.style.display==='none'){
    var groupType=groupBody.getAttribute('data-group-type');
    if(groupType&&typeof togglePromptGroup==='function')togglePromptGroup(groupType);
  }
  var existing=card.querySelector('.cp-edit-inline');
  if(existing){existing.remove();card.style.borderColor='';return}
  document.querySelectorAll('.cp-edit-inline').forEach(function(el){el.remove()});
  document.querySelectorAll('.cp-card').forEach(function(el){el.style.borderColor=''});
  var editDiv=document.createElement('div');
  editDiv.className='cp-edit-inline';
  editDiv.style.cssText='padding:12px;background:var(--bg2);border-radius:0 0 8px 8px;border-top:1px solid var(--br);margin-top:-1px';
  editDiv.addEventListener('click',function(e){e.stopPropagation()});
  editDiv.innerHTML='<div class="md-field"><label>名称</label><input type="text" id="cpEditName" value="'+escH(cp.name||'')+'" oninput="saveCpInline()"></div>'+
    '<div class="md-field"><label>类型</label><select id="cpEditType" onchange="saveCpInline()"><option value="ai-gen" '+(cp.type==='ai-gen'?'selected':'')+'>AI智能生成提示词</option><option value="ai-analyze" '+(cp.type==='ai-analyze'?'selected':'')+'>AI分析组件提示词</option><option value="component" '+(cp.type==='component'?'selected':'')+'>组件提示词</option></select></div>'+
    '<div class="md-field"><label>备注</label><input type="text" id="cpEditNote" value="'+escH(cp.note||'')+'" oninput="saveCpInline()"></div>'+
    '<div class="md-field"><label>提示词内容</label><textarea id="cpEditPrompt" rows="8" oninput="saveCpInline()">'+escH(cp.prompt||'')+'</textarea></div>'+
    '<div style="display:flex;gap:6px;margin-top:8px"><button class="cp-btn btn-sm" onclick="event.stopPropagation();deleteCpTemplate('+i+')" style="border-color:rgba(239,68,68,.3);color:#f87171"> 删除</button><button class="cp-btn btn-sm" onclick="event.stopPropagation();loadCpTemplate('+i+')"> 收起</button></div>';
  card.appendChild(editDiv);
  card.style.borderColor='var(--p)';
}

function saveCpTemplate(){
  var name=$('cpName').value.trim();
  if(!name){showDialog('提示','请填写名称');return}
  var oldName=editingCpIdx>=0?promptDB[editingCpIdx].name:null;
  var cp={
    name:name,
    type:$('cpType').value,
    note:$('cpNote').value.trim(),
    prompt:$('cpPrompt').value,
    api:$('cpApi')?$('cpApi').value:'',
    builtin:editingCpIdx>=0?(promptDB[editingCpIdx].builtin||false):false,
    is_public:editingCpIdx>=0?(promptDB[editingCpIdx].is_public||false):false
  };
  if(editingCpIdx>=0){
    // 编辑时若改名，需检查新名字是否与其他提示词重名
    var dup=promptDB.find(function(p,idx){return idx!==editingCpIdx&&p.name===name&&p.type===cp.type});
    if(dup){showDialog('提示','已存在同名同类型的提示词「'+name+'」，请换一个名称');return}
    promptDB[editingCpIdx]=cp
  }
  else{
    if(promptDB.find(function(p){return p.name===name&&p.type===cp.type})){showDialog('提示','同名提示词已存在');return}
    promptDB.push(cp);editingCpIdx=promptDB.length-1;
  }
  savePromptDB();
  if(cp.is_public)syncCpPlaza(cp,oldName);
  renderCpList();
  loadPromptUI();
  sbt('ok',' 已保存');setTimeout(hst,2000);
}

async function deleteCpTemplate(i){
  var idx=(i!==undefined)?i:editingCpIdx;
  if(idx<0||!promptDB[idx]){showDialog('提示','请先选择一个提示词');return}
  if(!await showDialog('确认删除','删除提示词「'+promptDB[idx].name+'」？','confirm'))return;
  var removed=promptDB[idx];
  promptDB.splice(idx,1);
  if(removed.is_public){
    // 公开的提示词被删除时，同步从广场移除
    var recId=await cpPlazaRecordId(removed.name);
    if(recId)db.from('prompt_presets').delete().eq('id',recId).then(function(){});
  }
  savePromptDB();
  editingCpIdx=-1;
  newCpTemplate();
  renderCpList();
  loadPromptUI();
}

// ===== 组件生成器 =====
function renderCgRules(){
  var sel=$('cgRule');if(!sel)return;
  var rules=getPromptsByType('ai-analyze');
  sel.innerHTML=rules.map(function(p){return '<option value="'+escH(p.name)+'">'+escH(p.name)+'</option>'}).join('')||'<option value="">（暂无分析规则，请先在数据库中创建）</option>';
}

function renderCgPresets(){
  var sel=$('cgPreset');if(!sel)return;
  var presets=getPromptsByType('component');
  var html='<option value="">（不使用预设）</option>';
  html+=presets.map(function(p){return '<option value="'+escH(p.name)+'">'+escH(p.name)+'</option>'}).join('');
  sel.innerHTML=html;
}

function renderCgApiOptions(){
  var sel=$('cgApi');if(!sel)return;
  var html='<option value="">主API（当前API配置）</option>';
  html+=apiPresets.map(function(p){
    return '<option value="'+escH(p.name)+'">'+escH(p.name)+'（'+escH(p.model||'')+'）</option>';
  }).join('');
  sel.innerHTML=html;
}

// ===== 功能A：分析组件代码 → 生成组件提示词 → 存入数据库 =====
async function cgAnalyzePrompt(){
  var codeEl=$('cgCode');var code=codeEl?codeEl.value.trim():'';
  if(!code){showDialog('提示','请先粘贴组件代码');return}
  var ruleName=$('cgRule').value;
  var rule=promptDB.find(function(p){return p.type==='ai-analyze'&&p.name===ruleName});
  if(!rule){showDialog('提示','请选择一个分析规则');return}
  if(!ak){sbt('err','请先设置API');$('akm').classList.add('active');return}

  var userContent=buildCgUserContent('',$('cgExtra')?$('cgExtra').value.trim():'',code);

  var btn=$('cgAnalyzePrompt');btn.disabled=true;btn.textContent=' 生成中...';
  try{
    var res=await fetch(buildApiUrl(akUrl,'/chat/completions'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ak},body:JSON.stringify({model:akModel,messages:[{role:'system',content:rule.prompt},{role:'user',content:userContent}],temperature:.4,max_tokens:4096})});
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    if(!d.choices||!d.choices[0])throw new Error('接口返回异常');
    var cgContent=d.choices[0].message&&d.choices[0].message.content;if(!cgContent)throw new Error('AI返回内容为空');$('cgResult').value=cgContent.trim();
    rememberAIResult('组件分析',cgContent);
    sbt('ok',' 提示词生成完成');setTimeout(hst,2000);
  }catch(err){if(typeof logAiError==='function')logAiError('生成提示词',err.message||String(err));showDialog('生成失败',err.message)}
  finally{btn.disabled=false;btn.textContent=' 生成提示词'}
}

// ===== 功能B：生成配置 → 生成真实组件代码 → 存入记忆 =====
async function cgAnalyze(){
  var presetName=$('cgPreset')?$('cgPreset').value:'';
  var presetPrompt='';
  if(presetName){
    var cp=promptDB.find(function(p){return p.type==='component'&&p.name===presetName});
    if(cp)presetPrompt=cp.prompt;
  }
  var extraEl=$('cgExtra');var extra=extraEl?extraEl.value.trim():'';
  if(!presetPrompt&&!extra){showDialog('提示','请至少选择提示词预设或填写额外要求');return}

  var useUrl=akUrl,useKey=ak,useModel=akModel;
  var apiSel=$('cgApi');
  if(apiSel&&apiSel.value){
    var preset=apiPresets.find(function(p){return p.name===apiSel.value});
    if(preset){useUrl=preset.url;useKey=preset.key;useModel=preset.model}
  }
  if(!useKey){sbt('err','请先设置API');$('akm').classList.add('active');return}

  var btn=$('cgAnalyze');btn.disabled=true;btn.textContent=' 生成中...';

  // 组装请求：预设作为参考范例，额外要求作为补充指令
  var userContent='';
  if(presetPrompt)userContent+='【参考范例】以下是组件提示词，请参考其风格和结构生成对应的真实组件代码：\n\n'+presetPrompt+'\n\n';
  if(extra)userContent+='【额外要求】'+extra+'\n\n';
  userContent+='请根据以上参考范例和额外要求，直接输出完整的、可复用的组件代码（HTML / CSS / JavaScript），不要输出分析说明或解释文字。';

  try{
    var res=await fetch(buildApiUrl(useUrl,'/chat/completions'),{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+useKey},body:JSON.stringify({model:useModel,messages:[{role:'system',content:'你是一个前端组件代码生成器。根据用户提供的组件提示词（描述组件结构和样式特点）和额外要求，生成完整的、可直接使用的 HTML/CSS/JavaScript 组件代码。只输出代码，不要输出解释。'},{role:'user',content:userContent}],temperature:.4,max_tokens:4096})});
    if(!res.ok){var e=await res.json().catch(function(){});throw new Error((e&&e.error&&e.error.message)||'HTTP '+res.status)}
    var d=await res.json();
    if(!d.choices||!d.choices[0])throw new Error('接口返回异常');
    var cgCodeContent=d.choices[0].message&&d.choices[0].message.content;if(!cgCodeContent)throw new Error('AI返回内容为空');$('cgCodeResult').value=cgCodeContent.trim();
    rememberAIResult('代码生成',cgCodeContent);
    if(typeof cgUpdatePreview==='function')cgUpdatePreview();
    sbt('ok',' 组件代码生成完成');setTimeout(hst,2000);
  }catch(err){var fullReq='你是一个前端组件代码生成器。根据用户提供的组件提示词（描述组件结构和样式特点）和额外要求，生成完整的、可直接使用的 HTML/CSS/JavaScript 组件代码。只输出代码，不要输出解释。'+'\n\n[用户请求]\n'+userContent;var detail=typeof getApiSnapshot==='function'?getApiSnapshot(fullReq):null;if(typeof logAiError==='function')logAiError('生成代码',err.message||String(err),detail);alert('生成失败：'+err.message)}
  finally{btn.disabled=false;btn.textContent=' 生成代码'}
}

function cgSave(){
  var contentEl=$('cgResult');var content=contentEl?contentEl.value.trim():'';
  if(!content){showDialog('提示','暂无生成结果可保存');return}
  var name=prompt('保存为提示词名称：','组件提示词'+(getPromptsByType('component').length+1));
  if(!name)return;
  if(promptDB.find(function(p){return p.name===name&&p.type==='component'})){showDialog('提示','同名组件提示词已存在');return}
  promptDB.push({name:name,type:'component',note:'由组件生成器生成',prompt:content,api:'',builtin:false});
  savePromptDB();renderCpList();
  sbt('ok',' 已存入数据库');setTimeout(hst,2000);
}

// ===== 组装组件分析的用户提示词（预览与实际发送共用，保证一致） =====
function buildCgUserContent(presetPrompt,extra,code){
  var userContent='';
  if(presetPrompt)userContent+=renderPromptTemplate('组件分析-提示词预设模板',{PRESET_PROMPT:presetPrompt})+'\n\n';
  if(extra)userContent+=renderPromptTemplate('组件分析-用户额外要求模板',{EXTRA_REQUEST:extra})+'\n\n';
  userContent+=renderPromptTemplate('组件分析-待分析代码模板',{COMPONENT_CODE:code});
  return userContent;
}

// ===== 提示词实时预览：展示发送给AI的完整提示词（system规则 + user内容） =====
function updateCgPreview(){
  var box=$('cgPreview');if(!box)return;
  var ruleName=$('cgRule')?$('cgRule').value:'';
  var rule=promptDB.find(function(p){return p.type==='ai-analyze'&&p.name===ruleName});
  var code=$('cgCode')?$('cgCode').value.trim():'';
  var extra=$('cgExtra')?$('cgExtra').value.trim():'';
  var presetName=$('cgPreset')?$('cgPreset').value:'';
  var presetPrompt='';
  if(presetName){var cp=promptDB.find(function(p){return p.type==='component'&&p.name===presetName});if(cp)presetPrompt=cp.prompt}
  if(!rule&&!code){box.value='';return}
  var preview='════════ 【System】分析规则：'+(ruleName||'（未选择）')+' ════════\n\n'+(rule?rule.prompt:'（请先选择分析规则）');
  preview+='\n\n════════ 【User】组装内容 ════════\n\n'+buildCgUserContent(presetPrompt,extra,code||'（尚未粘贴组件代码）');
  box.value=preview;
}

// ===== 数据导入导出（JSON文件） =====
function exportAllData(){
  var data={
    _meta:{app:'工具箱',version:1,exportTime:new Date().toLocaleString('zh-CN')},
    promptDB:promptDB,
    customSets:customSets,
    apiPresets:apiPresets.map(function(p){return {name:p.name,url:p.url,model:p.model}}) // 不导出API Key，保护隐私
  };
  var json=JSON.stringify(data,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='toolbox-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  sbt('ok',' 数据已导出为JSON文件');setTimeout(hst,2000);
}

function importAllData(file){
  var reader=new FileReader();
  reader.onload=async function(e){
    try{
      var data=JSON.parse(e.target.result);
      var report=[];
      // 导入提示词（在原有基础上合并，同名同类型询问覆盖）
      if(Array.isArray(data.promptDB)){
        var added=0,updated=0,skipped=0;
        for(var np of data.promptDB){
          if(!np.name||!np.type)continue;
          var idx=promptDB.findIndex(function(p){return p.name===np.name&&p.type===np.type});
          if(idx>=0){
            if(promptDB[idx].builtin){skipped++;continue}
            if(await showDialog('确认覆盖','提示词「'+np.name+'」已存在，是否覆盖？','confirm')){promptDB[idx]=np;updated++}
            else skipped++;
          }else{promptDB.push(np);added++}
        }
        savePromptDB();renderCpList();loadPromptUI();
        report.push('提示词：新增'+added+'条，更新'+updated+'条，跳过'+skipped+'条');
      }
      // 导入选择符集（在原有基础上合并）
      if(data.customSets&&typeof data.customSets==='object'){
        var sAdded=0,sUpdated=0;
        for(var key in data.customSets){
          if(customSets[key]){
            if(await showDialog('确认覆盖','选择符集「'+(data.customSets[key].name||key)+'」已存在，是否覆盖？','confirm')){customSets[key]=data.customSets[key];sUpdated++}
          }else{customSets[key]=data.customSets[key];sAdded++}
        }
        storage.setItem('qqy_custom_sets',JSON.stringify(customSets));
        renderSetList();renderAiSelGrid();
        report.push('选择符集：新增'+sAdded+'个，更新'+sUpdated+'个');
      }
      // 导入API预设（不含Key，需用户自行补填）
      if(Array.isArray(data.apiPresets)){
        var aAdded=0;
        data.apiPresets.forEach(function(np){
          if(!np.name)return;
          if(!apiPresets.find(function(p){return p.name===np.name})){
            apiPresets.push({name:np.name,url:np.url||'',key:'',model:np.model||''});aAdded++;
          }
        });
        storage.setItem('qqy_api_presets',JSON.stringify(apiPresets));
        report.push('API预设：新增'+aAdded+'个（Key需手动补填）');
      }
      if(report.length===0){showDialog('提示','未在文件中找到可导入的数据');return}
      showDialog('导入完成',' 导入完成\n\n'+report.join('\n'));
    }catch(err){showDialog('导入失败','文件格式不正确\n'+err.message)}
  };
  reader.readAsText(file);
}


// ===== 数据管理功能 =====
function updateCacheInfo(){
  var info=$('cpCacheInfo');if(!info)return;
  var cached=storage.getItem('qqy_prompt_db');
  if(cached){
    try{
      var data=JSON.parse(cached);
      info.textContent='已缓存 '+data.length+' 条提示词（localStorage）';
    }catch(e){info.textContent='缓存数据格式错误'}
  }else{info.textContent='暂无缓存，使用 data.json 默认数据'}
}

function reloadDataFromFile(){
  if(!confirm('确定重新加载 data.json 吗？\n\n这将覆盖当前所有提示词修改！'))return;
  storage.removeItem('qqy_prompt_db');
  promptDB=buildDefaultPromptDB();
  savePromptDB();
  renderCpList();
  loadPromptUI();
  updateCacheInfo();
  sbt('ok',' 已重新加载 data.json');setTimeout(hst,2000);
}

function viewCacheData(){
  var view=$('cpDataView');if(!view)return;
  var cached=storage.getItem('qqy_prompt_db');
  if(cached){
    try{
      var data=JSON.parse(cached);
      view.textContent=JSON.stringify(data,null,2);
      view.style.display='block';
    }catch(e){view.textContent='缓存数据格式错误：'+e.message;view.style.display='block'}
  }else{view.textContent='暂无缓存数据';view.style.display='block'}
}

function clearPromptCache(){
  if(!confirm('确定清除提示词缓存吗？\n\n这将删除所有自定义提示词修改！'))return;
  storage.removeItem('qqy_prompt_db');
  promptDB=buildDefaultPromptDB();
  savePromptDB();
  renderCpList();
  loadPromptUI();
  updateCacheInfo();
  sbt('ok',' 已清除提示词缓存');setTimeout(hst,2000);
}
