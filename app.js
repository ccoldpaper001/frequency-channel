// 论坛逻辑：验证码登录 / 个人资料(头像+昵称) / 分区 / 管理员

let currentUser = null;     // auth 用户
let myProfile = null;       // profiles 表里我的资料
let categories = [];        // 所有分区

const defaultAvatar = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="#c7d2fe"/><text x="36" y="45" text-anchor="middle" font-size="32" fill="#fff">👤</text></svg>'
);

// ---------- 页面加载 ----------
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await db.auth.getUser();
  if (user) await afterLogin(user);

  document.getElementById("btn-send-code").addEventListener("click", sendCode);
  document.getElementById("btn-verify").addEventListener("click", verifyCode);
  document.getElementById("btn-logout").addEventListener("click", logout);
  document.getElementById("btn-post").addEventListener("click", createPost);
  document.getElementById("btn-add-category").addEventListener("click", addCategory);
  document.getElementById("filter-category").addEventListener("change", loadPosts);

  // 个人资料弹窗
  document.getElementById("btn-profile").addEventListener("click", openProfileModal);
  document.getElementById("btn-close-modal").addEventListener("click", closeProfileModal);
  document.getElementById("avatar-file").addEventListener("change", uploadAvatar);
  document.getElementById("btn-save-profile").addEventListener("click", saveNickname);
});

// ---------- 验证码登录 ----------
async function sendCode() {
  const email = document.getElementById("otp-email").value.trim();
  if (!email) return showMsg("auth-msg", "请先填写邮箱", true);

  const { error } = await db.auth.signInWithOtp({
    email,
    options: {
      shouldCreateNewUser: true,
      data: { nickname: document.getElementById("otp-nickname").value.trim() || email.split("@")[0] }
    }
  });
  if (error) return showMsg("auth-msg", "发送失败：" + error.message, true);
  showMsg("auth-msg", "验证码已发送到你的邮箱，请查收（可能在垃圾邮件里）", false);
}

async function verifyCode() {
  const email = document.getElementById("otp-email").value.trim();
  const token = document.getElementById("otp-code").value.trim();
  if (!email || token.length !== 6) return showMsg("auth-msg", "请填写邮箱和6位验证码", true);

  const { data, error } = await db.auth.verifyOtp({ email, token, type: "email" });
  if (error) return showMsg("auth-msg", "验证失败：" + error.message, true);
  showMsg("auth-msg", "登录成功！", false);
  await afterLogin(data.user);
  loadPosts();
}

async function logout() {
  await db.auth.signOut();
  currentUser = null; myProfile = null;
  document.getElementById("user-bar").style.display = "none";
  document.getElementById("auth-box").style.display = "block";
  document.getElementById("post-box").style.display = "none";
  document.getElementById("admin-box").style.display = "none";
  loadPosts();
}

// ---------- 登录后的初始化 ----------
async function afterLogin(user) {
  currentUser = user;
  document.getElementById("auth-box").style.display = "none";
  document.getElementById("post-box").style.display = "block";
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
  if (myProfile?.is_admin) document.getElementById("admin-box").style.display = "block";
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
  loadCategories();
}

async function deleteCategory(id) {
  if (!confirm("删除分区后，该分区下的帖子也会被删除。确定删除？")) return;
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return showMsg("admin-msg", "删除失败（请先清空该分区的帖子）：" + error.message, true);
  loadCategories();
}

// ---------- 发帖 ----------
async function createPost() {
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const category_id = Number(document.getElementById("post-category").value) || null;
  if (!title) return showMsg("post-msg", "标题不能为空", true);
  if (!category_id) return showMsg("post-msg", "请选择分区", true);

  const { error } = await db.from("posts").insert({
    title, content, category_id,
    user_id: currentUser.id,
    author_nickname: myProfile?.nickname || currentUser.email
  });
  if (error) return showMsg("post-msg", "发布失败：" + error.message, true);

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  showMsg("post-msg", "发布成功！", false);
  loadPosts();
}

// ---------- 数据加载 ----------
async function loadCategories() {
  const { data } = await db.from("categories").select("*").order("id");
  categories = data || [];

  // 发帖选择分区
  const selPost = document.getElementById("post-category");
  selPost.innerHTML = '<option value="">选择分区</option>' +
    categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  // 筛选分区
  const selFilter = document.getElementById("filter-category");
  const cur = selFilter.value;
  selFilter.innerHTML = '<option value="0">全部分区</option>' +
    categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if (cur) selFilter.value = cur;

  // 管理员面板里的分区标签
  if (myProfile?.is_admin) {
    document.getElementById("category-manage").innerHTML = categories.map(c =>
      `<span class="cat-tag">${escapeHtml(c.name)}<button data-id="${c.id}" class="cat-del">✕</button></span>`
    ).join("") || '<span class="tip">还没有分区</span>';
    document.querySelectorAll(".cat-del").forEach(b =>
      b.addEventListener("click", () => deleteCategory(Number(b.dataset.id))));
  }
}

async function loadPosts() {
  await loadCategories();

  const filterId = Number(document.getElementById("filter-category").value);
  let query = db.from("posts").select("*, categories(name)").order("created_at", { ascending: false });
  if (filterId > 0) query = query.eq("category_id", filterId);

  // 单独取所有用户资料，用 user_id 对应头像
  const { data: allProfiles } = await db.from("profiles").select("id, avatar_url");
  const avatarMap = {};
  (allProfiles || []).forEach(p => avatarMap[p.id] = p.avatar_url);

  const { data: posts, error } = await query;
  const box = document.getElementById("posts");
  if (error) { box.innerHTML = `<p class="empty">加载失败：${error.message}</p>`; return; }
  if (!posts.length) { box.innerHTML = '<p class="empty">这个分区还没有帖子</p>'; return; }

  box.innerHTML = posts.map(p => {
    const catName = p.categories?.name;
    const isMine = currentUser && currentUser.id === p.user_id;
    const canDelete = isMine || myProfile?.is_admin;
    return `
    <div class="post">
      <div class="post-head">
        <img class="avatar-small" src="${avatarMap[p.user_id] || defaultAvatar}" alt="" />
        <div>
          <h3>${escapeHtml(p.title)}</h3>
          <div class="meta">
            ${escapeHtml(p.author_nickname || "匿名")} ·
            ${new Date(p.created_at).toLocaleString("zh-CN")}
            ${catName ? ` · <span class="cat-tag">${escapeHtml(catName)}</span>` : ""}
          </div>
        </div>
      </div>
      <p class="content">${escapeHtml(p.content || "")}</p>
      ${canDelete ? `<button class="del" data-id="${p.id}">删除</button>` : ""}
    </div>`;
  }).join("");

  box.querySelectorAll(".del").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定删除这篇帖子吗？")) return;
      const { error } = await db.from("posts").delete().eq("id", btn.dataset.id);
      if (error) return alert("删除失败：" + error.message);
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
