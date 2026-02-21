<div align="center">

# HemoConnect

**An AI-powered community platform where people with hemophilia connect, share, and thrive.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Database](#-database-schema) · [Roadmap](#-roadmap) · [Changelog](CHANGELOG.md)

</div>

---

## The Problem

Living with hemophilia can be isolating. Generic health forums are too broad, and existing tools focus solely on clinical tracking — bleed logs, infusion diaries, treatment adherence. What's missing is **human connection**: a place to find someone who truly understands your daily reality.

## The Solution

HemoConnect is a purpose-built social platform for the hemophilia community. It uses AI-driven matching to connect people based on their clinical profile (factor type, severity, treatment) and life stage — not just diagnosis. It pairs this with a community forum enhanced by semantic search, a curated resource library, private messaging, micro-communities, gamification, and a full admin/moderation system.

> **Philosophy:** We are _not_ a symptom tracker. No bleed logs. No infusion diaries. HemoConnect exists to foster meaningful connection and distill collective knowledge.

---

## &#x2728; Features

### Smart Peer Matching

A hybrid matching engine that combines rule-based clinical similarity (hemophilia type, severity, treatment, life stage, shared interests) with AI-powered vector cosine similarity using Hugging Face embeddings. Match scores help users find others who truly understand their journey.

### Community Forum

A safe space for open discussion with post categorization, commenting, nested likes, tag-based filtering, and tabs for trending topics and unanswered questions. Posts are automatically tagged using zero-shot AI classification and checked for toxicity.

### AI-Powered Semantic Search

Natural language search across forum discussions powered by Hugging Face embeddings. Ask questions like _"how to handle joint bleeds in teens"_ and get contextually relevant results, with automatic fallback to keyword search.

### Knowledge Distiller

AI-generated thread summaries that auto-update as discussions grow (5+ comments), surfacing the most valuable insights from lengthy conversations.

### Private Messaging

Real-time, one-on-one conversations between community members powered by Supabase Realtime. Includes unread indicators, conversation history, and the ability to start chats directly from peer profiles.

### Resource Library

A curated, searchable database of articles, guides, and documents organized by category (Treatment, Lifestyle, Research, Support, Insurance, Pediatric) with featured highlights and save-to-library functionality. Admins can create, edit, and manage resources.

### Notification System

Real-time notifications for new comments, post likes, followers, @mentions, thread replies, badge awards, and AI-powered smart match alerts. Bell icon with unread count, powered by Supabase Realtime subscriptions.

### Micro-Communities

Auto-generated tag-based groups (Joint Health Warriors, Mental Wellness Hub, Gene Therapy Pioneers, etc.) that users auto-join based on their selected interests. Each community has a member list and filtered forum posts.

### Gamification & Badges

Five achievement badges awarded automatically: Guiding Light (10+ liked comment), Connector (chatted with 3+ peers), First Steps (first post), Active Voice (10+ posts), and Community Builder (joined 3+ communities). Displayed on user profiles with tooltips.

### Follow & Bookmark System

Follow other users to stay connected. Bookmark forum posts for later reading with a dedicated bookmarks page. Subscribe to threads for reply notifications.

### Admin & Moderation

Full admin panel with dashboard stats, moderation queue for AI-flagged content, user report management, user role management (user/moderator/admin), ban/suspend controls, resource CRUD, and a complete audit log of all admin actions.

### Clinical Profile System

A guided, multi-step profile setup wizard that collects hemophilia type, severity, factor level, treatment approach, life stage, and community interests — powering both peer matching and personalized content. Fully editable after setup.

### Content Moderation

Automatic toxicity detection on posts and comments using Hugging Face text classification. Flagged content enters a moderation queue for admin review. Users can also report content with categorized reasons.

---

## &#x1F3D7; Architecture

HemoConnect follows a strict **Server Components First** architecture built on the Next.js 16 App Router.

```
app/
├── (auth)/                       # Auth route group (no sidebar)
│   ├── login/page.tsx            # Login page
│   ├── signup/page.tsx           # Signup page
│   └── auth-callback/route.ts   # OAuth callback handler
│
├── (main)/                       # Authenticated route group (with sidebar)
│   ├── layout.tsx                # Server layout — fetches user, wraps in sidebar
│   ├── dashboard/
│   │   ├── page.tsx              # Server: fetches stats, activity, peers
│   │   └── dashboard-content.tsx # Client: interactive dashboard UI
│   ├── forum/
│   │   ├── page.tsx              # Server: fetches all posts
│   │   ├── forum-content.tsx     # Client: tab filtering, semantic search
│   │   └── [postId]/
│   │       ├── page.tsx          # Server: fetches post + comments
│   │       └── post-detail.tsx   # Client: likes, replies, bookmarks, report
│   ├── messages/
│   │   ├── page.tsx              # Server: fetches conversations
│   │   └── messages-content.tsx  # Client: realtime chat UI
│   ├── profile/
│   │   ├── setup/
│   │   │   ├── page.tsx          # Server: fetches existing profile
│   │   │   └── profile-setup-form.tsx  # Client: 3-step wizard
│   │   └── [userId]/
│   │       ├── page.tsx          # Server: fetches profile + posts + badges
│   │       └── profile-view.tsx  # Client: tabbed profile, edit dialog
│   ├── resources/
│   │   ├── page.tsx              # Server: fetches resources + saved IDs
│   │   └── resources-content.tsx # Client: category tabs, save toggles
│   ├── bookmarks/
│   │   └── page.tsx              # Server: fetches bookmarked posts
│   ├── communities/
│   │   ├── page.tsx              # Server: fetches communities
│   │   ├── communities-content.tsx  # Client: community grid, join/leave
│   │   └── [communityId]/
│   │       ├── page.tsx          # Server: fetches community details
│   │       └── community-detail.tsx  # Client: members, filtered posts
│   └── admin/
│       ├── page.tsx              # Admin dashboard (stats, audit log)
│       ├── moderation/page.tsx   # AI-flagged content queue
│       ├── reports/page.tsx      # User-submitted reports
│       ├── users/page.tsx        # User management (roles, bans)
│       └── resources/page.tsx    # Resource CRUD management
│
├── banned/page.tsx               # Banned/suspended user page
├── layout.tsx                    # Root layout (fonts, theme, toaster)
└── page.tsx                      # Landing page (public)
```

### Core Patterns

| Pattern | Description |
|---------|-------------|
| **Server Component Wrapper** | Every `page.tsx` is a Server Component that fetches data and passes it as props to a `"use client"` child. Zero client-side data fetching on initial load. |
| **Server Actions** | All mutations go through `'use server'` functions in `lib/actions/`. No API routes needed. |
| **Supabase SSR** | Auth is handled exclusively via `@supabase/ssr` with `getAll`/`setAll` cookie API. No legacy helpers. |
| **Supabase Realtime** | Client-side subscriptions for live message and notification updates. |
| **Async Params** | All dynamic route `params` are awaited as Promises (Next.js 16 requirement). |
| **asChild Rendering** | Buttons wrapping links always use the shadcn `asChild` pattern to prevent hydration mismatches. |
| **Rate Limiting** | In-memory token bucket rate limiter protects sensitive server actions. |

---

## &#x1F4BB; Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | [Next.js](https://nextjs.org/) (App Router + Turbopack) | `16.0.0` |
| **Runtime** | [React](https://react.dev/) | `19.2.0` |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) | `5.x` |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (OKLCh color space) | `4.x` |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (New York style) | 20 components |
| **Icons** | [Lucide React](https://lucide.dev/) | `0.548.x` |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | `12.x` |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod v4](https://zod.dev/) | `7.x` / `4.x` |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + pgvector) | `2.76.x` |
| **Auth** | [Supabase Auth](https://supabase.com/docs/guides/auth) (SSR) | `0.7.x` |
| **Realtime** | [Supabase Realtime](https://supabase.com/docs/guides/realtime) | Built-in |
| **AI / NLP** | [Hugging Face](https://huggingface.co/) Inference APIs | `@huggingface/inference` |
| **Deployment** | [Vercel](https://vercel.com/) | - |

### UI Component Library

<details>
<summary><b>20 shadcn/ui components installed</b></summary>

`Avatar` · `Badge` · `Button` · `Card` · `Dialog` · `Dropdown Menu` · `Form` · `Input` · `Label` · `Progress` · `Radio Group` · `Scroll Area` · `Select` · `Separator` · `Sheet` · `Skeleton` · `Sonner` · `Switch` · `Tabs` · `Textarea` · `Tooltip`

</details>

<details>
<summary><b>4 custom animation components</b></summary>

| Component | Purpose |
|-----------|---------|
| `AnimatedSection` | Fade-in-up on scroll using `useInView` |
| `AnimatedCounter` | Animated number counting for dashboard stats |
| `StaggerChildren` | Sequential child reveal animations |
| `PageTransition` | Route transition wrapper with `AnimatePresence` |

</details>

---

## &#x1F5C4; Database Schema

18 PostgreSQL tables across 6 migrations with **Row Level Security enabled on all tables**.

```
Profiles & Auth         Forum & Content          Messaging & Social
┌──────────────────┐   ┌──────────────────┐     ┌──────────────────┐
│ profiles         │   │ forum_posts      │     │ conversations    │
│ ─────────────    │   │ forum_comments   │     │ messages         │
│ hemophilia_type  │   │ forum_likes      │     │ connections      │
│ severity_level   │   │                  │     │ follows          │
│ factor_level     │   │ resources        │     │ bookmarks        │
│ current_treatment│   │ saved_resources  │     │ post_subscriptions│
│ life_stage       │   │                  │     │                  │
│ topics[]         │   │ reported_content │     │                  │
│ role             │   │                  │     │                  │
│ avatar_url       │   │                  │     │                  │
│ embedding        │   │                  │     │                  │
└──────────────────┘   └──────────────────┘     └──────────────────┘

Notifications           Communities              Admin
┌──────────────────┐   ┌──────────────────┐     ┌──────────────────┐
│ notifications    │   │ micro_communities│     │ admin_audit_log  │
│ user_badges      │   │ micro_community_ │     │                  │
│                  │   │   members        │     │                  │
└──────────────────┘   └──────────────────┘     └──────────────────┘
```

### Key Database Features

- **Auto Profile Creation** — A PostgreSQL trigger automatically creates a profile row when a user signs up via Supabase Auth
- **Timestamp Management** — `updated_at` columns auto-update via database triggers
- **pgvector Embeddings** — 384-dimensional vectors on profiles and posts with HNSW indexes for fast similarity search
- **RPC Match Functions** — `match_profiles()` and `match_forum_posts()` for vector similarity queries
- **Unique Conversation Pairs** — Expression-based unique indexes using `least()`/`greatest()` ensure one conversation per user pair
- **Connection Deduplication** — Same expression index pattern prevents duplicate connection requests
- **Realtime Enabled** — Messages and notifications tables broadcast changes via Supabase Realtime
- **Seed Data** — Pre-populated resource library and 10 micro-communities
- **Admin Audit Logging** — All admin actions tracked with actor, target, reason, and timestamp

### Server Actions

| Module | Functions |
|--------|-----------|
| `auth` | `signUp`, `signIn`, `signOut`, `signInWithGoogle` |
| `user` | `getUser` |
| `profile` | `getProfile`, `getProfileById`, `saveProfile`, `updateProfile`, `getRecentPostsByUser` |
| `forum` | `getPosts`, `searchPostsSemantic`, `getPostById`, `createPost`, `createComment`, `togglePostLike`, `toggleCommentLike`, `regenerateSummary` |
| `messages` | `getConversations`, `getMessages`, `sendMessage`, `markMessagesAsRead`, `startConversation` |
| `dashboard` | `getDashboardStats`, `getRecentActivity`, `getSuggestedPeers` |
| `resources` | `getResources`, `toggleSaveResource`, `getSavedResourceIds`, `createResource`, `updateResource`, `deleteResource`, `toggleFeatured` |
| `social` | `toggleFollow`, `isFollowing`, `getFollowerCount`, `getFollowingCount`, `toggleBookmark`, `isBookmarked`, `getBookmarkedPosts`, `toggleSubscription`, `isSubscribed`, `getSubscribers`, `reportContent`, `searchUsers` |
| `notifications` | `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `createNotification` |
| `communities` | `getCommunities`, `getCommunityById`, `getCommunityMembers`, `joinCommunity`, `leaveCommunity`, `autoJoinCommunities` |
| `admin` | `getAdminStats`, `getFlaggedPosts`, `approvePost`, `rejectPost`, `getReports`, `resolveReport`, `getAllUsers`, `updateUserRole`, `banUser`, `unbanUser`, `suspendUser`, `unsuspendUser`, `deleteUser`, `deleteUserPosts`, `getAuditLog`, `getCurrentUserRole` |
| `storage` | `uploadAvatar`, `removeAvatar` |

### AI Services

| Service | Functions |
|---------|-----------|
| `huggingface` | `generateEmbedding`, `checkToxicity`, `classifyTopics`, `summarizeThread` |
| `matching` | `calculateRuleScore`, `calculateHybridScore` |
| `badges` | `checkGuidingLight`, `checkConnector`, `checkFirstPost`, `checkActiveMember`, `checkCommunityBuilder`, `getUserBadges` |

---

## &#x1F680; Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.18+
- A [Supabase](https://supabase.com/) project (free tier works)
- _(Optional)_ A [Hugging Face](https://huggingface.co/) API token for AI features

### 1. Clone & Install

```bash
git clone https://github.com/cattolatte/HemoConnect.git
cd HemoConnect
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face (optional — for AI features)
HUGGING_FACE_TOKEN=your_hugging_face_read_token
```

> You can find your Supabase credentials in **Project Settings > API** on the [Supabase Dashboard](https://supabase.com/dashboard).

### 3. Set Up the Database

Run all 6 migration files in order in the **SQL Editor** of your Supabase Dashboard:

1. `supabase/migrations/00001_initial_schema.sql` — Core tables, RLS, triggers, seed data
2. `supabase/migrations/00002_vector_embeddings.sql` — pgvector, embedding columns, match functions
3. `supabase/migrations/00003_ai_features.sql` — Auto-tagging, AI summary columns
4. `supabase/migrations/00004_phase4_schema.sql` — Notifications, follows, bookmarks, communities, badges, reports
5. `supabase/migrations/00005_admin_expansion.sql` — Ban/suspend system, audit log
6. `supabase/migrations/00006_admin_resources_rls.sql` — Admin resource management policies

### 4. Bootstrap Admin User

After signing up your first account, promote yourself to admin via the Supabase SQL Editor:

```sql
-- Replace with your email address
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create optimized production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |

---

## &#x1F5FA; Roadmap

- [x] **Phase 1** — Project Foundation & Landing Page
  - Next.js 16 setup, Tailwind v4 theming, Framer Motion animations, warm coral/stone design system, responsive sidebar layout
- [x] **Phase 2** — Authentication & Data Layer
  - Supabase Auth (email + Google OAuth), middleware route protection, full PostgreSQL schema with RLS, all pages wired to real data via server actions
- [x] **Phase 3** — AI Features
  - Hugging Face embeddings, semantic forum search, AI-powered peer matching, content moderation, auto-tagging, knowledge distiller (thread summaries)
- [x] **Phase 4** — Feature Expansion
  - Notifications (realtime), follow/bookmark/subscribe system, micro-communities, gamification badges, content reporting, loading skeletons, error boundaries, create post dialog, rate limiting
- [x] **Phase 4.5** — Admin, Moderation & Polish
  - Admin dashboard with audit log, moderation queue, user management (ban/suspend/roles), resource CRUD, profile edit dialog, profile page redesign, UI polish
- [x] **Phase 5** — Production Readiness & Feedback
  - Anonymous feedback system (Formspree), SEO (sitemap.xml, robots.txt, page metadata), global error & 404 pages, security headers (HSTS, X-Frame-Options, CSP), Next.js image optimization config

---

## &#x1F4C1; Project Structure

```
hemoconnect/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Public auth pages (login, signup, callback)
│   ├── (main)/                   # Authenticated pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── forum/                # Community forum + post detail
│   │   ├── messages/             # Private messaging
│   │   ├── profile/              # Profile setup + view
│   │   ├── resources/            # Resource library
│   │   ├── bookmarks/            # Saved posts
│   │   ├── communities/          # Micro-communities
│   │   ├── feedback/             # Anonymous feedback form (Formspree)
│   │   └── admin/                # Admin panel (dashboard, moderation, users, reports, resources)
│   ├── banned/                   # Banned/suspended user page
│   ├── sitemap.ts                # Dynamic sitemap.xml generation
│   ├── robots.ts                 # Crawler directives (robots.txt)
│   ├── global-error.tsx          # Root-level error boundary
│   ├── not-found.tsx             # Custom 404 page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Tailwind v4 theme (OKLCh colors)
│
├── components/
│   ├── animations/               # Framer Motion wrapper components (4)
│   ├── shared/                   # Sidebar, Navbar, NotificationBell, CreatePostDialog, etc. (7)
│   └── ui/                       # shadcn/ui primitives (20 components)
│
├── lib/
│   ├── actions/                  # Server Actions (12 modules, 87+ functions)
│   ├── supabase/                 # Supabase clients (server, client, middleware)
│   ├── types/                    # TypeScript type definitions (50+ types)
│   ├── utils/                    # Utility functions (time formatting)
│   ├── validations/              # Zod v4 schemas (profile, forum, message)
│   └── rate-limit.ts             # Token bucket rate limiter
│
├── services/                     # External integrations
│   ├── huggingface.ts            # AI: embeddings, moderation, tagging, summarization
│   ├── matching.ts               # Peer matching: rule-based + hybrid scoring
│   └── badges.ts                 # Gamification: badge checking + awarding
│
├── supabase/migrations/          # 6 SQL migration files
├── middleware.ts                  # Auth session refresh + route protection
└── next.config.ts                # Next.js config (React Compiler, security headers, image patterns)
```

---

## &#x1F91D; Contributing

Contributions are welcome! Whether it's a bug report, feature suggestion, or pull request — we'd love your input.

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m "Add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Open** a Pull Request

> Please make sure your code passes `npm run build` and `npm run lint` before submitting.

---

## &#x1F512; Security & Privacy

- **Row Level Security** is enabled on every database table — users can only access their own data
- **Security Headers** — X-Frame-Options (DENY), X-Content-Type-Options (nosniff), HSTS, Referrer-Policy, and Permissions-Policy on all routes
- **Rate Limiting** — Token bucket rate limiter protects against abuse on posts, comments, messages, reports, and uploads
- **Content Moderation** — AI-powered toxicity detection flags harmful content automatically
- **Admin Audit Log** — All admin actions are logged with full traceability
- **Ban/Suspend System** — Middleware-level enforcement blocks banned and suspended users from accessing the platform
- **SEO Controls** — `robots.txt` disallows crawling of private routes; admin pages marked `noindex`
- **Medical Disclaimer** — All AI-generated content carries a disclaimer that it is not medical advice
- **No sensitive health tracking** — We do not store bleed logs, infusion records, or clinical treatment data
- **Supabase Auth** — Passwords are never stored in application code; authentication is handled entirely by Supabase

---

## &#x1F4C4; License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with &#x2764; for the hemophilia community

**[HemoConnect](https://github.com/cattolatte/HemoConnect)** · Made with Next.js, Supabase & AI

</div>
