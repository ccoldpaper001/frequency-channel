-- ============================================================
-- 帖子置顶 + 编辑帖子功能
-- 使用方法：Supabase -> SQL Editor -> 粘贴全部 -> Run
-- 不会删除任何数据，可重复执行
-- ============================================================

-- 1. posts 表新增字段：置顶标记、最后编辑时间
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists updated_at timestamptz;

-- 2. 作者可以编辑自己的帖子（覆盖重新发布）
drop policy if exists "作者可编辑帖子" on public.posts;
create policy "作者可编辑帖子" on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. 管理员可以编辑任何帖子，并可以置顶/取消置顶
drop policy if exists "管理员可编辑任何帖子" on public.posts;
create policy "管理员可编辑任何帖子" on public.posts for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
