// ========== Supabase 配置 ==========
// 1. 打开 https://supabase.com 注册并新建一个项目（New Project）
// 2. 进入项目后，点左侧齿轮 ⚙️ Project Settings -> API
// 3. 复制 Project URL 和 anon public key，填到下面两个引号里
const SUPABASE_URL = "https://nlmvylqegqggiigiyxqk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kHbL68bxMbtgAjx9SODzAw_azWV60U1";

// 全局使用的 supabase 客户端（不要改动下面这行）
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
