"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  User,
  Activity,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { saveProfile } from "@/lib/actions/profile"
import { INTEREST_TOPICS } from "@/lib/types/database"
import type { Profile } from "@/lib/types/database"
import type { ProfileSetupValues } from "@/lib/validations/profile"

const steps = [
  { label: "Clinical Info", icon: Activity },
  { label: "Lifestyle", icon: User },
  { label: "Preferences", icon: Settings },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
    scale: 0.96,
  }),
}

interface ProfileSetupFormProps {
  existingProfile: Profile | null
}

export function ProfileSetupForm({ existingProfile }: ProfileSetupFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Form state initialized from existing profile
  const [formData, setFormData] = useState<Partial<ProfileSetupValues>>({
    hemophilia_type: existingProfile?.hemophilia_type ?? undefined,
    severity_level: existingProfile?.severity_level ?? undefined,
    factor_level: existingProfile?.factor_level ?? undefined,
    current_treatment: existingProfile?.current_treatment ?? undefined,
    age_range: existingProfile?.age_range ?? undefined,
    life_stage: existingProfile?.life_stage ?? undefined,
    location: existingProfile?.location ?? "",
    bio: existingProfile?.bio ?? "",
    topics: existingProfile?.topics ?? [],
    peer_matching_enabled: existingProfile?.peer_matching_enabled ?? true,
    email_notifications: existingProfile?.email_notifications ?? true,
    weekly_digest: existingProfile?.weekly_digest ?? false,
    profile_visible: existingProfile?.profile_visible ?? true,
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  const updateField = <K extends keyof ProfileSetupValues>(key: K, value: ProfileSetupValues[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleTopic = (topic: string) => {
    setFormData((prev) => {
      const current = prev.topics ?? []
      return {
        ...prev,
        topics: current.includes(topic)
          ? current.filter((t) => t !== topic)
          : [...current, topic],
      }
    })
  }

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.hemophilia_type || !formData.severity_level || !formData.current_treatment) {
      toast.error("Please complete Clinical Information (Step 1)")
      goToStep(0)
      return
    }
    if (!formData.age_range || !formData.life_stage) {
      toast.error("Please complete Lifestyle (Step 2)")
      goToStep(1)
      return
    }

    startTransition(async () => {
      const result = await saveProfile(formData as ProfileSetupValues)
      if (result?.error) {
        toast.error(result.error)
      }
      // On success, saveProfile() calls redirect("/dashboard")
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <motion.div
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Heart className="size-8 text-primary" />
          </motion.div>
          Profile Setup
        </h1>
        <p className="mt-2 text-muted-foreground">
          Help us personalize your experience and find the best peer matches
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-medium">{steps[currentStep].label}</span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2" />
          <motion.div
            className="absolute -top-1 h-4 w-4 rounded-full border-2 border-primary bg-background shadow-md"
            animate={{ left: `calc(${progress}% - 8px)` }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <button
              key={step.label}
              onClick={() => goToStep(i)}
              className="flex items-center gap-1.5 text-xs transition-all"
            >
              <motion.div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i < currentStep
                    ? "bg-primary text-primary-foreground"
                    : i === currentStep
                      ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                }`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              >
                {i < currentStep ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="size-3.5" />
                  </motion.div>
                ) : (
                  i + 1
                )}
              </motion.div>
              <span
                className={
                  i === currentStep
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Step Content with AnimatePresence */}
      <AnimatePresence mode="wait" custom={direction}>
        {currentStep === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 },
            }}
          >
            <Card className="hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  Clinical Information
                </CardTitle>
                <CardDescription>
                  This information helps us find peers with similar conditions.
                  All data is kept private and secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label>Hemophilia Type</Label>
                  <Select
                    value={formData.hemophilia_type ?? ""}
                    onValueChange={(v) => updateField("hemophilia_type", v as ProfileSetupValues["hemophilia_type"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your hemophilia type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Hemophilia A (Factor VIII)</SelectItem>
                      <SelectItem value="b">Hemophilia B (Factor IX)</SelectItem>
                      <SelectItem value="c">Hemophilia C (Factor XI)</SelectItem>
                      <SelectItem value="vwd">Von Willebrand Disease</SelectItem>
                      <SelectItem value="other">Other bleeding disorder</SelectItem>
                      <SelectItem value="carrier">Carrier</SelectItem>
                      <SelectItem value="caregiver">Caregiver / Family Member</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label>Severity Level</Label>
                  <RadioGroup
                    value={formData.severity_level ?? ""}
                    onValueChange={(v) => updateField("severity_level", v as ProfileSetupValues["severity_level"])}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                      <RadioGroupItem value="mild" id="mild" />
                      <Label htmlFor="mild" className="flex-1 cursor-pointer">
                        <span className="font-medium">Mild</span>
                        <p className="text-xs text-muted-foreground">5-40% factor</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                        <span className="font-medium">Moderate</span>
                        <p className="text-xs text-muted-foreground">1-5% factor</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                      <RadioGroupItem value="severe" id="severe" />
                      <Label htmlFor="severe" className="flex-1 cursor-pointer">
                        <span className="font-medium">Severe</span>
                        <p className="text-xs text-muted-foreground">&lt;1% factor</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label htmlFor="factorLevel">Factor Level (%)</Label>
                  <Input
                    id="factorLevel"
                    type="number"
                    placeholder="e.g. 3"
                    min={0}
                    max={100}
                    value={formData.factor_level ?? ""}
                    onChange={(e) =>
                      updateField("factor_level", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your most recent factor level if known
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Label>Current Treatment</Label>
                  <Select
                    value={formData.current_treatment ?? ""}
                    onValueChange={(v) => updateField("current_treatment", v as ProfileSetupValues["current_treatment"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your treatment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prophylaxis">Prophylaxis</SelectItem>
                      <SelectItem value="on-demand">On-demand</SelectItem>
                      <SelectItem value="emicizumab">Emicizumab (Hemlibra)</SelectItem>
                      <SelectItem value="gene-therapy">Gene Therapy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="none">Not currently treating</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => goToStep(1)} className="gap-1.5">
                  Next: Lifestyle
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 },
            }}
          >
            <Card className="hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-primary" />
                  Lifestyle & Background
                </CardTitle>
                <CardDescription>
                  Tell us about yourself to find the most relevant peer connections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label>Age Range</Label>
                  <Select
                    value={formData.age_range ?? ""}
                    onValueChange={(v) => updateField("age_range", v as ProfileSetupValues["age_range"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-18">Under 18</SelectItem>
                      <SelectItem value="18-25">18-25</SelectItem>
                      <SelectItem value="26-35">26-35</SelectItem>
                      <SelectItem value="36-45">36-45</SelectItem>
                      <SelectItem value="46-55">46-55</SelectItem>
                      <SelectItem value="56-plus">56+</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Label>Life Stage</Label>
                  <Select
                    value={formData.life_stage ?? ""}
                    onValueChange={(v) => updateField("life_stage", v as ProfileSetupValues["life_stage"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your life stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="young-adult">Young Adult</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="professional">Working Professional</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="caregiver">Caregiver</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="City, State or Country"
                    value={formData.location ?? ""}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to suggest local resources and support groups
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    placeholder="Share a bit about yourself, your journey, hobbies, or what you hope to find in this community..."
                    className="min-h-[120px]"
                    value={formData.bio ?? ""}
                    onChange={(e) => updateField("bio", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will appear on your public profile
                  </p>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Label>Topics of Interest</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TOPICS.map((topic) => (
                      <motion.div
                        key={topic}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Badge
                          variant={(formData.topics ?? []).includes(topic) ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:bg-primary/10"
                          onClick={() => toggleTopic(topic)}
                        >
                          {(formData.topics ?? []).includes(topic) && (
                            <Check className="mr-1 size-3" />
                          )}
                          {topic}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  onClick={() => goToStep(0)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <Button onClick={() => goToStep(2)} className="gap-1.5">
                  Next: Preferences
                  <ChevronRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.25 },
            }}
          >
            <Card className="hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5 text-primary" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize how you interact with HemoConnect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {([
                  {
                    key: "peer_matching_enabled" as const,
                    label: "Peer Matching",
                    desc: "Allow AI to suggest peer connections based on your profile",
                    delay: 0.1,
                  },
                  {
                    key: "email_notifications" as const,
                    label: "Email Notifications",
                    desc: "Receive email alerts for messages and forum replies",
                    delay: 0.15,
                  },
                  {
                    key: "weekly_digest" as const,
                    label: "Weekly Digest",
                    desc: "Get a weekly summary of community highlights",
                    delay: 0.2,
                  },
                  {
                    key: "profile_visible" as const,
                    label: "Profile Visibility",
                    desc: "Allow other members to view your profile and connect",
                    delay: 0.25,
                  },
                ] as const).map((pref) => (
                  <motion.div
                    key={pref.label}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:border-primary/20 hover:bg-muted/30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pref.delay }}
                  >
                    <div className="space-y-0.5">
                      <Label className="text-base">{pref.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {pref.desc}
                      </p>
                    </div>
                    <Switch
                      checked={formData[pref.key] ?? false}
                      onCheckedChange={(checked) => updateField(pref.key, checked)}
                    />
                  </motion.div>
                ))}

                <Separator />

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <Label>Data Privacy</Label>
                  <p className="text-sm text-muted-foreground">
                    Your clinical information is only used for peer matching and is never
                    shared with third parties. You can delete your data at any time from
                    your account settings.
                  </p>
                </motion.div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button
                  variant="outline"
                  onClick={() => goToStep(1)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className="gap-1.5 shimmer-btn"
                    onClick={handleSubmit}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {isPending ? "Saving..." : "Complete Setup"}
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medical Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Medical Disclaimer
              </p>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                HemoConnect is a peer support platform and does not provide medical
                advice. The information shared here should not be used as a substitute
                for professional medical care. Always consult your hematologist or
                healthcare provider for medical decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
