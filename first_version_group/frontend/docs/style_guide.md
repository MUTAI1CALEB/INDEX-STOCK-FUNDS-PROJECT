# Global InvestIQ — Frontend Style Guide

Welcome to the **Global InvestIQ** Frontend Style Guide. This document defines the design patterns, visual guidelines, and coding standards for our Next.js + Tailwind CSS application. 

Our goal is to build a premium, state-of-the-art web interface for Kenyan investors tracking historical portfolios in our 2020 Sandbox. The design should evoke **trust, precision, and modern financial technology**.

---

## 🎨 1. Color Palette (Obsidian & Emerald)

Global InvestIQ uses a custom dark-theme-first color system. It blends deep slate/obsidian colors with vibrant emerald and warm gold accents to highlight growth, prosperity, and premium quality.

| Token Name | Hex Code | Tailwind Utility Class | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Obsidian Void** | `#030712` | `bg-gray-950` | Primary app background |
| **Midnight Surface** | `#0B0F19` | `bg-slate-900` | Secondary container/panel background |
| **Charcoal Card** | `#111827` (or semi-transparent) | `bg-gray-900/70` | Interactive card and element backgrounds |
| **Emerald Mint** | `#10B981` | `text-emerald-500` / `bg-emerald-500` | Primary accent, positive indicators, and growth symbols |
| **Shaba Gold** | `#F59E0B` | `text-amber-500` | Secondary accent, premium alerts, and system highlights |
| **Ice White** | `#F9FAFB` | `text-gray-50` | High-contrast headers and primary text |
| **Cool Slate** | `#E5E7EB` | `text-gray-200` | General readable copy and descriptions |
| **Muted Steel** | `#9CA3AF` | `text-gray-400` | Secondary labels, captions, and timestamp text |
| **Crimson Rose** | `#EF4444` | `text-red-500` | Negative return values, sell buttons, error alerts |

> [!NOTE]
> All backgrounds must support high-contrast text ratios conforming to Web Content Accessibility Guidelines (WCAG 2.1 AA).

---

## ✍️ 2. Typography & Hierarchy

We use **Inter** for clean UI readability, and optionally **Outfit** or **Syne** for headings to give the platform a modern, premium feel.

- **Main UI & Body Font**: `Inter, sans-serif`
- **Headings Font**: `Outfit, system-ui, sans-serif`

### Type Scale

| Element | Tailwind Classes | Size (Rem / Px) | Tracking / Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display H1** | `text-4xl md:text-5xl font-extrabold tracking-tight` | `3.00rem / 48px` | Bold / Tight | Main dashboard landing titles |
| **Page Title H2** | `text-2xl md:text-3xl font-bold tracking-tight` | `1.875rem / 30px` | Bold / Tight | Component or major sections |
| **Section Header H3**| `text-xl font-semibold` | `1.25rem / 20px` | Semibold | Sub-sections, card titles |
| **Body (Normal)** | `text-base font-normal leading-relaxed` | `1.00rem / 16px` | Normal / Relaxed | Main articles, paragraph copy |
| **Body (Small)** | `text-sm font-medium` | `0.875rem / 14px` | Medium | Sidebars, tables, minor descriptions |
| **Caption** | `text-xs font-normal text-gray-400` | `0.75rem / 12px` | Normal | Chart labels, dates, helper text |

---

## 🔮 3. Glassmorphism & UI Accents

To achieve the "premium financial hub" look, we employ modern CSS effects like backdrop-blurs, glowing borders, and rounded styling.

### 🧱 Glass Containers
Use a semi-transparent background combined with a backdrop blur and a thin, subtle white border. This makes items appear to float cleanly over the dark gradient background.

```html
<div class="bg-gray-900/60 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
  <!-- Card Content -->
</div>
```

### 💫 Glowing Accents
For dashboard highlights (like high portfolio growth or key actions), apply a soft glow effect:
- **Shadow Glow**: `shadow-[0_0_20px_rgba(16,185,129,0.15)]` (Emerald Mint glow)
- **Border Glow**: Add a gradient border overlay using dynamic utility classes.

### 📐 Rounded Corners (Borders)
- **Large Panels**: `rounded-2xl` (16px) or `rounded-3xl` (24px)
- **Interactive Cards / Modals**: `rounded-xl` (12px)
- **Form Controls / Buttons**: `rounded-lg` (8px)

---

## ⚡ 4. Animations & Micro-Interactions

An interface that reacts gracefully feels alive and responsive. We enforce these standard hover effects and transitions.

### Transition Foundations
Use `transition-all duration-300 ease-in-out` for all hover states. Avoid harsh snap-changes.

### Interactive Elements Style

*   **Primary Action Buttons:**
    - *Default:* Emerald background, white text.
    - *Hover:* Slight scale up, background color shifts, drop shadow glow.
    - *CSS Classes:* `bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/10 transition-all duration-200`
