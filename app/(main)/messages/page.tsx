import type { Metadata } from "next"
import { getConversations } from "@/lib/actions/messages"

export const metadata: Metadata = {
  title: "Messages",
  description: "Private conversations with your peers in the HemoConnect community.",
}
import { getUser } from "@/lib/actions/user"
import { MessagesContent } from "./messages-content"

export default async function MessagesPage() {
  const [conversations, currentUser] = await Promise.all([
    getConversations(),
    getUser(),
  ])

  return <MessagesContent initialConversations={conversations} currentUser={currentUser} />
}
