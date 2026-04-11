import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import Header from "@/components/layout/Header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth/client"

import { render, screen } from "../../test-utils"

vi.mock("@/components/layout/Breadcrumbs", () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}))

vi.mock("@/i18n/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })),
  Link: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}))

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation")
  return {
    ...actual,
    useParams: vi.fn(() => ({
      locale: "en",
      boardId: "test-board-id"
    })),
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn()
    })),
    useSearchParams: vi.fn(() => new URLSearchParams())
  }
})

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn()
  }
}))

vi.mock("@/components/layout/UserNav", () => ({
  __esModule: true,
  UserNav: () => <div data-testid="user-nav">UserNav</div>
}))

vi.mock("@/components/layout/ThemeToggle", () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle">ThemeToggle</div>
}))

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
    dismissNotification: vi.fn()
  })
}))

describe("Header Component", () => {
  const mockSession = {
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      image: null
    }
  }

  beforeEach(() => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: mockSession,
      isPending: false,
      error: null
    } as any)
  })

  it("should render breadcrumbs, calendar link, theme, and user nav", () => {
    render(
      <SidebarProvider>
        <Header />
      </SidebarProvider>
    )

    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument()
    expect(screen.getByTestId("user-nav")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()

    const calendar = screen.getByRole("link", { name: "Calendar" })
    expect(calendar).toHaveAttribute("href", "/calendar")
  })
})
