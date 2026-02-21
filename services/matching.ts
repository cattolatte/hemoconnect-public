/**
 * Peer matching scoring service.
 * Combines rule-based clinical matching with AI vector similarity.
 */

interface MatchableProfile {
  hemophilia_type: string | null
  severity_level: string | null
  topics: string[] | null
}

// ── Rule-Based Scoring ──────────────────────────────────

/**
 * Calculate a rule-based match score between two profiles.
 * Extracted from the original getSuggestedPeers() logic.
 *
 * Scoring:
 *  - Base: 50
 *  - Same hemophilia type: +20
 *  - Same severity level: +15
 *  - Each shared topic: +5
 *  - Maximum: 99
 */
export function calculateRuleScore(
  myProfile: MatchableProfile,
  otherProfile: MatchableProfile
): number {
  let score = 50

  if (
    myProfile.hemophilia_type &&
    otherProfile.hemophilia_type &&
    myProfile.hemophilia_type === otherProfile.hemophilia_type
  ) {
    score += 20
  }

  if (
    myProfile.severity_level &&
    otherProfile.severity_level &&
    myProfile.severity_level === otherProfile.severity_level
  ) {
    score += 15
  }

  const myTopics = myProfile.topics ?? []
  const otherTopics = otherProfile.topics ?? []
  const sharedTopics = myTopics.filter((t) => otherTopics.includes(t))
  score += sharedTopics.length * 5

  return Math.min(score, 99)
}

// ── Hybrid Scoring ──────────────────────────────────────

/**
 * Combine rule-based score with vector cosine similarity.
 *
 * Weights: 40% rule-based, 60% vector similarity.
 * Falls back to pure rule score if vector similarity is null.
 *
 * @param ruleScore    - Score from calculateRuleScore() (0–99)
 * @param similarity   - Cosine similarity from pgvector (0.0–1.0), or null
 */
export function calculateHybridScore(
  ruleScore: number,
  similarity: number | null
): number {
  if (similarity === null || similarity === undefined) {
    return ruleScore
  }

  const hybridScore = Math.round(ruleScore * 0.4 + similarity * 100 * 0.6)
  return Math.max(0, Math.min(hybridScore, 99))
}
