// ==============================
// prompt-db.js - 提示词数据库折叠与搜索
// ==============================
// collapsedTypes 和 PROMPT_TYPE_LABELS 已移至 config.js，确保 renderCpList 调用前已定义

function togglePromptGroup(type){
  collapsedTypes[type]=!collapsedTypes[type];
  storage.setItem('qqy_collapsed_types',JSON.stringify(collapsedTypes));
  var body=document.querySelector('.prompt-group-body[data-group-type="'+type+'"]');
  if(body){
    body.style.display=collapsedTypes[type]?'none':'block';
    var arrow=body.parentElement.querySelector('.group-arrow');
    if(arrow)arrow.textContent=collapsedTypes[type]?'▶':'▼';
  }
}

// 提示词数据库搜索过滤
function filterCpList(){
  var input=document.getElementById('cpSearch');
  if(!input)return;
  var kw=input.value.toLowerCase().trim();
  var cards=document.querySelectorAll('#cpList .cp-card');
  var groups=document.querySelectorAll('#cpList .prompt-group');
  cards.forEach(function(card){
    if(!kw){card.style.display='';return}
    var title=card.querySelector('.cp-card-title');
    var desc=card.querySelector('.cp-card-desc');
    var text=(title?title.textContent:'')+(desc?' '+desc.textContent:'');
    card.style.display=text.toLowerCase().indexOf(kw)>=0?'':'none';
  });
  // 隐藏空分组
  groups.forEach(function(group){
    var visibleCards=group.querySelectorAll('.cp-card[style*="display: none"], .cp-card[style*="display:none"]');
    var allCards=group.querySelectorAll('.cp-card');
    if(kw&&visibleCards.length===allCards.length){group.style.display='none'}
    else{group.style.display=''}
  });
}
