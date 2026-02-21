"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPost } from "@/lib/actions/forum"
import { INTEREST_TOPICS } from "@/lib/types/database"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 3) {
      setTags([...tags, tag])
      setErrors((prev) => ({ ...prev, tags: "" }))
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const resetForm = () => {
    setTitle("")
    setBody("")
    setTags([])
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters"
    }
    if (title.trim().length > 200) {
      newErrors.title = "Title is too long (max 200 characters)"
    }
    if (body.trim().length < 20) {
      newErrors.body = "Post must be at least 20 characters"
    }
    if (tags.length === 0) {
      newErrors.tags = "Select at least one tag"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    startTransition(async () => {
      const result = await createPost({
        title: title.trim(),
        body: body.trim(),
        tags,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.flagged) {
        toast.warning("Your post has been flagged for review and will be visible once approved.")
      } else {
        toast.success("Post published!")
      }

      resetForm()
      onOpenChange(false)

      if (result.id) {
        router.push(`/forum/${result.id}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm()
      onOpenChange(value)
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogDescription>
            Share a question, experience, or tip with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((prev) => ({ ...prev, title: "" }))
              }}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="post-body">Details</Label>
            <Textarea
              id="post-body"
              placeholder="Share more details, context, or your experience..."
              className="min-h-[120px] resize-none"
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                setErrors((prev) => ({ ...prev, body: "" }))
              }}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {body.length} characters
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (1–3)</Label>
            <Select onValueChange={addTag} value="">
              <SelectTrigger>
                <SelectValue placeholder={tags.length >= 3 ? "Maximum tags reached" : "Select a topic tag..."} />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_TOPICS.filter((t) => !tags.includes(t)).map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
