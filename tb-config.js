// ==============================
// config.js - 常量 & 全局状态
// ==============================

const SELECTOR_SETS={
  'QQY':{
    name:'青丘语',icon:'',desc:'青丘语角色聊天页面',
    selectors:[
      {g:'顶栏',s:['.header.qqy-chat-header','.title','.title-content'],hints:['背景/边框','文字样式','容器']},
      {g:'顶栏按钮',s:['.header-right','.right-item','.left','.back'],hints:['按钮区域','图标按钮','返回区域','返回箭头']},
      {g:'AI气泡',s:['.message-container','._message_6hyew_1.message-container'],hints:['主气泡','备用']},
      {g:'用户气泡',s:['.message-context.message-incoming'],hints:['对方消息']},
      {g:'旁白/剧情',s:['._message_6hyew_1.scenario-container','._message_6hyew_1.narration-container','._message_6hyew_1.system-container'],hints:['旁白标签','剧情文字','系统提示']},
      {g:'文本格式',s:['.markdown-body strong','em','.quote-placeholder'],hints:['粗体','斜体','引用块']},
      {g:'代码块',s:['div[class*="group/cover"]'],hints:['代码容器']},
      {g:'输入区',s:['.input-container','.input-wrap','.input-wrap textarea'],hints:['整体容器','输入框外层','输入文字']},
      {g:'发送按钮',s:['.send-button','.add-create-conversation'],hints:['发送','更多/新建']},
      {g:'模型选择',s:['.model-select'],hints:['模型切换']},
      {g:'操作按钮',s:['.operation','.van-popover__content'],hints:['三点菜单','弹出菜单']},
      {g:'折叠栏',s:['details summary','details li','details[open]'],hints:['折叠标题','列表项','展开状态']},
      {g:'亮度调节',s:['.brightness-slider-container','.slider-wrapper','.slider-thumb','.slider-track','.slider-progress'],hints:['容器','滑轨','滑块','轨道底','进度条']},
      {g:'账单弹窗',s:['.coin-record-modal','.points-card','.points-amount','.record-item','.expense-amount'],hints:['弹窗','卡片','余额','记录','消费金额']},
      {g:'聊天背景',s:['.background-image.bg-cover','.qqy-phone_container'],hints:['背景层','手机外壳']}
    ]
  }
};

let currentSetKey=storage.getItem('qqy_default_set')||'QQY';
var customSets=JSON.parse(storage.getItem('qqy_custom_sets')||'{}');
function getSelectors(){var set=customSets[currentSetKey]||SELECTOR_SETS[currentSetKey]||SELECTOR_SETS['QQY'];if(!customSets[currentSetKey]&&!SELECTOR_SETS[currentSetKey])currentSetKey='QQY';return set.selectors}
function getAllSels(){const a=[];getSelectors().forEach(g=>g.s.forEach((s,i)=>a.push({g:g.g,s:s,h:(g.hints&&g.hints[i])||''})));return a}

