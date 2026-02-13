"use client"

import { ChevronRight } from "lucide-react"
import React from "react"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs"

export function Breadcrumbs() {
  const { items, rootLink } = useBreadcrumbs()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.length === 1 ? (
          <BreadcrumbItem>
            <BreadcrumbLink
              href={items[0].link}
              className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase transition-colors hover:text-blue-600"
            >
              {items[0].title}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <>
            {/* Mobile view */}
            <BreadcrumbItem className="md:hidden">
              <BreadcrumbLink href={rootLink} className="text-slate-400">
                <BreadcrumbEllipsis className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="opacity-30 md:hidden">
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem className="md:hidden">
              <BreadcrumbLink
                href={items[items.length - 1].link}
                className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase"
              >
                {items[items.length - 1].title}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Desktop view */}
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              return (
                <React.Fragment key={item.link}>
                  <BreadcrumbItem className="hidden md:inline-flex">
                    <BreadcrumbLink
                      href={item.link}
                      className={item.link === "#" ? "pointer-events-none" : ""}
                    >
                      <span
                        className={
                          isLast
                            ? "text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase"
                            : "text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                        }
                      >
                        {item.title}
                      </span>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < items.length - 1 && (
                    <BreadcrumbSeparator className="mx-1 hidden opacity-20 md:inline-flex">
                      <ChevronRight className="h-3 w-3" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              )
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
