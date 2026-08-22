-- AI 工具箱云端数据表（每个账号的数据互相隔离）
-- 使用方法：Supabase -> SQL Editor -> 粘贴全部 -> Run

create table if not exists public.toolbox_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

alter table public.toolbox_data enable row level security;

-- 只能读自己的数据
drop policy if exists "工具箱数据仅本人可读" on public.toolbox_data;
create policy "工具箱数据仅本人可读" on public.toolbox_data
  for select using (auth.uid() = user_id);

-- 只能写自己的数据
drop policy if exists "工具箱数据仅本人可写" on public.toolbox_data;
create policy "工具箱数据仅本人可写" on public.toolbox_data
  for insert with check (auth.uid() = user_id);

-- 只能改自己的数据
drop policy if exists "工具箱数据仅本人可改" on public.toolbox_data;
create policy "工具箱数据仅本人可改" on public.toolbox_data
  for update using (auth.uid() = user_id);

-- 只能删自己的数据
drop policy if exists "工具箱数据仅本人可删" on public.toolbox_data;
create policy "工具箱数据仅本人可删" on public.toolbox_data
  for delete using (auth.uid() = user_id);
