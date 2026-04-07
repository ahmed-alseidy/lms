# DESIGN.md — LMS SaaS Platform Design System

> Semantic design system for the LMS SaaS platform. This document defines every visual constraint, component pattern, and layout rule needed to build the complete UI.

---

## 1. Design Philosophy

### 1.1 Aesthetic Direction
- **Modern & Clean:** Minimal chrome, generous whitespace, focus on content
- **Arabic-First:** RTL is the primary layout direction; LTR is the alternate
- **Professional but Warm:** Educational context — not cold SaaS, not childish
- **Dark Mode Native:** Both themes are first-class citizens, not afterthoughts
- **Zero Border Radius:** The platform uses `--radius: 0` — sharp, architectural corners throughout (this is intentional and distinctive)

### 1.2 Design Principles
1. **Content over chrome** — Reduce decorative elements; let courses, videos, and data speak
2. **Progressive disclosure** — Show essential actions first; advanced options behind drawers/dialogs
3. **Consistent density** — Dense in dashboards (tables, analytics); spacious in student-facing pages
4. **Bilingual harmony** — Every layout must work equally well in Arabic (RTL) and English (LTR)
5. **Accessible by default** — WCAG AA color contrast, keyboard navigable, ARIA labels

---

## 2. Color System

### 2.1 Design Tokens (OKLCH)

The platform uses **OKLCH color space** for perceptual uniformity. The primary palette is **green-based** (hue ≈ 131°), evoking growth, learning, and trust.

#### Light Mode (`:root`)

| Token | OKLCH Value | Usage |
|-------|------------|-------|
| `--background` | `oklch(1 0 0)` | Page background (pure white) |
| `--foreground` | `oklch(0.145 0 0)` | Primary text (near black) |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--card-foreground` | `oklch(0.145 0 0)` | Card text |
| `--primary` | `oklch(0.65 0.18 132)` | Primary actions, links, active states |
| `--primary-foreground` | `oklch(0.99 0.03 121)` | Text on primary backgrounds |
| `--secondary` | `oklch(0.967 0.001 286)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.21 0.006 286)` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | Muted/placeholder text |
| `--accent` | `oklch(0.65 0.18 132)` | Accent = primary (green) |
| `--accent-foreground` | `oklch(0.99 0.03 121)` | Text on accent |
| `--destructive` | `oklch(0.58 0.22 27)` | Error/delete actions |
| `--border` | `oklch(0.922 0 0)` | Borders, dividers |
| `--input` | `oklch(0.922 0 0)` | Input borders |
| `--ring` | `oklch(0.708 0 0)` | Focus ring |

#### Dark Mode (`.dark`)

| Token | OKLCH Value | Usage |
|-------|------------|-------|
| `--background` | `oklch(0.145 0 0)` | Page background (near black) |
| `--foreground` | `oklch(0.985 0 0)` | Primary text (near white) |
| `--card` | `oklch(0.205 0 0)` | Card surfaces (elevated) |
| `--primary` | `oklch(0.77 0.2 131)` | Primary (brighter green for dark bg) |
| `--primary-foreground` | `oklch(0.27 0.07 132)` | Dark text on primary |
| `--muted` | `oklch(0.269 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.708 0 0)` | Muted text |
| `--border` | `oklch(1 0 0 / 10%)` | Subtle borders (white with alpha) |
| `--input` | `oklch(1 0 0 / 15%)` | Input borders (slightly more visible) |
| `--destructive` | `oklch(0.704 0.191 22)` | Brighter destructive for dark bg |

#### Chart Palette (Both Modes)

| Token | Value | Usage |
|-------|-------|-------|
| `--chart-1` | `oklch(0.9 0.18 127)` | Lightest green — backgrounds, fills |
| `--chart-2` | `oklch(0.85 0.21 129)` | Light green — secondary data |
| `--chart-3` | `oklch(0.77 0.2 131)` | Medium green — primary data |
| `--chart-4` | `oklch(0.65 0.18 132)` | Default green — main series |
| `--chart-5` | `oklch(0.53 0.14 132)` | Dark green — emphasis |

#### Sidebar Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.65 0.18 132)` | `oklch(0.85 0.21 129)` |
| `--sidebar-accent` | `oklch(0.65 0.18 132)` | `oklch(0.77 0.2 131)` |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |

