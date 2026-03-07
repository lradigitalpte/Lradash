"use client"

import { Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { IMonitor, MonitorType } from "@/types/monitor"

interface AddSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: IMonitor | null
}

export function AddSubscriptionModal({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: AddSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (open) {
      apiClient
        .get("/api/projects")
        .then( async (r) => r.json())
        .then(
          (
            data: { projects?: { id: string; title: string }[] } | { id: string; title: string }[]
          ) => {
            const list = Array.isArray(data) ? data : (data.projects ?? [])
            setProjects(list)
          }
        )
        .catch(() =>{  setProjects([]); })
    }
  }, [open])

  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      plan: initialData?.metadata?.plan || "",
      cost: initialData?.price ? initialData.price.toString() : "",
      currency: initialData?.currency || "USD",
      renewalDate: initialData?.expiryDate
        ? new Date(initialData.expiryDate).toISOString().split("T")[0]
        : "",
      billingCycle: initialData?.metadata?.billingCycle || "MONTHLY",
      paymentMethod: initialData?.metadata?.paymentMethod || "",
      vendor: initialData?.target || "",
      notes: initialData?.metadata?.notes || "",
      frequency: initialData?.frequency ? (initialData.frequency / 1440).toFixed(0) : "1",
      projectId: (initialData as any)?.projectId ?? (initialData as any)?.project?._id ?? "none"
    }
  })

  async function onSubmit(values: any) {
    setLoading(true)
    try {
      // Calculate renewal date status
      const renewalDate = new Date(values.renewalDate)
      const today = new Date()
      let status = "UP"

      if (renewalDate < today) {
        status = "EXPIRED"
      } else if (renewalDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
        status = "WARNING"
      }

      const payload = {
        name: values.name,
        type: MonitorType.SUBSCRIPTION,
        target: values.vendor,
        status: status,
        frequency: parseInt(values.frequency) * 1440, // Convert days to minutes
        price: parseFloat(values.cost),
        currency: values.currency,
        expiryDate: new Date(values.renewalDate),
        metadata: {
          plan: values.plan,
          billingCycle: values.billingCycle,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
          renewalDate: new Date(values.renewalDate)
        },
        projectId: values.projectId && values.projectId !== "none" ? values.projectId : null
      }

      let response
      if (initialData?._id) {
        response = await apiClient.put(`/api/monitor/${initialData._id}`, payload)
      } else {
        response = await apiClient.post("/api/monitor", payload)
      }

      if (response.ok) {
        toast.success(initialData ? "Subscription updated" : "Subscription added")
        form.reset()
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save subscription")
      }
    } catch (error) {
      toast.error("Error saving subscription")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[2rem] border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {initialData ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Track your service subscriptions and renewal dates
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Service Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., AWS, Slack, GitHub Pro"
                      className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Vendor / Target */}
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Vendor / Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., aws.amazon.com"
                      className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Plan / Tier
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Professional, Enterprise"
                      className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Cost <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Currency
                    </FormLabel>
                    <FormControl>
                      <select
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                        {...field}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="SGD">SGD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Renewal Date */}
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Renewal Date <span className="text-red-500">*</span>
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

              {/* Billing Cycle */}
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                      Billing Cycle
                    </FormLabel>
                    <FormControl>
                      <select
                        className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                        {...field}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="BIENNIAL">Biennial</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Payment Method
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Credit Card, Bank Transfer"
                      className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Add any additional notes..."
                      rows={3}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Link to project (cost tracking) */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Link to project
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px] text-slate-500">
                    Optional. Links this subscription to a project for cost tracking.
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Check Frequency (in days) */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-black tracking-widest text-slate-700 uppercase dark:text-slate-300">
                    Check Frequency (days)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      className="rounded-xl border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] text-slate-500">
                    How often to check for renewal alerts (default: daily)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
              >
                {loading ? "Saving..." : initialData ? "Update Subscription" : "Add Subscription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
