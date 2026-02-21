# Changelog

All notable changes to HemoConnect are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] — 2025-06-XX — Production Readiness & Feedback (Phase 5)

### Added

- **Anonymous Feedback System** — Star rating (1-5), category selector (General/Feature Request/Bug Report), free-text input with Formspree integration; accessible from sidebar and landing page footer
- **SEO: Sitemap** — Dynamic `sitemap.xml` generation with all public routes, priority and change frequency settings
- **SEO: Robots** — `robots.txt` with allow/disallow rules for public and private routes
- **SEO: Page Metadata** — Title and description metadata added to all 15+ pages; admin pages marked `noindex`; dynamic `generateMetadata()` for community detail pages
- **Global Error Page** — `global-error.tsx` catches root-level errors with branded error UI and reload button
- **Custom 404 Page** — `not-found.tsx` with HemoConnect branding, friendly message, and "Go Home" button
- **Security Headers** — X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, HSTS, Permissions-Policy applied to all routes via `next.config.ts`
- **Image Remote Patterns** — Supabase Storage URLs configured in `next.config.ts` for Next.js `<Image>` component support

### Changed

- Sidebar navigation: added "Feedback" link with `MessageSquareHeart` icon
- Landing page footer: added "Give Feedback" link
- `next.config.ts` expanded from 1 option to full production configuration (headers, images)

---

## [0.5.0] — 2025-06-XX — Admin, Moderation & Polish

### Added

- **Admin Dashboard** — Stats overview (users, posts, flagged content, reports, banned users, communities), quick action cards with hover-scroll marquee, audit log activity feed
- **Moderation Queue** — Review AI-flagged posts, approve or reject content with one click
- **Report System** — Users can report posts/comments (spam, harassment, misinformation, inappropriate, other); admins can review and resolve reports
- **User Management Panel** — View all users, change roles (user/moderator/admin), ban/unban, suspend/unsuspend, delete accounts and posts
- **Admin Resource Management** — Full CRUD for resource articles (create, edit, delete, toggle featured) with role-based permissions (moderators can add/edit, only admins can delete)
- **Admin Audit Log** — All admin actions are logged with actor, target, reason, and timestamp
- **Banned/Suspended User Page** — Dedicated `/banned` page with reason display, suspension expiry countdown, and sign out button
- **Middleware Ban Enforcement** — Single optimized DB query checks banned/suspended status and admin role on every request
- **Admin Route Protection** — `/admin/*` routes restricted to admin and moderator roles
- **Profile Edit Dialog** — Full edit capability for name, bio, location, hemophilia type, severity, treatment, and life stage
- **Profile Page Redesign** — Tabbed layout (About/Activity/Badges), large avatar with banner overlap, animated stats row, life stage icons, empty states with CTAs
- **Logged-in User Redirect** — Authenticated users visiting `/` are automatically redirected to `/dashboard`
- **Header Border Alignment** — Fixed sidebar and main content header height mismatch (`h-14` to `h-16`)

### Changed

- Admin dashboard stat cards: replaced "Total Comments" with "Banned Users" count
- Quick Action cards use 4-column grid with hover-scroll text animation
- Profile page widened from `max-w-3xl` to `max-w-4xl`
- Avatar uses solid background mask to prevent banner gradient bleed-through
- Card `py-0` override on profile header for edge-to-edge banner

### Fixed

- `Type 'unknown' is not assignable to type 'ReactNode'` — Used ternary instead of `&&` for unknown-typed values in JSX
- `Property 'catch' does not exist on type 'PromiseLike'` — Supabase returns `PromiseLike`, wrapped in try/catch instead of `.catch()`
- Quick Action card text overflow — Text no longer clips outside card boundaries
- Profile avatar pink bleed — Banner gradient no longer shows through avatar border
- Profile banner gap — Banner now fills the full card width with no padding gap at top

### Database

- Migration `00005_admin_expansion.sql` — Adds `banned_at`, `ban_reason`, `suspended_until`, `suspension_reason` to profiles; creates `admin_audit_log` table
- Migration `00006_admin_resources_rls.sql` — RLS policies for admin/moderator resource management

---

## [0.4.0] — 2025-06-XX — Feature Expansion (Phase 4)

### Added

- **Notification System** — Bell icon in header with real-time unread count, dropdown with recent notifications, mark as read
- **Supabase Realtime** — Live updates for new messages and notifications via PostgreSQL changes
- **Follow System** — Follow/unfollow users, follower and following counts on profiles
- **Bookmark System** — Bookmark forum posts, dedicated `/bookmarks` page, bookmark toggle on post detail
- **Thread Subscriptions** — Subscribe to posts for reply notifications
- **@Mentions** — Mention users in comments to send them notifications
- **Content Reporting** — Report posts/comments with reason categories, rate-limited
- **Gamification Badges** — 5 badge types (Guiding Light, Connector, First Post, Active Member, Community Builder) with automatic awarding
- **Micro-Communities** — 10 auto-seeded tag-based communities, join/leave functionality, community detail pages with filtered posts and member lists
- **Auto-Join Communities** — Users automatically join matching communities during profile setup based on selected topics
- **Smart Notifications** — AI-powered notifications when new posts match a user's interests (topic overlap >= 2)
- **Loading Skeletons** — `loading.tsx` files for dashboard, forum, forum post, messages, resources, and profile routes
- **Error Boundaries** — `error.tsx` files for main layout, dashboard, forum, and messages with retry buttons
- **Create Post Dialog** — Modal with title, body, tag selection, and Zod validation wired to "New Post" button
- **Rate Limiting** — In-memory token bucket rate limiter for posts, comments, messages, reports, and uploads
- **Browser Supabase Client** — `lib/supabase/client.ts` for client-side Realtime subscriptions

