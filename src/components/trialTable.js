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
      <!-- List Top Bar -->
      <div class="px-3 py-2.5 border-b border-border-soft bg-surface-alternate flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-1.5">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Trial Monitoring</h3>
          <span class="px-1.5 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-[11px] text-on-surface-variant">
            ${filteredTrials.length}
          </span>
          ${isFiltered ? `
            <span class="text-[10px] text-primary font-semibold bg-primary-fixed/50 px-1.5 py-0.5 rounded-DEFAULT flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[10px]">filter_alt</span>
            </span>
          ` : ''}
        </div>
        <button id="filter-btn" class="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-0.5 cursor-pointer p-1 rounded-DEFAULT hover:bg-surface-variant" title="Filter Roster">
          <span class="material-symbols-outlined text-sm">filter_list</span>
        </button>
      </div>

      <!-- Compact Trial Card List (Scrollable) -->
      <div id="trial-rows-container" class="flex-1 overflow-y-auto">
        ${filteredTrials.length === 0 ? `
          <div class="p-6 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-3xl text-outline">search_off</span>
            <p class="font-body-sm text-body-sm text-xs">No trials match current filters.</p>
            <button id="reset-filters-btn" class="mt-1 px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-sm text-[11px] rounded-DEFAULT hover:bg-surface-variant cursor-pointer">
              Reset Filters
            </button>
          </div>
        ` : filteredTrials.map(trial => {
          const isSelected = trial.id === selectedTrialId;

          // Prefer backend healthStatus when available, fall back to local status
          const resolvedStatus = trial.healthStatus
            ? (trial.healthStatus === 'CRITICAL' ? 'critical' : trial.healthStatus === 'WATCH' ? 'attention' : 'on_track')
            : trial.status;

          const statusDot = resolvedStatus === 'critical'
            ? 'bg-critical'
            : resolvedStatus === 'attention'
              ? 'bg-on-tertiary-container'
              : 'bg-primary';

          const statusLabel = resolvedStatus === 'critical'
            ? 'Critical'
            : resolvedStatus === 'attention'
              ? 'Attention'
              : 'On Track';

          const statusTextColor = resolvedStatus === 'critical'
            ? 'text-critical'
            : resolvedStatus === 'attention'
              ? 'text-on-tertiary-container'
              : 'text-primary';

          const aeClass = (trial.aesSevere > 0 || (trial.aeSummary?.byGrade?.SEVERE + trial.aeSummary?.byGrade?.CRITICAL) > 0)
            ? 'text-critical font-semibold' : 'text-on-surface-variant';

          // Backend health score badge
          const healthScoreBadge = trial.healthScore != null
            ? `<span class="text-[9px] font-bold px-1 py-0 rounded-sm border ${
                resolvedStatus === 'critical' ? 'border-critical/40 text-critical bg-critical/5'
                : resolvedStatus === 'attention' ? 'border-amber-400/40 text-amber-600 bg-amber-50'
                : 'border-primary/30 text-primary bg-primary/5'
              }">${trial.healthScore}</span>` : '';

          const flagBadge = (trial.flagCount ?? trial.flags?.length ?? 0) > 0
            ? `<span class="text-[9px] font-semibold text-critical bg-critical/10 border border-critical/20 px-1 py-0 rounded-sm">
                ${trial.flagCount ?? trial.flags?.length} flag${(trial.flagCount ?? trial.flags?.length) > 1 ? 's' : ''}
               </span>` : '';

          const totalAEs = trial.aeSummary?.total ?? trial.aesTotal ?? 0;
          const severeAEs = (trial.aeSummary?.byGrade?.SEVERE ?? 0) + (trial.aeSummary?.byGrade?.CRITICAL ?? 0) || trial.aesSevere || 0;

          return `
            <div
              data-trial-id="${trial.id}"
              tabindex="0"
              role="button"
              aria-label="Select trial ${trial.id}: ${trial.title}"
              class="trial-row border-b border-border-soft transition-colors duration-100 cursor-pointer outline-none focus:bg-surface-alternate/80 ${
                isSelected
                  ? 'bg-surface-alternate border-l-[3px] border-l-primary'
                  : 'hover:bg-surface-alternate/60'
              }"
            >
              <div class="px-3 py-3">
                <!-- Row 1: Trial ID + Status Indicator -->
                <div class="flex items-center justify-between mb-0.5">
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-xs text-primary ${isSelected ? 'font-extrabold' : ''}">${trial.id}</span>
                    <span class="text-[10px] text-on-surface-variant font-medium border border-border-soft px-1 py-0 rounded-sm bg-surface-base">Ph. ${trial.phase?.replace('PHASE_', '')}</span>
                    ${healthScoreBadge}
                    ${flagBadge}
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}"></span>
                    <span class="text-[10px] font-medium ${statusTextColor}">${statusLabel}</span>
                  </div>
                </div>

                <!-- Row 2: Trial Title -->
                <p class="font-body-sm text-[11px] font-medium text-on-surface leading-tight line-clamp-2 mb-2 ${isSelected ? 'text-primary' : ''}">${trial.title}</p>

                <!-- Row 3: Enrollment Progress Bar -->
                <div class="mb-1.5">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="text-[10px] text-on-surface-variant">${trial.enrolled ?? trial.funnel?.enrolled ?? 0} / ${trial.target ?? trial.targetEnrollment ?? 0}</span>
                    <span class="text-[10px] font-semibold text-primary">${trial.percentage ?? Math.round((trial.enrollmentProgress ?? 0) * 100)}%</span>
                  </div>
                  <div class="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all duration-300" style="width: ${trial.percentage ?? Math.round((trial.enrollmentProgress ?? 0) * 100)}%"></div>
                  </div>
                </div>

                <!-- Row 4: AEs + Condition -->
                <div class="flex items-center justify-between text-[10px]">
                  <span class="${aeClass}">
                    ${totalAEs > 0
                      ? `${totalAEs} AE${totalAEs !== 1 ? 's' : ''}${severeAEs > 0 ? ` (${severeAEs} severe)` : ''}`
                      : '<span class="text-on-surface-variant">No active AEs</span>'
                    }
                  </span>
                  <span class="text-on-surface-variant">${trial.region ?? trial.conditionArea ?? trial.indication ?? ''}</span>
                </div>
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
  container.querySelector('#filter-btn')?.addEventListener('click', () => {
    dashboardState.openModal('filter');
  });

  // Bind Reset Filters Button
  container.querySelector('#reset-filters-btn')?.addEventListener('click', () => {
    dashboardState.setFilters({ phase: 'ALL', status: 'ALL', region: 'ALL', searchQuery: '' });
  });
}

/**
 * Fast in-place highlight update without re-rendering the entire list DOM.
 * Applies selected styling and removes it from previously selected row.
 */
export function updateTableSelection(container, selectedTrialId) {
  if (!container) return;
  const rows = container.querySelectorAll('.trial-row');
  rows.forEach(row => {
    const id = row.getAttribute('data-trial-id');
    const isSelected = id === selectedTrialId;

    if (isSelected) {
      row.classList.add('bg-surface-alternate', 'border-l-[3px]', 'border-l-primary');
      row.classList.remove('hover:bg-surface-alternate/60');
      // Bold the trial ID & title
      const idEl = row.querySelector('.font-mono');
      if (idEl) idEl.classList.add('font-extrabold');
      const titleEl = row.querySelector('.font-body-sm');
      if (titleEl) titleEl.classList.add('text-primary');
    } else {
      row.classList.remove('bg-surface-alternate', 'border-l-[3px]', 'border-l-primary');
      row.classList.add('hover:bg-surface-alternate/60');
      const idEl = row.querySelector('.font-mono');
      if (idEl) idEl.classList.remove('font-extrabold');
      const titleEl = row.querySelector('.font-body-sm');
      if (titleEl) titleEl.classList.remove('text-primary');
    }
  });
}
