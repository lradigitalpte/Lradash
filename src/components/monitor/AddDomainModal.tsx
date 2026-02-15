"use client"

import { Globe, Loader2, AlertCircle } from "lucide-react"
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
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { IMonitor, MonitorType } from "@/types/monitor"

interface AddDomainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: IMonitor | null
}

export function AddDomainModal({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: AddDomainModalProps) {
  const [loading, setLoading] = useState(false)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsInfo, setDnsInfo] = useState<any>(null)

  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      target: initialData?.target || "",
      frequency: initialData?.frequency || 5,
      registrar: initialData?.metadata?.registrar || "",
      expiryDate: initialData?.expiryDate
        ? new Date(initialData.expiryDate).toISOString().split("T")[0]
        : "",
      price: initialData?.price || "",
      purchaseDate: initialData?.metadata?.purchaseDate
        ? new Date(initialData.metadata.purchaseDate).toISOString().split("T")[0]
        : "",
      notes: initialData?.metadata?.notes || ""
    }
  })

  // Perform DNS lookup
  const handleDnsLookup = async () => {
    const domain = form.getValues("target")
    if (!domain) {
      toast.error("Please enter a domain name first")
      return
    }

    setDnsLoading(true)
    try {
      const response = await fetch(`/api/monitor/dns-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      })

      if (response.ok) {
        const data = await response.json()
        setDnsInfo(data)
        toast.success("DNS lookup completed")

        // Auto-fill registrar if found
        if (data.registrar) {
          form.setValue("registrar", data.registrar)
        }
      } else {
        toast.error("DNS lookup failed")
      }
    } catch (error) {
      toast.error("Failed to perform DNS lookup")
      console.error(error)
    } finally {
      setDnsLoading(false)
    }
  }

  async function onSubmit(values: any) {
    setLoading(true)
    try {
      const payload = {
        name: values.name,
        type: MonitorType.DOMAIN,
        target: values.target,
        frequency: parseInt(values.frequency),
        expiryDate: values.expiryDate ? new Date(values.expiryDate) : null,
        price: values.price ? parseFloat(values.price) : null,
        metadata: {
          registrar: values.registrar,
          purchaseDate: values.purchaseDate ? new Date(values.purchaseDate) : null,
          notes: values.notes,
          dnsInfo: dnsInfo,
          lastDNSCheck: dnsInfo ? new Date().toISOString() : null
        }
      }

      let response
      if (initialData?._id) {
        response = await apiClient.put(`/api/monitor/${initialData._id}`, payload)
      } else {
        response = await apiClient.post("/api/monitor", payload)
      }

      if (response.ok) {
        toast.success(initialData ? "Domain updated" : "Domain added")
        form.reset()
        setDnsInfo(null)
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save domain")
      }
    } catch (error) {
      toast.error("Error saving domain")
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
            {initialData ? "Edit Domain" : "Add Domain"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Track your domain registration details, expiry dates, and registrar information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Domain Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Main Website"
                      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    Friendly name for this domain (e.g., "Main Website", "Blog", "API Domain")
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Domain Target */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black tracking-widest uppercase">
                      Domain Name
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          placeholder="e.g. example.com"
                          className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleDnsLookup}
                          disabled={dnsLoading || !field.value}
                          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold whitespace-nowrap text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {dnsLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              DNS Lookup
                            </>
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-[10px] italic">
                      The actual domain name (without http:// or www)
                    </FormDescription>
                  </FormItem>
                )}
              />

              {/* DNS Lookup Results */}
              {dnsInfo && (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                    <AlertCircle className="h-4 w-4" />
                    DNS Lookup Results
                  </div>
                  <div className="space-y-2 text-[10px]">
                    {dnsInfo.registrar && (
                      <div>
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Registrar:
                        </span>{" "}
                        {dnsInfo.registrar}
                      </div>
                    )}
                    {dnsInfo.nameservers && (
                      <div>
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          Nameservers:
                        </span>{" "}
                        {dnsInfo.nameservers.join(", ")}
                      </div>
                    )}
                    {dnsInfo.ip && (
                      <div>
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          IP Address:
                        </span>{" "}
                        {dnsInfo.ip}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Registrar */}
            <FormField
              control={form.control}
              name="registrar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Registrar / Provider
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. GoDaddy, Namecheap, Route53"
                      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    Where the domain is registered (optional)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Expiry Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    When the domain registration expires (optional)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Purchase Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    When you purchased the domain (optional)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Purchase Price
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="e.g. 12.99"
                      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    Domain purchase/renewal price (optional)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="e.g. Auto-renewal enabled, Contact: support@example.com"
                      className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] italic">
                    Additional notes or reminders (optional)
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black tracking-widest uppercase">
                    Check Frequency
                  </FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="1440">Daily (every 24 hours)</option>
                      <option value="720">Every 12 hours</option>
                      <option value="360">Every 6 hours</option>
                      <option value="60">Every hour</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                }}
                className="flex-1 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : initialData ? (
                  "Update Domain"
                ) : (
                  "Add Domain"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
