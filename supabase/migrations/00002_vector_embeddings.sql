-- HemoConnect Phase 3: Vector Embeddings for AI Features
-- Run this in the Supabase SQL Editor AFTER 00001_initial_schema.sql

-- ============================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================================
create extension if not exists vector with schema extensions;

-- ============================================================
-- 2. ADD EMBEDDING COLUMNS
-- ============================================================

-- Profile embeddings (384 dimensions for all-MiniLM-L6-v2)
alter table public.profiles
  add column if not exists embedding vector(384);

-- Forum post embeddings
alter table public.forum_posts
  add column if not exists embedding vector(384);

-- Content moderation status for forum posts
alter table public.forum_posts
  add column if not exists moderation_status text
    default 'approved'
    check (moderation_status in ('pending', 'approved', 'flagged'));

-- ============================================================
-- 3. CREATE HNSW INDEXES FOR FAST SIMILARITY SEARCH
-- ============================================================

create index if not exists idx_profiles_embedding
  on public.profiles
  using hnsw (embedding vector_cosine_ops);

create index if not exists idx_forum_posts_embedding
  on public.forum_posts
  using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- 4. RPC FUNCTION: MATCH PROFILES (for peer matching)
-- ============================================================

create or replace function public.match_profiles(
  query_embedding vector(384),
  match_count int default 10,
  exclude_user_id uuid default null
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  hemophilia_type text,
  severity_level text,
  topics text[],
  similarity float
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    p.id,
    p.first_name,
    p.last_name,
    p.hemophilia_type,
    p.severity_level,
    p.topics,
    (1 - (p.embedding <=> query_embedding))::float as similarity
  from public.profiles p
  where
    p.embedding is not null
    and p.profile_visible = true
    and p.peer_matching_enabled = true
    and p.profile_setup_complete = true
    and (exclude_user_id is null or p.id != exclude_user_id)
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- 5. RPC FUNCTION: MATCH FORUM POSTS (for semantic search)
-- ============================================================

create or replace function public.match_forum_posts(
  query_embedding vector(384),
  match_count int default 20,
  similarity_threshold float default 0.3
)
returns table (
  id uuid,
  title text,
  excerpt text,
  tags text[],
  user_id uuid,
  created_at timestamptz,
  similarity float
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    fp.id,
    fp.title,
    fp.excerpt,
    fp.tags,
    fp.user_id,
    fp.created_at,
    (1 - (fp.embedding <=> query_embedding))::float as similarity
  from public.forum_posts fp
  where
    fp.embedding is not null
    and fp.moderation_status = 'approved'
    and (1 - (fp.embedding <=> query_embedding)) >= similarity_threshold
  order by fp.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- 6. UPDATE RLS POLICY FOR MODERATION
-- ============================================================

-- Drop the existing select policy for forum_posts (if it allows all)
drop policy if exists "Forum posts are viewable by everyone" on public.forum_posts;

-- Approved posts are viewable by everyone; flagged posts only by their author
create policy "Forum posts viewable based on moderation status"
  on public.forum_posts for select
  using (
    moderation_status = 'approved'
    or user_id = (select auth.uid())
  );
