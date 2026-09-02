import { dashboardState } from '../../state/dashboardState.js';

export function renderSettingsView(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-semibold text-on-background">Monitoring System Preferences</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Configure threshold alerts and institutional monitoring parameters.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-6 space-y-6">
        <div>
          <h3 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-4">Operational Alert Thresholds</h3>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2 border-b border-border-soft">
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Enrollment Pacing Lag Alert</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Trigger high priority warning when site falls below trajectory</div>
              </div>
              <span class="font-mono text-body-sm text-primary font-semibold">-25% threshold</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-border-soft">
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Severe Adverse Event Notification</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Immediate safety officer ping upon Grade 3+ SAE logging</div>
              </div>
              <span class="font-mono text-body-sm text-critical font-semibold">Immediate (< 24h)</span>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Milestone Early Horizon Warning</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Pre-alert lead time for DSMB & Data Cut milestones</div>
              </div>
              <span class="font-mono text-body-sm text-primary font-semibold">30 days lead</span>
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
