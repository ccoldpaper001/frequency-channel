// ==============================
// utils.js - 工具函数
// ==============================
function $(id){return document.getElementById(id)}

// 通用复制函数：优先使用 clipboard API，不支持时用 execCommand 兜底
function copyToClipboard(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text)
  }else{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy')}catch(e){}
    document.body.removeChild(ta);
    return Promise.resolve()
  }
}
function sbt(t,m){var s=$('sb');if(!s)return;s.className='sb show '+t;s.textContent=m}
function hst(){var s=$('sb');if(s)s.className='sb'}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function toHex(c){
  if(!c)return '#000000';
  if(c[0]==='#')return c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c;
  var m=c.match(/rgba?\(([^)]+)\)/);
  if(m){var p=m[1].split(',').map(function(x){return parseFloat(x.trim())});return '#'+[p[0]||0,p[1]||0,p[2]||0].map(function(x){return Math.round(x).toString(16).padStart(2,'0')}).join('')}
  return '#000000';
}

function parseShadow(str){
  var def={x:'0',y:'0',blur:'0',spread:'0',color:'#000000'};
  if(!str||str==='none')return def;
  var cm=str.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
  var color=cm?toHex(cm[0]):'#000000';
  var nums=str.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|none|!important/g,'').trim().split(/\s+/).filter(Boolean);
  return {x:nums[0]||'0',y:nums[1]||'0',blur:nums[2]||'0',spread:nums[3]||'0',color:color};
}

function toggleShadow(sel,type,checked){
  if(!states[sel])states[sel]={};
  var onK=type==='sh'?'_sh_on':'_tsh_on',oldK=type==='sh'?'_sh':'_tsh';
  var xK=type==='sh'?'_sh_x':'_tsh_x',yK=type==='sh'?'_sh_y':'_tsh_y';
  var bK=type==='sh'?'_sh_blur':'_tsh_blur',cK=type==='sh'?'_sh_color':'_tsh_color';
  var spK=type==='sh'?'_sh_spread':null;
  if(checked&&!states[sel][onK]&&states[sel][oldK]&&!states[sel][xK]){
    var sd=parseShadow(states[sel][oldK]);
    states[sel][xK]=sd.x;states[sel][yK]=sd.y;states[sel][bK]=sd.blur;
    if(spK)states[sel][spK]=sd.spread;states[sel][cK]=sd.color;
  }
  states[sel][onK]=checked?'1':'';
  rsb();
}

function buildProps(s){
  var lines=[];
  if(s._bg_type==='image'&&s._bgimg){lines.push('  background-color: transparent !important; /* 背景色透明 */');lines.push('  background-image: '+s._bgimg+' !important; /* 背景图片URL */');lines.push('  background-size: '+(s._bgsz||'cover')+' !important; /* 图片缩放 */');lines.push('  background-position: '+(s._bgpos||'center')+' !important; /* 图片位置 */');lines.push('  background-repeat: '+(s._bgrpt||'no-repeat')+' !important; /* 图片重复 */');if(s._bgattach)lines.push('  background-attachment: '+s._bgattach+' !important; /* 背景固定 */')}
  else if(s._bg_type==='transparent'){lines.push('  background: transparent !important; /* 背景透明 */')}
  else if(s._bg_type==='gradient'&&s._bg_custom){lines.push('  background: '+s._bg_custom+' !important; /* 背景渐变(自定义) */')}
  else if(s._bg_type==='gradient'&&s._bg_grad&&GRADIENTS[s._bg_grad]){lines.push('  background: '+GRADIENTS[s._bg_grad]+' !important; /* 背景渐变 */')}
  else if(s._bg_type==='solid'&&s._bg_color){lines.push('  background: '+s._bg_color+' !important; /* 背景颜色 */')}
  else if(s._bgimg){lines.push('  background-color: transparent !important; /* 背景色透明 */');lines.push('  background-image: '+s._bgimg+' !important; /* 背景图片URL */');lines.push('  background-size: '+(s._bgsz||'cover')+' !important; /* 图片缩放 */');lines.push('  background-position: '+(s._bgpos||'center')+' !important; /* 图片位置 */');lines.push('  background-repeat: '+(s._bgrpt||'no-repeat')+' !important; /* 图片重复 */');if(s._bgattach)lines.push('  background-attachment: '+s._bgattach+' !important; /* 背景固定 */')}
  else if(s._bg&&s._bg!=='transparent'){lines.push('  background: '+s._bg+' !important; /* 背景 */')}
  if(s._color&&s._color!=='transparent'){lines.push('  color: '+s._color+' !important; /* 文字颜色 */');lines.push('  -webkit-text-fill-color: '+s._color+' !important; /* 文字颜色(兼容) */')}
  if(s._br!==undefined&&s._br!==null&&s._br!==''){lines.push('  border-radius: '+(s._br||'0')+'px !important; /* 圆角大小 */')}
  if(s._w&&s._w!=='auto')lines.push('  width: '+s._w+' !important; /* 宽度 */');
  if(s._h&&s._h!=='auto')lines.push('  height: '+s._h+' !important; /* 高度 */');
  if(s._pad){var v=String(s._pad);lines.push('  padding: '+v+(v.match(/px|%|em|rem/)?'':'px')+' !important; /* 内边距 */')}
  if(s._fs){var v2=String(s._fs);lines.push('  font-size: '+v2+(v2.match(/px|%|em|rem/)?'':'px')+' !important; /* 字体大小 */')}
  if(s._op!==undefined&&s._op!==''&&s._op!=='1')lines.push('  opacity: '+s._op+' !important; /* 不透明度 */');
  if(s._sh_on==='1'){lines.push('  box-shadow: '+(s._sh_x||'0')+'px '+(s._sh_y||'0')+'px '+(s._sh_blur||'0')+'px '+(s._sh_spread||'0')+'px '+(s._sh_color||'rgba(0,0,0,0.3)')+' !important; /* 阴影 */')}
  else if(s._sh){lines.push('  box-shadow: '+s._sh+' !important; /* 阴影 */')}
  if(s._tsh_on==='1'){lines.push('  text-shadow: '+(s._tsh_x||'0')+'px '+(s._tsh_y||'0')+'px '+(s._tsh_blur||'0')+'px '+(s._tsh_color||'rgba(255,255,255,0.5)')+' !important; /* 文字阴影 */')}
  else if(s._tsh){lines.push('  text-shadow: '+s._tsh+' !important; /* 文字阴影 */')}
  if(s._ta)lines.push('  text-align: '+s._ta+' !important; /* 文字对齐 */');
  if(s._fw==='1')lines.push('  font-weight: 700 !important; /* 加粗 */');
  if(s._fi==='1')lines.push('  font-style: italic !important; /* 斜体 */');
  if(s._bgbl&&s._bgbl!=='0')lines.push('  backdrop-filter: blur('+s._bgbl+'px) !important; /* 毛玻璃 */');
  if(s._ff)lines.push('  font-family: '+s._ff+' !important; /* 字体 */');
  return lines.join('\n');
}

