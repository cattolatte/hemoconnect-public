import { z } from "zod"

export const sendMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty"),
})

export type SendMessageValues = z.infer<typeof sendMessageSchema>
