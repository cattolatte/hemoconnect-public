import { z } from "zod"

export const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  body: z.string().min(20, "Post must be at least 20 characters"),
  tags: z.array(z.string()).min(1, "Select at least one tag").max(3, "Maximum 3 tags"),
})

export type CreatePostValues = z.infer<typeof createPostSchema>

export const createCommentSchema = z.object({
  body: z.string().min(2, "Reply must be at least 2 characters"),
})

export type CreateCommentValues = z.infer<typeof createCommentSchema>
