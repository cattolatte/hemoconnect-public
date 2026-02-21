-- HemoConnect Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  bio text default '',
  location text default '',
  hemophilia_type text check (hemophilia_type in ('a', 'b', 'c', 'vwd', 'other', 'carrier', 'caregiver')),
  severity_level text check (severity_level in ('mild', 'moderate', 'severe')),
  factor_level numeric check (factor_level >= 0 and factor_level <= 100),
  current_treatment text check (current_treatment in ('prophylaxis', 'on-demand', 'emicizumab', 'gene-therapy', 'other', 'none')),
  age_range text check (age_range in ('under-18', '18-25', '26-35', '36-45', '46-55', '56-plus')),
  life_stage text check (life_stage in ('student', 'young-adult', 'parent', 'professional', 'retired', 'caregiver')),
  topics text[] default '{}',
  peer_matching_enabled boolean default true,
  email_notifications boolean default true,
  weekly_digest boolean default false,
  profile_visible boolean default true,
  profile_setup_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view visible profiles"
  on public.profiles for select
  using (profile_visible = true or id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- ============================================================
-- 2. FORUM POSTS
-- ============================================================
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  excerpt text not null default '',
  tags text[] default '{}',
  is_hot boolean default false,
  is_pinned boolean default false,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger forum_posts_updated_at
  before update on public.forum_posts
  for each row execute function public.update_updated_at();

-- RLS
alter table public.forum_posts enable row level security;

create policy "Anyone authed can view forum posts"
  on public.forum_posts for select
  using (auth.uid() is not null);

create policy "Users can create forum posts"
  on public.forum_posts for insert
  with check (user_id = auth.uid());

create policy "Users can update own posts"
  on public.forum_posts for update
  using (user_id = auth.uid());

create policy "Users can delete own posts"
  on public.forum_posts for delete
  using (user_id = auth.uid());

-- ============================================================
-- 3. FORUM COMMENTS
-- ============================================================
create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger forum_comments_updated_at
  before update on public.forum_comments
  for each row execute function public.update_updated_at();

-- RLS
alter table public.forum_comments enable row level security;

create policy "Anyone authed can view comments"
  on public.forum_comments for select
  using (auth.uid() is not null);

create policy "Users can create comments"
  on public.forum_comments for insert
  with check (user_id = auth.uid());

create policy "Users can update own comments"
  on public.forum_comments for update
  using (user_id = auth.uid());

create policy "Users can delete own comments"
  on public.forum_comments for delete
  using (user_id = auth.uid());

-- ============================================================
-- 4. FORUM LIKES (posts + comments)
-- ============================================================
create table public.forum_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  created_at timestamptz default now(),
  constraint like_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  constraint unique_post_like unique (user_id, post_id),
  constraint unique_comment_like unique (user_id, comment_id)
);

-- RLS
alter table public.forum_likes enable row level security;

create policy "Anyone authed can view likes"
  on public.forum_likes for select
  using (auth.uid() is not null);

create policy "Users can create likes"
  on public.forum_likes for insert
  with check (user_id = auth.uid());

create policy "Users can delete own likes"
  on public.forum_likes for delete
  using (user_id = auth.uid());

-- ============================================================
-- 5. CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references public.profiles(id) on delete cascade,
  participant_2 uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint different_participants check (participant_1 <> participant_2)
);

-- Unique index using expressions (can't use functions in inline UNIQUE constraints)
create unique index idx_unique_conversation
  on public.conversations (least(participant_1, participant_2), greatest(participant_1, participant_2));

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

-- RLS
alter table public.conversations enable row level security;

create policy "Users can view own conversations"
  on public.conversations for select
  using (participant_1 = auth.uid() or participant_2 = auth.uid());

create policy "Users can create conversations"
  on public.conversations for insert
  with check (participant_1 = auth.uid() or participant_2 = auth.uid());

-- ============================================================
-- 6. MESSAGES
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.messages enable row level security;

create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "Users can send messages in own conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "Users can update own messages (mark read)"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

-- ============================================================
-- 7. RESOURCES
-- ============================================================
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  body text default '',
  category text not null check (category in ('treatment', 'fitness', 'lifestyle', 'wellness', 'insurance')),
  tags text[] default '{}',
  read_time_minutes integer default 5,
  featured boolean default false,
  icon text default 'BookOpen',
  external_url text,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger resources_updated_at
  before update on public.resources
  for each row execute function public.update_updated_at();

-- RLS
alter table public.resources enable row level security;

create policy "Anyone authed can view resources"
  on public.resources for select
  using (auth.uid() is not null);

-- ============================================================
-- 8. SAVED RESOURCES (bookmarks)
-- ============================================================
create table public.saved_resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_saved_resource unique (user_id, resource_id)
);