const GRADIENTS={'none':'','blue_purple':'linear-gradient(135deg,#667eea,#764ba2)','purple_pink':'linear-gradient(135deg,#7E55FF,#e49efc)','blue_cyan':'linear-gradient(135deg,#667eea,#00d2ff)','green_teal':'linear-gradient(135deg,#38ef7d,#11998e)','orange_red':'linear-gradient(135deg,#ff9a44,#fc6076)','red_gold':'linear-gradient(135deg,#8B0000,#FFD700)','dark_neon':'linear-gradient(135deg,#0a0a0a,#7E55FF)','mint_cream':'linear-gradient(135deg,#98D8C8,#F5F5DC)','sunset':'linear-gradient(135deg,#ff6e7f,#bfe9ff)','purple_dark':'linear-gradient(135deg,#2a0845,#6441A5)','blue_white':'linear-gradient(135deg,#002fa7,#fff)'};
const GRADIENT_NAMES={'none':'无','blue_purple':'蓝紫','purple_pink':'紫粉','blue_cyan':'蓝青','green_teal':'绿青','orange_red':'橙红','red_gold':'红金','dark_neon':'暗黑霓虹','mint_cream':'薄荷米白','sunset':'日落','purple_dark':'深紫','blue_white':'蓝白'};
const FONTS=[{name:'默认',value:''},{name:'思源黑体',value:'"Noto Sans SC",sans-serif'},{name:'思源宋体',value:'"Noto Serif SC",serif'},{name:'霞鹜文楷',value:'"LXGW WenKai",serif'},{name:'站酷快乐体',value:'"ZCOOL KuaiLe",cursive'},{name:'站酷小薇',value:'"ZCOOL XiaoWei",serif'},{name:'龙藏体',value:'"Long Cang",cursive'},{name:'马善政',value:'"Ma Shan Zheng",cursive'}];
const DEFAULT_MODELS=['gpt-4o-mini','gpt-4o','gpt-4-turbo','gpt-3.5-turbo','gpt-4.1-mini','gpt-4.1','o1-mini','o3-mini','deepseek-chat','deepseek-reasoner','qwen-plus','qwen-turbo','claude-3-5-sonnet-20241022','glm-4-flash'];


function getSelectorReference(){return getSelectors().map(function(g){var hints=g.hints||[];return g.s.map(function(s,i){return s+'('+g.g+'-'+(hints[i]||'')+')'}).join(', ')}).join(',\n  ')}

// ===== 数据加载器（从 data.json 同步加载默认提示词） =====
var DEFAULT_PROMPTS_DATA=null;
function loadDefaultPromptsData(){
  if(DEFAULT_PROMPTS_DATA)return DEFAULT_PROMPTS_DATA;
  try{
    var xhr=new XMLHttpRequest();
    xhr.open('GET',(window.__TOOLBOX_DIR__||'')+'data.json',false);
    xhr.send(null);
    if(xhr.status===200||xhr.status===0){
      DEFAULT_PROMPTS_DATA=JSON.parse(xhr.responseText);
      return DEFAULT_PROMPTS_DATA;
    }
  }catch(e){console.warn('data.json 加载失败，使用空数据:',e)}
  DEFAULT_PROMPTS_DATA={prompts:[]};
  return DEFAULT_PROMPTS_DATA;
}

// 占位符替换：{{SET_NAME}} → 当前选择符集名称，{{SELECTORS}} → 选择符参考列表
function replacePromptPlaceholders(promptText){
  if(!promptText)return '';
  var curSet=customSets[currentSetKey]||SELECTOR_SETS[currentSetKey];
  var setName=curSet?curSet.name:'默认';
  var selectors=getSelectorReference();
  return promptText.replace(/\{\{SET_NAME\}\}/g,setName).replace(/\{\{SELECTORS\}\}/g,selectors);
}

function buildDefaultPrompts(){
  var data=loadDefaultPromptsData();
  var result={};
  data.prompts.filter(function(p){return p.type==='ai-gen'}).forEach(function(p){
    result[p.name]=replacePromptPlaceholders(p.prompt);
  });
  return result;
}

// 全局状态
var states={};
function initStates(){states={};getSelectors().forEach(function(g){g.s.forEach(function(s){states[s]={}})})}
initStates();

var akUrl=storage.getItem('qqy_api_url')||'https://api.openai.com/v1';
var ak=storage.getItem('qqy_api_key')||'';
var akModel=storage.getItem('qqy_api_model')||'gpt-4o-mini';
var fetchedModels=JSON.parse(storage.getItem('qqy_fetched_models')||'[]');

var isP=false,curAiBlock=null,cvLines=[];
var selFilter=null;
var selectedSels=new Set();

// ===== 提示词数据库（核心文件） =====
// 分类：ai-gen=AI智能生成提示词 / ai-analyze=AI分析组件提示词 / component=组件提示词
var PROMPT_TYPE_NAMES={'ai-gen':'AI智能生成提示词','ai-analyze':'AI分析组件提示词','component':'组件提示词'};

