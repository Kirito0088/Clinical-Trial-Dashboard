/**
 * Dashboard State — Clinical Trial Monitoring Platform
 *
 * Single source of truth for all UI state.
 * When the backend is available: loads from the API.
 * When the backend is unavailable: falls back to the local synthetic dataset.
 *
 * Architecture:
 *   API (backend)  →  dashboardState  →  components (subscribed)
 */

import { INITIAL_TRIALS } from '../data/trialsData.js';
import {
  getTrials,
  getTrial,
  getPortfolioSummary,
  getRecommendation,
  getConfig,
  search as apiSearch,
} from '../services/api.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map a backend TrialCard into the shape the existing components expect. */
function mapApiTrial(t) {
  return {
    id: t.id,
    phase: t.phase?.replace('PHASE_', 'Ph. ') ?? 'Ph. ?',
    title: t.title,
    description: t.title,
    enrolled: t.funnel?.enrolled ?? 0,
    target: t.targetEnrollment ?? 0,
    percentage: Math.round((t.enrollmentProgress ?? 0) * 100),
    estimatedCompletion: t.plannedEnd
      ? new Date(t.plannedEnd).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'TBD',
    region: t.conditionArea ?? 'Unknown',
    indication: t.conditionArea ?? 'Unknown',
    aesTotal: t.aeSummary?.total ?? 0,
    aesSevere: (t.aeSummary?.byGrade?.SEVERE ?? 0) + (t.aeSummary?.byGrade?.CRITICAL ?? 0),
    aesMildMod: (t.aeSummary?.byGrade?.MILD ?? 0) + (t.aeSummary?.byGrade?.MODERATE ?? 0),
    aesUnresolved: t.aeSummary?.unresolved ?? 0,
    nextMilestone: t.nextMilestone?.type ?? 'N/A',
    milestoneDate: t.nextMilestone?.plannedDate
      ? new Date(t.nextMilestone.plannedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    status: mapHealthStatus(t.healthStatus, t.flags),
    statusLabel: mapHealthStatusLabel(t.healthStatus, t.flags),
    funnel: t.funnel ?? { screened: 0, enrolled: 0, active: 0, withdrawn: 0 },
    sponsor: t.sponsor,
    // Backend-enriched fields
    healthScore: t.healthScore,
    healthStatus: t.healthStatus,
    flags: t.flags ?? [],
    flagCount: t.flagCount ?? 0,
    aeSummary: t.aeSummary,
    nextMilestoneObj: t.nextMilestone,
    // These will be populated when the trial is selected and detail is fetched
    milestones: [],
    recommendation: null,
    sites: [],
    patients: [],
    adverseEvents: [],
  };
}

function mapHealthStatus(healthStatus, flags) {
  if (!healthStatus) return 'on_track';
  if (healthStatus === 'CRITICAL') return 'critical';
  if (healthStatus === 'WATCH') return 'attention';
  return 'on_track';
}

function mapHealthStatusLabel(healthStatus, flags) {
  if (!healthStatus) return 'On Track';
  if (healthStatus === 'CRITICAL') return 'Critical';
  if (healthStatus === 'WATCH') return 'Needs Attention';
  return 'On Track';
}

function mapApiTrialDetail(detail, recommendation) {
  const base = mapApiTrial(detail);
  return {
    ...base,
    // Override with full detail data
    sites: (detail.sites ?? []).map((s) => ({
      id: s.id,
      name: s.siteName,
      location: s.region,
      pi: 'Principal Investigator',
      enrolled: s.enrolledSubjects ?? 0,
      target: s.targetEnrollment ?? 0,
      status: s.isNonEnrolling ? 'non-enrolling' : (s.activeSubjects > 0 ? 'active' : 'pending'),
      trajectory: `${s.targetEnrollment > 0 ? Math.round(((s.enrolledSubjects ?? 0) / s.targetEnrollment) * 100) : 0}%`,
      flag: s.isNonEnrolling ? 'Non-enrolling site' : null,
      activeSubjects: s.activeSubjects ?? 0,
      enrolledSubjects: s.enrolledSubjects ?? 0,
      screenFailed: s.screenFailed ?? 0,
      withdrawn: s.withdrawn ?? 0,
      activationDate: s.activationDate,
    })),
    patients: [], // subjects come from subjects endpoint; we use sites for enrollment tab
    adverseEvents: (detail.adverseEvents ?? []).map((ae) => ({
      id: ae.id,
      subjectId: ae.subjectRef,
      site: ae.siteId,
      severity: capitalize(ae.severityGrade?.toLowerCase() ?? 'unknown'),
      grade: `Grade ${gradeFromSeverity(ae.severityGrade)}`,
      term: ae.term,
      date: ae.onsetDate ? new Date(ae.onsetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
      actionTaken: ae.staffRecommendationSeed?.split(';')[0]?.trim() ?? 'Under review',
      status: ae.resolvedDate ? 'Resolved' : 'Active',
      related: ae.suspectedRelationship ?? 'Unknown',
      duration: ae.resolvedDate
        ? `${Math.round((new Date(ae.resolvedDate) - new Date(ae.onsetDate)) / 86400000)} days`
        : 'Ongoing',
      // Full detail fields
      seriousFlag: ae.seriousFlag,
      outcome: ae.outcome,
      drugName: ae.drugName,
      drugClass: ae.drugClass,
      patientAge: ae.patientAge,
      patientSex: ae.patientSex,
      symptoms: ae.symptoms,
      caseSummary: ae.caseSummary,
      eventNarrative: ae.eventNarrative,
      riskFactorsSeed: ae.riskFactorsSeed,
      staffRecommendationSeed: ae.staffRecommendationSeed,
      reviewPrioritySeed: ae.reviewPrioritySeed,
      riskLevelSeed: ae.riskLevelSeed,
    })),
    milestones: (detail.milestones ?? []).map((m) => ({
      id: m.id,
      name: m.type,
      due: m.plannedDate ? new Date(m.plannedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      status: mapMilestoneStatus(m.state),
      dueDays: m.daysUntil ?? 0,
      completed: m.state === 'DONE',
      actualDate: m.actualDate,
      plannedDate: m.plannedDate,
      state: m.state,
      description: `${m.type} milestone`,
    })),
    recommendation: recommendation ? {
      priority: mapPriorityLabel(recommendation.priority),
      priorityLevel: recommendation.priority,
      title: recommendation.title,
      reason: recommendation.reason,
      actionText: recommendation.action,
      actionType: recommendation.sourceType,
      targetSite: recommendation.sourceId,
      traceability: recommendation.traceability,
      aiEnhanced: recommendation.aiEnhanced,
      sourceType: recommendation.sourceType,
      sourceId: recommendation.sourceId,
    } : null,
    // Carry through backend monitoring data
    flags: detail.flags ?? [],
    healthScore: detail.healthScore,
    healthStatus: detail.healthStatus,
    funnel: detail.funnel,
    plannedStart: detail.plannedStart,
    plannedEnd: detail.plannedEnd,
    aeSummary: detail.aeSummary,
  };
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function gradeFromSeverity(sev) {
  const map = { MILD: 1, MODERATE: 2, SEVERE: 3, CRITICAL: 4 };
  return map[sev] ?? 1;
}
function mapMilestoneStatus(state) {
  const map = { DONE: 'completed', DUE_SOON: 'upcoming', OVERDUE: 'overdue', FUTURE: 'pending' };
  return map[state] ?? 'pending';
}
function mapPriorityLabel(priority) {
  const map = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority', none: 'No Action Required' };
  return map[priority] ?? 'Routine';
}

// ── State Class ───────────────────────────────────────────────────────────────

class DashboardState {
  constructor() {
    // Core selections
    this.trials = [];         // mapped trials (from API or local data)
    this.rawApiTrials = [];   // raw TrialCard[] from backend
    this.selectedTrialId = null;
    this.selectedPatientId = null;
    this.selectedEventId = null;
    this.selectedMilestoneId = null;

    // Detail workspace
    this.detailSection = null; // 'enrollment' | 'patients' | 'events' | 'milestones' | null

    // Tab system (kept for backward compat with existing views)
    this.currentTab = 'dashboard';
    this.panelTab = 'overview';

    // Portfolio metrics (from backend)
    this.portfolioSummary = null;

    // Monitoring config (from backend)
    this.monitoringConfig = null;

    // Loading and error states
    this.isLoading = false;
    this.isLoadingDetail = false;
    this.error = null;

    // Backend connectivity
    this.backendConnected = false;

    // Filters
    this.filters = {
      phase: 'ALL',
      status: 'ALL',
      region: 'ALL',
      searchQuery: '',
    };

    // Settings (UI preferences)
    this.settings = {
      enrollmentThreshold: 25,
      saeAlertWindow: 'immediate',
      milestoneHorizon: 30,
      density: 'comfortable',
      emailAlerts: true,
      inAppAlerts: true,
    };

    // Notifications (derived from monitoring flags)
    this.notifications = [
      {
        id: 'notif-1', trialId: 'CT-DEMO-004', type: 'critical',
        title: 'Safety alert: Unresolved serious AE in adalimumab trial',
        desc: 'CT-DEMO-004 has 2 unresolved serious adverse events beyond the 7-day review window.',
        timestamp: '10m ago', read: false, actionTab: 'events', targetId: 'AE-004-001',
      },
      {
        id: 'notif-2', trialId: 'CT-DEMO-001', type: 'critical',
        title: 'Safety alert: Severe hypotension (AE-007865)',
        desc: 'Subject SUBJ-001-0042 at Apollo Hospital experienced severe hypotension requiring resuscitation.',
        timestamp: '1h ago', read: false, actionTab: 'events', targetId: 'AE-007865',
      },
      {
        id: 'notif-3', trialId: 'CT-DEMO-002', type: 'attention',
        title: 'Enrollment shortfall — Pembrolizumab trial',
        desc: 'CT-DEMO-002 is at 45% enrollment vs 62% expected. Site S-002-03 has zero enrollments.',
        timestamp: '3h ago', read: false, actionTab: 'enrollment', targetId: 'S-002-03',
      },
      {
        id: 'notif-4', trialId: 'CT-DEMO-004', type: 'critical',
        title: 'Overdue: DB Lock milestone in adalimumab trial',
        desc: 'The DB Lock milestone for CT-DEMO-004 was due 7 days ago and remains incomplete.',
        timestamp: '1d ago', read: true, actionTab: 'milestones', targetId: 'M-004-05',
      },
    ];

    this.activeModal = null;
    this.listeners = new Set();
  }

  // ── Pub/Sub ──────────────────────────────────────────────────────────────

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event = null) {
    for (const listener of this.listeners) {
      listener(this, event);
    }
  }

  // ── Data Loading ─────────────────────────────────────────────────────────

  /**
   * Load the portfolio from the backend. Called once on boot.
   * Falls back to local INITIAL_TRIALS if the backend is unavailable.
   */
  async loadPortfolio() {
    this.isLoading = true;
    this.error = null;
    this.notify({ type: 'loading_started' });

    try {
      // Try backend first
      const [trialsResult, summaryResult, configResult] = await Promise.all([
        getTrials(),
        getPortfolioSummary(),
        getConfig(),
      ]);

      if (!trialsResult.error && trialsResult.data) {
        this.rawApiTrials = trialsResult.data;
        this.trials = trialsResult.data.map(mapApiTrial);
        this.backendConnected = true;

        // Select the most critical trial by default (first in list = lowest health score)
        if (this.trials.length > 0 && !this.selectedTrialId) {
          // Pick the most critical trial
          const critical = this.trials.find(t => t.healthStatus === 'CRITICAL') ||
                           this.trials.find(t => t.healthStatus === 'WATCH') ||
                           this.trials[0];
          this.selectedTrialId = critical.id;
        }
      } else {
        this._fallbackToLocalData();
      }

      if (!summaryResult.error && summaryResult.data) {
        this.portfolioSummary = summaryResult.data;
      }

      if (!configResult.error && configResult.data) {
        this.monitoringConfig = configResult.data;
      }
    } catch (err) {
      console.warn('[DashboardState] Backend unavailable, using local data:', err.message);
      this._fallbackToLocalData();
    }

    this.isLoading = false;
    this.notify({ type: 'portfolio_loaded' });

    // Load detail for the initially selected trial
    if (this.selectedTrialId) {
      await this._loadTrialDetail(this.selectedTrialId);
    }
  }

  _fallbackToLocalData() {
    this.trials = [...INITIAL_TRIALS];
    this.backendConnected = false;
    if (!this.selectedTrialId && this.trials.length > 0) {
      this.selectedTrialId = 'CT-042';
    }
  }

  /**
   * Load full detail + recommendation for the given trial.
   * Updates the trial in this.trials in-place.
   */
  async _loadTrialDetail(trialId) {
    if (!this.backendConnected) return;

    this.isLoadingDetail = true;
    this.notify({ type: 'detail_loading', trialId });

    try {
      const [detailResult, recResult] = await Promise.all([
        getTrial(trialId),
        getRecommendation(trialId),
      ]);

      if (!detailResult.error && detailResult.data) {
        const rec = !recResult.error ? recResult.data : null;
        const mapped = mapApiTrialDetail(detailResult.data, rec);
        // Update the trial in the list
        const idx = this.trials.findIndex((t) => t.id === trialId);
        if (idx >= 0) {
          this.trials[idx] = { ...this.trials[idx], ...mapped };
        } else {
          this.trials.push(mapped);
        }
      }
    } catch (err) {
      console.warn(`[DashboardState] Failed to load detail for ${trialId}:`, err.message);
    }

    this.isLoadingDetail = false;
    this.notify({ type: 'detail_loaded', trialId });
  }

  // ── Selection ────────────────────────────────────────────────────────────

  async selectTrial(trialId) {
    if (this.selectedTrialId === trialId) return;

    this.selectedTrialId = trialId;
    this.selectedPatientId = null;
    this.selectedEventId = null;
    this.selectedMilestoneId = null;
    this.detailSection = null; // close any open drawer on trial change
    this.panelTab = 'overview';

    this.notify({ type: 'trial_selected', trialId });

    // Fetch full detail if backend is connected and we don't have it yet
    if (this.backendConnected) {
      const existing = this.trials.find((t) => t.id === trialId);
      const needsDetail = !existing?.adverseEvents?.length && !existing?.milestones?.length;
      if (needsDetail) {
        await this._loadTrialDetail(trialId);
      }
    }
  }

  openDetail(section) {
    this.detailSection = section;
    this.notify({ type: 'detail_opened', section });
  }

  closeDetail() {
    this.detailSection = null;
    this.selectedPatientId = null;
    this.selectedEventId = null;
    this.selectedMilestoneId = null;
    this.notify({ type: 'detail_closed' });
  }

  selectPatient(patientId) {
    this.selectedPatientId = patientId;
    this.notify({ type: 'patient_selected', patientId });
  }

  selectEvent(eventId) {
    this.selectedEventId = eventId;
    this.notify({ type: 'event_selected', eventId });
  }

  selectMilestone(milestoneId) {
    this.selectedMilestoneId = milestoneId;
    this.notify({ type: 'milestone_selected', milestoneId });
  }

  setPanelTab(tab) {
    if (this.panelTab !== tab) {
      this.panelTab = tab;
      this.selectedPatientId = null;
      this.selectedEventId = null;
      this.notify({ type: 'panel_tab_changed', tab });
    }
  }

  setTab(tabName) {
    if (this.currentTab !== tabName) {
      this.currentTab = tabName;
      this.notify({ type: 'main_tab_changed', tab: tabName });
    }
  }

  // ── Filters ──────────────────────────────────────────────────────────────

  async setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };

    if (this.backendConnected) {
      // Reload from backend with new filters
      const result = await getTrials({
        phase: this.filters.phase !== 'ALL' ? this.filters.phase : undefined,
        status: this.filters.status !== 'ALL' ? this.filters.status : undefined,
        region: this.filters.region !== 'ALL' ? this.filters.region : undefined,
        q: this.filters.searchQuery || undefined,
      });
      if (!result.error && result.data) {
        this.rawApiTrials = result.data;
        this.trials = result.data.map(mapApiTrial);
        if (this.trials.length > 0 && !this.trials.some((t) => t.id === this.selectedTrialId)) {
          this.selectedTrialId = this.trials[0].id;
        }
      }
    } else {
      // Local filter
      const filtered = this.getFilteredTrials();
      if (filtered.length > 0 && !filtered.some((t) => t.id === this.selectedTrialId)) {
        this.selectedTrialId = filtered[0].id;
      }
    }

    this.notify({ type: 'filters_changed' });
  }

  async setSearchQuery(query) {
    this.filters.searchQuery = query;

    if (this.backendConnected && query.trim()) {
      // Use dedicated search endpoint for rich cross-entity results
      const result = await apiSearch(query);
      if (!result.error && result.data) {
        this.notify({ type: 'search_results', results: result.data, query });
        return;
      }
    }

    // Fallback: filter local trials
    const filtered = this.getFilteredTrials();
    if (filtered.length > 0 && !filtered.some((t) => t.id === this.selectedTrialId)) {
      this.selectedTrialId = filtered[0].id;
    }
    this.notify({ type: 'search_changed', query });
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  getFilteredTrials() {
    return this.trials.filter((trial) => {
      if (this.filters.phase !== 'ALL') {
        const p = trial.phase?.replace('Ph. ', '').trim();
        if (!p?.includes(this.filters.phase.replace('PHASE_', ''))) return false;
      }
      if (this.filters.status !== 'ALL') {
        if (trial.status !== this.filters.status && trial.statusLabel !== this.filters.status) return false;
      }
      if (this.filters.region !== 'ALL') {
        if (!trial.region?.toLowerCase().includes(this.filters.region.toLowerCase()) &&
            !trial.indication?.toLowerCase().includes(this.filters.region.toLowerCase())) return false;
      }
      if (this.filters.searchQuery?.trim()) {
        const q = this.filters.searchQuery.toLowerCase().trim();
        const match =
          trial.id?.toLowerCase().includes(q) ||
          trial.title?.toLowerCase().includes(q) ||
          trial.indication?.toLowerCase().includes(q) ||
          trial.region?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  getSelectedTrial() {
    const selected = this.trials.find((t) => t.id === this.selectedTrialId);
    if (selected) return selected;
    return this.trials[0] ?? null;
  }

  getMetrics() {
    // Use backend portfolio summary when available
    if (this.portfolioSummary) {
      return {
        totalTrials: this.portfolioSummary.totalTrials,
        totalEnrollment: this.portfolioSummary.enrolledSubjects,
        activeAdverseEvents: this.portfolioSummary.unresolvedEvents,
        upcomingMilestones: 6, // TODO: compute from trial details
        aeWeekChange: `+${this.portfolioSummary.unresolvedEvents > 0 ? Math.min(3, this.portfolioSummary.unresolvedEvents) : 0} this week`,
      };
    }

    // Fallback: compute from local trial array
    const filtered = this.getFilteredTrials();
    if (
      this.filters.phase === 'ALL' &&
      this.filters.status === 'ALL' &&
      this.filters.region === 'ALL' &&
      !this.filters.searchQuery
    ) {
      return {
        totalTrials: this.trials.length || 12,
        totalEnrollment: this.trials.reduce((a, t) => a + (t.enrolled ?? 0), 0) || 842,
        activeAdverseEvents: this.trials.reduce((a, t) => a + (t.aesUnresolved ?? 0), 0) || 18,
        upcomingMilestones: 6,
        aeWeekChange: '+3 this week',
      };
    }

    return {
      totalTrials: filtered.length,
      totalEnrollment: filtered.reduce((a, t) => a + (t.enrolled ?? 0), 0),
      activeAdverseEvents: filtered.reduce((a, t) => a + (t.aesTotal ?? 0), 0),
      upcomingMilestones: filtered.reduce((a, t) => a + (t.milestones?.filter((m) => !m.completed).length ?? 0), 0),
      aeWeekChange: `+${Math.min(3, filtered.reduce((a, t) => a + (t.aesTotal ?? 0), 0))} this week`,
    };
  }

  // ── Notifications ────────────────────────────────────────────────────────

  markNotificationRead(id) {
    const n = this.notifications.find((n) => n.id === id);
    if (n) { n.read = true; this.notify({ type: 'notifications_updated' }); }
  }

  markAllNotificationsRead() {
    this.notifications.forEach((n) => { n.read = true; });
    this.notify({ type: 'notifications_updated' });
  }

  getUnreadNotificationsCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.notify({ type: 'settings_updated', settings: this.settings });
  }

  // ── Modals ───────────────────────────────────────────────────────────────

  openModal(type, data = null) {
    this.activeModal = { type, data };
    this.notify({ type: 'modal_opened', modal: type });
  }

  closeModal() {
    this.activeModal = null;
    this.notify({ type: 'modal_closed' });
  }

  // ── Search (local, used as fallback) ─────────────────────────────────────

  searchDataset(query) {
    if (!query?.trim()) return { trials: [], patients: [], events: [] };
    const q = query.toLowerCase().trim();

    const matchedTrials = this.trials.filter((t) =>
      t.id?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.indication?.toLowerCase().includes(q) ||
      t.region?.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedPatients = [];
    const matchedEvents = [];

    for (const trial of this.trials) {
      if (trial.patients) {
        for (const p of trial.patients) {
          if (p.id?.toLowerCase().includes(q) || p.site?.toLowerCase().includes(q)) {
            matchedPatients.push({ ...p, trialId: trial.id });
            if (matchedPatients.length >= 4) break;
          }
        }
      }
      if (trial.adverseEvents) {
        for (const ae of trial.adverseEvents) {
          if (ae.id?.toLowerCase().includes(q) || ae.term?.toLowerCase().includes(q)) {
            matchedEvents.push({ ...ae, trialId: trial.id });
            if (matchedEvents.length >= 4) break;
          }
        }
      }
    }

    return { trials: matchedTrials, patients: matchedPatients, events: matchedEvents };
  }
}

export const dashboardState = new DashboardState();
