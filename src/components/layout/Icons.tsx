import React from "react"

export const Icons = {
  projectLogo: ({ className }: { className?: string }) => (
    <img
      src="/LRA-website-favicon-3.1-2048x1133.png"
      alt="LRADASH Logo"
      className={className}
      style={{ objectFit: "contain" }}
    />
  )
}
