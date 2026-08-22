// ==============================
// svg-icons.js - 内联 SVG 图标库（替代 emoji）
// ==============================
// 图标风格：线性简约，适配暖棕主题，继承 currentColor

var SVG_ICONS={
  // 导航与页面
  'ai':'<path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'manual':'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-2.1 2.7-2.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'database':'<ellipse cx="12" cy="5" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  'search':'<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'code':'<path d="m8 6-6 6 6 6M16 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'replace':'<path d="M17 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 13v1a4 4 0 0 1-4 4H3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'list':'<path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/>',
  'memory':'<path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'edit':'<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  // 操作按钮
  'copy':'<rect x="9" y="9" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  'save':'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'delete':'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'export':'<path d="M12 3v12m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'import':'<path d="M12 15V3m0 12 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'close':'<path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'settings':'<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  'key':'<circle cx="8" cy="15" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m11.5 11.5 8.5-8.5M17 4l3 3M14 7l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'doc':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M9 13h6M9 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'eye':'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  'sparkle':'<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  'bolt':'<path d="M13 2 3 14h8l-1 8 11-13h-8l1-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  'warn':'<path d="M12 3 2 21h20L12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1" fill="currentColor"/>',
  'rocket':'<path d="M5 15c-1.5 1.2-2 5-2 5s3.8-.5 5-2M9 13c-2.8.3-5-1.9-5-1.9S7.5 7 12.5 4.5 22 2 22 2s-.5 4.5-2.5 9.5S12.9 20 12.9 20s-2.2-2.2-1.9-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  'folder':'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'link':'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'chat':'<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'user':'<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'check':'<path d="m4 12.5 5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  'play':'<path d="M6 4l14 8-14 8V4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  'plus':'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'note':'<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  'swap':'<path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
};

// emoji → 图标名映射
var EMOJI_ICON_MAP={
  '🤖':'ai','🔧':'manual','🗄️':'database','🗄':'database','🔍':'search','⚡':'bolt','🔄':'replace','📋':'list','🧠':'memory','📝':'note','✏️':'edit','✏':'edit',
  '📤':'export','📥':'import','💾':'save','🗑️':'delete','🗑':'delete','✕':'close','⚙️':'settings','⚙':'settings','🔑':'key','📄':'doc','👁️':'eye','👁':'eye',
  '✨':'sparkle','⚠️':'warn','⚠':'warn','🚀':'rocket','🗂️':'folder','🗂':'folder','🔗':'link','💬':'chat','👤':'user','✅':'check','▶️':'play','＋':'plus','⇅':'swap'
};

// 生成 SVG 图标标签
function svgIcon(name,cls){
  var path=SVG_ICONS[name];
  if(!path)return '';
  return '<svg class="icon '+(cls||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';
}

// 将文本中的 emoji 替换为 SVG 图标标签
function replaceEmojiWithIcon(text){
  if(!text)return text;
  var result=text;
  for(var emoji in EMOJI_ICON_MAP){
    var iconName=EMOJI_ICON_MAP[emoji];
    result=result.split(emoji).join(svgIcon(iconName));
  }
  return result;
}

// 自动扫描页面中的 emoji 文本节点并替换为 SVG 图标
function autoReplaceEmojiInDom(root){
  var emojiRegex=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}⇅＋▶️]/gu;
  var walker=document.createTreeWalker(
    root||document.body,
    NodeFilter.SHOW_TEXT,
    {acceptNode:function(node){
      // 跳过脚本、样式、输入框、文本域
      var parent=node.parentElement;
      if(!parent)return NodeFilter.FILTER_REJECT;
      var tag=parent.tagName;
      if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA'||tag==='INPUT')return NodeFilter.FILTER_REJECT;
      if(parent.isContentEditable)return NodeFilter.FILTER_REJECT;
      return emojiRegex.test(node.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }}
  );
  var nodesToReplace=[];
  var node;
  while(node=walker.nextNode()){nodesToReplace.push(node)}
  nodesToReplace.forEach(function(textNode){
    var replaced=replaceEmojiWithIcon(textNode.nodeValue);
    if(replaced!==textNode.nodeValue){
      var span=document.createElement('span');
      span.innerHTML=replaced;
      textNode.parentNode.replaceChild(span,textNode);
    }
  });
}

// 页面加载完成后自动替换静态内容中的 emoji
function initEmojiReplacement(){
  setTimeout(function(){autoReplaceEmojiInDom()},100);
  // 监听 DOM 变化，自动处理动态生成的内容
  var observer=new MutationObserver(function(mutations){
    var hasNewContent=false;
    mutations.forEach(function(m){
      if(m.addedNodes.length>0)hasNewContent=true;
    });
    if(hasNewContent){
      clearTimeout(window._emojiReplaceTimer);
      window._emojiReplaceTimer=setTimeout(function(){autoReplaceEmojiInDom()},150);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initEmojiReplacement);
}else{
  initEmojiReplacement();
}
