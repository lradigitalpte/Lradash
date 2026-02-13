# Antigravity Design System : Premium AI Aesthetic

This document outlines the core design principles and UI tokens used to achieve the "Premium AI" look for the Project Management dashboard.

## 1. Core Philosophy: "Luxury Utility"
The goal is to blend high-end consumer aesthetics with professional productivity tools. The interface should feel expensive, responsive, and "intelligent."

## 2. Visual Tokens

### 🧊 Glassmorphism & Translucency
We use backdrop blurs and semi-transparent backgrounds to create depth without clutter.
- **Surface**: `bg-white/80` or `bg-slate-950/80`
- **Blur**: `backdrop-blur-xl` or `backdrop-blur-2xl`
- **Border**: Thin, high-contrast borders (`border-white/20` or `border-slate-800/50`)

### ⭕ Radius System (The "Pill" Aesthetic)
Square corners are avoided. We use large, inviting radii.
- **Small Components (Buttons/Badges)**: `rounded-xl` (12px)
- **Standard Cards**: `rounded-3xl` (24px)
- **Large Sections/Member Cards**: `rounded-[2.5rem]` (40px)

###  sombras Elevation & Depth
Depth is created using wide, soft, and often colored shadows.
- **Default**: `shadow-2xl shadow-slate-200/50`
- **Primary Action**: `shadow-xl shadow-blue-500/25`
- **Inner Depth**: `shadow-inner` for input fields and recessed areas.

### 🎨 Color Palette
- **Primary**: `blue-600` (#2563eb) - The "Intelligence" Blue.
- **Gradients**: Often used for accents and headers (e.g., `from-blue-600 to-indigo-700`).
- **Semantic Layers**:
  - `ALERT`: Red/Rose (Destructive/Maintenance)
  - `MILESTONE`: Amber/Gold (Achievement)
  - `SUCCESS`: Emerald/Green (Completion)

## 3. Typography Hierarchy

| Style | Tailwind Classes | Usage |
|-------|------------------|-------|
| **Mega Header** | `text-4xl font-black tracking-tighter` | Page Titles |
| **Section Header** | `text-2xl font-bold tracking-tight` | Component Titles |
| **Micro Label** | `text-[10px] font-black uppercase tracking-[0.2em] text-slate-400` | Categories / Metadata Labels |
| **Body Emphasis** | `font-medium italic text-slate-500` | Subtitles / Captions |

## 4. Component Patterns

### The "WOW" Header
A page header should never be just text. It should include:
1. A 3D or high-contrast icon in a `rounded-2xl` container.
2. A small, uppercase "context badge" above the title.
3. A descriptive, often italicized subtitle that emphasizes the project name.

### Interactive Members/Items
Items should react to user presence:
- **Hover**: `hover:-translate-y-1 transition-all duration-300`
- **Group effects**: Using `group` on a parent to reveal hidden actions (like "More" buttons) on child elements.

## 5. Iconography
We use **Lucide React**. Icons are rarely raw; they are usually:
- Placed inside a `w-10 h-10` container with a background.
- Styled with a stroke width of `2`.
- Given a colored shadow matching their theme.
