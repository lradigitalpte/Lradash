"use client"

import { Zap, Shield, Globe, Activity, ArrowRight, Sparkles } from "lucide-react"

import { Icons } from "@/components/layout/Icons"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

import UserAuthForm from "./UserAuthForm"

export default function SignInViewPage() {
  return (
    <main
      aria-label="Sign in page"
      className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 lg:flex-row"
    >
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] animate-pulse rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[20%] h-[70%] w-[70%] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Hero Visual Section (Left) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 p-16 lg:flex lg:w-1/2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />

        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />

        <div className="relative z-20 flex items-center gap-4">
          <div className="flex h-12 items-center justify-center p-1">
            <Icons.projectLogo className="h-full w-auto" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">
              Project Workspace
            </span>
          </div>
        </div>

        <div className="relative z-20 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase shadow-sm">
                System Version 2.4
              </span>
              <div className="h-1 w-1 animate-pulse rounded-full bg-blue-500" />
            </div>
            <h1 className="text-7xl leading-[0.85] font-black tracking-tighter text-white">
              DELIVER <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                EXCELLENCE.
              </span>
            </h1>
            <p className="max-w-md text-xl font-medium text-slate-400 italic opacity-80">
              Your centralized dashboard for efficient project tracking and team collaboration.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10">
            {[
              { icon: Zap, label: "Projects", value: "Active", color: "text-emerald-400" },
              { icon: Shield, label: "Security", value: "Verified", color: "text-blue-400" },
              { icon: Globe, label: "Uptime", value: "99.9%", color: "text-indigo-400" },
              { icon: Activity, label: "Performance", value: "Fast", color: "text-amber-400" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <stat.icon className={cn("h-5 w-5", stat.color)} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {stat.label}
                  </span>
                  <span className="mt-0.5 text-sm font-bold text-white uppercase">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-20 pt-10">
          <div className="flex max-w-xs items-center gap-4 rounded-3xl border border-blue-600/20 bg-blue-600/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[11px] leading-tight font-bold text-blue-300">
              Ready to manage your next big project.
            </p>
          </div>
        </div>
      </div>

      {/* Login Section (Right) */}
      <div className="relative flex flex-1 items-center justify-center p-8 lg:p-12">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent" />

        <div className="relative z-20 w-full max-w-[440px]">
          <div className="space-y-10">
            <div className="space-y-2 text-center lg:text-left">
              <div className="mb-8 flex justify-center lg:hidden">
                <div className="flex h-14 items-center justify-center p-1">
                  <Icons.projectLogo className="h-full w-auto" />
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                Welcome Back.
              </h2>
              <p className="text-sm font-medium text-slate-500 italic">
                Sign in to access your projects and dashboard
              </p>
            </div>

            <div className="group/card relative">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 blur transition duration-1000 group-hover/card:opacity-20" />
              <div className="relative rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-10 shadow-2xl backdrop-blur-3xl">
                <UserAuthForm />
              </div>
            </div>

            <div className="flex flex-col gap-4 text-center">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase italic">
                  Secure Authentication
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                New here?
                <Link
                  href="/signup"
                  className="group flex items-center gap-1.5 text-[11px] font-black tracking-widest text-white uppercase transition-colors hover:text-blue-400"
                >
                  Sign Up
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Footer Detail */}
        <div className="absolute right-8 bottom-8 hidden lg:block">
          <p className="text-[9px] font-black tracking-[0.4em] text-slate-700 uppercase">
            LRA PROJECT | MANAGEMENT DASHBOARD
          </p>
        </div>
      </div>
    </main>
  )
}
