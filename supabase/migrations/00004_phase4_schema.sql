-- HemoConnect Phase 4 Schema — Feature Expansion
-- Run this in the Supabase SQL Editor AFTER 00001, 00002, 00003

-- ============================================================
-- 1. PROFILES: add role + avatar_url columns
-- ============================================================
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'moderator', 'admin')),
  add column if not exists avatar_url text;

-- ============================================================
-- 2. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in (
    'new_comment', 'post_liked', 'comment_liked', 'new_follower',
    'connection_request', 'connection_accepted', 'badge_earned',
    'mention', 'thread_reply', 'smart_match'
  )),
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  badge_type text,
  message text,
  read boolean not null default false,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(user_id, read) where read = false;
create index idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications (mark read)"
  on public.notifications for update
  using (user_id = auth.uid());

-- Insert policy: allow authenticated users (notifications created by server actions)
create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

-- ============================================================
-- 3. BOOKMARKS (forum post bookmarks)
-- ============================================================
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_bookmark unique (user_id, post_id)
);

create index idx_bookmarks_user_id on public.bookmarks(user_id);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (user_id = auth.uid());

create policy "Users can create bookmarks"
  on public.bookmarks for insert
  with check (user_id = auth.uid());

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (user_id = auth.uid());

-- ============================================================
-- 4. FOLLOWS (user-to-user following)
-- ============================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_follow unique (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

alter table public.follows enable row level security;

create policy "Anyone authed can view follows"
  on public.follows for select
  using (auth.uid() is not null);

create policy "Users can create follows"
  on public.follows for insert
  with check (follower_id = auth.uid());

create policy "Users can delete own follows"
  on public.follows for delete
  using (follower_id = auth.uid());

-- ============================================================
-- 5. POST SUBSCRIPTIONS (thread reply notifications)
-- ============================================================
create table public.post_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_subscription unique (user_id, post_id)
);

create index idx_post_subscriptions_post on public.post_subscriptions(post_id);
create index idx_post_subscriptions_user on public.post_subscriptions(user_id);

alter table public.post_subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.post_subscriptions for select
  using (user_id = auth.uid());

create policy "Users can create subscriptions"
  on public.post_subscriptions for insert
  with check (user_id = auth.uid());

create policy "Users can delete own subscriptions"
  on public.post_subscriptions for delete
  using (user_id = auth.uid());

-- ============================================================
-- 6. USER BADGES (gamification)
-- ============================================================
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null check (badge_type in (
    'guiding_light', 'connector', 'first_post', 'helpful',
    'active_member', 'community_builder'
  )),
  earned_at timestamptz default now(),
  constraint unique_badge unique (user_id, badge_type)
);

create index idx_user_badges_user on public.user_badges(user_id);

alter table public.user_badges enable row level security;

create policy "Anyone authed can view badges"
  on public.user_badges for select
  using (auth.uid() is not null);

create policy "Authenticated users can create badges"
  on public.user_badges for insert
  with check (auth.uid() is not null);

-- ============================================================
-- 7. MICRO-COMMUNITIES
-- ============================================================
create table public.micro_communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  tag text not null unique,
  icon text default 'Users',
  member_count integer default 0,
  created_at timestamptz default now()
);

alter table public.micro_communities enable row level security;

create policy "Anyone authed can view communities"
  on public.micro_communities for select
  using (auth.uid() is not null);

-- Only admins can modify communities (or seed via SQL)
create policy "Admins can manage communities"
  on public.micro_communities for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Community membership
create table public.micro_community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.micro_communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  constraint unique_membership unique (community_id, user_id)
);

create index idx_community_members_community on public.micro_community_members(community_id);
create index idx_community_members_user on public.micro_community_members(user_id);

alter table public.micro_community_members enable row level security;

create policy "Anyone authed can view community members"
  on public.micro_community_members for select
  using (auth.uid() is not null);

create policy "Users can join communities"
  on public.micro_community_members for insert
  with check (user_id = auth.uid());

create policy "Users can leave communities"
  on public.micro_community_members for delete
  using (user_id = auth.uid());

-- ============================================================
-- 8. REPORTED CONTENT (moderation)
-- ============================================================
create table public.reported_content (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'misinformation', 'inappropriate', 'other')),
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'action_taken', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz,
  constraint report_has_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

create index idx_reported_content_status on public.reported_content(status);
create index idx_reported_content_created on public.reported_content(created_at desc);

alter table public.reported_content enable row level security;

-- Users can create reports
create policy "Users can create reports"
  on public.reported_content for insert
  with check (reporter_id = auth.uid());

-- Users can view own reports
create policy "Users can view own reports"
  on public.reported_content for select
  using (reporter_id = auth.uid());

-- Admins/mods can view all reports
create policy "Admins can view all reports"
  on public.reported_content for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Admins/mods can update reports
create policy "Admins can update reports"
  on public.reported_content for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- ============================================================
-- 9. SEED MICRO-COMMUNITIES
-- ============================================================
insert into public.micro_communities (name, description, tag, icon) values
  ('Joint Health Warriors', 'Supporting each other through joint health challenges, sharing exercises, and recovery tips.', 'Joint Health', 'Heart'),
  ('Prophylaxis Pals', 'Discussions about prophylactic treatment routines, infusion schedules, and tips.', 'Prophylaxis', 'Shield'),
  ('Travel Adventurers', 'Tips and stories for traveling with hemophilia — packing factor, finding HTCs abroad.', 'Travel', 'Plane'),
  ('Active Life Club', 'Safe exercise, sports, and fitness for people with bleeding disorders.', 'Exercise', 'Dumbbell'),
  ('New Parents Circle', 'A safe space for parents navigating hemophilia with their children.', 'Parenting', 'Baby'),
  ('Mental Wellness Hub', 'Talking openly about the emotional side of living with a chronic condition.', 'Mental Health', 'Brain'),
  ('Nutrition Corner', 'Sharing diet tips, anti-inflammatory recipes, and nutrition science.', 'Diet & Nutrition', 'Apple'),
  ('Gene Therapy Pioneers', 'Following the latest in gene therapy research, trials, and real-world experiences.', 'Gene Therapy', 'Dna'),
  ('Insurance Navigators', 'Helping each other understand insurance, fight denials, and find financial aid.', 'Insurance', 'FileText'),
  ('School & Work Life', 'Balancing hemophilia with education and career — accommodations, disclosures, and tips.', 'School / Work', 'Briefcase')
on conflict (name) do nothing;

-- ============================================================
-- 10. ENABLE REALTIME for messages and notifications
-- ============================================================
-- Note: Run these in the Supabase Dashboard > Database > Replication
-- or use the SQL below:
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
