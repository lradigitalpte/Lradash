import { ReactNode } from "react"

interface BoardProjectsLayoutProps {
  children: ReactNode
}

export default function BoardProjectsLayout({ children }: BoardProjectsLayoutProps) {
  // This layout bypasses the main sidebar/header to show board-specific navigation
  return <>{children}</>
}
