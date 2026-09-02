# Backend API Integration Guide — Clinical Trials Dashboard (@ctd/api)

This document provides complete, implementation-accurate documentation for frontend developers integrating with the **Clinical Trials Dashboard Backend API**.

---

## 1. Backend Architecture Analysis

The backend is built as an Express 4 REST API in TypeScript (`@ctd/api`) within an npm-workspaces monorepo. It enforces contract-first communication using `@ctd/shared` Zod schemas.

### Execution Flow

```text
Application Entry Point (apps/api/src/index.ts)
        ↓
HTTP Server & Env Config (apps/api/src/config/env.ts)
        ↓
Express App Initialization & Global Middleware (apps/api/src/app.ts)
  [helmet, cors, express.json, morgan]
        ↓
Route Definitions (apps/api/src/app.ts)
        ↓
Data Validation & Schema Envelope (@ctd/shared)
        ↓
Controllers / Fixture Provider
        ↓
Database Model Specs (apps/api/prisma/schema.prisma) & AI Module (apps/api/src/modules/ai)
        ↓
Standardized Envelope Response (apps/api/src/lib/http.ts)
        ↓
Error Middleware Normalization (apps/api/src/middleware/error.ts)
```

---

## 2. Master Endpoint Table

| Method | Endpoint | Authentication | Purpose | Status |
| ------ | -------- | -------------- | ------- | ------ |
| `GET` | `/api/health` | Public | Check API operational status, uptime, DB, and AI provider status | Implemented |
| `GET` | `/api/config` | Public | Retrieve global threshold parameters and configuration | Implemented |
| `GET` | `/api/trials` | Public | Fetch portfolio of clinical trial cards sorted by risk (health score ascending) | Implemented |
| `GET` | `/api/trials/:id` | Public | Fetch comprehensive detail for a specific clinical trial | Implemented |
| `GET` | `/api/portfolio/summary` | Public | Retrieve portfolio-wide aggregated KPIs and metrics | Implemented |
| `POST` | `/api/insights/refresh` | Public | Trigger refresh of AI/fallback health insights for trials | Implemented |
| `GET` | `/api/export/flagged` | Public | Retrieve flattened flagged trial records for CSV export | Implemented |

---

## 3. Detailed Endpoint Documentation

### Response Format Standard
All API endpoints wrap data in a standardized JSON response envelope defined in `@ctd/shared`:

**Success Response:**
```json
{
  "ok": true,
  "data": { ... },
  "meta": { ... } // Optional
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { "field": ["validation message"] } // Optional
  }
}
```

---

### `GET /api/health`

#### Purpose
Returns the operational health, uptime, environment, database connection status, and AI provider configuration status.

#### Authentication
Public (No headers required).

#### Path Parameters
None

#### Query Parameters
None

#### Request Headers
| Header | Required | Value / Format | Purpose |
| ------ | -------- | -------------- | ------- |
| `Accept` | Optional | `application/json` | Expect JSON response |

#### Request Body
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "uptime": 142,
    "env": "development",
    "db": {
      "connected": false
    },
    "ai": {
      "provider": "gemini",
      "configured": false
    }
  }
}
```

#### Fields Breakdown
| Field | Type | Description |
| ----- | ---- | ----------- |
| `data.status` | `string` | System status (`"ok"`) |
| `data.uptime` | `number` | Server uptime in seconds |
| `data.env` | `string` | Environment name (`"development" \| "test" \| "production"`) |
| `data.db.connected` | `boolean` | Database connection status |
| `data.ai.provider` | `string` | Configured AI provider (`"gemini" \| "mock"`) |
| `data.ai.configured` | `boolean` | Whether valid API key is present for the AI provider |

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/health');
const result = await res.json();
if (result.ok) {
  console.log('API Status:', result.data.status, 'AI Ready:', result.data.ai.configured);
}
```

---

### `GET /api/config`

#### Purpose
Fetches global clinical dashboard parameters (milestone horizons, shortfall thresholds, AE alert rates).

#### Authentication
Public

#### Path Parameters
None

#### Query Parameters
None

