import { dashboardState } from '../state/dashboardState.js';

export function renderSidebar(container) {
  const currentTab = dashboardState.currentTab;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'trials', label: 'Trials', icon: 'clinical_notes' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    { id: 'documents', label: 'Documents', icon: 'description' }
  ];

  const footerItems = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'support', label: 'Support', icon: 'help' }
  ];

  container.innerHTML = `
    <nav class="fixed left-0 top-0 h-screen w-60 bg-surface-base border-r border-border-soft flex flex-col py-6 z-50 select-none">
      <!-- Header / Portal Identity -->
      <div class="px-6 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-DEFAULT bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            <span class="material-symbols-outlined text-lg">biotech</span>
          </div>
          <div>
            <h2 class="font-label-md text-label-md text-primary font-bold">Research Ops</h2>
            <p class="font-label-sm text-[11px] text-on-surface-variant">SIH26046 Monitoring</p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="flex-1 px-4 space-y-1">
        ${navItems.map(item => {
          const isActive = currentTab === item.id;
          return `
            <li>
              <button data-tab="${item.id}" class="w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-left cursor-pointer transition-colors duration-150 ${
                isActive
                  ? 'bg-surface-alternate text-primary border-r-2 border-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-alternate hover:text-primary'
              }">
                <span class="material-symbols-outlined text-lg ${isActive ? 'fill' : ''}" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">${item.icon}</span>
                <span class="font-label-md text-label-md">${item.label}</span>
              </button>
            </li>
          `;
        }).join('')}
      </ul>

      <!-- Footer Tabs & User Card -->
      <div class="px-4 mt-auto space-y-3 pt-4 border-t border-border-soft">
        <ul class="space-y-1">
          ${footerItems.map(item => {
            const isActive = currentTab === item.id;
            return `
              <li>
                <button data-tab="${item.id}" class="w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-left cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-surface-alternate text-primary border-r-2 border-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-alternate hover:text-primary'
                }">
                  <span class="material-symbols-outlined text-lg ${isActive ? 'fill' : ''}" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">${item.icon}</span>
                  <span class="font-label-md text-label-md">${item.label}</span>
                </button>
              </li>
            `;
          }).join('')}
        </ul>

        <!-- Bottom-Left Profile Card (Clickable) -->
        <button id="sidebar-profile-card" class="w-full p-2.5 bg-surface-alternate/60 hover:bg-surface-alternate border border-border-soft rounded-DEFAULT flex items-center justify-between transition-colors cursor-pointer text-left">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
              AC
            </div>
            <div class="truncate">
              <div class="font-label-sm font-semibold text-primary truncate text-xs">Dr. A. Chen</div>
              <div class="text-[10px] text-on-surface-variant truncate">Principal Inv.</div>
            </div>
          </div>
          <span class="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
        </button>
      </div>
    </nav>
  `;

  // Bind tab navigation
  container.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      dashboardState.setTab(tab);
    });
  });

  // Bind sidebar profile card
  container.querySelector('#sidebar-profile-card')?.addEventListener('click', () => {
    dashboardState.openModal('profile');
  });
}
