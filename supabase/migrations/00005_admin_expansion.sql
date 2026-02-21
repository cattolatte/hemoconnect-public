-- HemoConnect Phase 4.5 — Admin Expansion
-- Adds ban/suspend capabilities + admin audit log
-- Run this in the Supabase SQL Editor AFTER 00004

-- ============================================================
-- 1. PROFILES: add ban/suspend columns
-- ============================================================
alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text,
  add column if not exists suspended_until timestamptz,
  add column if not exists suspension_reason text;

-- ============================================================
-- 2. ADMIN AUDIT LOG — track all admin actions
-- ============================================================
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_post_id uuid references public.forum_posts(id) on delete set null,
  details jsonb,
  created_at timestamptz default now()
);

-- RLS for admin_audit_log
alter table public.admin_audit_log enable row level security;

-- Only admins/moderators can view audit log
create policy "Admins can view audit log"
  on public.admin_audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Only admins/moderators can insert audit entries
create policy "Admins can insert audit log"
  on public.admin_audit_log for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Index for efficient lookups
create index if not exists idx_admin_audit_log_admin_id on public.admin_audit_log(admin_id);
create index if not exists idx_admin_audit_log_target_user on public.admin_audit_log(target_user_id);
create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log(created_at desc);
create index if not exists idx_profiles_banned on public.profiles(banned_at) where banned_at is not null;
create index if not exists idx_profiles_suspended on public.profiles(suspended_until) where suspended_until is not null;
