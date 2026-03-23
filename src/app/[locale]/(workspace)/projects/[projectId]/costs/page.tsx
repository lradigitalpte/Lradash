"use client"

import {
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Loader2,
  Calendar,
  MoreVertical,
  Activity,
  Link2Off
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { CostFrequency, CostLineItemType, ICostLineItem } from "@/types/cost-line-item"
import { IMonitor } from "@/types/monitor"

type MonitorWithProject = IMonitor & {
  projectId?: string | null
  project?: { _id: string; title: string }
}

function monthlyEquivalent(amount: number, frequency: string): number {
  switch (frequency) {
    case CostFrequency.ONE_TIME:
      return amount / 12
    case CostFrequency.WEEKLY:
      return amount * (52 / 12)
    case CostFrequency.MONTHLY:
      return amount
    case CostFrequency.ANNUAL:
      return amount / 12
    default:
      return amount
  }
}

function monitorMonthlyPrice(monitor: MonitorWithProject): number {
  const price = monitor.price ?? 0
  const cycle = (monitor.metadata?.billingCycle as string) || "MONTHLY"
  if (cycle === "ANNUAL") {
    return price / 12
  }
  if (cycle === "QUARTERLY") {
    return price / 3
  }
  return price
}

export default function ProjectCostsPage() {
  const params = useParams()
  const projectId = (params?.projectId as string) || ""
  const [items, setItems] = useState<ICostLineItem[]>([])
  const [linkedMonitors, setLinkedMonitors] = useState<MonitorWithProject[]>([])
  const [allMonitors, setAllMonitors] = useState<MonitorWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [monitorsLoading, setMonitorsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkMonitorId, setLinkMonitorId] = useState<string>("")
  const [linking, setLinking] = useState(false)
  const [editingItem, setEditingItem] = useState<ICostLineItem | null>(null)

  const form = useForm({
    defaultValues: {
      type: CostLineItemType.OTHER,
      name: "",
      amount: "",
      currency: "USD",
      frequency: CostFrequency.MONTHLY,
      dueDate: "",
      expiryDate: "",
      notes: ""
    }
  })

  const fetchCosts = useCallback(async () => {
    if (!projectId) {
      return
    }
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}/costs`)
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to fetch costs:", error)
      toast.error("Failed to load costs")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchMonitors = useCallback(async () => {
    try {
      setMonitorsLoading(true)
      const response = await apiClient.get("/api/monitor")
      if (response.ok) {
        const data: MonitorWithProject[] = await response.json()
        setAllMonitors(data)
        setLinkedMonitors(data.filter((m) => m.projectId === projectId))
      }
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setMonitorsLoading(false)
    }
  }, [projectId])

  const unlinkedMonitors = allMonitors.filter((m) => !m.projectId)

  useEffect(() => {
    fetchCosts()
  }, [fetchCosts])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  const totalFromItems = items.reduce((sum, item) => {
    return sum + monthlyEquivalent(item.amount, item.frequency)
  }, 0)
  const totalFromMonitors = linkedMonitors.reduce((sum, m) => sum + monitorMonthlyPrice(m), 0)
  const totalMonthly = totalFromItems + totalFromMonitors

  const openAdd = () => {
    setEditingItem(null)
    form.reset({
      type: CostLineItemType.OTHER,
      name: "",
      amount: "",
      currency: "USD",
      frequency: CostFrequency.MONTHLY,
      dueDate: "",
      expiryDate: "",
      notes: ""
    })
    setModalOpen(true)
  }

  const openEdit = (item: ICostLineItem) => {
    setEditingItem(item)
    form.reset({
      type: item.type,
      name: item.name,
      amount: String(item.amount),
      currency: item.currency || "USD",
      frequency: item.frequency,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split("T")[0] : "",
      notes: item.notes || ""
    })
    setModalOpen(true)
  }

  const onSubmit = async (values: {
    type: string
    name: string
    amount: string
    currency: string
    frequency: string
    dueDate: string
    expiryDate: string
    notes: string
  }) => {
    const payload = {
      type: values.type,
      name: values.name,
      amount: parseFloat(values.amount) || 0,
      currency: values.currency,
      frequency: values.frequency,
      dueDate: values.dueDate || undefined,
      expiryDate: values.expiryDate || undefined,
      notes: values.notes || undefined
    }
    try {
      if (editingItem?._id) {
        const res = await apiClient.put(
          `/api/projects/${projectId}/costs/${editingItem._id}`,
          payload
        )
        if (res.ok) {
          toast.success("Cost updated")
          setModalOpen(false)
          fetchCosts()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to update")
        }
      } else {
        const res = await apiClient.post(`/api/projects/${projectId}/costs`, payload)
        if (res.ok) {
          toast.success("Cost added")
          setModalOpen(false)
          fetchCosts()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to add")
        }
      }
    } catch (error) {
      toast.error("Request failed")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cost line item?")) {
      return
    }
    try {
      const res = await apiClient.delete(`/api/projects/${projectId}/costs/${id}`)
      if (res.ok) {
        toast.success("Deleted")
        fetchCosts()
      } else {
        toast.error("Failed to delete")
      }
    } catch (error) {
      toast.error("Request failed")
    }
  }

  const formatFreq = (f: string) => {
    const map: Record<string, string> = {
      [CostFrequency.ONE_TIME]: "One-time",
      [CostFrequency.WEEKLY]: "Weekly",
      [CostFrequency.MONTHLY]: "Monthly",
      [CostFrequency.ANNUAL]: "Annual"
    }
    return map[f] || f
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Finance
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Project <span className="text-slate-400">Costs</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Track SSL, domain, Meta ads, subscriptions and other costs for this project.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-700 dark:bg-red-600"
        >
          <Plus className="h-4 w-4" />
          Add cost
        </button>
      </div>

      {/* Total monthly */}
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl">
        <DollarSign className="mb-4 h-8 w-8 text-red-500" />
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
          Total (monthly equivalent)
        </p>
        <h2 className="text-4xl font-black tracking-tighter">
          $
          {totalMonthly.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-500 italic">
          Recurring and amortized one-time costs
        </p>
      </div>

      {/* Monitors linked to this project */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-50 px-8 py-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Monitors linked to this project</h2>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                SSL, domain and subscription monitors tagged here. Link from below or unlink.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={unlinkedMonitors.length === 0}
            onClick={() => {
              setLinkMonitorId("")
              setLinkModalOpen(true)
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black tracking-wider text-slate-700 uppercase transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Link monitor
          </button>
        </div>
        <div className="overflow-x-auto">
          {monitorsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Loading...
              </span>
            </div>
          ) : linkedMonitors.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-bold text-slate-400">
                No monitors linked. Edit a subscription in Monitor and set this project to link it
                here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Name
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Price
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Expiry
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {linkedMonitors.map((m) => (
                  <tr
                    key={m._id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-8 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {m.type}
                    </td>
                    <td className="px-8 py-4 font-black text-slate-900 dark:text-white">
                      {m.currency || "USD"} {m.price?.toLocaleString() ?? "—"}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        {(m.metadata?.billingCycle as string) || "MONTHLY"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {m.status}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {m.expiryDate
                        ? new Date(m.expiryDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })
                        : "—"}
                    </td>
                    <td className="px-8 py-4">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await apiClient.put(`/api/monitor/${m._id}`, {
                              projectId: null
                            })
                            if (res.ok) {
                              toast.success("Unlinked")
                              fetchMonitors()
                            }
                          } catch {
                            toast.error("Failed to unlink")
                          }
                        }}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        <Link2Off className="h-3.5 w-3.5" />
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cost line items */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-50 px-8 py-6 dark:border-slate-800">
          <h2 className="text-xl font-black tracking-tight">Cost line items</h2>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            All cost entries for this project
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Loading costs...
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-bold text-slate-400">
                No cost items yet. Add one to see the running cost for this project.
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Name
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Amount
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Frequency
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Due / Expiry
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] whitespace-nowrap text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-8 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {item.type}
                    </td>
                    <td className="px-8 py-4 font-black text-slate-900 dark:text-white">
                      {item.currency} {item.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {formatFreq(item.frequency)}
                    </td>
                    <td className="px-8 py-4">
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                        {item.dueDate && <Calendar className="h-3.5 w-3.5 text-slate-400" />}
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })
                          : item.expiryDate
                            ? new Date(item.expiryDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })
                            : "—"}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            openEdit(item)
                          }}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => item._id && handleDelete(item._id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingItem ? "Edit cost" : "Add cost"}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {editingItem
                ? "Update this cost line item."
                : "Add a cost line item for this project."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(CostLineItemType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Meta Ads"
                        className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                        Amount <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                        Currency
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Frequency
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(CostFrequency).map((f) => (
                          <SelectItem key={f} value={f}>
                            {formatFreq(f)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                        Due date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                        Expiry date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes"
                        rows={2}
                        className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false)
                  }}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-black text-white transition-colors hover:bg-red-700 dark:bg-red-600"
                >
                  {editingItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Link monitor to project</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Choose a monitor that is not yet linked to a project. Its cost will appear in this
              project&apos;s total.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                Monitor
              </label>
              <Select value={linkMonitorId} onValueChange={setLinkMonitorId}>
                <SelectTrigger className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <SelectValue placeholder="Select a monitor..." />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedMonitors.map((m) => (
                    <SelectItem key={m._id} value={m._id!}>
                      {m.name} ({m.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false)
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkMonitorId || linking}
                onClick={async () => {
                  if (!linkMonitorId) {
                    return
                  }
                  setLinking(true)
                  try {
                    const res = await apiClient.put(`/api/monitor/${linkMonitorId}`, {
                      projectId
                    })
                    if (res.ok) {
                      toast.success("Monitor linked")
                      setLinkModalOpen(false)
                      fetchMonitors()
                    } else {
                      toast.error("Failed to link")
                    }
                  } catch {
                    toast.error("Failed to link")
                  } finally {
                    setLinking(false)
                  }
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-600"
              >
                {linking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Linking...
                  </>
                ) : (
                  "Link"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
