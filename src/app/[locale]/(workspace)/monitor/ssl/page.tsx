"use client"

import {
  ShieldCheck,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Activity,
  Clock,
  Loader2,
  Zap,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Calendar,
  Globe,
  DollarSign
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { AddDomainModal } from "@/components/monitor/AddDomainModal"
import { AddWebsiteModal } from "@/components/monitor/AddWebsiteModal"
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
import { IMonitor, MonitorStatus } from "@/types/monitor"

export default function SSLMonitorPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [domainModalOpen, setDomainModalOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedMonitor, setSelectedMonitor] = useState<IMonitor | null>(null)
  const [editingMonitor, setEditingMonitor] = useState<IMonitor | null>(null)
  const [editingDomain, setEditingDomain] = useState<IMonitor | null>(null)
  const [monitors, setMonitors] = useState<IMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [dnsChecking, setDnsChecking] = useState(false)
  const [dnsInfo, setDnsInfo] = useState<any>(null)

  const fetchMonitors = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/monitor")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data.filter((m: IMonitor) => m.type === "SSL" || m.type === "DOMAIN"))
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

  useEffect(() => {
    const onRefresh =  async () => fetchMonitors()
    window.addEventListener("monitor-refresh", onRefresh)
    return () =>{  window.removeEventListener("monitor-refresh", onRefresh); }
  }, [fetchMonitors])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) {
      return
    }
    try {
      const response = await apiClient.delete(`/api/monitor/${id}`)
      if (response.ok) {
        toast.success("Monitor deleted")
        fetchMonitors()
      }
    } catch (error) {
      toast.error("Failed to delete monitor")
    }
  }

  const handleEdit = (monitor: IMonitor) => {
    setEditingMonitor(monitor)
    setModalOpen(true)
  }

  const handleCheckDNS = async (domain: IMonitor) => {
    if (domain.type !== "DOMAIN") {
      return
    }

    setDnsChecking(true)
    try {
      const response = await fetch(`/api/monitor/dns-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.target })
      })

      if (response.ok) {
        const data = await response.json()
        setDnsInfo(data)

        // Update the monitor with new DNS info
        const updatePayload = {
          ...domain,
          metadata: {
            ...domain.metadata,
            dnsInfo: data,
            lastDNSCheck: new Date().toISOString()
          }
        }

        const updateResponse = await apiClient.put(`/api/monitor/${domain._id}`, updatePayload)
        if (updateResponse.ok) {
          toast.success("DNS records updated successfully")
          fetchMonitors()
        }
      }
    } catch (error) {
      console.error("DNS check failed:", error)
      toast.error("Failed to check DNS records")
    } finally {
      setDnsChecking(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Security
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            SSL & <span className="text-slate-400">Domains</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingMonitor(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Certificate
          </button>
          <button
            onClick={() => {
              setEditingDomain(null)
              setDomainModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-900 transition-all hover:border-red-500 hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <Plus className="h-4 w-4" />
            Add Domain
          </button>
        </div>
      </div>

      <AddWebsiteModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingMonitor(null)
          }
        }}
        onSuccess={fetchMonitors}
        initialData={editingMonitor}
      />

      <AddDomainModal
        open={domainModalOpen}
        onOpenChange={(open) => {
          setDomainModalOpen(open)
          if (!open) {
            setEditingDomain(null)
          }
        }}
        onSuccess={fetchMonitors}
        initialData={editingDomain}
      />

      {/* Certificate Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto rounded-2xl border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{selectedMonitor?.name}</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {selectedMonitor?.target}
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
                  selectedMonitor?.type === "DOMAIN"
                    ? selectedMonitor?.expiryDate &&
                      new Date(selectedMonitor.expiryDate).getTime() < Date.now()
                      ? "bg-red-500 text-white"
                      : selectedMonitor?.expiryDate &&
                          new Date(selectedMonitor.expiryDate).getTime() - Date.now() <
                            30 * 24 * 60 * 60 * 1000
                        ? "bg-amber-500 text-white"
                        : "bg-blue-500 text-white"
                    : selectedMonitor?.status === "UP"
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                )}
              >
                {selectedMonitor?.type === "DOMAIN"
                  ? selectedMonitor?.expiryDate &&
                    new Date(selectedMonitor.expiryDate).getTime() < Date.now()
                    ? "EXPIRED"
                    : selectedMonitor?.expiryDate &&
                        new Date(selectedMonitor.expiryDate).getTime() - Date.now() <
                          30 * 24 * 60 * 60 * 1000
                      ? "WARNING"
                      : "ACTIVE"
                  : selectedMonitor?.status === "UP"
                    ? "SECURE"
                    : "EXPIRED"}
              </span>
            </div>

            {/* Expiry Date */}
            <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Expiry Date
                </p>
                <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                  {selectedMonitor?.expiryDate
                    ? new Date(selectedMonitor.expiryDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })
                    : "---"}
                </p>
                <p className="mt-2 text-[10px] font-medium text-slate-500">
                  {selectedMonitor?.expiryDate
                    ? (() => {
                        const today = new Date()
                        const expiry = new Date(selectedMonitor.expiryDate)
                        const daysLeft = Math.ceil(
                          (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        )
                        if (daysLeft < 0) {
                          return `${Math.abs(daysLeft)} days ago`
                        }
                        if (daysLeft === 0) {
                          return "Expires today"
                        }
                        if (daysLeft === 1) {
                          return "Expires tomorrow"
                        }
                        return `${daysLeft} Days remaining`
                      })()
                    : "---"}
                </p>
              </div>
            </div>

            {/* Domain-Specific Info */}
            {selectedMonitor?.type === "DOMAIN" && (
              <>
                {selectedMonitor?.metadata?.registrar && (
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Registrar
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                      {selectedMonitor.metadata.registrar}
                    </p>
                  </div>
                )}

                {selectedMonitor?.price && (
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Purchase Price
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                        ${selectedMonitor.price}
                      </p>
                    </div>
                  </div>
                )}

                {selectedMonitor?.metadata?.purchaseDate && (
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Purchase Date
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(selectedMonitor.metadata.purchaseDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}

                {selectedMonitor?.metadata?.notes && (
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Notes
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                      {selectedMonitor.metadata.notes}
                    </p>
                  </div>
                )}

                {/* DNS Information Section */}
                <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      DNS Records
                    </h3>
                    <button
                      onClick={async () => selectedMonitor && handleCheckDNS(selectedMonitor)}
                      disabled={dnsChecking}
                      className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      {dnsChecking && <Loader2 className="h-3 w-3 animate-spin" />}
                      {dnsChecking ? "Checking..." : "Check DNS Records"}
                    </button>
                  </div>

                  {/* Show stored DNS info or just checked DNS info */}
                  {(dnsInfo || selectedMonitor?.metadata?.dnsInfo) && (
                    <div className="space-y-4">
                      {/* Nameservers */}
                      {((dnsInfo?.nameservers?.length || 0) > 0 ||
                        (selectedMonitor?.metadata?.dnsInfo?.nameservers?.length || 0) > 0) && (
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Nameservers
                          </p>
                          <div className="space-y-1">
                            {(
                              dnsInfo?.nameservers ||
                              selectedMonitor?.metadata?.dnsInfo?.nameservers ||
                              []
                            ).map((ns: string, idx: number) => (
                              <p
                                key={idx}
                                className="text-xs font-medium break-all text-slate-600 dark:text-slate-400"
                              >
                                {ns}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* A Records */}
                      {((dnsInfo?.aRecords?.length || 0) > 0 ||
                        (selectedMonitor?.metadata?.dnsInfo?.aRecords?.length || 0) > 0) && (
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            A Records (IPv4)
                          </p>
                          <div className="space-y-1">
                            {(
                              dnsInfo?.aRecords ||
                              selectedMonitor?.metadata?.dnsInfo?.aRecords ||
                              []
                            ).map((ip: string, idx: number) => (
                              <p
                                key={idx}
                                className="text-xs font-medium break-all text-slate-600 dark:text-slate-400"
                              >
                                {ip}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MX Records */}
                      {((dnsInfo?.mxRecords?.length || 0) > 0 ||
                        (selectedMonitor?.metadata?.dnsInfo?.mxRecords?.length || 0) > 0) && (
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            MX Records (Mail Servers)
                          </p>
                          <div className="space-y-2">
                            {(
                              dnsInfo?.mxRecords ||
                              selectedMonitor?.metadata?.dnsInfo?.mxRecords ||
                              []
                            ).map((mx: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <p className="font-bold text-slate-600 dark:text-slate-400">
                                  {mx.exchange}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500">
                                  Priority: {mx.priority}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SOA Record */}
                      {(dnsInfo?.soaRecord || selectedMonitor?.metadata?.dnsInfo?.soaRecord) && (
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            SOA Record
                          </p>
                          <div className="space-y-1 text-xs">
                            <p className="font-medium text-slate-600 dark:text-slate-400">
                              Primary NS:{" "}
                              <span className="break-all">
                                {
                                  (
                                    dnsInfo?.soaRecord ||
                                    selectedMonitor?.metadata?.dnsInfo?.soaRecord
                                  )?.nsname
                                }
                              </span>
                            </p>
                            <p className="font-medium text-slate-600 dark:text-slate-400">
                              Serial:{" "}
                              {
                                (
                                  dnsInfo?.soaRecord ||
                                  selectedMonitor?.metadata?.dnsInfo?.soaRecord
                                )?.serial
                              }
                            </p>
                            <p className="font-medium text-slate-600 dark:text-slate-400">
                              Refresh:{" "}
                              {
                                (
                                  dnsInfo?.soaRecord ||
                                  selectedMonitor?.metadata?.dnsInfo?.soaRecord
                                )?.refresh
                              }
                              s
                            </p>
                          </div>
                        </div>
                      )}

                      {/* TXT Records */}
                      {((dnsInfo?.txtRecords?.length || 0) > 0 ||
                        (selectedMonitor?.metadata?.dnsInfo?.txtRecords?.length || 0) > 0) && (
                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                          <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            TXT Records
                          </p>
                          <div className="space-y-1">
                            {(
                              dnsInfo?.txtRecords ||
                              selectedMonitor?.metadata?.dnsInfo?.txtRecords ||
                              []
                            ).map((txt: any, idx: number) => (
                              <p
                                key={idx}
                                className="line-clamp-2 text-[10px] font-medium break-all text-slate-600 dark:text-slate-400"
                              >
                                {Array.isArray(txt) ? txt.join("") : txt}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last DNS Check */}
                      {(dnsInfo?.timestamp || selectedMonitor?.metadata?.lastDNSCheck) && (
                        <div className="text-center text-[10px] text-slate-500 dark:text-slate-500">
                          Last checked:{" "}
                          {new Date(
                            dnsInfo?.timestamp || selectedMonitor?.metadata?.lastDNSCheck
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Warning Banner */}
            {selectedMonitor &&
              ((selectedMonitor.type === "DOMAIN" &&
                selectedMonitor.expiryDate &&
                new Date(selectedMonitor.expiryDate).getTime() < Date.now()) ||
                (selectedMonitor.type === "SSL" && selectedMonitor.status !== "UP")) && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-red-600 uppercase dark:text-red-400">
                      Action Required
                    </p>
                    <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
                      {selectedMonitor.type === "DOMAIN"
                        ? "Your domain has expired. Please renew it immediately to maintain your online presence."
                        : "Your certificate has expired or is about to expire. Please renew it immediately to maintain service."}
                    </p>
                  </div>
                </div>
              )}

            {/* Info */}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-[10px] dark:bg-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedMonitor?.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Checked</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {selectedMonitor?.lastChecked
                    ? new Date(selectedMonitor.lastChecked).toLocaleTimeString()
                    : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Check Frequency</span>
                <span className="font-black text-slate-900 dark:text-white">
                  Every {selectedMonitor?.frequency} min
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* SSL Certificates Section */}
        <div className="min-w-0 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              SSL Certificates
            </h2>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Verifying certificates...
                </p>
              </div>
            ) : monitors.filter((m) => m.type === "SSL").length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 py-20 dark:border-slate-800">
                <ShieldCheck className="mb-4 h-12 w-12 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">No SSL certificates tracked yet</p>
              </div>
            ) : (
              monitors
                .filter((m) => m.type === "SSL")
                .map((m) => (
                  <SSLItem
                    key={m._id}
                    monitor={m}
                    onDelete={async () => handleDelete(m._id!)}
                    onEdit={() => {
                      handleEdit(m)
                    }}
                    onView={() => {
                      setSelectedMonitor(m)
                      setDetailsOpen(true)
                    }}
                  />
                ))
            )}
          </div>
        </div>

        {/* Domains Section */}
        <div className="min-w-0 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight">
              <Globe className="h-5 w-5 text-blue-500" />
              Registered Domains
            </h2>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Loading domains...
                </p>
              </div>
            ) : monitors.filter((m) => m.type === "DOMAIN").length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 py-20 dark:border-slate-800">
                <Globe className="mb-4 h-12 w-12 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">No domains tracked yet</p>
              </div>
            ) : (
              monitors
                .filter((m) => m.type === "DOMAIN")
                .map((m) => (
                  <DomainItem
                    key={m._id}
                    monitor={m}
                    onDelete={async () => handleDelete(m._id!)}
                    onEdit={() => {
                      setEditingDomain(m)
                      setDomainModalOpen(true)
                    }}
                    onView={() => {
                      setSelectedMonitor(m)
                      setDetailsOpen(true)
                    }}
                  />
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SSLItem({
  monitor,
  onDelete,
  onEdit,
  onView
}: {
  monitor: IMonitor
  onDelete: () => void
  onEdit: () => void
  onView: () => void
}) {
  const { name, target: domain, expiryDate, status } = monitor

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!expiryDate) {
      return null
    }
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const daysLeft = getDaysUntilExpiry()
  const isExpiringSoon = daysLeft !== null && daysLeft < 7 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0
  const expiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "---"

  const [checking, setChecking] = useState(false)
  const onCheckNow = async () => {
    if (!monitor._id || checking) {
      return
    }
    setChecking(true)
    try {
      const res = await apiClient.post(`/api/monitor/${monitor._id}/check`, {})
      if (res.ok) {
        toast.success("Certificate checked. Expiry updated.")
        window.dispatchEvent(new CustomEvent("monitor-refresh"))
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error || "Check failed")
      }
    } catch {
      toast.error("Check failed")
    } finally {
      setChecking(false)
    }
  }

  const statusLabel = isExpired
    ? "Certificate Expired"
    : isExpiringSoon
      ? "Certificate Expiring Soon"
      : "Certificate Status: Healthy"

  return (
    <div className="group flex flex-col gap-5 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:border-red-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      {/* Row 1: icon, name, domain, actions — no overlap with expiry */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] shadow-inner sm:h-16 sm:w-16",
            isExpired
              ? "bg-red-50 text-red-500"
              : isExpiringSoon
                ? "bg-amber-50 text-amber-500"
                : "bg-emerald-50 text-emerald-500"
          )}
        >
          <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black tracking-tight sm:text-xl">{name}</h3>
          <p className="truncate text-[10px] font-black tracking-wider text-slate-400 uppercase">
            {domain}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onCheckNow}
            disabled={checking}
            className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 sm:gap-2 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            {checking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Activity className="h-3 w-3" />
            )}
            {checking ? "Checking…" : "Check now"}
          </button>
          <button
            onClick={onView}
            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-4 sm:text-sm dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <div
            className={cn(
              "rounded-full px-3 py-1.5 text-[10px] font-black tracking-widest uppercase sm:px-4",
              isExpired
                ? "bg-red-500 text-white"
                : isExpiringSoon
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-500 text-white"
            )}
          >
            {isExpired ? "EXPIRED" : isExpiringSoon ? "WARNING" : "SECURE"}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Edit2 className="h-4 w-4" />
                Edit details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Remove check
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: status + expiry on separate row so they never overlap */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 italic">{statusLabel}</p>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Expires
          </span>
          <span
            className={cn(
              "text-base font-black tracking-tighter sm:text-lg",
              isExpired
                ? "text-red-600 dark:text-red-400"
                : isExpiringSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-white"
            )}
          >
            {expiry}
          </span>
          {daysLeft !== null && (
            <span
              className={cn(
                "text-[10px] font-bold",
                isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-slate-400"
              )}
            >
              {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
function DomainItem({
  monitor,
  onDelete,
  onEdit,
  onView
}: {
  monitor: IMonitor
  onDelete: () => void
  onEdit: () => void
  onView: () => void
}) {
  const { name, target: domain, expiryDate, price, metadata } = monitor
  const registrar = metadata?.registrar || ""
  const purchaseDate = metadata?.purchaseDate
  const notes = metadata?.notes || ""

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!expiryDate) {
      return null
    }
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const daysLeft = getDaysUntilExpiry()
  const isExpiringSoon = daysLeft !== null && daysLeft < 30 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0
  const expiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "---"

  return (
    <div className="group flex flex-col gap-5 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:border-blue-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] shadow-inner sm:h-16 sm:w-16",
            isExpired
              ? "bg-red-50 text-red-500"
              : isExpiringSoon
                ? "bg-amber-50 text-amber-500"
                : "bg-blue-50 text-blue-500"
          )}
        >
          <Globe className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black tracking-tight sm:text-xl">{name}</h3>
          <p className="truncate text-[10px] font-black tracking-wider text-slate-400 uppercase">
            {domain}
          </p>
          {registrar && (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500 italic">
              Registrar: {registrar}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onView}
            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-4 sm:text-sm dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <div
            className={cn(
              "rounded-full px-3 py-1.5 text-[10px] font-black tracking-widest uppercase sm:px-4",
              isExpired
                ? "bg-red-500 text-white"
                : isExpiringSoon
                  ? "bg-amber-500 text-white"
                  : "bg-blue-500 text-white"
            )}
          >
            {isExpired ? "EXPIRED" : isExpiringSoon ? "WARNING" : "ACTIVE"}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-500 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Edit2 className="h-4 w-4" />
                Edit domain
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Remove domain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
          Domain expiry
        </span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Expires
          </span>
          <span
            className={cn(
              "text-base font-black tracking-tighter sm:text-lg",
              isExpired
                ? "text-red-600 dark:text-red-400"
                : isExpiringSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-white"
            )}
          >
            {expiry}
          </span>
          {daysLeft !== null && (
            <span
              className={cn(
                "text-[10px] font-bold",
                isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-slate-400"
              )}
            >
              {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
            </span>
          )}
        </div>
      </div>

      {/* Domain Details — contained so it doesn’t overlap other cards */}
      <div className="space-y-3 border-t border-slate-100 pt-4 text-[10px] dark:border-slate-800">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {price && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <span className="font-black tracking-tighter text-slate-400 uppercase">Price</span>
                <p className="font-bold text-slate-600 dark:text-slate-400">${price}</p>
              </div>
            </div>
          )}
          {purchaseDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <span className="font-black tracking-tighter text-slate-400 uppercase">
                  Purchased
                </span>
                <p className="font-bold text-slate-600 dark:text-slate-400">
                  {new Date(purchaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
        {notes && (
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
            <p className="font-bold text-slate-600 dark:text-slate-400">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
