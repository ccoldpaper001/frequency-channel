// ==============================
// sidebar-sort.js - 侧边栏长按拖拽排序
// ==============================
// 功能：
// 1. 长按导航项 500ms 进入排序模式（再次点击空白处退出）
// 2. 排序模式下可拖拽导航项调整顺序
// 3. 顺序持久化到 localStorage（键：qqy_nav_order）
// 4. 页面加载时自动恢复已保存的顺序

(function(){
  var LONG_PRESS_MS=500;
  var ORDER_KEY='qqy_nav_order';
  var sortMode=false;
  var pressTimer=null;
  var dragEl=null;

  function getNav(){return document.querySelector('.sidebar-nav')}
  function getItems(){var nav=getNav();return nav?Array.prototype.slice.call(nav.querySelectorAll('.nav-item')):[]}

  // 保存当前顺序
  function saveOrder(){
    var order=getItems().map(function(el){return el.getAttribute('data-page')});
    try{storage.setItem(ORDER_KEY,JSON.stringify(order))}catch(e){}
  }

  // 恢复保存的顺序
  function restoreOrder(){
    var nav=getNav();if(!nav)return;
    var saved=null;
    try{saved=JSON.parse(storage.getItem(ORDER_KEY)||'null')}catch(e){}
    if(!saved||!saved.length)return;
    var items=getItems();
    var map={};
    items.forEach(function(el){map[el.getAttribute('data-page')]=el});
    saved.forEach(function(page){
      if(map[page]){nav.appendChild(map[page]);delete map[page]}
    });
    // 新增的（保存顺序中没有的）追加到末尾
    Object.keys(map).forEach(function(page){nav.appendChild(map[page])});
  }

  // 进入排序模式
  function enterSortMode(){
    if(sortMode)return;
    sortMode=true;
    var nav=getNav();if(!nav)return;
    nav.classList.add('sort-mode');
    getItems().forEach(function(el){el.setAttribute('draggable','true')});
    if(typeof sbt==='function'){sbt('ok','🔀 排序模式：拖拽调整顺序，点击空白处退出');setTimeout(function(){if(typeof hst==='function')hst()},2500)}
  }

  // 退出排序模式
  function exitSortMode(){
    if(!sortMode)return;
    sortMode=false;
    var nav=getNav();if(!nav)return;
    nav.classList.remove('sort-mode');
    getItems().forEach(function(el){el.removeAttribute('draggable');el.classList.remove('drag-over')});
    saveOrder();
  }

  // 长按检测（同时支持鼠标与触摸）
  function onPressStart(e){
    var item=e.target.closest?e.target.closest('.nav-item'):null;
    if(!item)return;
    if(sortMode)return;
    clearTimeout(pressTimer);
    pressTimer=setTimeout(function(){enterSortMode()},LONG_PRESS_MS);
  }
  function onPressEnd(){clearTimeout(pressTimer)}

  // 拖拽事件
  function onDragStart(e){
    if(!sortMode){e.preventDefault();return}
    dragEl=e.target.closest('.nav-item');
    if(!dragEl){e.preventDefault();return}
    e.dataTransfer.effectAllowed='move';
    try{e.dataTransfer.setData('text/plain',dragEl.getAttribute('data-page'))}catch(err){}
    dragEl.style.opacity='0.4';
  }
  function onDragOver(e){
    if(!sortMode||!dragEl)return;
    var item=e.target.closest?e.target.closest('.nav-item'):null;
    if(!item||item===dragEl)return;
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
    getItems().forEach(function(el){el.classList.remove('drag-over')});
    item.classList.add('drag-over');
  }
  function onDrop(e){
    if(!sortMode||!dragEl)return;
    var item=e.target.closest?e.target.closest('.nav-item'):null;
    if(!item||item===dragEl)return;
    e.preventDefault();
    var nav=getNav();
    var items=getItems();
    var fromIdx=items.indexOf(dragEl);
    var toIdx=items.indexOf(item);
    if(fromIdx<toIdx){nav.insertBefore(dragEl,item.nextSibling)}
    else{nav.insertBefore(dragEl,item)}
    item.classList.remove('drag-over');
    saveOrder();
  }
  function onDragEnd(){
    if(dragEl)dragEl.style.opacity='';
    dragEl=null;
    getItems().forEach(function(el){el.classList.remove('drag-over')});
  }

  // 点击空白处退出排序模式
  function onDocClick(e){
    if(!sortMode)return;
    var inNav=e.target.closest?e.target.closest('.sidebar-nav'):null;
    if(!inNav)exitSortMode();
  }

  // 排序模式下阻止 nav-item 的点击跳转（避免拖拽误触）
  function onNavClickCapture(e){
    if(!sortMode)return;
    var item=e.target.closest?e.target.closest('.nav-item'):null;
    if(item){e.preventDefault();e.stopPropagation()}
  }

  function init(){
    var nav=getNav();if(!nav)return;
    restoreOrder();
    // 长按（鼠标 + 触摸）
    nav.addEventListener('mousedown',onPressStart);
    nav.addEventListener('mouseup',onPressEnd);
    nav.addEventListener('mouseleave',onPressEnd);
    nav.addEventListener('touchstart',onPressStart,{passive:true});
    nav.addEventListener('touchend',onPressEnd);
    nav.addEventListener('touchcancel',onPressEnd);
    // 拖拽
    nav.addEventListener('dragstart',onDragStart);
    nav.addEventListener('dragover',onDragOver);
    nav.addEventListener('drop',onDrop);
    nav.addEventListener('dragend',onDragEnd);
    // 退出与点击拦截
    document.addEventListener('click',onDocClick);
    nav.addEventListener('click',onNavClickCapture,true);
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}
  else{init()}
})();
