"use client"

import { Lock, Mail, User, Building, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSignUpForm } from "@/hooks/useSignUpForm"

export default function SignUpForm() {
  const { form, loading, onSubmit } = useSignUpForm()

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          form
            .handleSubmit(onSubmit)(e)
            .catch((error: unknown) => {
              console.error(error)
            })
        }}
        className="w-full space-y-6"
        aria-label="Sign up form"
        data-testid="signup-form"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="group/field relative">
                    <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover/field:text-blue-500" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-sm font-bold text-white transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      data-testid="name-input"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-[10px] font-bold tracking-widest text-rose-500 uppercase" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Email Address
                </FormLabel>
                <FormControl>
                  <div className="group/field relative">
                    <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover/field:text-blue-500" />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-sm font-bold text-white transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      data-testid="email-input"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-[10px] font-bold tracking-widest text-rose-500 uppercase" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="group/field relative">
                    <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover/field:text-blue-500" />
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-sm font-bold text-white transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      data-testid="password-input"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-[10px] font-bold tracking-widest text-rose-500 uppercase" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="group/field relative">
                    <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover/field:text-blue-500" />
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-sm font-bold text-white transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      data-testid="confirm-password-input"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-[10px] font-bold tracking-widest text-rose-500 uppercase" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel className="ml-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Organization Name
                </FormLabel>
                <FormControl>
                  <div className="group/field relative">
                    <Building className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-hover/field:text-blue-500" />
                    <Input
                      type="text"
                      placeholder="Organization Name"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pr-4 pl-12 text-sm font-bold text-white transition-all placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                      disabled={loading}
                      data-testid="organization-input"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="mt-1 text-[10px] font-bold tracking-widest text-rose-500 uppercase" />
              </FormItem>
            )}
          />
        </div>

        <Button
          disabled={loading}
          className="group/btn relative mt-4 h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-[11px] font-black tracking-[0.2em] text-white uppercase shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.01] hover:from-blue-700 hover:to-indigo-700"
          type="submit"
          data-testid="submit-button"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="relative z-10">Sign Up</span>
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            </div>
          )}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/btn:animate-[shimmer_2s_infinite]" />
        </Button>
      </form>
    </Form>
  )
}
