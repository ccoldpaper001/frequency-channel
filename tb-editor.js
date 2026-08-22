// ==============================
// editor.js - 区块编辑器 + 选择符管理 + 文本导入
// ==============================

var expandedBlock=null;

// ===== CSS选择器列表 =====
function rsel(){
  var all=getAllSels();
  var html=all.map(function(a){
    var isCur=(expandedBlock===a.s);
    var isEd=isEdited(a.s);
    var cls='cs-sel-item';
    if(isCur)cls+=' cs-active';
    if(isEd)cls+=' cs-edited';
    return '<div class="'+cls+'" data-sel="'+escH(a.s)+'" onclick="selectSelector(this.dataset.sel)" title="'+a.g+(a.h?' - '+a.h:'')+'">'+
      '<span class="cs-sel-code">'+a.s+'</span>'+
      (a.h?'<span class="cs-sel-hint">'+a.h+'</span>':'')+
      (isEd?'<span class="cs-sel-dot">●</span>':'')+
      '</div>';
  }).join('');
  $('bsel').innerHTML=html||'<div class="cs-empty">暂无选择符</div>';
}

function selectSelector(sel){
  if(expandedBlock&&expandedBlock!==sel){
    saveCodeEditor(expandedBlock);
  }
  expandedBlock=sel;
  rsel();
  rsb();
}

function saveCodeEditor(sel){
  var ta=document.getElementById('csCodeTa');
  if(ta&&states[sel]){
    var code=ta.value.trim();
    if(code){states[sel]._raw=code}else{delete states[sel]._raw}
    rsel();
  }
}

function onCodeEdit(sel){
  if(!states[sel])states[sel]={};
  var ta=document.getElementById('csCodeTa');
  if(!ta)return;
  var code=ta.value.trim();
  if(code){states[sel]._raw=code}else{delete states[sel]._raw}
  rsel();
}

function flt(sel){selFilter=sel;rsel();rsb()}
function selectAllSels(){var all=getAllSels();if(selectedSels.size===all.length){all.forEach(function(a){selectedSels.delete(a.s)})}else{all.forEach(function(a){selectedSels.add(a.s)})}rsel();rsb()}
function clearSel(){selectedSels.clear();rsel();rsb()}

function isEdited(sel){var s=states[sel];if(!s)return false;if(s._raw&&s._raw.trim())return true;for(var k in s){if(k.startsWith('_')&&s[k]!==''&&s[k]!==undefined&&s[k]!==null&&s[k]!==false&&s[k]!=='transparent'&&s[k]!=='none'&&s[k]!=='0'&&s[k]!=='1'&&k!=='_title')return true;if(k==='_br'&&s[k]&&s[k]!=='0')return true;if(k==='_fs'&&s[k]&&s[k]!=='16')return true;if(k==='_pad'&&s[k]&&s[k]!=='0')return true;if(k==='_bgbl'&&s[k]&&s[k]!=='0')return true}return false}

