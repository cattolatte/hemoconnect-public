"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { resolveReport } from "@/lib/actions/admin"
import { REPORT_REASON_LABELS } from "@/lib/types/database"
import type { ReportReason, ReportStatus } from "@/lib/types/database"
import { timeAgo } from "@/lib/utils/time"

interface Report {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  resolved_at: string | null
  reporter: { id: string; first_name: string; last_name: string } | null
  post: { id: string; title: string } | null
  comment: { id: string; body: string } | null
}

interface ReportsListProps {
  reports: Report[]
}

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "destructive", label: "Pending" },
  reviewed: { variant: "secondary", label: "Reviewed" },
  action_taken: { variant: "default", label: "Action Taken" },
  dismissed: { variant: "outline", label: "Dismissed" },
}

export function ReportsList({ reports: initialReports }: ReportsListProps) {
  const [reports, setReports] = useState(initialReports)
  const [isPending, startTransition] = useTransition()

  const handleResolve = (reportId: string, action: "dismissed" | "action_taken") => {
    startTransition(async () => {
      const result = await resolveReport(reportId, action)
      if (result.error) {
        toast.error(result.error)
      } else {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: action, resolved_at: new Date().toISOString() }
              : r
          )
        )
        toast.success(action === "dismissed" ? "Report dismissed" : "Action taken on report")
      }
    })
  }

  const pendingReports = reports.filter((r) => r.status === "pending")
  const resolvedReports = reports.filter((r) => r.status !== "pending")

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {pendingReports.length} pending report{pendingReports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <p className="text-lg font-medium">No reports</p>
            <p className="text-sm text-muted-foreground">
              No content has been reported yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingReports.length > 0 && (
            <h2 className="text-lg font-semibold text-destructive">
              Pending ({pendingReports.length})
            </h2>
          )}

          {pendingReports.map((report, i) => (
            <ReportCard
              key={report.id}
              report={report}
              index={i}
              isPending={isPending}
              onResolve={handleResolve}
            />
          ))}

          {resolvedReports.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="text-lg font-semibold text-muted-foreground">
                Resolved ({resolvedReports.length})
              </h2>
              {resolvedReports.map((report, i) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  index={i}
                  isPending={isPending}
                  onResolve={handleResolve}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ReportCard({
  report,
  index,
  isPending,
  onResolve,
}: {
  report: Report
  index: number
  isPending: boolean
  onResolve: (id: string, action: "dismissed" | "action_taken") => void
}) {
  const reporterName = report.reporter
    ? `${report.reporter.first_name} ${report.reporter.last_name}`.trim()
    : "Unknown"
  const statusInfo = STATUS_BADGES[report.status] ?? STATUS_BADGES.pending
  const reasonLabel = REPORT_REASON_LABELS[report.reason as ReportReason] ?? report.reason

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={report.status === "pending" ? "border-destructive/30" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-destructive" />
                <CardTitle className="text-base">{reasonLabel}</CardTitle>
              </div>
              <CardDescription>
                Reported by {reporterName} &middot; {timeAgo(report.created_at)}
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.description && (
            <p className="text-sm text-muted-foreground italic">
              &ldquo;{report.description}&rdquo;
            </p>
          )}

          {report.post && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <Button
                asChild
                variant="link"
                className="h-auto p-0 text-sm"
              >
                <Link href={`/forum/${report.post.id}`}>
                  {report.post.title}
                </Link>
              </Button>
            </div>
          )}

          {report.comment && (
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                Comment: &ldquo;{report.comment.body}&rdquo;
              </p>
            </div>
          )}

          {report.status === "pending" && (
            <>
              <Separator />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onResolve(report.id, "dismissed")}
                  disabled={isPending}
                >
                  <XCircle className="size-3.5" />
                  Dismiss
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onResolve(report.id, "action_taken")}
                  disabled={isPending}
                >
                  <AlertTriangle className="size-3.5" />
                  Take Action
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
