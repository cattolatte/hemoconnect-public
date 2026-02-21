/**
 * Simple in-memory token bucket rate limiter.
 * No external dependencies.
 *
 * Usage in server actions:
 *   const limiter = rateLimit({ interval: 60_000, maxRequests: 10 })
 *   const { success } = await limiter.check(userId)
 *   if (!success) return { error: "Too many requests. Please try again later." }
 */

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number
  /** Max requests per window */
  maxRequests: number
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(interval: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > interval * 2) {
      buckets.delete(key)
    }
  }
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, maxRequests } = config

  return {
    check(identifier: string): { success: boolean; remaining: number } {
      cleanup(interval)

      const key = identifier
      const now = Date.now()
      const bucket = buckets.get(key)

      if (!bucket) {
        // First request — create bucket with (max - 1) tokens
        buckets.set(key, { tokens: maxRequests - 1, lastRefill: now })
        return { success: true, remaining: maxRequests - 1 }
      }

      // Refill tokens based on elapsed time
      const elapsed = now - bucket.lastRefill
      const tokensToAdd = Math.floor((elapsed / interval) * maxRequests)

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd)
        bucket.lastRefill = now
      }

      if (bucket.tokens > 0) {
        bucket.tokens -= 1
        return { success: true, remaining: bucket.tokens }
      }

      return { success: false, remaining: 0 }
    },
  }
}

// Pre-configured limiters for common actions
export const postLimiter = rateLimit({ interval: 60_000, maxRequests: 5 }) // 5 posts/min
export const commentLimiter = rateLimit({ interval: 60_000, maxRequests: 15 }) // 15 comments/min
export const messageLimiter = rateLimit({ interval: 60_000, maxRequests: 30 }) // 30 messages/min
export const reportLimiter = rateLimit({ interval: 300_000, maxRequests: 5 }) // 5 reports/5min
export const uploadLimiter = rateLimit({ interval: 60_000, maxRequests: 3 }) // 3 uploads/min
