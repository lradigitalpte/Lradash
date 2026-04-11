import { describe, expect, it } from "vitest"

import { Icons } from "@/components/layout/Icons"

describe("Icons Object", () => {
  it("should export projectLogo and logoMark components", () => {
    expect(typeof Icons.projectLogo).toBe("function")
    expect(typeof Icons.logoMark).toBe("function")
  })
})