#### Request Headers
| Header | Required | Value / Format | Purpose |
| ------ | -------- | -------------- | ------- |
| `Accept` | Optional | `application/json` | Expect JSON response |

#### Request Body
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "id": "singleton",
    "asOfDate": "2026-09-01T00:00:00.000Z",
    "milestoneHorizonDays": 30,
    "enrollmentShortfallThreshold": 0.15,
    "minExposurePatientMonths": 24,
    "aeRateAlert": 15,
    "seriousEventReviewWindowDays": 7,
    "nonEnrollingSiteGraceDays": 45
  }
}
```

#### Fields Breakdown
| Field | Type | Description |
| ----- | ---- | ----------- |
| `data.id` | `string` | Configuration identifier (`"singleton"`) |
| `data.asOfDate` | `string` (ISO 8601) | Baseline reference timestamp for analysis |
| `data.milestoneHorizonDays` | `number` | Lookahead window in days for upcoming milestones |
| `data.enrollmentShortfallThreshold` | `number` | Shortfall fraction threshold (e.g. 0.15 = 15%) |
| `data.minExposurePatientMonths` | `number` | Patient exposure threshold for AE rate calculation |
| `data.aeRateAlert` | `number` | Adverse Event rate threshold per 100 patient-months |
| `data.seriousEventReviewWindowDays` | `number` | Maximum allowed days before an unresolved serious AE triggers a flag |
| `data.nonEnrollingSiteGraceDays` | `number` | Grace period in days for site activation without enrollment |

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/config');
const { ok, data } = await res.json();
```

---

### `GET /api/trials`

#### Purpose
Fetches the full list of clinical trial cards sorted by risk level (`healthScore` ascending: lowest score/highest risk first).

#### Authentication
Public

#### Path Parameters
None

#### Query Parameters
None currently processed by mock handler (schema supports standard query object in shared library).

#### Request Body
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": [
    {
      "id": "CT-DEMO-004",
      "title": "Immunology Phase IV — Adalimumab Biosimilar",
      "sponsor": "SafeBridge Pharma",
      "phase": "PHASE_4",
      "status": "ACTIVE",
      "conditionArea": "Immunology",
      "interventionType": "Biologic",
      "targetEnrollment": 400,
      "enrollmentProgress": 0.93,
      "funnel": {
        "screened": 420,
        "enrolled": 372,
        "active": 355,
        "withdrawn": 17,
        "screenFailed": 48
      },
      "aeSummary": {
        "total": 62,
        "serious": 12,
        "unresolved": 5,
        "byGrade": {
          "MILD": 25,
          "MODERATE": 20,
          "SEVERE": 10,
          "CRITICAL": 7
        }
      },
      "nextMilestone": {
        "id": "M-DEMO-004-05",
        "type": "DB Lock",
        "plannedDate": "2026-08-25T00:00:00.000Z",
        "state": "OVERDUE",
        "daysUntil": -7
      },
      "healthScore": 35,
      "healthStatus": "CRITICAL",
      "flags": [
        {
          "type": "SERIOUS_UNRESOLVED",
          "label": "Serious Unresolved",
          "reason": "5 serious AEs unresolved beyond 7-day review window"
        }
      ],
      "flagCount": 3
    }
  ]
}
```

#### Key Fields Breakdown
| Field | Type | Allowed Values / Format | Description |
| ----- | ---- | ----------------------- | ----------- |
| `phase` | `string` | `"PHASE_1" \| "PHASE_2" \| "PHASE_3" \| "PHASE_4"` | Trial study phase |
| `status` | `string` | `"RECRUITING" \| "ACTIVE" \| "PAUSED" \| "COMPLETED"` | Operational status |
| `healthStatus` | `string` | `"HEALTHY" \| "WATCH" \| "CRITICAL"` | Health categorization |
| `nextMilestone.state` | `string` | `"DONE" \| "OVERDUE" \| "DUE_SOON" \| "FUTURE"` | Milestone status |
| `flags[].type` | `string` | `"BEHIND_PLAN" \| "AE_RATE_ALERT" \| "SERIOUS_UNRESOLVED" \| "NON_ENROLLING_SITE" \| "ENROLLMENT_STALLED"` | Rule breach category |

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/trials');
const { ok, data: trials } = await res.json();
```

