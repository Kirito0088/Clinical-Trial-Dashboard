import { dashboardState } from '../../state/dashboardState.js';

export function renderDocumentsView(container) {
  const trial = dashboardState.getSelectedTrial();

  const documents = [
    {
      id: "DOC-4201",
      title: "Clinical Study Protocol (CSP) v3.2 - Final Approved",
      trialId: trial.id,
      type: "Protocol",
      date: "Aug 14, 2024",
      size: "4.8 MB",
      hash: "sha256-4f81c97a8e...",
      status: "Validated",
      icon: "picture_as_pdf"
    },
    {
      id: "DOC-4202",
      title: "Investigator's Brochure (IB) Edition 7",
      trialId: trial.id,
      type: "Safety Brochure",
      date: "Jun 02, 2024",
      size: "8.2 MB",
      hash: "sha256-9a02fb12d4...",
      status: "Active",
      icon: "description"
    },
    {
      id: "DOC-4203",
      title: "Data Safety Monitoring Board (DSMB) Charter v2.0",
      trialId: trial.id,
      type: "DSMB Charter",
      date: "May 19, 2024",
      size: "1.4 MB",
      hash: "sha256-e81a3d90f1...",
      status: "Signed",
      icon: "verified_user"
    },
    {
      id: "DOC-4204",
      title: "Statistical Analysis Plan (SAP) - Interim Gating Cut",
      trialId: trial.id,
      type: "Biostatistics",
      date: "Jul 10, 2024",
      size: "3.1 MB",
      hash: "sha256-2b47fc09a1...",
      status: "Validated",
      icon: "analytics"
    },
    {
      id: "DOC-4205",
      title: "Site IRB Regulatory Approval & Delegation Log - Site 101",
      trialId: trial.id,
      type: "Regulatory",
      date: "Aug 20, 2024",
      size: "2.5 MB",
      hash: "sha256-7c11de34b8...",
      status: "Approved",
      icon: "assignment_turned_in"
    }
  ];

  container.innerHTML = `
    <div class="space-y-6 select-none">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-background">Trial Protocols & Regulatory Documents</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Institutional Electronic Trial Master File (eTMF) repository & protocol audit archives.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <!-- Dossier Container -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT overflow-hidden">
        <div class="px-4 py-3 border-b border-border-soft bg-surface-alternate flex justify-between items-center flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <h3 class="font-label-md text-label-md font-semibold text-on-surface">Study Master Dossier: <strong>${trial.id}</strong></h3>
            <span class="px-2 py-0.5 bg-primary-fixed text-primary font-bold text-[10px] rounded-sm uppercase">
              eTMF Validated
            </span>
          </div>
          <span class="text-xs text-on-surface-variant">21 CFR Part 11 Digital Signature Audit Trail Active</span>
        </div>

        <div class="divide-y divide-border-soft">
          ${documents.map(doc => `
            <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-alternate/40 transition-colors">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-DEFAULT bg-surface-alternate border border-border-soft flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-xl">${doc.icon}</span>
                </div>
                <div>
                  <div class="font-body-sm text-body-sm font-bold text-on-surface">${doc.title}</div>
                  <div class="font-label-sm text-[11px] text-on-surface-variant mt-0.5">
                    ${doc.type} • Updated ${doc.date} • ${doc.size} • <span class="font-mono text-[10px]">${doc.hash}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <button data-preview-doc="${doc.id}" class="px-3 py-1.5 bg-surface-content border border-border-soft text-primary font-label-sm text-xs rounded-DEFAULT hover:bg-surface-alternate transition-colors cursor-pointer flex items-center gap-1 font-medium">
                  <span class="material-symbols-outlined text-xs">visibility</span> Preview
                </button>
                <button data-download-doc="${doc.id}" class="px-3 py-1.5 bg-primary text-on-primary font-label-sm text-xs rounded-DEFAULT hover:bg-primary-container transition-colors cursor-pointer flex items-center gap-1 font-medium">
                  <span class="material-symbols-outlined text-xs">download</span> Download PDF
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });

  container.querySelectorAll('button[data-preview-doc], button[data-download-doc]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docId = e.currentTarget.getAttribute('data-preview-doc') || e.currentTarget.getAttribute('data-download-doc');
      const doc = documents.find(d => d.id === docId);
      dashboardState.openModal('document_preview', doc);
    });
  });
}
