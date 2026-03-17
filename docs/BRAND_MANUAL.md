# DaisyChain Frontend Brand Manual

> **Consolidated design reference for all DaisyChain products.**
> Sources: `dc_flow/docs/design_guidelines.md` (Version C001, June 2025), `one_click_dc/UI_LOOK_AND_FEEL.md`, `_brand.py`, `design_config.js`

This document has two layers:

- **Part 1 — Brand Identity**: The official, external-facing visual identity used in proposals, print, and marketing (authoritative source: `dc_flow/docs/design_guidelines.md`).
- **Part 2 — App UI Theme**: The dark-theme design system used by the `one_click_dc` and `dc_dev` web applications (source: `one_click_dc/UI_LOOK_AND_FEEL.md` + `index.css`).

---

## Part 1 — Brand Identity

_Source: `dc_flow/docs/design_guidelines.md` (Version C001) + `dc_flow/output/proposals/gpt/layouts/_brand.py`_

### 1.1 Logo System

#### Approved Logo Forms

| Logo Form | Use Case |
|---|---|
| **Wordmark** | Text-only mark |
| **Stacked Lockup** | Narrow or vertical spaces |
| **Horizontal Lockup** | Default / general use (use when in doubt) |
| **Logomark — Small** | Compact icon contexts |
| **Logomark — Large** | Larger icon contexts |
| **T-Shirt Lockup** | Merchandise and apparel |

**Default choice:** When in doubt, use the **Horizontal Lockup**.
**Narrow spaces:** Use the **Stacked Lockup** for constrained or vertical layouts.

#### Logo Clearance Rule

Maintain clear space equal to the **height of the "D"** in the logo on all sides. No text, imagery, or graphic elements should enter this zone.

#### Logo Misuse — Do Not

- **Improvised lockups** — Do not rearrange or recombine logo elements into unofficial configurations.
- **Non-brand colors** — Do not recolor the logo outside the approved palette.
- **Outline treatments** — Do not use outlined or stroked versions of the logo.
- **Typed-out substitutes** — Do not type "DaisyChain" in any font as a stand-in for the logo.

---

### 1.2 Brand Palette

