import { dashboardState } from '../../state/dashboardState.js';

export function renderSupportView(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-semibold text-on-background">Institutional Support & Operations Help</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Research Monitoring System protocols, contact directory, and system documentation.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-surface-alternate border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-variant flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-6 space-y-6">
        <div>
          <h3 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-3">Clinical Operations Support Desk</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            For technical issues with eCRF ingest, site onboarding, or DSMB schedule coordination, contact the Institutional Operations Helpdesk.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-surface-base border border-border-soft rounded-DEFAULT">
            <h4 class="font-label-md text-label-md font-semibold text-primary mb-1">Safety & Pharmacovigilance</h4>
            <p class="font-body-sm text-body-sm text-on-surface">Hotline: (800) 555-CLIN-OPS</p>
            <p class="font-label-sm text-label-sm text-on-surface-variant">Available 24/7 for SAE escalation</p>
          </div>
          <div class="p-4 bg-surface-base border border-border-soft rounded-DEFAULT">
            <h4 class="font-label-md text-label-md font-semibold text-primary mb-1">Data Management & eTMF</h4>
            <p class="font-body-sm text-body-sm text-on-surface">Email: datamgmt@institutionalops.org</p>
            <p class="font-label-sm text-label-sm text-on-surface-variant">Response SLA: &lt; 4 hours</p>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });
}
