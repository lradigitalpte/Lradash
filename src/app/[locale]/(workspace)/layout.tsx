import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import RootWrapper from "@/components/layout/RootWrapper"

interface AppLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AppLayout(props: Readonly<AppLayoutProps>) {
  const { children, params } = props
  const resolvedParams = await params
  const { locale } = resolvedParams
  const t = await getTranslations({ locale, namespace: "sidebar" })

  // Auth check is handled by proxy (proxy.ts)
  // No need to check here

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <RootWrapper>{children}</RootWrapper>
    </Suspense>
  )
}
