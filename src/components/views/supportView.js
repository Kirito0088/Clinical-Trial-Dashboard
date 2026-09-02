import { dashboardState } from '../../state/dashboardState.js';

export function renderSupportView(container) {
  container.innerHTML = `
    <div class="space-y-6 select-none max-w-4xl">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-background">Institutional Support & Ops Guide</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Clinical trial monitoring documentation, escalation protocols, and operations helpdesk.</p>
        </div>
        <button id="back-to-dash-btn" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
          <span class="material-symbols-outlined text-sm">dashboard</span> Back to Dashboard
        </button>
      </div>

      <!-- FAQ / Guide Accordion -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-6 space-y-4">
        <h3 class="font-label-md text-label-md font-bold text-primary uppercase tracking-wider mb-2">Operations Knowledge Base</h3>
        
        <div class="space-y-2 text-xs">
          <!-- Accordion 1 -->
          <details class="group border border-border-soft rounded-DEFAULT bg-surface-base p-3.5 [&_summary::-webkit-details-marker]:hidden cursor-pointer" open>
            <summary class="flex justify-between items-center font-bold text-on-surface">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">traffic</span>
                How are status flags (Critical vs Attention vs On Track) determined?
              </span>
              <span class="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <p class="text-on-surface-variant mt-2.5 leading-relaxed pl-6">
              Status is computed deterministically: any active Grade 3+ Severe Adverse Event triggers <strong>Critical Attention</strong>. An enrollment velocity lag &gt; 20% below target or a gating DSMB milestone within 30 days triggers <strong>Attention Needed</strong>. Studies with on-schedule pacing and zero severe events remain <strong>On Track</strong>.
            </p>
          </details>

          <!-- Accordion 2 -->
          <details class="group border border-border-soft rounded-DEFAULT bg-surface-base p-3.5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary class="flex justify-between items-center font-bold text-on-surface">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">hub</span>
                How does deterministic traceability work?
              </span>
              <span class="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <p class="text-on-surface-variant mt-2.5 leading-relaxed pl-6">
              Unlike generic AI summaries, all recommendations map back directly: <code>FLAG → DRILL DOWN → SOURCE RECORD</code>. Clicking an operational recommendation (e.g., on CT-042) opens the exact participating site (Site 103) and protocol amendment record that caused the lag.
            </p>
          </details>

          <!-- Accordion 3 -->
          <details class="group border border-border-soft rounded-DEFAULT bg-surface-base p-3.5 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
            <summary class="flex justify-between items-center font-bold text-on-surface">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-sm">security</span>
                Is any real Protected Health Information (PHI) used?
              </span>
              <span class="material-symbols-outlined text-sm transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <p class="text-on-surface-variant mt-2.5 leading-relaxed pl-6">
              No. All patient numbers (<code>PT-1042</code>), site names, adverse events, and milestones are synthetically generated for this hackathon workflow prototype. No real clinical records or PHI are processed.
            </p>
          </details>
        </div>
      </div>

      <!-- Contact Directory -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div class="p-4 bg-surface-content border border-border-soft rounded-DEFAULT">
          <div class="flex items-center gap-2 text-primary font-bold mb-1">
            <span class="material-symbols-outlined text-base">emergency</span>
            <span>Safety & SAE Escalation Hotline</span>
          </div>
          <p class="font-semibold text-on-surface text-sm">(800) 555-CLIN-OPS</p>
          <p class="text-on-surface-variant text-[11px] mt-0.5">24/7 Medical Monitor On-Call Desk</p>
        </div>

        <div class="p-4 bg-surface-content border border-border-soft rounded-DEFAULT">
          <div class="flex items-center gap-2 text-primary font-bold mb-1">
            <span class="material-symbols-outlined text-base">mail</span>
            <span>Data Management & eTMF Desk</span>
          </div>
          <p class="font-semibold text-on-surface text-sm">resops-support@clinicalops.org</p>
          <p class="text-on-surface-variant text-[11px] mt-0.5">SLA response time &lt; 4 hours</p>
        </div>
      </div>

      <!-- Interactive Feedback Submission -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-6 space-y-3">
        <h3 class="font-label-md text-label-md font-bold text-primary uppercase tracking-wider">Submit Operations Feedback</h3>
        <div class="space-y-2 text-xs">
          <textarea id="feedback-text" rows="3" class="w-full p-2.5 bg-surface-base border border-border-soft rounded-DEFAULT focus:outline-none focus:border-primary text-on-surface text-xs" placeholder="Describe workflow feedback, site onboarding inquiries, or bug reports..."></textarea>
          <div class="flex items-center justify-between">
            <span id="feedback-success" class="text-xs text-primary font-medium opacity-0 transition-opacity flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">check_circle</span> Feedback transmitted to ResOps log.
            </span>
            <button id="send-feedback-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-xs rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">send</span> Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-dash-btn')?.addEventListener('click', () => {
    dashboardState.setTab('dashboard');
  });

  const sendBtn = container.querySelector('#send-feedback-btn');
  const feedbackText = container.querySelector('#feedback-text');
  const successMsg = container.querySelector('#feedback-success');

  sendBtn?.addEventListener('click', () => {
    if (feedbackText.value.trim() !== '') {
      feedbackText.value = '';
      successMsg.classList.remove('opacity-0');
      setTimeout(() => { successMsg.classList.add('opacity-0'); }, 3000);
    }
  });
}
