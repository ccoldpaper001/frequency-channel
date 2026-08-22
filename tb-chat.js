// ==============================
// tb-chat.js - AI 对话（持续聊天工作流）
// - 使用用户自己在「设置API」里配置的 API
// - 可选择提示词数据库中的预设作为系统提示词
// - 勾选「记入记忆」时，对话同步写入记忆管理
// - 聊天记录按用户保存（storage 已做账号隔离与云同步）
// ==============================

var chatHistory = [];
try { chatHistory = JSON.parse(storage.getItem('qqy_chat_history') || '[]'); } catch (e) { chatHistory = []; }

function chatSave() {
  if (chatHistory.length > 100) chatHistory = chatHistory.slice(-100);
  storage.setItem('qqy_chat_history', JSON.stringify(chatHistory));
}

// 渲染预设下拉框（来自提示词数据库；排除记忆总结/系统前缀/内部模板类）
function renderChatPresets() {
  var sel = document.getElementById('chatPreset');
  if (!sel) return;
  var excluded = { 'memory-summary': 1, 'memory-prefix': 1, 'ai-template': 1 };
  var cur = storage.getItem('qqy_chat_preset') || '';
  var html = '<option value="">（不用预设提示词）</option>';
  promptDB.forEach(function (cp) {
    if (excluded[cp.type]) return;
    html += '<option value="' + escH(cp.name) + '"' + (cp.name === cur ? ' selected' : '') + '>' + escH(cp.name) + '</option>';
  });
  sel.innerHTML = html;
  sel.onchange = function () { storage.setItem('qqy_chat_preset', sel.value); };
}

function currentChatSystemPrompt() {
  var name = document.getElementById('chatPreset') ? document.getElementById('chatPreset').value : '';
  if (!name) return '';
  var cp = promptDB.find(function (p) { return p.name === name; });
  return cp ? (cp.prompt || '') : '';
}

function renderChatMessages() {
  var box = document.getElementById('chatMessages');
  if (!box) return;
  if (!chatHistory.length) {
    box.innerHTML = '<div class="mem-empty">开始一段新对话吧。发送的消息会使用你在「设置API」里配置的模型。</div>';
    return;
  }
  box.innerHTML = chatHistory.map(function (m) {
    return '<div class="chat-msg ' + m.role + '"><div class="chat-bubble">' + escH(m.content).replace(/\n/g, '<br>') + '</div></div>';
  }).join('');
  box.scrollTop = box.scrollHeight;
}

async function sendChatMessage() {
  var input = document.getElementById('chatInput');
  var status = document.getElementById('chatStatus');
  var text = input.value.trim();
  if (!text) return;
  if (!akUrl || !ak) { alert('请先点击「设置API」配置 API 地址和 Key'); return; }

  input.value = '';
  chatHistory.push({ role: 'user', content: text });
  renderChatMessages();
  chatSave();
  if (document.getElementById('chatMemory') && document.getElementById('chatMemory').checked) addMemory('user', text);

  status.textContent = '正在思考…';
  var msgs = [];
  var sys = currentChatSystemPrompt();
  if (sys) msgs.push({ role: 'system', content: sys });
  chatHistory.slice(-20).forEach(function (m) { msgs.push({ role: m.role, content: m.content }); });

  try {
    var res = await fetch(buildApiUrl(akUrl, '/chat/completions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ak },
      body: JSON.stringify({ model: akModel || 'gpt-4o-mini', messages: msgs })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '(空回复)';
    status.textContent = '';
    chatHistory.push({ role: 'assistant', content: reply });
    chatSave();
    renderChatMessages();
    if (document.getElementById('chatMemory') && document.getElementById('chatMemory').checked) addMemory('assistant', reply);
  } catch (err) {
    status.textContent = '请求失败：' + err.message + '（详见报错日志）';
    logAiError('AI对话', err.message, getApiSnapshot(text));
  }
}

function initChatPage() {
  renderChatPresets();
  renderChatMessages();
  var input = document.getElementById('chatInput');
  var send = document.getElementById('chatSend');
  if (send) send.onclick = sendChatMessage;
  if (input) input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendChatMessage(); }
  });
  var clear = document.getElementById('chatClear');
  if (clear) clear.onclick = function () {
    if (!confirm('确定清空当前对话记录吗？')) return;
    chatHistory = []; chatSave(); renderChatMessages();
  };
}

// 工具箱加载完成后立即初始化（页面结构已内联在论坛 DOM 中）
initChatPage();
