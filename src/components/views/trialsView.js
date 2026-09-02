import { dashboardState } from '../../state/dashboardState.js';

export function renderTrialsView(container) {
  const trials = dashboardState.getFilteredTrials();

  container.innerHTML = `
    <div class="space-y-6 select-none">
      <!-- View Title & Top Actions -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-background">Clinical Trials Registry & Portfolio</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Comprehensive multi-center study roster with real-time operational indicators.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="trials-filter-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
            <span class="material-symbols-outlined text-sm">filter_list</span> Filter Portfolio
          </button>
          <button id="back-to-dash-btn" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
            <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Trials Directory Grid -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT overflow-hidden">
        <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Active Investigational Studies (${trials.length})</h3>
          <span class="text-xs text-on-surface-variant">Click any trial to launch operational workspace</span>
        </div>

        <div class="divide-y divide-border-soft">
          ${trials.length === 0 ? `
            <div class="p-8 text-center text-on-surface-variant text-xs">
              <span class="material-symbols-outlined text-3xl text-outline mb-2">search_off</span>
              <p>No clinical trials match current filter criteria.</p>
            </div>
          ` : trials.map(trial => {
            const statusBg = trial.status === 'critical' ? 'bg-critical' : trial.status === 'attention' ? 'bg-on-tertiary-container' : 'bg-primary';
            const statusLabel = trial.status === 'critical' ? 'Critical Attention' : trial.status === 'attention' ? 'Attention Needed' : 'On Track';

            return `
              <div class="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-alternate/40 transition-colors">
                <div class="space-y-1.5 flex-1">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="font-mono font-bold text-base text-primary">${trial.id}</span>
                    <span class="px-2 py-0.5 bg-surface-base border border-border-soft rounded-DEFAULT font-label-sm text-[11px] text-on-surface-variant font-medium">
                      Ph. ${trial.phase}
                    </span>
                    <span class="font-body-sm text-body-sm text-on-surface font-semibold">${trial.title}</span>
                    <div class="flex items-center gap-1 ml-auto md:ml-2">
                      <span class="w-2 h-2 rounded-full ${statusBg}"></span>
                      <span class="text-[11px] text-on-surface-variant font-medium">${statusLabel}</span>
                    </div>
                  </div>
                  
                  <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 text-xs leading-relaxed max-w-4xl">${trial.description}</p>
                  
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-on-surface-variant pt-1.5">
                    <div>Indication: <strong class="text-on-surface">${trial.indication}</strong></div>
                    <div>Region: <strong class="text-on-surface">${trial.region}</strong></div>
                    <div>Enrollment: <strong class="text-primary">${trial.enrolled} / ${trial.target} (${trial.percentage}%)</strong></div>
                    <div>Active SAEs: <strong class="${trial.aesSevere > 0 ? 'text-critical' : 'text-on-surface'}">${trial.aesTotal} (${trial.aesSevere} Severe)</strong></div>
                  </div>
                </div>

                <div class="flex-shrink-0 flex md:flex-col items-center justify-end gap-2">
                  <button data-select-trial="${trial.id}" class="px-3.5 py-2 bg-primary text-on-primary font-label-sm text-xs rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1.5 font-medium w-full justify-center">
                    Inspect Workspace <span class="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });

  container.querySelector('#trials-filter-btn')?.addEventListener('click', () => {
    dashboardState.openModal('filter');
  });

  container.querySelectorAll('button[data-select-trial]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-select-trial');
      dashboardState.selectTrial(id);
      dashboardState.setTab('dashboard');
    });
  });
}