---

### `GET /api/trials/:id`

#### Purpose
Retrieves comprehensive details for a specific trial including sites breakdown, adverse events log, milestone timeline, and health insights.

#### Authentication
Public

#### Path Parameters
| Parameter | Type | Required | Description | Example |
| --------- | ---- | -------- | ----------- | ------- |
| `id` | `string` | Yes | Unique Trial Identifier | `CT-DEMO-001` |

#### Query Parameters
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "id": "CT-DEMO-001",
    "title": "Cardiology Phase III — Amlodipine Besylate",
    "sponsor": "NovaPharma Inc.",
    "phase": "PHASE_3",
    "status": "ACTIVE",
    "conditionArea": "Cardiology",
    "interventionType": "Drug",
    "targetEnrollment": 300,
    "plannedStart": "2025-11-01T00:00:00.000Z",
    "plannedEnd": "2027-02-28T00:00:00.000Z",
    "enrollmentProgress": 0.72,
    "funnel": {
      "screened": 280,
      "enrolled": 216,
      "active": 198,
      "withdrawn": 18,
      "screenFailed": 64
    },
    "aeSummary": {
      "total": 45,
      "serious": 8,
      "unresolved": 3,
      "byGrade": {
        "MILD": 20,
        "MODERATE": 15,
        "SEVERE": 7,
        "CRITICAL": 3
      }
    },
    "healthScore": 62,
    "healthStatus": "WATCH",
    "flags": [
      {
        "type": "SERIOUS_UNRESOLVED",
        "label": "Serious Unresolved",
        "reason": "3 serious AEs unresolved beyond 7-day review window (AE-007865, AE-007866, AE-007867)",
        "sourceId": "AE-007865"
      }
    ],
    "sites": [
      {
        "id": "S-DEMO-001-01",
        "siteName": "Apollo Hospital, Delhi",
        "region": "North India",
        "targetEnrollment": 100,
        "activeSubjects": 72,
        "enrolledSubjects": 78,
        "screenFailed": 20,
        "withdrawn": 6,
        "activationDate": "2025-11-15T00:00:00.000Z",
        "isNonEnrolling": false
      }
    ],
    "adverseEvents": [
      {
        "id": "AE-007865",
        "trialId": "CT-DEMO-001",
        "siteId": "S-DEMO-001-01",
        "subjectRef": "SUBJ-DEMO-001-0042",
        "onsetDate": "2026-08-10T00:00:00.000Z",
        "resolvedDate": null,
        "term": "Severe Hypotension",
        "symptoms": ["Hypotension", "Dizziness", "Syncope"],
        "severityGrade": "SEVERE",
        "seriousFlag": true,
        "outcome": "Not yet resolved",
        "drugName": "Amlodipine Besylate",
        "drugClass": "Calcium Channel Blocker",
        "patientAge": 67,
        "patientSex": "Male",
        "suspectedRelationship": "Probable",
        "riskLevelSeed": "High",
        "reviewPrioritySeed": "Urgent",
        "riskFactorsSeed": "Elderly patient, pre-existing renal impairment, concomitant ACE inhibitor",
        "staffRecommendationSeed": "Immediate dose reduction; cardiology consult; increase monitoring frequency to q4h vitals",
        "caseSummary": "Elderly male patient developed severe hypotension 72h post dose escalation.",
        "eventNarrative": "Patient experienced symptomatic hypotension requiring IV fluid resuscitation.",
        "aiRecommendation": null,
        "aiGeneratedAt": null
      }
    ],
    "milestones": [
      {
        "id": "M-DEMO-001-01",
        "trialId": "CT-DEMO-001",
        "type": "FPFV",
        "plannedDate": "2025-12-01T00:00:00.000Z",
        "actualDate": "2025-12-05T00:00:00.000Z",
        "state": "DONE",
        "daysUntil": -271
      }
    ],
    "insight": null
  }
}
```

#### Error Response (HTTP 404)
```json
{
  "ok": false,
  "error": {
    "message": "Trial INVALID-ID not found",
    "code": "NOT_FOUND"
  }
}
```

#### Frontend Integration Example
```javascript
const trialId = 'CT-DEMO-001';
const res = await fetch(`http://localhost:4000/api/trials/${trialId}`);
const result = await res.json();
if (result.ok) {
  console.log('Trial details:', result.data.title, result.data.sites);
} else {
  console.error('Trial not found:', result.error.message);
}
```

---

### `GET /api/portfolio/summary`

#### Purpose
Provides aggregated summary statistics across all trials in the portfolio for dashboard KPI cards.

#### Authentication
Public

#### Path Parameters
None

#### Query Parameters
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "totalTrials": 5,
    "activeTrials": 3,
    "totalSubjects": 645,
    "enrolledSubjects": 838,
    "totalAdverseEvents": 165,
    "seriousAdverseEvents": 28,
    "unresolvedEvents": 9,
    "flaggedTrials": 3,
    "avgHealthScore": 60,
    "trialsByPhase": {
      "PHASE_1": 1,
      "PHASE_2": 2,
      "PHASE_3": 1,
      "PHASE_4": 1
    },
    "trialsByStatus": {
      "RECRUITING": 2,
      "ACTIVE": 2,
      "PAUSED": 1,
      "COMPLETED": 0
    }
  }
}
```

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/portfolio/summary');
const { ok, data: kpis } = await res.json();
```

---

### `POST /api/insights/refresh`

#### Purpose
Triggers a refresh of trial health scores and AI-generated summaries across the portfolio.

#### Authentication
Public

#### Request Content Type
`application/json`

#### Request Body
None (optional empty object `{}`)

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": {
    "refreshed": 1,
    "insights": [
      {
        "trialId": "CT-DEMO-001",
        "healthScore": 62,
        "healthStatus": "WATCH",
        "scoreBreakdown": {
          "enrollment": 18,
          "aeRate": 12,
          "severeMix": 15,
          "milestone": 17
        },
        "aiSummary": null,
        "source": "fallback",
        "generatedAt": "2026-09-02T09:49:51.145Z"
      }
    ]
  }
}
```

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/insights/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const result = await res.json();
```

---

### `GET /api/export/flagged`

#### Purpose
Fetches a flattened table of all flagged issues across trials designed for CSV / Excel export.

#### Authentication
Public

#### Path Parameters
None

#### Query Parameters
None

#### Success Response (HTTP 200)
```json
{
  "ok": true,
  "data": [
    {
      "trialId": "CT-DEMO-001",
      "title": "Cardiology Phase III — Amlodipine Besylate",
      "phase": "PHASE_3",
      "status": "ACTIVE",
      "healthScore": 62,
      "healthStatus": "WATCH",
      "flagType": "SERIOUS_UNRESOLVED",
      "flagReason": "3 serious AEs unresolved beyond 7-day review window"
    },
    {
      "trialId": "CT-DEMO-002",
      "title": "Oncology Phase II — Pembrolizumab Combination",
      "phase": "PHASE_2",
      "status": "RECRUITING",
      "healthScore": 48,
      "healthStatus": "WATCH",
      "flagType": "BEHIND_PLAN",
      "flagReason": "Enrollment at 45% vs expected 62% — shortfall of 34 subjects"
    }
  ]
}
```

#### Frontend Integration Example
```javascript
const res = await fetch('http://localhost:4000/api/export/flagged');
const { ok, data: rows } = await res.json();
```

---

## 4. API Base URL & Environment Configuration

### Base URL Structure
```text
Backend Server: Node.js / Express
Default Port: 4000
API Base Path: /api
Local Development URL: http://localhost:4000/api
```

### Vite Frontend Proxy Setup
In development, Vite is configured to proxy all calls matching `/api` directly to `http://localhost:4000`:
```typescript
// apps/web/vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true }
    }
  }
});
```