function buildCss(){
  var css='';var hasGlobalFF=false;
  for(var sel in states){
    var s=states[sel];
    if(s._raw&&s._raw.trim()){css+=s._raw.trim()+'\n\n';continue}
    if(s._ff&&!hasGlobalFF){css+='* {\n  font-family: '+s._ff+' !important; /* 全局字体 */\n}\n\n';hasGlobalFF=true}
    var props=buildProps(s);
    if(props){var label=s._title||getGroup(sel)||'';css+=sel+' {\n'+props+'\n}'+(label?' /* '+label+' */':'')+'\n\n'}
  }
  return css.trim();
}

function getGroup(sel){for(var i=0;i<getSelectors().length;i++){if(getSelectors()[i].s.indexOf(sel)>=0)return getSelectors()[i].g}return ''}

function buildBlockCss(sel){
  var s=states[sel]||{};
  if(s._raw&&s._raw.trim()){return s._raw.trim()}
  var props=buildProps(s);
  var label=s._title||getGroup(sel)||'';
  var result='';
  if(props)result+=sel+' {\n'+props+'\n}'+(label?' /* '+label+' */':'');
  // 贴纸模式：额外输出 ::before 伪元素
  if(s._sticker_url){
    if(result)result+='\n';
    var sp=s._sticker_pos||'center';
    var ss=s._sticker_size||'cover';
    var sr=s._sticker_repeat||'no-repeat';
    var so=s._sticker_op||'1';
    result+=sel+' {\n  position: relative !important;\n  overflow: hidden !important;\n}\n';
    result+=sel+'::before {\n';
    result+='  content: "" !important;\n';
    result+='  position: absolute !important;\n';
    result+='  top: 0 !important; left: 0 !important;\n';
    result+='  width: 100% !important; height: 100% !important;\n';
    result+='  background-image: url('+s._sticker_url+') !important;\n';
    result+='  background-size: '+ss+' !important;\n';
    result+='  background-position: '+sp+' !important;\n';
    result+='  background-repeat: '+sr+' !important;\n';
    result+='  opacity: '+so+' !important;\n';
    result+='  z-index: 0 !important;\n';
    result+='  pointer-events: none !important;\n';
    result+='}';
  }
  return result;
}

