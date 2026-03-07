"use client"

import {
  CreditCard,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  MoreVertical,
  Edit2,
  Trash2
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { AddSubscriptionModal } from "@/components/monitor/AddSubscriptionModal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { IMonitor } from "@/types/monitor"

export default function SubscriptionsPage() {
  const [monitors, setMonitors] = useState<IMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<IMonitor | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<IMonitor | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const fetchMonitors = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/monitor")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data.filter((m: IMonitor) => m.type === "SUBSCRIPTION"))
      }
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) {
      return
    }
    try {
      const response = await apiClient.delete(`/api/monitor/${id}`)
      if (response.ok) {
        toast.success("Subscription deleted")
        fetchMonitors()
      }
    } catch (error) {
      toast.error("Failed to delete subscription")
    }
  }

  const handleEdit = (subscription: IMonitor) => {
    setEditingSubscription(subscription)
    setModalOpen(true)
  }

  const totalMonthly = monitors
    .filter((m) => m.metadata?.billingCycle === "MONTHLY" || !m.metadata?.billingCycle)
    .reduce((acc, m) => acc + (m.price || 0), 0)

  const totalAnnual = monitors
    .filter((m) => m.metadata?.billingCycle === "ANNUAL")
    .reduce((acc, m) => acc + (m.price || 0), 0)

  const expiringCount = monitors.filter((m) => {
    if (!m.expiryDate) {
      return false
    }
    const renewalDate = new Date(m.expiryDate)
    const today = new Date()
    const daysLeft = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 7
  }).length

  const expiredCount = monitors.filter((m) => {
    if (!m.expiryDate) {
      return false
    }
    const renewalDate = new Date(m.expiryDate)
    return renewalDate < new Date()
  }).length

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Finance
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Payments & <span className="text-slate-400">Subscriptions</span>
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingSubscription(null)
            setModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-700 dark:bg-red-600"
        >
          <Plus className="h-4 w-4" />
          Add Subscription
        </button>
      </div>

      <AddSubscriptionModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingSubscription(null)
          }
        }}
        onSuccess={fetchMonitors}
        initialData={editingSubscription}
      />

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{selectedSubscription?.name}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {selectedSubscription?.target || "Service Subscription"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </span>
              <span
                className={cn(
                  "rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase",
                  selectedSubscription?.status === "UP"
                    ? "bg-emerald-500 text-white"
                    : selectedSubscription?.status === "WARNING"
                      ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                )}
              >
                {selectedSubscription?.status === "UP"
                  ? "ACTIVE"
                  : selectedSubscription?.status === "WARNING"
                    ? "EXPIRING SOON"
                    : "EXPIRED"}
              </span>
            </div>

            {/* Cost Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Cost
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                  {selectedSubscription?.currency || "USD"}{" "}
                  {selectedSubscription?.price?.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Billing
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {selectedSubscription?.metadata?.billingCycle || "MONTHLY"}
                </p>
              </div>
            </div>

            {/* Plan */}
            {selectedSubscription?.metadata?.plan && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Plan
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {selectedSubscription.metadata.plan}
                </p>
              </div>
            )}

            {/* Renewal Date */}
            <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Renewal Date
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {selectedSubscription?.expiryDate
                    ? new Date(selectedSubscription.expiryDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })
                    : "---"}
                </p>
                <p className="mt-2 text-[10px] font-medium text-slate-500">
                  {selectedSubscription?.expiryDate
                    ? (() => {
                        const today = new Date()
                        const renewal = new Date(selectedSubscription.expiryDate)
                        const daysLeft = Math.ceil(
                          (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        )
                        if (daysLeft < 0) {
                          return `${Math.abs(daysLeft)} days ago`
                        }
                        if (daysLeft === 0) {
                          return "Renews today"
                        }
                        if (daysLeft === 1) {
                          return "Renews tomorrow"
                        }
                        return `${daysLeft} days remaining`
                      })()
                    : "---"}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            {selectedSubscription?.metadata?.paymentMethod && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Payment Method
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {selectedSubscription.metadata.paymentMethod}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedSubscription?.metadata?.notes && (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Notes
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                  {selectedSubscription.metadata.notes}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-[10px] dark:bg-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedSubscription?.updatedAt
                    ? new Date(selectedSubscription.updatedAt).toLocaleDateString()
                    : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check Frequency</span>
                <span className="font-black text-slate-900 dark:text-white">
                  Every{" "}
                  {selectedSubscription?.frequency
                    ? Math.round(selectedSubscription.frequency / 1440)
                    : 1}{" "}
                  day(s)
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
          <CreditCard className="mb-4 h-8 w-8 text-red-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Monthly Cost
          </p>
          <h2 className="text-4xl font-black tracking-tighter">${totalMonthly.toLocaleString()}</h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic">Active subscriptions</p>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl dark:bg-slate-900">
          <Calendar className="mb-4 h-8 w-8 text-blue-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total Tracked
          </p>
          <h2 className="text-4xl font-black tracking-tighter">{monitors.length}</h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic">Services</p>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl dark:bg-slate-900">
          <AlertTriangle className="mb-4 h-8 w-8 text-amber-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Expiring Soon
          </p>
          <h2 className="text-4xl font-black tracking-tighter">{expiringCount}</h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic">Next 7 days</p>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl dark:bg-slate-900">
          <AlertTriangle className="mb-4 h-8 w-8 text-red-500" />
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Expired</p>
          <h2 className="text-4xl font-black tracking-tighter">{expiredCount}</h2>
          <p className="mt-2 text-xs font-medium text-slate-500 italic">Action needed</p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Service
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Project
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Plan
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Cost
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Billing
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Renewal Date
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Loading subscriptions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : monitors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <p className="text-sm font-bold text-slate-400">
                      No subscriptions tracked yet.
                    </p>
                  </td>
                </tr>
              ) : (
                monitors.map((subscription) => (
                  <SubscriptionRow
                    key={subscription._id}
                    subscription={subscription}
                    onEdit={() => {
                      handleEdit(subscription)
                    }}
                    onDelete={async () => handleDelete(subscription._id!)}
                    onView={() => {
                      setSelectedSubscription(subscription)
                      setDetailsOpen(true)
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SubscriptionRow({
  subscription,
  onEdit,
  onDelete,
  onView
}: {
  subscription: IMonitor & { project?: { _id: string; title: string } }
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}) {
  const { name, price, currency, expiryDate } = subscription
  const plan = subscription.metadata?.plan || "---"
  const billingCycle = subscription.metadata?.billingCycle || "MONTHLY"
  const projectTitle = subscription.project?.title ?? "—"

  // Calculate days until renewal
  const getDaysUntilRenewal = () => {
    if (!expiryDate) {
      return null
    }
    const today = new Date()
    const renewal = new Date(expiryDate)
    const daysLeft = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const daysLeft = getDaysUntilRenewal()
  const isExpiringSoon = daysLeft !== null && daysLeft < 7 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0
  const renewalDate = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "---"

  let statusBadge = ""
  let statusColor = ""

  if (isExpired) {
    statusBadge = "EXPIRED"
    statusColor = "bg-red-50 text-red-600"
  } else if (isExpiringSoon) {
    statusBadge = "EXPIRING"
    statusColor = "bg-amber-50 text-amber-600"
  } else {
    statusBadge = "ACTIVE"
    statusColor = "bg-emerald-50 text-emerald-600"
  }

  return (
    <tr className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
      <td className="px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 p-1.5 dark:bg-slate-700">
            <div className="h-full w-full rounded-sm bg-red-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{name}</div>
            {subscription.target && (
              <div className="text-[10px] text-slate-400">{subscription.target}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        {projectTitle}
      </td>
      <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{plan}</td>
      <td className="px-8 py-4 font-black text-slate-900 dark:text-white">
        {currency || "USD"} {price?.toLocaleString()}
      </td>
      <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
        {billingCycle}
      </td>
      <td className="px-8 py-4">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">{renewalDate}</div>
          {daysLeft !== null && (
            <div
              className={cn(
                "mt-0.5 text-[10px] font-medium",
                isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-slate-400"
              )}
            >
              {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
            </div>
          )}
        </div>
      </td>
      <td className="px-8 py-4">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase",
            statusColor
          )}
        >
          {statusBadge}
        </div>
      </td>
      <td className="px-8 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-100 dark:hover:bg-red-950/30"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
