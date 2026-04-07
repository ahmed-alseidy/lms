# Product Requirements Document (PRD)
# LMS SaaS Platform — "Ilm" (علم)

> A multi-tenant Learning Management System for the Egyptian & MENA market where teachers create branded subdomains to sell courses, manage students, and grow their education business.

---

## 1. Executive Summary

### 1.1 Vision
Build the leading Arabic-first, multi-tenant LMS platform that empowers educators in Egypt and MENA to launch, manage, and monetize their online courses — competing directly with Teachable and Thinkific but tailored for local payment methods, Arabic RTL support, and regional pricing.

### 1.2 Problem Statement
Egyptian and MENA-region teachers have limited options for launching online course businesses:
- **Teachable/Thinkific** are priced in USD, lack Arabic RTL support, and don't support local payment gateways (Fawaterak, Vodafone Cash, etc.)
- **Self-hosted solutions** require heavy technical knowledge
- **Local competitors** lack the polish, feature depth, and scalability of international platforms

### 1.3 Solution
A turnkey SaaS platform where a teacher can:
1. Sign up and get a branded subdomain (`teacher-name.lms.com`)
2. Upload courses with video (HLS streaming), sections, lessons, quizzes, and downloadable resources
3. Enroll students via unique course codes
4. Track performance through an analytics dashboard
5. Monetize via local and international payment methods

### 1.4 Target Market
- **Primary:** Independent Egyptian teachers and tutors (secondary school, university prep, professional skills)
- **Secondary:** Small training institutes, corporate trainers, content creators in MENA

---

## 2. User Personas

### 2.1 Teacher Persona — "Mr. Ahmed" (المعلم أحمد)
| Attribute | Detail |
|-----------|--------|
| **Age** | 28–45 |
| **Tech level** | Low-to-medium; uses WhatsApp, Facebook, YouTube |
| **Goal** | Earn revenue from online courses without needing technical skills |
| **Pain** | Current platforms are expensive ($49+/mo in USD), only in English, no local payments |
| **Language** | Arabic primary, some English |
| **Device** | Desktop for course creation, mobile for checking analytics |

### 2.2 Student Persona — "Sara" (الطالبة سارة)
| Attribute | Detail |
|-----------|--------|
| **Age** | 16–30 |
| **Tech level** | Medium; comfortable with mobile apps and web |
| **Goal** | Access course materials, watch videos, take quizzes, track progress |
| **Pain** | Scattered resources across platforms (Telegram, Drive, YouTube) |
| **Language** | Arabic primary |
| **Device** | Primarily mobile, some desktop |

---

## 3. Feature Specification

### 3.1 Core Platform (Current — Implemented)

#### 3.1.1 Multi-Tenant Architecture
- **Subdomain routing:** Each teacher gets `{subdomain}.platform.com`
- **Middleware-based routing:** Next.js middleware rewrites subdomain paths to `[subdomain]/` route group
- **Tenant isolation:** Students are scoped per teacher (`students` table has `teacherId` FK)
- **Hard-coded subdomain list:** Currently loaded from `subdomains.json` (to be migrated to DB lookup)

#### 3.1.2 Authentication & Authorization
- **better-auth** library for session management
- **Roles:** `teacher` and `student` (stored in `users.role` column)
- **Separate login flows:**
  - Teacher login: `/login-teacher`
  - Student login: per-subdomain `/login`
- **Session:** Cookie-based with `jose` JWT validation on the frontend

#### 3.1.3 Course Management (Teacher Dashboard)
- **CRUD operations** for courses (title, description, image, price, published/draft)
- **Course sections** with drag-and-drop ordering (`@hello-pangea/dnd`)
- **Lessons** within sections (ordered, with descriptions)
- **Rich text editor** — Lexical editor for lesson content
- **Course image upload** via Cloudinary

#### 3.1.4 Video System (Dual-Backend)
| Feature | S3 Path (Free/Pro) | Mux Path (Premium) |
|---------|--------------------|--------------------|
| Upload | Client-side FFmpeg transcoding to HLS | Mux uploader component |
| Storage | S3 bucket (manifest + segments) | Mux asset storage |
| Playback | Video.js + hls.js | Mux Player React |
| DRM | None | Mux DRM ($100/mo base) |
| Status tracking | N/A | waiting → preparing → ready → errored |

#### 3.1.5 Quiz System
- **Question types:** MCQ, True/False, Essay
- **Auto-grading** for MCQ and True/False
- **Manual grading** required for essay questions
- **Timed quizzes** with server-side duration tracking
- **Multiple attempts** (configurable per quiz)
- **Auto-save responses** during quiz taking (separate `quiz_responses` table)
- **Final submission** locks answers (separate `submitted_question_answers` table)
- **Grading statuses:** `pending → auto_graded → graded`

