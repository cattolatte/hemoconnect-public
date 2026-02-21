"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star,
  Send,
  MessageSquareHeart,
  Bug,
  Lightbulb,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const categories = [
  {
    value: "general",
    label: "General Feedback",
    icon: MessageCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    activeBg: "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20",
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
    activeBg: "bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-500/20",
  },
  {
    value: "bug",
    label: "Bug Report",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
    activeBg: "bg-red-500/20 border-red-500/50 ring-2 ring-red-500/20",
  },
] as const

type Category = (typeof categories)[number]["value"]

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpqjyqqy"

export function FeedbackForm() {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [category, setCategory] = useState<Category | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"]
  const displayRating = hoveredStar || rating

  const canSubmit = rating > 0 && category !== null

  async function handleSubmit() {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          message: message.trim() || "(No additional comments)",
          _subject: `HemoConnect Feedback: ${ratingLabels[rating]} (${category})`,
        }),
      })

      if (!res.ok) throw new Error("Failed to submit")

      setIsSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setRating(0)
    setHoveredStar(0)
    setCategory(null)
    setMessage("")
    setIsSubmitted(false)
    setError(null)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ─── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquareHeart className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Share Your Feedback
            </h1>
            <p className="text-sm text-muted-foreground">
              Help us make HemoConnect better for everyone
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <Card className="border-dashed border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Your feedback is <strong className="text-foreground">completely anonymous</strong>.
              We don&apos;t collect any personal information. Your honest opinion
              helps us build a better community platform.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Main Form Card ─────────────────────────── */}
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Card className="overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/10"
                >
                  <CheckCircle2 className="size-10 text-emerald-500" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-2 text-2xl font-bold"
                >
                  Thank You!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-2 max-w-sm text-muted-foreground"
                >
                  Your feedback has been submitted successfully. Every piece of
                  feedback helps us improve HemoConnect.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mb-8 flex items-center gap-1.5 text-sm text-primary"
                >
                  <Heart className="size-3.5" />
                  <span>You rated us {ratingLabels[rating]}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <MessageSquareHeart className="size-4" />
                    Submit Another Response
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="space-y-8 py-8">
                {/* ─── Star Rating ─────────────────────── */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    How would you rate HemoConnect?
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      Required
                    </Badge>
                  </label>

                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setRating(star)}
                          className="relative p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                        >
                          <Star
                            className={cn(
                              "size-9 sm:size-10 transition-all duration-200",
                              star <= displayRating
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                                : "text-muted-foreground/30"
                            )}
                          />
                        </motion.button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {displayRating > 0 && (
                        <motion.p
                          key={displayRating}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="text-sm font-medium text-amber-600 dark:text-amber-400"
                        >
                          {ratingLabels[displayRating]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ─── Category ────────────────────────── */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    What type of feedback?
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      Required
                    </Badge>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => {
                      const isActive = category === cat.value
                      return (
                        <motion.button
                          key={cat.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCategory(cat.value)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            isActive ? cat.activeBg : cat.bg
                          )}
                        >
                          <cat.icon
                            className={cn("size-4 shrink-0", cat.color)}
                          />
                          <span className="text-sm font-medium">
                            {cat.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* ─── Message ─────────────────────────── */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Tell us more
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 text-muted-foreground"
                    >
                      Optional
                    </Badge>
                  </label>
                  <Textarea
                    placeholder="Share your thoughts, ideas, or report an issue..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/2000
                  </p>
                </div>

                {/* ─── Error ──────────────────────────── */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* ─── Submit ─────────────────────────── */}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  size="lg"
                  className="w-full gap-2 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Send className="size-4" />
                      </motion.div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
