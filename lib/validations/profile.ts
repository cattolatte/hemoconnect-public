import { z } from "zod"

export const profileSetupSchema = z.object({
  // Step 1: Clinical Info
  hemophilia_type: z.enum(["a", "b", "c", "vwd", "other", "carrier", "caregiver"], {
    message: "Please select your hemophilia type",
  }),
  severity_level: z.enum(["mild", "moderate", "severe"], {
    message: "Please select a severity level",
  }),
  factor_level: z
    .number()
    .min(0, "Factor level must be between 0 and 100")
    .max(100, "Factor level must be between 0 and 100")
    .nullable()
    .optional(),
  current_treatment: z.enum(["prophylaxis", "on-demand", "emicizumab", "gene-therapy", "other", "none"], {
    message: "Please select your treatment type",
  }),

  // Step 2: Lifestyle
  age_range: z.enum(["under-18", "18-25", "26-35", "36-45", "46-55", "56-plus"], {
    message: "Please select your age range",
  }),
  life_stage: z.enum(["student", "young-adult", "parent", "professional", "retired", "caregiver"], {
    message: "Please select your life stage",
  }),
  location: z.string().optional().default(""),
  bio: z.string().max(500, "Bio must be under 500 characters").optional().default(""),
  topics: z.array(z.string()).default([]),

  // Step 3: Preferences
  peer_matching_enabled: z.boolean().default(true),
  email_notifications: z.boolean().default(true),
  weekly_digest: z.boolean().default(false),
  profile_visible: z.boolean().default(true),
})

export type ProfileSetupValues = z.infer<typeof profileSetupSchema>
