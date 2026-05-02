# SmartERP Lite

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat&logo=bootstrap)
![DevExtreme](https://img.shields.io/badge/DevExtreme-23-FF7200?style=flat)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

> A production-grade AI-powered Enterprise Resource Planning dashboard built with React 18, Vite, and Google Gemini AI. Designed as a showcase of modern frontend architecture patterns.

---

## Features

### Dashboard
- KPI cards with 7-day sparklines and trend percentages
- Revenue trend chart with date-range drill-down (click a point → filters orders by month)
- Order status donut chart (click a slice → filters orders by status)
- Top 5 products by revenue (horizontal bar chart)
- AI summary widget with restock alerts
- Recent Activity feed pulled from the audit log

### Products
- DevExtreme DataGrid with inline editing, column chooser, and column fixing
- Full CRUD: Add / Edit / Delete (Admin only)
- Category filter pills with live counts
- Needs Restock filter (stock ≤ per-product minStock threshold)
- Bulk actions: bulk category change, bulk export, bulk delete (Admin only)
- Per-product restock threshold (minStock field)
- Keyboard shortcut: `Ctrl+N` to add a product

### Orders
- List view (DevExtreme DataGrid) and Kanban view (@dnd-kit drag-and-drop)
- View toggle persisted to localStorage
- Order detail drawer (Offcanvas) with visual status timeline
- Print-ready Invoice modal with GST breakdown and PDF download
- Bulk status changes and bulk CSV export
- Order status filter pills (All / Pending / Processing / Completed / Cancelled)
- Month drill-down from the Dashboard revenue chart

### Users *(Admin only)*
- Full CRUD with email validation
- Role management (Admin / Viewer) and status toggling

### AI Insights
- **AI Insights tab** — Gemini executive summary, prioritized recommendations (Critical / High / Medium / Low), revenue-by-category chart, key business metrics, and admin action plan
- **Restock Planner tab** *(Admin only)* — sales velocity, days-to-stockout table, and AI-generated purchase order draft
- **Activity Log tab** *(Admin only)* — entity-filtered audit timeline (Products / Orders / Users) with relative timestamps and a clear-log action

### AI & Smart Features
- **AI-Powered Global Search** (`Ctrl+K`) — Quick Search and AI Search tabs
- **Multi-Currency Display** — USD / EUR / INR / GBP with live conversion
- **Smart Export Center** — CSV, JSON, and HTML report formats with column chooser
- **Floating AI Chat Widget** — ask natural-language questions about your ERP data
- Google Gemini integration with three tiers: Direct / Backend Proxy / Mock

### UX & Infrastructure
- **Onboarding Tour** — 11-step driver.js walkthrough on first login
- **Settings Page** *(Admin only)* — app name, currency, date format, notification toggles, data management
- **Error Boundaries** — per-page error recovery with stack trace in dev mode
- **PWA Support** — Web App Manifest, service worker (cache v2), offline fallback page
- **Code Splitting** — `React.lazy` + `Suspense` per page with skeleton fallback
- **Performance** — `React.memo` on SummaryCard and Sidebar, virtual scrolling in grids
- Smart Notifications bell with dismissible alerts (low stock, out of stock, pending orders)
- Keyboard shortcut help modal (`?` key)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    React 18 SPA                      │
│                                                      │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ AuthCtx  │  │           AppContext              │  │
│  │ login /  │  │  products / orders / users + CRUD │  │
│  │ logout   │  └──────────────────────────────────┘  │
│  └──────────┘  ┌────────────┐  ┌──────────────────┐  │
│                │ AuditLog   │  │  ToastContext     │  │
│                │ Context    │  │  success / error  │  │
│                └────────────┘  └──────────────────┘  │
│                ┌────────────┐  ┌──────────────────┐  │
│                │ Currency   │  │  useSettings     │  │
│                │ Context    │  │  (localStorage)  │  │
│                └────────────┘  └──────────────────┘  │
│                                                      │
│  Pages (lazy-loaded, each wrapped in ErrorBoundary)  │
│  Dashboard │ Products │ Orders │ Users │ AIInsights   │
│  Settings  │ Login                                   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │                  API Layer                    │   │
│  │  productApi  orderApi  userApi  authApi       │   │
│  │  aiApi  (Gemini Direct / Proxy / Mock)        │   │
│  └───────────────────────────────────────────────┘   │
│               │                    │                 │
│      DummyJSON REST API    Google Gemini AI           │
└──────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | Concurrent rendering, hooks, Suspense |
| Vite | 5.1 | Sub-second HMR, native ESM, fast builds |
| Bootstrap | 5.3 | Utility-first responsive layout |
| React Bootstrap | 2.10 | Bootstrap components as React |
| DevExtreme | 23.2 | Enterprise DataGrid (virtual scroll, inline edit, export) |
| Recharts | 2.12 | Declarative React charts |
| @dnd-kit/core | 6.3 | Accessible Kanban drag-and-drop |
| @dnd-kit/sortable | 10.0 | Sortable list primitives for dnd-kit |
| driver.js | 1.4 | Zero-dependency onboarding tour |
| react-router-dom | 6.22 | Client-side routing |
| Google Gemini AI | gemini-2.0-flash | AI insights, search, and chat |

---

## Folder Structure

```
src/
├── api/                        # Service layer
│   ├── authApi.js              # loginUser, logoutUser, getCurrentUser
│   ├── aiApi.js                # 3-tier AI: Gemini direct / proxy / mock
│   ├── productApi.js           # CRUD + DummyJSON integration
│   ├── orderApi.js             # Orders with in-memory status updates
│   ├── userApi.js              # CRUD users
│   └── mockApi.js              # delay() utility for simulated async
├── components/
│   ├── common/                 # Reusable UI atoms
│   │   ├── AIAssistantWidget.jsx   # Floating AI chat bubble
│   │   ├── Breadcrumb.jsx          # Page breadcrumb trail
│   │   ├── BulkActionBar.jsx       # Floating bulk-action toolbar
│   │   ├── ConfirmDialog.jsx       # Destructive action modal
│   │   ├── ErrorBoundary.jsx       # Per-page error recovery
│   │   ├── ErrorMessage.jsx        # Inline error with retry
│   │   ├── ExportCenterModal.jsx   # CSV / JSON / HTML export center
│   │   ├── GlobalSearchModal.jsx   # Ctrl+K: Quick + AI search tabs
│   │   ├── KeyboardShortcutsModal.jsx  # ? key help overlay
│   │   ├── Loader.jsx              # Spinner component
│   │   ├── ModalForm.jsx           # Generic add/edit modal
│   │   ├── PageHeader.jsx          # Title + subtitle + actions row
│   │   ├── PageSkeleton.jsx        # Suspense fallback skeleton
│   │   ├── SkeletonTable.jsx       # Table loading skeleton
│   │   ├── StatusBadge.jsx         # Colored status pill
│   │   └── SummaryCard.jsx         # KPI card with sparkline (React.memo)
│   ├── layout/                 # App shell
│   │   ├── Header.jsx              # Search, Export, Currency, Notifications, User menu
│   │   ├── MainLayout.jsx          # Shell + tour auto-start
│   │   └── Sidebar.jsx             # Nav links + role display (React.memo)
│   └── orders/                 # Order-specific components
│       ├── InvoiceModal.jsx        # Print-ready invoice with GST + PDF
│       ├── KanbanBoard.jsx         # dnd-kit drag-and-drop board
│       └── OrderDrawer.jsx         # Offcanvas detail + timeline
├── context/                    # React Context providers
│   ├── AppContext.jsx              # products / orders / users + CRUD
│   ├── AuditLogContext.jsx         # CREATE / UPDATE / DELETE event log
│   ├── AuthContext.jsx             # currentUser, isAdmin, login / logout
│   ├── CurrencyContext.jsx         # USD / EUR / INR / GBP + fmt()
│   └── ToastContext.jsx            # Success / error toasts
├── hooks/                      # Custom React hooks
│   ├── useFilterPresets.js         # Save and load named filter configurations
│   ├── useKeyboardShortcuts.js     # Ctrl+K / Ctrl+N / Esc / ?
│   ├── useSettings.js              # App preferences (localStorage)
│   └── useTour.js                  # driver.js 11-step onboarding tour
├── pages/                      # Route-level pages (lazy loaded)
│   ├── Dashboard/              # Charts, KPIs, activity feed
│   ├── Products/               # DevExtreme grid + CRUD + bulk actions
│   ├── Orders/                 # List + Kanban + Invoice + Drawer
│   ├── Users/                  # Admin-only user management
│   ├── AIInsights/             # AI Insights / Restock Planner / Activity Log
│   ├── Login/                  # Auth page
│   └── Settings/               # Preferences + data management
├── routes/
│   ├── AppRoutes.jsx               # Lazy routes + ErrorBoundary + Suspense
│   ├── ProtectedRoute.jsx          # Redirects unauthenticated users
│   └── AdminRoute.jsx              # Redirects non-admin users
├── styles/
│   └── global.css              # CSS variables and component styles
└── utils/
    ├── aiInsights.js           # Rule-based insights engine + mock AI responses
    ├── aiPromptBuilder.js      # Formats ERP data into Gemini prompts
    ├── exportCsv.js            # CSV download utility
    └── revenueUtils.js         # computeRevenue, sparklines, pctChange
```

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/raghulvijay/smarterp-lite.git
cd smarterp-lite

# 2. Install dependencies
npm install

# 3. Configure environment (optional — app works with zero config)
# Create a .env file and add your Gemini API key for real AI
VITE_GEMINI_API_KEY=your_key_here

# 4. Start development server
npm run dev
# → http://localhost:5173

# 5. Build for production
npm run build

# 6. Preview production build locally
npm run preview
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | No | Google Gemini API key — enables real AI features |
| `VITE_GEMINI_MODEL` | No | Override the Gemini model (default: `gemini-2.0-flash`) |
| `VITE_AI_PROVIDER` | No | Set to `backend` to route AI calls through a proxy |
| `VITE_AI_API_URL` | No | URL of your backend AI proxy endpoint |

All variables are optional. Without any config the app runs in **Mock AI** mode — rule-based, fully offline, all features work.

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@smarterp.com | admin123 | Full CRUD, AI features, Settings, Tour |
| **Viewer** | viewer@smarterp.com | viewer123 | Read-only across all pages |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open Global Search |
| `Ctrl + N` | Add new item (Products / Users pages) |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close modals and drawers |

---

## AI Integration

Three tiers — the app detects which to use automatically:

| Tier | How to activate | Description |
|---|---|---|
| **Gemini Direct** | Set `VITE_GEMINI_API_KEY` | Real AI via Google Gemini API. Free tier at aistudio.google.com |
| **Backend Proxy** | Set `VITE_AI_PROVIDER=backend` + `VITE_AI_API_URL` | Routes calls through your own serverless function |
| **Mock AI** *(default)* | No config needed | Rule-based engine, fully offline, all features work |

The active tier is shown in the AI Insights page header badge.

---

## Routes

| Path | Access | Page |
|---|---|---|
| `/login` | Public | Login |
| `/` | Authenticated | Dashboard |
| `/products` | Authenticated | Products |
| `/orders` | Authenticated | Orders |
| `/ai-insights` | Authenticated | AI Insights |
| `/users` | Admin only | User Management |
| `/settings` | Admin only | Settings & Preferences |

---

## Supported Currencies

| Code | Symbol | Rate (vs USD) |
|---|---|---|
| USD | $ | 1.00 |
| EUR | € | 0.92 |
| INR | ₹ | 83.50 |
| GBP | £ | 0.79 |

Currency selection is persisted to localStorage and syncs between the header selector and the Settings page.

---

---

## Changelog

### What Was Removed

These features were present in earlier versions and have been fully removed from the codebase.

| Removed Feature | What it was | Why removed |
|---|---|---|
| **Dark Mode / Theme Toggle** | `ThemeContext.jsx`, `Ctrl+D` shortcut, and all `[data-theme="dark"]` CSS overrides | Added unnecessary complexity and CSS conflicts with DevExtreme and Bootstrap |
| **Drag-to-Rearrange Dashboard** | `react-grid-layout` widget grid on the Dashboard | Replaced by a fixed, clean layout — the dependency added 300KB with no UX benefit |
| **Anomaly Detection tab** | Third AI Insights tab that flagged statistical outliers in order data | Underdeveloped and unreliable with mock data; removed to keep AI Insights focused |
| **Revenue Forecasting** | Linear regression projection chart on the AI Insights page | Forecast accuracy was misleading with in-memory demo data; removed cleanly |
| **RoleSwitcher component** | UI element to switch roles without logging out | Bypassed auth logic and was only a dev convenience; removed for production correctness |
| **`ThemeContext.jsx`** | React context that managed light/dark theme state | No longer needed after dark mode removal |
| **`anomalyDetector.js`** | Utility that computed Z-score anomalies on order values | Removed with the Anomaly Detection tab |
| **`forecast.js`** | Linear regression utility for revenue projections | Removed with the Revenue Forecasting feature |

---

### What Was Added or Fixed

| Change | Description |
|---|---|
| **Products page crash fix** | Resolved a JavaScript temporal dead zone error — `categoryOptions` was referenced before its `useMemo` declaration, crashing the Products page on every load |
| **`.icon-btn` CSS class** | Replaced the removed `.theme-toggle` class (which was reused as a generic icon button style) with a properly named `.icon-btn` class used by the Currency, Notifications, Search, and Export header buttons |
| **Service worker cache v2** | Bumped the PWA cache name from `smarterp-v1` to `smarterp-v2` — fixes stale browser caching where old browsers served outdated JS/CSS after deployments |
| **Multi-Currency Display** | Added USD / EUR / INR / GBP switching in the header and Settings page, with live conversion across all price displays |
| **Smart Export Center** | Added CSV, JSON, and HTML report export with a column chooser modal |
| **Floating AI Chat Widget** | Added a persistent chat bubble for natural-language questions about ERP data |
| **Per-product restock threshold** | Added `minStock` field per product; Needs Restock filter and notifications use this instead of a hardcoded value |
| **Filter presets** | Save and reload named filter configurations on Products and Orders pages |
| **Custom category support** | Category field on the Add/Edit Product modal is a free-text combobox — type a new category or pick an existing one |
| **Onboarding tour** | 11-step driver.js walkthrough auto-starts on first login and can be relaunched from the user menu |
| **Audit log** | All CREATE / UPDATE / DELETE actions are logged with user, timestamp, and entity details; visible on the AI Insights → Activity Log tab |

---

> Built as a showcase of production-grade React patterns. DevExtreme DataGrid shows a trial banner in non-commercial builds.