// ===== 提示词数据库折叠状态（从 prompt-db.js 移入，确保 renderCpList 调用前已定义） =====
var PROMPT_TYPE_LABELS={'ai-gen':' AI智能生成提示词','ai-analyze':' AI分析组件提示词','component':' 组件提示词'};
var collapsedTypes=JSON.parse(storage.getItem('qqy_collapsed_types')||'null');
if(!collapsedTypes){collapsedTypes={'ai-gen':false,'ai-analyze':false,'component':false};storage.setItem('qqy_collapsed_types',JSON.stringify(collapsedTypes))}
function buildDefaultPromptDB(){
  var data=loadDefaultPromptsData();
  var list=[];
  data.prompts.forEach(function(p){
    list.push({name:p.name,type:p.type,note:p.note||'',prompt:replacePromptPlaceholders(p.prompt),api:p.api||'',builtin:p.builtin!==false});
  });
  return list;
}
var promptDB=JSON.parse(storage.getItem('qqy_prompt_db')||'null');
if(!promptDB){
  promptDB=buildDefaultPromptDB();
  // 迁移旧的自定义提示词
  var oldCustom=JSON.parse(storage.getItem('qqy_prompts')||'{}');
  for(var k in oldCustom){promptDB.push({name:k,type:'ai-gen',note:'迁移自旧版自定义提示词',prompt:oldCustom[k],api:'',builtin:false})}
  // 迁移旧的组件提示词
  var oldCp=JSON.parse(storage.getItem('qqy_component_prompts')||'[]');
  oldCp.forEach(function(cp){promptDB.push({name:cp.name,type:'component',note:cp.type||cp.desc||'',prompt:cp.prompt||'',api:cp.api||'',builtin:false})});
  storage.setItem('qqy_prompt_db',JSON.stringify(promptDB));
}
// ===== 内置提示词占位符迁移（旧版静态选择符列表 → 动态占位符） =====
(function(){
  var fresh=buildDefaultPrompts();
  var migrated=false;
  promptDB.forEach(function(p){
    if(p.builtin&&p.type==='ai-gen'&&fresh[p.name]&&p.prompt.indexOf('{{SELECTORS}}')<0){
      p.prompt=fresh[p.name];
      migrated=true;
    }
  });
  if(migrated)storage.setItem('qqy_prompt_db',JSON.stringify(promptDB));
})();

function savePromptDB(){storage.setItem('qqy_prompt_db',JSON.stringify(promptDB))}
function getPromptsByType(type){return promptDB.filter(function(p){return p.type===type})}

var currentPromptKey=storage.getItem('qqy_current_prompt')||'默认CSS生成';
function getAllPrompts(){var o={};promptDB.filter(function(p){return p.type==='ai-gen'}).forEach(function(p){o[p.name]=p.prompt});return o}

// ===== 预设 → 内置提示词 映射（每个选择符预设独立绑定提示词） =====
var setPromptMap=JSON.parse(storage.getItem('qqy_set_prompt_map')||'{}');
function getSetPrompt(setKey){return setPromptMap[setKey]||''}
function bindSetPrompt(setKey,promptKey){setPromptMap[setKey]=promptKey;storage.setItem('qqy_set_prompt_map',JSON.stringify(setPromptMap))}

