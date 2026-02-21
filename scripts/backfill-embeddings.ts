/**
 * Backfill Embeddings Script
 *
 * Generates embeddings for existing profiles and forum posts
 * that don't have them yet.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (not the anon key — needs to bypass RLS)
 *   HUGGING_FACE_TOKEN
 */

import { createClient } from "@supabase/supabase-js"
import { HfInference } from "@huggingface/inference"

// ── Config ──────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !HF_TOKEN) {
  console.error("Missing required environment variables:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUGGING_FACE_TOKEN")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const hf = new HfInference(HF_TOKEN)

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
const DELAY_MS = 200 // Delay between API calls to respect rate limits

// ── Helpers ─────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text,
    })
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as number[]
    }
    return result as number[]
  } catch (error) {
    console.error("  Embedding failed:", error)
    return null
  }
}

// ── Backfill Profiles ───────────────────────────────────

async function backfillProfiles() {
  console.log("\n📋 Backfilling profile embeddings...\n")

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, bio, hemophilia_type, severity_level, current_treatment, life_stage, topics")
    .is("embedding", null)
    .eq("profile_setup_complete", true)

  if (error) {
    console.error("Failed to fetch profiles:", error)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log("  No profiles need backfilling.")
    return
  }

  console.log(`  Found ${profiles.length} profiles without embeddings.\n`)

  let success = 0
  let failed = 0

  for (const profile of profiles) {
    const parts: string[] = []
    if (profile.hemophilia_type) parts.push(`Hemophilia Type: ${profile.hemophilia_type}`)
    if (profile.severity_level) parts.push(`Severity: ${profile.severity_level}`)
    if (profile.current_treatment) parts.push(`Treatment: ${profile.current_treatment}`)
    if (profile.life_stage) parts.push(`Life Stage: ${profile.life_stage}`)
    if (profile.topics?.length) parts.push(`Interests: ${profile.topics.join(", ")}`)
    if (profile.bio) parts.push(`Bio: ${profile.bio}`)

    const text = parts.join(". ").slice(0, 500)

    if (!text.trim()) {
      console.log(`  ⏭ Profile ${profile.id} — no text to embed, skipping`)
      continue
    }

    const embedding = await generateEmbedding(text)

    if (embedding) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", profile.id)

      if (updateError) {
        console.error(`  ✗ Profile ${profile.id} — update failed:`, updateError)
        failed++
      } else {
        console.log(`  ✓ Profile ${profile.id}`)
        success++
      }
    } else {
      console.error(`  ✗ Profile ${profile.id} — embedding generation failed`)
      failed++
    }

    await delay(DELAY_MS)
  }

  console.log(`\n  Profiles done: ${success} succeeded, ${failed} failed.`)
}

// ── Backfill Forum Posts ────────────────────────────────

async function backfillForumPosts() {
  console.log("\n💬 Backfilling forum post embeddings...\n")

  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("id, title, body")
    .is("embedding", null)

  if (error) {
    console.error("Failed to fetch posts:", error)
    return
  }

  if (!posts || posts.length === 0) {
    console.log("  No posts need backfilling.")
    return
  }

  console.log(`  Found ${posts.length} posts without embeddings.\n`)

  let success = 0
  let failed = 0

  for (const post of posts) {
    const text = `${post.title}. ${post.body}`.slice(0, 500)

    const embedding = await generateEmbedding(text)

    if (embedding) {
      const { error: updateError } = await supabase
        .from("forum_posts")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", post.id)

      if (updateError) {
        console.error(`  ✗ Post ${post.id} — update failed:`, updateError)
        failed++
      } else {
        console.log(`  ✓ Post ${post.id} — "${post.title.slice(0, 50)}"`)
        success++
      }
    } else {
      console.error(`  ✗ Post ${post.id} — embedding generation failed`)
      failed++
    }

    await delay(DELAY_MS)
  }

  console.log(`\n  Posts done: ${success} succeeded, ${failed} failed.`)
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("🚀 HemoConnect Embedding Backfill")
  console.log("═".repeat(40))

  await backfillProfiles()
  await backfillForumPosts()

  console.log("\n═".repeat(40))
  console.log("✅ Backfill complete!\n")
}

main().catch(console.error)
