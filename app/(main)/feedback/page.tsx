import type { Metadata } from "next"
import { FeedbackForm } from "./feedback-form"

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share your anonymous feedback to help us improve HemoConnect.",
}

export default function FeedbackPage() {
  return <FeedbackForm />
}
