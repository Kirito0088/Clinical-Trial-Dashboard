import { dashboardState } from '../../state/dashboardState.js';

export function renderHelpModal(container) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs select-none">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">help</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">System Help & Monitoring Guide</h3>
          </div>
          <button id="close-help-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 overflow-y-auto space-y-4 text-body-sm text-on-surface">
          <!-- Section 1 -->
          <div>
            <h4 class="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">traffic</span> Monitoring Status Flags
            </h4>
            <div class="space-y-1.5 text-xs text-on-surface-variant">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"></span>
                <span><strong>On Track (Green):</strong> Enrollment $\ge 80\%$ trajectory, 0 active severe SAEs.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-on-tertiary-container flex-shrink-0"></span>
                <span><strong>Attention Needed (Amber):</strong> Pacing lag $\ge 20\%$ or upcoming milestone gate within 30 days.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-critical flex-shrink-0"></span>
                <span><strong>Critical Attention (Red):</strong> Unresolved Grade 3+ SAE or safety pause recommendation.</span>
              </div>
            </div>
          </div>

          <!-- Section 2 -->
          <div class="pt-3 border-t border-border-soft">
            <h4 class="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">hub</span> Traceability Architecture
            </h4>
            <p class="text-xs text-on-surface-variant leading-relaxed">
              Every operational recommendation maps deterministically: <code>FLAG → DRILL DOWN → SOURCE RECORD</code>. Clicking an alert immediately takes you to the responsible clinical site, participant, or MedDRA-coded event line item.
            </p>
          </div>

          <!-- Section 3: Keyboard Shortcuts -->
          <div class="pt-3 border-t border-border-soft">
            <h4 class="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm">keyboard</span> Keyboard Shortcuts
            </h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center justify-between p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
                <span>Focus Search</span>
                <kbd class="px-1.5 py-0.5 bg-surface-content border border-border-soft rounded font-mono text-[11px]">/</kbd>
              </div>
              <div class="flex items-center justify-between p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
                <span>Close Overlays</span>
                <kbd class="px-1.5 py-0.5 bg-surface-content border border-border-soft rounded font-mono text-[11px]">Esc</kbd>
              </div>
              <div class="flex items-center justify-between p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
                <span>Select Trial in Roster</span>
                <kbd class="px-1.5 py-0.5 bg-surface-content border border-border-soft rounded font-mono text-[11px]">Enter / Space</kbd>
              </div>
              <div class="flex items-center justify-between p-2 bg-surface-base border border-border-soft rounded-DEFAULT">
                <span>Navigate Roster</span>
                <kbd class="px-1.5 py-0.5 bg-surface-content border border-border-soft rounded font-mono text-[11px]">Tab</kbd>
              </div>
            </div>
          </div>

          <!-- Section 4 -->
          <div class="p-3 bg-surface-base border border-border-soft rounded-DEFAULT text-xs text-on-surface-variant">
            <span class="font-semibold text-on-surface">Prototype Disclaimer:</span> All metrics and thresholds are demonstration workflow parameters simulating GCP/ResOps monitoring environments.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-end">
          <button id="help-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-help-btn')?.addEventListener('click', close);
  container.querySelector('#help-done-btn')?.addEventListener('click', close);
}
