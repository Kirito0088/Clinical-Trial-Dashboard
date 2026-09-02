import { dashboardState } from '../../state/dashboardState.js';

export function renderMilestoneModal(container, data) {
  const trial = data?.trial || dashboardState.getSelectedTrial();
  const milestone = data?.milestone || trial?.milestones[0];

  if (!trial || !milestone) return;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden modal-card">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-2xl">flag</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Milestone Schedule & Dependencies</h3>
                <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant font-medium">
                  ${trial.id}
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${trial.title}</p>
            </div>
          </div>
          <button id="close-modal-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Milestone Overview Content -->
        <div class="p-6 flex-1 overflow-y-auto space-y-5">
          <div class="bg-surface-base border border-border-soft p-4 rounded-DEFAULT">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Active Milestone Target</span>
                <h4 class="font-headline-sm text-headline-sm text-primary font-bold mt-1">${milestone.name}</h4>
              </div>
              <span class="px-2.5 py-1 bg-primary text-on-primary font-label-sm text-label-sm rounded-DEFAULT font-semibold">
                Due: ${milestone.due}
              </span>
            </div>
            ${milestone.dueDays ? `
              <p class="font-body-sm text-body-sm text-critical font-medium mt-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">schedule</span> Target deadline in ${milestone.dueDays} days
              </p>
            ` : ''}
          </div>

          <!-- Milestones Timeline in Trial -->
          <div>
            <h5 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-3">Protocol Milestone Timeline</h5>
            <div class="space-y-3">
              ${trial.milestones.map((m, idx) => {
                const isCurrent = m.name === milestone.name;
                return `
                  <div class="p-3 border rounded-DEFAULT flex items-center justify-between ${
                    isCurrent ? 'bg-surface-alternate border-primary' : 'bg-surface-content border-border-soft'
                  }">
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full border-2 ${isCurrent ? 'border-primary bg-primary text-on-primary' : 'border-border-soft bg-surface-content text-on-surface-variant'} flex items-center justify-center font-mono text-xs font-bold">
                        ${idx + 1}
                      </div>
                      <div>
                        <div class="font-body-sm text-body-sm font-semibold text-on-surface">${m.name}</div>
                        <div class="font-label-sm text-label-sm text-on-surface-variant">Scheduled: ${m.due}</div>
                      </div>
                    </div>
                    <span class="text-xs font-medium px-2 py-0.5 rounded-DEFAULT ${
                      m.completed ? 'bg-primary-fixed text-primary' : isCurrent ? 'bg-primary text-on-primary' : 'bg-surface-base text-on-surface-variant'
                    }">
                      ${m.completed ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Operational Dependencies Checklist -->
          <div>
            <h5 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-2">Required Monitoring Gates</h5>
            <ul class="text-body-sm text-on-surface space-y-2">
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span>Site electronic Case Report Form (eCRF) 90%+ lock threshold</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span>Unresolved Serious Adverse Event (SAE) medical monitor sign-off</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-on-tertiary-container text-sm">pending</span>
                <span>Independent DSMB unblinded statistical analysis package delivery</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <span class="font-label-sm text-label-sm text-outline flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">info</span> Trial Protocol Schedule v2.4
          </span>
          <button id="modal-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind close buttons
  const close = () => dashboardState.closeModal();
  container.querySelector('#close-modal-btn')?.addEventListener('click', close);
  container.querySelector('#modal-done-btn')?.addEventListener('click', close);
  container.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === container.querySelector('.modal-backdrop')) close();
  });
}
