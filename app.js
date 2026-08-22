// 论坛逻辑：验证码登录 / 个人资料(头像+昵称) / 分区 / 管理员

let currentUser = null;     // auth 用户
let myProfile = null;       // profiles 表里我的资料
let categories = [];        // 所有分区
let categoriesCache = null; // 分区缓存（减少查询）
let categoriesCacheAt = 0;
let avatarMapCache = null;  // 用户头像缓存
let avatarMapCacheAt = 0;
let currentFilter = 0;      // 当前选中的分区（0=全部）
let searchKeyword = "";     // 搜索关键词
let lastPosts = [];         // 最近一次加载的帖子（供编辑时取数据）
let editingPostId = null;   // 正在编辑的帖子 id（null=发新帖）

// 分区文件夹图标（侧边栏/标签共用）
const folderSvg = '<svg class="icon-sm" viewBox="0 0 48 48"><path d="M5 10h14l4 6h20v26H5V10z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
const closeSvg = '<svg viewBox="0 0 48 48"><path d="M10 10l28 28M38 10L10 38" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>';
const trashSvg = '<svg viewBox="0 0 48 48"><path d="M8 12h32M19 12V6h10v6M12 12l3 32h18l3-32M19 22v12M29 22v12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const moveSvg = '<svg viewBox="0 0 48 48"><path d="M18 8l-8 8 8 8M10 16h20a8 8 0 018 8v8M30 40l8-8-8-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const pinSvg = '<svg viewBox="0 0 48 48"><path d="M32 6l10 10-5 5-2.5-2.5L26 27l1.5 9-4.5 4.5L11.5 29 5 41l2-2 12-6.5-11.5-11.5L12 16.5l9 1.5 8.5-8.5L27 7z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
const editSvg = '<svg viewBox="0 0 48 48"><path d="M8 40h6L38 16l-6-6L8 34v6zM33 9l6 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const defaultAvatar = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"><rect width="72" height="72" fill="#c7d2fe"/><circle cx="36" cy="28" r="12" fill="#fff"/><path d="M14 64c0-13 10-20 22-20s22 7 22 20" fill="#fff"/></svg>'
);

// ---------- 页面加载 ----------
window.addEventListener("DOMContentLoaded", async () => {
  const loadStart = Date.now();
  const loadingText = document.getElementById("loading-text");

  // 第一步：登录状态 + 用户资料
  if (loadingText) loadingText.textContent = "正在检查登录状态…";
  const { data: { user } } = await db.auth.getUser();
  if (user) await afterLogin(user);

  // 第二步：并行加载帖子数据和整个工具箱模块（已登录时），
  // 全部完成后才撤下加载页——用户看到界面时一切就绪，不会经历加载卡顿
  if (loadingText) loadingText.textContent = "正在加载全部模块…";
  const tasks = [loadPosts()];
  if (user) tasks.push(ensureToolbox(null));
  await Promise.all(tasks);

  if (loadingText) loadingText.textContent = "即将就绪…";
  const wait = Math.max(0, 400 - (Date.now() - loadStart)); // 最少 400ms，避免一闪而过
  setTimeout(() => {
    const ls = document.getElementById("loading-screen");
    if (ls) { ls.classList.add("hidden"); setTimeout(() => ls.remove(), 400); }
  }, wait);

  // 标签切换：登录 / 注册
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("form-login").style.display = tab.dataset.tab === "login" ? "flex" : "none";
      document.getElementById("form-register").style.display = tab.dataset.tab === "register" ? "flex" : "none";
    });
  });

  document.getElementById("form-login").addEventListener("submit", login);
  document.getElementById("form-register").addEventListener("submit", register);
  document.getElementById("btn-logout").addEventListener("click", logout);

  // 侧边栏折叠/展开（桌面记住状态；手机端每次打开默认收窄成图标条）
  if (localStorage.getItem("forum_sidebar_collapsed") === "1" || window.innerWidth <= 640) {
    document.body.classList.add("side-collapsed");
  }
  document.getElementById("btn-side-toggle").addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("side-collapsed");
    localStorage.setItem("forum_sidebar_collapsed", collapsed ? "1" : "0");
  });

  // 关键词搜索（输入停顿 300 毫秒后自动搜索）
  let searchTimer = null;
  document.getElementById("search-keyword").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchKeyword = e.target.value.trim();
      loadPosts();
    }, 300);
  });
  document.getElementById("btn-post").addEventListener("click", createPost);
  document.getElementById("btn-new-post").addEventListener("click", () => { resetPostForm(); showPostPage(); });
  document.getElementById("btn-back-list").addEventListener("click", showListView);

  // AI 工具导航：点击后按需把工具箱加载进页面 DOM 并切换功能页
  document.querySelectorAll("#ai-nav .cat-item").forEach(item => {
    item.addEventListener("click", () => {
      if (!requireLogin()) return;
      showToolbox();
      document.querySelectorAll("#ai-nav .cat-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      ensureToolbox(item.dataset.page);
    });
  });
  document.getElementById("btn-add-category").addEventListener("click", addCategory);
  document.getElementById("nav-presets").addEventListener("click", () => { showPresetsView(); loadPresets(); });
  document.getElementById("nav-selpack").addEventListener("click", () => { showSelpackView(); loadSelpacks(); });
  document.getElementById("nav-apiset").addEventListener("click", () => {
    if (!requireLogin()) return;
    showToolbox();
    ensureToolbox(null).then(() => {
      if (typeof openApiModal === "function") openApiModal();
    });
  });
  document.getElementById("btn-publish-preset").addEventListener("click", publishPreset);

  // 个人资料弹窗
  document.getElementById("btn-profile").addEventListener("click", openProfileModal);
  document.getElementById("btn-close-modal").addEventListener("click", closeProfileModal);
  document.getElementById("avatar-file").addEventListener("change", uploadAvatar);
  document.getElementById("btn-save-profile").addEventListener("click", saveNickname);
});

