import React from "react"

import { cn } from "@/lib/utils"

const LOGO_SRC = "/LRA-website-favicon-3.1-2048x1133.png"

export const Icons = {
  projectLogo: ({ className }: { className?: string }) => (
    <img src={LOGO_SRC} alt="LRADASH Logo" className={className} style={{ objectFit: "contain" }} />
  ),

  /**
   * Logo on a dark plate so light / white artwork is visible on light sidebars.
   * (Avoids “white on white” when the asset is designed for dark backgrounds.)
   */
  logoMark: ({ className, imgClassName }: { className?: string; imgClassName?: string }) => (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 shadow-inner ring-1 ring-black/25 dark:from-slate-700 dark:to-slate-950 dark:ring-white/15",
        className
      )}
    >
      <img
        src={LOGO_SRC}
        alt=""
        className={cn("max-h-[82%] max-w-[82%] object-contain", imgClassName)}
        style={{ objectFit: "contain" }}
      />
    </span>
  )
}
