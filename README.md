# 文字论坛（Supabase 版）

功能：邮箱验证码登录/注册（免密码）、发表帖子、分区（管理员管理）、
头像上传与昵称修改、管理员可删任何帖子。

## 文件说明
- `index.html` / `style.css` / `app.js` —— 前端代码
- `supabase-config.js` —— Supabase 连接配置（已填好）
- `升级数据库.sql` —— **本次升级需要在 SQL Editor 执行的脚本**

## 操作步骤

### 1. 执行升级脚本（必须）
打开 Supabase -> 左侧 **SQL Editor** -> New query，
把 `升级数据库.sql` 的全部内容粘贴进去点 **Run**。
（会重建 posts 表，旧帖会丢失）

### 2. 设置管理员（必须）
1. 打开网站，先用你的邮箱通过验证码登录一次（会自动注册）。
2. 回到 Supabase -> **SQL Editor**，执行（把邮箱换成你的）：
   ```sql
   update public.profiles set is_admin = true where email = '你的邮箱@example.com';
   ```
3. 刷新网站，右上角会出现"管理员"标签和管理员面板。

只有执行了这条 SQL 的那一个人是管理员——其他人永远无法自己变成管理员。

### 3. 运行网站
双击 `index.html`，或 `npx serve "D:\2026_8.22_网站项目"` 后访问 localhost。

## 验证码说明
- 登录页输入邮箱 -> 点"发送验证码" -> Supabase 会发一封含 6 位数字
  验证码的邮件（新邮箱会自动注册账号）。
- 免费版 Supabase 每小时只能发少量邮件，测试时别刷太快。
- 邮件可能在垃圾箱里；邮件内容/样式可在 Authentication -> Email Templates 修改。

## 权限说明（数据库层强制）
- 未登录：只能看帖
- 登录用户：发帖、删除**自己的**帖、修改**自己的**资料和头像
- 管理员：额外可创建/删除分区、删除**任何**帖子
