"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  ExternalLink,
  Loader2,
  Stethoscope,
  Dumbbell,
  Plane,
  Brain,
  Shield,
  Heart,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnimatedSection } from "@/components/animations/animated-section"
import type { Resource, ResourceCategory } from "@/lib/types/database"
import {
  createResource,
  updateResource,
  deleteResource,
  toggleFeatured,
  type ResourceInput,
} from "@/lib/actions/resources"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Dumbbell,
  Plane,
  Brain,
  Shield,
  Heart,
  BookOpen,
}

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Book" },
  { value: "Stethoscope", label: "Medical" },
  { value: "Dumbbell", label: "Fitness" },
  { value: "Plane", label: "Travel" },
  { value: "Brain", label: "Mental Health" },
  { value: "Shield", label: "Insurance" },
  { value: "Heart", label: "Wellness" },
]

const CATEGORY_OPTIONS: { value: ResourceCategory; label: string }[] = [
  { value: "treatment", label: "Treatment" },
  { value: "fitness", label: "Fitness" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "wellness", label: "Wellness" },
  { value: "insurance", label: "Insurance" },
]

const emptyForm: ResourceInput = {
  title: "",
  summary: "",
  body: "",
  category: "treatment",
  tags: [],
  read_time_minutes: 5,
  featured: false,
  icon: "BookOpen",
  external_url: "",
}

interface AdminResourcesListProps {
  initialResources: Resource[]
}

export function AdminResourcesList({ initialResources }: AdminResourcesListProps) {
  const [resources, setResources] = useState(initialResources)
  const [showForm, setShowForm] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [form, setForm] = useState<ResourceInput>(emptyForm)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditingResource(null)
    setForm(emptyForm)
    setTagInput("")
    setShowForm(true)
  }

  function openEdit(resource: Resource) {
    setEditingResource(resource)
    setForm({
      title: resource.title,
      summary: resource.summary,
      body: resource.body || "",
      category: resource.category,
      tags: resource.tags,
      read_time_minutes: resource.read_time_minutes,
      featured: resource.featured,
      icon: resource.icon,
      external_url: resource.external_url || "",
    })
    setTagInput("")
    setShowForm(true)
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput("")
  }

  function removeTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  async function handleSave() {
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error("Title and summary are required")
      return
    }

    setSaving(true)

    if (editingResource) {
      const result = await updateResource(editingResource.id, form)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Resource updated")
        setResources((prev) =>
          prev.map((r) =>
            r.id === editingResource.id
              ? { ...r, ...form, updated_at: new Date().toISOString() }
              : r
          )
        )
        setShowForm(false)
      }
    } else {
      const result = await createResource(form)
      if (result.error) {
        toast.error(result.error)
      } else if (result.resource) {
        toast.success("Resource created")
        setResources((prev) => [result.resource!, ...prev])
        setShowForm(false)
      }
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)
    const result = await deleteResource(deleteTarget.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Resource deleted")
      setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleToggleFeatured(resource: Resource) {
    const newFeatured = !resource.featured
    setResources((prev) =>
      prev.map((r) =>
        r.id === resource.id ? { ...r, featured: newFeatured } : r
      )
    )

    const result = await toggleFeatured(resource.id, newFeatured)
    if (result.error) {
      toast.error(result.error)
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, featured: !newFeatured } : r
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resource Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage resources for the community
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Add Resource
          </Button>
        </div>
      </AnimatedSection>

      {/* Resources List */}
      <div className="space-y-3">
        {resources.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No resources yet. Click &quot;Add Resource&quot; to create one.
            </CardContent>
          </Card>
        )}
        {resources.map((resource, i) => {
          const IconComponent = ICON_MAP[resource.icon] || BookOpen
          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <IconComponent className="size-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{resource.title}</h3>
                      {resource.featured && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {resource.summary}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {resource.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {resource.read_time_minutes} min read
                      </span>
                      {resource.external_url && (
                        <ExternalLink className="size-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(resource)}
                      title={resource.featured ? "Remove featured" : "Mark featured"}
                    >
                      {resource.featured ? (
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(resource)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(resource)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Edit Resource" : "Add New Resource"}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? "Update the resource details below."
                : "Fill in the details to create a new resource for the community."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Understanding Factor Replacement Therapy"
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={form.summary}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, summary: e.target.value }))
                }
                placeholder="A short description of this resource..."
                rows={3}
              />
            </div>

            {/* Category & Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      category: v as ResourceCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={form.icon}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, icon: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Read Time & Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  min={1}
                  max={120}
                  value={form.read_time_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      read_time_minutes: parseInt(e.target.value) || 5,
                    }))
                  }
                />
              </div>

              <div className="flex items-end gap-3 pb-2">
                <Switch
                  id="featured"
                  checked={form.featured}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, featured: checked }))
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured
                </Label>
              </div>
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <Label htmlFor="url">External URL (optional)</Label>
              <Input
                id="url"
                type="url"
                value={form.external_url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, external_url: e.target.value }))
                }
                placeholder="https://example.com/article"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Type a tag and press Enter"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} &times;
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Body (optional long content) */}
            <div className="space-y-2">
              <Label htmlFor="body">Body Content (optional)</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Full article content (optional if linking externally)..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingResource ? "Save Changes" : "Create Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone. Any users who saved this resource
              will lose their bookmark.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
