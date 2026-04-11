/** Shared sidebar nav row + section label styles (App + Client sidebars) */
export const SIDEBAR_NAV_ITEM =
  "relative h-8 gap-2.5 rounded-md px-2 text-[13px] font-medium text-sidebar-foreground/85 transition-colors " +
  "hover:bg-sidebar-accent/90 hover:text-sidebar-foreground " +
  "data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary " +
  "data-[active=true]:before:absolute data-[active=true]:before:left-0.5 data-[active=true]:before:top-1/2 data-[active=true]:before:h-5 " +
  "data-[active=true]:before:w-0.5 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary " +
  "[&>svg]:size-[15px] [&>svg]:opacity-80 data-[active=true]:[&>svg]:opacity-100"

export const SIDEBAR_SECTION_LABEL =
  "!h-auto min-h-0 py-1 text-muted-foreground/80 mb-0 px-2 text-[10px] font-semibold uppercase tracking-[0.12em]"

/** Roomier rows + labels for dense sidebars (e.g. Monitor) */
export const SIDEBAR_NAV_ITEM_SPACIOUS =
  "relative min-h-10 h-auto py-2.5 gap-3 rounded-md px-2.5 text-[13px] font-medium text-sidebar-foreground/85 transition-colors " +
  "hover:bg-sidebar-accent/90 hover:text-sidebar-foreground " +
  "data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary " +
  "data-[active=true]:before:absolute data-[active=true]:before:left-0.5 data-[active=true]:before:top-1/2 data-[active=true]:before:h-6 " +
  "data-[active=true]:before:w-0.5 data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary " +
  "[&>svg]:size-[17px] [&>svg]:shrink-0 [&>svg]:opacity-80 data-[active=true]:[&>svg]:opacity-100"

export const SIDEBAR_SECTION_LABEL_SPACIOUS =
  "!h-auto min-h-0 py-1.5 text-muted-foreground/80 mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em]"

/**
 * Project workspace sidebar — unified dark navy shell + blue active glow.
 * Collapsed: same palette; text/badge hidden via group-data-[collapsible=icon] in components.
 */
export const PROJECT_SIDEBAR_SHELL =
  "border-slate-800/90 shadow-[2px_0_32px_-12px_rgba(0,0,0,0.55)] " +
  "[&_[data-slot=sidebar-inner]]:!border-slate-800/90 [&_[data-slot=sidebar-inner]]:!bg-slate-950 [&_[data-slot=sidebar-inner]]:!text-slate-100"

export const PROJECT_SIDEBAR_BRAND_TITLE =
  "truncate text-xs font-bold uppercase tracking-[0.18em] text-white"

export const PROJECT_SIDEBAR_BRAND_SUBTITLE =
  "text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"

export const PROJECT_SIDEBAR_SECTION_LABEL =
  "!h-auto min-h-0 py-1.5 text-slate-500 mb-2.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em]"

/** Nav row: muted default; active = slate panel + blue glow (expanded & icon mode) */
export const PROJECT_SIDEBAR_NAV_ITEM =
  "relative min-h-10 h-auto gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-[13px] font-medium transition-all duration-200 " +
  "text-slate-400 hover:border-slate-700/80 hover:bg-slate-900/80 hover:text-slate-100 " +
  "data-[active=true]:border-blue-500/35 data-[active=true]:bg-slate-900 data-[active=true]:font-semibold data-[active=true]:text-white " +
  "data-[active=true]:shadow-[0_0_28px_-8px_rgba(59,130,246,0.55)] " +
  "[&_svg]:size-[17px] [&_svg]:shrink-0 [&_svg]:opacity-90 data-[active=true]:[&_svg]:opacity-100 data-[active=true]:[&_svg]:text-white " +
  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"

export const PROJECT_SIDEBAR_FOOTER_CTA =
  "min-h-10 gap-3 rounded-xl border border-rose-900/60 bg-rose-950/90 px-2.5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] " +
  "text-rose-100 shadow-sm transition-colors hover:border-rose-800 hover:bg-rose-900 " +
  "[&_svg]:size-[17px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"

/** Settings / neutral footer row in unified dark sidebars */
export const UNIFIED_SIDEBAR_SETTINGS_FOOTER =
  "min-h-10 gap-3 rounded-xl border border-slate-700/90 bg-slate-900/70 px-2.5 py-2.5 text-[13px] font-medium text-slate-200 shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-800 " +
  "[&_svg]:size-[17px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