---

## 5. Authentication & Authorization

```text
Status: NOT REQUIRED / PUBLIC
```
The backend currently exposes all endpoints publicly. There are no registration, login, JWT, Bearer token, or session requirements implemented in `apps/api/src/app.ts`.

---

## 6. Database & Data Models

The backend schema is defined using **Prisma** with PostgreSQL target (`apps/api/prisma/schema.prisma`).

### Entity Schemas Overview

#### 1. `Trial` (`trials`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `id` | `String` | Yes | Primary Key (`"CT-00325"`) | Unique Trial Code |
| `title` | `String` | Yes | None | Study title |
| `sponsor` | `String` | Yes | None | Sponsoring company |
| `phase` | `Phase` Enum | Yes | None | `PHASE_1` \| `PHASE_2` \| `PHASE_3` \| `PHASE_4` |
| `status` | `TrialStatus` Enum | Yes | None | `RECRUITING` \| `ACTIVE` \| `PAUSED` \| `COMPLETED` |
| `conditionArea` | `String` | Yes | None | Therapeutic domain (e.g. Oncology) |
| `interventionType` | `String` | Yes | None | `"Drug"` \| `"Vaccine"` \| `"Device"` \| `"Biologic"` |
| `targetEnrollment` | `Int` | Yes | None | Target total subject count |
| `plannedStart` | `DateTime` | Yes | None | Planned trial start date |
| `plannedEnd` | `DateTime` | Yes | None | Planned completion date |

