import { dashboardState } from '../state/dashboardState.js';

export function renderTrialTable(container) {
  const filteredTrials = dashboardState.getFilteredTrials();
  const selectedTrialId = dashboardState.selectedTrialId;
  const isFiltered = dashboardState.filters.phase !== 'ALL' || 
                     dashboardState.filters.status !== 'ALL' || 
                     dashboardState.filters.region !== 'ALL' ||
                     Boolean(dashboardState.filters.searchQuery);

  container.innerHTML = `
    <div class="h-full bg-surface-content border border-border-soft rounded-DEFAULT flex flex-col overflow-hidden shadow-none select-none">
      <!-- Table Top Bar -->
      <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-2">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Trial Monitoring Roster</h3>
          <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant">
            ${filteredTrials.length} ${filteredTrials.length === 1 ? 'Trial' : 'Trials'}
          </span>
          ${isFiltered ? `
            <span class="text-xs text-primary font-medium bg-primary-fixed/50 px-2 py-0.5 rounded-DEFAULT flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">filter_alt</span> Filtered
            </span>
          ` : ''}
        </div>
        <button id="filter-btn" class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer p-1 rounded-DEFAULT hover:bg-surface-variant" title="Filter Roster">
          <span class="material-symbols-outlined text-sm">filter_list</span>
          <span class="font-label-sm text-label-sm font-medium">Filter</span>
        </button>
      </div>

      <!-- Table Column Headers -->
      <div class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border-soft bg-surface-alternate font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold flex-shrink-0">
        <div class="col-span-2">Trial ID</div>
        <div class="col-span-1">Phase</div>
        <div class="col-span-3">Enrollment</div>
        <div class="col-span-2">AEs (Severe)</div>
        <div class="col-span-3">Next Milestone</div>
        <div class="col-span-1 text-right">Status</div>
      </div>

      <!-- Table Scrollable Body (Inbox style list) -->
      <div id="trial-rows-container" class="flex-1 overflow-y-auto">
        ${filteredTrials.length === 0 ? `
          <div class="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-3xl text-outline">search_off</span>
            <p class="font-body-md text-body-md">No clinical trials match current filter criteria.</p>
            <button id="reset-filters-btn" class="mt-2 px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-sm text-label-sm rounded-DEFAULT hover:bg-surface-variant cursor-pointer">
              Reset Filters
            </button>
          </div>
        ` : filteredTrials.map(trial => {
          const isSelected = trial.id === selectedTrialId;
          const statusBg = trial.status === 'critical' 
            ? 'bg-critical' 
            : trial.status === 'attention' 
              ? 'bg-on-tertiary-container' 
              : 'bg-primary';
          
          const statusTitle = trial.status === 'critical'
            ? 'Critical Attention'
            : trial.status === 'attention'
              ? 'Attention Needed'
              : 'On Track';

          const aeClass = trial.aesSevere > 0 ? 'text-critical font-medium' : 'text-on-surface';

          return `
            <div 
              data-trial-id="${trial.id}" 
              tabindex="0"
              role="button"
              aria-label="Select trial ${trial.id}"
              class="trial-row grid grid-cols-12 gap-4 px-4 py-3 border-b border-border-soft transition-colors duration-150 cursor-pointer items-center outline-none focus:bg-surface-alternate ${
                isSelected 
                  ? 'bg-surface-alternate border-l-4 border-l-primary font-medium' 
                  : 'hover:bg-surface-alternate/70'
              }"
            >
              <div class="col-span-2 font-body-sm text-body-sm ${isSelected ? 'font-bold' : 'font-medium'} text-primary">
                ${trial.id}
              </div>
              <div class="col-span-1 font-body-sm text-body-sm text-on-surface-variant">
                ${trial.phase}
              </div>
              <div class="col-span-3 flex items-center gap-2">
                <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-300" style="width: ${trial.percentage}%"></div>
                </div>
                <span class="font-label-sm text-label-sm text-on-surface-variant w-8 text-right font-medium">
                  ${trial.enrolled}
                </span>
              </div>
              <div class="col-span-2 font-body-sm text-body-sm ${aeClass}">
                ${trial.aesTotal} <span class="text-on-surface-variant font-normal">(${trial.aesSevere})</span>
              </div>
              <div class="col-span-3 font-body-sm text-body-sm text-on-surface-variant truncate" title="${trial.nextMilestone}">
                ${trial.nextMilestone}
              </div>
              <div class="col-span-1 text-right">
                <div class="inline-block w-2 h-2 rounded-full ${statusBg}" title="${statusTitle}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Bind Row Selection & Keyboard Navigation
  container.querySelectorAll('div[data-trial-id]').forEach(row => {
    const handleSelect = () => {
      const trialId = row.getAttribute('data-trial-id');
      dashboardState.selectTrial(trialId);
    };

    row.addEventListener('click', handleSelect);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });

  // Bind Filter Button
  const filterBtn = container.querySelector('#filter-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      dashboardState.openModal('filter');
    });
  }

  // Bind Reset Filters Button
  const resetBtn = container.querySelector('#reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      dashboardState.setFilters({
        phase: 'ALL',
        status: 'ALL',
        region: 'ALL',
        searchQuery: ''
      });
    });
  }
}

/**
 * Fast in-place highlight update without re-rendering the entire table DOM
 */
export function updateTableSelection(container, selectedTrialId) {
  if (!container) return;
  const rows = container.querySelectorAll('.trial-row');
  rows.forEach(row => {
    const id = row.getAttribute('data-trial-id');
    const isSelected = id === selectedTrialId;
    if (isSelected) {
      row.classList.add('bg-surface-alternate', 'border-l-4', 'border-l-primary', 'font-medium');
      row.classList.remove('hover:bg-surface-alternate/70');
      const idEl = row.querySelector('.col-span-2');
      if (idEl) {
        idEl.classList.add('font-bold');
        idEl.classList.remove('font-medium');
      }
    } else {
      row.classList.remove('bg-surface-alternate', 'border-l-4', 'border-l-primary', 'font-medium');
      row.classList.add('hover:bg-surface-alternate/70');
      const idEl = row.querySelector('.col-span-2');
      if (idEl) {
        idEl.classList.remove('font-bold');
        idEl.classList.add('font-medium');
      }
    }
  });
}
