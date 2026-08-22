// ==============================
// app.js - 初始化 & 事件绑定
// ==============================

function switchPage(page){
  hst();
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active')});
  $('page-'+page).classList.add('active');
  var nav=document.querySelector('.nav-item[data-page="'+page+'"]');
  if(nav)nav.classList.add('active');
  storage.setItem('qqy_current_page',page);
  if(page==='memory'){renderSlotList();renderMemory();renderSummaries();renderUnsaved()}
  if(page==='selectors')renderSetList();
  if(page==='component')renderCpList();
  if(page==='analyzer'){renderCgRules()}
  if(page==='codegen'){renderCgPresets();renderCgApiOptions();initCgCodePreview()}
  if(page==='replace'){initReplacePage()}
  if(page==='htmledit'){initHtmlEditPage()}
  if(page==='svgconv'){initSvgConverterPage()}
}

function init(){
  rsel();rsb();

  if($('selAll'))$('selAll').addEventListener('click',selectAllSels);
  if($('selClear'))$('selClear').addEventListener('click',clearSel);

  $('cpa').addEventListener('click',function(){var css=buildCss();if(!css)return;copyToClipboard(css).then(function(){$('cpa').classList.add('cd');setTimeout(function(){$('cpa').classList.remove('cd')},1500)}).catch(function(){})});
  $('cpo').addEventListener('click',function(){renderCodeView();$('cvm').classList.add('active')});
  $('clr').addEventListener('click',clearAllCss);

  $('cvcopy').addEventListener('click',function(){var css=buildCss();if(!css)return;copyToClipboard(css).then(function(){var b=$('cvcopy');b.textContent='✓ 已复制';b.classList.add('cd');setTimeout(function(){b.textContent='📋 复制';b.classList.remove('cd')},1500)}).catch(function(){})});
  $('cvclr').addEventListener('click',clearAllCss);
  $('cvx').addEventListener('click',function(){$('cvm').classList.remove('active')});

  $('akb1').addEventListener('click',openApiModal);
  $('akmx').addEventListener('click',function(){$('akm').classList.remove('active')});
  $('aksv').addEventListener('click',saveApiConfig);
  var akclearcache=$('akclearcache');if(akclearcache)akclearcache.addEventListener('click',clearBrowserCache);
  $('akcl').addEventListener('click',clearApiConfig);
  $('akmodel').addEventListener('change',function(){$('akmcustomwrap').style.display=$('akmodel').value==='__custom__'?'block':'none'});
  $('fetchModelsBtn').addEventListener('click',fetchModels);

  renderAiSelGrid();
  $('aiSelAll').addEventListener('click',function(){getAllSels().forEach(function(a){selectedSels.add(a.s)});renderAiSelGrid();rsel()});
  $('aiSelNone').addEventListener('click',function(){selectedSels.clear();renderAiSelGrid();rsel()});

  // AI生成页 提示词：切换 + 修改实时同步数据库
  loadPromptUI();
  $('promptSel').addEventListener('change',onPromptSelChange);
  $('promptTa').addEventListener('input',onPromptTaInput);

  $('gb').addEventListener('click',hg);
  $('lastAiCopy').addEventListener('click',function(){var ta=$('lastAiCss');if(!ta||!ta.value)return;copyToClipboard(ta.value).then(function(){var b=$('lastAiCopy');b.innerHTML='<span>✓</span> 已复制';setTimeout(function(){b.innerHTML='<span>📋</span> 复制代码'},1500)}).catch(function(){})});
  $('lastAiRetry').addEventListener('click',retryLastAi);
  $('ri').addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();hg()}});

  renderSetList();
  $('newSetBtn').addEventListener('click',function(){openSetModal(null)});
  $('setModalX').addEventListener('click',function(){$('setModal').classList.remove('active')});
  $('setModalCancel').addEventListener('click',function(){$('setModal').classList.remove('active')});
  $('setModalSave').addEventListener('click',saveSet);
  $('addSelBtn').addEventListener('click',addTempSel);

  $('importTextBtn').addEventListener('click',openImportModal);
  $('importModalX').addEventListener('click',function(){$('importModal').classList.remove('active')});
  $('importModalCancel').addEventListener('click',function(){$('importModal').classList.remove('active')});
  $('importAnalyze').addEventListener('click',analyzeImportText);
  $('importSave').addEventListener('click',saveImportSet);

  $('memoryToggle').checked=memoryEnabled;
  $('memoryToggle').addEventListener('change',toggleMemory);
  $('memRounds').value=memoryMaxRounds;
  $('memThreshold').value=memorySummaryThreshold;
  var mlt=$('memLargeThreshold');if(mlt)mlt.value=memoryLargeThreshold;
  $('memRounds').addEventListener('change',saveMemConfig);
  $('memThreshold').addEventListener('change',saveMemConfig);
  if(mlt)mlt.addEventListener('change',saveMemConfig);
  renderSlotList();
  $('memSlotSel').addEventListener('change',onSlotChange);
  $('memSlotNew').addEventListener('click',newMemorySlot);
  $('memSlotRename').addEventListener('click',renameMemorySlot);
  $('memClear').addEventListener('click',clearMemory);
  $('memSummaryNow').addEventListener('click',summaryNow);
  var mlsn=$('memLargeSummaryNow');if(mlsn)mlsn.addEventListener('click',largeSummaryNow);
  $('memClearSummary').addEventListener('click',clearSummaries);
  // 记忆操作：新增/导出/导入
  var memAdd=$('memAdd');if(memAdd)memAdd.addEventListener('click',addMemoryManual);
  var memExport=$('memExport');if(memExport)memExport.addEventListener('click',exportMemory);
  var memImport=$('memImport');if(memImport)memImport.addEventListener('click',importMemory);
  var memImportFile=$('memImportFile');if(memImportFile)memImportFile.addEventListener('change',handleMemoryImport);
  // 新增大小总结
  var memLargeAdd=$('memLargeAdd');if(memLargeAdd)memLargeAdd.addEventListener('click',addLargeSummary);
  var memSummaryAdd=$('memSummaryAdd');if(memSummaryAdd)memSummaryAdd.addEventListener('click',addSummary);
  // 记忆编辑弹窗
  var memEditX=$('memEditX');if(memEditX)memEditX.addEventListener('click',closeMemEdit);
  var memEditCancel=$('memEditCancel');if(memEditCancel)memEditCancel.addEventListener('click',closeMemEdit);
  var memEditSave=$('memEditSave');if(memEditSave)memEditSave.addEventListener('click',saveMemEdit);
  // AI 错误日志悬浮面板
  var aiErrFab=$('aiErrFab');if(aiErrFab)aiErrFab.addEventListener('click',toggleAiErrPanel);
  var aiErrClose=$('aiErrClose');if(aiErrClose)aiErrClose.addEventListener('click',toggleAiErrPanel);
  var aiErrClear=$('aiErrClear');if(aiErrClear)aiErrClear.addEventListener('click',clearAiErrorLog);
  renderAiErrorLog();

  // 侧边栏收起/展开
  var sidebarToggle=$('sidebarToggle');
  var sidebar=document.querySelector('.sidebar');
  function applySidebarState(collapsed){
    if(!sidebar)return;
    sidebar.classList.toggle('collapsed',collapsed);
    document.querySelector('.main-content').style.marginLeft=collapsed?'52px':'200px';
  }
  if(sidebarToggle&&sidebar){
    // 恢复上次状态
    var savedCollapsed=storage.getItem('qqy_sidebar_collapsed')==='1';
    applySidebarState(savedCollapsed);
    sidebarToggle.addEventListener('click',function(){
      var collapsed=!sidebar.classList.contains('collapsed');
      applySidebarState(collapsed);
      storage.setItem('qqy_sidebar_collapsed',collapsed?'1':'0');
    });
  }

  // 使用说明按钮
  var helpBtn=$('helpBtn');
  if(helpBtn)helpBtn.addEventListener('click',function(){
    fetch('help-content.html').then(function(res){
      if(!res.ok)throw new Error('加载失败');
      return res.text();
    }).then(function(html){
      $('helpTitle').textContent='使用说明';
      $('helpBody').innerHTML=html;
      $('helpBody').style.whiteSpace='normal';
      $('helpModal').classList.add('active');
    }).catch(function(e){
      showDialog('提示','使用说明加载失败，请检查 help-content.html 文件是否存在');
    });
  });

  if(ak)$('aks').textContent='已设置';

  // 提示词数据库
  renderCpList();
  renderCpApiOptions('');
  $('cpNew').addEventListener('click',newCpTemplate);
  var cpDataManage=$('cpDataManage');if(cpDataManage)cpDataManage.addEventListener('click',function(){$('cpDataPanel').style.display=$('cpDataPanel').style.display==='none'?'block':'none';updateCacheInfo()});
  $('cpExport').addEventListener('click',exportAllData);
  $('cpImport').addEventListener('click',function(){$('cpImportFile').click()});
  $('cpImportFile').addEventListener('change',function(e){var f=e.target.files[0];if(f){importAllData(f);e.target.value=''}});
  $('cpSave').addEventListener('click',saveCpTemplate);
  $('cpDelete').addEventListener('click',deleteCpTemplate);

  // 组件分析（功能A：分析代码 → 生成提示词 → 存入数据库）
  $('cgAnalyzePrompt').addEventListener('click',cgAnalyzePrompt);
  $('cgSave').addEventListener('click',cgSave);
  var cgClear=$('cgClear');if(cgClear)cgClear.addEventListener('click',async function(){if(!$('cgResult').value.trim()){sbt('info','内容已为空');setTimeout(hst,1500);return}if(!await showDialog('确认清理','确定清空生成结果吗？','confirm'))return;$('cgResult').value='';sbt('ok','✅ 已清理');setTimeout(hst,2000)});
  // 代码生成（功能B：预设 → 生成代码 → 存入记忆）
  $('cgAnalyze').addEventListener('click',cgAnalyze);
  $('cgSaveToMemory').addEventListener('click',cgSaveToMemory);
  var cgCodeClear=$('cgCodeClear');if(cgCodeClear)cgCodeClear.addEventListener('click',async function(){if(!$('cgCodeResult').value.trim()){sbt('info','内容已为空');setTimeout(hst,1500);return}if(!await showDialog('确认清理','确定清空生成结果吗？','confirm'))return;$('cgCodeResult').value='';sbt('ok','✅ 已清理');setTimeout(hst,2000)});

  // 恢复上次停留的页面（刷新/重开后保持）
  var lastPage=storage.getItem('qqy_current_page');
  if(lastPage&&$('page-'+lastPage)){switchPage(lastPage)}
}

init();
