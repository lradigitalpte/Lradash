"use client"

import { CalendarCheck2, CheckCircle2, Link2, RefreshCcw, Unplug } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGoogleWorkspaceConnection } from "@/hooks/useGoogleWorkspaceConnection"

interface GoogleWorkspaceConnectionCardProps {
  projectId?: string
}

export function GoogleWorkspaceConnectionCard({ projectId }: GoogleWorkspaceConnectionCardProps) {
  const { loading, busy, status, connect, disconnect } = useGoogleWorkspaceConnection(projectId)

  return (
    <Card className="rounded-3xl border-slate-200/60 bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
              <CalendarCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Google Calendar & Meet</CardTitle>
              <CardDescription>
                Connect your Google account to schedule Meet calls from the app.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              status.needsCalendarReconnect
                ? "border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400"
                : status.connected
                  ? "border-emerald-200 text-emerald-600"
                  : "text-slate-500"
            }
          >
            {loading
              ? "Checking..."
              : status.needsCalendarReconnect
                ? "Calendar access needed"
                : status.connected
                  ? "Connected"
                  : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
          {status.needsCalendarReconnect ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Signed in as {status.accountEmail || "your Google account"}, but Calendar permission
                is missing.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Creating meetings needs the <span className="font-medium">calendar.events</span>{" "}
                scope. Click below to approve it on Google&apos;s screen (enable{" "}
                <span className="font-medium">Calendar API</span> in Google Cloud if you
                haven&apos;t already).
              </p>
              {status.scopes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {status.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="max-w-full truncate">
                      {scope.split("/").pop()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : status.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Connected as {status.accountEmail || "Google account"}
              </div>
              <p className="text-sm text-slate-500">
                This account can create Calendar events with Google Meet links for your workspace.
              </p>
              {status.scopes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {status.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="max-w-full truncate">
                      {scope.split("/").pop()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Google account connected yet.
              </p>
              <p className="text-sm text-slate-500">
                Connect once, then schedule, reschedule, cancel, and join Meet calls directly from
                your project workflow.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {status.needsCalendarReconnect ? (
            <>
              <Button
                type="button"
                onClick={async () => connect(false)}
                disabled={busy}
                className="rounded-2xl bg-linear-to-r from-amber-600 to-orange-600"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Grant Calendar access
              </Button>
              <Button
                type="button"
                onClick={disconnect}
                disabled={busy}
                variant="outline"
                className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : status.connected ? (
            <>
              <Button
                type="button"
                onClick={async () => connect(true)}
                disabled={busy}
                variant="outline"
                className="rounded-2xl"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
              <Button
                type="button"
                onClick={disconnect}
                disabled={busy}
                variant="outline"
                className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={async () => connect(false)}
              disabled={busy}
              className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Connect Google
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
