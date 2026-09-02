import { dashboardState } from '../../state/dashboardState.js';

export function renderSettingsView(container) {
  const currentSettings = dashboardState.settings;

  container.innerHTML = `
    <div class="space-y-6 select-none max-w-4xl">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-background">System Settings & Thresholds</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Configure operational monitoring triggers, early warning horizons, and display preferences.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <!-- Settings Cards -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-6 space-y-6">
        <!-- Section 1: Alert Thresholds -->
        <div>
          <h3 class="font-label-md text-label-md font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">tune</span> Operational Monitoring Thresholds
          </h3>
          
          <div class="space-y-4 text-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border-soft">
              <div>
                <div class="font-bold text-on-surface">Enrollment Pacing Lag Alert Trigger</div>
                <div class="text-on-surface-variant">Trigger High Priority warning when site pace falls below expected trajectory</div>
              </div>
              <select id="setting-enrollment" class="px-3 py-1.5 bg-surface-base border border-border-soft rounded-DEFAULT font-mono text-primary font-bold focus:outline-none focus:border-primary text-xs">
                <option value="15" ${currentSettings.enrollmentThreshold === 15 ? 'selected' : ''}>-15% Shortfall</option>
                <option value="20" ${currentSettings.enrollmentThreshold === 20 ? 'selected' : ''}>-20% Shortfall</option>
                <option value="25" ${currentSettings.enrollmentThreshold === 25 ? 'selected' : ''}>-25% Shortfall (Standard)</option>
                <option value="30" ${currentSettings.enrollmentThreshold === 30 ? 'selected' : ''}>-30% Shortfall</option>
              </select>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border-soft">
              <div>
                <div class="font-bold text-on-surface">Severe Adverse Event Escalation Window</div>
                <div class="text-on-surface-variant">Medical monitor notification speed upon logging Grade 3+ SAE</div>
              </div>
              <select id="setting-sae" class="px-3 py-1.5 bg-surface-base border border-border-soft rounded-DEFAULT font-mono text-critical font-bold focus:outline-none focus:border-primary text-xs">
                <option value="immediate" ${currentSettings.saeAlertWindow === 'immediate' ? 'selected' : ''}>Immediate (< 24h)</option>
                <option value="24h" ${currentSettings.saeAlertWindow === '24h' ? 'selected' : ''}>24 Hours</option>
                <option value="48h" ${currentSettings.saeAlertWindow === '48h' ? 'selected' : ''}>48 Hours</option>
              </select>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border-soft">
              <div>
                <div class="font-bold text-on-surface">Milestone Pre-Alert Horizon</div>
                <div class="text-on-surface-variant">Advance warning lead time for DSMB cut and data lock milestones</div>
              </div>
              <select id="setting-horizon" class="px-3 py-1.5 bg-surface-base border border-border-soft rounded-DEFAULT font-mono text-primary font-bold focus:outline-none focus:border-primary text-xs">
                <option value="15" ${currentSettings.milestoneHorizon === 15 ? 'selected' : ''}>15 Days Lead</option>
                <option value="30" ${currentSettings.milestoneHorizon === 30 ? 'selected' : ''}>30 Days Lead (Standard)</option>
                <option value="60" ${currentSettings.milestoneHorizon === 60 ? 'selected' : ''}>60 Days Lead</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Display & Notifications -->
        <div class="pt-4 border-t border-border-soft">
          <h3 class="font-label-md text-label-md font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">palette</span> Interface & Notifications
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT flex items-center justify-between">
              <div>
                <div class="font-bold text-on-surface">Workspace Layout Density</div>
                <div class="text-on-surface-variant">Table row spacing and data padding</div>
              </div>
              <select id="setting-density" class="px-2.5 py-1 bg-surface-content border border-border-soft rounded-DEFAULT font-semibold text-xs">
                <option value="comfortable" ${currentSettings.density === 'comfortable' ? 'selected' : ''}>Comfortable</option>
                <option value="compact" ${currentSettings.density === 'compact' ? 'selected' : ''}>Compact</option>
              </select>
            </div>

            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT flex items-center justify-between">
              <div>
                <div class="font-bold text-on-surface">In-App Live Alerts</div>
                <div class="text-on-surface-variant">Real-time red dot badges on telemetry</div>
              </div>
              <input type="checkbox" id="setting-inapp" class="w-4 h-4 text-primary rounded border-border-soft focus:ring-primary cursor-pointer" ${currentSettings.inAppAlerts ? 'checked' : ''}/>
            </div>
          </div>
        </div>

        <!-- Save Banner / Actions -->
        <div class="pt-4 border-t border-border-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <span id="save-status-msg" class="text-xs text-primary font-medium flex items-center gap-1 opacity-0 transition-opacity">
            <span class="material-symbols-outlined text-sm text-primary">check_circle</span> Preferences saved successfully
          </span>
          <div class="flex items-center gap-2">
            <button id="reset-settings-btn" class="px-3 py-1.5 bg-surface-base border border-border-soft text-on-surface font-label-md text-xs rounded-DEFAULT hover:bg-surface-alternate cursor-pointer font-medium">
              Reset to Defaults
            </button>
            <button id="save-settings-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-xs rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium flex items-center gap-1.5 shadow-none">
              <span class="material-symbols-outlined text-xs">save</span> Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });

  const saveBtn = container.querySelector('#save-settings-btn');
  const saveMsg = container.querySelector('#save-status-msg');

  saveBtn?.addEventListener('click', () => {
    const enrollment = parseInt(container.querySelector('#setting-enrollment').value, 10);
    const sae = container.querySelector('#setting-sae').value;
    const horizon = parseInt(container.querySelector('#setting-horizon').value, 10);
    const density = container.querySelector('#setting-density').value;
    const inApp = container.querySelector('#setting-inapp').checked;

    dashboardState.updateSettings({
      enrollmentThreshold: enrollment,
      saeAlertWindow: sae,
      milestoneHorizon: horizon,
      density: density,
      inAppAlerts: inApp
    });

    if (saveMsg) {
      saveMsg.classList.remove('opacity-0');
      setTimeout(() => { saveMsg.classList.add('opacity-0'); }, 2500);
    }
  });

  container.querySelector('#reset-settings-btn')?.addEventListener('click', () => {
    dashboardState.updateSettings({
      enrollmentThreshold: 25,
      saeAlertWindow: 'immediate',
      milestoneHorizon: 30,
      density: 'comfortable',
      inAppAlerts: true
    });
    renderSettingsView(container);
  });
}
