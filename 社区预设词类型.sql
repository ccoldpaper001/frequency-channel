-- ============================================================
-- 预设词类型字段：存入数据库时保留作者原始类型
-- 使用方法：Supabase -> SQL Editor -> 粘贴全部 -> Run
-- 不会删除任何数据，可重复执行
-- ============================================================

alter table public.prompt_presets
  add column if not exists source_type text not null default 'ai-gen';
