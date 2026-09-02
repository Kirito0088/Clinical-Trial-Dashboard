import { dashboardState } from '../../state/dashboardState.js';

export function renderSignOutModal(container) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs select-none">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-critical text-xl">logout</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Session Sign Out</h3>
          </div>
          <button id="close-signout-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-3 text-body-sm text-on-surface">
          <p class="font-semibold text-on-surface">Are you sure you want to end your active monitoring session?</p>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            You are logged in as <strong>Dr. Alexander Chen</strong> (Principal Medical Monitor). In this hackathon demonstration prototype, signing out will reset your session parameters to baseline demo state.
          </p>
          <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT text-xs text-on-surface-variant">
            <strong>Active audit tokens:</strong> 12 protocol telemetry channels monitored.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-end items-center gap-2">
          <button id="signout-cancel-btn" class="px-3 py-1.5 bg-surface-content border border-border-soft text-on-surface font-label-md text-label-md rounded-DEFAULT hover:bg-surface-alternate cursor-pointer text-xs font-medium">
            Stay in Session
          </button>
          <button id="signout-confirm-btn" class="px-4 py-1.5 bg-critical text-on-error font-label-md text-label-md rounded-DEFAULT hover:bg-critical/90 cursor-pointer font-medium text-xs">
            Sign Out (Reset Demo)
          </button>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-signout-btn')?.addEventListener('click', close);
  container.querySelector('#signout-cancel-btn')?.addEventListener('click', close);
  container.querySelector('#signout-confirm-btn')?.addEventListener('click', () => {
    dashboardState.setFilters({ phase: 'ALL', status: 'ALL', region: 'ALL', searchQuery: '' });
    dashboardState.selectTrial('CT-042');
    dashboardState.setTab('dashboard');
    close();
  });
}