// ---------- 密码登录 / 注册 ----------
async function login(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showMsg("login-msg", "登录失败：" + error.message, true);
  showMsg("login-msg", "登录成功！", false);
  await afterLogin(data.user);
  loadPosts();
}

async function register(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const nickname = document.getElementById("reg-nickname").value.trim();

  const { data, error } = await db.auth.signUp({
    email, password,
    options: { data: { nickname } }
  });
  if (error) return showMsg("reg-msg", "注册失败：" + error.message, true);

  // 若 Supabase 开了邮箱验证，需先去邮箱点确认链接
  if (data.user && !data.session) {
    showMsg("reg-msg", "注册成功！请到邮箱点击确认链接后再登录。", false);
  } else {
    showMsg("reg-msg", "注册成功！", false);
    await afterLogin(data.user);
    loadPosts();
  }
}

async function logout() {
  await db.auth.signOut();
  document.body.classList.remove("logged-in");
  localStorage.removeItem("forum_uid");
  currentUser = null; myProfile = null;
  document.getElementById("user-bar").style.display = "none";
  document.getElementById("auth-box").style.display = "block";
  document.getElementById("post-page").style.display = "none";
  document.getElementById("btn-new-post").style.display = "none";
  document.getElementById("admin-box").style.display = "none";
  document.getElementById("list-view").style.display = "block";
  loadPosts();
}

// ---------- 登录后的初始化 ----------
async function afterLogin(user) {
  currentUser = user;
  document.getElementById("auth-box").style.display = "none";
  document.getElementById("btn-new-post").style.display = "flex";
  document.getElementById("user-bar").style.display = "flex";

  // 读取我的资料（触发器会在首次注册时自动创建）
  const { data: profiles } = await db.from("profiles").select("*").eq("id", user.id).single();
  myProfile = profiles;
  if (!myProfile) {
    // 兜底：触发器没创建时手动插入
    await db.from("profiles").insert({
      id: user.id,
      email: user.email,
      nickname: user.user_metadata?.nickname || user.email.split("@")[0]
    });
    const { data: p2 } = await db.from("profiles").select("*").eq("id", user.id).single();
    myProfile = p2;
  }

  refreshTopBar();
  document.body.classList.add("logged-in");
  if (myProfile?.is_admin) document.getElementById("admin-box").style.display = "block";

  // 工具箱存储按此隔离各用户数据（同一页面内实时读取）
  localStorage.setItem("forum_uid", user.id);
}

function refreshTopBar() {
  document.getElementById("user-nickname").textContent = myProfile?.nickname || currentUser.email;
  document.getElementById("user-avatar").src = myProfile?.avatar_url || defaultAvatar;
  document.getElementById("admin-badge").style.display = myProfile?.is_admin ? "inline-block" : "none";
}

