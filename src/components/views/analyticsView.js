import { dashboardState } from '../../state/dashboardState.js';

export function renderAnalyticsView(container) {
  const metrics = dashboardState.getMetrics();
  const trials = dashboardState.getFilteredTrials();

  const oncologyTrials = trials.filter(t => t.indication.includes('Oncology'));
  const otherTrials = trials.filter(t => !t.indication.includes('Oncology'));

  const totalSevere = trials.reduce((acc, t) => acc + (t.aesSevere || 0), 0);
  const totalMildMod = trials.reduce((acc, t) => acc + (t.aesMildMod || 0), 0);
  const totalAEs = totalSevere + totalMildMod || 1;

  // Phase breakdown
  const ph1Count = trials.filter(t => t.phase.includes('I') && !t.phase.includes('II') && !t.phase.includes('III') && !t.phase.includes('IV')).length;
  const ph2Count = trials.filter(t => t.phase.includes('II') && !t.phase.includes('III')).length;
  const ph3Count = trials.filter(t => t.phase.includes('III')).length;
  const ph4Count = trials.filter(t => t.phase.includes('IV')).length;

  container.innerHTML = `
    <div class="space-y-6 select-none">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-background">Portfolio Analytics & Ops Metrics</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Calculated enrollment velocity, adverse-event severity curves, and milestone pacing.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <!-- Top Analytics Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Avg Enrollment / Study</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-2xl text-on-background font-bold">
              ${(metrics.totalEnrollment / (trials.length || 1)).toFixed(0)}
            </span>
            <span class="material-symbols-outlined text-primary text-xl">speed</span>
          </div>
          <div class="text-[11px] text-on-surface-variant mt-1">Target Pace: 82.4%</div>
        </div>

        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Severe SAE Rate</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-2xl text-critical font-bold">
              ${((totalSevere / (metrics.totalEnrollment || 1)) * 100).toFixed(1)}%
            </span>
            <span class="material-symbols-outlined text-critical text-xl">health_and_safety</span>
          </div>
          <div class="text-[11px] text-on-surface-variant mt-1">${totalSevere} active Grade 3+ events</div>
        </div>

        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Oncology Share</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-2xl text-on-background font-bold">
              ${((oncologyTrials.length / (trials.length || 1)) * 100).toFixed(0)}%
            </span>
            <span class="material-symbols-outlined text-primary text-xl">pie_chart</span>
          </div>
          <div class="text-[11px] text-on-surface-variant mt-1">${oncologyTrials.length} of ${trials.length} studies</div>
        </div>

        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4">
          <span class="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Gating Milestones</span>
          <div class="flex items-end justify-between mt-2">
            <span class="font-headline-lg text-2xl text-primary font-bold">
              ${metrics.upcomingMilestones}
            </span>
            <span class="material-symbols-outlined text-primary text-xl">flag</span>
          </div>
          <div class="text-[11px] text-on-surface-variant mt-1">Due within 90 days</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Chart 1: Phase Distribution -->
        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between">
          <div>
            <h3 class="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider mb-3">Portfolio Phase Breakdown</h3>
            <div class="space-y-3 text-xs">
              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span>Phase I Dose Escalation (${ph1Count} Trials)</span>
                  <span>${((ph1Count / (trials.length || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${((ph1Count / (trials.length || 1)) * 100)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span>Phase II Efficacy Cohorts (${ph2Count} Trials)</span>
                  <span>${((ph2Count / (trials.length || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${((ph2Count / (trials.length || 1)) * 100)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span>Phase III Pivotal Registrations (${ph3Count} Trials)</span>
                  <span>${((ph3Count / (trials.length || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${((ph3Count / (trials.length || 1)) * 100)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span>Phase IV Post-Marketing RWE (${ph4Count} Trials)</span>
                  <span>${((ph4Count / (trials.length || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${((ph4Count / (trials.length || 1)) * 100)}%"></div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-on-surface-variant mt-4 pt-2 border-t border-border-soft">
            Aggregated real-time metrics across active investigational sites.
          </p>
        </div>

        <!-- Chart 2: Safety & AE Severity Split -->
        <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between">
          <div>
            <h3 class="font-label-md text-label-md font-bold text-on-surface uppercase tracking-wider mb-3">Adverse Event Severity Distribution</h3>
            <div class="space-y-3 text-xs">
              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span class="text-critical font-bold">Severe (Grade 3+ SAE) (${totalSevere} Events)</span>
                  <span class="text-critical font-bold">${((totalSevere / totalAEs) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-critical" style="width: ${((totalSevere / totalAEs) * 100)}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between font-medium mb-1">
                  <span>Mild / Moderate Events (${totalMildMod} Events)</span>
                  <span>${((totalMildMod / totalAEs) * 100).toFixed(0)}%</span>
                </div>
                <div class="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${((totalMildMod / totalAEs) * 100)}%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT text-[11px] text-on-surface-variant mt-4">
            <strong>Safety Telemetry Protocol:</strong> Grade 3+ SAE alerts automatically escalate to Principal Medical Monitor within &lt; 24h.
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });
}