### 2.2 Semantic Color Usage
- **Success states:** Use `--primary` (green) — inherently positive
- **Warning states:** Use `oklch(0.75 0.18 85)` (amber) — not tokenized yet, add as needed
- **Error states:** Use `--destructive`
- **Info states:** Use `oklch(0.7 0.15 230)` (blue) — not tokenized yet, add as needed
- **Neutral/disabled:** Use `--muted` background + `--muted-foreground` text

---

## 3. Typography

### 3.1 Font Stack

```css
body {
  font-family: "JetBrains Mono", "Rubik", system-ui, sans-serif;
}
```

| Font | Usage | Weight Range |
|------|-------|-------------|
| **JetBrains Mono** | Primary display font, headings, code, monospace contexts | 400–700 |
| **Rubik** | Arabic text, body copy, UI labels | 300–700 |
| **system-ui** | Fallback | — |

> **Note:** Rubik has excellent Arabic glyph support. For Arabic-heavy pages, Rubik naturally takes over where JetBrains Mono lacks Arabic glyphs.

### 3.2 Type Scale

| Level | Class/Size | Weight | Line Height | Usage |
|-------|-----------|--------|-------------|-------|
| **Display** | `text-4xl` (36px) | Bold (700) | 1.1 | Hero headings, landing page |
| **H1** | `text-3xl` (30px) | Bold (700) | 1.2 | Page titles |
| **H2** | `text-2xl` (24px) | Semibold (600) | 1.3 | Section headings |
| **H3** | `text-xl` (20px) | Semibold (600) | 1.4 | Card titles, subsections |
| **H4** | `text-lg` (18px) | Semibold (600) | 1.4 | Widget headers |
| **Body** | `text-base` (16px) | Regular (400) | 1.5 | Default body text |
| **Body Small** | `text-sm` (14px) | Regular (400) | 1.5 | Secondary text, metadata |
| **Caption** | `text-xs` (12px) | Medium (500) | 1.4 | Timestamps, badges, labels |
| **Overline** | `text-xs` (12px) | Medium (500), uppercase | 1.5 | Section labels, tab labels |

### 3.3 Arabic Typography Adjustments
- Arabic text naturally renders **slightly larger** than Latin at the same font-size; no size compensation needed
- **Line height:** Increase Arabic body text line-height to `1.7` if readability suffers
- **Letter spacing:** Arabic never uses letter-spacing adjustments
- **Text alignment:** Default `text-start` (resolves to `right` in RTL, `left` in LTR)

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (Tailwind Default)

| Token | Pixels | Usage |
|-------|--------|-------|
| `gap-1` / `p-1` | 4px | Tight spacing inside badges, pill gap |
| `gap-2` / `p-2` | 8px | Icon-to-text gap, compact padding |
| `gap-3` / `p-3` | 12px | List item padding |
| `gap-4` / `p-4` | 16px | Card padding, section gap |
| `gap-6` / `p-6` | 24px | Content section spacing |
| `gap-8` / `p-8` | 32px | Page section spacing |
| `gap-12` | 48px | Major section breaks |
| `gap-16` | 64px | Page-level vertical rhythm |

### 4.2 Layout Grid

| Context | Grid | Max Width | Padding |
|---------|------|-----------|---------|
| **Landing page** | Single column, centered | `max-w-7xl` (80rem) | `px-4 md:px-8` |
| **Student course catalog** | `grid-cols-[repeat(auto-fill,minmax(320px,1fr))]` | Container | `px-4` |
| **Teacher dashboard** | Sidebar (collapsible) + Main content | Full width | `px-4 md:px-6` |
| **Course detail** | Single column with sidebar (course nav) | `max-w-4xl` | `px-4` |
| **Quiz taking** | Centered single column | `max-w-2xl` | `px-4 py-8` |
| **Settings** | Centered form | `max-w-2xl` | `px-4 py-8` |

### 4.3 Responsive Breakpoints