// ---------- 个人资料 ----------
function openProfileModal() {
  document.getElementById("modal-avatar").src = myProfile?.avatar_url || defaultAvatar;
  document.getElementById("modal-nickname").value = myProfile?.nickname || "";
  document.getElementById("profile-msg").textContent = "";
  document.getElementById("profile-modal").style.display = "flex";
}
function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}

async function uploadAvatar() {
  const file = document.getElementById("avatar-file").files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return showMsg("profile-msg", "图片不能超过 2MB", true);

  const ext = file.name.split(".").pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;

  showMsg("profile-msg", "上传中...", false);
  const { error: upErr } = await db.storage.from("avatars").upload(path, file, { upsert: true });
  if (upErr) return showMsg("profile-msg", "上传失败：" + upErr.message, true);

  const { data } = db.storage.from("avatars").getPublicUrl(path);
  const { error: updErr } = await db.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", currentUser.id);
  if (updErr) return showMsg("profile-msg", "保存失败：" + updErr.message, true);

  myProfile.avatar_url = data.publicUrl;
  avatarMapCache = null; // 头像变了，清空缓存
  document.getElementById("modal-avatar").src = data.publicUrl;
  refreshTopBar();
  showMsg("profile-msg", "头像已更新！", false);
  loadPosts();
}

async function saveNickname() {
  const nickname = document.getElementById("modal-nickname").value.trim();
  if (!nickname) return showMsg("profile-msg", "昵称不能为空", true);

  const { error } = await db.from("profiles").update({ nickname }).eq("id", currentUser.id);
  if (error) return showMsg("profile-msg", "保存失败：" + error.message, true);

  myProfile.nickname = nickname;
  refreshTopBar();
  showMsg("profile-msg", "保存成功！", false);
  loadPosts();
}

// ---------- 管理员：分区管理 ----------
async function addCategory() {
  const name = document.getElementById("new-category").value.trim();
  if (!name) return showMsg("admin-msg", "请填写分区名称", true);

  const { error } = await db.from("categories").insert({ name });
  if (error) return showMsg("admin-msg", "创建失败：" + error.message, true);
  document.getElementById("new-category").value = "";
  showMsg("admin-msg", "分区创建成功！", false);
  loadCategories(true);
}

async function deleteCategory(id) {
  if (!await pageConfirm("删除分区后，该分区下的帖子也会被删除。确定删除？")) return;
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return showMsg("admin-msg", "删除失败（请先清空该分区的帖子）：" + error.message, true);
  loadCategories(true);
}

// ---------- AI 工具箱：按需直接注入页面 DOM（非 iframe） ----------
const TOOLBOX_SCRIPTS = ["tb-svg-icons.js","tb-config.js","tb-utils.js","tb-editor.js","tb-ai.js","tb-memory.js","tb-api.js","tb-search.js","tb-prompt-db.js","tb-replace.js","tb-sidebar-sort.js","tb-htmledit.js","tb-svg-converter.js","tb-chat.js","tb-share.js","tb-app.js"].map(f => f + "?v=20260822-57");
let toolboxLoading = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.body.appendChild(s);
  });
}

async function ensureToolbox(page) {
  if (!toolboxLoading) {
    toolboxLoading = (async () => {
      window.__TOOLBOX_DIR__ = ""; // data.json 已在根目录
      // 先加载存储层，等待云端数据拉取完成后再渲染界面
      await loadScript("tb-storage.js?v=20260822-52");
      if (window.__TOOLBOX_SYNC__) { try { await window.__TOOLBOX_SYNC__; } catch (e) {} }
      for (const f of TOOLBOX_SCRIPTS) await loadScript(f);
    })();
    toolboxLoading.catch(() => { toolboxLoading = null; });
  }
  try { await toolboxLoading; } catch (e) { console.warn("工具箱加载失败", e); return; }
  if (page && typeof switchPage === "function") switchPage(page);
}

// ---------- 选择符广场 ----------
function showSelpackView() {
  if (!requireLogin()) return;
  document.getElementById("list-view").style.display = "none";
  document.getElementById("post-page").style.display = "none";
  document.getElementById("toolbox-view").style.display = "none";
  document.getElementById("presets-view").style.display = "none";
  document.getElementById("selpack-view").style.display = "block";
  document.body.classList.remove("tb-open");
  document.querySelectorAll("#category-nav .cat-item, #ai-nav .cat-item").forEach(i => i.classList.remove("active"));
  document.getElementById("nav-selpack").classList.add("active");
  window.scrollTo(0, 0);
}

