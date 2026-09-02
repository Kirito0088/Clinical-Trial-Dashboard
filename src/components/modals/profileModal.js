import { dashboardState } from '../../state/dashboardState.js';

export function renderProfileModal(container) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs select-none">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">account_circle</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Investigator Profile & Credentials</h3>
          </div>
          <button id="close-profile-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4 text-body-sm text-on-surface">
          <div class="flex items-center gap-4 p-4 bg-surface-base border border-border-soft rounded-DEFAULT">
            <div class="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg">
              AC
            </div>
            <div>
              <h4 class="font-headline-sm text-headline-sm font-bold text-primary">Dr. Alexander Chen, MD, PhD</h4>
              <p class="text-xs text-on-surface-variant">Principal Medical Monitor & ResOps Lead</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-2 py-0.5 bg-primary-fixed text-primary font-semibold text-[10px] rounded-sm uppercase">GCP Certified</span>
                <span class="text-[11px] text-on-surface-variant">ID: PI-70492</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT">
              <span class="text-on-surface-variant uppercase font-medium text-[10px]">Institution</span>
              <div class="font-semibold text-on-surface mt-0.5">Memorial Clinical Research Network</div>
            </div>
            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT">
              <span class="text-on-surface-variant uppercase font-medium text-[10px]">Department</span>
              <div class="font-semibold text-on-surface mt-0.5">Translational Oncology & ResOps</div>
            </div>
            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT">
              <span class="text-on-surface-variant uppercase font-medium text-[10px]">Assigned Studies</span>
              <div class="font-semibold text-primary mt-0.5">12 Active Protocols</div>
            </div>
            <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT">
              <span class="text-on-surface-variant uppercase font-medium text-[10px]">Active Session</span>
              <div class="font-semibold text-on-surface mt-0.5">Institutional SSO Token Active</div>
            </div>
          </div>

          <div class="p-3 bg-surface-alternate border border-border-soft rounded-DEFAULT text-xs text-on-surface-variant">
            <strong>Security Scope:</strong> Audit trail logging active under 21 CFR Part 11 demonstration profile.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <button id="profile-prefs-btn" class="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">settings</span> System Preferences
          </button>
          <button id="profile-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-profile-btn')?.addEventListener('click', close);
  container.querySelector('#profile-done-btn')?.addEventListener('click', close);
  container.querySelector('#profile-prefs-btn')?.addEventListener('click', () => {
    close();
    dashboardState.setTab('settings');
  });
}