The palette is anchored by a single hero color — **Core Gold (#E8B533)** — evoking the bright center of a daisy. It is supported by a custom black and white, and complemented by pink and purple for energy, contrast, and expressive range.

| Swatch | Name | Hex | CSS Variable | Role |
|---|---|---|---|---|
| | **Core Gold** | `#E8B533` | `--dc-gold` | Hero / primary accent |
| | **Solar Rose** | `#F56F5F` | `--dc-rose` | Complementary accent |
| | **Circuit Violet** | `#7A28CB` | `--dc-violet` | Complementary accent |
| | **Studio White** | `#FCFCF1` | `--dc-white` | Neutral light |
| | **Panel Black** | `#090302` | `--dc-black` | Neutral dark |

**Derived / utility shades** (from `_brand.py`):

| Name | Hex | CSS Variable | Role |
|---|---|---|---|
| Muted | `#6b7280` | `--muted` | Secondary text |
| Border | `#e2e8f0` | `--border` | Dividers |
| Light BG | `#f8f8f4` | `--light-bg` | Section backgrounds |

---

### 1.3 Brand Typography

**Font stack:** `"Helvetica Neue", Helvetica, Arial, sans-serif`

| Element | Font Size | Line Height | Letter Spacing | Weight | Notes |
|---|---|---|---|---|---|
| **H1** | 48px | 54px | **-10px** | Bold / uppercase | Tight tracking pulls the headline together |
| **H2** | 24px | 36px | **+40px** | Bold / uppercase | Wide tracking; also used for CTAs |
| **Body (p)** | 24px | 32px | **+2px** | Regular | Standard readable body copy |

**Sizing rule:** H2 and body copy should be approximately half the size of the H1.

**Key spacing notes:**
- H1 uses negative letter-spacing (-10px) for tight, impactful headlines.
- H2 uses wide letter-spacing (+40px) for a spaced-out, all-caps label/CTA feel.
- Body uses minimal letter-spacing (+2px) for comfortable reading.

---

### 1.4 WCAG Contrast Pairs

Approved high-contrast pairings (pass WCAG legibility):

| Foreground | Background | Passes |
|---|---|---|
| Solar Rose `#F56F5F` | Panel Black `#090302` | Yes |
| Solar Rose `#F56F5F` | Black `#000000` | Yes |
| Circuit Violet `#7A28CB` | Studio White `#FCFCF1` | Yes |
| Circuit Violet `#7A28CB` | White `#FFFFFF` | Yes |
| Core Gold `#E8B533` | Panel Black `#090302` | Yes |
| Core Gold `#E8B533` | Black `#000000` | Yes |
| Studio White `#FCFCF1` | Panel Black `#090302` | Yes |
| Studio White `#FCFCF1` | Circuit Violet `#7A28CB` | Yes |
| Studio White `#FCFCF1` | Black `#000000` | Yes |
| Panel Black `#090302` | Studio White `#FCFCF1` | Yes |
| Panel Black `#090302` | Core Gold `#E8B533` | Yes |
| Panel Black `#090302` | Solar Rose `#F56F5F` | Yes |
| Panel Black `#090302` | White `#FFFFFF` | Yes |
| White `#FFFFFF` | Circuit Violet `#7A28CB` | Yes |
| White `#FFFFFF` | Panel Black `#090302` | Yes |
| White `#FFFFFF` | Black `#000000` | Yes |
| Black `#000000` | Core Gold `#E8B533` | Yes |
| Black `#000000` | Solar Rose `#F56F5F` | Yes |
| Black `#000000` | Studio White `#FCFCF1` | Yes |
| Black `#000000` | White `#FFFFFF` | Yes |

> **Rule of thumb:** When pairing colors, always reference this table. Combinations not listed here should be avoided for text and critical UI elements.

---

### 1.5 Proposal / Print Rules

From `_brand.py` — shared across all proposal layouts:

```css
@page {
  size: letter;
  margin: 0.85in 0.85in 0.75in;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages) " · DaisyChain Confidential";
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 7pt;
    color: #94a3b8;
  }
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

**Reset base for proposals:**
- Font: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- Size: `10pt`
- Line height: `1.5`
- Color: `var(--text)` (Panel Black)
- Background: `#fff`

---

### 1.6 Do's and Don'ts

| Do | Don't |
|---|---|
| Use approved logo forms only | Improvise lockups or rearrange logo elements |
| Reference the WCAG contrast table for pairings | Use untested color combinations for text |
| Use Helvetica Neue for brand/print materials | Substitute with other fonts in brand contexts |
| Keep clear space = height of the "D" | Crowd the logo with other elements |
| Use Core Gold `#E8B533` as the primary yellow | Use `#F1C40F` (see Reconciliation Notes below) |
| Keep professional output emoji-free | Add emojis to proposals or brand materials |
| Use only the 5 brand palette colors | Introduce off-palette colors |

---

## Part 2 — App UI Theme

_Source: `one_click_dc/UI_LOOK_AND_FEEL.md` + `one_click_dc/client/src/index.css`_
_Stack: React 19.2 + TypeScript 5.9 + Tailwind CSS v4 + Shadcn/ui + Radix UI + Framer Motion_

### 2.1 Dark Theme Palette

All colors are defined as CSS custom properties. The app uses a **dark theme** with purple, magenta, and cyan accents.

#### Core Colors

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `260 50% 8%` | `#0f0819` | Page background — deep purple-black |
| `--foreground` | `260 10% 95%` | `#f2f0f7` | Primary text — off-white |
| `--card` | `260 40% 12% / 0.6` | translucent purple | Card surfaces (60% opacity) |
| `--card-foreground` | `260 10% 95%` | `#f2f0f7` | Card text |
| `--card-border` | `260 40% 30% / 0.5` | — | Card border (50% opacity) |
| `--popover` | `260 40% 10%` / `260 45% 10%` | `#130d1f` | Dropdown/popover surfaces |
| `--popover-foreground` | `260 10% 95%` | `#f2f0f7` | Popover text |
| `--muted` | `260 30% 18%` | `#2a2039` | Muted backgrounds |
| `--muted-foreground` | `260 20% 60%` | `#9896a4` | Secondary/muted text |
| `--accent` | `260 40% 22%` | `#3d3553` | Hover/active backgrounds |
| `--accent-foreground` | `260 10% 95%` | `#f2f0f7` | Accent text |
| `--border` | `260 30% 22%` | `#3d3553` | Borders and dividers |
| `--input` | `260 30% 18%` | `#2a2039` | Input field backgrounds |

#### Accent Colors

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--primary` | `300 100% 60%` | `#ff00ff` | Primary actions — bright magenta |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on primary |
| `--primary-glow` | `300 100% 60% / 0.5` | — | Glow/shadow effects |
| `--secondary` | `180 100% 50%` | `#00ffff` | Secondary accent — cyan |
| `--secondary-foreground` | `180 100% 10%` | — | Text on secondary |
| `--destructive` | `0 80% 60%` | `#ff4d4d` | Error/delete actions — red |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | Text on destructive |
| `--ring` | `300 100% 60%` | `#ff00ff` | Focus rings — magenta |

#### Background Gradient

The page background uses a subtle gradient with radial overlays:

```css
body {
  background-image:
    radial-gradient(circle at 10% 20%, hsl(280 60% 12% / 0.5), transparent 35%),
    radial-gradient(circle at 90% 80%, hsl(260 50% 10% / 0.4), transparent 40%),
    radial-gradient(circle at 50% 50%, hsl(300 30% 8% / 0.3), transparent 60%);
  background-attachment: fixed;
}
```

Tailwind fallback: `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`

---

### 2.2 App Typography

#### Font Families

| Purpose | Font | CSS Variable | Load Source |
|---|---|---|---|
| Body / UI | **Inter** (weights 300–700) | `--font-sans` | Google Fonts |
| Code / Metrics | **JetBrains Mono** (weights 400, 500, 700) | `--font-mono` | Google Fonts |

#### Font Sizes (Tailwind scale)

| Class | Size | Typical Usage |
|---|---|---|
| `text-xs` | 12px | Badges, captions, metadata |
| `text-sm` | 14px | Table cells, secondary text, form labels |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Section headers |
| `text-xl` | 20px | Page titles (mobile) |
| `text-2xl` | 24px | Page titles (desktop) |
| `text-3xl` | 30px | Hero/feature titles (rare) |

---

### 2.3 Spacing & Layout

#### Border Radius Tokens

| Token | Value | Tailwind Class |
|---|---|---|
| `--radius-sm` | 8px | `rounded-md` |
| `--radius-md` | 12px | `rounded-lg` |
| `--radius-lg` | 16px | `rounded-xl` |
| `--radius-xl` | 24px | `rounded-2xl` |

#### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-content` | 10 | Content layers |
| `--z-sticky` | 20 | Sticky elements |
| `--z-header` | 50 | Main navigation |
| `--z-dropdown` | 60 | Dropdown menus |
| `--z-modal` | 100 | Modals/dialogs |

#### Common Spacing

| Context | Value |
|---|---|
| Card padding | `p-6` (24px) |
| Main content padding | `p-4 md:p-6` (16px mobile, 24px desktop) |
| Table cell padding | `p-2` (8px) |
| Gap between grid items | `gap-4` or `gap-6` (16–24px) |
| Input height | `h-9` (36px) |

#### Page Shell

```
+-------------------------------------------+
|  MainNav (sticky, h-14, z-50)             |
|  bg-black/40 backdrop-blur-md             |
|  border-b border-white/5                  |
|  [Logo] [Breadcrumbs] [Status] [Menu]     |
+-------------------------------------------+
|                                           |
|  <main className="flex-1 p-4 md:p-6">    |
|                                           |
|     Page content...                       |
|                                           |
+-------------------------------------------+
```

- **No permanent sidebar** — navigation via hamburger menu
- Header: 56px tall, sticky, glass-morphism background
- Content: flex-1 fills remaining height
- Background: gradient from slate-950 -> slate-900 -> slate-950

---

### 2.4 Component Patterns

#### Cards

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

#### Glass Panels

Custom utility classes for frosted-glass surfaces:

```css
.glass-panel {
  @apply bg-card backdrop-blur-xl border border-white/10 shadow-xl;
}

.glass-panel-hover {
  @apply transition-all duration-300
         hover:bg-white/5 hover:border-white/20
         hover:shadow-primary/10 hover:shadow-lg;
}
```

#### Buttons

Variants via Shadcn/ui + CVA:

| Variant | Style |
|---|---|
| **default** | Magenta background (`bg-primary`) |
| **destructive** | Red background |
| **outline** | Transparent with border |
| **secondary** | Muted purple background |
| **ghost** | Transparent, hover highlights |
| **link** | Underlined text style |

Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (h-9 w-9)

#### Badges

```tsx
<Badge variant="outline">Label</Badge>
```
- Rounded: `rounded-md`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`
- Used for status indicators, tags, graph modes

#### Tables

- Responsive via horizontal scroll wrapper
- Row hover: `hover:bg-muted/50`
- Used on Buildings, Proposals, Lookups pages

#### Dialogs / Modals

- Overlay: `bg-black/80`
- Animated entrance: `animate-in fade-in`
- Z-index: 50
- Built on Radix Dialog primitive

#### Toast Notifications

- **Sonner** toast library
- Appears bottom-right
- Auto-dismisses

---

### 2.5 Effects

#### Glow Utilities

| Class | Effect |
|---|---|
| `.text-glow` | Text shadow at `currentColor` (`0 0 10–20px`) |
| `.text-glow-cyan` | Cyan text shadow (`hsl(180 100% 50% / 0.6)`) |
| `.border-glow` | Magenta box shadow (`hsl(300 100% 60% / 0.3)`) |
| `.border-glow-cyan` | Cyan box shadow (`hsl(180 100% 50% / 0.4)`) |
| `.override-active` | Cyan background + glow for active/overridden nodes |

#### Node Type Styling (Graph Visualizations)

| Class | Color | Usage |
|---|---|---|
| `.node-input` | Cyan (`cyan-500`) | Input nodes |
| `.node-formula` | Pink/Magenta (`pink-500`) | Formula nodes |
| `.node-function` | Purple (`purple-500`) | Function nodes |

#### Animations / Keyframes

| Name | Duration | Effect |
|---|---|---|
| `animate-pulse-glow` | 2s infinite | Pulsing glow on box-shadow (cyan) |
| `animate-slide-up` | 0.2s | Slide up 8px + fade in |
| `animate-slide-down` | 0.2s | Slide down 8px + fade in |
| `animate-fade-in` | 0.15s | Pure fade in |

**Transitions:**
- `transition-all duration-200` — general hover effects
- `transition-colors` — color-only transitions
- `.transition-smooth` — `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- Framer Motion for orchestrated animations

---

### 2.6 Responsive Design

#### Breakpoints (Tailwind defaults)

| Prefix | Min Width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

#### Common Responsive Patterns

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

### 2.7 Misc

#### Scrollbar Styling

- Width: 6px
- Track: transparent
- Thumb: `hsl(260 30% 25%)` (dark purple)
- Thumb hover: `hsl(260 30% 35%)` (lighter)
- Border radius: 3px

#### Print Overrides (App)

```css
@media print {
  body {
    background: white !important;
    background-image: none !important;
    color: black !important;
    font-size: 12pt;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  section { page-break-inside: avoid; }
  h2 { page-break-after: avoid; }
  table { page-break-inside: avoid; }
  .font-mono { font-family: 'Courier New', monospace !important; }
}
```

---

## Part 3 — Asset Inventory

### Logo Files Across Repos

**Canonical source files** (not build artifacts):

| Variant | Color | Format | Repo | Path |
|---|---|---|---|---|
| Base (monochrome) | — | SVG | dc_dev | `public/assets/logo.svg` |
| Horizontal Lockup | Black | PNG | dc_flow | `images/daisy-chain_logo_horiz-lockup_black.png` |
| Horizontal Lockup | Black | PNG | dc_flow | `output/proposals/gpt/assets/images/daisy-chain_logo_horiz-lockup_black.png` |
| Horizontal Lockup | Black | PNG | dc_async | `docs/daisy-chain_logo_horiz-lockup_black.png` |
| Horizontal Lockup | Black | PNG | one_click_dc | `docs/dc_assets/daisy-chain_logo_horiz-lockup_black.png` |
| Horizontal Lockup | White | PNG | one_click_dc | `docs/dc_assets/daisy-chain_logo_horiz-lockup_white.png` |
| Horizontal Lockup | White | PNG | one_click_dc | `client/public/daisy-chain_logo_horiz-lockup_white.png` |
| Stacked Lockup | Black | PNG | dc_flow | `output/proposals/gpt/assets/images/daisy-chain_logo_stacked-lockup_black.png` |
| Stacked Lockup | Black | PNG | dc_async | `docs/daisy-chain_logo_stacked-lockup_black.png` |
| Stacked Lockup | Black | PNG | one_click_dc | `docs/dc_assets/daisy-chain_logo_stacked-lockup_black.png` |
| Stacked Lockup | White | PNG | daisychain-partner-portal | `attached_assets/daisy-chain_logo_stacked-lockup_white_*.png` |
| Logomark (Large) | Black | PNG | dc_flow | `output/proposals/gpt/assets/images/daisy-chain_logo_logomark_large_black.png` |
| Logomark (Large) | Black | PNG | dc_async | `docs/daisy-chain_logo_logomark_large_black.png` |
| Logomark (Large) | Black | PNG | one_click_dc | `docs/dc_assets/daisy-chain_logo_logomark_large_black.png` |
| Logomark | White | PNG | one_click_dc | `docs/dc_assets/daisy-chain_logo_logomark_white.png` |
| Logomark | White | PNG | one_click_dc | `client/public/daisy-chain_logo_logomark_white.png` |
| Logomark | White | PNG | daisychain-partner-portal | `attached_assets/daisy-chain_logo_logomark_white_*.png` |
| Wordmark | Black | PNG | dc_flow | `output/proposals/gpt/assets/images/daisy-chain_logo_wordmark_black.png` |
| T-Shirt Lockup | Black | PNG | dc_flow | `output/proposals/gpt/assets/images/daisy-chain_logo_tshirt-lockup_black.png` |
| T-Shirt Lockup | White | PNG | daisychain-partner-portal | `attached_assets/daisy-chain_logo_tshirt-lockup_white_*.png` |

### Which to Use Where

| Context | Recommended Asset |
|---|---|
| App header (dark bg) | `one_click_dc/client/public/daisy-chain_logo_horiz-lockup_white.png` |
| App header (SVG) | `dc_dev/public/assets/logo.svg` |
| Proposals (light bg) | `dc_flow/output/proposals/gpt/assets/images/daisy-chain_logo_horiz-lockup_black.png` |
| Documentation | `dc_async/docs/daisy-chain_logo_horiz-lockup_black.png` |
| Favicon / compact icon | `one_click_dc/client/public/daisy-chain_logo_logomark_white.png` |
| Merchandise | T-Shirt Lockup variant (black or white per background) |

---

## Part 4 — CSS Quick Reference

### Brand Context (proposals, print, external-facing)

```css
:root {
  /* Brand palette */
  --dc-gold:    #E8B533;
  --dc-rose:    #F56F5F;
  --dc-violet:  #7A28CB;
  --dc-white:   #FCFCF1;
  --dc-black:   #090302;

  /* Semantic aliases */
  --accent:     #E8B533;
  --accent-2:   #7A28CB;
  --negative:   #F56F5F;
  --text:       #090302;
  --muted:      #6b7280;
  --border:     #e2e8f0;
  --bg:         #FCFCF1;
  --light-bg:   #f8f8f4;
  --card:       #ffffff;
}

body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: var(--text);
  background: #fff;
}

h1 {
  font-size: 48px;
  line-height: 54px;
  letter-spacing: -10px;
  text-transform: uppercase;
  font-weight: bold;
}

h2 {
  font-size: 24px;
  line-height: 36px;
  letter-spacing: 40px;
  text-transform: uppercase;
  font-weight: bold;
}

p {
  font-size: 24px;
  line-height: 32px;
  letter-spacing: 2px;
  font-weight: normal;
}
```

### App Context (web application dark theme)

```css
:root {
  /* Core */
  --background: hsl(260 50% 8%);
  --foreground: hsl(260 10% 95%);
  --card: hsl(260 40% 12% / 0.6);
  --card-foreground: hsl(260 10% 95%);
  --card-border: hsl(260 40% 30% / 0.5);
  --popover: hsl(260 45% 10%);
  --popover-foreground: hsl(260 10% 95%);
  --muted: hsl(260 30% 18%);
  --muted-foreground: hsl(260 20% 60%);
  --accent: hsl(260 40% 22%);
  --accent-foreground: hsl(260 10% 95%);
  --border: hsl(260 30% 22%);
  --input: hsl(260 30% 18%);

  /* Accents */
  --primary: hsl(300 100% 60%);
  --primary-foreground: hsl(0 0% 100%);
  --primary-glow: hsl(300 100% 60% / 0.5);
  --secondary: hsl(180 100% 50%);
  --secondary-foreground: hsl(180 100% 10%);
  --destructive: hsl(0 80% 60%);
  --destructive-foreground: hsl(0 0% 100%);
  --ring: hsl(300 100% 60%);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Z-index */
  --z-content: 10;
  --z-sticky: 20;
  --z-header: 50;
  --z-dropdown: 60;
  --z-modal: 100;

  /* Fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --transition: 0.2s ease;
}
```

---

### Reconciliation Notes

| Issue | Partner Portal (`design_config.js`) | Brand Guide (authoritative) | Resolution |
|---|---|---|---|
| Primary yellow | `#F1C40F` | `#E8B533` (Core Gold) | **Use `#E8B533`.** Partner portal value is outdated. |
| Font stack | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` | `"Helvetica Neue", Helvetica, Arial, sans-serif` | **Use Helvetica Neue** for brand/print. Segoe UI is non-standard. |
| Module colors | Executive `#3498DB`, Rate `#E74C3C`, Cost `#F39C12`, Scenario `#9b59b6` | Not in brand guide | These are partner-portal-only module theme colors. Not part of the core brand palette. Use only within the partner portal context. |
| No-emoji rule | `forbiddenEmojis: true` | Consistent | Both sources agree: no emojis in professional output. |

---

### Source File Index

| Purpose | Repo | Path |
|---|---|---|
| Official brand guide | dc_flow | `docs/design_guidelines.md` |
| Brand Python tokens | dc_flow | `output/proposals/gpt/layouts/_brand.py` |
| UI look & feel guide | one_click_dc | `UI_LOOK_AND_FEEL.md` |
| App CSS (Tailwind v4) | one_click_dc | `client/src/index.css` |
| dc_dev global CSS | dc_dev | `public/styles/global.css` |
| Partner portal config | daisychain-partner-portal | `Docs/Proposal_engine/design_config.js` |
| Logo SVG | dc_dev | `public/assets/logo.svg` |
| UI guide copy | dc_dev | `look.md` |
