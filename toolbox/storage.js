// ==============================
// storage.js - 统一存储接口
// - 本地：localStorage（按论坛用户键前缀隔离）
// - 云端：Supabase 表 toolbox_data（按账号隔离，跨设备同步）
// - qqy_api_* 开头的键（API 地址 / API Key 等敏感配置）只存本地浏览器，永不上传
// - 配额：总量超过 450MB 时按写入时间清除最早内容
// ==============================

var STORAGE_QUOTA_BYTES = 450 * 1024 * 1024;

// ---------- 用户隔离 ----------
function _currentUserKey() {
  try { return localStorage.getItem('forum_uid') || 'guest'; }
  catch (e) { return 'guest'; }
}
function _realKey(key) { return 'qqy_' + _currentUserKey() + '_' + key; }

// ---------- 配额管理 ----------
function _touchIndex(realKey) {
  var idx = {};
  try { idx = JSON.parse(localStorage.getItem('qqy_storage_index') || '{}'); } catch (e) { idx = {}; }
  idx[realKey] = Date.now();
  try { localStorage.setItem('qqy_storage_index', JSON.stringify(idx)); } catch (e) {}
}

function _totalBytes() {
  var total = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('qqy_') !== 0) continue;
      total += (k.length + (localStorage.getItem(k) || '').length) * 2;
    }
  } catch (e) {}
  return total;
}

function _enforceQuota(protectRealKey) {
  var guard = 0;
  while (_totalBytes() > STORAGE_QUOTA_BYTES && guard++ < 1000) {
    var idx = {};
    try { idx = JSON.parse(localStorage.getItem('qqy_storage_index') || '{}'); } catch (e) {}
    var oldestKey = null, oldestTime = Infinity;
    for (var k in idx) {
      if (k === protectRealKey) continue;
      if (idx[k] < oldestTime) { oldestTime = idx[k]; oldestKey = k; }
    }
    if (!oldestKey) {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k2 = localStorage.key(i);
          if (k2 && k2.indexOf('qqy_') === 0 && k2 !== 'qqy_storage_index' && k2 !== protectRealKey) { oldestKey = k2; break; }
        }
      } catch (e) {}
    }
    if (!oldestKey) break;
    delete idx[oldestKey];
    try {
      localStorage.removeItem(oldestKey);
      localStorage.setItem('qqy_storage_index', JSON.stringify(idx));
    } catch (e) { break; }
  }
}

// ---------- Supabase 云端同步 ----------
// 前提：宿主页面存在全局 db（Supabase 客户端）且用户已登录
var _CLOUD_ON = (typeof db !== 'undefined') && !!localStorage.getItem('forum_uid');
var _syncTimer = null;
var _dirtyKeys = {};

// 敏感键（API 配置）只在本地保存
function _isLocalOnly(key) { return key.indexOf('qqy_api_') === 0; }

async function _cloudPull() {
  if (!_CLOUD_ON) return;
  try {
    var uid = localStorage.getItem('forum_uid');
    var res = await db.from('toolbox_data').select('key,value').eq('user_id', uid);
    if (res.error || !res.data) return;
    res.data.forEach(function(row) {
      try { localStorage.setItem(_realKey(row.key), typeof row.value === 'string' ? row.value : JSON.stringify(row.value)); } catch (e) {}
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
      if (key === null) continue;
      var exists = localStorage.getItem(_realKey(key));
      if (exists === null) {
        await db.from('toolbox_data').delete().eq('user_id', uid).eq('key', key);
      } else {
        var r = await db.from('toolbox_data').upsert({
          user_id: uid, key: key, value: exists
        });
        if (r.error) console.warn('云端同步失败:', key, r.error.message);
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

// 页面注入式加载时，ensureToolbox 会等待此 promise 完成后再渲染界面
if (typeof window !== 'undefined') {
  window.__TOOLBOX_SYNC__ = _CLOUDPullSafe();
}
async function _CLOUDPullSafe() { try { await _cloudPull(); } catch (e) {} }

// ---------- 统一存储接口（与 localStorage 兼容的同步接口） ----------
var storage = {
  getItem: function(key) {
    try { return localStorage.getItem(_realKey(key)); } catch (e) { return null; }
  },
  setItem: function(key, value) {
    var rk = _realKey(key);
    try {
      localStorage.setItem(rk, String(value));
    } catch (e) {
      _enforceQuota(rk);
      try { localStorage.setItem(rk, String(value)); } catch (e2) { console.warn('存储失败', e2); return; }
    }
    _touchIndex(rk);
    _enforceQuota(rk);
    _schedulePush(key);
  },
  removeItem: function(key) {
    try { localStorage.removeItem(_realKey(key)); } catch (e) {}
    _schedulePush(key);
  },
  clear: function() {
    var prefix = 'qqy_' + _currentUserKey() + '_';
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) keys.push(k);
    }
    keys.forEach(function(k) { try { localStorage.removeItem(k); } catch (e) {} });
  },
  key: function(i) {
    var prefix = 'qqy_' + _currentUserKey() + '_';
    var keys = [];
    for (var j = 0; j < localStorage.length; j++) {
      var k = localStorage.key(j);
      if (k && k.indexOf(prefix) === 0) keys.push(k);
    }
    return keys[i] ? keys[i].slice(prefix.length) : null;
  },
  get length() {
    var prefix = 'qqy_' + _currentUserKey() + '_';
    var n = 0;
    for (var j = 0; j < localStorage.length; j++) {
      var k = localStorage.key(j);
      if (k && k.indexOf(prefix) === 0) n++;
    }
    return n;
  }
};
