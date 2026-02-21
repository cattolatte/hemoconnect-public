import { HfInference } from "@huggingface/inference"
import type { Profile, ForumPost } from "@/lib/types/database"
import {
  HEMOPHILIA_TYPE_LABELS,
  SEVERITY_LABELS,
  TREATMENT_LABELS,
} from "@/lib/types/database"

// ── Client ──────────────────────────────────────────────

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN)

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
const TOXICITY_MODEL = "unitary/toxic-bert"
const CLASSIFICATION_MODEL = "facebook/bart-large-mnli"
const SUMMARIZATION_MODEL = "facebook/bart-large-cnn"
const MAX_RETRIES = 3
const MAX_EMBEDDING_CHARS = 500
const MAX_SUMMARY_INPUT_CHARS = 1024
const CLASSIFICATION_THRESHOLD = 0.4

// ── Types ───────────────────────────────────────────────

export type EmbeddingResult = number[] | null

export interface ToxicityLabel {
  label: string
  score: number
}

export interface ToxicityResult {
  isToxic: boolean
  labels: ToxicityLabel[]
}

// ── Helpers ─────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Compose a natural-language string from profile fields for embedding.
 * The richer the text, the better the semantic match quality.
 */
export function generateProfileEmbeddingText(
  profile: Pick<
    Profile,
    "bio" | "hemophilia_type" | "severity_level" | "current_treatment" | "life_stage" | "topics"
  >
): string {
  const parts: string[] = []

  if (profile.hemophilia_type) {
    parts.push(`Hemophilia Type: ${HEMOPHILIA_TYPE_LABELS[profile.hemophilia_type]}`)
  }
  if (profile.severity_level) {
    parts.push(`Severity: ${SEVERITY_LABELS[profile.severity_level]}`)
  }
  if (profile.current_treatment) {
    parts.push(`Treatment: ${TREATMENT_LABELS[profile.current_treatment]}`)
  }
  if (profile.life_stage) {
    parts.push(`Life Stage: ${profile.life_stage.replace("-", " ")}`)
  }
  if (profile.topics && profile.topics.length > 0) {
    parts.push(`Interests: ${profile.topics.join(", ")}`)
  }
  if (profile.bio) {
    parts.push(`Bio: ${profile.bio}`)
  }

  return parts.join(". ").slice(0, MAX_EMBEDDING_CHARS)
}

/**
 * Compose embedding text from a forum post's title and body.
 */
export function generatePostEmbeddingText(
  post: Pick<ForumPost, "title" | "body">
): string {
  return `${post.title}. ${post.body}`.slice(0, MAX_EMBEDDING_CHARS)
}

// ── Embedding Generation ────────────────────────────────

/**
 * Generate a 384-dimensional embedding for the given text.
 * Retries on 503 (model loading) and 429 (rate limit).
 * Returns null on failure — callers should degrade gracefully.
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!process.env.HUGGING_FACE_TOKEN || !text.trim()) {
    return null
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await hf.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: text,
      })

      // HF returns number[] for single input, number[][] for batch
      // Normalize to number[]
      if (Array.isArray(result) && Array.isArray(result[0])) {
        return result[0] as number[]
      }
      return result as number[]
    } catch (error: unknown) {
      const statusCode = (error as { status?: number })?.status

      // Retry on model loading (503) or rate limit (429)
      if ((statusCode === 503 || statusCode === 429) && attempt < MAX_RETRIES - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
        console.warn(
          `[HemoConnect AI] Embedding API returned ${statusCode}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await delay(backoffMs)
        continue
      }

      console.error("[HemoConnect AI] Failed to generate embedding:", error)
      return null
    }
  }

  return null
}

// ── Content Moderation ──────────────────────────────────

const TOXICITY_THRESHOLD = 0.7

/**
 * Check text for toxicity using toxic-bert.
 * Returns null on failure — callers should allow content through.
 */
