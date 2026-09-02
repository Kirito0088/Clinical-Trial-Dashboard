import { dashboardState } from '../../state/dashboardState.js';

export function renderFilterPopover(container) {
  const currentFilters = dashboardState.filters;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-lg shadow-xl flex flex-col overflow-hidden modal-card">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">filter_list</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Filter Clinical Portfolio</h3>
          </div>
          <button id="close-filter-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Filter Controls -->
        <div class="p-6 space-y-4">
          <!-- Phase Filter -->
          <div>
            <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1.5 uppercase tracking-wider">Clinical Phase</label>
            <select id="filter-phase" class="w-full px-3 py-2 bg-surface-base border border-border-soft rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="ALL" ${currentFilters.phase === 'ALL' ? 'selected' : ''}>All Phases</option>
              <option value="I" ${currentFilters.phase === 'I' ? 'selected' : ''}>Phase I</option>
              <option value="II" ${currentFilters.phase === 'II' ? 'selected' : ''}>Phase II / IIb</option>
              <option value="III" ${currentFilters.phase === 'III' ? 'selected' : ''}>Phase III</option>
              <option value="IV" ${currentFilters.phase === 'IV' ? 'selected' : ''}>Phase IV</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1.5 uppercase tracking-wider">Monitoring Status</label>
            <select id="filter-status" class="w-full px-3 py-2 bg-surface-base border border-border-soft rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="ALL" ${currentFilters.status === 'ALL' ? 'selected' : ''}>All Statuses</option>
              <option value="on_track" ${currentFilters.status === 'on_track' ? 'selected' : ''}>On Track (Green)</option>
              <option value="attention" ${currentFilters.status === 'attention' ? 'selected' : ''}>Attention Needed (Amber)</option>
              <option value="critical" ${currentFilters.status === 'critical' ? 'selected' : ''}>Critical Attention (Red)</option>
            </select>
          </div>

          <!-- Region Filter -->
          <div>
            <label class="block font-label-md text-label-md font-semibold text-on-surface mb-1.5 uppercase tracking-wider">Geographic Region</label>
            <select id="filter-region" class="w-full px-3 py-2 bg-surface-base border border-border-soft rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary">
              <option value="ALL" ${currentFilters.region === 'ALL' ? 'selected' : ''}>All Regions</option>
              <option value="North America" ${currentFilters.region === 'North America' ? 'selected' : ''}>North America</option>
              <option value="Europe" ${currentFilters.region === 'Europe' ? 'selected' : ''}>Europe</option>
              <option value="Asia-Pacific" ${currentFilters.region === 'Asia-Pacific' ? 'selected' : ''}>Asia-Pacific</option>
              <option value="Global" ${currentFilters.region === 'Global' ? 'selected' : ''}>Global (Multi-center)</option>
            </select>
          </div>
        </div>

        <!-- Filter Footer Actions -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <button id="reset-all-filters" class="font-label-md text-label-md text-on-surface-variant hover:text-primary underline cursor-pointer">
            Reset Filters
          </button>
          <div class="flex items-center gap-2">
            <button id="cancel-filter" class="px-4 py-1.5 bg-surface-content border border-border-soft text-on-surface font-label-md text-label-md rounded-DEFAULT hover:bg-surface-alternate cursor-pointer">
              Cancel
            </button>
            <button id="apply-filter" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();

  container.querySelector('#close-filter-btn')?.addEventListener('click', close);
  container.querySelector('#cancel-filter')?.addEventListener('click', close);
  container.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === container.querySelector('.modal-backdrop')) close();
  });

  container.querySelector('#reset-all-filters')?.addEventListener('click', () => {
    dashboardState.setFilters({ phase: 'ALL', status: 'ALL', region: 'ALL' });
    close();
  });

  container.querySelector('#apply-filter')?.addEventListener('click', () => {
    const phase = container.querySelector('#filter-phase').value;
    const status = container.querySelector('#filter-status').value;
    const region = container.querySelector('#filter-region').value;
    dashboardState.setFilters({ phase, status, region });
    close();
  });
}
