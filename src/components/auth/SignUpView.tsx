"use client"

import { Zap, Shield, Globe, Activity, ArrowRight, Sparkles, Building } from "lucide-react"

import { Icons } from "@/components/layout/Icons"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

import SignUpForm from "./SignUpForm"

export default function SignUpViewPage() {
  return (
    <main
      aria-label="Sign up page"
      className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 lg:flex-row"
    >
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[70%] w-[70%] animate-pulse rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[60%] w-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
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
                Create Your Account
              </span>
              <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <h1 className="text-7xl leading-[0.85] font-black tracking-tighter text-white">
              START <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                COLLABORATING.
              </span>
            </h1>
            <p className="max-w-md text-xl font-medium text-slate-400 italic opacity-80">
              Empower your team with a centralized workspace for seamless project management.
            </p>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
              Platform Features:
            </p>
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  icon: Building,
                  label: "Team Collaboration",
                  desc: "Seamlessly integrate your team and project workflows."
                },
                {
                  icon: Shield,
                  label: "Enterprise Security",
                  desc: "Your data is protected with industry-standard encryption."
                },
                {
                  icon: Activity,
                  label: "Real-time Insights",
                  desc: "Track progress and performance across all projects."
                }
              ].map((protocol, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-blue-400 transition-transform group-hover:scale-110">
                    <protocol.icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-widest text-white uppercase">
                      {protocol.label}
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-slate-500 uppercase italic">
                      {protocol.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20">
          <p className="text-[9px] font-black tracking-[0.4em] text-slate-700 uppercase">
            LRA PROJECT | SECURE ACCOUNT SETUP
          </p>
        </div>
      </div>

      {/* Signup Section (Right) */}
      <div className="relative flex flex-1 items-center justify-center p-8 lg:p-12">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-indigo-900/5 via-transparent to-transparent" />

        <div className="relative z-20 w-full max-w-[480px]">
          <div className="space-y-10">
            <div className="space-y-2 text-center lg:text-left">
              <div className="mb-8 flex justify-center lg:hidden">
                <div className="flex h-14 items-center justify-center p-1">
                  <Icons.projectLogo className="h-full w-auto" />
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                Create Account.
              </h2>
              <p className="text-sm font-medium text-slate-500 italic">
                Enter your details to set up your team workspace
              </p>
            </div>

            <div className="group/card relative">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-600 to-blue-600 opacity-10 blur transition duration-1000 group-hover/card:opacity-20" />
              <div className="relative rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-10 shadow-2xl backdrop-blur-3xl">
                <SignUpForm />
              </div>
            </div>

            <div className="flex flex-col gap-4 text-center">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-600 uppercase italic">
                  Team Registration
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                Already registered?
                <Link
                  href="/login"
                  className="group flex items-center gap-1.5 text-[11px] font-black tracking-widest text-white uppercase transition-colors hover:text-blue-400"
                >
                  Login
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
