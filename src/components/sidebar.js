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
      <!-- Header -->
      <div class="px-6 mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-full bg-surface-alternate border border-border-soft flex items-center justify-center overflow-hidden">
            <span class="material-symbols-outlined text-on-surface-variant text-xl">account_circle</span>
          </div>
          <div>
            <h2 class="font-label-md text-label-md text-primary font-semibold">Clinical Ops</h2>
            <p class="font-label-sm text-label-sm text-on-surface-variant">Institutional Portal</p>
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

      <!-- Footer Tabs -->
      <ul class="px-4 mt-auto space-y-1 pt-6 border-t border-border-soft">
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
    </nav>
  `;

  // Bind tab click events
  container.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      dashboardState.setTab(tab);
    });
  });
}