// ===== 多记忆槽位（可切换记忆区） =====
var memorySlots=JSON.parse(storage.getItem('qqy_memory_slots')||'null');
if(!memorySlots){
  // 兼容旧版单记忆数据，迁移到「记忆1」槽位
  memorySlots={'记忆1':JSON.parse(storage.getItem('qqy_ai_memory')||'[]')};
  storage.setItem('qqy_memory_slots',JSON.stringify(memorySlots));
}
var currentSlot=storage.getItem('qqy_current_slot')||'记忆1';
if(!memorySlots[currentSlot]){currentSlot=Object.keys(memorySlots)[0]||'记忆1';memorySlots[currentSlot]=memorySlots[currentSlot]||[]}
var aiMemory=memorySlots[currentSlot];
function saveCurrentSlot(){memorySlots[currentSlot]=aiMemory;storage.setItem('qqy_memory_slots',JSON.stringify(memorySlots))}
function switchSlot(name){
  if(!memorySlots[name])return;
  saveCurrentSlot();
  currentSlot=name;storage.setItem('qqy_current_slot',name);
  aiMemory=memorySlots[name];
  // 同步切换总结引用，确保各记忆区总结隔离
  memorySummaries=memorySummariesBySlot[name]||(memorySummariesBySlot[name]=[]);
  memoryLargeSummaries=memoryLargeSummariesBySlot[name]||(memoryLargeSummariesBySlot[name]=[]);
  renderMemory();renderSummaries();renderUnsaved();
}

var memoryEnabled=storage.getItem('qqy_memory_enabled')==='1';
var memoryMaxRounds=parseInt(storage.getItem('qqy_mem_rounds')||'6');
var memorySummaryThreshold=parseInt(storage.getItem('qqy_mem_summary_threshold')||'10');
// ===== 总结按槽位存储（v2，各记忆区互不干扰） =====
var memorySummariesBySlot=JSON.parse(storage.getItem('qqy_mem_summaries_v2')||'null');
if(!memorySummariesBySlot){
  memorySummariesBySlot={};
  var oldS=JSON.parse(storage.getItem('qqy_mem_summaries')||'[]');
  if(oldS.length)memorySummariesBySlot[currentSlot]=oldS;
  storage.setItem('qqy_mem_summaries_v2',JSON.stringify(memorySummariesBySlot));
}
var memoryLargeSummariesBySlot=JSON.parse(storage.getItem('qqy_mem_large_summaries_v2')||'null');
if(!memoryLargeSummariesBySlot){
  memoryLargeSummariesBySlot={};
  var oldL=JSON.parse(storage.getItem('qqy_mem_large_summaries')||'[]');
  if(oldL.length)memoryLargeSummariesBySlot[currentSlot]=oldL;
  storage.setItem('qqy_mem_large_summaries_v2',JSON.stringify(memoryLargeSummariesBySlot));
}
var memorySummaries=memorySummariesBySlot[currentSlot]||(memorySummariesBySlot[currentSlot]=[]);
var memoryLargeSummaries=memoryLargeSummariesBySlot[currentSlot]||(memoryLargeSummariesBySlot[currentSlot]=[]);
function saveSummaries(){memorySummariesBySlot[currentSlot]=memorySummaries;storage.setItem('qqy_mem_summaries_v2',JSON.stringify(memorySummariesBySlot))}
function saveLargeSummaries(){memoryLargeSummariesBySlot[currentSlot]=memoryLargeSummaries;storage.setItem('qqy_mem_large_summaries_v2',JSON.stringify(memoryLargeSummariesBySlot))}
var memoryLargeThreshold=parseInt(storage.getItem('qqy_mem_large_threshold')||'3');


var imgInserts=[];
var componentPrompts=JSON.parse(storage.getItem('qqy_component_prompts')||'[]');
var editingCpIdx=-1;

// ===== 基础提示词（所有AI请求自动附加） =====
function getDefaultBasePrompt(){
  var data=loadDefaultPromptsData();
  var item=data.prompts.find(function(p){return p.type==='ai-analyze'});
  return item?item.prompt:'';
}
var DEFAULT_BASE_PROMPT=getDefaultBasePrompt();
var basePrompt=storage.getItem('qqy_base_prompt')||DEFAULT_BASE_PROMPT;
function getBasePrompt(){var v=storage.getItem('qqy_base_prompt');return v?v:DEFAULT_BASE_PROMPT}
function saveBasePrompt(v){basePrompt=v;storage.setItem('qqy_base_prompt',v)}
