# Clinical Trials Dashboard (SIH26046) — Final Plan

## Context

**Problem statement (SIH26046):** Take mock trial-phase data and build a dashboard tracking
**enrollment numbers, adverse events, and upcoming milestones** for each trial. 3-hour MVP that
proves the concept end to end and stays defensible when a judge asks "where does that number
come from?"

**Repo today:** the folder holds **GVHAX 2026**, a generic hackathon starter (npm-workspaces
monorepo: Vite + React web, Express + Mongoose api, empty Python ML sidecar, generic `Item`
entity, grievance seed data). Not git-initialized. No clinical content, no voice code.

**Authoritative spec:** `C:\Users\jayes\Downloads\Clinical-Trials-Dashboard-PRD.docx` is the
base spec. It defines five normalized data streams joined on `trial_id`/`site_id`, strict
determinism (pinned `as_of_date`, no randomness, no wall-clock), named flag rules with
human-readable reason strings, and a portfolio → trial-card → drill-down-to-source-row flow.

**Deliberate deviations from the PRD (approved):**
1. Add `health_score` (0–100) + `health_status` (Healthy ≥70 / Watch 40–69 / Critical <40) as a
   **headline** on each trial card; the PRD's flag rules remain the "why" underneath. Score is a
   deterministic formula (enrollment pace + AE rate + severe/critical mix + milestone slippage).
2. **Invisible AI layer (Google Gemini):** a custom backend prompt produces (a) a per-adverse-
   event **staff recommendation + risk read**, and (b) a per-trial **"what to do about this
   trial"** summary. Results cached in Postgres. The CSV's existing `staff_recommendation` /
   `risk_level` / `risk_factors` columns are the **deterministic fallback** when there is no API
   key or the call fails — so the dashboard always renders.
3. **No interactive patient simulation.** Data is pinned; AI adds interpretation, never new
   synthetic events. (Earlier "advance the trial forward" idea is dropped — it breaks PRD
   determinism.)

**Voice agent:** dropped entirely. **Supabase Auth doctor login:** a later phase, not this build.

### What we're making, in one paragraph

A monitor-facing single-screen dashboard for ~10 synthetic clinical trials. The portfolio view
is a risk-sorted grid of trial cards — each shows phase/status badges, an enrollment progress
bar (active vs target), an adverse-event summary split by severity, the next milestone with a
countdown, a `health_score` headline, and flag chips (behind-plan, AE-rate-alert,
serious-unresolved, non-enrolling-site) each carrying a reason string. Clicking a flag opens the
trial drill-down scrolled and highlighted to the exact source row. The drill-down has a site
enrollment table, an adverse-events table (unresolved rows highlighted) with the **Gemini staff
recommendation** shown inline per serious case, and a planned-vs-actual milestone timeline. A
persistent banner states all data is synthetic and all thresholds are demo constants. Every
number recomputes from one filtered frame (phase / trial / region filters) in under a second
against a pinned `as_of_date`.

## Final tech stack

