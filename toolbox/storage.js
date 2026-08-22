// ==============================
// storage.js - 统一存储接口（文件存储 + 内存缓存）
// 数据保存到 user-data.json，与浏览器无关
// ==============================

var _storageCache = {};
var _storageReady = false;
var _storageSaveTimer = null;
var _storageReadyCallbacks = [];

// 从文件加载数据（同步 XHR，确保初始化前数据就绪）
function storageInit(callback) {
  if (callback) _storageReadyCallbacks.push(callback);
  if (_storageReady) {
    _storageReadyCallbacks.forEach(function(cb) { try { cb(); } catch (e) {} });
    _storageReadyCallbacks = [];
    return;
  }
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/load-data', false);
    xhr.send(null);
    if (xhr.status === 200 || xhr.status === 0) {
      _storageCache = JSON.parse(xhr.responseText) || {};
    }
  } catch (e) {
    _storageCache = {};
  }
  _storageReady = true;
  _migrateLocalStorage();
  _storageReadyCallbacks.forEach(function(cb) { try { cb(); } catch (e) {} });
  _storageReadyCallbacks = [];
}

// 迁移旧的 localStorage 数据（仅首次，文件为空时）
function _migrateLocalStorage() {
  if (Object.keys(_storageCache).length > 0) return;
  var migrated = false;
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf('qqy_') === 0) {
      _storageCache[key] = localStorage.getItem(key);
      migrated = true;
    }
  }
  if (migrated) _saveToFile();
}

// 保存到文件（防抖 500ms）
function _saveToFile() {
  clearTimeout(_storageSaveTimer);
  _storageSaveTimer = setTimeout(function() {
    fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_storageCache)
    }).catch(function() {});
  }, 500);
}

// 统一存储接口（与 localStorage 兼容的同步接口）
var storage = {
  getItem: function(key) {
    return _storageCache.hasOwnProperty(key) ? _storageCache[key] : null;
  },
  setItem: function(key, value) {
    _storageCache[key] = String(value);
    _saveToFile();
  },
  removeItem: function(key) {
    delete _storageCache[key];
    _saveToFile();
  },
  clear: function() {
    _storageCache = {};
    _saveToFile();
  },
  key: function(i) {
    return Object.keys(_storageCache)[i] || null;
  },
  get length() {
    return Object.keys(_storageCache).length;
  }
};

// 初始化（在页面加载时自动执行）
storageInit();
