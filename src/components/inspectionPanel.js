import { dashboardState } from '../state/dashboardState.js';

export function renderInspectionPanel(container) {
  const trial = dashboardState.getSelectedTrial();

  if (!trial) {
    container.innerHTML = `
      <div class="h-full bg-surface-content border border-border-soft rounded-DEFAULT p-6 flex items-center justify-center text-on-surface-variant">
        Select a trial to inspect details
      </div>
    `;
    return;
  }

  const activeTab = dashboardState.panelTab || 'overview';
  const selectedPatientId = dashboardState.selectedPatientId;
  const selectedEventId = dashboardState.selectedEventId;

  // Derive dynamic recommendation
  let rec = trial.recommendation;
  if (!rec) {
    if (trial.aesSevere > 0) {
      rec = {
        priority: "High Priority",
        priorityLevel: "high",
        title: `Review ${trial.id} severe safety events`,
        reason: `${trial.aesSevere} active severe adverse event requires medical monitor clearance.`,
        actionText: "Review Adverse Events",
        actionType: "events"
      };
    } else if (trial.percentage < 80) {
      rec = {
        priority: "High Priority",
        priorityLevel: "high",
        title: `Prioritize ${trial.id} enrollment review`,
        reason: "Enrollment is currently below the expected trajectory. Review site-level enrollment pacing.",
        actionText: "Review Enrollment",
        actionType: "patients"
      };
    } else {
      rec = {
        priority: "Low Priority",
        priorityLevel: "low",
        title: "Continue routine monitoring",
        reason: "Study milestones and subject enrollment remain on schedule.",
        actionText: "View Overview",
        actionType: "overview"
      };
    }
  }

  const priorityBadgeColor = rec.priorityLevel === 'high' 
    ? 'text-on-tertiary-container bg-surface-content border-border-soft'
    : rec.priorityLevel === 'medium'
      ? 'text-primary bg-surface-content border-border-soft'
      : 'text-on-surface-variant bg-surface-content border-border-soft';

  const statusBg = trial.status === 'critical' 
    ? 'bg-critical' 
    : trial.status === 'attention' 
      ? 'bg-on-tertiary-container' 
      : 'bg-primary';

  const statusTitle = trial.status === 'critical'
    ? 'Critical Attention'
    : trial.status === 'attention'
      ? 'Attention Needed'
      : 'On Track';

  const funnel = trial.funnel || {
    screened: Math.round(trial.enrolled * 1.15),
    enrolled: trial.enrolled,
    active: Math.round(trial.enrolled * 0.96),
    withdrawn: Math.round(trial.enrolled * 0.04)
  };

  container.innerHTML = `
    <div class="h-full bg-surface-content border border-border-soft rounded-DEFAULT flex flex-col overflow-hidden shadow-none select-none transition-opacity duration-150">
      <!-- Trial Header -->
      <div class="p-3.5 border-b border-border-soft bg-surface-alternate">
        <div class="flex justify-between items-start mb-1">
          <div class="flex items-center gap-2">
            <h3 class="font-headline-sm text-headline-sm font-bold text-primary">${trial.id}</h3>
            <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant font-medium">
              Ph. ${trial.phase}
            </span>
            <div class="flex items-center gap-1 text-xs text-on-surface-variant ml-1">
              <span class="inline-block w-2 h-2 rounded-full ${statusBg}" title="${statusTitle}"></span>
              <span class="font-label-sm text-label-sm">${trial.statusLabel || statusTitle}</span>
            </div>
          </div>
        </div>
        <p class="font-body-sm text-body-sm text-on-surface-variant leading-tight line-clamp-2">${trial.description}</p>

        <!-- Segmented Internal Navigation Tabs -->
        <div class="flex items-center gap-1 mt-3 bg-surface-base p-0.5 border border-border-soft rounded-DEFAULT text-xs">
          <button data-panel-tab="overview" class="flex-1 py-1 px-2 text-center rounded-DEFAULT font-label-sm transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-surface-content text-primary font-semibold shadow-xs border border-border-soft/60'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
          }">
            Overview
          </button>
          <button data-panel-tab="patients" class="flex-1 py-1 px-2 text-center rounded-DEFAULT font-label-sm transition-colors cursor-pointer ${
            activeTab === 'patients'
              ? 'bg-surface-content text-primary font-semibold shadow-xs border border-border-soft/60'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
          }">
            Patients (${funnel.enrolled})
          </button>
          <button data-panel-tab="events" class="flex-1 py-1 px-2 text-center rounded-DEFAULT font-label-sm transition-colors cursor-pointer ${
            activeTab === 'events'
              ? 'bg-surface-content text-primary font-semibold shadow-xs border border-border-soft/60'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
          }">
            Events (${trial.aesTotal})
          </button>
          <button data-panel-tab="milestones" class="flex-1 py-1 px-2 text-center rounded-DEFAULT font-label-sm transition-colors cursor-pointer ${
            activeTab === 'milestones'
              ? 'bg-surface-content text-primary font-semibold shadow-xs border border-border-soft/60'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
          }">
            Milestones (${trial.milestones?.length || 0})
          </button>
        </div>
      </div>

      <!-- Panel Body Container (Scrollable) -->
      <div id="panel-content-area" class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        ${renderTabContent(trial, activeTab, selectedPatientId, selectedEventId, rec, priorityBadgeColor, funnel)}
      </div>

      <!-- Footer Disclaimer -->
      <div class="p-2.5 bg-surface-base border-t border-border-soft text-center flex-shrink-0">
        <p class="font-label-sm text-label-sm text-outline flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[12px]">info</span> All data is synthetic for demonstration
        </p>
      </div>
    </div>
  `;

  bindPanelEvents(container, trial, rec);
}

