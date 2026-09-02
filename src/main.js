import { dashboardState } from './state/dashboardState.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHeader } from './components/header.js';
import { renderMetricsStrip } from './components/metricsStrip.js';
import { renderTrialTable, updateTableSelection } from './components/trialTable.js';
import { renderInspectionPanel } from './components/inspectionPanel.js';

// Modals
import { renderEnrollmentModal } from './components/modals/enrollmentModal.js';
import { renderAeReportModal } from './components/modals/aeReportModal.js';
import { renderMilestoneModal } from './components/modals/milestoneModal.js';
import { renderFilterPopover } from './components/modals/filterPopover.js';
import { renderDemoDatasetModal } from './components/modals/demoDatasetModal.js';
import { renderNotificationsModal } from './components/modals/notificationsModal.js';
import { renderHelpModal } from './components/modals/helpModal.js';
import { renderProfileModal } from './components/modals/profileModal.js';
import { renderDocumentPreviewModal } from './components/modals/documentPreviewModal.js';
import { renderSignOutModal } from './components/modals/signOutModal.js';

// Views
import { renderTrialsView } from './components/views/trialsView.js';
import { renderAnalyticsView } from './components/views/analyticsView.js';
import { renderDocumentsView } from './components/views/documentsView.js';
import { renderSettingsView } from './components/views/settingsView.js';
import { renderSupportView } from './components/views/supportView.js';

let isInitialRender = true;

// ── Loading skeleton ──────────────────────────────────────────────────────────
function renderLoadingSkeleton(container, message = 'Loading...') {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant select-none">
      <div class="flex gap-1">
        <span class="w-2 h-2 rounded-full bg-primary opacity-60 animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-2 h-2 rounded-full bg-primary opacity-60 animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-2 h-2 rounded-full bg-primary opacity-60 animate-bounce" style="animation-delay:300ms"></span>
      </div>
      <p class="font-body-sm text-body-sm">${message}</p>
    </div>
  `;
}

// ── Error state ───────────────────────────────────────────────────────────────
function renderErrorState(container, message) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full gap-3 text-on-surface-variant select-none p-6 text-center">
      <svg class="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <p class="font-label-sm text-label-sm text-on-surface">${message}</p>
      <p class="font-body-xs text-body-xs">Dashboard is showing cached data.</p>
    </div>
  `;
}

// ── Backend connectivity badge ────────────────────────────────────────────────
function renderConnectivityBadge() {
  const badge = document.getElementById('backend-status-badge');
  if (!badge) return;
  if (dashboardState.backendConnected) {
    badge.innerHTML = `
      <span class="inline-flex items-center gap-1 bg-surface-alternate px-2.5 py-1 rounded-DEFAULT border border-border-soft text-xs text-on-surface-variant">
        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        API Connected · Supabase Live
      </span>`;
  } else {
    badge.innerHTML = `
      <span class="inline-flex items-center gap-1 bg-surface-alternate px-2.5 py-1 rounded-DEFAULT border border-border-soft text-xs text-on-surface-variant">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Offline Mode · Local Data
      </span>`;
  }
}

// ── Dashboard layout ──────────────────────────────────────────────────────────
function renderDashboardLayout(mainContent) {
  mainContent.innerHTML = `
    <!-- Page Title Area -->
    <div class="mb-4 select-none flex justify-between items-center">
      <div>
        <h2 class="font-headline-md text-headline-md font-bold text-on-background">Clinical Trials Dashboard</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Overview of active synthetic cohorts and real-time monitoring workspace.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2" id="backend-status-badge">
        <span class="inline-flex items-center gap-1 bg-surface-alternate px-2.5 py-1 rounded-DEFAULT border border-border-soft text-xs text-on-surface-variant">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Connecting...
        </span>
      </div>
    </div>

    <!-- Summary Metrics Strip -->
    <div id="metrics-strip-container"></div>

    <!-- Gmail-style Workspace: 30% Trial List | 70% Selected Trial Workspace -->
    <div style="display:grid; grid-template-columns: minmax(260px, 30%) 1fr; gap: 16px; height: calc(100vh - 260px); min-height: 560px;">
      <!-- Left: Compact Trial Monitoring Roster (~30%) -->
      <div id="trial-table-container" class="h-full min-w-0"></div>

      <!-- Right: Primary Selected Trial Workspace (~70%) -->
      <div id="inspection-panel-container" class="h-full min-w-0"></div>
    </div>
  `;
}

