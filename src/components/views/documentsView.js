import { dashboardState } from '../../state/dashboardState.js';

export function renderDocumentsView(container) {
  const trial = dashboardState.getSelectedTrial();

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-semibold text-on-background">Trial Protocols & Regulatory Documents</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Institutional eTMF (Electronic Trial Master File) repository.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <div class="bg-surface-content border border-border-soft rounded-DEFAULT overflow-hidden">
        <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <h3 class="font-label-md text-label-md font-semibold text-on-surface">Active Study Master Dossier: ${trial.id}</h3>
          <span class="px-2 py-0.5 bg-surface-content border border-border-soft rounded-DEFAULT font-label-sm text-label-sm text-on-surface-variant">
            eTMF Status: Validated
          </span>
        </div>

        <div class="divide-y divide-border-soft">
          <div class="p-4 flex items-center justify-between hover:bg-surface-alternate/40 transition-colors">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Clinical Study Protocol (CSP) v3.2 - Final Approved</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Updated Aug 14, 2024 • 4.8 MB • Hash: sha256-4f81c9...</div>
              </div>
            </div>
            <button class="px-3 py-1 bg-surface-alternate border border-border-soft text-primary font-label-sm text-label-sm rounded-DEFAULT hover:bg-surface-variant cursor-pointer">
              Download PDF
            </button>
          </div>

          <div class="p-4 flex items-center justify-between hover:bg-surface-alternate/40 transition-colors">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-2xl">description</span>
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Investigator's Brochure (IB) Edition 7</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Updated Jun 02, 2024 • 8.2 MB • Global Regulatory Copy</div>
              </div>
            </div>
            <button class="px-3 py-1 bg-surface-alternate border border-border-soft text-primary font-label-sm text-label-sm rounded-DEFAULT hover:bg-surface-variant cursor-pointer">
              Download PDF
            </button>
          </div>

          <div class="p-4 flex items-center justify-between hover:bg-surface-alternate/40 transition-colors">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-2xl">verified_user</span>
              <div>
                <div class="font-body-sm text-body-sm font-semibold text-on-surface">Data Safety Monitoring Board (DSMB) Charter v2.0</div>
                <div class="font-label-sm text-label-sm text-on-surface-variant">Updated May 19, 2024 • 1.4 MB • Unblinded Statistical Gate</div>
              </div>
            </div>
            <button class="px-3 py-1 bg-surface-alternate border border-border-soft text-primary font-label-sm text-label-sm rounded-DEFAULT hover:bg-surface-variant cursor-pointer">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });
}