function renderTabContent(trial, tab, selectedPatientId, selectedEventId, rec, priorityBadgeColor, funnel) {
  if (tab === 'patients') {
    return renderPatientsView(trial, selectedPatientId, funnel);
  }
  if (tab === 'events') {
    return renderEventsView(trial, selectedEventId);
  }
  if (tab === 'milestones') {
    return renderMilestonesView(trial);
  }
  return renderOverviewView(trial, rec, priorityBadgeColor, funnel);
}

// -------------------------------------------------------------
// TAB 1: OVERVIEW VIEW
// -------------------------------------------------------------
function renderOverviewView(trial, rec, priorityBadgeColor, funnel) {
  return `
    <!-- Section 1: Enrollment Status -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-on-surface-variant">group_add</span> Enrollment Status
        </h4>
        <button id="tab-goto-patients" class="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium">
          View Sites <span class="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
      <div class="flex justify-between items-end mb-1.5">
        <span class="font-headline-md text-headline-md font-semibold text-on-background">
          ${trial.enrolled} <span class="font-body-sm text-body-sm text-on-surface-variant font-normal">/ ${trial.target}</span>
        </span>
        <span class="font-label-sm text-label-sm text-on-surface-variant font-medium">${trial.percentage}% Target</span>
      </div>
      <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
        <div class="h-full bg-primary transition-all duration-300" style="width: ${trial.percentage}%"></div>
      </div>
      <div class="flex justify-between items-center text-xs text-on-surface-variant mt-1.5">
        <span>Est. Completion: <strong>${trial.estimatedCompletion}</strong></span>
        <span>Region: <strong>${trial.region}</strong></span>
      </div>
    </div>

    <!-- Section 2: Participant Overview Funnel -->
    <div class="border-t border-border-soft pt-3.5">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-on-surface-variant">filter_alt</span> Participant Funnel
        </h4>
        <button id="funnel-inspect-btn" class="font-label-sm text-label-sm text-primary hover:underline cursor-pointer">
          Inspect Roster →
        </button>
      </div>
      <div class="grid grid-cols-4 gap-1.5 bg-surface-base p-2 border border-border-soft rounded-DEFAULT text-center">
        <div>
          <div class="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Screened</div>
          <div class="font-body-sm font-semibold text-on-surface mt-0.5">${funnel.screened}</div>
        </div>
        <div class="border-l border-border-soft">
          <div class="font-label-sm text-label-sm text-primary uppercase font-semibold">Enrolled</div>
          <div class="font-body-sm font-bold text-primary mt-0.5">${funnel.enrolled}</div>
        </div>
        <div class="border-l border-border-soft">
          <div class="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Active</div>
          <div class="font-body-sm font-semibold text-on-surface mt-0.5">${funnel.active}</div>
        </div>
        <div class="border-l border-border-soft">
          <div class="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Withdrawn</div>
          <div class="font-body-sm font-semibold text-on-surface-variant mt-0.5">${funnel.withdrawn}</div>
        </div>
      </div>
    </div>

    <!-- Section 3: Adverse Events Summary -->
    <div class="border-t border-border-soft pt-3.5">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-critical">medical_services</span> Adverse Events (Active)
        </h4>
        ${trial.aesSevere > 0 ? `
          <span class="text-[10px] font-bold text-critical bg-error-container px-1.5 py-0.5 rounded-sm uppercase">Severe Active</span>
        ` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2 mb-2.5">
        <div class="bg-surface-base border border-border-soft p-2 rounded-DEFAULT text-center">
          <div class="font-headline-sm text-headline-sm font-bold text-critical">${trial.aesSevere}</div>
          <div class="font-label-sm text-label-sm text-on-surface-variant uppercase mt-0.5 font-medium">Severe</div>
        </div>
        <div class="bg-surface-base border border-border-soft p-2 rounded-DEFAULT text-center">
          <div class="font-headline-sm text-headline-sm font-semibold text-on-surface">${trial.aesMildMod}</div>
          <div class="font-label-sm text-label-sm text-on-surface-variant uppercase mt-0.5 font-medium">Mild/Mod</div>
        </div>
      </div>
      <button id="tab-goto-events" class="w-full py-1.5 bg-surface-content border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-alternate transition-colors cursor-pointer text-center font-medium">
        View AE Reports
      </button>
    </div>

    <!-- Section 4: Upcoming Milestones -->
    <div class="border-t border-border-soft pt-3.5">
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-on-surface-variant">flag</span> Milestones
        </h4>
        <button id="tab-goto-milestones" class="font-label-sm text-label-sm text-primary hover:underline cursor-pointer">
          View All →
        </button>
      </div>
      <ul class="space-y-2.5 relative before:absolute before:inset-y-2 before:left-[5px] before:w-[1px] before:bg-border-soft">
        ${trial.milestones.map((m, idx) => {
          const isActive = m.status === 'active' || idx === 0;
          return `
            <li data-milestone-target="${m.name}" class="relative pl-5 cursor-pointer group">
              <div class="absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 ${isActive ? 'border-primary bg-surface-content' : 'border-border-soft bg-surface-content'} group-hover:border-primary transition-colors"></div>
              <p class="font-body-sm text-body-sm ${isActive ? 'font-medium text-on-surface' : 'text-on-surface-variant'} group-hover:text-primary transition-colors">${m.name}</p>
              ${m.dueDays ? `<p class="font-label-sm text-label-sm text-on-surface-variant">Due in ${m.dueDays} days (${m.due})</p>` : `<p class="font-label-sm text-label-sm text-on-surface-variant">${m.due}</p>`}
            </li>
          `;
        }).join('')}
      </ul>
    </div>

    <!-- Section 5: Operational Recommendation Block -->
    <div class="mt-1 bg-surface-container-low border border-border-soft rounded-DEFAULT p-3.5">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="material-symbols-outlined text-on-tertiary-container text-sm">priority_high</span>
        <h5 class="font-label-md text-label-md font-semibold text-on-background uppercase tracking-wider">Recommendation</h5>
        <span class="ml-auto px-1.5 py-0.5 border text-[9px] uppercase tracking-wider font-semibold rounded-sm ${priorityBadgeColor}">
          ${rec.priority}
        </span>
      </div>
      <p class="font-body-sm text-body-sm font-semibold text-on-surface mb-1">${rec.title}</p>
      <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-3 text-xs">
        ${rec.reason}
      </p>
      <button id="rec-action-btn" class="w-full py-2 bg-primary text-on-primary font-label-md text-label-md font-medium rounded-DEFAULT hover:bg-primary-container transition-colors shadow-none cursor-pointer">
        ${rec.actionText}
      </button>
    </div>
  `;
}

