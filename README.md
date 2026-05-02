# SmartERP Lite

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat&logo=bootstrap)
![DevExtreme](https://img.shields.io/badge/DevExtreme-23-FF7200?style=flat)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

> A production-grade AI-powered Enterprise Resource Planning dashboard built with React 18, Vite, and Gemini AI. Designed as a showcase of modern frontend architecture patterns.

---

## Features

### Dashboard
- ✅ Drag-to-rearrange widget grid (react-grid-layout)
- ✅ KPI cards with 7-day sparklines and trend percentages
- ✅ Revenue trend chart with date-range drill-down (click → filter orders)
- ✅ Order status donut chart (click slice → filter orders)
- ✅ Top 5 products by revenue (horizontal bar)
- ✅ Revenue Forecasting — linear regression + 3-month dashed projection (Admin)
- ✅ AI summary widget with restock alerts
- ✅ Recent Activity feed from audit log

### Products
- ✅ DevExtreme DataGrid with inline editing, column chooser, column fixing
- ✅ Full CRUD: Add / Edit / Delete (Admin only)
- ✅ Category filter pills with live counts
- ✅ Needs Restock filter (stock ≤ minStock threshold)
- ✅ Bulk actions: bulk category change, bulk export, bulk delete
- ✅ Per-product restock threshold (minStock)
- ✅ Keyboard shortcut: Ctrl+N to add product

### Orders
- ✅ List view (DevExtreme DataGrid) + Kanban view (@dnd-kit drag-and-drop)
- ✅ View toggle persisted to localStorage
- ✅ Order detail drawer (Offcanvas) with visual timeline
- ✅ Print-ready Invoice modal with GST, PDF download, company address
- ✅ Bulk status changes + bulk export
- ✅ Order status filter pills

### Users (Admin only)
- ✅ Full CRUD with email validation
- ✅ Role and status management

### AI Insights
- ✅ **AI Insights tab** — Gemini executive summary, recommendations, action plan
- ✅ **Anomaly Detection tab** — 4 rule-based checks, expandable root cause analysis
- ✅ **Restock Planner tab** — sales velocity, days-to-stockout table, AI PO draft
- ✅ **Activity Log tab** — entity-filtered audit timeline with relative timestamps
- ✅ Rule-based insights engine (always shown)
- ✅ Revenue by category chart

### AI & Smart Features
- ✅ **AI-Powered Global Search** (Ctrl+K) — Quick Search + AI Search tabs
- ✅ **Multi-Currency Display** — USD / EUR / INR / GBP with live conversion
- ✅ **Smart Export Center** — CSV / JSON / HTML report, column chooser
- ✅ **Floating AI Chat Widget** — ask anything about your ERP data
- ✅ Gemini direct integration (3-tier: Direct / Backend Proxy / Mock)

### UX & Infrastructure
- ✅ **Onboarding Tour** — 12-step driver.js walkthrough on first login
- ✅ **Settings Page** — app name, currency, date format, theme, notification toggles
- ✅ **Error Boundaries** — per-page error recovery with stack trace in dev mode
- ✅ **PWA Support** — Web App Manifest, service worker, offline page
- ✅ **Code Splitting** — React.lazy + Suspense per page, skeleton fallback
- ✅ **Performance** — React.memo on SummaryCard + Sidebar, virtual scrolling in grids
- ✅ Dark mode (Bootstrap + CSS variables), persisted to localStorage
- ✅ Smart Notifications bell with dismissible alerts
- ✅ Keyboard shortcuts: Ctrl+K (search), Ctrl+N (add), Ctrl+D (theme), ? (help)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React 18 SPA                      │
│                                                     │
│  ┌──────────┐  ┌─────────┐  ┌────────────────────┐ │
│  │ AuthCtx  │  │ThemeCtx │  │   AppContext        │ │
│  │ login/   │  │light/   │  │ products/orders/    │ │
│  │ logout   │  │dark     │  │ users + CRUD ops    │ │
│  └──────────┘  └─────────┘  └────────────────────┘ │
│  ┌──────────┐  ┌─────────┐  ┌────────────────────┐ │
│  │AuditLog  │  │Currency │  │   ToastContext      │ │
│  │Context   │  │Context  │  │ success/error msgs  │ │
│  └──────────┘  └─────────┘  └────────────────────┘ │
│                                                     │
│  Pages (lazy-loaded, each in ErrorBoundary)         │
│  Dashboard │ Products │ Orders │ Users │ AIInsights │
│  Settings                                           │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              API Layer                       │  │
│  │  productApi  orderApi  userApi  authApi      │  │
│  │  aiApi (3-tier: Gemini / Proxy / Mock)       │  │
│  └──────────────────────────────────────────────┘  │
│              │                    │                 │
│     DummyJSON REST API     Google Gemini AI         │
└─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Technology | Version | Why chosen |
|---|---|---|
| React | 18.2 | Concurrent rendering, hooks, Suspense |
| Vite | 5.1 | Sub-second HMR, native ESM, fast builds |
| Bootstrap | 5.3 | Utility-first responsive layout, dark mode |
| React Bootstrap | 2.10 | Bootstrap components as React |
| DevExtreme | 23.2 | Enterprise DataGrid (virtual scroll, inline edit, export) |
| Recharts | 2.12 | Declarative React charts — easy to customize |
| react-grid-layout | 2.2 | Drag-and-drop dashboard grid |
| @dnd-kit/core | 6.3 | Accessible Kanban drag-and-drop |
| driver.js | 1.4 | Zero-dependency onboarding tour |
| react-router-dom | 6.22 | File-based client routing |
| Google Gemini AI | 2.0-flash | Free-tier AI for insights, search, forecasts |

---

## Folder Structure

```
src/
├── api/                    # Service layer (mock + real)
│   ├── mockApi.js          # delay() utility for simulated async
│   ├── authApi.js          # loginUser, logoutUser, getCurrentUser
│   ├── aiApi.js            # 3-tier AI: Gemini direct / proxy / mock
│   ├── productApi.js       # CRUD + DummyJSON integration
│   ├── orderApi.js         # Orders with in-memory status updates
│   └── userApi.js          # CRUD users
├── components/
│   ├── common/             # Reusable UI atoms
│   │   ├── SummaryCard.jsx     # KPI card with sparkline (React.memo)
│   │   ├── ModalForm.jsx       # Generic add/edit modal
│   │   ├── BulkActionBar.jsx   # Floating bulk actions bar
│   │   ├── ErrorBoundary.jsx   # Per-page error recovery
│   │   ├── GlobalSearchModal.jsx # Ctrl+K: Quick + AI search tabs
│   │   ├── ExportCenterModal.jsx # CSV/JSON/HTML export center
│   │   ├── PageSkeleton.jsx    # Suspense fallback skeleton
│   │   └── ...
│   ├── layout/             # App shell
│   │   ├── Sidebar.jsx         # Nav + Settings link (React.memo)
│   │   ├── Header.jsx          # Search, Export, Currency, Notifications
│   │   └── MainLayout.jsx      # Shell + tour auto-start
│   └── orders/             # Order-specific components
│       ├── KanbanBoard.jsx     # dnd-kit drag-and-drop board
│       ├── OrderDrawer.jsx     # Offcanvas detail + timeline
│       └── InvoiceModal.jsx    # Print-ready invoice with GST
├── context/                # React Context providers
│   ├── AuthContext.jsx         # currentUser, isAdmin, login/logout
│   ├── ThemeContext.jsx        # light/dark, CSS var injection
│   ├── AppContext.jsx          # products/orders/users + CRUD
│   ├── AuditLogContext.jsx     # CREATE/UPDATE/DELETE event log
│   ├── CurrencyContext.jsx     # USD/EUR/INR/GBP + fmt()
│   └── ToastContext.jsx        # Success/error toasts
├── hooks/                  # Custom React hooks
│   ├── useKeyboardShortcuts.js # Ctrl+K/N/D, Esc, ?
│   ├── useFilterPresets.js     # Saved filter configurations
│   ├── useSettings.js          # App preferences (localStorage)
│   └── useTour.js              # driver.js onboarding tour
├── pages/                  # Route-level pages (lazy loaded)
│   ├── Dashboard/          # Grid layout, charts, forecast widget
│   ├── Products/           # DevExtreme grid + CRUD
│   ├── Orders/             # List + Kanban + Invoice + Drawer
│   ├── Users/              # Admin-only user management
│   ├── AIInsights/         # AI tabs: Insights/Anomaly/Restock/Log
│   ├── Login/              # Auth page
│   └── Settings/           # Preferences + data management
├── routes/
│   ├── AppRoutes.jsx           # Lazy routes + ErrorBoundary + Suspense
│   ├── ProtectedRoute.jsx      # Redirects unauthenticated
│   └── AdminRoute.jsx          # Redirects non-admin
├── styles/
│   └── global.css          # CSS variables, component styles, dark mode
└── utils/
    ├── aiInsights.js           # Rule-based engine + mock AI responses
    ├── aiPromptBuilder.js      # Formats ERP data into Gemini prompts
    ├── anomalyDetector.js      # 4 business anomaly checks
    ├── exportCsv.js            # CSV download utility
    ├── forecast.js             # Linear regression + forecast data
    └── revenueUtils.js         # computeRevenue, sparklines, pctChange
```

---

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd smarterp-lite

# 2. Install dependencies
npm install

# 3. Configure environment (optional — app works with zero config)
cp .env.example .env
# Edit .env and add VITE_GEMINI_API_KEY for real AI features

# 4. Start development server
npm run dev
# → http://localhost:5173

# 5. Build for production
npm run build
```

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@smarterp.com | admin123 | Full CRUD, AI, Settings, Tour |
| **Viewer** | viewer@smarterp.com | viewer123 | Read-only across all pages |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open Global Search |
| `Ctrl + N` | Add new item (Products/Users pages) |
| `Ctrl + D` | Toggle dark mode |
| `?` | Show keyboard shortcuts |
| `Esc` | Close modals / drawers |

---

## AI Integration

Three tiers — the app detects which to use automatically:

1. **Gemini Direct** — Set `VITE_GEMINI_API_KEY` in `.env`. Real AI for all features. Free tier at aistudio.google.com.
2. **Backend Proxy** — Set `VITE_AI_PROVIDER` + `VITE_AI_API_URL`. Your serverless function holds the key.
3. **Mock AI** *(default)* — Rule-based, zero config, offline-capable. All features work without any key.

The active mode is shown in the AI Insights page header.

---

## Screenshots

> Add screenshots here after running the app.
> Suggested captures: Dashboard, AI Insights, Kanban Board, Invoice Modal, Settings page.

---

> Built as a showcase of production-grade React patterns. DevExtreme DataGrid shows a trial banner in non-commercial builds.
