---
name: Telemetry Dark
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-display:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
  metric-display-mobile:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 26px
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 15px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets Site Reliability Engineers, platform engineers, and on-call DevOps specialists managing mission-critical infrastructure under pressure. The emotional target is immediate situational clarity, surgical control, and calm under operational stress. 

The aesthetic is Modern Technical Observability: an ultra-refined, dark-first interface that combines the information density of Grafana Cloud with the refined, crisp polish of Better Stack and Datadog. It rejects superfluous ornamentation in favor of purposeful contrast, precise micro-geometry, and scan-optimized data rendering. Visual priority is dictated strictly by operational severity—an engineer waking up at 3:00 AM must parse service health, P99 latency spikes, and ongoing alerts within three seconds of opening the viewport.

## Colors

The color system operates on an uncompromising dark palette with strict semantic assignments for telemetry:

- **Canvas & Surfaces**: The base canvas is `#090d16` (Deep Obsidian). Structural surfaces stack through `#0f172a` (Surface-1), `#1e293b` (Surface-2/Card base), and `#334155` (Hover/Active states).
- **Primary (Emerald Operational)**: `#10b981` is reserved strictly for positive system states, healthy SLAs, normal deploy pipelines, and verified operational signals.
- **Secondary (Telemetry Blue/Indigo)**: `#6366f1` handles synthetic check metrics, baseline throughput, secondary navigation, and interactive controls.
- **Tertiary (Amber Warning)**: `#f59e0b` represents elevated latency, degraded pods, packet drops under threshold, and pending alerts.
- **Incident Critical (Rose Alert)**: `#f43f5e` represents failing probes, P0 incidents, cluster panics, and active breaches. It holds absolute visual dominance over any other element.
- **Muted & Monospace Data**: `#94a3b8` (Slate-400) for standard secondary values, units, and timestamps, and `#64748b` (Slate-500) for structural chart gridlines and inactive axes. Text primary is `#f8fafc`.

## Typography

Typography enforces a strict split: **Inter** powers UI chrome, alerts, descriptions, and hierarchy, while **JetBrains Mono** powers all numerical telemetry, P50/P90/P99 latency values, timestamps, hostnames, query languages, and status badges.

Tabular figures (`font-variant-numeric: tabular-nums`) must be activated globally across both families to eliminate layout jitter when real-time telemetry streams update via WebSockets. Letter spacing on `label-mono-sm` is expanded (+0.05em) for high-density legibility in dark environments.

## Layout & Spacing

The layout is built on a fluid, edge-conscious grid optimized for high-density mobile displays while scaling to responsive operations command centers:

- **Mobile Viewport (< 640px)**: A single-column vertical flow with a 4-column sub-grid for mini telemetry widgets. Screen margins are held at `1rem` to maximize actionable chart real estate.
- **Tablet / Split Screen (640px - 1024px)**: Transitions to an 8-column layout with persistent collapsible telemetry rails and paired metric comparisons.
- **Desktop (1024px+)**: A 12-column responsive grid with independent split-pane scrolling for live incident logs alongside live metric telemetry.

Spacing rhythm is compact and consistent. Vertical gaps between metric cards default to `space-md` (`0.75rem`), and interior card padding uses `space-md` on mobile and `space-lg` (`1rem`) on larger screens to prevent wasted vertical height while retaining touch targets of at least 44px.

## Elevation & Depth

Visual hierarchy is constructed through tonal layering and razor-sharp border outlines rather than heavy drop shadows:

- **Surface Levels**: Level 0 is the root background (`#090d16`). Level 1 (metric cards, incident list rows) sits at `#0f172a`. Level 2 (dropdowns, popovers, sticky filter bars) uses `#1e293b`.
- **Low-Contrast Outlines**: Every surface container is framed with a 1px solid border at 10% to 15% opacity (`rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.12)`). This provides crisp edge delineation on OLED displays without introducing visual clutter.
- **Status Luminescence**: Alerts and critical status cards do not cast black shadows. Instead, active incidents emit a subtle, focused peripheral glow (`0 0 16px rgba(244, 63, 94, 0.18)`), warning nodes emit an amber aura (`0 0 16px rgba(245, 158, 11, 0.14)`), and healthy deployments employ a soft emerald glow (`0 0 12px rgba(16, 185, 129, 0.12)`).
- **Overlays & Drawers**: Modals, filter sheets, and incident detail panels apply a backdrop filter blur of `12px` backed by `#090d16` at 85% opacity.

## Shapes

The design system uses a strict **Soft (`1`)** shape language to reinforce precision, efficiency, and engineering discipline. 

- Interactive controls, status badges, and cards use an exterior radius of `0.25rem` (4px).
- Modal sheets, large metric panels, and chart containers scale to `0.5rem` (8px).
- Pill shapes are prohibited except for live status pulse indicators and count chips.
- Sharp interior corners are maintained on inline code snippets, log timestamps, and telemetry table data cells to preserve a clean, tabular structure.

## Components

### Buttons
Buttons feature a default height of 36px on mobile (44px tap buffer). Primary actions (e.g., "Acknowledge Alert", "Runbook") use a solid fill of `#6366f1` with high-contrast `#ffffff` text and a subtle 1px border. Destructive/Critical actions use `#f43f5e`. Secondary buttons use surface level 2 (`#1e293b`) with a 1px border (`rgba(255, 255, 255, 0.12)`) and `#f8fafc` text.

### Metric & Sparkline Cards
Structured with a 3-part vertical architecture:
1. **Header**: Label in `label-mono-sm` (uppercase, slate-400), target entity, and tiny status dot.
2. **Value**: Displayed in `metric-display-mobile` with inline delta indicator (+12% in emerald or rose).
3. **Visualization Area**: A sparkline SVG or mini bar chart (40px fixed height) with zero baseline padding. Tooltips render with monospace timestamp and value on touch-hold.

### Status Indicators & Badges
- **Status Dot**: A 6px circular dot with a continuous ping animation for ongoing degraded/critical states. Healthy nodes display static emerald `#10b981`.
- **Badges**: Compact height (20px), monospace font (`10px`), uppercase. Background is rendered at 12% tint opacity of the semantic status color with a 1px border at 25% tint opacity (e.g., Red Badge: background `rgba(244, 63, 94, 0.12)`, text `#f43f5e`, border `rgba(244, 63, 94, 0.25)`).

### Latency Percentile Cluster
A specialized component grouping P50, P90, and P99 values horizontally in three equal blocks separated by 1px dividers (`rgba(255, 255, 255, 0.08)`). Values sit on top with small uppercase subheaders below in `label-mono-sm`.

### Uptime Bar Strip
Composed of 45-90 discrete vertical tick bars representing consecutive time intervals (e.g., 24h/30d). Bar width is 2px to 3px with 1px gaps. Color mapping: `#10b981` (100% operational), `#f59e0b` (partial degradation), `#f43f5e` (major outage/downtime), `#334155` (maintenance/no data).

### Incident Feed & Stream Item
Incident list items use card level 1 with a 2px left-accent border matching alert severity (`#f43f5e` for P0/P1, `#f59e0b` for P2/P3). Content includes an alert title in `headline-sm`, affected service in an inline code chip, elapsed time (e.g., `2m 45s ago`), and an inline one-tap "Ack" button.

### Inputs & Filters
Search fields, Lucene/PromQL input bars, and service dropdowns use surface level 1 background with an inset 1px border. Active focus triggers an outline in `#6366f1` with an ambient glow (`0 0 0 2px rgba(99, 102, 241, 0.25)`). Text is rendered in `JetBrains Mono` at `13px`.