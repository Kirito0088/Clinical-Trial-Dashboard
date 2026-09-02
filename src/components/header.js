import { dashboardState } from '../state/dashboardState.js';

export function renderHeader(container) {
  const searchQuery = dashboardState.filters.searchQuery || '';

  container.innerHTML = `
    <header class="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-surface-content border-b border-border-soft flex justify-between items-center px-6 z-40 select-none">
      <!-- Brand / Search Left -->
      <div class="flex items-center gap-8">
        <h1 class="font-headline-sm text-headline-sm font-semibold text-primary">Research Monitoring System</h1>
        <div class="relative w-80">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input 
            id="global-search-input"
            class="w-full pl-9 pr-8 py-1.5 bg-surface-base border border-border-soft rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
            placeholder="Search trials, patients, ID..." 
            type="text"
            value="${searchQuery}"
          />
          ${searchQuery ? `
            <button id="clear-search-btn" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Actions Right -->
      <div class="flex items-center gap-4">
        <button id="demo-dataset-btn" class="px-4 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant transition-colors flex items-center gap-2 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dataset</span>
          Demo Dataset
        </button>

        <div class="flex items-center gap-2 text-on-surface-variant">
          <button id="notifications-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-alternate transition-colors relative cursor-pointer" title="Notifications">
            <span class="material-symbols-outlined text-lg">notifications</span>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-critical"></span>
          </button>
          <button id="profile-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT hover:bg-surface-alternate transition-colors cursor-pointer" title="Investigator Profile">
            <span class="material-symbols-outlined text-lg">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  `;

  // Bind search input events
  const searchInput = container.querySelector('#global-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        dashboardState.setSearchQuery(e.target.value);
      }, 150);
    });
  }

  const clearBtn = container.querySelector('#clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      dashboardState.setSearchQuery('');
    });
  }

  // Bind Demo Dataset button
  const demoBtn = container.querySelector('#demo-dataset-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      dashboardState.openModal('demo_dataset');
    });
  }

  // Notifications button
  const notifBtn = container.querySelector('#notifications-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      dashboardState.openModal('notifications');
    });
  }
}
