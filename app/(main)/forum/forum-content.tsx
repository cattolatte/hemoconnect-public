"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CreatePostDialog } from "@/components/shared/CreatePostDialog"
import {
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  MessageCircle,
  Clock,
  TrendingUp,
  HelpCircle,
  X,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { timeAgo } from "@/lib/utils/time"
import { searchPostsSemantic } from "@/lib/actions/forum"
import type { ForumPostWithAuthor, ForumSearchResult, SearchMethod } from "@/lib/types/database"

interface ForumContentProps {
  initialPosts: ForumPostWithAuthor[]
}

function getInitials(author: { first_name: string; last_name: string }) {
  return [author.first_name, author.last_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"
}

function getAuthorName(author: { first_name: string; last_name: string }) {
  return `${author.first_name} ${author.last_name}`.trim() || "Unknown"
}

export function ForumContent({ initialPosts }: ForumContentProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ForumSearchResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMethod, setSearchMethod] = useState<SearchMethod | null>(null)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const posts = initialPosts

  // Debounced semantic search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults(null)
      setSearchMethod(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchPostsSemantic(searchQuery)
        setSearchResults(result.posts)
        setSearchMethod(result.searchMethod)
      } catch {
        setSearchResults(null)
        setSearchMethod(null)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults(null)
    setSearchMethod(null)
    setIsSearching(false)
  }

  // Determine which posts to display
  const displayPosts: (ForumPostWithAuthor | ForumSearchResult)[] = searchResults !== null
    ? searchResults
    : activeTab === "all"
      ? posts
      : activeTab === "trending"
        ? posts.filter((p) => p.is_hot)
        : activeTab === "unanswered"
          ? posts.filter((p) => p.comment_count === 0)
          : posts // "recent" — already sorted by created_at desc

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <MessageSquare className="size-8 text-primary" />
            Community Forum
          </h1>
          <p className="mt-1 text-muted-foreground">
            Share experiences, ask questions, and connect with others
          </p>
        </div>
        <Button size="lg" onClick={() => setCreatePostOpen(true)}>
          <Plus className="mr-2 size-4" />
          New Post
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search discussions... (AI-powered)"
            className="pl-9 pr-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="health">Health Tips</SelectItem>
            <SelectItem value="treatment">Treatment</SelectItem>
            <SelectItem value="lifestyle">Lifestyle</SelectItem>
            <SelectItem value="parenting">Parenting</SelectItem>
            <SelectItem value="fitness">Fitness</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search method indicator */}
      {searchResults !== null && !isSearching && (
        <div className="flex items-center gap-2">
          {searchMethod === "semantic" ? (
            <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="size-3" />
              AI-powered search
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Search className="size-3" />
              Keyword search
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          </span>
        </div>
      )}

      {/* Tabs (hidden during search) */}
      {searchResults === null && !isSearching && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <MessageSquare className="size-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-1.5">
              <TrendingUp className="size-3.5" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-1.5">
              <Clock className="size-3.5" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="unanswered" className="gap-1.5">
              <HelpCircle className="size-3.5" />
              Unanswered
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Post List */}
      <div className="space-y-3">
        {isSearching && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Searching with AI...
            </CardContent>
          </Card>
        )}

        {!isSearching && displayPosts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchResults !== null
                ? "No posts match your search. Try different keywords."
                : "No posts yet. Be the first to start a discussion!"}
            </CardContent>
          </Card>
        )}

        {!isSearching && displayPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="hover-lift hover-glow transition-all">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Avatar className="mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(post.author)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Button
                          asChild
                          variant="link"
                          className="h-auto p-0 text-left text-base font-semibold"
                        >
                          <Link href={`/forum/${post.id}`}>
                            {post.title}
                            {post.is_hot && (
                              <Badge
                                variant="destructive"
                                className="ml-2 text-xs"
                              >
                                Hot
                              </Badge>
                            )}
                          </Link>
                        </Button>
                        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {getAuthorName(post.author)}
                          </span>
                          <span>&middot;</span>
                          <span>{timeAgo(post.created_at)}</span>
                          {"similarity" in post && (post as ForumSearchResult).similarity !== undefined && (
                            <>
                              <span>&middot;</span>
                              <span className="text-primary text-xs">
                                {Math.round(((post as ForumSearchResult).similarity ?? 0) * 100)}% match
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {(post.auto_tags ?? [])
                          .filter((t) => !post.tags.includes(t))
                          .map((tag) => (
                            <Badge
                              key={`auto-${tag}`}
                              variant="secondary"
                              className="gap-1 text-xs bg-primary/10 text-primary border-primary/20"
                            >
                              <Sparkles className="size-2.5" />
                              {tag}
                            </Badge>
                          ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="size-3.5" />
                          {post.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="size-3.5" />
                          {post.comment_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />
    </div>
  )
}