async function loadSelpacks() {
  const { data: packs, error } = await db
    .from("selector_packs").select("*").order("created_at", { ascending: false });
  const box = document.getElementById("selpack-list");
  if (error) { box.innerHTML = `<p class="empty">加载失败：${escapeHtml(error.message)}</p>`; return; }
  if (!packs.length) { box.innerHTML = '<p class="empty">还没有人发布选择符，去 AI 工具 → 选择符管理 → 发布到论坛</p>'; return; }

  box.innerHTML = packs.map(p => {
    const mine = currentUser && currentUser.id === p.user_id;
    const count = (p.selectors || []).reduce((n, g) => n + (g.s || []).length, 0);
    const groups = (p.selectors || []).map(g => escapeHtml(g.g || "")).filter(Boolean).join("、");
    return `
    <div class="post">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${escapeHtml(p.author_nickname || "匿名")} · ${new Date(p.created_at).toLocaleString("zh-CN")} · ${count} 个选择符${groups ? " · " + groups : ""}</div>
      ${p.description ? `<p class="content">${escapeHtml(p.description)}</p>` : ""}
      <div class="post-actions">
        <button class="copy-preset import-selpack" data-pack='${encodeURIComponent(JSON.stringify(p.selectors || []))}'>导入到我的选择符</button>
        ${mine ? `<button class="del del-selpack" data-id="${p.id}">删除</button>` : ""}
      </div>
    </div>`;
  }).join("");

  box.querySelectorAll(".import-selpack").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!currentUser) return alert("请先登录");
      const selectors = JSON.parse(decodeURIComponent(btn.dataset.pack));
      await ensureToolbox(null); // 确保 tb-share.js 已加载
      importSelectorPack({ title: "导入集合", description: "", selectors });
    });
  });
  box.querySelectorAll(".del-selpack").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!await pageConfirm("确定删除这个选择符合集吗？")) return;
      const { error } = await db.from("selector_packs").delete().eq("id", btn.dataset.id);
      if (error) return alert("删除失败：" + error.message);
      loadSelpacks();
    });
  });
}

// ---------- 预设词广场 ----------
function showPresetsView() {
  if (!requireLogin()) return;
  document.getElementById("list-view").style.display = "none";
  document.getElementById("post-page").style.display = "none";
  document.getElementById("toolbox-view").style.display = "none";
  document.getElementById("selpack-view").style.display = "none";
  document.getElementById("presets-view").style.display = "block";
  document.body.classList.remove("tb-open");
  document.querySelectorAll("#category-nav .cat-item, #ai-nav .cat-item").forEach(i => i.classList.remove("active"));
  document.getElementById("nav-presets").classList.add("active");
  window.scrollTo(0, 0);
}

async function publishPreset() {
  if (!currentUser) return showMsg("preset-msg", "请先登录再上传", true);
  const title = document.getElementById("preset-title").value.trim();
  const content = document.getElementById("preset-content").value.trim();
  const is_public = document.querySelector('input[name="preset-vis"]:checked').value === "public";
  if (!title || !content) return showMsg("preset-msg", "名称和内容都不能为空", true);

  const { error } = await db.from("prompt_presets").insert({
    title, content, is_public,
    source_type: document.getElementById("preset-type")?.value || "ai-gen",
    user_id: currentUser.id,
    author_nickname: myProfile?.nickname || currentUser.email
  });
  if (error) return showMsg("preset-msg", "上传失败：" + error.message, true);
  document.getElementById("preset-title").value = "";
  document.getElementById("preset-content").value = "";
  showMsg("preset-msg", is_public ? "已公开到广场！" : "已保存（仅自己可见）", false);
  loadPresets();
}

