# One Click DC — UI Look & Feel Guide

## Tech Stack

| Aspect | Technology |
|--------|-----------|
| Framework | React 19.2 + TypeScript 5.9 |
| Build Tool | Vite 7.3 |
| Router | Wouter 3.3 |
| Server State | React Query 5.60 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 + Class Variance Authority |
| Components | Shadcn/ui + Radix UI primitives |
| Icons | Lucide React (545 icons) |
| Charts | Recharts 2.15 |
| Graph Visualization | React Flow 11.11 + Dagre layout |
| Animations | Framer Motion 12.23 + custom CSS keyframes |
| Fonts | Inter (sans), JetBrains Mono (mono) — Google Fonts |

---

## Color Palette

The app uses a **dark theme** with purple, magenta, and cyan accents. All colors are defined as CSS custom properties in `client/src/index.css`.

### Core Colors

| Token | HSL | Hex (approx) | Usage |
|-------|-----|---------------|-------|
| `--background` | `260 50% 8%` | `#0f0819` | Page background — deep purple-black |
| `--foreground` | `260 10% 95%` | `#f2f0f7` | Primary text — off-white |
| `--card` | `260 40% 12% / 0.6` | Translucent purple | Card surfaces (60% opacity) |
| `--card-foreground` | `260 10% 95%` | `#f2f0f7` | Card text |
| `--popover` | `260 45% 10%` | `#130d1f` | Dropdown/popover surfaces |
| `--muted` | `260 30% 18%` | `#2a2039` | Muted backgrounds |
| `--muted-foreground` | `260 20% 60%` | `#9896a4` | Secondary/muted text |
| `--accent` | `260 40% 22%` | `#3d3553` | Hover/active backgrounds |
| `--border` | `260 30% 22%` | `#3d3553` | Borders and dividers |
| `--input` | `260 30% 18%` | `#2a2039` | Input field backgrounds |

### Accent Colors

| Token | HSL | Hex (approx) | Usage |
|-------|-----|---------------|-------|
| `--primary` | `300 100% 60%` | `#ff00ff` | Primary actions — bright magenta |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--primary-glow` | `300 100% 60% / 0.5` | — | Glow/shadow effects |
| `--secondary` | `180 100% 50%` | `#00ffff` | Secondary accent — cyan |
| `--destructive` | `0 80% 60%` | `#ff4d4d` | Error/delete actions — red |
| `--ring` | `300 100% 60%` | `#ff00ff` | Focus rings — magenta |

### Gradient Background

The page background uses a subtle gradient:
```
bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
```

---

## Typography

### Font Families

- **Body / UI:** Inter (weights 300–700)
- **Code / Metrics:** JetBrains Mono (weights 400, 500, 700)

Both loaded from Google Fonts in `client/index.html`.

### Font Sizes (Tailwind scale)

| Class | Size | Typical Usage |
|-------|------|---------------|
| `text-xs` | 12px | Badges, captions, metadata |
| `text-sm` | 14px | Table cells, secondary text, form labels |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Section headers |
| `text-xl` | 20px | Page titles (mobile) |
| `text-2xl` | 24px | Page titles (desktop) |
| `text-3xl` | 30px | Hero/feature titles (rare) |

---

## Spacing & Sizing

### Border Radius

| Token | Value | Tailwind Class |
|-------|-------|---------------|
| `--radius-sm` | 8px | `rounded-md` |
| `--radius-md` | 12px | `rounded-lg` |
| `--radius-lg` | 16px | `rounded-xl` |
| `--radius-xl` | 24px | `rounded-2xl` |

### Common Spacing

| Context | Value |
|---------|-------|
| Card padding | `p-6` (24px) |
| Main content padding | `p-4 md:p-6` (16px mobile, 24px desktop) |
| Table cell padding | `p-2` (8px) |
| Gap between grid items | `gap-4` or `gap-6` (16–24px) |
| Input height | `h-9` (36px) |

### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-content` | 10 | Content layers |
| `--z-sticky` | 20 | Sticky elements |
| `--z-header` | 50 | Main navigation |
| `--z-dropdown` | 60 | Dropdown menus |
| `--z-modal` | 100 | Modals/dialogs |

---

## Layout Structure

### Page Shell

```
┌─────────────────────────────────────────┐
│  MainNav (sticky, h-14, z-50)           │
│  bg-black/40 backdrop-blur-md           │
│  border-b border-white/5                │
│  [Logo] [Breadcrumbs] [Status] [☰]     │
├─────────────────────────────────────────┤
│                                         │
│  <main className="flex-1 p-4 md:p-6">  │
│                                         │
│     Page content...                     │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

- **No permanent sidebar** — navigation via hamburger menu
- Header: 56px tall, sticky, glass-morphism background
- Content: flex-1 fills remaining height
- Background: gradient from `slate-950` → `slate-900` → `slate-950`

### Navigation Menu

- Triggered by hamburger icon (top-right)
- Mobile: fixed sidebar overlay, 320px wide (`w-80`)
- Background: `bg-black/40` overlay + `bg-slate-900` panel
- Grouped by category:
  - **Explore:** Buildings, System Explorer, Graphs, Lookup Tables
  - **Analyze:** Console, Runs, Rate Sensitivity, Submeter, Performance
  - **Proposals:** Generate, Proposals List
  - **Admin:** Node Library, Import

---

## Component Patterns

### Cards

```tsx
<Card>                        // rounded-xl, bg-card, border
  <CardHeader>                // p-6
    <CardTitle />             // text-lg font-semibold
    <CardDescription />       // text-sm text-muted-foreground
  </CardHeader>
  <CardContent />             // p-6 pt-0
  <CardFooter />              // p-6 pt-0, flex items-center