-- RLS
alter table public.saved_resources enable row level security;

create policy "Users can view own saved resources"
  on public.saved_resources for select
  using (user_id = auth.uid());

create policy "Users can save resources"
  on public.saved_resources for insert
  with check (user_id = auth.uid());

create policy "Users can unsave resources"
  on public.saved_resources for delete
  using (user_id = auth.uid());

-- ============================================================
-- 9. PEER CONNECTIONS
-- ============================================================
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'connected', 'declined', 'blocked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint different_users check (requester_id <> receiver_id)
);

-- Unique index using expressions (can't use functions in inline UNIQUE constraints)
create unique index idx_unique_connection
  on public.connections (least(requester_id, receiver_id), greatest(requester_id, receiver_id));

create trigger connections_updated_at
  before update on public.connections
  for each row execute function public.update_updated_at();

-- RLS
alter table public.connections enable row level security;

create policy "Users can view own connections"
  on public.connections for select
  using (requester_id = auth.uid() or receiver_id = auth.uid());

create policy "Users can create connection requests"
  on public.connections for insert
  with check (requester_id = auth.uid());

create policy "Users can update connections they're part of"
  on public.connections for update
  using (requester_id = auth.uid() or receiver_id = auth.uid());

-- ============================================================
-- 10. INDEXES for performance
-- ============================================================
create index idx_forum_posts_user_id on public.forum_posts(user_id);
create index idx_forum_posts_created_at on public.forum_posts(created_at desc);
create index idx_forum_comments_post_id on public.forum_comments(post_id);
create index idx_forum_comments_user_id on public.forum_comments(user_id);
create index idx_forum_likes_post_id on public.forum_likes(post_id);
create index idx_forum_likes_comment_id on public.forum_likes(comment_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_connections_requester on public.connections(requester_id);
create index idx_connections_receiver on public.connections(receiver_id);

-- ============================================================
-- 11. HELPER VIEWS / FUNCTIONS
-- ============================================================

-- Get or create a conversation between two users
create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  conv_id uuid;
begin
  -- Look for existing conversation
  select id into conv_id
  from public.conversations
  where (participant_1 = auth.uid() and participant_2 = other_user_id)
     or (participant_1 = other_user_id and participant_2 = auth.uid());

  -- Create if not found
  if conv_id is null then
    insert into public.conversations (participant_1, participant_2)
    values (auth.uid(), other_user_id)
    returning id into conv_id;
  end if;

  return conv_id;
end;
$$;

-- Seed some resources for initial content
insert into public.resources (title, summary, category, tags, read_time_minutes, featured, icon) values
  ('Understanding Hemophilia Treatment Options', 'A comprehensive guide to modern treatment approaches including prophylaxis, on-demand therapy, and emerging gene therapy options.', 'treatment', '{"Treatment", "Prophylaxis"}', 8, true, 'Stethoscope'),
  ('Safe Exercise Guide for Hemophilia', 'Evidence-based recommendations for staying active while protecting your joints. Includes specific exercises and modifications.', 'fitness', '{"Exercise", "Joint Health"}', 12, true, 'Dumbbell'),
  ('Traveling with Hemophilia', 'Essential tips for traveling with factor supplies, finding treatment centers abroad, and navigating insurance coverage.', 'lifestyle', '{"Travel", "Insurance"}', 6, false, 'Plane'),
  ('Mental Health & Chronic Conditions', 'Understanding the emotional impact of living with hemophilia and practical strategies for maintaining mental wellness.', 'wellness', '{"Mental Health", "Wellness"}', 10, true, 'Brain'),
  ('Navigating Insurance Coverage', 'A practical guide to understanding your insurance benefits, appealing denials, and finding financial assistance programs.', 'insurance', '{"Insurance", "Treatment"}', 15, false, 'Shield'),
  ('Joint Protection Strategies', 'Learn about joint protection techniques, assistive devices, and lifestyle modifications to reduce bleed risk.', 'wellness', '{"Joint Health", "Exercise"}', 7, false, 'Heart'),
  ('Hemophilia & Nutrition Guide', 'How diet and nutrition can support overall health and potentially reduce inflammation for people with bleeding disorders.', 'lifestyle', '{"Diet & Nutrition", "Wellness"}', 9, false, 'BookOpen');