#### 3.1.6 Course Enrollment
- **Course codes:** Teacher generates unique codes; student redeems to enroll
- **Progress tracking:** Per-enrollment progress percentage
- **Lesson completion tracking:** `student_lesson_completions` table
- **Video completion tracking:** `student_video_completions` table

#### 3.1.7 Downloadable Resources
- **Lesson resources:** PDFs/files attached to individual lessons
- **Course resources:** Resource library per course
- **Download tracking:** `resource_downloads` table with enrollment context
- **S3 storage** for all resource files

#### 3.1.8 Analytics Dashboard
- Teacher analytics via Recharts
- Available metrics (via `useAnalytics` hook):
  - Total students
  - Total courses
  - Total enrollments
  - Recent activity

#### 3.1.9 Internationalization (i18n)
- **next-intl** for full i18n support
- **Languages:** Arabic (ar) — primary, English (en)
- **RTL support:** Layout flips based on locale (sidebar position, icon rotation)
- **Language switcher** in dashboard header

---

### 3.2 Planned Features (Roadmap)

#### Phase 1 — High Priority (Next 2–3 months)

##### 3.2.1 Course Reviews & Ratings ⭐
| Requirement | Description |
|-------------|-------------|
| Star rating | 5-star rating on courses (stored per enrollment) |
| Written reviews | Text review with moderation queue for teacher |
| Review display | Average rating on course cards, review list on course detail page |
| Review analytics | Rating distribution chart in teacher dashboard |

##### 3.2.2 Certificates of Completion 🎓
| Requirement | Description |
|-------------|-------------|
| Auto-generate | Trigger when enrollment progress = 100% |
| Custom template | Teacher uploads logo; system applies colors/fonts |
| PDF download | Generated via server-side PDF library |
| Verification URL | Unique URL per certificate for employers/institutions |
| Certificate log | Dashboard view of all issued certificates |

##### 3.2.3 Advanced Payments 💳
| Requirement | Description |
|-------------|-------------|
| One-time purchase | ✅ Already implemented (Fawaterak) |
| Subscriptions | Monthly/yearly access to a teacher's catalog |
| Coupon codes | Percentage or fixed-amount discount, expiry date, usage limits |
| Course bundles | Group multiple courses at a discounted price |
| Refund handling | Teacher-initiated refunds within policy window |

##### 3.2.4 Basic Email Marketing 📧
| Requirement | Description |
|-------------|-------------|
| Welcome email | On student signup/enrollment |
| Completion email | When course is finished |
| Transactional emails | Payment receipts, code redemption |
| Provider | SendGrid or Resend integration |

#### Phase 2 — Medium Priority (4–6 months)

##### 3.2.5 Student Community & Discussions 💬
- Course-level discussion forums
- Per-lesson Q&A threads
- Teacher announcements with push notifications
- Activity feed on student homepage

##### 3.2.6 Drip Content / Scheduled Release
- Set lesson release dates
- Time-based unlock after enrollment
- Prerequisite completion requirements (finish lesson A before B)

##### 3.2.7 Advanced Quiz Features
- Question banks (random selection from pool)
- Fill-in-the-blank, matching question types
- Answer explanations (shown after submission)
- Pass/fail thresholds with retake limits

##### 3.2.8 Direct Messaging
- Teacher–student private messaging
- In-app and email notification preferences

#### Phase 3 — Lower Priority (7–12 months)

##### 3.2.9 Mobile App / PWA
- Native iOS/Android (React Native via `apps/mobile`)
- Offline video download
- Push notifications

##### 3.2.10 White-Label / Custom Domains
- Teacher connects their own domain (e.g., `courses.teacher.com`)
- Remove platform branding
- Custom CSS injection for advanced users

##### 3.2.11 Advanced Analytics
- Video heatmaps (where students pause/rewatch)
- Engagement per lesson (time spent, completion rate)
- Revenue forecasting and LTV calculations
- A/B testing for course pricing

##### 3.2.12 Affiliate Marketing
- Affiliate link generation per course
- Commission tracking and payouts
- Referral codes for student-to-student sharing

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Web App  │  │ Mobile App   │  │ Teacher Custom Domain  │ │
│  │ (Next.js)│  │ (React Native)│  │ (CNAME → platform)    │ │
│  └────┬─────┘  └──────┬───────┘  └───────────┬────────────┘ │
└───────┼────────────────┼─────────────────────┼───────────────┘
        │                │                     │
        ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│              NestJS Backend (REST)                            │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐ │
