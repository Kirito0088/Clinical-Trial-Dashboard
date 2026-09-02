import { dashboardState } from '../../state/dashboardState.js';

export function renderAnalyticsView(container) {
  const metrics = dashboardState.getMetrics();
  const trials = dashboardState.getFilteredTrials();

  const oncologyTrials = trials.filter(t => t.indication.includes('Oncology'));
  const otherTrials = trials.filter(t => !t.indication.includes('Oncology'));

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-semibold text-on-background">Portfolio Analytics & Ops Metrics</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Cross-trial enrollment velocity and adverse-event distribution curves.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <!-- Analytics Metric Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Average Enrollment Rate</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-headline-lg text-on-background font-semibold">
              ${(metrics.totalEnrollment / (trials.length || 1)).toFixed(0)} / study
            </span>
            <span class="material-symbols-outlined text-primary text-xl">speed</span>
          </div>
        </div>

        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Oncology Cohort Share</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-headline-lg text-on-background font-semibold">
              ${((oncologyTrials.length / (trials.length || 1)) * 100).toFixed(0)}%
            </span>
            <span class="material-symbols-outlined text-primary text-xl">pie_chart</span>
          </div>
        </div>

        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">SAE Incident Rate</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-headline-lg text-on-background font-semibold">
              ${((metrics.activeAdverseEvents / (metrics.totalEnrollment || 1)) * 100).toFixed(1)}%
            </span>
            <span class="material-symbols-outlined text-primary text-xl">health_and_safety</span>
          </div>
        </div>
      </div>

      <!-- Breakdown Table -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT overflow-hidden">
        <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Therapeutic Area Distribution</h3>
        </div>
        <div class="p-4">
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-body-sm font-medium mb-1">
                <span>Oncology & Immuno-oncology (${oncologyTrials.length} Trials)</span>
                <span>${((oncologyTrials.length / (trials.length || 1)) * 100).toFixed(0)}%</span>
              </div>
              <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                <div class="h-full bg-primary" style="width: ${((oncologyTrials.length / (trials.length || 1)) * 100)}%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-body-sm font-medium mb-1">
                <span>Cardiology, Neurology & Rare Diseases (${otherTrials.length} Trials)</span>
                <span>${((otherTrials.length / (trials.length || 1)) * 100).toFixed(0)}%</span>
              </div>
              <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                <div class="h-full bg-on-tertiary-container" style="width: ${((otherTrials.length / (trials.length || 1)) * 100)}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });
}