| Breakpoint | Pixels | Behavior |
|------------|--------|----------|
| `sm` | 640px | Stack mobile nav, single column grids |
| `md` | 768px | Sidebar becomes overlay/sheet, 2-col grids |
| `lg` | 1024px | Sidebar persistent, 3-col grids |
| `xl` | 1280px | Max content width reached |
| `2xl` | 1536px | Centered with extra margin |

---

## 5. Component Inventory

### 5.1 Existing shadcn/ui Components (34 total)

All components are in `apps/web/components/ui/` and use Radix UI primitives with Tailwind styling.

| Component | Radix Primitive | Key States |
|-----------|----------------|------------|
| `Accordion` | `@radix-ui/react-accordion` | Open, closed, disabled |
| `AlertDialog` | `@radix-ui/react-alert-dialog` | Open, closed |
| `Alert` | Native | Default, destructive, info |
| `Avatar` | `@radix-ui/react-avatar` | Image, fallback |
| `Badge` | Native | Default, secondary, destructive, outline |
| `Breadcrumb` | Native | Active, link, separator |
| `Button` | `@radix-ui/react-slot` | Default, destructive, outline, secondary, ghost, link; size: default, sm, lg, icon |
| `Card` | Native | Header, content, footer |
| `Chart` | Recharts + custom | All chart types |
| `Checkbox` | `@radix-ui/react-checkbox` | Checked, unchecked, indeterminate |
| `Dialog` | `@radix-ui/react-dialog` | Open, closed, scrollable |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | Nested, checkable, radio |
| `Form` | react-hook-form | Validation states |
| `Input` | Native | Default, error, disabled |
| `Label` | `@radix-ui/react-label` | Default, error |
| `Pagination` | Native | Active page, prev/next |
| `Progress` | `@radix-ui/react-progress` | Percentage fill |
| `RadioGroup` | `@radix-ui/react-radio-group` | Selected, unselected |
| `ScrollArea` | Custom | Vertical, horizontal |
| `Select` | `@radix-ui/react-select` | Open, closed, searchable |
| `Separator` | `@radix-ui/react-separator` | Horizontal, vertical |
| `Sheet` | Native | Open from left/right/top/bottom |
| `Sidebar` | Custom (shadcn) | Collapsed, expanded, mobile overlay |
| `Skeleton` | Native | Loading placeholder |
| `Slider` | `@radix-ui/react-slider` | Default, range |
| `Sonner` | sonner | Success, error, info toasts |
| `Switch` | `@radix-ui/react-switch` | On, off |
| `Table` | Native | Header, body, row, cell |
| `Tabs` | `@radix-ui/react-tabs` | Active, inactive |
| `Textarea` | Native | Default, error, disabled |
| `Toast` | `@radix-ui/react-toast` | Success, error, action |
| `Toaster` | Custom | Toast container |
| `Toggle` | `@radix-ui/react-toggle` | Pressed, unpressed |
| `Tooltip` | `@radix-ui/react-tooltip` | Hover-triggered |

### 5.2 Custom Components

| Component | Location | Usage |
|-----------|----------|-------|
| `LanguageSwitcher` | `components/language-switcher.tsx` | AR/EN toggle in header |
| `ModeToggle` | `components/mode-toggle.tsx` | Dark/light theme toggle |
| `MuxPlayer` | `components/mux-player.tsx` | Mux video playback wrapper |
| `VideoJsPlayer` | `components/video-js-player.tsx` | HLS video player (Video.js) |
| `ReactQueryProvider` | `components/react-query-provider.tsx` | TanStack Query provider |
| `ThemeProvider` | `components/theme-provider.tsx` | next-themes provider |
| `LoadingSpinner` | `components/loading-spinner.tsx` | Reusable spinner |
| `CourseCard` | `[subdomain]/courses/course-card.tsx` | Student-facing course card |
| `CourseCard (Dashboard)` | `dashboard/courses/course-card.tsx` | Teacher-facing course card |
| `LowerSidebar` | `dashboard/courses/_components/lower-sidebar.tsx` | Dashboard sidebar nav |
| `SidebarHeaderContent` | `dashboard/sidebar-header-content.tsx` | Teacher profile in sidebar |
| `LoginForm` | `[subdomain]/(auth)/login-form.tsx` | Student login form |
| `CreateCourseForm` | `dashboard/courses/create-course-form.tsx` | Course creation dialog |

