import { dashboardState } from '../../state/dashboardState.js';

export function renderEnrollmentModal(container, trial) {
  if (!trial) return;

  const flaggedSite = trial.sites.find(s => s.status === 'flagged');

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden modal-card">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-2xl">group_add</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Site-Level Enrollment Monitoring</h3>
                <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant font-medium">
                  ${trial.id} - Ph. ${trial.phase}
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${trial.title}</p>
            </div>
          </div>
          <button id="close-modal-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Traceability Breadcrumb / Context Banner -->
        <div class="px-6 py-3 bg-surface-base border-b border-border-soft flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-on-surface-variant">
            <span class="font-semibold text-primary">TRACEABILITY PATH:</span>
            <span>Dashboard Recommendation</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="text-on-tertiary-container font-semibold">Pacing Discrepancy</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="font-semibold text-on-surface">Site Source Records</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-on-surface-variant">Total Target: <strong class="text-on-surface">${trial.target}</strong></span>
            <span class="font-medium text-on-surface-variant">Current Enrolled: <strong class="text-primary">${trial.enrolled} (${trial.percentage}%)</strong></span>
          </div>
        </div>

        <!-- Lagging Site Alert Banner if applicable -->
        ${flaggedSite ? `
          <div class="mx-6 mt-4 p-3 bg-error-container/20 border border-error-container rounded-DEFAULT flex items-start gap-3">
            <span class="material-symbols-outlined text-critical mt-0.5 text-lg">error</span>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-label-md text-label-md font-semibold text-critical">Monitoring Flag Root Cause Identified</h4>
                <span class="text-[10px] uppercase font-bold bg-error-container text-critical px-1.5 py-0.5 rounded-sm">Actionable</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface mt-1">
                <strong>${flaggedSite.name} (${flaggedSite.id})</strong> is lagging behind projection: <em>${flaggedSite.flag}</em>.
              </p>
              <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Principal Investigator: ${flaggedSite.pi} • Location: ${flaggedSite.location} • Enrolled: ${flaggedSite.enrolled} / ${flaggedSite.target} (${flaggedSite.trajectory})
              </p>
            </div>
          </div>
        ` : ''}

        <!-- Sites Roster Table -->
        <div class="p-6 flex-1 overflow-y-auto">
          <h4 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-3">Participating Site Performance Roster</h4>
          <div class="border border-border-soft rounded-DEFAULT overflow-hidden bg-surface-content">
            <div class="grid grid-cols-12 gap-3 px-4 py-2.5 bg-surface-alternate border-b border-border-soft font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              <div class="col-span-2">Site ID</div>
              <div class="col-span-4">Institution & Investigator</div>
              <div class="col-span-2">Enrolled / Target</div>
              <div class="col-span-2">Trajectory %</div>
              <div class="col-span-2 text-right">Site Status</div>
            </div>
            <div class="divide-y divide-border-soft">
              ${trial.sites.map(site => {
                const isFlagged = site.status === 'flagged';
                return `
                  <div class="grid grid-cols-12 gap-3 px-4 py-3 items-center ${isFlagged ? 'bg-error-container/10 border-l-4 border-l-critical' : 'hover:bg-surface-alternate/50'} transition-colors">
                    <div class="col-span-2 font-mono font-medium text-body-sm ${isFlagged ? 'text-critical font-bold' : 'text-primary'}">
                      ${site.id}
                    </div>
                    <div class="col-span-4">
                      <div class="font-body-sm text-body-sm font-medium text-on-surface">${site.name}</div>
                      <div class="font-label-sm text-label-sm text-on-surface-variant">${site.pi} • ${site.location}</div>
                    </div>
                    <div class="col-span-2 font-body-sm text-body-sm text-on-surface">
                      <strong>${site.enrolled}</strong> <span class="text-on-surface-variant">/ ${site.target}</span>
                    </div>
                    <div class="col-span-2">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div class="h-full ${isFlagged ? 'bg-critical' : 'bg-primary'}" style="width: ${site.trajectory}"></div>
                        </div>
                        <span class="font-label-sm text-label-sm ${isFlagged ? 'text-critical font-bold' : 'text-on-surface-variant'}">${site.trajectory}</span>
                      </div>
                    </div>
                    <div class="col-span-2 text-right">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-xs font-medium ${
                        isFlagged 
                          ? 'bg-error-container text-critical' 
                          : site.status === 'completed' 
                            ? 'bg-primary-fixed text-primary' 
                            : 'bg-surface-alternate text-on-surface-variant'
                      }">
                        ${isFlagged ? 'Flagged' : site.status === 'completed' ? 'Completed' : 'On Schedule'}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <span class="font-label-sm text-label-sm text-outline flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">verified</span> Verified Synthetic Site Audit Records
          </span>
          <button id="modal-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer">
            Close View
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind close buttons
  const close = () => dashboardState.closeModal();
  container.querySelector('#close-modal-btn')?.addEventListener('click', close);
  container.querySelector('#modal-done-btn')?.addEventListener('click', close);
  container.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === container.querySelector('.modal-backdrop')) close();
  });
}
