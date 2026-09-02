<div align="center">

# 🧬 Clinical Trials Monitoring Dashboard

### **Smart India Hackathon 2026 · Problem Statement `SIH26046`**

</div>

---

## 📊 SIH Internal Round — Presentation Deck

> ### 👉 [**OPEN THE SIH INTERNAL ROUND PPT**](https://drive.google.com/file/d/1XyLwKlzioyIsF_yKRbMuqVnZFpFYsDdK/view?usp=drivesdk) 👈
>
> **This Google Drive link contains the SIH Internal Round PPT** for this project — the full
> problem framing, solution architecture, feature walkthrough, and demo screenshots we
> presented to the internal evaluation panel.
>
> `https://drive.google.com/file/d/1XyLwKlzioyIsF_yKRbMuqVnZFpFYsDdK/view?usp=drivesdk`

---

<div align="center">

**Enrollment · Adverse Events · Milestones — one screen, every number traceable to its source row.**

[![Node](https://img.shields.io/badge/node-%E2%89%A520.19-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

## 🎯 The Problem

Clinical trial monitors juggle five disconnected data streams — trials, sites, subjects,
adverse events, milestones — across spreadsheets and vendor portals. By the time a safety
signal or an enrollment shortfall surfaces in a weekly status report, it is already weeks old.

`SIH26046` asks for a dashboard that tracks **enrollment numbers, adverse events, and upcoming
milestones** per trial. We built that, and then answered the question a judge always asks next:

> **"Where does that number come from?"**

Every flag on this dashboard carries a human-readable reason string, the exact threshold it
crossed, and a click-through to the source row that produced it.

---

## ✨ What Makes This Different

| | |
|---|---|
| 🔍 **Total traceability** | Every flag ships with `reason` + `evidence` + `sourceId`. Click a flag → land on the exact adverse event, site, or milestone row that triggered it. No black boxes. |
| 🧮 **Deterministic by design** | Pinned `as_of_date`, zero randomness, zero wall-clock reads. Same input → same output, every single run. Demo-safe and audit-safe. |
| 🧠 **Invisible AI layer** | Gemini 2.5 Flash enriches recommendations with clinical reasoning — but the deterministic rule engine always produces a complete answer first. AI is an *upgrade*, never a dependency. |
| 🛡️ **Never blank** | Three-tier graceful degradation: Supabase → in-memory fixtures → client-side synthetic dataset. Pull the network cable mid-demo; the dashboard keeps rendering. |
| ⚡ **6000× faster repeats** | TTL response cache in front of Supabase turns a 6 s cold portfolio fetch into a 1 ms warm one. |
| 🎬 **Cinematic landing page** | A separate video-driven landing experience (`landing.html`) that tells the product story before the user ever sees a table. |

---

## 🏗️ Architecture

```
        ┌──────────────────────────────────────────────────────────────┐
        │  Supabase Postgres  ──Prisma──►  Data Access Layer           │
        └──────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  MONITORING ENGINE  (pure, deterministic, no I/O)            │
        │  • 6 flag rules   • health score 0–100   • milestone states  │
        └──────────────────────────────────────────────────────────────┘
                                    │
                  structured flags + evidence
                                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  AI LAYER (Gemini)  ──►  enriched recommendation             │
        │  falls back to deterministic recommendation on any failure   │
        └──────────────────────────────────────────────────────────────┘
                                    │
                     zod-validated response contract
                                    ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  FRONTEND  (/api/* through the Vite dev proxy)               │
        └──────────────────────────────────────────────────────────────┘
```

The monitoring engine never calls the network. The AI layer never invents an event. The
response contract is validated by the same zod schemas the frontend imports — so a shape
mismatch is a build error, not a runtime surprise.

---

## 🚨 The Flag Rules

Six deterministic rules run on every trial. Each threshold lives in a single `app_config` row,
so an evaluator can change one number and watch the whole portfolio re-rank.

| Flag | Fires when | Severity | Score |
|---|---|:---:|:---:|
| `SERIOUS_UNRESOLVED` | A serious AE stays unresolved past the review window | HIGH | −25 |
| `AE_RATE_ALERT` | AE rate per 100 patient-months exceeds the alert threshold | HIGH | −20 |
| `ENROLLMENT_STALLED` ¹ | No new enrollment across the stall window | HIGH | −20 |
| `BEHIND_PLAN` | Enrolled fraction trails elapsed fraction by more than the shortfall threshold | MEDIUM | −15 |
| `OVERDUE_MILESTONE` | A milestone's planned date has passed with no actual date | MEDIUM | −15 |
| `NON_ENROLLING_SITE` | A site is past its grace period with zero enrollments | MEDIUM | −10 |

¹ Defined in the shared contract and wired into scoring and recommendations; the emitting rule is not yet active in the engine.

**Health score** starts at 100, subtracts the penalties above, and takes a further −10 if
enrollment is under 50 %.

| Score | Status |
|:---:|---|
| **≥ 75** | 🟢 `HEALTHY` |
| **50 – 74** | 🟡 `WATCH` |
| **< 50** | 🔴 `CRITICAL` |

### Default thresholds

| Setting | Default |
|---|---:|
| `as_of_date` | `2026-09-01` |
| Milestone horizon | 30 days |
| Enrollment shortfall | 0.15 |
| Min exposure | 24 patient-months |
| AE rate alert | 15 per 100 patient-months |
| Serious event review window | 7 days |
| Non-enrolling site grace | 45 days |

---

## 🔌 API Surface

| Method | Endpoint | Returns |
|---|---|---|
| `GET` | `/api/health` | Liveness, DB connection state, AI provider status |
| `GET` | `/api/config` | Pinned `as_of_date` and every live threshold |
| `GET` | `/api/trials` | Risk-sorted trial cards with funnel, AE summary, flags, health score |
| `GET` | `/api/trials/:id` | Full drill-down: sites, subjects, adverse events, milestone timeline |
| `GET` | `/api/trials/:id/recommendation` | Prioritised next action with full traceability payload |
| `GET` | `/api/portfolio/summary` | Portfolio-wide roll-up across all trials |
| `GET` | `/api/search?q=` | Cross-entity search over trials, sites, and adverse events |
| `GET` | `/api/export/flagged` | Every flagged row, flattened for CSV export |
| `POST` | `/api/insights/refresh` | Regenerate the cached Gemini insight layer |

Full request/response documentation with example payloads lives in
[`BACKEND_API_INTEGRATION_GUIDE.md`](./BACKEND_API_INTEGRATION_GUIDE.md).

---

## 🧠 The AI Layer

Gemini is deliberately **invisible**. It never adds an event, never moves a number, and never
blocks a render.

1. The monitoring engine produces structured flags with evidence.
2. A backend prompt asks Gemini for a per-AE staff recommendation and a per-trial
   *"what to do about this trial"* summary.
3. Output is cached in Postgres (`ai_recommendation`, `ai_generated_at`, `trial_insights`).
4. **No API key? Rate limited? Malformed JSON?** The deterministic recommendation built from
   the flags is returned instead, with `aiEnhanced: false` set honestly on the response.

Set `AI_PROVIDER=mock` to run the entire stack with zero external calls.

---

## 🗄️ Data Model

Seven Prisma models, camelCase in code and snake_case in Postgres:

```
Trial ──┬── Site ──────┬── Subject
        │              └── AdverseEvent
        ├── Milestone
        └── TrialInsight        AppConfig (singleton)
```

The adverse-event table is backed by **500 real-shaped synthetic safety cases**
(`gemini_clinical_safety_cases_500_qualitative.csv`) carrying severity, hospitalisation,
outcome, suspected relationship, and pre-enriched qualitative columns — which double as the
deterministic AI fallback.

> ⚠️ **All data in this project is synthetic.** No real patient, sponsor, or site data is
> present anywhere in this repository. Every threshold is a demo constant.

---

## 🚀 Quick Start

```bash
# 1. Requirements: Node ≥ 20.19
node -v

# 2. Install
npm install

# 3. Configure (every value has a safe default — an empty .env still boots)
cp .env.example .env

# 4. Run the dashboard
npm run dev            # → http://localhost:5173
```

That's it. With no database and no API key, the app boots on fixture data and renders every
view.

### Full stack, with the API

```bash
npm run dev:monorepo   # Express API on :4000 + web on :5173, colour-tagged output
```

The Vite dev server transparently proxies `/api/*` to the Express backend, so there is no CORS
dance in development.

### With Supabase

```bash
# Set DATABASE_URL (pooled) and DIRECT_URL (direct) in .env, then:
npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npx prisma db seed -w @ctd/api
```

### With Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Leave the key blank and the provider silently falls back to `mock`.

---

## 📜 Scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server — dashboard + landing page |
| `npm run dev:monorepo` | API and web together |
| `npm run dev:api` | Express API only, with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Strict TypeScript across every workspace |
| `npm run lint` | ESLint 9 flat config |
| `npm test` | Vitest |
| `npm run db:generate` | Prisma client generation |
| `npm run db:migrate` | Prisma migrations |

---

## 📁 Project Structure

```
Clinical-Trial-Dashboard/
├── index.html                    # Dashboard shell (Tailwind design tokens inline)
├── landing.html                  # Video-driven landing experience
├── src/                          # Dashboard frontend
│   ├── main.js                   # Bootstrap, routing, loading & error states
│   ├── state/dashboardState.js   # Single source of truth · API → state → components
│   ├── services/api.js           # Typed API client with fallback handling
│   ├── components/
│   │   ├── sidebar · header · metricsStrip · trialTable · inspectionPanel
│   │   ├── views/                # trials · analytics · documents · settings · support
│   │   └── modals/               # enrollment · AE report · milestone · filters · more
│   ├── landing/                  # Landing page module + video asset registry
│   └── data/trialsData.js        # Offline synthetic dataset
├── apps/
│   ├── api/                      # Express + Prisma + Gemini
│   │   ├── src/app.ts            # Monitoring engine, flag rules, routes
│   │   ├── src/modules/ai/       # Provider abstraction (gemini | mock)
│   │   └── prisma/               # Schema + deterministic seed
│   └── web/                      # React 19 + shadcn/ui + Recharts workspace
├── packages/shared/              # zod schemas + enums shared api ↔ web
├── LandingPage/                  # Landing page video assets
└── docs/                         # PRD, plan, ADRs, agent docs
```

---

## 🧰 Tech Stack

| Layer | Choice |
|---|---|
| **Repo** | npm workspaces monorepo |
| **Dashboard** | Vanilla ES modules · Tailwind (Material 3 token set) · Inter · Material Symbols |
| **React workspace** | Vite 6 · React 19 · TypeScript strict · shadcn/ui · Recharts · TanStack Query & Table · React Router 7 |
| **API** | Express 4 · TypeScript · zod · Prisma 6 · helmet · morgan |
| **Database** | Supabase Postgres — pooled `DATABASE_URL` + direct `DIRECT_URL` |
| **AI** | Google Gemini 2.5 Flash behind a swappable provider interface |
| **Shared** | zod schemas + domain enums, single source of truth for api, web, and Prisma |

---

## 🎥 Landing Page

`landing.html` is a standalone, video-led narrative built from five looping clips —
hero, unified monitoring, attention routing, traceability, and recommendations. Assets are
registered centrally in `src/landing/videoAssets.js`, so swapping a clip never touches layout
code, and Vite is configured to keep large media out of the HMR watch tree.

---

## 👥 Team

Built for **Smart India Hackathon 2026**, problem statement **SIH26046**.

📊 **[SIH Internal Round PPT →](https://drive.google.com/file/d/1XyLwKlzioyIsF_yKRbMuqVnZFpFYsDdK/view?usp=drivesdk)**

---

<div align="center">

**All data is synthetic. All thresholds are demo constants. Every number is traceable.**

</div>