│  │  Auth    │ Courses  │ Quizzes  │ Videos   │ Analytics  │ │
│  │ Module   │ Module   │ Module   │ Module   │ Module     │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  AWS S3  │ │   Mux Video  │
│  (Drizzle)   │ │  (HLS)   │ │  (Premium)   │
└──────────────┘ └──────────┘ └──────────────┘
```

### 4.2 Monorepo Structure

```
lms-saas/
├── apps/
│   ├── web/           → Next.js 16 frontend (Tailwind v4, shadcn/ui, Radix)
│   ├── api/           → NestJS backend (REST API)
│   └── mobile/        → React Native (planned)
├── packages/
│   ├── shared-lib/    → Drizzle ORM schemas, DB connection, DTOs
│   ├── ui/            → Shared component library
│   ├── eslint-config/ → Shared ESLint rules
│   └── typescript-config/ → Shared tsconfig
├── project-details/   → Business docs (pricing, roadmap, plans)
├── turbo.json         → Turborepo pipeline config
└── package.json       → Yarn workspaces root
```

### 4.3 Database Schema (Drizzle ORM + PostgreSQL)

```
┌─────────────────────────────────┐
│            users                │  ← better-auth managed
│  id, name, email, role,        │
│  emailVerified, image          │
└──────────┬──────────────────────┘
           │ 1:1
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌──────────┐
│teachers│   │ students │
│subdomain│   │teacherId │ ← scoped per teacher
│plan    │   │email     │
└───┬────┘   └────┬─────┘
    │ 1:N         │
    ▼             │
┌────────┐        │
│courses │        │
│title   │        │
│price   │        │
│published│       │
└───┬────┘        │
    │ 1:N         │
    ▼             │
┌────────────┐    │
│course_     │    │
│sections    │    │
│orderIndex  │    │
└───┬────────┘    │
    │ 1:N         │
    ▼             │
┌────────┐        │
│lessons │        │
│orderIdx│        │
└───┬────┘        │
    │ 1:N         │
    ├── videos (S3 HLS / Mux)
    ├── quizzes → questions → answers
    ├── lesson_resources (PDFs)
    └── student_lesson_completions
              ▲
              │
         ┌────┴──────┐
         │enrollments│ ← student + course
         │progress   │
         │status     │
         └───────────┘
