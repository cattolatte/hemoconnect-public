-- ============================================================
-- Migration 00003: AI Features — Auto-Tagging & Knowledge Distiller
-- Adds columns for zero-shot classification tags and cached
-- thread summaries on forum_posts.
-- ============================================================

-- ── Auto-Tags (Zero-Shot Classification) ────────────────────
-- Stores AI-generated tags from facebook/bart-large-mnli.
-- Kept separate from user-chosen `tags` column so they can be
-- independently managed and visually distinguished in the UI.

alter table public.forum_posts
  add column if not exists auto_tags text[] default '{}';

-- ── AI Summary (Knowledge Distiller) ────────────────────────
-- Cached thread summary from facebook/bart-large-cnn.
-- Generated after 3+ comments; refreshed when stale (>1 hour).

alter table public.forum_posts
  add column if not exists ai_summary text default null;

alter table public.forum_posts
  add column if not exists ai_summary_updated_at timestamptz default null;