### 5.3 Components Needed (To Build)

| Component | Priority | Description |
|-----------|----------|-------------|
| `LandingPage` | 🔴 Critical | Marketing homepage with hero, features, pricing, CTA |
| `PricingTable` | 🔴 Critical | SaaS plan comparison table |
| `TeacherOnboarding` | 🔴 Critical | Multi-step signup wizard |
| `ReviewCard` | 🟡 Phase 1 | Star rating + review text display |
| `ReviewForm` | 🟡 Phase 1 | 5-star selector + textarea |
| `CertificatePreview` | 🟡 Phase 1 | PDF certificate template preview |
| `CouponInput` | 🟡 Phase 1 | Coupon code entry with validation |
| `DiscussionThread` | 🟢 Phase 2 | Threaded Q&A component |
| `MessageComposer` | 🟢 Phase 2 | Rich text message input |
| `NotificationBell` | 🟢 Phase 2 | Dropdown notification list |
| `VideoHeatmap` | 🔵 Phase 3 | Engagement visualization overlay |

---

## 6. Page-by-Page Design Specifications

### 6.1 Landing Page (`/`)

> **Status:** Currently a placeholder tag input form. Needs full redesign.

#### Layout Structure
```
┌──────────────────────────────────────────────┐
│  Navbar: Logo | Features | Pricing | Login   │
├──────────────────────────────────────────────┤
│  HERO SECTION                                │
│  "Build Your Online Academy"                 │
│  Subtitle in Arabic + English                │
│  [Start Free] [Watch Demo]                   │
│  Hero illustration / screenshot              │
├──────────────────────────────────────────────┤
│  SOCIAL PROOF BAR                            │
│  "500+ teachers | 15,000+ students"          │
├──────────────────────────────────────────────┤
│  FEATURES GRID (3 columns)                   │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Video│ │Quiz │ │Cert │                    │
│  │Mgmt │ │Sys  │ │Gen  │                    │
│  └─────┘ └─────┘ └─────┘                   │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Anlyt│ │Pay  │ │RTL  │                    │
│  │ics  │ │ment │ │Supp │                    │
│  └─────┘ └─────┘ └─────┘                   │
├──────────────────────────────────────────────┤
│  PRICING SECTION                             │
│  Plan cards: Free | Basic | Pro | Business   │
├──────────────────────────────────────────────┤
│  FAQ ACCORDION                               │
├──────────────────────────────────────────────┤
│  CTA BANNER                                  │
│  "Start teaching today — it's free"          │
├──────────────────────────────────────────────┤
│  FOOTER: Links | Social | Legal              │
└──────────────────────────────────────────────┘
```

#### Visual Direction
- Hero: Large gradient text (green → dark green), subtle background pattern
- Feature cards: Icon + heading + short description, glass-morphic borders in dark mode
- Pricing: Highlighted "Pro" plan with "Most Popular" badge
- CTA: Full-width green gradient background with white text
- Animations: Fade-in on scroll (IntersectionObserver), subtle parallax on hero

---

### 6.2 Teacher Signup (`/(auth)/signup`)

#### Flow
1. **Step 1:** Name + Email + Password
2. **Step 2:** Choose subdomain (`preview: teacher-name.ilm.com`)
3. **Step 3:** Select plan (default: Free)
4. **Step 4:** Profile picture upload (optional) + contact info

#### Visual Direction
- Centered card layout, `max-w-md`
- Step indicator (horizontal dots or numbered pills)
- Subdomain preview renders live as teacher types
- Plan selection uses radio cards (not dropdown)
- Green progress bar at top showing step completion

---

### 6.3 Student Login (`/[subdomain]/(auth)/login`)

#### Layout
- Centered card with teacher's branding (logo/name from subdomain)
- Email + password fields
- "Don't have an account? Contact your teacher" link
- Teacher's profile picture as subtle watermark

