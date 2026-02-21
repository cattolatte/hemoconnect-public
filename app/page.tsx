"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, Users, Search, BookOpen, Shield, MessageCircle, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/shared/Navbar"
import { AnimatedSection } from "@/components/animations/animated-section"
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children"

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description:
      "Find peers who truly understand your journey, matched by clinical profile, life stage, and shared experiences.",
    gradient: "from-rose-500/10 to-orange-500/10",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Search discussions by meaning, not just keywords. Our AI understands what you are really looking for.",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: BookOpen,
    title: "Resource Library",
    description:
      "Curated resources with AI-generated summaries to help you stay informed and empowered.",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
]

const testimonials = [
  {
    initials: "SP",
    name: "Sarah P.",
    condition: "Severe Hemophilia A",
    text: "Finding others who understand the daily reality of living with hemophilia changed everything for me.",
  },
  {
    initials: "MR",
    name: "Mike R.",
    condition: "Moderate Hemophilia B",
    text: "The smart matching connected me with a mentor who helped me navigate college with hemophilia.",
  },
  {
    initials: "LC",
    name: "Lisa C.",
    condition: "Parent of child with Hemophilia A",
    text: "As a parent, having a community of experienced families to lean on has been invaluable.",
  },
]

const stats = [
  { label: "Community Members", value: "2,500+" },
  { label: "Discussions", value: "10K+" },
  { label: "Resources", value: "500+" },
  { label: "Peer Matches", value: "8,000+" },
]

const heroWords = ["Connect.", "Share.", "Thrive."]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <Navbar />

      {/* ─── Hero Section ───────────────────────────── */}
      <section className="relative overflow-hidden py-28 md:py-40">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animated-gradient bg-gradient-to-br from-primary/8 via-accent/5 to-rose-500/8" />

        {/* Floating decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] size-64 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[15%] size-48 rounded-full bg-rose-400/8 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-accent/5 blur-3xl animate-float-slow" />

          {/* Floating hearts */}
          <motion.div
            className="absolute top-32 right-[20%] text-primary/20 hidden md:block"
            animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="size-8" />
          </motion.div>
          <motion.div
            className="absolute bottom-40 left-[12%] text-primary/15 hidden md:block"
            animate={{ y: [10, -15, 10], rotate: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="size-6" />
          </motion.div>
          <motion.div
            className="absolute top-48 left-[25%] text-rose-400/15 hidden md:block"
            animate={{ y: [-8, 12, -8], rotate: [5, -5, 5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Sparkles className="size-5" />
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5 text-sm">
              <Heart className="size-3.5 text-primary" />
              For the Hemophilia Community
            </Badge>
          </motion.div>

          {/* Staggered word reveal */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            {heroWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3 + i * 0.15,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className={`inline-block mr-3 md:mr-4 ${
                  i === 2 ? "text-primary" : ""
                }`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            A warm, supportive community where people with hemophilia connect
            with peers, share experiences, and access AI-powered resources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="text-base shimmer-btn group">
              <Link href="/signup">
                Join the Community
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/login">Sign In</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────────── */}
      <section className="border-y bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4">
          <StaggerChildren className="grid grid-cols-2 divide-x md:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="py-8 text-center">
                  <p className="text-2xl font-bold text-primary md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ─── Features Section ───────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4">
          <AnimatedSection className="text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Built for Your Community
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-muted-foreground">
              Every feature is designed with the hemophilia community in mind.
            </p>
          </AnimatedSection>

          <StaggerChildren className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card className="group relative overflow-hidden border hover-lift hover-glow">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                  <CardContent className="relative pt-8 pb-6 text-center">
                    <motion.div
                      className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <feature.icon className="size-7 text-primary" />
                    </motion.div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ─── Testimonials Section ───────────────────── */}
      <section className="bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <AnimatedSection>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              You Are Not Alone
            </h2>
            <p className="mx-auto mb-16 max-w-lg text-muted-foreground">
              Join a growing community of people who understand what it means to
              live with hemophilia.
            </p>
          </AnimatedSection>

          <StaggerChildren className="grid gap-6 sm:grid-cols-2 md:grid-cols-3" staggerDelay={0.12}>
            {testimonials.map((t) => (
              <StaggerItem key={t.initials}>
                <Card className="hover-lift hover-glow text-left">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar className="ring-2 ring-primary/10">
                        <AvatarFallback className="bg-primary/10 font-medium text-primary">
                          {t.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.condition}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm italic leading-relaxed text-muted-foreground">
                      &ldquo;{t.text}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 animated-gradient bg-gradient-to-r from-primary/8 via-rose-500/5 to-primary/8" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-[20%] size-40 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-10 left-[15%] size-32 rounded-full bg-rose-400/5 blur-3xl animate-float-delayed" />
        </div>

        <AnimatedSection className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Connect?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Your community is waiting. Create a free account and start connecting
            with peers who understand.
          </p>
          <Button asChild size="lg" className="text-base shimmer-btn group">
            <Link href="/signup">
              Create Your Free Account
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </AnimatedSection>
      </section>

      {/* ─── Footer ─────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              HemoConnect 2026
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Button asChild variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
              <Link href="/feedback">
                <MessageCircle className="size-3 mr-1" />
                Give Feedback
              </Link>
            </Button>
            <div className="flex items-center gap-1">
              <Shield className="size-3" />
              <span>HIPAA Aware</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              <span>Not medical advice</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