// -------------------------------------------------------------
// TAB 2: PATIENTS & SITES DETAIL VIEW
// -------------------------------------------------------------
function renderPatientsView(trial, selectedPatientId, funnel) {
  const patients = trial.patients || [];
  const sites = trial.sites || [];
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  if (selectedPatient) {
    return `
      <div>
        <button id="back-to-patient-list" class="text-xs text-primary font-medium hover:underline flex items-center gap-1 mb-3 cursor-pointer">
          <span class="material-symbols-outlined text-xs">arrow_back</span> Back to Patient List
        </button>

        <div class="border border-border-soft rounded-DEFAULT bg-surface-base p-3.5 space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Participant Dossier</span>
              <h4 class="font-headline-sm text-headline-sm font-bold text-primary">${selectedPatient.id}</h4>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${selectedPatient.site}</p>
            </div>
            <span class="px-2 py-0.5 rounded-DEFAULT text-xs font-semibold ${
              selectedPatient.status === 'Active' 
                ? 'bg-primary-fixed text-primary' 
                : selectedPatient.status === 'Withdrawn'
                  ? 'bg-error-container text-critical'
                  : 'bg-surface-alternate text-on-surface'
            }">
              ${selectedPatient.status}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-soft">
            <div>
              <span class="text-on-surface-variant">Age / Gender:</span>
              <div class="font-semibold text-on-surface">${selectedPatient.age} y/o • ${selectedPatient.gender}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Cohort Arm:</span>
              <div class="font-semibold text-on-surface">${selectedPatient.cohort}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Screened Date:</span>
              <div class="font-semibold text-on-surface">${selectedPatient.screenedDate}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Enrolled Date:</span>
              <div class="font-semibold text-on-surface">${selectedPatient.enrolledDate}</div>
            </div>
          </div>

          <div class="pt-2 border-t border-border-soft">
            <span class="text-xs font-semibold text-on-surface uppercase">Clinical Monitoring Notes</span>
            <p class="text-xs text-on-surface-variant mt-1 leading-relaxed bg-surface-content p-2.5 border border-border-soft rounded-DEFAULT">
              ${selectedPatient.notes}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      <!-- Funnel Stats Bar -->
      <div class="grid grid-cols-4 gap-1.5 bg-surface-base p-2 border border-border-soft rounded-DEFAULT text-center text-xs">
        <div>
          <span class="text-on-surface-variant">Screened</span>
          <div class="font-bold text-on-surface">${funnel.screened}</div>
        </div>
        <div class="border-l border-border-soft">
          <span class="text-primary font-medium">Enrolled</span>
          <div class="font-bold text-primary">${funnel.enrolled}</div>
        </div>
        <div class="border-l border-border-soft">
          <span class="text-on-surface-variant">Active</span>
          <div class="font-bold text-on-surface">${funnel.active}</div>
        </div>
        <div class="border-l border-border-soft">
          <span class="text-on-surface-variant">Withdrawn</span>
          <div class="font-bold text-on-surface-variant">${funnel.withdrawn}</div>
        </div>
      </div>

      <!-- Participating Sites Breakdown -->
      <div>
        <h4 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-2">Participating Sites</h4>
        <div class="space-y-1.5">
          ${sites.map(s => {
            const isFlagged = s.status === 'flagged';
            return `
              <div class="p-2 border rounded-DEFAULT text-xs ${isFlagged ? 'bg-error-container/15 border-error-container' : 'bg-surface-base border-border-soft'}">
                <div class="flex justify-between items-center">
                  <div class="font-medium text-on-surface">${s.name}</div>
                  <span class="font-semibold ${isFlagged ? 'text-critical' : 'text-primary'}">${s.enrolled} / ${s.target} (${s.trajectory})</span>
                </div>
                <div class="text-on-surface-variant text-[11px] mt-0.5">${s.pi} • ${s.location}</div>
                ${isFlagged ? `<div class="text-critical text-[11px] font-medium mt-1">${s.flag}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Participant Roster Table -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">Patient Cohort Roster</h4>
          <span class="text-[11px] text-on-surface-variant">Click row to inspect</span>
        </div>
        <div class="border border-border-soft rounded-DEFAULT overflow-hidden">
          <div class="grid grid-cols-12 gap-1 px-2.5 py-1.5 bg-surface-alternate font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">
            <div class="col-span-3">Participant</div>
            <div class="col-span-4">Site</div>
            <div class="col-span-3">Enrolled</div>
            <div class="col-span-2 text-right">Status</div>
          </div>
          <div class="divide-y divide-border-soft text-xs">
            ${patients.map(p => `
              <div data-patient-row="${p.id}" class="grid grid-cols-12 gap-1 px-2.5 py-2 items-center hover:bg-surface-alternate transition-colors cursor-pointer">
                <div class="col-span-3 font-mono font-medium text-primary">${p.id}</div>
                <div class="col-span-4 truncate text-on-surface-variant" title="${p.site}">${p.site}</div>
                <div class="col-span-3 text-on-surface-variant text-[11px]">${p.enrolledDate}</div>
                <div class="col-span-2 text-right">
                  <span class="inline-block px-1.5 py-0.5 text-[10px] rounded-sm font-medium ${
                    p.status === 'Active' ? 'bg-primary-fixed text-primary' : p.status === 'Withdrawn' ? 'bg-error-container text-critical' : 'bg-surface-alternate text-on-surface'
                  }">
                    ${p.status}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// TAB 3: ADVERSE EVENTS DETAIL VIEW
// -------------------------------------------------------------
function renderEventsView(trial, selectedEventId) {
  const aes = trial.adverseEvents || [];
  const selectedEvent = aes.find(e => e.id === selectedEventId);

  if (selectedEvent) {
    return `
      <div>
        <button id="back-to-event-list" class="text-xs text-primary font-medium hover:underline flex items-center gap-1 mb-3 cursor-pointer">
          <span class="material-symbols-outlined text-xs">arrow_back</span> Back to Event Dossier
        </button>

        <div class="border ${selectedEvent.severity === 'Severe' ? 'border-error-container bg-error-container/10' : 'border-border-soft bg-surface-base'} rounded-DEFAULT p-3.5 space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Adverse Event Dossier</span>
              <h4 class="font-headline-sm text-headline-sm font-bold ${selectedEvent.severity === 'Severe' ? 'text-critical' : 'text-primary'}">${selectedEvent.id}</h4>
              <p class="font-body-sm text-body-sm font-semibold text-on-surface">${selectedEvent.term} (${selectedEvent.grade})</p>
            </div>
            <span class="px-2 py-0.5 rounded-DEFAULT text-xs font-semibold ${
              selectedEvent.status === 'Active' ? 'bg-error-container text-critical' : 'bg-primary-fixed text-primary'
            }">
              ${selectedEvent.status}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-soft">
            <div>
              <span class="text-on-surface-variant">Subject ID:</span>
              <div class="font-semibold text-on-surface font-mono">${selectedEvent.subjectId}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Site Location:</span>
              <div class="font-semibold text-on-surface">${selectedEvent.site}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Reported Date:</span>
              <div class="font-semibold text-on-surface">${selectedEvent.date}</div>
            </div>
            <div>
              <span class="text-on-surface-variant">Duration:</span>
              <div class="font-semibold text-on-surface">${selectedEvent.duration || 'Ongoing'}</div>
            </div>
          </div>

          <div class="pt-2 border-t border-border-soft space-y-2">
            <div>
              <span class="text-xs font-semibold text-on-surface uppercase">Action Taken:</span>
              <p class="text-xs text-on-surface mt-0.5">${selectedEvent.actionTaken}</p>
            </div>
            <div>
              <span class="text-xs font-semibold text-on-surface uppercase">Investigator Causality Assessment:</span>
              <p class="text-xs text-on-surface mt-0.5 font-medium">${selectedEvent.related}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      <!-- AE Summary Cards -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs">
        <div class="p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
          <span class="text-on-surface-variant">Total Logged</span>
          <div class="font-bold text-on-surface text-sm mt-0.5">${trial.aesTotal}</div>
        </div>
        <div class="p-2 bg-error-container/20 border border-error-container rounded-DEFAULT">
          <span class="text-critical font-medium">Severe Active</span>
          <div class="font-bold text-critical text-sm mt-0.5">${trial.aesSevere}</div>
        </div>
        <div class="p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
          <span class="text-on-surface-variant">Mild/Mod</span>
          <div class="font-bold text-on-surface text-sm mt-0.5">${trial.aesMildMod}</div>
        </div>
      </div>

      <!-- Events List -->
      <div>
        <h4 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-2">Adverse Event Line Records</h4>
        ${aes.length === 0 ? `
          <div class="p-6 text-center text-on-surface-variant text-xs bg-surface-base border border-border-soft rounded-DEFAULT">
            <span class="material-symbols-outlined text-2xl text-primary mb-1">verified</span>
            <p>Zero active or reported adverse events for this trial.</p>
          </div>
        ` : `
          <div class="space-y-2">
            ${aes.map(e => {
              const isSevere = e.severity === 'Severe';
              return `
                <div data-event-row="${e.id}" class="p-2.5 border rounded-DEFAULT cursor-pointer hover:bg-surface-alternate transition-colors text-xs ${
                  isSevere ? 'bg-error-container/10 border-l-4 border-l-critical border-error-container' : 'bg-surface-base border-border-soft'
                }">
                  <div class="flex justify-between items-start">
                    <div class="font-mono font-medium ${isSevere ? 'text-critical' : 'text-primary'}">${e.id} • ${e.subjectId}</div>
                    <span class="px-1.5 py-0.5 text-[10px] rounded-sm font-semibold ${
                      e.status === 'Active' ? 'bg-error-container text-critical' : 'bg-primary-fixed text-primary'
                    }">
                      ${e.status}
                    </span>
                  </div>
                  <div class="font-medium text-on-surface mt-1">${e.term} <span class="text-on-surface-variant font-normal">(${e.grade})</span></div>
                  <div class="text-[11px] text-on-surface-variant mt-0.5">Site: ${e.site} • Reported: ${e.date}</div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// TAB 4: MILESTONES DETAIL VIEW
// -------------------------------------------------------------
function renderMilestonesView(trial) {
  const milestones = trial.milestones || [];

  return `
    <div class="space-y-4">
      <div>
        <h4 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-2">Protocol Milestone Timeline</h4>
        <div class="space-y-2.5">
          ${milestones.map((m, idx) => {
            const isCompleted = m.completed;
            const isActive = m.status === 'active' || idx === 0;
            return `
              <div class="p-3 border rounded-DEFAULT text-xs ${
                isActive ? 'bg-surface-alternate border-primary' : 'bg-surface-base border-border-soft'
              }">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full border-2 ${
                      isCompleted ? 'border-primary bg-primary text-on-primary' : isActive ? 'border-primary bg-primary text-on-primary' : 'border-border-soft bg-surface-content text-on-surface-variant'
                    } flex items-center justify-center font-mono text-[10px] font-bold">
                      ${idx + 1}
                    </div>
                    <div class="font-semibold text-on-surface">${m.name}</div>
                  </div>
                  <span class="px-1.5 py-0.5 text-[10px] rounded-sm font-medium ${
                    isCompleted ? 'bg-primary-fixed text-primary' : isActive ? 'bg-primary text-on-primary' : 'bg-surface-content text-on-surface-variant border border-border-soft'
                  }">
                    ${isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
                  </span>
                </div>
                <p class="text-on-surface-variant text-[11px] mt-1.5 pl-7 leading-relaxed">${m.description || ''}</p>
                <div class="text-primary font-medium text-[11px] mt-1 pl-7">
                  Target: ${m.due} ${m.dueDays ? `(In ${m.dueDays} days)` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Protocol Gate Checklist -->
      <div class="border-t border-border-soft pt-3">
        <h5 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-2">Protocol Monitoring Gates</h5>
        <ul class="text-xs text-on-surface space-y-1.5">
          <li class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
            <span>Site eCRF 90%+ verification threshold</span>
          </li>
          <li class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
            <span>Medical Monitor Safety Gate signed</span>
          </li>
          <li class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-on-tertiary-container text-sm">pending</span>
            <span>DSMB unblinded statistics review</span>
          </li>
        </ul>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// EVENT BINDINGS
// -------------------------------------------------------------
function bindPanelEvents(container, trial, rec) {
  // Internal panel tab switching
  container.querySelectorAll('button[data-panel-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-panel-tab');
      dashboardState.setPanelTab(tab);
    });
  });

  // Overview quick links
  container.querySelector('#tab-goto-patients')?.addEventListener('click', () => {
    dashboardState.setPanelTab('patients');
  });
  container.querySelector('#funnel-inspect-btn')?.addEventListener('click', () => {
    dashboardState.setPanelTab('patients');
  });
  container.querySelector('#tab-goto-events')?.addEventListener('click', () => {
    dashboardState.setPanelTab('events');
  });
  container.querySelector('#tab-goto-milestones')?.addEventListener('click', () => {
    dashboardState.setPanelTab('milestones');
  });

  // Milestone clicks on Overview
  container.querySelectorAll('li[data-milestone-target]').forEach(li => {
    li.addEventListener('click', () => {
      dashboardState.setPanelTab('milestones');
    });
  });

  // Recommendation action click
  container.querySelector('#rec-action-btn')?.addEventListener('click', () => {
    if (rec.actionType === 'events') {
      dashboardState.setPanelTab('events');
    } else if (rec.actionType === 'patients' || rec.actionType === 'enrollment') {
      dashboardState.setPanelTab('patients');
    } else if (rec.actionType === 'milestones') {
      dashboardState.setPanelTab('milestones');
    } else {
      dashboardState.setPanelTab('overview');
    }
  });

  // Patient row clicks
  container.querySelectorAll('div[data-patient-row]').forEach(row => {
    row.addEventListener('click', (e) => {
      const patientId = e.currentTarget.getAttribute('data-patient-row');
      dashboardState.selectPatient(patientId);
    });
  });

  // Back to patient list
  container.querySelector('#back-to-patient-list')?.addEventListener('click', () => {
    dashboardState.selectPatient(null);
  });

  // Event row clicks
  container.querySelectorAll('div[data-event-row]').forEach(row => {
    row.addEventListener('click', (e) => {
      const eventId = e.currentTarget.getAttribute('data-event-row');
      dashboardState.selectEvent(eventId);
    });
  });

  // Back to event list
  container.querySelector('#back-to-event-list')?.addEventListener('click', () => {
    dashboardState.selectEvent(null);
  });
}