// ── State update handler ──────────────────────────────────────────────────────
function handleStateUpdate(state, event) {
  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer = document.getElementById('header-container');
  const mainContent = document.getElementById('main-content');
  const modalContainer = document.getElementById('modal-container');

  const currentTab = state.currentTab;

  // ── Modals ───────────────────────────────────────────────────────────────
  if (modalContainer) {
    modalContainer.innerHTML = '';
    const modal = state.activeModal;
    if (modal) {
      if (modal.type === 'enrollment') renderEnrollmentModal(modalContainer, modal.data || state.getSelectedTrial());
      else if (modal.type === 'ae') renderAeReportModal(modalContainer, modal.data || state.getSelectedTrial());
      else if (modal.type === 'milestone') renderMilestoneModal(modalContainer, modal.data);
      else if (modal.type === 'filter') renderFilterPopover(modalContainer);
      else if (modal.type === 'demo_dataset') renderDemoDatasetModal(modalContainer);
      else if (modal.type === 'notifications') renderNotificationsModal(modalContainer);
      else if (modal.type === 'help') renderHelpModal(modalContainer);
      else if (modal.type === 'profile') renderProfileModal(modalContainer);
      else if (modal.type === 'document_preview') renderDocumentPreviewModal(modalContainer, modal.data);
      else if (modal.type === 'sign_out') renderSignOutModal(modalContainer);
      return;
    }
  }

  // ── Loading state (initial API fetch) ───────────────────────────────────
  if (event?.type === 'loading_started') {
    const trialTableContainer = document.getElementById('trial-table-container');
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (trialTableContainer) renderLoadingSkeleton(trialTableContainer, 'Loading trials...');
    if (inspectionPanelContainer) renderLoadingSkeleton(inspectionPanelContainer, 'Connecting to backend...');
    return;
  }

  // ── Portfolio loaded (first full render after API) ───────────────────────
  if (event?.type === 'portfolio_loaded') {
    renderConnectivityBadge();
    const trialTableContainer = document.getElementById('trial-table-container');
    const metricsStripContainer = document.getElementById('metrics-strip-container');
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (trialTableContainer) renderTrialTable(trialTableContainer);
    if (metricsStripContainer) renderMetricsStrip(metricsStripContainer);
    if (inspectionPanelContainer) renderLoadingSkeleton(inspectionPanelContainer, 'Loading trial detail...');
    if (sidebarContainer) renderSidebar(sidebarContainer);
    if (headerContainer) renderHeader(headerContainer);
    return;
  }

  // ── Detail loaded (trial detail + recommendation fetched) ───────────────
  if (event?.type === 'detail_loaded') {
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (inspectionPanelContainer) renderInspectionPanel(inspectionPanelContainer);
    if (headerContainer) renderHeader(headerContainer);
    return;
  }

  // ── Detail loading (skeleton while fetching detail) ──────────────────────
  if (event?.type === 'detail_loading') {
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (inspectionPanelContainer) {
      // Immediately show overview with loading recommendation state
      renderInspectionPanel(inspectionPanelContainer);
    }
    return;
  }

  // ── Fast in-place trial selection (Gmail-like) ───────────────────────────
  if (event?.type === 'trial_selected') {
    const trialTableContainer = document.getElementById('trial-table-container');
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (trialTableContainer && inspectionPanelContainer) {
      updateTableSelection(trialTableContainer, state.selectedTrialId);
      renderInspectionPanel(inspectionPanelContainer);
      if (headerContainer) renderHeader(headerContainer);
      return;
    }
  }

  // ── In-place panel updates (tab change, patient/event selection) ─────────
  if (event && (
    event.type === 'panel_tab_changed' ||
    event.type === 'patient_selected' ||
    event.type === 'event_selected' ||
    event.type === 'milestone_selected' ||
    event.type === 'detail_opened' ||
    event.type === 'detail_closed'
  )) {
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (inspectionPanelContainer) {
      renderInspectionPanel(inspectionPanelContainer);
      return;
    }
  }

  // ── Filters changed — re-render trial list + metrics ───────────────────
  if (event?.type === 'filters_changed' || event?.type === 'search_changed') {
    const trialTableContainer = document.getElementById('trial-table-container');
    const metricsStripContainer = document.getElementById('metrics-strip-container');
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (trialTableContainer) renderTrialTable(trialTableContainer);
    if (metricsStripContainer) renderMetricsStrip(metricsStripContainer);
    if (inspectionPanelContainer) renderInspectionPanel(inspectionPanelContainer);
    return;
  }

  // ── Dashboard tab ────────────────────────────────────────────────────────
  if (currentTab === 'dashboard') {
    let metricsStripContainer = document.getElementById('metrics-strip-container');
    let trialTableContainer = document.getElementById('trial-table-container');
    let inspectionPanelContainer = document.getElementById('inspection-panel-container');

    if (!trialTableContainer || !inspectionPanelContainer || isInitialRender || event?.type === 'main_tab_changed') {
      renderDashboardLayout(mainContent);
      metricsStripContainer = document.getElementById('metrics-strip-container');
      trialTableContainer = document.getElementById('trial-table-container');
      inspectionPanelContainer = document.getElementById('inspection-panel-container');
      isInitialRender = false;
    }

    if (metricsStripContainer) renderMetricsStrip(metricsStripContainer);
    if (trialTableContainer) {
      if (state.isLoading) {
        renderLoadingSkeleton(trialTableContainer, 'Loading trials...');
      } else {
        renderTrialTable(trialTableContainer);
      }
    }
    if (inspectionPanelContainer) {
      if (state.isLoading) {
        renderLoadingSkeleton(inspectionPanelContainer, 'Connecting to API...');
      } else {
        renderInspectionPanel(inspectionPanelContainer);
      }
    }
  } else {
    // Other views
    if (currentTab === 'trials') renderTrialsView(mainContent);
    else if (currentTab === 'analytics') renderAnalyticsView(mainContent);
    else if (currentTab === 'documents') renderDocumentsView(mainContent);
    else if (currentTab === 'settings') renderSettingsView(mainContent);
    else if (currentTab === 'support') renderSupportView(mainContent);
  }

  // Always keep sidebar and header updated
  if (sidebarContainer) renderSidebar(sidebarContainer);
  if (headerContainer) renderHeader(headerContainer);
}

// ── Global keyboard shortcuts ─────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (dashboardState.activeModal) {
      dashboardState.closeModal();
    } else if (dashboardState.detailSection) {
      dashboardState.closeDetail();
    }
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render the shell immediately with loading states
  handleStateUpdate(dashboardState, null);

  // Subscribe to all future state changes
  dashboardState.subscribe((state, event) => {
    handleStateUpdate(state, event);
  });

  // Kick off async portfolio load (connects to backend API)
  dashboardState.loadPortfolio().catch((err) => {
    console.error('[Boot] Portfolio load failed:', err);
  });
});