#### 2. `Site` (`sites`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `id` | `String` | Yes | Primary Key (`"S-00325-01"`) | Site ID |
| `trialId` | `String` | Yes | Foreign Key (`Trial.id`) | Belongs to trial |
| `siteName` | `String` | Yes | None | Hospital / Institution name |
| `region` | `String` | Yes | None | Geographic region |
| `targetEnrollment` | `Int` | Yes | None | Target quota for site |
| `activationDate` | `DateTime` | Yes | None | Site activation date |

#### 3. `Subject` (`subjects`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `id` | `String` | Yes | Primary Key (`"SUBJ-00325-0007"`) | Subject Identifier |
| `trialId` | `String` | Yes | Foreign Key (`Trial.id`) | Trial reference |
| `siteId` | `String` | Yes | Foreign Key (`Site.id`) | Site reference |
| `screenedDate` | `DateTime` | Yes | None | Screening timestamp |
| `enrolledDate` | `DateTime?` | No | None | Enrollment timestamp (null if failed screening) |
| `withdrawnDate` | `DateTime?` | No | None | Withdrawal timestamp |
| `screenFailReason` | `String?` | No | None | Reason for screen failure |

#### 4. `AdverseEvent` (`adverse_events`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `id` | `String` | Yes | Primary Key (`"AE-007865"`) | Case ID |
| `trialId` | `String` | Yes | Foreign Key (`Trial.id`) | Trial reference |
| `siteId` | `String` | Yes | Foreign Key (`Site.id`) | Site reference |
| `subjectRef` | `String` | Yes | None | Subject ID |
| `onsetDate` | `DateTime` | Yes | None | Event onset |
| `resolvedDate` | `DateTime?` | No | None | Resolution date (null = unresolved) |
| `term` | `String` | Yes | None | Primary adverse event term |
| `symptoms` | `Json` | Yes | None | Array of symptom strings |
| `severityGrade` | `AeSeverity` Enum | Yes | None | `MILD` \| `MODERATE` \| `SEVERE` \| `CRITICAL` |
| `seriousFlag` | `Boolean` | Yes | None | Serious event flag |
| `outcome` | `String` | Yes | None | Event outcome |
| `drugName` | `String` | Yes | None | Administered study drug |
| `drugClass` | `String` | Yes | None | Drug classification |
| `patientAge` | `Int` | Yes | None | Subject age |
| `patientSex` | `String` | Yes | None | Subject sex |
| `suspectedRelationship` | `String` | Yes | None | Causality assessment |
| `caseSummary` | `String` | Yes | None | Concise summary narrative |
| `eventNarrative` | `String` | Yes | None | Full medical narrative |
| `aiRecommendation` | `String?` | No | None | AI generated recommendation |
| `aiGeneratedAt` | `DateTime?` | No | None | Generation timestamp |

