// 拼接 API 地址（网页版：直连接口，不再经过本地代理）
function buildApiUrl(baseUrl, endpoint) {
  baseUrl = baseUrl.trim().replace(/\/+$/, '');
  var autoV1 = storage.getItem('qqy_api_auto_v1') !== '0'; // 默认开启
  if (autoV1 && !baseUrl.match(/\/v\d+$/)) {
    return baseUrl + '/v1' + endpoint;
  }
  return baseUrl + endpoint;
}

// ==============================
// api.js - API设置 + 模型拉取
// ==============================

function openApiModal(){
  $('akurl').value=akUrl;$('aki').value=ak;$('akm').classList.add('active');
  $('akautov1').checked=storage.getItem('qqy_api_auto_v1')!=='0';
  renderModelSelect();
  renderApiPresets();
}

function renderModelSelect(){
  var sel=$('akmodel');
  var models=fetchedModels.length>0?fetchedModels:DEFAULT_MODELS;
  var html=models.map(function(m){return '<option value="'+m+'" '+(m===akModel?'selected':'')+'>'+m+'</option>'}).join('');
  html+='<option value="__custom__" '+(akModel&&models.indexOf(akModel)<0?'selected':'')+'>自定义...</option>';
  sel.innerHTML=html;
  $('akmcustomwrap').style.display=(akModel&&models.indexOf(akModel)<0)?'block':'none';
  if(akModel&&models.indexOf(akModel)<0)$('akmodelcustom').value=akModel;
}

async function fetchModels(){
  var btn=$('fetchModelsBtn');
  var url=$('akurl').value.trim().replace(/\/+$/,'');
  var key=$('aki').value.trim();
  if(!url){showDialog('提示','请先填写API地址');return}
  btn.innerHTML='<span class="spin"></span> 拉取中';btn.disabled=true;
  try{
    var res=await fetch(buildApiUrl(url,'/models'),{headers:{'Authorization':'Bearer '+key}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    var d=await res.json();
    var models=[];
    if(d.data&&Array.isArray(d.data))models=d.data.map(function(m){return m.id||m.name}).filter(Boolean);
    else if(Array.isArray(d.models))models=d.models.map(function(m){return m.id||m.name}).filter(Boolean);
    else if(Array.isArray(d))models=d.map(function(m){return m.id||m.name||m}).filter(Boolean);
    if(models.length===0)throw new Error('未找到模型');
    models.sort();
    fetchedModels=models;
    storage.setItem('qqy_fetched_models',JSON.stringify(models));
    renderModelSelect();
    btn.innerHTML='<span>✓</span> 已拉取'+models.length+'个';
    setTimeout(function(){btn.innerHTML='<span>🔄</span> 拉取';btn.disabled=false},2000);
  }catch(err){
    showDialog('拉取失败',err.message+'\n请检查API地址和Key');
    btn.innerHTML='<span>🔄</span> 拉取';btn.disabled=false;
  }
}

function saveApiConfig(){
  akUrl=$('akurl').value.trim().replace(/\/+$/,'')||'https://api.openai.com/v1';
  ak=$('aki').value.trim();
  var modelVal=$('akmodel').value;
  akModel=modelVal==='__custom__'?($('akmodelcustom').value.trim()||'gpt-4o-mini'):modelVal;
  storage.setItem('qqy_api_url',akUrl);
  storage.setItem('qqy_api_key',ak);
  storage.setItem('qqy_api_model',akModel);
  storage.setItem('qqy_api_auto_v1',$('akautov1').checked?'1':'0');
  $('akm').classList.remove('active');
  $('aks').textContent=ak?'已设置':'设置API';
  sbt('ok','✅ API已保存');setTimeout(hst,2000);
}

async function clearApiConfig(){
  if(!await showDialog('确认清除','清除API配置？','confirm'))return;
  akUrl='https://api.openai.com/v1';ak='';akModel='gpt-4o-mini';
  storage.removeItem('qqy_api_url');storage.removeItem('qqy_api_key');storage.removeItem('qqy_api_model');storage.removeItem('qqy_api_auto_v1');
  $('akurl').value=akUrl;$('aki').value='';$('aks').textContent='设置API';
  renderModelSelect();
  sbt('ok','已清除');setTimeout(hst,2000);
}

// 重置所有数据（恢复初始状态）
async function clearBrowserCache(){
  if(!await showDialog('确认重置','重置所有数据并恢复初始状态？\n\n包括：API配置、提示词、记忆数据、自定义设置等\n此操作不可恢复！','confirm'))return;
  // 清除文件中的所有 qqy_ 前缀数据
  var keys=[];
  for(var i=0;i<storage.length;i++){
    var key=storage.key(i);
    if(key&&key.indexOf('qqy_')===0)keys.push(key);
  }
  keys.forEach(function(k){storage.removeItem(k)});
  // 同时清除浏览器 localStorage 残留
  try{
    var lsKeys=[];
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.indexOf('qqy_')===0)lsKeys.push(k);
    }
    lsKeys.forEach(function(k){localStorage.removeItem(k)});
  }catch(e){}
  showDialog('重置完成','已重置所有数据\n请刷新页面重新加载');
}

