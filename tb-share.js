// ==============================
// tb-share.js - 选择符合集：发布到论坛 / 从论坛导入
// 发布：标题 + 说明 + 选择符；导入：只导入选择符本身（生成一个新的自定义集合）
// ==============================

// 当前集合的选择符打包（带分组与提示）
function packCurrentSelectors() {
  var set = customSets[currentSetKey] || SELECTOR_SETS[currentSetKey] || SELECTOR_SETS['QQY'];
  return set.selectors.map(function (g) {
    return { g: g.g, s: g.s.slice(), hints: (g.hints || []).slice() };
  });
}

function openSelPackModal() {
  if (typeof db === 'undefined' || !localStorage.getItem('forum_uid')) {
    alert('请先在论坛登录后再发布'); return;
  }
  var m = document.getElementById('selPackModal');
  if (m) m.classList.add('active');
}

async function submitSelPack() {
  var title = document.getElementById('selPackTitle').value.trim();
  var desc = document.getElementById('selPackDesc').value.trim();
  if (!title) { alert('请填写标题'); return; }
  var selectors = packCurrentSelectors();
  if (!selectors.length) { alert('当前集合没有选择符'); return; }
  try {
    var r = await db.from('selector_packs').insert({
      title: title, description: desc, selectors: selectors,
      user_id: localStorage.getItem('forum_uid'),
      author_nickname: (typeof myProfile !== 'undefined' && myProfile && myProfile.nickname) || ''
    });
    if (r.error) { alert('发布失败：' + r.error.message); return; }
    closeSelPackModal();
    document.getElementById('selPackTitle').value = '';
    document.getElementById('selPackDesc').value = '';
    if (typeof sbt === 'function') { sbt('ok', '已发布到选择符广场'); setTimeout(hst, 2000); }
    else alert('已发布到选择符广场！');
  } catch (e) { alert('发布失败：' + e.message); }
}

function closeSelPackModal() {
  var m = document.getElementById('selPackModal');
  if (m) m.classList.remove('active');
}

// 从论坛广场导入：只导入选择符本身，存为新的自定义集合
function importSelectorPack(pack) {
  try {
    var sets = JSON.parse(storage.getItem('qqy_custom_sets') || '{}');
    var base = (pack.title || '导入集合').substring(0, 20);
    var name = base, n = 2;
    while (SELECTOR_SETS[name] || sets[name]) { name = base + '(' + (n++) + ')'; }
    sets[name] = {
      name: name, icon: '', desc: (pack.description || '').substring(0, 50),
      selectors: (pack.selectors || []).map(function (g) {
        return { g: g.g || '', s: g.s || [], hints: g.hints || [] };
      })
    };
    storage.setItem('qqy_custom_sets', JSON.stringify(sets));
    alert('已导入为集合「' + name + '」，可在选择符管理中切换使用');
    if (typeof renderSetList === 'function') renderSetList();
    return true;
  } catch (e) { alert('导入失败：' + e.message); return false; }
}

// 绑定发布弹窗按钮
(function () {
  var pub = document.getElementById('publishSelBtn');
  if (pub) pub.onclick = openSelPackModal;
  var sub = document.getElementById('selPackSubmit');
  if (sub) sub.onclick = submitSelPack;
  var can = document.getElementById('selPackCancel');
  if (can) can.onclick = closeSelPackModal;
})();