#### Visual Direction
- Card with subtle shadow, teacher's primary color as accent
- Subdomain shown in top bar: `teacher-name.ilm.com`

---

### 6.4 Student Course Catalog (`/[subdomain]/courses`)

#### Layout
```
┌──────────────────────────────────────────────┐
│  Topbar: Teacher name | Language | Theme     │
├──────────────────────────────────────────────┤
│  Page Title: "Courses"                       │
│  Tab: [All Courses] [My Enrolled Courses]    │
│  ─────────────────────────────────────────   │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Course │ │ Course │ │ Course │          │
│  │ Card   │ │ Card   │ │ Card   │          │
│  └────────┘ └────────┘ └────────┘          │
│  ┌────────┐ ┌────────┐                      │
│  │ Course │ │ Course │                      │
│  │ Card   │ │ Card   │                      │
│  └────────┘ └────────┘                      │
│  ──── Pagination ────                        │
└──────────────────────────────────────────────┘
```

#### Course Card Anatomy
```
┌────────────────────────────┐
│  ┌──────────────────────┐  │
│  │  Course Image        │  │ ← aspect-video
│  │        [$29.99] badge│  │ ← top-right badge
│  └──────────────────────┘  │
│  Course Title              │ ← line-clamp-1, font-semibold
│  Description text...       │ ← line-clamp-1, text-muted
│  👥 24 students  📖 12 les │ ← icon + count row
│  ┌──────────────────────┐  │
│  │ Progress: ████░░ 67% │  │ ← if enrolled
│  └──────────────────────┘  │
│  OR                        │
│  [📖 Enroll Now]           │ ← if not enrolled (outline btn)
│  ─────────────────────────  │
│  [📖 Course Details]       │ ← primary button, full width
└────────────────────────────┘
```

#### Interaction
- Hover: card border transitions to `border-primary/50`, subtle shadow lift
- Tab switching: content fades with 200ms transition
- Pagination: stateful (React state, not URL-based)

---

### 6.5 Course Detail Page (`/[subdomain]/courses/[courseId]`)

#### Layout
```
┌──────────────────────────────────────────────┐
│  Breadcrumb: Courses > Course Title          │
├──────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Course Image    │  │ Title            │  │
│  │  (hero)          │  │ Description      │  │
│  │                  │  │ Price: $29.99    │  │
│  │                  │  │ 📖 12 lessons    │  │
│  │                  │  │ 👥 24 students   │  │
│  │                  │  │ [Enroll Now] btn │  │
│  └─────────────────┘  └──────────────────┘  │
├──────────────────────────────────────────────┤
│  TABS: [Curriculum] [Resources] [Reviews]    │
├──────────────────────────────────────────────┤
│  Curriculum:                                 │
│  ▸ Section 1: Introduction                   │
│    ├── Lesson 1: Getting Started             │
│    ├── Lesson 2: Core Concepts               │
│    └── 🎯 Quiz: Section 1 Assessment         │
│  ▸ Section 2: Advanced Topics                │
│    ├── Lesson 3: Deep Dive                   │
│    └── 📁 Resources: Section materials       │
└──────────────────────────────────────────────┘
```

---

### 6.6 Teacher Dashboard (`/[subdomain]/dashboard`)

#### Sidebar Navigation
```
┌────────────────────────┐
│  Teacher Avatar + Name │
│  subdomain.ilm.com     │
│  Plan: Pro             │
├────────────────────────┤
│  📊 Dashboard          │ ← active: green bg + white text
│  📚 Courses            │
│  📈 Analytics          │
│  ⚙️ Settings           │
├────────────────────────┤
│  [Collapse] button     │
└────────────────────────┘
```

#### Dashboard Home
```
┌─────────────────────────────────┐
│  Welcome, Ahmed! 👋             │
├─────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Total │ │Total │ │Active│   │
│  │Students│Courses││Enroll│   │
│  │ 247  │ │ 12  │ │ 389  │   │
│  └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────┤
│  📊 Enrollment Over Time       │ ← Recharts line/area chart
│  (using chart-1 through        │
│   chart-5 green palette)       │
├─────────────────────────────────┤
│  Recent Activity               │
│  • Sara enrolled in "Physics"  │
│  • Ahmed completed Quiz 3      │
│  • 5 new students this week    │
└─────────────────────────────────┘
```

