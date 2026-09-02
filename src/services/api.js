/**
 * Clinical Trials Dashboard — Frontend API Client
 *
 * Thin wrapper around fetch that:
 *  - Unwraps the { ok, data } envelope from the backend
 *  - Handles network errors gracefully (never throws to callers)
 *  - Provides a consistent error shape: { error: true, message, status }
 *
 * All endpoints are relative (/api/...) — Vite proxy forwards to :4000.
 * No credentials or API keys are exposed to the browser.
 */

const BASE = '/api';
const TIMEOUT_MS = 8000;

/**
 * Core fetch with timeout and envelope unwrapping.
 * @returns { data } on success, { error: true, message } on failure
 */
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timer);

    const json = await res.json();

    if (!res.ok || json.ok === false) {
      return {
        error: true,
        message: json?.error?.message ?? `HTTP ${res.status}`,
        status: res.status,
      };
    }

    return { data: json.data ?? json };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { error: true, message: 'Request timed out', status: 0 };
    }
    return { error: true, message: err.message ?? 'Network error', status: 0 };
  }
}

// ── Exported API functions ────────────────────────────────────────────────────

/**
 * GET /api/trials — portfolio list (sorted by health score ascending = most critical first)
 * Supports query params: phase, status, region, q (search)
 */
export async function getTrials(filters = {}) {
  const params = new URLSearchParams();
  if (filters.phase && filters.phase !== 'ALL') params.set('phase', filters.phase);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.region && filters.region !== 'ALL') params.set('region', filters.region);
  if (filters.q) params.set('q', filters.q);
  const qs = params.toString();
  return apiFetch(`/trials${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/trials/:id — full trial detail with sites, AEs, milestones, flags
 */
export async function getTrial(trialId) {
  return apiFetch(`/trials/${encodeURIComponent(trialId)}`);
}

/**
 * GET /api/portfolio/summary — portfolio-wide KPIs
 */
export async function getPortfolioSummary() {
  return apiFetch('/portfolio/summary');
}

/**
 * GET /api/trials/:id/recommendation — AI + deterministic recommendation pipeline
 */
export async function getRecommendation(trialId) {
  return apiFetch(`/trials/${encodeURIComponent(trialId)}/recommendation`);
}

/**
 * GET /api/config — monitoring threshold configuration
 */
export async function getConfig() {
  return apiFetch('/config');
}

/**
 * GET /api/health — backend health check
 */
export async function getHealth() {
  return apiFetch('/health');
}

/**
 * GET /api/search?q=... — cross-entity search
 */
export async function search(query) {
  return apiFetch(`/search?q=${encodeURIComponent(query)}`);
}

/**
 * GET /api/export/flagged — flagged trials export
 */
export async function getFlaggedExport() {
  return apiFetch('/export/flagged');
}
