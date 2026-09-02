import { dashboardState } from '../state/dashboardState.js';

export function renderHeader(container) {
  const searchQuery = dashboardState.filters.searchQuery || '';
  const unreadNotifs = dashboardState.getUnreadNotificationsCount();
  const searchResults = dashboardState.searchDataset(searchQuery);

  const hasSearchResults = searchQuery.trim().length > 0 && 
    (searchResults.trials.length > 0 || searchResults.patients.length > 0 || searchResults.events.length > 0);

  container.innerHTML = `
    <header class="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-surface-content border-b border-border-soft flex justify-between items-center px-6 z-40 select-none">
      <!-- Brand / Search Left -->
      <div class="flex items-center gap-6">
        <h1 class="font-headline-sm text-headline-sm font-bold text-primary hidden lg:block">Research Monitoring System</h1>
        
        <!-- Live Search Field & Popover -->
        <div class="relative w-80 sm:w-96">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input 
            id="global-search-input"
            class="w-full pl-9 pr-8 py-1.5 bg-surface-base border border-border-soft rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-xs" 
            placeholder="Search trials, patients, ID... (Press '/')" 
            type="text"
            autocomplete="off"
            value="${searchQuery}"
          />
          ${searchQuery ? `
            <button id="clear-search-btn" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          ` : ''}

          <!-- Live Search Results Dropdown -->
          ${hasSearchResults ? `
            <div id="search-results-dropdown" class="absolute left-0 right-0 top-full mt-1.5 bg-surface-content border border-border-soft rounded-DEFAULT shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
              <!-- Trials Category -->
              ${searchResults.trials.length > 0 ? `
                <div class="p-2 border-b border-border-soft bg-surface-alternate font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Trials (${searchResults.trials.length})
                </div>
                <div class="divide-y divide-border-soft">
                  ${searchResults.trials.map(t => `
                    <div data-search-trial="${t.id}" class="p-2.5 hover:bg-surface-alternate/60 cursor-pointer transition-colors text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-mono font-bold text-primary">${t.id} • Ph. ${t.phase}</span>
                        <span class="text-[10px] text-on-surface-variant">${t.indication}</span>
                      </div>
                      <div class="font-medium text-on-surface mt-0.5 truncate">${t.title}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Patients Category -->
              ${searchResults.patients.length > 0 ? `
                <div class="p-2 border-b border-border-soft bg-surface-alternate font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Participants (${searchResults.patients.length})
                </div>
                <div class="divide-y divide-border-soft">
                  ${searchResults.patients.map(p => `
                    <div data-search-patient="${p.id}" data-trial="${p.trialId}" class="p-2.5 hover:bg-surface-alternate/60 cursor-pointer transition-colors text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-mono font-bold text-primary">${p.id}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary-fixed text-primary font-medium">${p.status}</span>
                      </div>
                      <div class="text-[11px] text-on-surface-variant mt-0.5">${p.site} • Trial ${p.trialId}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Events Category -->
              ${searchResults.events.length > 0 ? `
                <div class="p-2 border-b border-border-soft bg-surface-alternate font-label-sm text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Adverse Events (${searchResults.events.length})
                </div>
                <div class="divide-y divide-border-soft">
                  ${searchResults.events.map(e => `
                    <div data-search-event="${e.id}" data-trial="${e.trialId}" class="p-2.5 hover:bg-surface-alternate/60 cursor-pointer transition-colors text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-mono font-bold ${e.severity === 'Severe' ? 'text-critical' : 'text-primary'}">${e.id}</span>
                        <span class="text-[10px] font-semibold ${e.severity === 'Severe' ? 'text-critical' : 'text-on-surface'}">${e.severity} (${e.grade})</span>
                      </div>
                      <div class="text-[11px] text-on-surface mt-0.5">${e.term} • ${e.site}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Actions Right -->
      <div class="flex items-center gap-3">
        <!-- Demo Dataset Button -->
        <button id="demo-dataset-btn" class="px-3.5 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">dataset</span>
          Demo Dataset
        </button>

        <!-- Help Icon -->
        <button id="help-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-alternate transition-colors cursor-pointer" title="Help & Shortcuts">
          <span class="material-symbols-outlined text-lg">help</span>
        </button>

        <!-- Notifications Bell -->
        <button id="notifications-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-alternate transition-colors relative cursor-pointer" title="Notifications">
          <span class="material-symbols-outlined text-lg">notifications</span>
          ${unreadNotifs > 0 ? `
            <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-critical ring-2 ring-surface-content"></span>
          ` : ''}
        </button>

        <!-- Profile Button -->
        <div class="relative">
          <button id="profile-btn" class="w-8 h-8 rounded-full bg-surface-alternate border border-border-soft flex items-center justify-center text-primary font-bold text-xs hover:bg-surface-variant transition-colors cursor-pointer" title="Dr. A. Chen (Principal Inv.)">
            AC
          </button>

          <!-- Profile Dropdown Menu -->
          <div id="profile-dropdown" class="hidden absolute right-0 top-full mt-2 w-56 bg-surface-content border border-border-soft rounded-DEFAULT shadow-xl overflow-hidden z-50">
            <div class="p-3 border-b border-border-soft bg-surface-alternate">
              <div class="font-bold text-primary text-xs">Dr. Alexander Chen</div>
              <div class="text-[11px] text-on-surface-variant">Principal Investigator (GCP)</div>
            </div>
            <div class="py-1 text-xs">
              <button id="menu-view-profile" class="w-full text-left px-3 py-2 text-on-surface hover:bg-surface-alternate hover:text-primary flex items-center gap-2 cursor-pointer">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">badge</span> View Profile
              </button>
              <button id="menu-settings" class="w-full text-left px-3 py-2 text-on-surface hover:bg-surface-alternate hover:text-primary flex items-center gap-2 cursor-pointer">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">settings</span> System Preferences
              </button>
              <div class="border-t border-border-soft my-1"></div>
              <button id="menu-signout" class="w-full text-left px-3 py-2 text-critical hover:bg-error-container/20 flex items-center gap-2 cursor-pointer">
                <span class="material-symbols-outlined text-sm">logout</span> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;

  bindHeaderEvents(container);
}

function bindHeaderEvents(container) {
  const searchInput = container.querySelector('#global-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        dashboardState.setSearchQuery(e.target.value);
      }, 100);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dashboardState.setSearchQuery('');
        searchInput.blur();
      }
    });
  }

  // Global '/' keyboard shortcut to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  const clearBtn = container.querySelector('#clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      dashboardState.setSearchQuery('');
      searchInput?.focus();
    });
  }

  // Search Results navigation
  container.querySelectorAll('div[data-search-trial]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-search-trial');
      dashboardState.selectTrial(id);
      dashboardState.setTab('dashboard');
      dashboardState.setSearchQuery('');
    });
  });

  container.querySelectorAll('div[data-search-patient]').forEach(el => {
    el.addEventListener('click', () => {
      const patientId = el.getAttribute('data-search-patient');
      const trialId = el.getAttribute('data-trial');
      dashboardState.selectTrial(trialId);
      dashboardState.setTab('dashboard');
      dashboardState.setPanelTab('patients');
      dashboardState.selectPatient(patientId);
      dashboardState.setSearchQuery('');
    });
  });

  container.querySelectorAll('div[data-search-event]').forEach(el => {
    el.addEventListener('click', () => {
      const eventId = el.getAttribute('data-search-event');
      const trialId = el.getAttribute('data-trial');
      dashboardState.selectTrial(trialId);
      dashboardState.setTab('dashboard');
      dashboardState.setPanelTab('events');
      dashboardState.selectEvent(eventId);
      dashboardState.setSearchQuery('');
    });
  });

  // Demo Dataset
  container.querySelector('#demo-dataset-btn')?.addEventListener('click', () => {
    dashboardState.openModal('demo_dataset');
  });

  // Help Button
  container.querySelector('#help-btn')?.addEventListener('click', () => {
    dashboardState.openModal('help');
  });

  // Notifications
  container.querySelector('#notifications-btn')?.addEventListener('click', () => {
    dashboardState.openModal('notifications');
  });

  // Profile Dropdown
  const profileBtn = container.querySelector('#profile-btn');
  const profileDropdown = container.querySelector('#profile-dropdown');

  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
        profileDropdown.classList.add('hidden');
      }
    });

    container.querySelector('#menu-view-profile')?.addEventListener('click', () => {
      profileDropdown.classList.add('hidden');
      dashboardState.openModal('profile');
    });

    container.querySelector('#menu-settings')?.addEventListener('click', () => {
      profileDropdown.classList.add('hidden');
      dashboardState.setTab('settings');
    });

    container.querySelector('#menu-signout')?.addEventListener('click', () => {
      profileDropdown.classList.add('hidden');
      dashboardState.openModal('sign_out');
    });
  }
}
