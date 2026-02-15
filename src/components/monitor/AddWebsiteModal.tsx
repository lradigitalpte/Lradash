"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Globe, Clock, Plus, Zap, AlertCircle, Server, ShieldCheck, Mail } from "lucide-react"
import { useState } from "react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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
import { MonitorType, IMonitor } from "@/types/monitor"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  target: z.string().min(3, "Target is required"),
  port: z.string().optional(),
  frequency: z.string(),
  type: z.nativeEnum(MonitorType)
})

interface AddWebsiteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialData?: IMonitor | null
}

export function AddWebsiteModal({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: AddWebsiteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      target: "",
      port: "",
      frequency: "5",
      type: MonitorType.WEBSITE
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        target: initialData.target,
        port: initialData.port?.toString() || "",
        frequency: initialData.frequency.toString(),
        type: initialData.type
      })
    } else {
      form.reset({
        name: "",
        target: "",
        port: "",
        frequency: "5",
        type: MonitorType.WEBSITE
      })
    }
  }, [initialData, form, open])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const payload = {
        ...values,
        frequency: parseInt(values.frequency),
        port: values.port ? parseInt(values.port) : undefined
      }

      let response
      if (initialData?._id) {
        response = await apiClient.put(`/api/monitor/${initialData._id}`, payload)
      } else {
        response = await apiClient.post("/api/monitor", payload)
      }

      if (!response.ok) {
        throw new Error("Failed to save monitor")
      }

      toast.success(initialData ? "Monitor updated" : "Monitor added successfully")

      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error("Error", {
        description: "Could not save the monitor. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = form.watch("type")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-slate-200 bg-white p-0 sm:max-w-[500px] dark:border-slate-800 dark:bg-slate-950">
        <div className="relative bg-slate-900 p-8 text-white">
          <div className="relative z-10">
            <DialogHeader>
              <span className="mb-2 block text-[10px] font-black tracking-[0.3em] text-red-500 uppercase">
                {initialData ? "Edit Asset" : "New Asset"}
              </span>
              <DialogTitle className="text-3xl font-black tracking-tighter">
                {initialData ? "Edit" : "Add"} <span className="text-red-500">Monitor</span>
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-400 italic">
                Configure real-time monitoring for your infrastructure.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-red-600/20 blur-3xl" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Monitor Type
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-900">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <SelectItem
                          value={MonitorType.WEBSITE}
                          className="rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase"
                        >
                          <div className="subray-offset-4 flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            Website / HTTPS
                          </div>
                        </SelectItem>
                        <SelectItem
                          value={MonitorType.PORT}
                          className="rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase"
                        >
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-blue-500" />
                            TCP Port / Node
                          </div>
                        </SelectItem>
                        <SelectItem
                          value={MonitorType.SSL}
                          className="rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-amber-500" />
                            SSL Certificate
                          </div>
                        </SelectItem>
                        <SelectItem
                          value={MonitorType.SMTP}
                          className="rounded-xl px-4 py-3 text-xs font-bold tracking-widest uppercase"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-rose-500" />
                            Email / SMTP
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Friendly Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Zap className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="e.g. Main API"
                          className="h-12 rounded-xl border-none bg-slate-50 pl-10 dark:bg-slate-900"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-black text-red-500 uppercase" />
                  </FormItem>
                )}
              />

              {selectedType === MonitorType.SMTP ? (
                // SMTP-specific UI
                <>
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Email Server Hostname
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. mail.example.com or 192.168.1.10"
                            className="h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-900"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-black text-red-500 uppercase" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          SMTP Port
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("25")
                              }}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all",
                                field.value === "25"
                                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              25
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("465")
                              }}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all",
                                field.value === "465"
                                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              465
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("587")
                              }}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all",
                                field.value === "587"
                                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              587
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("2525")
                              }}
                              className={cn(
                                "rounded-xl px-3 py-2 text-xs font-bold tracking-widest uppercase transition-all",
                                field.value === "2525"
                                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              2525
                            </button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <p className="mb-2 text-[10px] font-black tracking-widest text-emerald-700 uppercase dark:text-emerald-300">
                      ✓ No Credentials Needed
                    </p>
                    <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                      Basic monitoring connects to your SMTP server and checks if it's UP or DOWN.
                      No username or password required. Authentication testing coming in Phase 2.
                    </p>
                  </div>
                </>
              ) : (
                // Generic UI for other types
                <>
                  <FormField
                    control={form.control}
                    name="target"
                    render={({ field }) => (
                      <FormItem
                        className={cn(
                          selectedType === MonitorType.WEBSITE ? "col-span-2" : "col-span-1"
                        )}
                      >
                        <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {selectedType === MonitorType.WEBSITE ? "URL (https://...)" : "Host / IP"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              selectedType === MonitorType.WEBSITE
                                ? "https://example.com"
                                : "1.2.3.4"
                            }
                            className="h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-900"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-black text-red-500 uppercase" />
                      </FormItem>
                    )}
                  />

                  {selectedType !== MonitorType.WEBSITE && (
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Port
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="80"
                              type="number"
                              className="h-12 rounded-xl border-none bg-slate-50 dark:bg-slate-900"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Check Interval
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 font-bold dark:bg-slate-900">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <SelectItem value="1" className="rounded-xl px-4 py-2 font-bold">
                          Every 1 Minute
                        </SelectItem>
                        <SelectItem value="5" className="rounded-xl px-4 py-2 font-bold">
                          Every 5 Minutes
                        </SelectItem>
                        <SelectItem value="15" className="rounded-xl px-4 py-2 font-bold">
                          Every 15 Minutes
                        </SelectItem>
                        <SelectItem value="60" className="rounded-xl px-4 py-2 font-bold">
                          Every Hour
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="mt-2 text-center text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                      Faster intervals provide better accuracy
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 w-full rounded-2xl bg-red-600 py-6 text-sm font-black text-white shadow-xl shadow-red-600/20 hover:bg-red-700"
              >
                {isSubmitting
                  ? "Sychronizing..."
                  : initialData
                    ? "UPDATE MONITOR"
                    : "START MONITORING"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
