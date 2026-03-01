"use client"

import { useEffect } from "react"

import { useRouter } from "@/i18n/navigation"

export default function AnalyticsRoot() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/analytics/projects")
  }, [router])
  return null
}
