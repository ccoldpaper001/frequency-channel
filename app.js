// 论坛主要逻辑：登录 / 注册 / 发帖 / 帖子列表 / 删除自己的帖子

let currentUser = null;

// ---------- 页面加载 ----------
window.addEventListener("DOMContentLoaded", async () => {
  // 检查是否已登录
  const { data: { user } } = await db.auth.getUser();
  if (user) setUser(user);

  loadPosts();

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
  document.getElementById("btn-post").addEventListener("click", createPost);
});

// ---------- 登录状态切换 ----------
function setUser(user) {
  currentUser = user;
  document.getElementById("auth-box").style.display = "none";
  document.getElementById("post-box").style.display = "block";
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("btn-logout").style.display = "inline-block";
}

function clearUser() {
  currentUser = null;
  document.getElementById("auth-box").style.display = "block";
  document.getElementById("post-box").style.display = "none";
  document.getElementById("user-email").textContent = "";
  document.getElementById("btn-logout").style.display = "none";
}

function showMsg(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (isError ? "error" : "ok");
}

// ---------- 注册 ----------
async function login(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showMsg("login-msg", "登录失败：" + error.message, true);
  setUser(data.user);
  loadPosts();
}

// ---------- 登录 ----------
async function register(e) {
  e.preventDefault();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const nickname = document.getElementById("reg-nickname").value.trim();

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { nickname } } // 昵称存在用户的 metadata 里
  });
  if (error) return showMsg("reg-msg", "注册失败：" + error.message, true);

  // 如果 Supabase 开了邮箱验证，需要先去邮箱点确认链接
  if (data.user && !data.session) {
    showMsg("reg-msg", "注册成功！请到邮箱点击确认链接后再登录。", false);
  } else {
    setUser(data.user);
    loadPosts();
  }
}

// ---------- 退出 ----------
async function logout() {
  await db.auth.signOut();
  clearUser();
  loadPosts();
}

// ---------- 发帖 ----------
async function createPost() {
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  if (!title) return showMsg("post-msg", "标题不能为空", true);

  const nickname = currentUser.user_metadata?.nickname || currentUser.email;

  const { error } = await db.from("posts").insert({
    title,
    content,
    user_id: currentUser.id,
    author_nickname: nickname
  });
  if (error) return showMsg("post-msg", "发布失败：" + error.message, true);

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  showMsg("post-msg", "发布成功！", false);
  loadPosts();
}

// ---------- 帖子列表 ----------
async function loadPosts() {
  const { data: posts, error } = await db
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  const box = document.getElementById("posts");
  if (error) {
    box.innerHTML = `<p class="empty">加载失败：${error.message}</p>`;
    return;
  }
  if (!posts.length) {
    box.innerHTML = '<p class="empty">还没有帖子，来发第一帖吧！</p>';
    return;
  }

  box.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="meta">${escapeHtml(p.author_nickname || "匿名")} · ${new Date(p.created_at).toLocaleString("zh-CN")}</div>
      <p class="content">${escapeHtml(p.content || "")}</p>
      ${currentUser && currentUser.id === p.user_id ? `<button class="del" data-id="${p.id}">删除</button>` : ""}
    </div>
  `).join("");

  // 删除按钮（只能删除自己的帖子）
  box.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定删除这篇帖子吗？")) return;
      const { error } = await db.from("posts").delete().eq("id", btn.dataset.id);
      if (error) return alert("删除失败：" + error.message);
      loadPosts();
    });
  });
}

// 防止帖子内容里的 HTML 被浏览器执行（XSS 防护）
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
