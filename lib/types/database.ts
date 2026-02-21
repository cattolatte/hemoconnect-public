// Database types matching the Supabase schema

export type HemophiliaType = "a" | "b" | "c" | "vwd" | "other" | "carrier" | "caregiver"
export type SeverityLevel = "mild" | "moderate" | "severe"
export type Treatment = "prophylaxis" | "on-demand" | "emicizumab" | "gene-therapy" | "other" | "none"
export type AgeRange = "under-18" | "18-25" | "26-35" | "36-45" | "46-55" | "56-plus"
export type LifeStage = "student" | "young-adult" | "parent" | "professional" | "retired" | "caregiver"
export type ResourceCategory = "treatment" | "fitness" | "lifestyle" | "wellness" | "insurance"
export type ConnectionStatus = "pending" | "connected" | "declined" | "blocked"
export type ModerationStatus = "pending" | "approved" | "flagged"
export type SearchMethod = "semantic" | "keyword"

// Phase 4 types
export type UserRole = "user" | "moderator" | "admin"
export type NotificationType =
  | "new_comment"
  | "post_liked"
  | "comment_liked"
  | "new_follower"
  | "connection_request"
  | "connection_accepted"
  | "badge_earned"
  | "mention"
  | "thread_reply"
  | "smart_match"
export type BadgeType =
  | "guiding_light"
  | "connector"
  | "first_post"
  | "helpful"
  | "active_member"
  | "community_builder"
export type ReportReason = "spam" | "harassment" | "misinformation" | "inappropriate" | "other"
export type ReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed"

export const INTEREST_TOPICS = [
  "Joint Health",
  "Prophylaxis",
  "Travel",
  "Exercise",
  "Parenting",
  "Mental Health",
  "Diet & Nutrition",
  "Gene Therapy",
  "Insurance",
  "School / Work",
] as const

export const HEMOPHILIA_TYPE_LABELS: Record<HemophiliaType, string> = {
  a: "Hemophilia A (Factor VIII)",
  b: "Hemophilia B (Factor IX)",
  c: "Hemophilia C (Factor XI)",
  vwd: "Von Willebrand Disease",
  other: "Other bleeding disorder",
  carrier: "Carrier",
  caregiver: "Caregiver / Family Member",
}

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
}

export const TREATMENT_LABELS: Record<Treatment, string> = {
  prophylaxis: "Prophylaxis",
  "on-demand": "On-demand",
  emicizumab: "Emicizumab (Hemlibra)",
  "gene-therapy": "Gene Therapy",
  other: "Other",
  none: "Not currently treating",
}

export const BADGE_LABELS: Record<BadgeType, { label: string; description: string; icon: string }> = {
  guiding_light: {
    label: "Guiding Light",
    description: "Answers received 10+ upvotes",
    icon: "Sun",
  },
  connector: {
    label: "Connector",
    description: "Successfully chatted with 3+ matched peers",
    icon: "Link",
  },
  first_post: {
    label: "First Steps",
    description: "Published first forum post",
    icon: "Pencil",
  },
  helpful: {
    label: "Helpful Hand",
    description: "Received 5+ likes on comments",
    icon: "HandHeart",
  },
  active_member: {
    label: "Active Voice",
    description: "Published 10+ forum posts",
    icon: "MessageSquare",
  },
  community_builder: {
    label: "Community Builder",
    description: "Joined 3+ micro-communities",
    icon: "Users",
  },
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam or advertising",
  harassment: "Harassment or bullying",
  misinformation: "Medical misinformation",
  inappropriate: "Inappropriate content",
  other: "Other",
}

// ---- Row types ----

export interface Profile {
  id: string
  first_name: string
  last_name: string
  bio: string | null
  location: string | null
  avatar_url: string | null
  role: UserRole
  hemophilia_type: HemophiliaType | null
  severity_level: SeverityLevel | null
  factor_level: number | null
  current_treatment: Treatment | null
  age_range: AgeRange | null
  life_stage: LifeStage | null
  topics: string[]
  peer_matching_enabled: boolean
  email_notifications: boolean
  weekly_digest: boolean
  profile_visible: boolean
  profile_setup_complete: boolean
  banned_at: string | null
  ban_reason: string | null
  suspended_until: string | null
  suspension_reason: string | null
  created_at: string
  updated_at: string
}

export interface AdminAuditLog {
  id: string
  admin_id: string
  action: string
  target_user_id: string | null
  target_post_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface ForumPost {
  id: string
  user_id: string
  title: string
  body: string
  excerpt: string
  tags: string[]
  auto_tags: string[]
  is_hot: boolean
  is_pinned: boolean
  view_count: number
  moderation_status: ModerationStatus
  ai_summary: string | null
  ai_summary_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface ForumComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface ForumLike {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export interface Resource {
  id: string
  title: string
  summary: string
  body: string | null
  category: ResourceCategory
  tags: string[]
  read_time_minutes: number
  featured: boolean
  icon: string
  external_url: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface SavedResource {
  id: string
  user_id: string
  resource_id: string
  created_at: string
}

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: ConnectionStatus
  created_at: string
  updated_at: string
}

// Phase 4 row types

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  badge_type: BadgeType | null
  message: string | null
  read: boolean
  created_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface PostSubscription {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_type: BadgeType
  earned_at: string
}

export interface MicroCommunity {
  id: string
  name: string
  description: string
  tag: string
  icon: string
  member_count: number
  created_at: string
}

export interface MicroCommunityMember {
  id: string
  community_id: string
  user_id: string
  joined_at: string
}

export interface ReportedContent {
  id: string
  reporter_id: string
  post_id: string | null
  comment_id: string | null
  reason: ReportReason
  description: string | null
  status: ReportStatus
  reviewed_by: string | null
  created_at: string
  resolved_at: string | null
}

// ---- Joined / enriched types for UI ----

export interface ForumPostWithAuthor extends ForumPost {
  author: Pick<Profile, "id" | "first_name" | "last_name">
  like_count: number
  comment_count: number
}

export interface ForumCommentWithAuthor extends ForumComment {
  author: Pick<Profile, "id" | "first_name" | "last_name">
  like_count: number
}

export interface ConversationWithDetails extends Conversation {
  other_user: Pick<Profile, "id" | "first_name" | "last_name">
  last_message: Pick<Message, "body" | "created_at" | "sender_id"> | null
  unread_count: number
}

export interface ProfileWithStats extends Profile {
  post_count: number
  connection_count: number
}

export interface NotificationWithActor extends Notification {
  actor: Pick<Profile, "id" | "first_name" | "last_name"> | null
}

export interface MicroCommunityWithMembership extends MicroCommunity {
  is_member: boolean
}

// ---- AI / Search types ----

export interface ForumSearchResult extends ForumPostWithAuthor {
  similarity?: number
  search_method: SearchMethod
}
