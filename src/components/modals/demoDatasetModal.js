import { dashboardState } from '../../state/dashboardState.js';

export function renderDemoDatasetModal(container) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-xl shadow-xl flex flex-col overflow-hidden modal-card">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">dataset</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Demo Dataset Information</h3>
          </div>
          <button id="close-demo-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 text-body-sm text-on-surface">
          <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT">
            <h4 class="font-label-md text-label-md font-semibold text-primary mb-1">Synthetic Research Operations Dataset</h4>
            <p class="text-on-surface-variant leading-relaxed">
              This application utilizes an enterprise synthetic cohort dataset simulating multi-center oncology, cardiology, immunology, and neurology clinical trials.
            </p>
          </div>

          <div class="space-y-2">
            <h5 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">Compliance & Traceability Notes</h5>
            <ul class="space-y-1.5 text-on-surface-variant list-disc pl-5">
              <li><strong>Zero Real Patient Data:</strong> All subject identifiers, sites, and investigator names are synthetically generated.</li>
              <li><strong>Operational Traceability:</strong> All recommendations link directly to underlying site-level progress or MedDRA event records.</li>
              <li><strong>Non-Clinical Tool:</strong> This is a research operations prototype for monitoring workflow validation.</li>
            </ul>
          </div>

          <div class="p-3 bg-error-container/20 border border-error-container rounded-DEFAULT text-xs text-critical">
            <strong>Regulatory Disclaimer:</strong> All data is synthetic. Thresholds and recommendations are demo workflow values, not clinical or regulatory standards.
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-end">
          <button id="close-demo-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer">
            Understood
          </button>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-demo-btn')?.addEventListener('click', close);
  container.querySelector('#close-demo-done-btn')?.addEventListener('click', close);
  container.querySelector('.modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === container.querySelector('.modal-backdrop')) close();
  });
}