#### 5. `Milestone` (`milestones`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `id` | `String` | Yes | Primary Key (`"M-00325-03"`) | Milestone ID |
| `trialId` | `String` | Yes | Foreign Key (`Trial.id`) | Trial reference |
| `type` | `String` | Yes | None | e.g. `"FPFV"`, `"LPLV"`, `"DB Lock"`, `"Interim Analysis"`, `"DSMB Review"` |
| `plannedDate` | `DateTime` | Yes | None | Scheduled target date |
| `actualDate` | `DateTime?` | No | None | Actual completion date |

#### 6. `TrialInsight` (`trial_insights`)
| Field | Prisma Type | Required | Primary/Foreign Key | Description |
| ----- | ----------- | -------- | ------------------- | ----------- |
| `trialId` | `String` | Yes | Primary Key / FK (`Trial.id`) | Trial reference |
| `healthScore` | `Int` | Yes | None | 0–100 calculated health score |
| `healthStatus` | `String` | Yes | None | `"HEALTHY"` \| `"WATCH"` \| `"CRITICAL"` |
| `scoreBreakdown` | `Json` | Yes | None | `{ enrollment, aeRate, severeMix, milestone }` |
| `aiSummary` | `String?` | No | None | Generated advice summary |
| `source` | `String` | Yes | None | `"gemini"` \| `"fallback"` |
| `generatedAt` | `DateTime` | Yes | None | Insights generation timestamp |

#### 7. `AppConfig` (`app_config`)
Single row configuration record (`id: "singleton"`).

---

## 7. Frontend Data Flow

```text
User Selects Dashboard View
        ↓
Frontend executes: GET /api/portfolio/summary & GET /api/trials
        ↓
Express App validates request & serves JSON Envelope
        ↓
Frontend renders Risk-Sorted Portfolio Cards (Score ASC) & KPI Tiles
        ↓
User Clicks Trial Card (e.g. "CT-DEMO-001")
        ↓
Frontend executes: GET /api/trials/CT-DEMO-001
        ↓
Express App returns Trial Detail (Sites, Adverse Events, Milestones)
        ↓
User Clicks "Export Flagged Issues"
        ↓
Frontend executes: GET /api/export/flagged & downloads CSV
```

---

## 8. CRUD Operations Status

| Resource | Create (`POST`) | Read (`GET`) | Update (`PUT`/`PATCH`) | Delete (`DELETE`) |
| -------- | -------------- | ------------ | --------------------- | ----------------- |
| **Trials** | Not Implemented | `GET /api/trials`, `GET /api/trials/:id` | Not Implemented | Not Implemented |
| **Config** | Not Implemented | `GET /api/config` | Not Implemented | Not Implemented |
| **Portfolio** | Not Implemented | `GET /api/portfolio/summary` | Not Implemented | Not Implemented |
| **Insights** | `POST /api/insights/refresh` | Returned in `GET /api/trials/:id` | Not Implemented | Not Implemented |
| **Exports** | Not Implemented | `GET /api/export/flagged` | Not Implemented | Not Implemented |

---

## 9. Search / Filter / Sort / Pagination

- **Sorting**: `GET /api/trials` returns trials automatically pre-sorted by `healthScore` ascending (most critical first).
- **Pagination / Filtering / Search**: The shared contract includes `listQuerySchema` (`page`, `limit`, `sort`, `q`, `filters`), but current API fixture routes return the full risk-sorted list without requiring query parameters.

---

## 10. External Services

### Google Gemini API
- **Provider Module**: `apps/api/src/modules/ai/providers/gemini.ts`
- **Default Model**: `gemini-2.5-flash`
- **Fallback Mechanism**: When `AI_PROVIDER=mock` or `GEMINI_API_KEY` is not present/fails, the system gracefully falls back to deterministic seed data without throwing errors to the client (`degraded: true`).

---

## 11. Files & Media

```text
Status: NO FILE UPLOAD ENDPOINTS IMPLEMENTED
```
No `multipart/form-data` file upload endpoints exist in the backend.

---

## 12. CORS Configuration

Configured in `apps/api/src/config/env.ts` and `apps/api/src/app.ts`:
- **Allowed Origins**: Specified by `CORS_ORIGIN` env variable (Default: `http://localhost:5173`)
- **Credentials**: `true`
- **Resource Policy**: `cross-origin`

---

## 13. Environment Variables