async function loadPresets() {
  const { data: presets, error } = await db
    .from("prompt_presets").select("*").order("created_at", { ascending: false });
  const box = document.getElementById("presets-list");
  if (error) { box.innerHTML = `<p class="empty">加载失败：${escapeHtml(error.message)}</p>`; return; }
  if (!presets.length) { box.innerHTML = '<p class="empty">还没有预设词，来上传第一个吧</p>'; return; }

  const PRESET_TYPE_LABELS = { "ai-gen": "AI智能生成提示词", "ai-analyze": "AI分析组件提示词", "component": "组件提示词" };
  box.innerHTML = presets.map(p => {
    const mine = currentUser && currentUser.id === p.user_id;
    const typeName = PRESET_TYPE_LABELS[p.source_type] || PRESET_TYPE_LABELS["ai-gen"];
    return `
    <div class="post">
      <div class="post-head">
        <div>
          <h3>${escapeHtml(p.title)} <span class="cat-tag">${typeName}</span>${p.is_public ? "" : ' <span class="cat-tag">私有</span>'}</h3>
          <div class="meta">${escapeHtml(p.author_nickname || "匿名")} · ${new Date(p.created_at).toLocaleString("zh-CN")}</div>
        </div>
      </div>
      <p class="content collapsed">${escapeHtml(p.content)}</p>
      ${(p.content || "").length > 80 ? `<button class="expand-btn">展开全文</button>` : ""}
      <div class="post-actions">
        <button class="import-preset" data-title="${encodeURIComponent(p.title)}" data-content="${encodeURIComponent(p.content || "")}" data-author="${encodeURIComponent(p.author_nickname || "")}" data-type="${encodeURIComponent(p.source_type || "ai-gen")}">存入我的数据库</button>
        ${mine ? `<button class="toggle-preset" data-id="${p.id}" data-public="${p.is_public}">${p.is_public ? "转为私有" : "转为公开"}</button>
        <button class="del" data-id="${p.id}">删除</button>` : ""}
      </div>
    </div>`;
  }).join("");

  box.querySelectorAll(".expand-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.parentElement.querySelector(".content");
      btn.textContent = content.classList.toggle("collapsed") ? "展开全文" : "收起";
    });
  });
  // 一键把广场预设词存入自己账号的提示词数据库（云端，按账号隔离；类型与作者一致，同内容只允许存一次）
  box.querySelectorAll(".import-preset").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!requireLogin()) return;
      const title = decodeURIComponent(btn.dataset.title);
      const content = decodeURIComponent(btn.dataset.content);
      const type = decodeURIComponent(btn.dataset.type || "ai-gen") || "ai-gen";
      if (!content) return alert("这条预设词没有内容");
      try {
        await ensureToolbox(null);
        if (typeof promptDB === "undefined" || typeof savePromptDB !== "function") throw new Error("工具箱未加载完成");
        // 防重复：数据库里已有同样内容时拒绝再存，防止无限存入
        if (promptDB.some(p => (p.prompt || "") === content)) {
          btn.textContent = "已存入过";
          btn.disabled = true;
          return alert("你的数据库里已经有这条预设词，不能重复存入");
        }
        let name = title, n = 2;
        while (promptDB.some(p => p.name === name && p.type === type)) { name = title + " " + n; n++; }
        promptDB.push({
          name, type,
          note: "来自预设词广场 · " + (decodeURIComponent(btn.dataset.author) || "匿名"),
          prompt: content, api: "", builtin: false, is_public: false
        });
        savePromptDB();
        btn.textContent = "已存入我的数据库";
        btn.disabled = true;
        setTimeout(() => { btn.textContent = "存入我的数据库"; btn.disabled = false; }, 2000);
      } catch (e) { alert("存入失败：" + e.message); }
    });
  });
  box.querySelectorAll(".toggle-preset").forEach(btn => {
    btn.addEventListener("click", async () => {
      const { error } = await db.from("prompt_presets")
        .update({ is_public: btn.dataset.public !== "true" }).eq("id", btn.dataset.id);
      if (error) return alert("操作失败：" + error.message);
      loadPresets();
    });
  });
  box.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!await pageConfirm("确定删除这个预设词吗？")) return;
      const { error } = await db.from("prompt_presets").delete().eq("id", btn.dataset.id);
      if (error) return alert("删除失败：" + error.message);
      loadPresets();
    });
  });
}

// ---------- 网页内确认弹窗（替代浏览器原生 confirm） ----------
function pageConfirm(text) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirm-modal");
    const txt = document.getElementById("confirm-text");
    const ok = document.getElementById("confirm-ok");
    const cancel = document.getElementById("confirm-cancel");
    txt.textContent = text;
    modal.style.display = "flex";
    const done = val => {
      modal.style.display = "none";
      ok.onclick = cancel.onclick = null;
      resolve(val);
    };
    ok.onclick = () => done(true);
    cancel.onclick = () => done(false);
  });
}

