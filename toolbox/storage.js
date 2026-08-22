// ==============================
// storage.js - 网页版统一存储接口
// - 底层使用 localStorage（本地 Python 服务版专用逻辑已移除）
// - 数据按论坛用户隔离：每个用户一套独立键前缀
// - 配额管理：总数据量超过 450MB 时自动清除最早写入的内容
// ==============================

// 配额上限（字节）
var STORAGE_QUOTA_BYTES = 450 * 1024 * 1024;

// ---------- 用户隔离 ----------
// 论坛登录后会把用户 ID 写入 localStorage（forum_uid）
function _currentUserKey() {
  try {
    return localStorage.getItem('forum_uid') || 'guest';
  } catch (e) { return 'guest'; }
}
function _realKey(key) {
  return 'qqy_' + _currentUserKey() + '_' + key;
}

// ---------- 配额管理 ----------
// 每个键记录最后写入时间，超配额时按时间从早到晚清除
function _touchIndex(realKey) {
  var idx = {};
  try { idx = JSON.parse(localStorage.getItem('qqy_storage_index') || '{}'); } catch (e) { idx = {}; }
  idx[realKey] = Date.now();
  localStorage.setItem('qqy_storage_index', JSON.stringify(idx));
}

function _totalBytes() {
  var total = 0;
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (!k || k.indexOf('qqy_') !== 0) continue;
    total += (k.length + (localStorage.getItem(k) || '').length) * 2; // UTF-16 每字符约 2 字节
  }
  return total;
}

// 超配额时清除最早的数据（索引键自身与当前用户的数据最后保留）
function _enforceQuota(protectRealKey) {
  var guard = 0;
  while (_totalBytes() > STORAGE_QUOTA_BYTES && guard++ < 1000) {
    var idx = {};
    try { idx = JSON.parse(localStorage.getItem('qqy_storage_index') || '{}'); } catch (e) {}
    var oldestKey = null, oldestTime = Infinity;
    // 先找有时间记录的最早键
    for (var k in idx) {
      if (k === protectRealKey) continue;
      if (idx[k] < oldestTime) { oldestTime = idx[k]; oldestKey = k; }
    }
    // 没有记录的键（旧数据）按 localStorage 内在顺序先清
    if (!oldestKey) {
      for (var i = 0; i < localStorage.length; i++) {
        var k2 = localStorage.key(i);
        if (k2 && k2.indexOf('qqy_') === 0 && k2 !== 'qqy_storage_index' && k2 !== protectRealKey) { oldestKey = k2; break; }
      }
    }
    if (!oldestKey) break;
    delete idx[oldestKey];
    localStorage.removeItem(oldestKey);
    localStorage.setItem('qqy_storage_index', JSON.stringify(idx));
  }
}

// ---------- 统一存储接口（与 localStorage 兼容的同步接口） ----------
// 对外键名不带前缀，内部自动映射；本站用户之间数据互相不可见
var storage = {
  getItem: function(key) {
    try { return localStorage.getItem(_realKey(key)); } catch (e) { return null; }
  },
  setItem: function(key, value) {
    var rk = _realKey(key);
    try {
      localStorage.setItem(rk, String(value));
    } catch (e) {
      // 浏览器自身配额不足：清除最早数据后重试
      _enforceQuota(rk);
      try { localStorage.setItem(rk, String(value)); } catch (e2) { console.warn('存储失败', e2); return; }
    }
    _touchIndex(rk);
    _enforceQuota(rk);
  },
  removeItem: function(key) {
    try { localStorage.removeItem(_realKey(key)); } catch (e) {}
  },
  clear: function() {
    // 只清当前用户的数据
    var prefix = 'qqy_' + _currentUserKey() + '_';
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) keys.push(k);
    }
    keys.forEach(function(k) { localStorage.removeItem(k); });
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