*   **Card Hover Effects:**
    - Cards should shift upward slightly and brighten their borders on hover.
    - *CSS Classes:* `hover:-translate-y-1 hover:border-white/[0.12] hover:bg-gray-900/80 transition-all duration-300`
*   **Navigation Tabs / Sidebar Links:**
    - Slide-in indicators or color-fill transitions.
    - *CSS Classes:* `hover:text-emerald-400 hover:bg-slate-800/50 transition-colors`

---

## 🏗️ 5. Component Architecture & Coding Standards

### Folder Structure (React & Next.js App Router)
Keep code modular, clean, and organized using this standard layout:

```text
frontend/
├── public/                 # Static assets (icons, images)
├── docs/                   # Markdown documentation (including this style guide)
└── src/
    ├── app/                # Next.js App Router
    │   ├── layout.tsx      # Global layout wrapper with theme providers
    │   ├── page.tsx        # Portfolio Dashboard (Main Entry)
    │   ├── news/           # Market News page
    │   ├── learning/       # Learning Hub page
    │   └── components/     # Page-specific sub-components
    ├── components/         # Shared global UI components
    │   ├── ui/             # Atomic design elements (Buttons, Inputs, Cards)
    │   ├── charts/         # Recharts wrappers (Risk allocation pie chart, portfolio growth line chart)
    │   └── layout/         # Layout wrappers (Sidebar, TopNav)
    ├── hooks/              # Custom React hooks (e.g., useHistoricalPrices, usePortfolio)
    ├── utils/              # Pure utility functions (formatting currency, portfolio calculations)
    └── types/              # TypeScript interface and type declarations
```

### TypeScript Best Practices
- **Interfaces & Types:** Always declare strict TypeScript types for props and state. Avoid using `any`.
- **Readonly Enums:** Use `const` variables or readonly collections for constants (e.g., `ASSETS = ['AAPL', 'MSFT', 'VOO']`).
- **Component Signatures:**
  ```tsx
  import React from 'react';

  interface CardProps {
    title: string;
    children: React.ReactNode;
    highlighted?: boolean;
  }

  export const FeatureCard: React.FC<CardProps> = ({ title, children, highlighted = false }) => {
    return (
      <div className={`p-6 rounded-xl border ${highlighted ? 'border-emerald-500' : 'border-white/10'}`}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {children}
      </div>
    );
  };
  ```

---

## 🧩 6. Tailwind CSS Standards

1.  **Class Ordering Convention:** Organize classes in this logical order to ensure readability:
    1. Layout & Display (`flex`, `grid`, `block`, `hidden`)
    2. Positioning (`absolute`, `relative`, `top-0`, `z-10`)
    3. Box Model / Spacing (`w-full`, `h-32`, `p-4`, `m-2`)
    4. Typography (`text-sm`, `font-bold`, `tracking-wide`)
    5. Backgrounds & Borders (`bg-slate-900`, `border`, `border-white/5`)
    6. Effects (`backdrop-blur`, `shadow-xl`, `opacity-90`)
    7. Transitions & Hover (`transition-all`, `hover:scale-105`)
2.  **Avoid Inline Arbitrary Classes:** Instead of using ad-hoc sizing like `w-[327px]`, leverage Tailwind's spacing system (`w-80`) or define customized presets in `tailwind.config.js` to preserve theme consistency.
3.  **Mobile First Design:** Build your responsive structures starting with base utility class defaults (mobile representation) and scale up using `md:` and `lg:` breakpoints.

---

## 🌐 7. SEO & Accessibility (a11y)

Even inside a historical sandbox, the application must reflect production-grade SEO and accessibility:

-   **Semantic HTML:** Use markup tags correctly. Use `<header>` for top banner, `<nav>` for sidebar navigation, `<main>` for dashboard content, `<article>` for Learning Hub posts, and `<footer>` for copyright/sandbox warnings.
-   **Unique Control Identifiers:** Ensure all key interactive items (buttons, inputs) possess unique IDs for test runners and screen readers (e.g., `<button id="btn-submit-risk-quiz">`).
-   **Contrast Levels:** Never overlay small gray text on a dark gray card. Check contrast ratios dynamically using development tools.
-   **Fallback States:** Provide informative error messages and loading skeletons when APIs are slow or offline.

---

## 📄 8. Development Verification Checklist

Before opening a pull request or submitting layout changes, run through this quick checklist:

*   [ ] Does the component render correctly in **Dark Mode**?
*   [ ] Are interactive elements styled with active/hover focus classes?
*   [ ] Is the content fully responsive, resizing gracefully on mobile, tablet, and desktop screens?
*   [ ] Are there any console errors or type check warnings (`npm run build` or `npm run type-check`)?
*   [ ] Have you avoided hardcoded color values (`#abcdef`) and strictly used Tailwind color tokens?
*   [ ] Does the UI load mock data or fallback gracefully if backend database connections drop out?