| Variable | Purpose | Required | Default Value |
| -------- | ------- | -------- | ------------- |
| `PORT` | API HTTP listener port | No | `4000` |
| `NODE_ENV` | App execution environment | No | `development` |
| `CORS_ORIGIN` | Allowed origin header(s) comma-separated | No | `http://localhost:5173` |
| `DATABASE_URL` | Supabase Postgres pooled connection URL | No | `""` |
| `DIRECT_URL` | Supabase Postgres direct connection URL | No | `""` |
| `AI_PROVIDER` | Selected AI provider name | No | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | No | `""` |
| `GEMINI_MODEL` | Gemini model version | No | `gemini-2.5-flash` |

---

## 14. Error Handling & HTTP Status Codes

Centralized in `apps/api/src/middleware/error.ts`:

### Standard Error Status Codes
- `400 Bad Request` (`BAD_REQUEST` / `VALIDATION`): Zod validation failure.
- `404 Not Found` (`NOT_FOUND`): Resource does not exist (e.g. unknown trial ID).
- `422 Unprocessable Entity` (`UNPROCESSABLE`): Unprocessable payload.
- `500 Internal Server Error` (`INTERNAL`): Unexpected backend exception.

---

## 15. Realtime Communication

```text
Status: NO REALTIME FUNCTIONALITY IMPLEMENTED
```
No WebSockets, Socket.IO, or Server-Sent Events are present.

---

## 16. Recommended Frontend API Client Architecture

Use the pre-configured API client exported from `apps/web/src/lib/api.ts`:

```typescript
import { api, ApiError } from '@/lib/api';
import type { TrialCard, TrialDetail, PortfolioSummary } from '@ctd/shared';

// Get portfolio summary
const { data: summary } = await api.get<PortfolioSummary>('/portfolio/summary');

// Get all trials
const { data: trials } = await api.get<TrialCard[]>('/trials');

// Get trial detail
try {
  const { data: detail } = await api.get<TrialDetail>(`/trials/${trialId}`);
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.code, err.message);
  }
}
```

---

## 17. Frontend Environment Configuration

Create `.env` in `apps/web`:
```env
VITE_API_URL=http://localhost:4000
```

---

## 18. Integration Testing Checklist

- [x] Backend responds to `GET /api/health` with `status: "ok"`
- [x] `GET /api/trials` returns array of 5 trial cards sorted by `healthScore` ascending
- [x] `GET /api/trials/CT-DEMO-001` returns detail object containing `sites`, `adverseEvents`, and `milestones`
- [x] `GET /api/trials/INVALID_ID` returns 404 with standard error format
- [x] `GET /api/portfolio/summary` returns portfolio KPIs
- [x] `POST /api/insights/refresh` returns refreshed insight records
- [x] `GET /api/export/flagged` returns flattened array for CSV generation

---

## 19. Integration Gotchas & Notes

1. **Standard Envelope**: Always unwrap `response.data` after verifying `response.ok === true`.
2. **Date Strings**: All dates are returned as ISO 8601 strings (e.g. `"2026-09-01T00:00:00.000Z"`).
3. **No Auth Token Needed**: Do not attach `Authorization` headers; all current routes are public.
4. **Offline Fallback**: If `GEMINI_API_KEY` is omitted, `/api/insights/refresh` succeeds using seed fallbacks.

---

## 20. Final Quick Reference

```text
Backend Tech: Node.js + Express + TypeScript + Prisma + Zod
Port: 4000
Base API Path: /api
Authentication: None (Public)
Content-Type: application/json
```

| Method | Endpoint | Auth | Purpose |
| ------ | -------- | ---- | ------- |
| `GET` | `/api/health` | Public | System Health |
| `GET` | `/api/config` | Public | App Parameters |
| `GET` | `/api/trials` | Public | List Trials (Risk-Sorted) |
| `GET` | `/api/trials/:id` | Public | Trial Detail |
| `GET` | `/api/portfolio/summary` | Public | Portfolio KPIs |
| `POST` | `/api/insights/refresh` | Public | Refresh Health Insights |
| `GET` | `/api/export/flagged` | Public | Flagged CSV Export Data |
