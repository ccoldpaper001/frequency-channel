// ==============================
// search.js - 选择符快捷查找
// ==============================
// 功能：在选择符列表中按名称/备注实时过滤

// 手动调整页面的选择符搜索
function initSelSearch(){
  var input=$('selSearch');
  if(!input)return;
  input.addEventListener('input',function(){
    filterSelList('bsel',this.value);
  });
}

// AI生成页面的选择符搜索
function initAiSelSearch(){
  var input=$('aiSelSearch');
  if(!input)return;
  input.addEventListener('input',function(){
    filterSelList('aiSelGrid',this.value);
  });
}

// 通用过滤函数：根据关键词显示/隐藏列表条目
function filterSelList(containerId,keyword){
  var container=document.getElementById(containerId);
  if(!container)return;
  var items=container.querySelectorAll('.cs-sel-item, .ai-sel-item');
  var kw=keyword.toLowerCase().trim();
  items.forEach(function(item){
    if(!kw){item.style.display='';return}
    var code=item.querySelector('.cs-sel-code, .ai-sel-code, .chip-code');
    var hint=item.querySelector('.cs-sel-hint, .ai-sel-hint, .chip-cn');
    var text=(code?code.textContent:'')+(hint?' '+hint.textContent:'');
    item.style.display=text.toLowerCase().indexOf(kw)>=0?'':'none';
  });
}

// 页面加载后初始化
initSelSearch();
initAiSelSearch();
