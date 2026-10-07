# SentinelVision AI — Workplace Safety & Behaviour Intelligence Dashboard (MVP)

> **HACKNEX 2026** | **Problem Statement**: HNX26PSI07 (Autonomous Vision & Behaviour Understanding)  
> **Scenario**: Workplace Safety (Factory / Industrial Control-Room)

---

## 🚀 One-Line USP
> *"SentinelVision AI doesn't just detect workers — it understands their behaviour over time and explains why it may be unsafe."*

---

## 🛠 Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Dark theme industrial control-room design system)
- **UI Components**: Shadcn-style Card, Badge, Button, Tabs, Table, Dialog, Input, Select, Slider, Switch, Toast primitives
- **Icons**: `lucide-react` (**Zero emojis in UI**)
- **Routing**: `react-router-dom` v7
- **Charts**: `recharts` for dynamic risk escalation curves

---

## 💻 How to Run Locally

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔌 Connecting to the FastAPI Backend

All data flowing through the UI is decoupled via a single abstraction layer located at [`src/services/api.ts`](file:///d:/JISHNU%20KITS%20SEM%203/HACKNEX%202026/PS106%20-%20Generative%20Computer%20Vision%20&%20Scene%20Reconstruction/src/services/api.ts).

### 1. Set API Environment Variable
Create a `.env` file in the root directory:
```env
VITE_API_BASE=http://localhost:8000/api
```

### 2. Swap Mock Functions in `src/services/api.ts`
Each function in `src/services/api.ts` is promise-based. To connect real FastAPI endpoints:
- **`uploadVideo(file)`** &rarr; `POST /api/video/upload`
- **`getConfig()`** / **`saveConfig(config)`** &rarr; `GET|POST /api/config`
- **`getWorkers()`** &rarr; `GET /api/workers`
- **`getTracks(videoId)`** &rarr; `GET /api/tracks/{videoId}`
- **`getEvents(filters)`** &rarr; `GET /api/events`
- **`getEvent(id)`** &rarr; `GET /api/events/{id}`
- **`updateEventStatus(id, status)`** &rarr; `PATCH /api/events/{id}`
- **`getTimeline(workerId)`** &rarr; `GET /api/timeline/{workerId}`
- **`subscribeLive(callback)`** &rarr; Replace `setInterval` with WebSocket / Server-Sent Events (SSE) `new WebSocket('ws://localhost:8000/api/live')`.

---

## 📁 Key Folder Structure
```
src/
├── components/
│   ├── configure/       # Zone drawing canvas, rules & thresholds
│   ├── incidents/       # Reusable IncidentCard with explainable risk breakdown
│   ├── investigate/     # Search filter bar & sortable event table
│   ├── layout/          # Collapsible Sidebar & Header with status pill & clock
│   ├── monitor/         # Video panel canvas overlay, safety roster, timeline
│   └── ui/              # Shadcn UI primitives (Badge, Card, Dialog, Toast, etc.)
├── hooks/
│   ├── useLiveEvents.ts # Real-time event stream subscription & toast alerts
│   └── useVideoSync.ts  # Synchronizes HTML5 video playback with canvas tracking
├── lib/
│   ├── format.ts        # Time & duration formatters
│   └── severity.ts      # Score-to-severity color & style mappers
├── mocks/               # Demo scenario dataset (Workers #01, #02 & Worker #17)
├── pages/
│   ├── ConfigurePage.tsx
│   ├── IncidentDetailPage.tsx
│   ├── InvestigatePage.tsx
│   └── MonitorPage.tsx
├── services/
│   └── api.ts           # Clean API layer (Mock now, FastAPI backend later)
├── types.ts             # TypeScript models matching backend SQLite schema
├── App.tsx              # Router setup
├── main.tsx
└── index.css            # Custom fonts & scrollbars
```

---

## 🏆 Demo Scenario Workflow
1. Navigate to **Configure (`/configure`)** to set safety zones, helmet/vest enforcement rules, and alert thresholds. Click **Start AI Analysis**.
2. Arrive at **Monitor (`/monitor`)**:
   - Play video to view animated worker bounding boxes, IDs, trajectory trails, and semi-transparent safety zones on canvas.
   - Click on Worker #17 (or any row in the roster) to slide over the **Worker Drawer** showing movement stats, mini SVG trajectory, and PPE breakdown.
   - Observe live incident cards firing as Worker #17 enters the Welding Area without a helmet and loiters >60s (escalating risk score 30 &rarr; 50 &rarr; 75 &rarr; 91 CRITICAL).
3. Navigate to **Investigate (`/investigate`)**:
   - Filter and search incidents by Worker ID, Event Type, Zone, or Severity.
   - Click any incident row to inspect the **WHO / WHAT / WHERE / WHEN / WHY** 5-cell grid, captured evidence frame, and Recharts risk escalation curve.
   - Click **Export JSON** for client-side audit download.
