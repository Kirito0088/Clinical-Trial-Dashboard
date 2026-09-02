import { dashboardState } from '../../state/dashboardState.js';

export function renderTrialsView(container) {
  const trials = dashboardState.getFilteredTrials();

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-semibold text-on-background">Clinical Trials Registry & Portfolio</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Full roster of monitored multi-center investigational studies.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <div class="bg-surface-content border border-border-soft rounded-DEFAULT overflow-hidden">
        <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Active Investigational Studies (${trials.length})</h3>
        </div>

        <div class="divide-y divide-border-soft">
          ${trials.map(trial => `
            <div class="p-4 flex items-center justify-between hover:bg-surface-alternate/40 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-headline-sm text-headline-sm font-semibold text-primary">${trial.id}</span>
                  <span class="px-2 py-0.5 bg-surface-base border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant">
                    Ph. ${trial.phase}
                  </span>
                  <span class="font-body-sm text-body-sm text-on-surface font-semibold">${trial.title}</span>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant max-w-3xl">${trial.description}</p>
                <div class="flex items-center gap-4 text-label-sm text-on-surface-variant pt-1">
                  <span>Region: <strong class="text-on-surface">${trial.region}</strong></span>
                  <span>Enrollment: <strong class="text-primary">${trial.enrolled} / ${trial.target} (${trial.percentage}%)</strong></span>
                  <span>Active AEs: <strong class="${trial.aesSevere > 0 ? 'text-critical' : 'text-on-surface'}">${trial.aesTotal}</strong></span>
                  <span>Next Milestone: <strong class="text-on-surface">${trial.nextMilestone}</strong></span>
                </div>
              </div>

              <button data-select-trial="${trial.id}" class="px-3 py-1.5 bg-primary text-on-primary font-label-sm text-label-sm rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1">
                Inspect <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });

  container.querySelectorAll('button[data-select-trial]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-select-trial');
      dashboardState.selectTrial(id);
      dashboardState.setTab('dashboard');
    });
  });
}