| Layer | Choice |
|---|---|
| Repo | Keep the npm-workspaces monorepo: `apps/web` + `apps/api` + `packages/shared` |
| Web | Vite 6 · React 19 · TypeScript (strict) · Tailwind v4 + existing tokens · shadcn/ui · Recharts (scaffold's `KpiCard`/`BarChartCard`/`AreaChartCard`/`GanttTimeline`/`Heatmap`) · `@tanstack/react-query` · `@tanstack/react-table` · `react-router-dom` v7 · `date-fns` · `lucide-react` · `sonner` |
| API | Express 4 · TypeScript · zod · **Prisma Client** · `@google/generative-ai` |
| Shared | zod schemas + enums shared api↔web |
| DB | **Supabase (hosted Postgres)** via Prisma (`DATABASE_URL` pooled + `DIRECT_URL` direct) |
| AI | **Google Gemini** `gemini-2.0-flash` via the scaffold's `modules/ai` provider abstraction; on-demand + DB cache; CSV columns as deterministic fallback |
| Auth | None now (Supabase Auth later) |
| Deploy | Localhost-first |

**Are we using anything from the Python stack for the voice agent?** No. There is no voice
agent. Nothing from the Python stack is used anywhere — `apps/ml/` is deleted.

## Source data

Physically in hand: `gemini_clinical_safety_cases_500_qualitative.csv` — 500 adverse-event
cases across 397 `trial_id`s (~1 per trial), already enriched by Gemini with `risk_level`,
`review_priority`, `risk_factors`, `staff_recommendation`, `case_summary`, `event_narrative`.
Columns: `case_id, trial_id, drug_name, drug_class, patient_age, patient_sex, dose_mg,
condition, symptom_1..3, symptom_duration_days, symptom_onset_hours, previous_conditions,
concomitant_medications, severity(Mild/Moderate/Severe/Critical), vital_sign_flag,
hospitalization, outcome, suspected_relationship, risk_level, review_priority, risk_factors,
staff_recommendation, case_summary, event_narrative`.

We do **not** have trials / sites / enrollment / milestones data — the seed generator creates it
(below) and **remaps the 500 AE cases** onto the generated trial set so each trial has a
realistic event cluster.

## Domain model — `apps/api/prisma/schema.prisma`

Prisma models are camelCase with `@map`/`@@map` to snake_case columns/tables. Enums live in
`packages/shared/src/constants.ts` and are mirrored as Prisma enums.

```prisma
model Trial {
  id                String   @id                       // "CT-00325"
  title             String
  sponsor           String
  phase             Phase                                // PHASE_1..PHASE_4
  status            TrialStatus                          // RECRUITING | ACTIVE | PAUSED | COMPLETED
  conditionArea     String   @map("condition_area")
  interventionType  String   @map("intervention_type")   // Drug | Vaccine | Device | Biologic
  targetEnrollment  Int      @map("target_enrollment")
  plannedStart      DateTime @map("planned_start")
  plannedEnd        DateTime @map("planned_end")
  sites             Site[]
  subjects          Subject[]
  adverseEvents     AdverseEvent[]
  milestones        Milestone[]
  insight           TrialInsight?
  @@map("trials")
}

model Site {
  id               String  @id                           // "S-00325-01"
  trialId          String  @map("trial_id")
  trial            Trial   @relation(fields: [trialId], references: [id], onDelete: Cascade)
  siteName         String  @map("site_name")
  region           String
  targetEnrollment Int     @map("target_enrollment")
  activationDate   DateTime @map("activation_date")
  subjects         Subject[]
  adverseEvents    AdverseEvent[]
  @@map("sites")
}

model Subject {
  id            String    @id                             // "SUBJ-00325-0007"
  trialId       String    @map("trial_id")
  siteId        String    @map("site_id")
  trial         Trial     @relation(fields: [trialId], references: [id], onDelete: Cascade)
  site          Site      @relation(fields: [siteId], references: [id], onDelete: Cascade)
  screenedDate  DateTime  @map("screened_date")
  enrolledDate  DateTime? @map("enrolled_date")           // null = screen fail / still screening
  withdrawnDate DateTime? @map("withdrawn_date")
  screenFailReason String? @map("screen_fail_reason")
  @@map("subjects")
}

model AdverseEvent {
  id             String   @id                             // case_id "AE-007865"
  trialId        String   @map("trial_id")
  siteId         String   @map("site_id")
  trial          Trial    @relation(fields: [trialId], references: [id], onDelete: Cascade)
  site           Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
  subjectRef     String   @map("subject_ref")
  onsetDate      DateTime @map("onset_date")
  resolvedDate   DateTime? @map("resolved_date")          // null = unresolved -> escalation logic
  term           String                                    // symptom_1 (+ symptom_2/3 in json)
  symptoms       Json                                      // [symptom_1, symptom_2, symptom_3]
  severityGrade  AeSeverity @map("severity_grade")         // MILD | MODERATE | SEVERE | CRITICAL
  seriousFlag    Boolean   @map("serious_flag")            // derived: hospitalization=Yes OR severity in (SEVERE,CRITICAL)
  outcome        String
  drugName       String   @map("drug_name")
  drugClass      String   @map("drug_class")
  patientAge     Int      @map("patient_age")
  patientSex     String   @map("patient_sex")
  suspectedRelationship String @map("suspected_relationship")
  // Gemini-enriched (from CSV; also the AI fallback source):
  riskLevelSeed        String  @map("risk_level_seed")
  reviewPrioritySeed   String  @map("review_priority_seed")
  riskFactorsSeed      String  @map("risk_factors_seed")
  staffRecommendationSeed String @map("staff_recommendation_seed")
  caseSummary          String  @map("case_summary")
  eventNarrative       String  @map("event_narrative")
  aiRecommendation     String? @map("ai_recommendation")   // live Gemini output, cached
  aiGeneratedAt        DateTime? @map("ai_generated_at")
  @@map("adverse_events")
}

model Milestone {
  id          String    @id                               // "M-00325-03"
  trialId     String    @map("trial_id")
  trial       Trial     @relation(fields: [trialId], references: [id], onDelete: Cascade)
  type        String                                       // "FPFV" | "LPLV" | "DB Lock" | "Interim Analysis" | "DSMB Review"
  plannedDate DateTime  @map("planned_date")
  actualDate  DateTime? @map("actual_date")                // null -> future / due-soon / overdue
  @@map("milestones")
}

model TrialInsight {                                        // AI + computed cache, 1:1 with Trial
  trialId        String   @id @map("trial_id")
  trial          Trial    @relation(fields: [trialId], references: [id], onDelete: Cascade)
  healthScore    Int      @map("health_score")
  healthStatus   String   @map("health_status")            // Healthy | Watch | Critical
  scoreBreakdown Json     @map("score_breakdown")           // {enrollment, aeRate, severeMix, milestone}
  aiSummary      String?  @map("ai_summary")                // Gemini "what to do about this trial"
  source         String                                    // "gemini" | "fallback"
  generatedAt    DateTime @default(now()) @map("generated_at")
  @@map("trial_insights")
}

model AppConfig {                                           // single-row editable demo constants (PRD §5)
  id                          String @id @default("singleton")
  asOfDate                    DateTime @map("as_of_date")
  milestoneHorizonDays        Int @map("milestone_horizon_days")            // default 30
  enrollmentShortfallThreshold Float @map("enrollment_shortfall_threshold") // default 0.15
  minExposurePatientMonths    Float @map("min_exposure_patient_months")     // default 24
  aeRateAlert                 Float @map("ae_rate_alert")                    // per 100 patient-months, default 15
  seriousEventReviewWindowDays Int @map("serious_event_review_window_days")  // default 7
  nonEnrollingSiteGraceDays   Int @map("non_enrolling_site_grace_days")      // default 45
  @@map("app_config")
}
```

## Seed generator — `apps/api/prisma/seed.ts`

Deterministic (fixed RNG seed, no `Date.now()`). Steps:

1. Parse the 500-row CSV (`csv-parse` or a tiny hand-rolled splitter).
2. Derive the trial roster: take the ~10 `trial_id`s with the most CSV rows **plus** the two
   `CT-DEMO-*` ids; for each, synthesize `Trial` fields (title from `condition` + `drug_class`,
   sponsor from a fixed list, phase/status deterministically from a hash of `trial_id`,
   `target_enrollment` 80–400, `planned_start`/`planned_end` around a pinned `as_of_date` =
   **2026-09-01**).
3. Per trial: 2–5 `Site`s (regions from a fixed list), one deterministically made non-enrolling
   to trigger FR-9.
4. Per trial: generate `Subject`s up to a deterministic fraction of `target_enrollment` (some
   trials deliberately behind pace, one ahead), spread `screened`/`enrolled`/`withdrawn` dates
   across the timeline; ~10% screen fails, ~5% withdrawals.
5. Remap AE cases: every CSV row whose `trial_id` is in the roster keeps it; the rest are
   distributed round-robin onto roster trials. Map columns → `AdverseEvent`
   (`severity`→`severityGrade`, `hospitalization`/`severity`→`seriousFlag`, synth `onsetDate`
   within the trial window, `resolvedDate` null for a deterministic subset of serious cases so
   escalation fires, attach to a random-but-seeded site + subject of that trial). Copy the
   Gemini columns into the `*_seed` fields.
6. Per trial: 3–6 `Milestone`s (mix of done-early, done-late, overdue, due-soon, future vs the
   pinned `as_of_date`).
7. Upsert one `AppConfig` row with the PRD defaults.
8. Leave `TrialInsight` empty (filled by `POST /api/insights/refresh`).

Register: `apps/api/package.json` → `"prisma": { "seed": "tsx prisma/seed.ts" }`.

## Compute layer — `apps/api/src/modules/metrics/`

Pure, deterministic functions (unit-testable, no DB, no clock — take `asOfDate` as an arg):

- `enrollmentFunnel(subjects)` → `{screened, enrolled, active, withdrawn}` per trial & site (FR-1)
- `enrollmentProgress(active, target)` → fraction (FR-2)
- `expectedFraction(plannedStart, plannedEnd, asOfDate)` → elapsed-timeline fraction
- `behindPlanFlag(...)` → `{flagged, shortfallSubjects, reason}` (FR-3, §9)
- `enrollmentStalledFlag(subjects, asOfDate, window)` → (§9)
- `exposurePatientMonths(subjects, asOfDate)` (FR-4)
- `aeAggregate(events, asOfDate)` → totals, by-grade, serious, unresolved count + max age,
  rate per 100 patient-months, `rateStable` bool (FR-5, FR-6)
- `aeRateFlag(...)`, `seriousEscalationFlag(events, asOfDate, window)` (FR-7, §9)
- `nonEnrollingSiteFlag(site, subjects, asOfDate, grace)` (FR-9)
- `milestoneStatus(milestone, asOfDate, horizon)` → `done|overdue|due_soon|future` + days (FR-8)
- `healthScore(funnel, aeAgg, flags, milestoneStates)` → `{score, status, breakdown}` (deviation #1)
- `quarantineOrphans(rows, validTrialIds, validSiteIds)` → `{clean, quarantined}` (FR-16)

## Invisible-AI layer — `apps/api/src/modules/insights/`

- `insights.service.ts`
  - `buildCaseFacts(ae)` / `buildTrialFacts(trial, metrics)` → compact JSON
  - `generateCaseRecommendation(facts)` → custom Gemini prompt, strict output
    `{ recommendation, riskLevel }`; **on error / missing `GEMINI_API_KEY`** → return
    `{ recommendation: ae.staffRecommendationSeed, riskLevel: ae.riskLevelSeed, source:"fallback" }`
  - `generateTrialSummary(facts)` → Gemini "what to do about this trial" paragraph; fallback =
    templated string from the computed flags + health score
  - Persists to `AdverseEvent.aiRecommendation` / `TrialInsight.aiSummary` with timestamps
- `insights.routes.ts` → `POST /api/insights/refresh` (recompute + AI for all trials and all
  **serious** AEs; returns the refreshed insights). Idempotent.
- Uses `modules/ai/provider.ts` with `AI_PROVIDER=gemini`.

## API surface — `apps/api/src/modules/`

Mounted in `app.ts` (old `/api/{auth,items,files,datasets,ai,audit,reports,ml}` mounts removed).

| Method & path | Purpose |
|---|---|
| `GET /api/health` | keep |
| `GET /api/config` | the `AppConfig` row (for the config/legend panel + banner) |
| `GET /api/trials?phase=&region=&trial=` | risk-sorted trial cards: badges, funnel, progress, AE summary, next milestone, `healthScore`/`healthStatus`, flag list with reasons, `dataQuality` line |
| `GET /api/trials/:id` | drill-down: site enrollment table, subject funnel, AE list (with `aiRecommendation` / seed fallback, unresolved highlighted), milestone timeline (planned vs actual), full flag list, `TrialInsight` |
| `GET /api/portfolio/summary?filters` | KPI tiles across the filtered frame |
| `POST /api/insights/refresh` | (re)generate AI + `TrialInsight` cache |
| `GET /api/export/flagged?filters` | CSV of flagged trials + reasons (FR-15, SHOULD) |

Filters are applied once in a `selectFrame(filters)` helper so every endpoint computes from the
same filtered set (FR-13, NFR "internal consistency").

## Cleanup — delete from the scaffold

**Dirs:** `apps/ml/`, `tools/gen/`, `apps/api/src/modules/{auth,files,ingest,workflow,report,ml,audit}/`,
`apps/api/src/realtime/`, `apps/api/src/seed/` (old), `apps/web/src/features/{auth,chat,items,_template}/`,
`apps/web/src/components/{data,map,feedback,flow,upload}/`, `apps/web/src/pages/`.

**Files:** `apps/api/src/db/connect.ts`, `apps/api/src/modules/ai/{embeddings,rag}.ts`, all
`apps/api/src/modules/ai/providers/*` except `gemini.ts`, `apps/api/src/modules/items/*`,
`packages/shared/src/{rules.ts,schemas/{auth,workflow,ai,ingest,item}.ts}`.

**Deps removed** — api: `mongoose`, `mongodb-memory-server`, `bcryptjs`, `jsonwebtoken`,
`multer`, `pdfkit`, `qrcode`, `socket.io`, `@anthropic-ai/sdk`, `@faker-js/faker` + their
`@types/*`. web: `socket.io-client`, `leaflet`, `react-leaflet`, `@types/leaflet`, `papaparse`,
`@types/papaparse`. **Added** — api: `@prisma/client`, `prisma` (dev), `@google/generative-ai`,
`csv-parse`, `tsx` (already present).

**Root `package.json`:** drop `apps/ml` + `tools/gen` from `workspaces`; remove `dev:all`,
`dev:ml`, `gen:feature`, `doctor`, `setup:ml` scripts.

**Config fixes:** `apps/web/src/lib/utils.ts` → move `en-IN`/INR formatting out, keep `cn()`
only, add `lib/format.ts` (plain number / percent / signed-days). `apps/api/.env.example` →
keep `PORT`, `NODE_ENV`, `CORS_ORIGIN`; add `DATABASE_URL`, `DIRECT_URL`, `AI_PROVIDER=gemini`,
`GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.0-flash`; drop Mongo/JWT/OCR/Ollama/OpenAI/Anthropic
keys. Optional: rename npm scope `@gvhax/*` → `@ctd/*` (4 `package.json` + `@gvhax/shared`
imports).

## Folder structure

**Monorepo, feature-first.** Backend groups by domain module (`routes` + `service`); frontend
groups by feature (page + co-located components); shared primitives only in `components/`;
the api↔web contract lives in `packages/shared`.

```
clinical-trial-dashboard/
├── apps/
│   ├── api/                              # @ctd/api — Express + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts                   # deterministic generator + CSV remap
│   │   ├── data/
│   │   │   └── clinical_safety_cases.csv # the 500-row source, committed
│   │   ├── src/
│   │   │   ├── index.ts · app.ts
│   │   │   ├── config/env.ts
│   │   │   ├── db/prisma.ts              # PrismaClient singleton
│   │   │   ├── lib/{http,logger,query}.ts
│   │   │   ├── middleware/{error,validate}.ts
│   │   │   └── modules/
│   │   │       ├── trials/{trials.routes.ts,trials.service.ts}
│   │   │       ├── portfolio/{portfolio.routes.ts,portfolio.service.ts}
│   │   │       ├── metrics/{funnel.ts,exposure.ts,adverse.ts,milestones.ts,flags.ts,health.ts,index.ts}
│   │   │       ├── insights/{insights.routes.ts,insights.service.ts}
│   │   │       ├── config/{config.routes.ts}
│   │   │       ├── export/{export.routes.ts}
│   │   │       └── ai/{provider.ts,providers/gemini.ts}
│   │   ├── test/                         # vitest — metrics/* pure-function tests
│   │   ├── .env.example · package.json · tsconfig.json
│   ├── web/                              # @ctd/web — Vite + React
│   │   ├── index.html · vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx · App.tsx · routes.tsx · index.css
│   │   │   ├── lib/{api.ts,query.ts,format.ts,utils.ts}
│   │   │   ├── components/
│   │   │   │   ├── ui/                   # shadcn subset (keep)
│   │   │   │   ├── charts/index.tsx      # Recharts wrappers (keep)
│   │   │   │   └── layout/{AppShell.tsx,HonestyBanner.tsx}
│   │   │   └── features/
│   │   │       ├── portfolio/{PortfolioPage.tsx,TrialCard.tsx,KpiRow.tsx,FilterBar.tsx,FlagLegend.tsx}
│   │   │       ├── trial/{TrialDrilldownPage.tsx,SiteEnrollmentTable.tsx,AdverseEventsTable.tsx,MilestoneTimeline.tsx,EnrollmentCurve.tsx,AeRecommendationCell.tsx}
│   │   │       └── config/{ConfigPanel.tsx}
│   │   ├── package.json · tsconfig.json
├── packages/
│   └── shared/                           # @ctd/shared
│       └── src/
│           ├── index.ts · constants.ts   # enums: Phase, TrialStatus, AeSeverity, MilestoneState, HealthStatus, FlagType
│           └── schemas/{trial.ts,site.ts,subject.ts,adverse-event.ts,milestone.ts,flag.ts,insight.ts,config.ts}
├── docs/{adr,agents}/                    # keep; add ADR-0001 (Prisma+Supabase), ADR-0002 (PRD deviations)
├── .scratch/
├── CLAUDE.md · CONTEXT.md (new, domain glossary) · package.json · tsconfig.base.json · .gitignore
```

## Build order (~3 h)

| Window | Work | Done = |
|---|---|---|
| 0:00–0:20 | `git init`; prune scaffold (dirs/files/deps/scripts); config fixes; `.env` with Supabase URL | `npm install` clean, `npm run typecheck` clean |
| 0:20–0:45 | `schema.prisma`; `db/prisma.ts`; `prisma migrate dev` against Supabase; `constants.ts` + zod schemas in `shared` | `npx prisma validate` + migration applied, tables visible in Supabase |
| 0:45–1:10 | `seed.ts` generator + CSV remap; `npx prisma db seed` | row counts sane in Supabase; one trial has a cluster of serious+unresolved AEs, one is behind-plan, one has a non-enrolling site, one milestone overdue |
| 1:10–1:50 | `modules/metrics/*` pure functions + vitest; `trials`/`portfolio`/`config` endpoints via `selectFrame` | `curl /api/trials` returns cards with flags+reasons+healthScore; `npm test` green |
| 1:50–2:10 | `modules/insights` — Gemini per-case + per-trial, CSV fallback; `POST /api/insights/refresh` | refresh writes `trial_insights` + `ai_recommendation` rows; works with key unset (source=fallback) |
| 2:10–2:35 | web entry (`main.tsx`/`App.tsx`/`routes.tsx`/query client); `AppShell` trim + `HonestyBanner`; `PortfolioPage` + `TrialCard` + `KpiRow` + `FilterBar` | portfolio grid renders risk-sorted, filters recompute all panels |
| 2:35–2:55 | `TrialDrilldownPage`: site table, AE table (unresolved highlighted, AI recommendation cell), milestone timeline; flag-click → scroll+highlight source row | click-through-to-source-row works end to end |
| 2:55–3:00 | `ConfigPanel` (read-only), empty/edge states, `EnrollmentCurve` if time; rehearse demo script twice | full scripted flow runs without breaking |

**Cut order if behind:** charts → filters → config panel. Never cut flag→source-row traceability.

## Verification (end to end)

- `npm install` succeeds with the trimmed deps; no `gvhax` / `mongoose` / `socket.io` /
  `leaflet` / `apps/ml` references remain (`grep`-checked).
- `npx prisma validate` passes; `npx prisma db seed` populates Supabase — confirm row counts in
  the Supabase table editor.
- `npm test -w @ctd/api` — metrics pure-function tests green (flag rules, exposure, health score).
- `npm run dev` → API :4000 (`GET /api/health` 200), web :5173.
- `GET /api/trials` returns risk-sorted cards; every flag has a reason string; `healthScore`
  present. `GET /api/trials/:id` returns funnel + AE list + milestones + insight.
- Dashboard at `/`: risk-sorted grid, honesty banner visible, filters recompute KPI tiles and
  cards consistently (tile counts == filtered table row counts).
- Click a serious-unresolved flag → drill-down opens scrolled to and highlighting that `AE-…`
  row; the row shows the Gemini `aiRecommendation`.
- **Refresh insights** → `trial_insights` + `ai_recommendation` rows written with timestamps;
  cards show the AI trial summary.
- Unset `GEMINI_API_KEY`, refresh again → insights still render with `source: "fallback"` from
  the CSV columns; nothing crashes.
- Edge cases: a trial with zero enrolled subjects and a milestone with no `actual_date` each
  render a named empty state (seed includes both), no blank panels (FR-17).
- `npm run typecheck` clean for `@ctd/{api,web,shared}`.

## Execution — GitHub issues (not built by us)

Repo: `github.com/Kirito0088/Clinical-Trial-Dashboard` (`main`, gh authed as `Kirito0088`).
Break-down published via the **`to-tickets`** skill as GitHub issues in dependency order.

**Labels** — create if absent: standard triage (`needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`) plus three assignee labels: **`Nikhil-Backend`**, **`Jayesh-AI`**,
**`Yash-UI`**. Every issue below gets `ready-for-agent` + its one assignee label.

**6 issues, 2 per person, contract-first so work runs in parallel after the foundation:**

| # | Title | Label | Blocked by | Delivers |
|---|---|---|---|---|
| 1 | Foundation: strip scaffold, Prisma schema, Supabase migration, shared api↔web contract, stub endpoints | `Nikhil-Backend` | — | Pruned monorepo; `schema.prisma` migrated to Supabase; `packages/shared` zod schemas + enums; Express serving `/api/health` + `/api/{trials,trials/:id,portfolio/summary,config}` returning typed **fixture** data that matches the contract exactly. Unblocks everyone. |
| 2 | Deterministic seed generator + metrics/flag engine + live endpoints | `Nikhil-Backend` | 1 | `seed.ts` generates trials/sites/subjects/milestones and remaps the 500 CSV AE cases (with planted anomalies); `modules/metrics` (funnel, exposure, AE aggregate, PRD flag rules + reasons, health score); the 4 endpoints + `/api/export/flagged` now compute from Supabase. |
| 3 | Gemini insights service + deterministic fallback + refresh endpoint | `Jayesh-AI` | 1 | `modules/insights`: per-AE staff recommendation + per-trial "what to do" summary via custom Gemini prompts; CSV `*_seed` columns as fallback when no key; `POST /api/insights/refresh` writes `trial_insights` + `adverse_events.ai_recommendation` with timestamps. Idempotent. |
| 4 | Surface AI in trial payloads + prompt tuning + degradation hardening | `Jayesh-AI` | 2, 3 | `aiRecommendation`/`aiSummary` merged into `/api/trials` + `/api/trials/:id` per the shared contract; prompts tuned against real seeded data; seed pre-fills `ai_*` so first paint has content; verified: key unset → everything still renders `source: "fallback"`. |
| 5 | App shell + portfolio view | `Yash-UI` | 1 | `main.tsx`/`App`/`routes`/query client; `AppShell` trimmed + persistent `HonestyBanner`; `PortfolioPage` = risk-sorted `TrialCard` grid (badges, enrollment bar, AE severity split, next-milestone countdown, `health_score` headline, flag chips w/ reason tooltips) + `KpiRow` + `FilterBar` (phase/trial/region) + `FlagLegend`, consuming issue-1 endpoints via shared types. |
| 6 | Trial drill-down + flag→source-row traceability + config panel | `Yash-UI` | 1, 5 | `TrialDrilldownPage`: site enrollment table, AE table (unresolved highlighted, AI-recommendation cell), planned-vs-actual milestone timeline; clicking a flag on the card scrolls to + highlights the causing row; read-only `ConfigPanel`; named empty/edge states; enrollment-vs-plan curve if time. |

**Parallelism:** issue 1 is the only shared blocker (small, done first). After it: issues 2, 3,
5 run concurrently (one per person). Each person then has a clean second ticket (2→nothing new,
3+2→4, 5→6). Integration point is issue 4 aligning AI fields to the contract issues 5/6 already
render.

## Out of scope

Auth/users (Supabase Auth is a later phase), real patient data / PII, EDC/CTMS integration,
voice/chat UI, interactive patient simulation, statistical-significance testing on AE rates, any
safety-signal claim, the Python ML sidecar, deployment (localhost-first; Vercel/Render is a
stretch), multi-user editing.
