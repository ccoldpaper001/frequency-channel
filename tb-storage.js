// ==============================
// storage.js - 统一存储接口（云端优先版）
// - 数据主存 Supabase 表 toolbox_data（按账号隔离，跨设备同步）
// - 浏览器 localStorage 只保留两类：API 配置（qqy_api_*，用户要求仅本地）
//   和界面小偏好；其余数据不落浏览器
// - 内存缓存作为运行时读写层，页面加载时从云端拉取
// ==============================

// ---------- 用户隔离 ----------
function _currentUserKey() {
  try { return localStorage.getItem('forum_uid') || 'guest'; }
  catch (e) { return 'guest'; }
}

// 内存缓存（页面运行期间的数据层）
var _mem = {};

// 敏感键（API 配置）只在本地浏览器保存
function _isLocalOnly(key) { return key.indexOf('qqy_api_') === 0; }

// ---------- 云端读写 ----------
var _CLOUD_ON = (typeof db !== 'undefined') && !!localStorage.getItem('forum_uid');
var _syncTimer = null;
var _dirtyKeys = {};

async function _cloudPull() {
  if (!_CLOUD_ON) return;
  try {
    var uid = localStorage.getItem('forum_uid');
    var res = await db.from('toolbox_data').select('key,value').eq('user_id', uid);
    if (res.error || !res.data) return;
    res.data.forEach(function (row) {
      _mem[row.key] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
    });
  } catch (e) { console.warn('云端数据拉取失败', e); }
}

async function _cloudPush() {
  if (!_CLOUD_ON) return;
  var keys = Object.keys(_dirtyKeys);
  _dirtyKeys = {};
  if (!keys.length) return;
  var uid = localStorage.getItem('forum_uid');
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    try {
      if (_mem.hasOwnProperty(key) && _mem[key] !== null && _mem[key] !== undefined) {
        var r = await db.from('toolbox_data').upsert({ user_id: uid, key: key, value: _mem[key] });
        if (r.error) console.warn('云端同步失败:', key, r.error.message);
      } else {
        await db.from('toolbox_data').delete().eq('user_id', uid).eq('key', key);
      }
    } catch (e) { console.warn('云端同步异常', key, e); }
  }
}

function _schedulePush(key) {
  if (_isLocalOnly(key)) return;
  _dirtyKeys[key] = 1;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(_cloudPush, 1200);
}

// 注入式加载时，ensureToolbox 等待此 promise 完成后再渲染界面
if (typeof window !== 'undefined') {
  window.__TOOLBOX_SYNC__ = (async function(){ try { await _cloudPull(); } catch (e) {} })();
}

// ---------- 统一存储接口（与 localStorage 兼容的同步接口） ----------
var storage = {
  getItem: function(key) {
    if (_isLocalOnly(key)) {
      try { return localStorage.getItem('qqy_' + _currentUserKey() + '_' + key); } catch (e) { return null; }
    }
    return _mem.hasOwnProperty(key) ? _mem[key] : null;
  },
  setItem: function(key, value) {
    var str = String(value);
    if (_isLocalOnly(key)) {
      try { localStorage.setItem('qqy_' + _currentUserKey() + '_' + key, str); } catch (e) {}
      return;
    }
    _mem[key] = str;
    _schedulePush(key);
  },
  removeItem: function(key) {
    if (_isLocalOnly(key)) {
      try { localStorage.removeItem('qqy_' + _currentUserKey() + '_' + key); } catch (e) {}
      return;
    }
    delete _mem[key];
    _schedulePush(key);
  },
  clear: function() {
    // 只清当前用户的数据（云端 + 内存）
    Object.keys(_mem).forEach(function(k) { delete _mem[k]; });
    if (_CLOUD_ON) {
      _mem['__clear_all__'] = '1'; delete _mem['__clear_all__'];
      var uid = localStorage.getItem('forum_uid');
      db.from('toolbox_data').delete().eq('user_id', uid).then(function(){}, function(){});
    }
  },
  key: function(i) {
    var keys = Object.keys(_mem);
    return keys[i] || null;
  },
  get length() { return Object.keys(_mem).length; }
};