// ==============================
// 帮助说明弹窗
// ==============================
var HELP_TEXTS={
  cgPage:{title:' 组件分析',body:'组件分析用于将一段现成的组件代码（HTML / CSS / JavaScript）交给 AI 分析其结构特点，自动生成可复用的「组件提示词」，存入提示词数据库后可在「代码生成」页面的「提示词预设」中直接选用。\n\n使用流程：\n① 粘贴组件代码并选择分析规则\n② 点击「生成提示词」，AI 按分析规则分析代码结构特点\n③ 在「生成结果」区查看、编辑生成的提示词\n④ 点击「存入数据库」保存为组件提示词'},
  cgInput:{title:' 输入区',body:'这里是 AI 分析的原始材料区。\n\n• 分析规则：告诉 AI「用什么视角分析代码」\n• 组件代码：告诉 AI「分析什么」\n\n两者缺一不可，请先在提示词数据库中创建至少一条「AI分析组件提示词」类型的规则。'},
  cgRule:{title:'分析规则',body:'分析规则是「AI分析组件提示词」类型的提示词，作为 system 角色指令发送给 AI，决定 AI 用什么视角、什么格式来分析组件代码。\n\n例如：\n• 提取组件结构与样式特征\n• 分析组件的可配置项\n• 总结组件的设计模式\n\n可在「提示词数据库」页面新建更多分析规则。'},
  cgCode:{title:'组件代码',body:'粘贴需要分析的组件源代码，支持 HTML / CSS / JavaScript 混合粘贴。\n\n建议：\n• 代码越完整，分析结果越准确\n• 可以只粘贴关键片段，不必包含无关代码\n• 过长的代码可能被截断，建议控制在 2000 行以内'},
  cgResultSec:{title:' 生成结果区',body:'AI 生成的组件提示词会显示在这里。\n\n• 结果可以直接手动编辑修改\n• 点击「存入数据库」将其保存为「组件提示词」类型\n• 保存后可在本页的「提示词预设」下拉中直接选用'},
  cgResult:{title:'生成结果',body:'这里是 AI 输出的提示词文本。\n\n• 生成后可以自由编辑、删减、补充\n• 内容不会自动保存，需点击「存入数据库」\n• 重新点击「生成提示词」会覆盖当前内容，请先保存需要保留的内容'},
  cgConfig:{title:' 代码生成',body:'代码生成用于基于「组件提示词」预设，让 AI 生成真实可用的组件代码（HTML / CSS / JavaScript），生成结果可存入当前记忆区作为后续 AI 对话的参考上下文。\n\n使用流程：\n① 选择一个「组件提示词」作为生成参考（可留空）\n② 填写额外要求（可留空）\n③ 选择使用的 API 配置\n④ 点击「生成代码」，AI 根据预设和额外要求生成组件代码\n⑤ 在「生成结果」区查看、编辑代码\n⑥ 点击「存入记忆」保存到当前记忆区'},
  cgPreset:{title:'提示词预设',body:'从「组件提示词」类型的提示词中选择一条作为生成参考。\n\n作用：\n• 让 AI 模仿已有提示词的风格和格式\n• 保持多次生成的结果风格一致\n\n可留空，留空时 AI 仅根据分析规则自由发挥。'},
  cgExtra:{title:'用户额外要求',body:'填写本次生成的特殊要求，会作为独立段落发送给 AI。\n\n例如：\n• 重点分析颜色搭配\n• 输出为中文，300 字以内\n• 忽略动画相关代码\n\n可留空。'},
  cgApi:{title:'使用API',body:'选择本次生成使用的 API 配置。\n\n• 主API：使用「设置API」中配置的当前地址、Key 和模型（默认选项）\n• 其他预设：使用已保存的 API 预设，可指向不同的服务商或模型\n\nAPI 预设可在「设置API」弹窗中点击「存为预设」创建。'}
};
function showHelp(key){
  var h=HELP_TEXTS[key];
  if(!h)return;
  $('helpTitle').textContent=h.title;
  $('helpBody').textContent=h.body;
  $('helpModal').classList.add('active');
}

// ===== 通用自定义弹窗（替代 alert/confirm，点击背景可关闭） =====
function showDialog(title,message,type,defVal){
  type=type||'alert';
  $('dialogTitle').textContent=title||'提示';
  var body=$('dialogBody');
  if(type==='prompt'){
    body.innerHTML='<div style="margin-bottom:8px;font-size:12px;color:var(--td)">'+escH(message||'')+'</div><input type="text" id="dialogInput" value="'+escH(defVal||'')+'" style="width:100%;padding:6px 8px;border:1px solid var(--br);border-radius:4px;background:var(--bg);color:var(--ts);font-size:12px;box-sizing:border-box">';
  }else{
    body.textContent=message||'';
  }
  var btns='';
  if(type==='confirm'||type==='prompt'){
    btns='<button class="btn btn-s btn-sm" id="dialogCancel">取消</button><button class="btn btn-p btn-sm" id="dialogOk">确认</button>';
  }else{
    btns='<button class="btn btn-p btn-sm" id="dialogOk">知道了</button>';
  }
  $('dialogBtns').innerHTML=btns;
  $('dialogModal').classList.add('active');
  if(type==='prompt'){var inp=$('dialogInput');if(inp){inp.focus();inp.select()}}
  return new Promise(function(resolve){
    $('dialogOk').onclick=function(){
      $('dialogModal').classList.remove('active');
      if(type==='prompt'){var v=$('dialogInput');resolve(v?v.value.trim():'')}else{resolve(true)}
    };
    if(type==='confirm'||type==='prompt'){
      $('dialogCancel').onclick=function(){$('dialogModal').classList.remove('active');resolve(type==='prompt'?'':false)};
    }
  });
}