#### Course Management (`/dashboard/courses`)
```
┌─────────────────────────────────┐
│  My Courses        [+ Create]   │
├─────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │ Course Card (teacher)    │   │
│  │ Title | Students | Status│   │
│  │ [Edit] [Manage Codes]    │   │
│  └──────────────────────────┘   │
│  ... more cards ...             │
│  ──── Pagination ────           │
└─────────────────────────────────┘
```

#### Course Editor (`/dashboard/courses/[courseId]`)
- Tabbed interface: **General** | **Sections** | **Codes** | **Resources**
- General tab: Title, description (Lexical editor), price, image upload, publish toggle
- Sections tab: Drag-and-drop section list → lesson list within each section
- Codes tab: Generate codes table, usage status, assigned student
- Resources tab: Upload/manage course-level and lesson-level files

#### Analytics (`/dashboard/analytics`)
- Date range picker at top
- Stat cards row: Students, Courses, Enrollments, Completion Rate
- Line chart: Enrollments over time
- Bar chart: Students per course
- Table: Recent quiz submissions with scores

#### Settings (`/dashboard/settings`)
- Profile form: Name, email, profile picture, contact info
- Subdomain display (read-only)
- Plan info and upgrade CTA
- Danger zone: Delete account

---

### 6.7 Quiz Taking (`/[subdomain]/courses/[courseId]/quiz`)

#### Layout
```
┌──────────────────────────────────────────────┐
│  Quiz: Section 1 Assessment                  │
│  ⏱ Time Remaining: 14:32                    │
│  Progress: ████░░░░ 4/10 questions           │
├──────────────────────────────────────────────┤
│  Q4. What is the capital of Egypt?           │
│                                              │
│  ○ Alexandria                                │
│  ● Cairo                    ← selected       │
│  ○ Luxor                                     │
│  ○ Giza                                      │
│                                              │
│  [← Previous]       [Next →]                 │
├──────────────────────────────────────────────┤
│  Question Navigator:                         │
│  [1✓] [2✓] [3✓] [4●] [5] [6] [7] [8] [9] [10] │
│                                              │
│  [Submit Quiz]                               │
└──────────────────────────────────────────────┘
```

#### States
- **In progress:** Timer running, auto-save on answer change
- **Time expired:** Auto-submit, show "Time's up" dialog
- **Submitted:** Show results with correct answers highlighted (green = correct, red = wrong)
- **Essay questions:** Textarea with "Pending manual grading" badge

---

## 7. RTL / Arabic Layout Guidelines

### 7.1 Directional Properties

| LTR Property | RTL Equivalent | Tailwind |
|-------------|----------------|----------|
| `margin-left` | `margin-right` | Use `ms-*` (margin-start) |
| `padding-right` | `padding-left` | Use `pe-*` (padding-end) |
| `text-align: left` | `text-align: right` | Use `text-start` |
| `float: left` | `float: right` | Use logical properties |
| `border-left` | `border-right` | Use `border-s-*` (border-start) |

### 7.2 Component RTL Behavior

| Component | RTL Behavior |
|-----------|-------------|
| **Sidebar** | Renders on RIGHT side (`side="right"`) when `locale === "ar"` |
| **Breadcrumbs** | Arrow direction flips (CSS class `.rotate-rtl` applies `transform: rotate(180deg)`) |
| **Pagination** | Previous/Next swap alignment |
| **Progress bar** | Fills from RIGHT to LEFT |
| **Dropdown menus** | Open towards START edge |
| **Icons (directional)** | Arrows, chevrons rotate 180° |
| **Form layouts** | Labels align to START |

### 7.3 Implementation Pattern
```tsx
// In layout.tsx — locale determines direction
const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
const side = locale === "ar" ? "right" : "left";
const dir = locale === "ar" ? "rtl" : "ltr";

// Applied via `dir` attribute on containers
<Sidebar dir={dir} side={side} />
```

---

## 8. Interaction Patterns

