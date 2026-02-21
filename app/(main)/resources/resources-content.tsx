"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Search,
  Clock,
  ExternalLink,
  Heart,
  Stethoscope,
  Dumbbell,
  Plane,
  Brain,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Resource } from "@/lib/types/database"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Dumbbell,
  Plane,
  Brain,
  Shield,
  Heart,
  BookOpen,
}

interface ResourcesContentProps {
  initialResources: Resource[]
}

export function ResourcesContent({ initialResources }: ResourcesContentProps) {
  const [activeTab, setActiveTab] = useState("all")

  const filteredResources =
    activeTab === "all"
      ? initialResources
      : initialResources.filter((r) => r.category === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <motion.div
            whileHover={{ scale: 1.15, rotate: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <BookOpen className="size-8 text-primary" />
          </motion.div>
          Resource Library
        </h1>
        <p className="mt-1 text-muted-foreground">
          Curated articles, guides, and tools for the hemophilia community
        </p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        className="flex flex-col gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search resources..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Most Relevant</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="shortest">Shortest Read</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="fitness">Fitness</TabsTrigger>
            <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Resource Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No resources available in this category yet.
          </div>
        )}
        {filteredResources.map((resource, i) => {
          const IconComponent = ICON_MAP[resource.icon] || BookOpen
          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
            >
              <Card className="group flex h-full flex-col hover-lift hover-glow transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <motion.div
                      className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="size-5 text-primary" />
                    </motion.div>
                    {resource.featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3 text-lg leading-tight transition-colors group-hover:text-primary">
                    {resource.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {resource.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {resource.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {resource.read_time_minutes} min read
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Read
                      <ExternalLink className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Medical Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Medical Disclaimer
              </p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                The resources provided here are for informational purposes only and
                should not be considered medical advice. Always consult your
                hematologist or healthcare provider before making any changes to your
                treatment plan. HemoConnect does not endorse any specific treatment
                or product.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