</Card>
```

### Glass Panels

Custom utility classes for frosted-glass surfaces:

```css
.glass-panel {
  /* bg-card backdrop-blur-xl border border-white/10 shadow-xl */
}
.glass-panel-hover {
  /* Adds transition + lighter bg/border on hover */
}
```

### Buttons

Variants via Shadcn/ui + CVA:
- **default** — magenta background (`bg-primary`)
- **destructive** — red background
- **outline** — transparent with border
- **secondary** — muted purple background
- **ghost** — transparent, hover highlights
- **link** — underlined text style

Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (h-9 w-9)

### Badges

```tsx
<Badge variant="outline">Label</Badge>
```
- Rounded: `rounded-md`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`
- Used for status indicators, tags, graph modes

### Tables

- Responsive via horizontal scroll wrapper
- Row hover: `hover:bg-muted/50`
- Used on Buildings, Proposals, Lookups pages

### Dialogs / Modals

- Overlay: `bg-black/80`
- Animated entrance: `animate-in fade-in`
- Z-index: 50
- Built on Radix Dialog primitive

### Toast Notifications

- **Sonner** toast library
- Appears bottom-right
- Auto-dismisses

---

## Glow Effects

The design uses characteristic glow effects for emphasis:

| Class | Effect |
|-------|--------|
| `.text-glow` | Text shadow at `currentColor` |
| `.text-glow-cyan` | Cyan text shadow (`hsl(180 100% 50% / 0.6)`) |
| `.border-glow` | Magenta box shadow (`#ff00ff` at 30% opacity) |
| `.border-glow-cyan` | Cyan box shadow (`#00ffff` at 40% opacity) |
| `.override-active` | Cyan background + glow for active nodes |

### Node Type Styling (Graph Visualizations)

| Class | Color | Usage |
|-------|-------|-------|
| `.node-input` | Cyan | Input nodes |
| `.node-formula` | Pink/Magenta | Formula nodes |
| `.node-function` | Purple | Function nodes |

---

## Animations

### CSS Keyframes

| Name | Duration | Effect |
|------|----------|--------|
| `animate-pulse-glow` | 2s infinite | Pulsing glow on box-shadow |
| `animate-slide-up` | 0.2s | Slide up + fade in |
| `animate-slide-down` | 0.2s | Slide down + fade in |
| `animate-fade-in` | 0.15s | Pure fade in |

### Transitions

Common transition patterns:
- `transition-all duration-200` — general hover effects
- `transition-colors` — color-only transitions
- Framer Motion used for more complex orchestrated animations

---

## Responsive Design

### Breakpoints (Tailwind defaults)

| Prefix | Min Width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Common Responsive Patterns

```tsx
// Grid columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Flex direction
className="flex flex-col sm:flex-row"

// Text sizing
className="text-xl sm:text-2xl"

// Padding
className="p-4 md:p-6"

// Breadcrumbs: condensed on mobile
className="hidden md:flex"  // full breadcrumbs
className="md:hidden"       // mobile breadcrumbs
```

---

## Scrollbar Styling

Custom thin scrollbars:
- Width: 6px
- Track: transparent
- Thumb: `hsl(260 30% 25%)` (dark purple)
- Thumb hover: `hsl(260 30% 35%)` (lighter)
- Border radius: 3px

---

## Print Styles

- White background, black text
- 12pt font size
- No shadows, borders, or decorative elements
- `print-color-adjust: exact` for charts
- `page-break-inside: avoid` on key elements

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Welcome page with workflow steps |
| `/buildings` | Buildings | List/search building profiles |
| `/buildings/:id` | Building Detail | Edit building, view energy data |
| `/console` | Console | Browse and select calculation graphs |
| `/console/:id` | Console Detail | Configure & run a calculation graph |
| `/generate` | Generate Proposal | Multi-step proposal creation pipeline |
| `/proposals` | Proposals | View, download, manage proposals |
| `/runs` | Runs | View saved calculation runs |
| `/run/:id` | Run Results | Detailed results with charts |
| `/submeter` | Submeter | Stakeholder submetering config |
| `/sensitivity` | Rate Sensitivity | Tariff comparison analysis |
| `/system-explorer` | System Explorer | Browse buildings, models, runs |
| `/graphs` | Graphs | Browse calculation graph definitions |
| `/lookups` | Lookup Tables | Key-value reference data tables |
| `/admin/node-library` | Node Library | Admin: manage calculation nodes |
| `/performance` | Performance | API metrics & benchmarks |
| `/import` | Import | Upload ConEd CSV files |
| `/pages` | Page Directory | Site map |

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/index.css` | Theme variables, custom utilities, animations, scrollbar/print styles |
| `client/index.html` | Google Fonts imports, meta tags |
| `client/src/App.tsx` | Routes and global providers |
| `client/src/main.tsx` | React root, QueryClient, Toaster |
| `client/src/components/ui/` | 58 Shadcn/ui components |
| `client/src/components/layout/main-nav.tsx` | Header and navigation |
| `client/src/pages/` | All page components |
| `components.json` | Shadcn/ui configuration |

