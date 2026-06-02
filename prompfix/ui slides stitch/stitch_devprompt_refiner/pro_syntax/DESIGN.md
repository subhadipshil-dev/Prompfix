---
name: Pro-Syntax
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#373940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#191b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a30'
  surface-container-highest: '#33343b'
  on-surface: '#e2e2eb'
  on-surface-variant: '#c9c4d7'
  inverse-surface: '#e2e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#928ea0'
  outline-variant: '#474554'
  surface-tint: '#c7bfff'
  primary: '#c7bfff'
  on-primary: '#2b009e'
  primary-container: '#8e7fff'
  on-primary-container: '#25008c'
  inverse-primary: '#5a46d3'
  secondary: '#c2c5e2'
  on-secondary: '#2b2f46'
  secondary-container: '#444860'
  on-secondary-container: '#b3b7d3'
  tertiary: '#ffb86d'
  on-tertiary: '#492900'
  tertiary-container: '#cd7f1a'
  on-tertiary-container: '#402300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e4deff'
  primary-fixed-dim: '#c7bfff'
  on-primary-fixed: '#180065'
  on-primary-fixed-variant: '#4228bb'
  secondary-fixed: '#dee1ff'
  secondary-fixed-dim: '#c2c5e2'
  on-secondary-fixed: '#161a30'
  on-secondary-fixed-variant: '#41455d'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86d'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#683c00'
  background: '#111319'
  on-background: '#e2e2eb'
  surface-variant: '#33343b'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for developers and prompt engineers who require a high-density, performance-oriented workspace. The brand personality is technical, precise, and authoritative, drawing inspiration from the focused environment of modern IDEs and the streamlined efficiency of high-end project management tools.

The visual style is **Corporate Modern with a Technical Edge**. It balances professional reliability with developer-centric aesthetics by utilizing a deep monochromatic base punctuated by a vibrant functional accent. It employs subtle glassmorphism to provide depth without sacrificing the speed and clarity required for complex prompt engineering workflows. The interface should feel "built, not decorated," emphasizing utility, clear hierarchy, and high-contrast legibility.

## Colors
The palette is rooted in a deep, low-light environment to reduce eye strain during extended prompt-tuning sessions. 

- **Primary (#7c6af7):** A technical purple used exclusively for primary actions, active states, and focus indicators. 
- **Neutral/Background (#0f1117):** The "void" layer, providing a stable foundation for the application.
- **Surface (#1a1d27):** Used for cards and containers to create a distinct layer of information hierarchy above the background.
- **Borders (#2d3148):** Crisp, high-precision dividers that define the structural grid.
- **Typography:** Text levels are strictly tiered from high-contrast White-Blue (#e2e8f0) for content to Slate-Gray (#64748b) for metadata and labels.

## Typography
The system uses a dual-font strategy. **Inter** handles all UI scaffolding, navigation, and labels to ensure a clean, professional "SaaS" feel. **JetBrains Mono** is reserved for prompts, variables, and code blocks—the core data of the application—to signify technical context and ensure character-level clarity.

Headlines should be used sparingly, mostly for view titles and section headers. UI labels utilize a slightly tighter letter spacing for a compact, efficient layout.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy with high-density spacing. The layout is optimized for desktop productivity, utilizing a sidebar-content-panel model similar to VS Code. 

- **Grid:** A 12-column grid system is used for the main content area, while sidebars use fixed-width increments (e.g., 240px or 320px).
- **Rhythm:** An 8px base unit drives all padding and margins, but 4px increments are permitted for tight UI controls like icon buttons and input groupings.
- **Breakpoints:** Since the focus is desktop, the layout prioritizes views from 1280px and above, utilizing a single-pane reflow for tablet-sized viewports.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Subtle Glassmorphism** rather than traditional heavy shadows.

- **Layer 0 (Background):** Base #0f1117.
- **Layer 1 (Cards/Panels):** Surface #1a1d27 with a 1px border of #2d3148. 
- **Layer 2 (Overlays/Modals):** Glassmorphic effect using a 60% opacity of the surface color with a 12px backdrop blur.
- **Active State:** Elements that are focused or active receive a subtle outer glow using a 10% opacity version of the Primary purple, rather than a hard drop shadow.

## Shapes
The shape language is controlled and geometric. A standard `8px` (rounded-md) corner is used for cards and main containers to maintain a modern feel, while smaller components like tags and buttons use `6px` (rounded-sm) for a sharper, more precise appearance. Code blocks and text areas should strictly match the 8px container radius.

## Components
- **Buttons:** Primary buttons use a solid #7c6af7 fill with white text. Ghost buttons use #2d3148 borders and #e2e8f0 text. All buttons have a 200ms transition on hover, increasing brightness by 10%.
- **Input Fields:** Styled as "IDEs"—dark backgrounds, mono fonts for prompt inputs, and a 1px #2d3148 border that turns #7c6af7 on focus.
- **Chips/Tags:** Small, low-profile badges with a #2d3148 background and #64748b text for categories or metadata.
- **Lists:** High-density rows with 1px bottom borders. Hovering a list item changes the background to a slightly lighter #222632.
- **Cards:** Utilize the surface color with a subtle glass effect when used as floating panels.
- **The "Prompt Editor":** A specialized component featuring line numbers (Mono, muted) and syntax highlighting for variables using the Primary purple.