### Changed

- Sidebar navigation updated with Bookmarks, Communities, and conditional Admin links
- Forum content tabs now include "Bookmarks" filter
- Post detail page wired with bookmark toggle, subscribe bell, and report flag
- Profile page shows Follow/Unfollow button, follower/following counts, and earned badges
- Dashboard shows badge progress card

### Database

- Migration `00004_phase4_schema.sql` — Creates: notifications, bookmarks, follows, post_subscriptions, user_badges, micro_communities, micro_community_members, reported_content; adds `role` and `avatar_url` to profiles; seeds 10 micro-communities; enables Supabase Realtime

---

## [0.3.0] — 2025-06-XX — AI-Powered Features (Phase 3)

### Added

- **Semantic Forum Search** — Natural language search using Hugging Face embeddings with fallback to keyword search
- **AI Peer Matching** — Hybrid matching combining rule-based clinical similarity with vector cosine similarity
- **Content Moderation** — Automatic toxicity detection on posts and comments using Hugging Face text classification
- **Auto-Tagging** — Zero-shot topic classification automatically tags new forum posts
- **Knowledge Distiller** — AI-generated thread summaries that update as discussions grow (5+ comments)
- **Profile Embeddings** — Vector embeddings generated from clinical profile data during profile setup
- **Post Embeddings** — Vector embeddings generated for forum posts enabling semantic similarity search
- **Suggested Peers** — Dashboard widget showing AI-matched peer suggestions with match scores

### Database

- Migration `00002_vector_embeddings.sql` — Enables pgvector, adds embedding columns, creates HNSW indexes and RPC match functions
- Migration `00003_ai_features.sql` — Adds `auto_tags`, `ai_summary`, `ai_summary_updated_at` to forum_posts

---

## [0.2.0] — 2025-06-XX — Authentication & Data Layer (Phase 2)

### Added

- **Supabase Auth** — Email/password signup and login with `@supabase/ssr` cookie-based sessions
- **Google OAuth** — One-click sign-in with Google
- **Middleware Route Protection** — Unauthenticated users redirected to `/login`, authenticated users redirected from auth pages to `/dashboard`
- **Profile Setup Wizard** — 3-step guided form (Clinical Info, Lifestyle, Preferences) with Zod validation
- **Dashboard** — Welcome banner, stats cards (peer matches, unread messages, forum posts, saved resources), recent activity feed, suggested peers
- **Community Forum** — Post listing with tabs (All, Trending, Unanswered), tag filtering, search, post creation, comments, likes on posts and comments
- **Private Messaging** — Conversation list with unread indicators, real-time chat UI, message sending, conversation creation from profiles
- **Resource Library** — Categorized articles (Treatment, Lifestyle, Research, Support, Insurance, Pediatric), featured highlights, save-to-library, search and tab filtering
- **User Profiles** — Profile view with clinical info badges, recent posts, connection stats
- **Smart Peer Matching** — Rule-based matching on hemophilia type, severity, treatment, life stage, and shared interests
- **Server Actions** — All data mutations via `'use server'` functions (no API routes)
- **Auto Profile Creation** — PostgreSQL trigger creates profile row on auth signup

### Database

- Migration `00001_initial_schema.sql` — 9 tables (profiles, forum_posts, forum_comments, forum_likes, conversations, messages, resources, saved_resources, connections), RLS policies, triggers, indexes, helper functions, seed data

---

## [0.1.0] — 2025-06-XX — Project Foundation (Phase 1)

### Added

- **Next.js 16 Setup** — App Router with Turbopack, TypeScript strict mode, React 19.2
- **Design System** — Tailwind CSS v4 with OKLCh color space, warm coral/stone theme, dark mode support
- **shadcn/ui Integration** — 20+ UI components (New York style)
- **Animated Landing Page** — Hero section with floating blobs, feature cards with stagger animations, testimonials, CTA
- **Framer Motion Animations** — AnimatedSection (scroll reveal), AnimatedCounter (number counting), StaggerChildren (sequential reveal), PageTransition (route transitions)
- **Custom CSS Animations** — `gradient-shift`, `float`, `shimmer`, `pulse-glow`, `bounce-subtle`, `online-pulse` keyframes
- **Utility Classes** — `.glass` (glassmorphism), `.hover-glow`, `.hover-lift`, `.shimmer-btn`, `.animated-gradient`
- **Auth Pages** — Login and signup page layouts
- **Responsive Sidebar Layout** — Collapsible sidebar with mobile sheet drawer, sticky header with glassmorphism
- **Theme Toggle** — Dark/light mode switcher with system preference detection
- **Geist Fonts** — Sans and Mono via `next/font/google`

---

## File Counts by Version

| Version | New Files | Modified Files | Total Routes |
|---------|-----------|----------------|--------------|
| 0.1.0   | ~25       | —              | 3            |
| 0.2.0   | ~30       | ~5             | 10           |
| 0.3.0   | ~8        | ~6             | 10           |
| 0.4.0   | ~35       | ~12            | 19           |
| 0.5.0   | ~15       | ~10            | 21           |
| 0.6.0   | ~6        | ~17            | 22           |