// ===== 代码编辑器 + 可视化参数 =====
function rsb(){
  if(!expandedBlock){
    $('blist').innerHTML='<div class="cs-empty">点击上方选择器开始编辑CSS</div>';
    return;
  }
  var sel=expandedBlock;
  var s=states[sel]||{};
  var cs=buildBlockCss(sel);
  var sq=sel.replace(/'/g,"\\'");
  var bgType=s._bg_type||(s._bgimg?'image':(!s._bg||s._bg==='transparent')?'transparent':(s._bg&&s._bg.indexOf('gradient')>=0)?'gradient':'solid');
  var imgVal=s._bgimg||'';var bgsz=s._bgsz||'cover';var bgpos=s._bgpos||'center';
  var bgrpt=s._bgrpt||'no-repeat';var bgattach=s._bgattach||'';
  var bgSolid=s._bg_color||toHex(s._bg)||'#ffffff';var bgGrad=s._bg_grad||'none';
  var colorVal=toHex(s._color)||'#ffffff';
  var shOn=s._sh_on==='1'||(!s._sh_on&&s._sh&&s._sh!=='none');
  var tshOn=s._tsh_on==='1'||(!s._tsh_on&&s._tsh&&s._tsh!=='none');
  var shd=shOn?(s._sh_on==='1'?{x:s._sh_x,y:s._sh_y,blur:s._sh_blur,spread:s._sh_spread,color:s._sh_color}:parseShadow(s._sh)):{};
  var tshd=tshOn?(s._tsh_on==='1'?{x:s._tsh_x,y:s._tsh_y,blur:s._tsh_blur,color:s._tsh_color}:parseShadow(s._tsh)):{};
  var isEd=isEdited(sel);
  // 查找当前选择符的中文备注与分组
  var selInfo=null;var allSels=getAllSels();
  for(var si=0;si<allSels.length;si++){if(allSels[si].s===sel){selInfo=allSels[si];break}}
  var hintText=selInfo?(selInfo.h||''):'';
  var groupText=selInfo?selInfo.g:'';
  var html='<div class="cs-editor-wrap'+(isEd?' cs-edited-border':'')+'">';
  // 编辑器头部
  html+='<div class="cs-editor-header">'+
    '<span class="cs-editor-label">当前编辑选择器:</span>'+
    '<span class="cs-editor-sel-name">'+sel+'</span>'+
    '<div class="cs-editor-actions">'+
      '<button class="cp-btn btn-sm" onclick="copyBlock(\''+sq+'\')"> 复制</button>'+
    '</div></div>';
  // 中文备注（重点突出，显示在代码上方）
  if(hintText||groupText){
    html+='<div class="cs-hint-banner">'+
      '<span class="cs-hint-group"> '+groupText+'</span>'+
      (hintText?'<span class="cs-hint-text">'+hintText+'</span>':'')+
    '</div>';
  }
  // CSS代码编辑器
  html+='<div class="cs-code-section">'+
    '<div class="cs-section-label">CSS代码:</div>'+
    '<textarea class="cs-code-ta" id="csCodeTa" oninput="onCodeEdit(\''+sq+'\')" spellcheck="false" placeholder="'+sel+' {\n  /* 在此编辑CSS */\n}">'+escH(cs||'')+'</textarea>'+
  '</div>';
  // 可视化参数
  html+='<div class="cs-params-section">';
  html+='<div class="cs-section-label">可视化参数:</div>';
  html+='<div class="cs-params-grid">';
  // 背景颜色
  html+='<div class="cs-param-row"><label>背景颜色</label>'+
    '<select onchange="upd(\''+sq+'\',\'_bg_type\',this.value)">'+
    '<option value="solid" '+(bgType==='solid'?'selected':'')+'>纯色</option>'+
    '<option value="gradient" '+(bgType==='gradient'?'selected':'')+'>渐变</option>'+
    '<option value="image" '+(bgType==='image'?'selected':'')+'>图片</option>'+
    '<option value="transparent" '+(bgType==='transparent'?'selected':'')+'>透明</option></select>'+
    (bgType==='solid'?'<input type="color" value="'+bgSolid+'" onchange="upd(\''+sq+'\',\'_bg_color\',this.value);upd(\''+sq+'\',\'_bg_type\',\'solid\')"><button class="cp-btn btn-sm" onclick="upd(\''+sq+'\',\'_bg_color\',\'\');upd(\''+sq+'\',\'_bg_type\',\'solid\')">清除</button>':'')+
    (bgType==='gradient'?'<select onchange="upd(\''+sq+'\',\'_bg_grad\',this.value);upd(\''+sq+'\',\'_bg_type\',\'gradient\');geApplyPreset(\''+sq+'\',this.value)">'+Object.keys(GRADIENTS).map(function(k){return '<option value="'+k+'" '+(bgGrad===k?'selected':'')+'>'+GRADIENT_NAMES[k]+'</option>'}).join('')+'</select>':'')+
    '</div>'+
    (bgType==='gradient'?geRenderEditor(sq,s):'');
  if(bgType==='image'){
    html+='<div class="cs-param-row"><label>图片URL</label><input type="text" style="flex:1;min-width:180px" value="'+imgVal.replace(/"/g,'&quot;')+'" placeholder="https://..." oninput="upd(\''+sq+'\',\'_bgimg\',\'url(\'+this.value+\')\');upd(\''+sq+'\',\'_bg_type\',\'image\')"><button class="cp-btn btn-sm" onclick="upd(\''+sq+'\',\'_bgimg\',\'\');upd(\''+sq+'\',\'_bg_type\',\'transparent\')">清除</button></div>'+
    '<div class="cs-param-row"><label>图片设置</label><label>缩放</label><select onchange="upd(\''+sq+'\',\'_bgsz\',this.value)"><option value="cover" '+(bgsz==='cover'?'selected':'')+'>填充</option><option value="contain" '+(bgsz==='contain'?'selected':'')+'>完整</option><option value="100% 100%" '+(bgsz==='100% 100%'?'selected':'')+'>拉伸</option><option value="auto" '+(bgsz==='auto'?'selected':'')+'>经典</option></select><label>位置</label><select onchange="upd(\''+sq+'\',\'_bgpos\',this.value)"><option value="center" '+(bgpos==='center'?'selected':'')+'>居中</option><option value="top" '+(bgpos==='top'?'selected':'')+'>顶部</option><option value="bottom" '+(bgpos==='bottom'?'selected':'')+'>底部</option><option value="left" '+(bgpos==='left'?'selected':'')+'>左</option><option value="right" '+(bgpos==='right'?'selected':'')+'>右</option></select><label>重复</label><select onchange="upd(\''+sq+'\',\'_bgrpt\',this.value)"><option value="no-repeat" '+(bgrpt==='no-repeat'?'selected':'')+'>不重复</option><option value="repeat" '+(bgrpt==='repeat'?'selected':'')+'>平铺</option></select></div>';
  }
  // 文字颜色
  html+='<div class="cs-param-row"><label>文字颜色</label><input type="color" value="'+colorVal+'" onchange="upd(\''+sq+'\',\'_color\',this.value)"><button class="cp-btn btn-sm" onclick="upd(\''+sq+'\',\'_color\',\'\')">清除</button></div>';
  // 字体大小
  html+='<div class="cs-param-row"><label>字体大小</label><input type="number" min="10" max="48" value="'+(s._fs||'16')+'" style="width:60px" onchange="upd(\''+sq+'\',\'_fs\',this.value)"><span class="cs-unit">px</span></div>';
  // 圆角
  html+='<div class="cs-param-row"><label>圆角</label><input type="number" min="0" max="50" value="'+(s._br!==undefined&&s._br!==null?s._br:'0')+'" style="width:60px" onchange="upd(\''+sq+'\',\'_br\',this.value)"><span class="cs-unit">px</span></div>';
  // 宽度
  html+='<div class="cs-param-row"><label>宽度</label><select onchange="upd(\''+sq+'\',\'_w\',this.value)">'+['auto','100%','95%','90%','80%','70%','60%','50%'].map(function(v){return '<option value="'+v+'" '+(s._w===v?'selected':'')+'>'+v+'</option>'}).join('')+'</select></div>';
  // 高度
  html+='<div class="cs-param-row"><label>高度</label><select onchange="upd(\''+sq+'\',\'_h\',this.value)">'+['auto','100%','50px','100px','150px','200px','300px'].map(function(v){return '<option value="'+v+'" '+(s._h===v?'selected':'')+'>'+v+'</option>'}).join('')+'</select></div>';
  // 透明度
  html+='<div class="cs-param-row"><label>透明度</label><input type="number" min="0" max="1" step="0.05" value="'+(s._op||'1')+'" style="width:60px" onchange="upd(\''+sq+'\',\'_op\',this.value)"></div>';
  // 内边距
  html+='<div class="cs-param-row"><label>内边距</label><input type="number" min="0" max="40" value="'+(s._pad||'0')+'" style="width:60px" onchange="upd(\''+sq+'\',\'_pad\',this.value)"><span class="cs-unit">px</span></div>';
  // 阴影
  html+='<div class="cs-param-row"><label>阴影</label><input type="checkbox" '+(shOn?'checked':'')+' onchange="toggleShadow(\''+sq+'\',\'sh\',this.checked)"><label style="min-width:auto">启用</label>';
  if(shOn){html+='<input type="color" value="'+(toHex(shd.color)||'#000000')+'" onchange="upd(\''+sq+'\',\'_sh_color\',this.value)"><label>X</label><input type="number" min="-20" max="20" value="'+(shd.x||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_sh_x\',this.value)"><label>Y</label><input type="number" min="-20" max="20" value="'+(shd.y||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_sh_y\',this.value)"><label>模糊</label><input type="number" min="0" max="40" value="'+(shd.blur||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_sh_blur\',this.value)">'}
  html+='</div>';
  // 文字阴影
  html+='<div class="cs-param-row"><label>文字阴影</label><input type="checkbox" '+(tshOn?'checked':'')+' onchange="toggleShadow(\''+sq+'\',\'tsh\',this.checked)"><label style="min-width:auto">启用</label>';
  if(tshOn){html+='<input type="color" value="'+(toHex(tshd.color)||'#ffffff')+'" onchange="upd(\''+sq+'\',\'_tsh_color\',this.value)"><label>X</label><input type="number" min="-20" max="20" value="'+(tshd.x||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_tsh_x\',this.value)"><label>Y</label><input type="number" min="-20" max="20" value="'+(tshd.y||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_tsh_y\',this.value)"><label>模糊</label><input type="number" min="0" max="40" value="'+(tshd.blur||'0')+'" style="width:50px" onchange="upd(\''+sq+'\',\'_tsh_blur\',this.value)">'}
  html+='</div>';
  // 对齐
  html+='<div class="cs-param-row"><label>对齐</label><select onchange="upd(\''+sq+'\',\'_ta\',this.value)"><option value="" '+(!s._ta?'selected':'')+'>默认</option><option value="left" '+(s._ta==='left'?'selected':'')+'>左</option><option value="center" '+(s._ta==='center'?'selected':'')+'>中</option><option value="right" '+(s._ta==='right'?'selected':'')+'>右</option></select></div>';
  // 字体
  html+='<div class="cs-param-row"><label>字体</label><select onchange="upd(\''+sq+'\',\'_ff\',this.value)">'+FONTS.map(function(f){return '<option value="'+f.value+'" '+(s._ff===f.value?'selected':'')+'>'+f.name+'</option>'}).join('')+'</select></div>';
  // 毛玻璃+加粗+斜体
  html+='<div class="cs-param-row"><label>毛玻璃</label><input type="number" min="0" max="40" value="'+(s._bgbl||'0')+'" style="width:60px" onchange="upd(\''+sq+'\',\'_bgbl\',this.value)"><span class="cs-unit">px</span><label>加粗</label><input type="checkbox" '+(s._fw==='1'?'checked':'')+' onchange="upd(\''+sq+'\',\'_fw\',this.checked?\'1\':\'\')"><label style="min-width:auto">斜体</label><input type="checkbox" '+(s._fi==='1'?'checked':'')+' onchange="upd(\''+sq+'\',\'_fi\',this.checked?\'1\':\'\')"></div>';
  html+='</div>'; // cs-params-grid
  html+='</div>'; // cs-params-section
  html+='</div>'; // cs-editor-wrap
  $('blist').innerHTML=html;
}

function toggleBlock(sel){selectSelector(sel)}

async function upd(sel,prop,val){
  if(!states[sel])states[sel]={};
  // 若存在手动编辑的CSS代码，可视化修改将覆盖它，先提示用户确认
  if(states[sel]._raw&&states[sel]._raw.trim()){
    if(!await showDialog('确认覆盖','当前选择器存在手动编辑的CSS代码。\n\n使用可视化参数修改将覆盖手动编辑的内容，是否继续？','confirm')){
      rsb();return;
    }
  }
  states[sel][prop]=val;
  // 清除raw CSS，使用可视化参数重新生成
  delete states[sel]._raw;
  // 更新代码编辑器内容
  var ta=document.getElementById('csCodeTa');
  if(ta)ta.value=buildBlockCss(sel)||'';
  // 更新编辑标记
  rsel();
  // 结构性变化需要重建参数区域
  if(prop==='_bg_type'||prop==='_sh_on'||prop==='_tsh_on'){rsb()}
}

function copyBlock(sel){var css=buildBlockCss(sel);if(!css.trim())return;copyToClipboard(css).catch(function(){})}

async function clearAllCss(){if(!await showDialog('确认清空','确定要清空所有CSS？','confirm'))return;initStates();expandedBlock=null;rsel();rsb();cvLines=[];$('cvv').innerHTML='<div class="cv-empty">已清空</div>';sbt('ok',' 已清空');setTimeout(hst,2000)}

function renderCodeView(){var css=buildCss();cvLines=css?css.split('\n').filter(function(l){return l.trim()}):[];if(!cvLines.length){$('cvv').innerHTML='<div class="cv-empty">暂无CSS代码</div>';return}$('cvv').innerHTML=cvLines.map(function(ln,i){return '<div class="cv-line"><div class="ln-code">'+escH(ln)+'</div><button class="ln-copy" onclick="copyLine('+i+')"></button></div>'}).join('')}
function copyLine(i){if(!cvLines[i])return;copyToClipboard(cvLines[i]).then(function(){var btn=document.querySelectorAll('.ln-copy')[i];if(btn){btn.textContent='';btn.classList.add('cd');setTimeout(function(){btn.textContent='';btn.classList.remove('cd')},1500)}}).catch(function(){})}



// ===== 选择符管理 =====
function renderSetList(){
  var all=Object.assign({},SELECTOR_SETS,customSets);
  var html='';
  for(var key in all){
    var set=all[key];var isCurrent=key===currentSetKey;var isCustom=!!customSets[key];
    var selCount=set.selectors.reduce(function(n,g){return n+g.s.length},0);
    html+='<div class="set-card'+(isCurrent?' active':'')+'"'+(!isCurrent?' onclick="switchSet(\''+key+'\')" style="cursor:pointer" title="点击切换到此集合"':'')+'><div class="set-card-header"><div><div class="set-card-title">'+(set.icon||'')+' '+set.name+(isCurrent?' <span style="color:var(--g);font-size:11px"> 当前</span>':'')+'</div><div class="set-card-desc">'+(set.desc||'')+' · '+selCount+'个选择符</div></div><div style="display:flex;gap:4px"><button class="cp-btn btn-sm" onclick="event.stopPropagation();editSet(\''+key+'\')"></button>'+(isCustom?'<button class="cp-btn btn-sm" style="border-color:rgba(239,68,68,.3);color:#f87171" onclick="event.stopPropagation();deleteSet(\''+key+'\')"></button>':'')+'</div></div><div class="set-card-sels">'+set.selectors.map(function(g){return g.s.map(function(s,i){return '<div>'+s+' <span style="color:var(--td)">— '+g.g+'/'+(g.hints[i]||'')+'</span></div>'}).join('')}).join('')+'</div></div>';
  }
  $('setList').innerHTML=html;
}

async function switchSet(key){
  // 覆盖保护：若AI生成页的提示词有未保存修改，提示用户
  var promptTa=$('promptTa');
  if(promptTa){
    var saved=getAllPrompts()[currentPromptKey]||'';
    if(promptTa.value!==saved){
      if(!await showDialog('确认切换','当前提示词有未保存的修改，切换预设后将丢失。\n\n确定继续切换吗？（可先点击「保存」保留修改）','confirm'))return;
    }
  }
  currentSetKey=key;initStates();rsel();rsb();renderSetList();renderAiSelGrid();
  // 提示词动态关联：读取该预设绑定的内置提示词并同步切换
  var boundKey=getSetPrompt(key);
  var allPrompts=getAllPrompts();
  if(boundKey&&allPrompts[boundKey]){
    currentPromptKey=boundKey;
  }else{
    currentPromptKey='默认CSS生成';
  }
  if(typeof loadPromptUI==='function')loadPromptUI();
}

var editingSetKey=null;var editingSetBuiltin=false;var tempSels=[];
function openSetModal(editKey){
  editingSetKey=editKey||null;
  editingSetBuiltin=false;
  if(editKey){
    var set=customSets[editKey]||SELECTOR_SETS[editKey];
    editingSetBuiltin=!customSets[editKey];
    $('setModalTitle').textContent='编辑：'+set.name;
    $('newSetName').value=set.name;
    $('newSetIcon').value=set.icon||'';
    $('newSetDesc').value=set.desc||'';
    tempSels=JSON.parse(JSON.stringify(set.selectors));
  }else{$('setModalTitle').textContent='新建选择符集';$('newSetName').value='';$('newSetIcon').value='';$('newSetDesc').value='';tempSels=[]}
  renderSelPreview();$('setModal').classList.add('active');
}
function renderSelPreview(){$('selPreview').innerHTML=tempSels.length?tempSels.map(function(g,gi){return g.s.map(function(s,si){return '<div class="sel-preview-item"><span>'+s+' <span style="color:var(--td)">— '+g.g+'/'+(g.hints[si]||'')+'</span></span><button onclick="removeTempSel('+gi+','+si+')"></button></div>'}).join('')}).join(''):'<div style="color:var(--td);padding:8px">暂无</div>'}
function addTempSel(){var g=$('newSelGroup').value.trim();var s=$('newSelSelector').value.trim();var h=$('newSelHint').value.trim();if(!g||!s){showDialog('提示','请填写组名和选择器');return}var grp=tempSels.find(function(x){return x.g===g});if(!grp){grp={g:g,s:[],hints:[]};tempSels.push(grp)}grp.s.push(s);grp.hints.push(h||'');$('newSelSelector').value='';$('newSelHint').value='';renderSelPreview()}
function removeTempSel(gi,si){tempSels[gi].s.splice(si,1);tempSels[gi].hints.splice(si,1);if(tempSels[gi].s.length===0)tempSels.splice(gi,1);renderSelPreview()}
function saveSet(){var name=$('newSetName').value.trim();if(!name){showDialog('提示','请填写名称');return}var icon=$('newSetIcon').value.trim()||'';var desc=$('newSetDesc').value.trim();if(tempSels.length===0){showDialog('提示','请至少添加一个选择符');return}var key=editingSetKey||name.replace(/\s+/g,'_');customSets[key]={name:name,icon:icon,desc:desc,selectors:JSON.parse(JSON.stringify(tempSels))};storage.setItem('qqy_custom_sets',JSON.stringify(customSets));$('setModal').classList.remove('active');renderSetList();if(currentSetKey===key){initStates();rsel();rsb()}sbt('ok',' 已保存');setTimeout(hst,2000)}
function editSet(key){openSetModal(key)}
async function deleteSet(key){if(!await showDialog('确认删除','确定删除？','confirm'))return;delete customSets[key];storage.setItem('qqy_custom_sets',JSON.stringify(customSets));if(currentSetKey===key){var fallback=Object.keys(SELECTOR_SETS)[0]||Object.keys(customSets)[0]||'';currentSetKey=fallback;initStates();rsel();rsb()}renderSetList();renderAiSelGrid()}

// ===== 从文本导入选择符（AI分析）=====
function openImportModal(){$('importText').value='';$('importSetName').value='';$('importResult').style.display='none';$('importModal').classList.add('active')}

function analyzeImportText(){
  var text=$('importText').value.trim();
  if(!text){showDialog('提示','请粘贴代码');return}
  var found={};
  var styleBlocks=text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)||[];
  var cssText=styleBlocks.map(function(b){return b.replace(/<\/?style[^>]*>/gi,'')}).join('\n');
  var classMatches=text.match(/class\s*=\s*["']([^"']+)["']/g)||[];
  var classSet={};
  classMatches.forEach(function(m){var v=m.replace(/class\s*=\s*["']([^"']+)["']/,'$1');v.split(/\s+/).forEach(function(c){if(c)classSet[c]=true})});
  // 先剥离 @media/@supports/@keyframes 等嵌套规则块，避免 split('}') 产生错误选择符
  var cleanCss=cssText.replace(/@(media|supports|keyframes|font-face|page|charset|import|namespace)[^{]*\{[\s\S]*?\}\s*\}/gi,'');
  cleanCss=cleanCss.replace(/@[^{;]*\{[^}]*\}/gi,'');
  var rules=cleanCss.split('}').filter(function(p){return p.trim()});
  var selSet={};
  rules.forEach(function(r){
    var idx=r.lastIndexOf('{');
    if(idx<0)return;
    var selPart=r.substring(0,idx).trim().replace(/\/\*[\s\S]*?\*\//g,'');
    selPart.split(',').forEach(function(s){
      s=s.trim();
      if(s&&s.length>1&&s.length<80&&s.charAt(0)!=='@')selSet[s]=true;
    });
  });
  Object.keys(classSet).forEach(function(c){selSet['.'+c]=true});

  var sels=Object.keys(selSet);
  if(sels.length===0){
    if(ak){
      analyzeWithAI(text);
    }else{
      showDialog('提示','未找到CSS选择符，请设置API后用AI分析');
    }
    return;
  }
  var groups=autoClassify(sels);
  tempSels=groups;
  if(!$('importSetName').value){
    var titleMatch=text.match(/<title>([^<]*)<\/title>/i);
    if(titleMatch)$('importSetName').value=titleMatch[1].trim();
  }
  renderImportPreview();
}

function autoClassify(sels){
  var groups={};
  var order=[];
  sels.forEach(function(sel){
    var g=guessGroup(sel);
    if(!groups[g]){groups[g]={g:g,s:[],hints:[]};order.push(g)}
    groups[g].s.push(sel);
    groups[g].hints.push(guessHint(sel));
  });
  return order.map(function(g){return groups[g]});
}

function guessGroup(sel){
  var s=sel.toLowerCase();
  if(s.indexOf('header')>=0||s.indexOf('title')>=0)return '顶栏';
  if(s.indexOf('nav')>=0||s.indexOf('menu')>=0)return '导航';
  if(s.indexOf('input')>=0||s.indexOf('textarea')>=0)return '输入区';
  if(s.indexOf('send')>=0||s.indexOf('button')>=0||s.indexOf('submit')>=0)return '按钮';
  if(s.indexOf('message')>=0||s.indexOf('bubble')>=0||s.indexOf('chat')>=0)return '消息';
  if(s.indexOf('avatar')>=0||s.indexOf('icon')>=0)return '头像/图标';
  if(s.indexOf('background')>=0||s.indexOf('bg')>=0)return '背景';
  if(s.indexOf('modal')>=0||s.indexOf('dialog')>=0||s.indexOf('popup')>=0)return '弹窗';
  if(s.indexOf('sidebar')>=0||s.indexOf('panel')>=0)return '侧栏';
  if(s.indexOf('card')>=0||s.indexOf('item')>=0)return '卡片';
  if(s.indexOf('footer')>=0)return '底部';
  if(s.indexOf('detail')>=0||s.indexOf('summary')>=0)return '折叠';
  if(s.indexOf('image')>=0||s.indexOf('img')>=0||s.indexOf('photo')>=0)return '图片';
  if(s.indexOf('container')>=0||s.indexOf('wrapper')>=0||s.indexOf('content')>=0)return '容器';
  if(s.indexOf('slider')>=0||s.indexOf('range')>=0)return '滑块';
  if(s.indexOf('strong')>=0||s.indexOf('em')>=0||s.indexOf('bold')>=0)return '文本格式';
  return '其他';
}

function guessHint(sel){
  var s=sel.toLowerCase();
  if(s.indexOf('background')>=0||s.indexOf('bg')>=0)return '背景';
  if(s.indexOf('color')>=0)return '颜色';
  if(s.indexOf('border')>=0)return '边框';
  if(s.indexOf('text')>=0)return '文字';
  if(s.indexOf('container')>=0||s.indexOf('wrapper')>=0)return '容器';
  if(s.indexOf('btn')>=0||s.indexOf('button')>=0)return '按钮';
  return '样式';
}

function analyzeWithAI(text){
  if(!ak){showDialog('提示','请先设置API');return}
  $('importAnalyze').disabled=true;$('importAnalyze').textContent='AI分析中...';
  var previewText=text.substring(0,3000);
  var sp='分析以下HTML/CSS代码，提取所有CSS选择符，按功能分类。输出JSON格式：[{"g":"组名","s":["选择器1","选择器2"],"hints":["说明1","说明2"]}]。只输出JSON，不要其他文字。';
  fetch(akUrl+'/chat/completions',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+ak},
    body:JSON.stringify({model:akModel,messages:[{role:'system',content:sp},{role:'user',content:previewText}],temperature:.3,max_tokens:2048})
  }).then(function(res){return res.json()}).then(function(d){
    var content=d.choices[0].message.content.trim();
    var match=content.match(/\[[\s\S]*\]/);
    if(match){
      try{tempSels=JSON.parse(match[0]);renderImportPreview()}
      catch(e){showDialog('解析失败','AI返回解析失败，请重试')}
    }else{showDialog('提示','AI未返回有效结果')}
    $('importAnalyze').disabled=false;$('importAnalyze').textContent=' 分析';
  }).catch(function(e){if(typeof logAiError==='function')logAiError('文本导入分析',e.message||String(e));showDialog('分析失败','AI分析失败：'+e.message);$('importAnalyze').disabled=false;$('importAnalyze').textContent=' 分析'});
}

function renderImportPreview(){
  $('importResult').style.display='block';
  $('importPreview').innerHTML=tempSels.length?tempSels.map(function(g,gi){return g.s.map(function(s,si){return '<div class="sel-preview-item"><span>'+s+' <span style="color:var(--td)">— '+g.g+'/'+(g.hints[si]||'')+'</span></span><button onclick="removeTempSel('+gi+','+si+')"></button></div>'}).join('')}).join(''):'<div style="color:var(--td);padding:8px">未识别到选择符</div>';
}

function saveImportSet(){
  var name=$('importSetName').value.trim();if(!name){showDialog('提示','请填写名称');return}
  if(tempSels.length===0){showDialog('提示','请先分析并确认有选择符');return}
  var key=name.replace(/\s+/g,'_');customSets[key]={name:name,icon:'',desc:'从文本导入',selectors:tempSels};
  storage.setItem('qqy_custom_sets',JSON.stringify(customSets));
  $('importModal').classList.remove('active');renderSetList();
  sbt('ok',' 已导入'+tempSels.length+'组选择符');setTimeout(hst,3000);
}

// ==============================
// 可视化渐变编辑器
// ==============================
// 渐变数据存储在 states[sel]._bg_custom，格式：linear-gradient(角度deg,颜色1 比例%,颜色2 比例%,...)
// 解析渐变字符串为结构化数据
function geParse(gradStr){
  var def={angle:135,stops:[{c:'#667eea',p:0},{c:'#764ba2',p:100}]};
  if(!gradStr||gradStr.indexOf('linear-gradient')<0)return def;
  var m=gradStr.match(/linear-gradient\((.+)\)/);
  if(!m)return def;
  var parts=m[1].split(/,(?![^(]*\))/);
  var angle=135;var stops=[];
  parts.forEach(function(part,idx){
    part=part.trim();
    if(idx===0&&/deg/.test(part)){angle=parseInt(part)||135;return}
    if(idx===0&&!/#|rgb|hsl/.test(part)){return}
    var sm=part.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))\s*(\d+)?%?/);
    if(sm){stops.push({c:sm[1],p:sm[2]?parseInt(sm[2]):(stops.length===0?0:100)})}
  });
  if(stops.length<2)return def;
  return{angle:angle,stops:stops};
}

// 结构化数据转渐变字符串
function geBuild(angle,stops){
  var sorted=stops.slice().sort(function(a,b){return a.p-b.p});
  var parts=sorted.map(function(s){return s.c+' '+s.p+'%'});
  return 'linear-gradient('+angle+'deg,'+parts.join(',')+')';
}

// 获取当前渐变的结构化数据（优先自定义，其次预设）
function geGetData(s){
  if(s._bg_custom)return geParse(s._bg_custom);
  if(s._bg_grad&&GRADIENTS[s._bg_grad])return geParse(GRADIENTS[s._bg_grad]);
  if(s._bg&&s._bg.indexOf('gradient')>=0)return geParse(s._bg);
  return geParse('');
}

// 渲染渐变编辑器
function geRenderEditor(sq,s){
  var data=geGetData(s);
  var gradCss=geBuild(data.angle,data.stops);
  var html='<div class="ge-wrap">';
  // 渐变预览条（含色标）
  html+='<div class="ge-bar-wrap">'+
    '<div class="ge-bar" id="geBar" style="background:'+gradCss+'" onclick="geBarClick(event,\''+sq+'\')">';
  data.stops.forEach(function(stop,i){
    html+='<div class="ge-stop" data-idx="'+i+'" style="left:'+stop.p+'%;background:'+stop.c+'" onmousedown="geStopDrag(event,\''+sq+'\','+i+')" onclick="event.stopPropagation();geStopEdit(\''+sq+'\','+i+')" title="拖动调整位置，点击修改颜色"></div>';
  });
  html+='</div></div>';
  // 色标列表（颜色+比例+删除）
  html+='<div class="ge-stops-list">';
  data.stops.forEach(function(stop,i){
    html+='<div class="ge-stop-row">'+
      '<input type="color" value="'+toHex(stop.c)+'" onchange="geSetColor(\''+sq+'\','+i+',this.value)">'+
      '<input type="range" min="0" max="100" value="'+stop.p+'" style="flex:1" oninput="geSetPos(\''+sq+'\','+i+',this.value)">'+
      '<span class="ge-pct">'+stop.p+'%</span>'+
      (data.stops.length>2?'<button class="cp-btn btn-sm" onclick="geDelStop(\''+sq+'\','+i+')" title="删除色标"></button>':'<span style="width:26px"></span>')+
    '</div>';
  });
  html+='</div>';
  // 操作行：添加色标 + 角度
  html+='<div class="ge-ops">'+
    '<button class="cp-btn btn-sm" onclick="geAddStop(\''+sq+'\')">＋ 添加色标</button>'+
    '<label style="font-size:12px;color:var(--ts)">角度</label>'+
    '<input type="range" min="0" max="360" value="'+data.angle+'" style="flex:1" oninput="geSetAngle(\''+sq+'\',this.value)">'+
    '<span class="ge-pct">'+data.angle+'°</span>'+
  '</div>';
  html+='</div>';
  return html;
}

// 保存渐变到状态
function geSave(sq,angle,stops){
  var gradStr=geBuild(angle,stops);
  upd(sq,'_bg_custom',gradStr);
  upd(sq,'_bg_type','gradient');
}

// 获取当前编辑的渐变数据（从 states）
function geCur(sq){
  var sel=sq.replace(/\\'/g,"'");
  var s=states[sel]||{};
  return geGetData(s);
}

// 设置色标颜色
function geSetColor(sq,idx,color){
  var data=geCur(sq);
  if(!data.stops[idx])return;
  data.stops[idx].c=color;
  geSave(sq,data.angle,data.stops);
  rsb();
}

// 设置色标位置
function geSetPos(sq,idx,pos){
  var data=geCur(sq);
  if(!data.stops[idx])return;
  data.stops[idx].p=parseInt(pos)||0;
  geSave(sq,data.angle,data.stops);
  // 只更新预览条和百分比，不重建编辑器（避免拖动中断）
  var bar=$('geBar');
  if(bar)bar.style.background=geBuild(data.angle,data.stops);
  var rows=document.querySelectorAll('.ge-stop-row');
  if(rows[idx]){var pct=rows[idx].querySelector('.ge-pct');if(pct)pct.textContent=(parseInt(pos)||0)+'%'}
  var stops=document.querySelectorAll('.ge-stop');
  if(stops[idx])stops[idx].style.left=(parseInt(pos)||0)+'%';
}

// 设置渐变角度
function geSetAngle(sq,angle){
  var data=geCur(sq);
  data.angle=parseInt(angle)||0;
  geSave(sq,data.angle,data.stops);
  var bar=$('geBar');
  if(bar)bar.style.background=geBuild(data.angle,data.stops);
  var ops=document.querySelector('.ge-ops');
  if(ops){var pct=ops.querySelector('.ge-pct');if(pct)pct.textContent=data.angle+'°'}
}

// 添加色标（在中间位置插入相邻两色的插值色）
function geAddStop(sq){
  var data=geCur(sq);
  if(data.stops.length>=8){sbt('err','最多支持 8 个色标');setTimeout(hst,2000);return}
  var sorted=data.stops.slice().sort(function(a,b){return a.p-b.p});
  // 找最大间隔插入
  var maxGap=0,insertAt=0;
  for(var i=0;i<sorted.length-1;i++){var gap=sorted[i+1].p-sorted[i].p;if(gap>maxGap){maxGap=gap;insertAt=i}}
  var newPos=Math.round((sorted[insertAt].p+sorted[insertAt+1].p)/2);
  data.stops.push({c:sorted[insertAt].c,p:newPos});
  geSave(sq,data.angle,data.stops);
  rsb();
}

// 删除色标
function geDelStop(sq,idx){
  var data=geCur(sq);
  if(data.stops.length<=2){sbt('err','至少保留 2 个色标');setTimeout(hst,2000);return}
  data.stops.splice(idx,1);
  geSave(sq,data.angle,data.stops);
  rsb();
}

// 点击渐变条空白处添加色标
function geBarClick(e,sq){
  var bar=e.currentTarget;
  var rect=bar.getBoundingClientRect();
  var pos=Math.round((e.clientX-rect.left)/rect.width*100);
  pos=Math.max(0,Math.min(100,pos));
  var data=geCur(sq);
  if(data.stops.length>=8){sbt('err','最多支持 8 个色标');setTimeout(hst,2000);return}
  // 找到该位置前后色标，插值颜色
  var sorted=data.stops.slice().sort(function(a,b){return a.p-b.p});
  var before=sorted[0],after=sorted[sorted.length-1];
  for(var i=0;i<sorted.length-1;i++){if(pos>=sorted[i].p&&pos<=sorted[i+1].p){before=sorted[i];after=sorted[i+1];break}}
  data.stops.push({c:before.c,p:pos});
  geSave(sq,data.angle,data.stops);
  rsb();
}

// 色标拖动
var geDragState=null;
function geStopDrag(e,sq,idx){
  e.preventDefault();e.stopPropagation();
  var bar=$('geBar');if(!bar)return;
  var rect=bar.getBoundingClientRect();
  geDragState={sq:sq,idx:idx,rect:rect};
  document.addEventListener('mousemove',geStopMove);
  document.addEventListener('mouseup',geStopUp);
}
function geStopMove(e){
  if(!geDragState)return;
  var pos=Math.round((e.clientX-geDragState.rect.left)/geDragState.rect.width*100);
  pos=Math.max(0,Math.min(100,pos));
  geSetPos(geDragState.sq,geDragState.idx,pos);
}
function geStopUp(){
  if(geDragState){rsb()}
  geDragState=null;
  document.removeEventListener('mousemove',geStopMove);
  document.removeEventListener('mouseup',geStopUp);
}

// 点击色标编辑颜色（触发隐藏的颜色选择器）
function geStopEdit(sq,idx){
  var rows=document.querySelectorAll('.ge-stop-row');
  if(rows[idx]){var colorInput=rows[idx].querySelector('input[type="color"]');if(colorInput)colorInput.click()}
}

// 应用预设渐变到编辑器
function geApplyPreset(sq,key){
  if(!GRADIENTS[key])return;
  var data=geParse(GRADIENTS[key]);
  geSave(sq,data.angle,data.stops);
  rsb();
}