```

### 4.4 Key Technology Choices

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Frontend framework** | Next.js | 16.x | App Router, Server Components, ISR |
| **Styling** | Tailwind CSS | 4.x | CSS-first config, v4 `@theme` tokens |
| **Component library** | shadcn/ui + Radix | Latest | 34 UI primitives already in place |
| **State management** | Jotai + React Query | Latest | Atomic state + server cache |
| **Forms** | React Hook Form + Zod | Latest | Type-safe validation |
| **Rich text** | Lexical | 0.39 | Extensible, performant editor |
| **Backend framework** | NestJS | Latest | Module-based, TypeScript-native |
| **ORM** | Drizzle ORM | 0.38 | Type-safe, SQL-like queries |
| **Database** | PostgreSQL | Latest | Relational, battle-tested |
| **Video (S3)** | FFmpeg (client) + hls.js | Latest | Client-side transcoding, no server cost |
| **Video (Premium)** | Mux | Latest | DRM, adaptive streaming |
| **Auth** | better-auth | 1.4 | Session management, multi-provider |
| **i18n** | next-intl | 4.7 | ICU message format, SSR-safe |
| **Monorepo** | Turborepo + Yarn Workspaces | Latest | Incremental builds, shared packages |
| **Icons** | Lucide + Tabler | Latest | Consistent icon language |
| **Charts** | Recharts | 2.15 | Composable chart components |
| **Drag & Drop** | @hello-pangea/dnd | 18.x | Section/lesson reordering |

---

## 5. SaaS Plans & Pricing

### 5.1 Plan Tiers

| Plan | Price | Target | Storage | Students | Courses | Video Stack |
|------|-------|--------|---------|----------|---------|-------------|
| **Free** | $0 | Trial / hobby | 2 GB | 20 | 3 | S3 (standard quality) |
| **Basic** | $29–49/mo | Individual teachers | 10 GB | 50 | 5 | S3 |
| **Pro** | $79–129/mo | Professional educators | 100 GB | 500 | Unlimited | S3 (HD) |
| **Business** | $199–299/mo | Institutions | 500 GB | 2,000 | Unlimited | Mux + DRM |
| **Enterprise** | Custom ($500+) | Universities, corporate | Unlimited | Unlimited | Unlimited | Dedicated infra |

### 5.2 Additional Revenue Streams
- Transaction fees: 2–5% per course sale
- Setup fees: Custom domain ($50–100), migration ($200–500)
- Add-ons: Advanced analytics (+$20/mo), certificates (+$15/mo), live sessions (+$25/mo)

### 5.3 Egypt/MENA Adjustments
- EGP pricing converted monthly based on exchange rate
- Local payments: Fawaterak (implemented), Vodafone Cash, Instapay (planned)
- Arabic-first UI with full RTL support

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **LCP** < 2.5s on course pages
- **Video start** < 3s (HLS adaptive bitrate)
- **API response** p95 < 500ms for CRUD operations
- **SSR pages** for SEO-critical routes (course catalog, landing)

### 6.2 Security
- Password hashing via Argon2 (through better-auth)
- Session token rotation
- CSRF protection
- Input sanitization (DOMPurify for rich text)
- Print disabled (`@media print { body { display: none } }`)
- S3 pre-signed URLs for video access (no public bucket)

### 6.3 Scalability
- Multi-tenant DB with `teacherId` scoping (not separate DBs)
- Stateless API server (horizontally scalable)
- S3 for media offloading
- Connection pooling for PostgreSQL

### 6.4 Accessibility
- Keyboard navigable (Radix primitives)
- ARIA labels on interactive controls
- Color contrast AA compliance
- Screen reader friendly error messages

### 6.5 Localization
- Full Arabic RTL layout support
- Bidirectional text handling
- Date formatting (Day.js with locale)
- Number/currency formatting (EGP/USD)

---

## 7. Success Metrics

| Metric | Target (6 months) | Target (12 months) |
|--------|-------------------|---------------------|
| **Registered teachers** | 100 | 500 |
| **Active students** | 2,000 | 15,000 |
| **Courses published** | 300 | 2,000 |
| **MRR** | $2,000 | $15,000 |
| **Teacher retention** (monthly) | 80% | 85% |
| **Student completion rate** | 30% | 45% |
| **NPS** | 40+ | 50+ |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| S3 egress costs spiral | High monthly bills | Implement per-tenant caps, CDN caching, consider CloudFront |
| Mux DRM $100/mo fixed cost | Unprofitable for few Premium users | Gate DRM behind Business plan; minimum 3 Premium teachers to break even |
| Client-side FFmpeg slow on weak devices | Bad upload UX | Show progress %, offer server-side fallback for Pro+ |
| better-auth breaking changes | Auth outage | Pin version, integration tests, fallback session logic |
| Arabic font rendering | UI glitches | Test with JetBrains Mono + Rubik (current); add Noto Sans Arabic fallback |
| Teacher adoption | Low growth | Free plan with generous limits, Arabic onboarding, WhatsApp support |

---

## 9. Open Questions

1. **Custom domains:** Should we use Vercel's domain API or manual CNAME + SSL setup?
2. **Payment gateway expansion:** Priority between Paymob, Fawry, and Instapay?
3. **Mobile strategy:** Native React Native vs. Progressive Web App first?
4. **Video DRM:** Should DRM be available on Pro plan at a surcharge, or strictly Business+?
5. **Subdomain provisioning:** Move from `subdomains.json` to real-time DB lookup?

---

## Appendix A: Existing Route Map

```
/ (root domain)
├── / .................... Landing page (currently tag input demo)
├── /(auth)/
│   ├── /signup .......... Teacher signup
│   └── /subdomain ....... Subdomain claim flow
│
└── /[subdomain]/ ........ Tenant-scoped routes
    ├── / ................ Student homepage
    ├── /(auth)/
    │   ├── /login ....... Student login
    │   └── /login-teacher Teacher login (per subdomain)
    ├── /courses ......... Course catalog (student view)
    │   └── /[courseId]
    │       ├── / ........ Course detail page
    │       ├── /enroll .. Enrollment flow
    │       ├── /quiz .... Quiz taking
    │       ├── /resources Resource list
    │       └── /sections  Section/lesson viewer
    └── /dashboard ....... Teacher dashboard (protected)
        ├── / ............ Dashboard home
        ├── /analytics ... Analytics page
        ├── /courses ..... Course management
        │   └── /[courseId]
        │       ├── / .... Course editor
        │       ├── /codes Course code management
        │       ├── /resources Resource management
        │       └── /sections Section/lesson editor
        └── /settings .... Teacher settings
```