// ---------- 登录门槛：未登录只能使用登录/注册 ----------
function requireLogin() {
  if (currentUser) return true;
  alert("请先注册或登录后使用此功能");
  showListView();
  document.getElementById("login-email").focus();
  return false;
}

// ---------- 页面切换：列表 / 发帖页 / 工具箱 ----------
function showPostPage() {
  if (!requireLogin()) return;
  document.getElementById("list-view").style.display = "none";
  document.getElementById("toolbox-view").style.display = "none";
  document.getElementById("presets-view").style.display = "none";
  document.getElementById("selpack-view").style.display = "none";
  document.getElementById("post-page").style.display = "block";
  document.getElementById("nav-presets").classList.remove("active");
  document.getElementById("nav-selpack").classList.remove("active");
  document.body.classList.remove("tb-open");
  window.scrollTo(0, 0);
}
function showToolbox() {
  document.getElementById("list-view").style.display = "none";
  document.getElementById("post-page").style.display = "none";
  document.getElementById("presets-view").style.display = "none";
  document.getElementById("selpack-view").style.display = "none";
  document.getElementById("nav-presets").classList.remove("active");
  document.getElementById("nav-selpack").classList.remove("active");
  document.getElementById("toolbox-view").style.display = "block";
  document.body.classList.add("tb-open"); // 放宽 main 的 860px 限宽，让工具卡片占满 90% 页面
  // 取消分区导航的高亮（AI 工具项自行管理高亮）
  document.querySelectorAll("#category-nav .cat-item").forEach(i => i.classList.remove("active"));
  window.scrollTo(0, 0);
}
function showListView() {
  document.getElementById("post-page").style.display = "none";
  document.getElementById("toolbox-view").style.display = "none";
  document.getElementById("presets-view").style.display = "none";
  document.getElementById("selpack-view").style.display = "none";
  document.getElementById("nav-presets").classList.remove("active");
  document.getElementById("nav-selpack").classList.remove("active");
  document.getElementById("list-view").style.display = "block";
  document.body.classList.remove("tb-open");
}

// ---------- 发帖 / 编辑帖子 ----------
const postBtnPublish = '<svg class="icon-sm" viewBox="0 0 48 48"><path d="M6 24l10-10 26 26M16 24l10-10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>发布';
const postBtnUpdate = '<svg class="icon-sm" viewBox="0 0 48 48"><path d="M8 40h6L38 16l-6-6L8 34v6zM33 9l6 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>覆盖发布';

function resetPostForm() {
  editingPostId = null;
  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  document.getElementById("post-page-title").textContent = "发表新帖";
  document.getElementById("btn-post").innerHTML = postBtnPublish;
  showMsg("post-msg", "", false);
}

// 编辑自己的帖子：填入原内容，保存时覆盖重新发布
function editPost(id) {
  const post = lastPosts.find(p => p.id === Number(id));
  if (!post) return;
  if (!currentUser || currentUser.id !== post.user_id) return alert("只能编辑自己的帖子");
  editingPostId = post.id;
  document.getElementById("post-title").value = post.title || "";
  document.getElementById("post-content").value = post.content || "";
  document.getElementById("post-page-title").textContent = "编辑帖子（保存后覆盖重新发布）";
  document.getElementById("btn-post").innerHTML = postBtnUpdate;
  showMsg("post-msg", "", false);
  showPostPage();
}

async function createPost() {
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const category_id = Number(document.getElementById("post-category").value) || null;
  if (!title) return showMsg("post-msg", "标题不能为空", true);
  if (!category_id) return showMsg("post-msg", "请选择分区", true);

  // 编辑模式：覆盖原帖并重新发布
  if (editingPostId) {
    const post = lastPosts.find(p => p.id === editingPostId);
    if (!post || !currentUser || currentUser.id !== post.user_id) {
      editingPostId = null;
      return showMsg("post-msg", "只能编辑自己的帖子", true);
    }
    const { error } = await db.from("posts").update({
      title, content, category_id,
      author_nickname: myProfile?.nickname || currentUser.email,
      updated_at: new Date().toISOString()
    }).eq("id", editingPostId);
    if (error) return showMsg("post-msg", (error.message || "").indexOf("does not exist") >= 0
      ? "需要先启用编辑功能：请在 Supabase 的 SQL Editor 里运行仓库中的「置顶与编辑帖子.sql」"
      : "覆盖发布失败：" + error.message, true);
    resetPostForm();
    showMsg("post-msg", "已覆盖重新发布！", false);
    showListView();
    loadPosts();
    return;
  }

  const { error } = await db.from("posts").insert({
    title, content, category_id,
    user_id: currentUser.id,
    author_nickname: myProfile?.nickname || currentUser.email
  });
  if (error) return showMsg("post-msg", "发布失败：" + error.message, true);

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  showMsg("post-msg", "发布成功！", false);
  showListView();
  loadPosts();
}