// ===== API预设 =====
var apiPresets=JSON.parse(storage.getItem('qqy_api_presets')||'[]');
var currentApiPreset=storage.getItem('qqy_api_preset_current')||'';

function renderApiPresets(){
  var wrap=$('apiPresetRow');if(!wrap)return;
  var html='';
  if(apiPresets.length===0){
    html='<span style="font-size:11px;color:var(--td)">暂无预设，保存当前配置后可添加</span>';
  }else{
    html=apiPresets.map(function(p,i){
      var active=(currentApiPreset===p.name)?' active':'';
      return '<span class="api-preset-item'+active+'" onclick="switchApiPreset('+i+')">'+escH(p.name)+'</span>';
    }).join('');
  }
  wrap.innerHTML=html+'<button class="cp-btn btn-sm" onclick="saveApiPreset()" style="margin-left:auto">💾 存为预设</button>'+(currentApiPreset?'<button class="cp-btn btn-sm" style="border-color:rgba(239,68,68,.3);color:#f87171" onclick="deleteApiPreset()">🗑️</button>':'');
}

function saveApiPreset(){
  var name=prompt('预设名称：','预设'+(apiPresets.length+1));
  if(!name)return;
  // 读取弹窗输入框中的最新值，而非全局变量（避免未点保存时存下旧配置）
  var curUrl=$('akurl').value.trim().replace(/\/+$/,'')||akUrl;
  var curKey=$('aki').value.trim();
  var modelVal=$('akmodel').value;
  var curModel=modelVal==='__custom__'?($('akmodelcustom').value.trim()||akModel):modelVal;
  var preset={name:name,url:curUrl,key:curKey,model:curModel};
  // 如果同名则更新
  var existing=apiPresets.findIndex(function(p){return p.name===name});
  if(existing>=0)apiPresets[existing]=preset;
  else apiPresets.push(preset);
  storage.setItem('qqy_api_presets',JSON.stringify(apiPresets));
  currentApiPreset=name;
  storage.setItem('qqy_api_preset_current',name);
  renderApiPresets();
}

function switchApiPreset(i){
  var p=apiPresets[i];if(!p)return;
  akUrl=p.url;ak=p.key;akModel=p.model;
  storage.setItem('qqy_api_url',akUrl);
  storage.setItem('qqy_api_key',ak);
  storage.setItem('qqy_api_model',akModel);
  storage.setItem('qqy_api_auto_v1',$('akautov1').checked?'1':'0');
  currentApiPreset=p.name;
  storage.setItem('qqy_api_preset_current',p.name);
  $('akurl').value=akUrl;$('aki').value=ak;
  renderModelSelect();
  renderApiPresets();
  $('aks').textContent=ak?'已设置':'设置API';
  sbt('ok','✅ 已切换到 '+p.name);setTimeout(hst,2000);
}

async function deleteApiPreset(){
  if(!currentApiPreset)return;
  if(!await showDialog('确认删除','删除预设「'+currentApiPreset+'」？','confirm'))return;
  apiPresets=apiPresets.filter(function(p){return p.name!==currentApiPreset});
  storage.setItem('qqy_api_presets',JSON.stringify(apiPresets));
  currentApiPreset='';
  storage.removeItem('qqy_api_preset_current');
  renderApiPresets();
  $('akm').classList.add('active');
}