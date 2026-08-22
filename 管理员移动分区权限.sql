-- 管理员可以修改帖子（移动分区）的权限
-- 使用方法：Supabase -> SQL Editor -> 粘贴 -> Run
-- （管理员删除任何帖子的权限在之前的升级脚本里已经配好，无需重复执行）

drop policy if exists "管理员可修改帖子" on public.posts;
create policy "管理员可修改帖子" on public.posts for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);
