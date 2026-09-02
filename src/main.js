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

// Views
import { renderTrialsView } from './components/views/trialsView.js';
import { renderAnalyticsView } from './components/views/analyticsView.js';
import { renderDocumentsView } from './components/views/documentsView.js';
import { renderSettingsView } from './components/views/settingsView.js';
import { renderSupportView } from './components/views/supportView.js';

let isInitialRender = true;

function renderDashboardLayout(mainContent) {
  mainContent.innerHTML = `
    <!-- Page Title Area -->
    <div class="mb-5 select-none flex justify-between items-center">
      <div>
        <h2 class="font-headline-md text-headline-md font-bold text-on-background">Clinical Trials Dashboard</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Overview of active synthetic cohorts and real-time monitoring workspace.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2 text-xs text-on-surface-variant">
        <span class="inline-flex items-center gap-1 bg-surface-alternate px-2.5 py-1 rounded-DEFAULT border border-border-soft">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Live Monitoring Active
        </span>
      </div>
    </div>

    <!-- Summary Metrics Strip -->
    <div id="metrics-strip-container"></div>

    <!-- Three-part Monitoring Workspace Grid (Inbox layout) -->
    <div class="grid grid-cols-12 gap-4 h-[calc(100vh-270px)] min-h-[540px]">
      <!-- Left/Center: Trial Monitoring Roster (8 cols) -->
      <div id="trial-table-container" class="col-span-8 h-full"></div>

      <!-- Right: Selected Trial Workspace Panel (4 cols) -->
      <div id="inspection-panel-container" class="col-span-4 h-full"></div>
    </div>
  `;
}

function handleStateUpdate(state, event) {
  const sidebarContainer = document.getElementById('sidebar-container');
  const headerContainer = document.getElementById('header-container');
  const mainContent = document.getElementById('main-content');
  const modalContainer = document.getElementById('modal-container');

  const currentTab = state.currentTab;

  // Handle Modals
  if (modalContainer) {
    modalContainer.innerHTML = '';
    const modal = state.activeModal;
    if (modal) {
      if (modal.type === 'enrollment') {
        renderEnrollmentModal(modalContainer, modal.data || state.getSelectedTrial());
      } else if (modal.type === 'ae') {
        renderAeReportModal(modalContainer, modal.data || state.getSelectedTrial());
      } else if (modal.type === 'milestone') {
        renderMilestoneModal(modalContainer, modal.data);
      } else if (modal.type === 'filter') {
        renderFilterPopover(modalContainer);
      } else if (modal.type === 'demo_dataset' || modal.type === 'notifications') {
        renderDemoDatasetModal(modalContainer);
      }
      return;
    }
  }

  // Fast In-Place Trial Selection (Gmail-like behavior)
  if (event && event.type === 'trial_selected') {
    const trialTableContainer = document.getElementById('trial-table-container');
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');

    if (trialTableContainer && inspectionPanelContainer) {
      updateTableSelection(trialTableContainer, state.selectedTrialId);
      renderInspectionPanel(inspectionPanelContainer);
      return;
    }
  }

  // Fast In-Place Panel Tab / Inline Drill-down
  if (event && (event.type === 'panel_tab_changed' || event.type === 'patient_selected' || event.type === 'event_selected')) {
    const inspectionPanelContainer = document.getElementById('inspection-panel-container');
    if (inspectionPanelContainer) {
      renderInspectionPanel(inspectionPanelContainer);
      return;
    }
  }

  // If we're on the dashboard tab
  if (currentTab === 'dashboard') {
    // Check if dashboard layout already exists in DOM
    let metricsStripContainer = document.getElementById('metrics-strip-container');
    let trialTableContainer = document.getElementById('trial-table-container');
    let inspectionPanelContainer = document.getElementById('inspection-panel-container');

    if (!trialTableContainer || !inspectionPanelContainer || isInitialRender || (event && event.type === 'main_tab_changed')) {
      renderDashboardLayout(mainContent);
      metricsStripContainer = document.getElementById('metrics-strip-container');
      trialTableContainer = document.getElementById('trial-table-container');
      inspectionPanelContainer = document.getElementById('inspection-panel-container');
      isInitialRender = false;
    }

    if (metricsStripContainer) renderMetricsStrip(metricsStripContainer);
    if (trialTableContainer) renderTrialTable(trialTableContainer);
    if (inspectionPanelContainer) renderInspectionPanel(inspectionPanelContainer);

  } else {
    // Switch to other views
    if (sidebarContainer) renderSidebar(sidebarContainer);
    if (headerContainer) renderHeader(headerContainer);

    if (currentTab === 'trials') {
      renderTrialsView(mainContent);
    } else if (currentTab === 'analytics') {
      renderAnalyticsView(mainContent);
    } else if (currentTab === 'documents') {
      renderDocumentsView(mainContent);
    } else if (currentTab === 'settings') {
      renderSettingsView(mainContent);
    } else if (currentTab === 'support') {
      renderSupportView(mainContent);
    }
  }

  // Always keep sidebar active state updated
  if (sidebarContainer) renderSidebar(sidebarContainer);
  if (headerContainer) renderHeader(headerContainer);
}

// Initial Boot & Subscription
document.addEventListener('DOMContentLoaded', () => {
  handleStateUpdate(dashboardState, null);
  dashboardState.subscribe((state, event) => {
    handleStateUpdate(state, event);
  });
});