### 8.1 Animations & Transitions

| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| **Page transition** | Fade in | 200ms | ease-out |
| **Card hover** | Shadow lift + border color | 300ms | ease-in-out |
| **Button hover** | Background color shift | 150ms | ease |
| **Modal open** | Scale up + fade | 200ms | spring |
| **Toast appear** | Slide in from top | 300ms | ease-out |
| **Sidebar collapse** | Width transition | 200ms | ease |
| **Progress bar fill** | Width transition | 300ms | ease-out |
| **Drag and drop** | Lift + shadow | 150ms | ease |
| **Tab switch** | Underline slide | 200ms | ease |

### 8.2 Loading States

| Context | Pattern |
|---------|---------|
| **Page loading** | Centered `Loader` icon (Lucide) with `animate-spin` |
| **Data fetching (tables)** | Skeleton rows (`Skeleton` component) |
| **Button loading** | Spinner replaces icon, text remains, button disabled |
| **Image loading** | Skeleton placeholder → fade in on load |
| **Video loading** | Centered spinner over dark overlay |

### 8.3 Error States

| Context | Pattern |
|---------|---------|
| **Form validation** | Inline red text below field, red border on input |
| **API error** | Sonner toast (destructive variant) |
| **Empty state** | Centered icon + message + action button |
| **404** | Custom page with illustration and "Go Home" button |
| **Network error** | Banner at top of page with retry button |

### 8.4 Empty States

Every list/grid view must have an empty state:
```
┌──────────────────────────────┐
│                              │
│       📚 (large icon)        │
│                              │
│   No courses available yet   │
│                              │
│   [Create Your First Course] │
│                              │
└──────────────────────────────┘
```

---

## 9. Dark Mode

### 9.1 Implementation
- Provider: `next-themes` wrapping the entire app
- Toggle: `ModeToggle` component (Sun/Moon icon button with dropdown)
- Storage: `localStorage` with `class` strategy (applies `.dark` class to `<html>`)
- Default: System preference

### 9.2 Dark Mode Rules
1. **Never use absolute white or black** — use `--background` and `--foreground` tokens
2. **Cards are elevated** — dark card (`oklch(0.205)`) is lighter than background (`oklch(0.145)`)
3. **Borders use alpha** — `oklch(1 0 0 / 10%)` for subtle separation without hard lines
4. **Primary green is brighter in dark** — `oklch(0.77)` vs `oklch(0.65)` in light
5. **Shadows are removed** in dark mode — rely on border/elevation instead
6. **Images** — no automatic inversion; ensure course thumbnails work on both backgrounds

---

## 10. Responsive Design

### 10.1 Mobile-First Patterns

| Component | Mobile (<768px) | Desktop (≥1024px) |
|-----------|-----------------|-------------------|
| **Sidebar** | Hidden → opens as Sheet overlay | Persistent, collapsible |
| **Course grid** | Single column | `auto-fill, minmax(320px, 1fr)` |
| **Dashboard stats** | Stacked vertically | Horizontal row |
| **Course detail** | Image above, info below | Side-by-side |
| **Quiz** | Full width, bottom nav | Centered `max-w-2xl` |
| **Tables** | Horizontal scroll or card view | Full table |
| **Navigation** | Bottom bar or hamburger | Sidebar |

### 10.2 Touch Targets
- Minimum touch target: **44×44px** (Apple HIG)
- Button minimum height: **40px** (`h-10`)
- Spacing between interactive elements: ≥ **8px**

---

## 11. Accessibility

### 11.1 Standards
- **WCAG 2.1 Level AA** compliance minimum
- All interactive elements keyboard accessible
- Focus indicators visible (`:focus-visible` ring using `--ring` token)

### 11.2 Implementation

| Feature | Implementation |
|---------|----------------|
| **Keyboard nav** | All Radix primitives are keyboard accessible by default |
| **Screen readers** | ARIA labels on icon-only buttons, status announcements |
| **Color contrast** | OKLCH tokens verified at 4.5:1 ratio for normal text |
| **Focus management** | Dialog traps focus; toast doesn't steal focus |
| **Motion** | `@media (prefers-reduced-motion: reduce)` — disable animations |
| **Text sizing** | Use `rem` units throughout; respects browser zoom |

