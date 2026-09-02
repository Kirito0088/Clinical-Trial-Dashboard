import { dashboardState } from '../../state/dashboardState.js';

export function renderAeReportModal(container, trial) {
  if (!trial) return;

  const aes = trial.adverseEvents || [];

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden modal-card">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-critical text-2xl">medical_services</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Adverse Event Safety Dossier</h3>
                <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant font-medium">
                  ${trial.id} - Ph. ${trial.phase}
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${trial.title}</p>
            </div>
          </div>
          <button id="close-modal-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Traceability Breadcrumb / Safety Stats -->
        <div class="px-6 py-3 bg-surface-base border-b border-border-soft flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-on-surface-variant">
            <span class="font-semibold text-primary">SAFETY TRACEABILITY:</span>
            <span>Adverse Events Panel</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="text-critical font-semibold">Active & Severe Signals</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="font-semibold text-on-surface">Source Subject Records</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-medium text-on-surface-variant">Severe: <strong class="text-critical">${trial.aesSevere}</strong></span>
            <span class="font-medium text-on-surface-variant">Mild/Mod: <strong class="text-on-surface">${trial.aesMildMod}</strong></span>
            <span class="font-medium text-on-surface-variant">Total: <strong class="text-primary">${trial.aesTotal}</strong></span>
          </div>
        </div>

        <!-- AE Records Table -->
        <div class="p-6 flex-1 overflow-y-auto">
          ${aes.length === 0 ? `
            <div class="py-12 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span class="material-symbols-outlined text-4xl text-primary">verified_user</span>
              <p class="font-headline-sm text-headline-sm font-semibold text-on-surface">No Adverse Events Logged</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant">This trial currently has zero active or reported adverse events.</p>
            </div>
          ` : `
            <div class="border border-border-soft rounded-DEFAULT overflow-hidden bg-surface-content">
              <div class="grid grid-cols-12 gap-3 px-4 py-2.5 bg-surface-alternate border-b border-border-soft font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                <div class="col-span-2">AE ID / Subject</div>
                <div class="col-span-2">Severity / Grade</div>
                <div class="col-span-3">Reported Term & Date</div>
                <div class="col-span-3">Action & Causality</div>
                <div class="col-span-2 text-right">Status</div>
              </div>
              <div class="divide-y divide-border-soft">
                ${aes.map(ae => {
                  const isSevere = ae.severity === 'Severe';
                  return `
                    <div class="grid grid-cols-12 gap-3 px-4 py-3 items-center ${isSevere ? 'bg-error-container/10 border-l-4 border-l-critical' : 'hover:bg-surface-alternate/50'} transition-colors">
                      <div class="col-span-2">
                        <div class="font-mono font-medium text-body-sm text-primary">${ae.id}</div>
                        <div class="font-mono text-label-sm text-on-surface-variant">${ae.subjectId} (${ae.site})</div>
                      </div>
                      <div class="col-span-2">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-DEFAULT text-xs font-semibold ${
                          isSevere 
                            ? 'bg-error-container text-critical' 
                            : ae.severity === 'Moderate'
                              ? 'bg-surface-variant text-on-surface'
                              : 'bg-surface-alternate text-on-surface-variant'
                        }">
                          ${isSevere ? '<span class="material-symbols-outlined text-[12px]">warning</span>' : ''}
                          ${ae.severity} (${ae.grade})
                        </span>
                      </div>
                      <div class="col-span-3">
                        <div class="font-body-sm text-body-sm font-medium text-on-surface">${ae.term}</div>
                        <div class="font-label-sm text-label-sm text-on-surface-variant">Reported: ${ae.date}</div>
                      </div>
                      <div class="col-span-3">
                        <div class="font-body-sm text-body-sm text-on-surface">${ae.actionTaken}</div>
                        <div class="font-label-sm text-label-sm text-on-surface-variant">Relatedness: <strong class="text-on-surface">${ae.related}</strong></div>
                      </div>
                      <div class="col-span-2 text-right">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-xs font-medium ${
                          ae.status === 'Active' 
                            ? 'bg-error-container text-critical font-semibold' 
                            : 'bg-primary-fixed text-primary'
                        }">
                          ${ae.status}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <span class="font-label-sm text-label-sm text-outline flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">shield</span> MedDRA Synthetic Safety Codification
          </span>
          <button id="modal-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer">
            Close View
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