// ---------- 数据加载 ----------
async function loadCategories(force) {
  // 性能：分区列表缓存 60 秒，避免每次点击/搜索都重新查库并重建侧边栏
  if (!force && categoriesCache && Date.now() - categoriesCacheAt < 60000) {
    renderCategoriesNav();
    return;
  }
  const { data } = await db.from("categories").select("*").order("id");
  categories = data || [];
  categoriesCache = JSON.stringify(categories);
  categoriesCacheAt = Date.now();
  renderCategoriesNav();
}

function renderCategoriesNav() {

  // 发帖选择分区
  const selPost = document.getElementById("post-category");
  selPost.innerHTML = '<option value="">选择分区</option>' +
    categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  // 侧边栏分区导航
  const nav = document.getElementById("category-nav");
  nav.innerHTML =
    `<a class="cat-item ${currentFilter === 0 ? "active" : ""}" data-id="0">${folderSvg}全部</a>` +
    categories.map(c =>
      `<a class="cat-item ${currentFilter === c.id ? "active" : ""}" data-id="${c.id}">${folderSvg}${escapeHtml(c.name)}</a>`
    ).join("");
  nav.querySelectorAll(".cat-item").forEach(item => {
    item.addEventListener("click", () => {
      currentFilter = Number(item.dataset.id);
      document.getElementById("toolbox-view").style.display = "none";
      document.getElementById("presets-view").style.display = "none";
      document.getElementById("selpack-view").style.display = "none";
      document.getElementById("list-view").style.display = "block";
      document.getElementById("nav-presets").classList.remove("active");
      document.getElementById("nav-selpack").classList.remove("active");
      document.body.classList.remove("tb-open");
      document.querySelectorAll("#ai-nav .cat-item").forEach(i => i.classList.remove("active"));
      nav.querySelectorAll(".cat-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      loadPosts();
    });
  });

  // 管理员面板里的分区标签
  if (myProfile?.is_admin) {
    document.getElementById("category-manage").innerHTML = categories.map(c =>
      `<span class="cat-tag">${escapeHtml(c.name)}<button data-id="${c.id}" class="cat-del" title="删除分区">${closeSvg}</button></span>`
    ).join("") || '<span class="tip">还没有分区</span>';
    document.querySelectorAll(".cat-del").forEach(b =>
      b.addEventListener("click", () => deleteCategory(Number(b.dataset.id))));
  }
}

async function loadPosts() {
  await loadCategories();

  const filterId = currentFilter;
  let query = db.from("posts").select("*, categories(name)").order("created_at", { ascending: false });
  if (filterId > 0) query = query.eq("category_id", filterId);
  if (searchKeyword) {
    const kw = searchKeyword.replace(/[,()]/g, " "); // 防止关键词破坏查询语法
    query = query.or(`title.ilike.%${kw}%,content.ilike.%${kw}%`);
  }

  // 单独取所有用户资料（缓存 60 秒），用 user_id 对应头像
  let avatarMap;
  if (avatarMapCache && Date.now() - avatarMapCacheAt < 60000) {
    avatarMap = avatarMapCache;
  } else {
    const { data: allProfiles } = await db.from("profiles").select("id, avatar_url");
    avatarMap = {};
    (allProfiles || []).forEach(p => avatarMap[p.id] = p.avatar_url);
    avatarMapCache = avatarMap;
    avatarMapCacheAt = Date.now();
  }

  const { data: posts, error } = await query;
  const box = document.getElementById("posts");
  if (error) { box.innerHTML = `<p class="empty">加载失败：${error.message}</p>`; return; }
  if (!posts.length) { box.innerHTML = '<p class="empty">这个分区还没有帖子</p>'; return; }
  // 置顶帖排最前（前端排序，数据库没跑置顶SQL时也能正常加载）
  posts.sort((a, b) => ((b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)));
  lastPosts = posts;

  box.innerHTML = posts.map(p => {
    const catName = p.categories?.name;
    const isMine = currentUser && currentUser.id === p.user_id;
    const canDelete = isMine || myProfile?.is_admin;
    return `
    <div class="post">
      <div class="post-head">
        <img class="avatar-small" src="${avatarMap[p.user_id] || defaultAvatar}" alt="" />
        <div>
          <h3>${p.is_pinned ? '<span class="pin-tag">置顶</span> ' : ""}${escapeHtml(p.title)}</h3>
          <div class="meta">
            ${escapeHtml(p.author_nickname || "匿名")} ·
            ${new Date(p.created_at).toLocaleString("zh-CN")}
            ${p.updated_at ? ` · <span class="edited-tag">已编辑</span>` : ""}
            ${catName ? ` · <span class="cat-tag">${escapeHtml(catName)}</span>` : ""}
          </div>
        </div>
      </div>
      <p class="content collapsed">${escapeHtml(p.content || "")}</p>
      ${(p.content || "").length > 80 ? `<button class="expand-btn" data-id="${p.id}">展开全文</button>` : ""}
      <div class="post-actions">
        ${isMine ? `<button class="act-btn" data-id="${p.id}">${editSvg}编辑</button>` : ""}
        ${myProfile?.is_admin ? `<button class="act-btn" data-id="${p.id}" data-pinned="${p.is_pinned ? "1" : ""}">${pinSvg}${p.is_pinned ? "取消置顶" : "置顶"}</button>` : ""}
        ${canDelete ? `<button class="del" data-id="${p.id}">${trashSvg}删除</button>` : ""}
        ${myProfile?.is_admin && categories.length ? `
          <span class="move-wrap">${moveSvg}移动到
            <select class="move-cat" data-id="${p.id}">
              ${categories.map(c => `<option value="${c.id}" ${c.id === p.category_id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
            </select>
          </span>` : ""}
      </div>
    </div>`;
  }).join("");

  box.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!await pageConfirm("确定删除这篇帖子吗？")) return;
      const { error } = await db.from("posts").delete().eq("id", btn.dataset.id);
      if (error) return alert("删除失败：" + error.message);
      loadPosts();
    });
  });

  // 编辑自己的帖子
  box.querySelectorAll(".post-actions .act-btn[data-id]").forEach(btn => {
    if (btn.dataset.pinned !== undefined) return; // 置顶按钮单独处理
    btn.addEventListener("click", () => {
      if (!requireLogin()) return;
      editPost(btn.dataset.id);
    });
  });

  // 管理员：置顶/取消置顶
  box.querySelectorAll(".post-actions .act-btn[data-pinned]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const post = lastPosts.find(p => p.id === Number(btn.dataset.id));
      if (!post) return;
      const next = !post.is_pinned;
      if (!await pageConfirm(next ? "确定把这篇帖子置顶吗？" : "确定取消置顶吗？")) return;
      const { error } = await db.from("posts").update({ is_pinned: next }).eq("id", btn.dataset.id);
      if (error) return alert((error.message || "").indexOf("does not exist") >= 0
        ? "需要先启用置顶功能：请在 Supabase 的 SQL Editor 里运行仓库中的「置顶与编辑帖子.sql」"
        : "操作失败：" + error.message);
      loadPosts();
    });
  });

  // 帖子内容展开/收起
  box.querySelectorAll(".expand-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.parentElement.querySelector(".content");
      const isCollapsed = content.classList.toggle("collapsed");
      btn.textContent = isCollapsed ? "展开全文" : "收起";
    });
  });

  // 管理员：移动帖子分区
  box.querySelectorAll(".move-cat").forEach(sel => {
    sel.addEventListener("change", async () => {
      const newCat = Number(sel.value);
      const postId = sel.dataset.id;
      const catName = categories.find(c => c.id === newCat)?.name || "";
      if (!await pageConfirm(`确定把这篇帖子移动到「${catName}」分区吗？`)) { loadPosts(); return; }
      const { error } = await db.from("posts").update({ category_id: newCat }).eq("id", postId);
      if (error) return alert("移动失败：" + error.message);
      loadPosts();
    });
  });
}

// ---------- 工具 ----------
function showMsg(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "ok");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