---

## 12. Visual Style Guide

### 12.1 Card Patterns

**Standard Card:**
```
Border: 1px solid var(--border)
Background: var(--card)
Padding: 16px (p-4)
Border-radius: 0 (sharp corners)
Hover: border-color → var(--primary) at 50% opacity
       box-shadow → subtle lift
Transition: all 300ms ease
```

**Stat Card (Dashboard):**
```
Same as standard +
Icon: 24px, color: var(--muted-foreground)
Value: text-3xl, font-bold
Label: text-sm, text-muted-foreground
```

### 12.2 Data Visualization

- **Chart library:** Recharts 2.15
- **Color palette:** `chart-1` through `chart-5` (monochromatic green scale)
- **Grid lines:** `var(--border)` color, dashed
- **Labels:** `text-xs`, `var(--muted-foreground)`
- **Tooltips:** Card-style floating tooltip with `var(--popover)` background
- **Responsive:** Charts resize with container; hide legend on mobile

### 12.3 Icon System

| Library | Count | Usage |
|---------|-------|-------|
| **Lucide React** | Primary | Navigation, actions, status indicators |
| **Tabler Icons** | Secondary | Extended icon set for specific contexts |

**Icon Sizing Convention:**
| Context | Size Class | Pixels |
|---------|-----------|--------|
| Inline with text | `h-4 w-4` | 16px |
| Button icon | `h-4 w-4` | 16px |
| Card icon | `h-6 w-6` | 24px |
| Empty state | `h-12 w-12` | 48px |
| Hero/feature | `h-8 w-8` | 32px |

---

## 13. Stitch Build Instructions

### 13.1 Technology Constraints
- **Framework:** Next.js 16 (App Router, Server Components)
- **Styling:** Tailwind CSS v4 with `@theme inline` tokens (see `globals.css`)
- **Components:** shadcn/ui — install via `npx shadcn@latest add <component>`
- **Icons:** `lucide-react` (primary), `@tabler/icons-react` (secondary)
- **State:** Jotai for local state, `@tanstack/react-query` for server state
- **Forms:** `react-hook-form` + `zod` validation
- **i18n:** `next-intl` — all user-facing strings must use `useTranslations()` or `getTranslations()`
- **Charts:** Recharts with custom `Chart` component wrapper

### 13.2 File Conventions
```
app/
├── (auth)/             → Auth routes (no layout chrome)
├── [subdomain]/        → Tenant-scoped pages
│   ├── (auth)/         → Per-tenant login
│   ├── courses/        → Student course views
│   └── dashboard/      → Teacher dashboard
│       ├── courses/    → CRUD course management
│       ├── analytics/  → Data views
│       └── settings/   → Profile/account settings
components/
├── ui/                 → shadcn primitives (DO NOT MODIFY)
├── blocks/             → Complex composed components
└── *.tsx               → App-level shared components
hooks/                  → Custom React hooks
lib/                    → API functions, utilities, auth
messages/               → i18n JSON files (ar.json, en.json)
```

### 13.3 Naming Conventions
- **Files:** `kebab-case.tsx` (e.g., `course-card.tsx`)
- **Components:** `PascalCase` (e.g., `CourseCard`)
- **Hooks:** `use-kebab-case.ts` (e.g., `use-analytics.ts`)
- **API functions:** `camelCase` (e.g., `getCoursesByTeacherId`)
- **CSS tokens:** `--kebab-case` (e.g., `--primary-foreground`)

### 13.4 Critical Patterns to Follow
1. **Always use `"use client"` directive** for components with hooks, event handlers, or browser APIs
2. **Server components** for layouts and data fetching (no directive needed)
3. **All text must be translated** — use `t("key")` from `useTranslations()`
4. **RTL awareness** — use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`)
5. **Loading states are mandatory** — every data-fetching page needs a loading spinner
6. **Error handling** — use `attempt()` utility for async, `toast.error()` for user-facing errors
7. **Border radius is 0** — the `--radius: 0` token is intentional design; do not add rounded corners