export async function checkToxicity(text: string): Promise<ToxicityResult | null> {
  if (!process.env.HUGGING_FACE_TOKEN || !text.trim()) {
    return null
  }

  try {
    const result = await hf.textClassification({
      model: TOXICITY_MODEL,
      inputs: text,
    })

    // result is an array of { label, score }
    const labels: ToxicityLabel[] = Array.isArray(result)
      ? result.map((r) => ({ label: r.label, score: r.score }))
      : [{ label: (result as { label: string }).label, score: (result as { score: number }).score }]

    const isToxic = labels.some(
      (l) => l.label.toLowerCase() === "toxic" && l.score > TOXICITY_THRESHOLD
    )

    return { isToxic, labels }
  } catch (error) {
    console.error("[HemoConnect AI] Toxicity check failed:", error)
    return null // Graceful degradation — allow content through
  }
}

// ── Zero-Shot Classification (Auto-Tagging) ────────────

export interface ClassificationResult {
  label: string
  score: number
}

/**
 * Classify text into candidate labels using zero-shot classification.
 * Returns the top labels above threshold (max 3), or null on failure.
 * Uses multi_label=true since a post can belong to multiple topics.
 */
export async function classifyTopics(
  text: string,
  candidateLabels: readonly string[]
): Promise<ClassificationResult[] | null> {
  if (!process.env.HUGGING_FACE_TOKEN || !text.trim() || candidateLabels.length === 0) {
    return null
  }

  const truncated = text.slice(0, MAX_EMBEDDING_CHARS)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await hf.zeroShotClassification({
        model: CLASSIFICATION_MODEL,
        inputs: truncated,
        parameters: {
          candidate_labels: [...candidateLabels],
          multi_label: true,
        },
      })

      // result is ZeroShotClassificationOutputElement[]
      // Each element: { label: string, score: number }
      const elements = Array.isArray(result) ? result : [result]

      const filtered: ClassificationResult[] = elements
        .filter((el) => el.score > CLASSIFICATION_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((el) => ({ label: el.label, score: el.score }))

      return filtered.length > 0 ? filtered : null
    } catch (error: unknown) {
      const statusCode = (error as { status?: number })?.status

      if ((statusCode === 503 || statusCode === 429) && attempt < MAX_RETRIES - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000
        console.warn(
          `[HemoConnect AI] Classification API returned ${statusCode}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await delay(backoffMs)
        continue
      }

      console.error("[HemoConnect AI] Failed to classify topics:", error)
      return null
    }
  }

  return null
}

// ── Thread Summarization (Knowledge Distiller) ──────────

/**
 * Compose thread text for summarization: title + body + all comment bodies.
 */
export function composeThreadText(
  post: Pick<ForumPost, "title" | "body">,
  commentBodies: string[]
): string {
  const parts = [
    `Topic: ${post.title}`,
    `Original post: ${post.body}`,
    ...commentBodies.map((body, i) => `Reply ${i + 1}: ${body}`),
  ]
  return parts.join("\n\n").slice(0, MAX_SUMMARY_INPUT_CHARS)
}

/**
 * Summarize a discussion thread into key takeaways.
 * Returns the summary text, or null on failure.
 */
export async function summarizeThread(text: string): Promise<string | null> {
  if (!process.env.HUGGING_FACE_TOKEN || !text.trim()) {
    return null
  }

  const truncated = text.slice(0, MAX_SUMMARY_INPUT_CHARS)

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await hf.summarization({
        model: SUMMARIZATION_MODEL,
        inputs: truncated,
        parameters: {
          generate_parameters: {
            max_length: 150,
            min_length: 30,
          },
        },
      })

      return result.summary_text || null
    } catch (error: unknown) {
      const statusCode = (error as { status?: number })?.status

      if ((statusCode === 503 || statusCode === 429) && attempt < MAX_RETRIES - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000
        console.warn(
          `[HemoConnect AI] Summarization API returned ${statusCode}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await delay(backoffMs)
        continue
      }

      console.error("[HemoConnect AI] Failed to summarize thread:", error)
      return null
    }
  }

  return null
}
