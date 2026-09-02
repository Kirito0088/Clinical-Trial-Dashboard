import { dashboardState } from '../../state/dashboardState.js';

export function renderDocumentPreviewModal(container, doc) {
  const documentData = doc || {
    title: "Clinical Study Protocol (CSP) v3.2 - Final Approved",
    trialId: "CT-042",
    type: "Protocol",
    date: "Aug 14, 2024",
    size: "4.8 MB",
    hash: "sha256-4f81c97a8e...",
    status: "Validated & Digitally Signed"
  };

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs select-none">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">description</span>
            <div>
              <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">${documentData.title}</h3>
              <p class="text-[11px] text-on-surface-variant">Study: ${documentData.trialId} • eTMF Classification: ${documentData.type}</p>
            </div>
          </div>
          <button id="close-doc-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Document Preview Canvas -->
        <div class="p-6 overflow-y-auto space-y-4 bg-surface-base text-body-sm text-on-surface font-mono">
          <div class="bg-surface-content border border-border-soft p-6 rounded-DEFAULT shadow-xs space-y-4 text-xs font-sans">
            <div class="flex justify-between items-start border-b border-border-soft pb-4">
              <div>
                <div class="font-bold text-primary text-sm uppercase">MEMORIAL RESEARCH NETWORK</div>
                <div class="text-on-surface-variant text-[11px]">Division of Clinical Trial Governance & Monitoring</div>
              </div>
              <span class="px-2 py-0.5 bg-primary-fixed text-primary font-semibold text-[10px] rounded-sm uppercase">
                ${documentData.status}
              </span>
            </div>

            <div class="space-y-2">
              <h4 class="font-bold text-on-surface text-sm">${documentData.title}</h4>
              <p class="text-on-surface-variant leading-relaxed text-xs">
                This document constitutes the authoritative institutional monitoring protocol governing synthetic multi-center cohorts for protocol <strong>${documentData.trialId}</strong>. All adverse events, patient visits, and site milestones are audited against this specification.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 bg-surface-base p-3 border border-border-soft rounded-DEFAULT text-[11px] font-mono">
              <div>Effective Date: <strong>${documentData.date}</strong></div>
              <div>Document Size: <strong>${documentData.size}</strong></div>
              <div>Audit Hash: <strong>${documentData.hash}</strong></div>
              <div>Part 11 Compliant: <strong>Yes (Verified)</strong></div>
            </div>

            <div class="border-t border-border-soft pt-3 text-[11px] text-on-surface-variant">
              <strong>Digital Signatures:</strong> Dr. A. Chen (Principal Investigator, Aug 14, 2024), Institutional Review Board Chair (Signed).
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center">
          <span class="text-xs text-on-surface-variant">Synthetic document demonstration</span>
          <div class="flex items-center gap-2">
            <button id="doc-download-sim-btn" class="px-3 py-1.5 bg-surface-content border border-border-soft text-primary font-label-md text-label-md rounded-DEFAULT hover:bg-surface-alternate cursor-pointer text-xs font-medium flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">download</span> Export Copy
            </button>
            <button id="doc-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium text-xs">
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-doc-btn')?.addEventListener('click', close);
  container.querySelector('#doc-done-btn')?.addEventListener('click', close);
  container.querySelector('#doc-download-sim-btn')?.addEventListener('click', () => {
    alert(`Document "${documentData.title}" simulated download complete (Hash: ${documentData.hash}).`);
  });
}
