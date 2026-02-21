"use client"

import { useState, useEffect, useTransition } from "react"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  ArrowLeft,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getMessages, sendMessage, markMessagesAsRead } from "@/lib/actions/messages"
import { timeAgo, formatTime } from "@/lib/utils/time"
import type { ConversationWithDetails, Message } from "@/lib/types/database"
import type { UserData } from "@/lib/actions/user"

interface MessagesContentProps {
  initialConversations: ConversationWithDetails[]
  currentUser: UserData
}

function getInitials(user: { first_name: string; last_name: string }) {
  return [user.first_name, user.last_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"
}

function getFullName(user: { first_name: string; last_name: string }) {
  return `${user.first_name} ${user.last_name}`.trim() || "Unknown"
}

export function MessagesContent({ initialConversations, currentUser }: MessagesContentProps) {
  const [selectedConvoId, setSelectedConvoId] = useState<string>(
    initialConversations[0]?.id ?? ""
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const activeConvo = initialConversations.find((c) => c.id === selectedConvoId)

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvoId) return
    setIsLoadingMessages(true)
    getMessages(selectedConvoId).then((msgs) => {
      setMessages(msgs)
      setIsLoadingMessages(false)
      markMessagesAsRead(selectedConvoId)
    })
  }, [selectedConvoId])

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvoId) return
    const text = messageText.trim()
    setMessageText("")

    startTransition(async () => {
      const result = await sendMessage(selectedConvoId, text)
      if (result.error) {
        toast.error(result.error)
        setMessageText(text) // restore on error
      } else {
        // Refresh messages
        const msgs = await getMessages(selectedConvoId)
        setMessages(msgs)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border bg-card">
      {/* Conversation List */}
      <div className={cn(
        "flex w-full flex-col border-r md:w-80",
        selectedConvoId && "hidden md:flex"
      )}>
        <div className="border-b p-4">
          <h2 className="mb-3 text-lg font-semibold">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-9" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {initialConversations.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-2 size-8 opacity-50" />
                No conversations yet
              </div>
            )}
            {initialConversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvoId(convo.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                  selectedConvoId === convo.id && "bg-muted"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(convo.other_user)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {getFullName(convo.other_user)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {convo.last_message ? timeAgo(convo.last_message.created_at) : ""}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {convo.last_message?.body ?? "No messages yet"}
                  </p>
                </div>
                {convo.unread_count > 0 && (
                  <Badge className="size-5 shrink-0 justify-center rounded-full p-0 text-xs">
                    {convo.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex flex-1 flex-col",
        !selectedConvoId && "hidden md:flex"
      )}>
        {activeConvo ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConvoId("")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {getInitials(activeConvo.other_user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getFullName(activeConvo.other_user)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="size-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="size-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_id === currentUser?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5",
                          msg.sender_id === currentUser?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm leading-relaxed">{msg.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            msg.sender_id === currentUser?.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input Bar */}
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="size-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="size-4" />
                </Button>
                <Button
                  size="icon"
                  className="shrink-0"
                  onClick={handleSend}
                  disabled={isPending || !messageText.trim()}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 size-12 opacity-30" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
