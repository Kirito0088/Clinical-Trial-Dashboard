import { dashboardState } from '../state/dashboardState.js';

export function renderMetricsStrip(container) {
  const metrics = dashboardState.getMetrics();

  container.innerHTML = `
    <div class="grid grid-cols-4 gap-4 mb-6">
      <!-- Metric 1: Total Trials -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between shadow-none">
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Total Trials</span>
        <div class="flex items-end justify-between mt-2">
          <span class="font-headline-lg text-headline-lg text-on-background font-semibold">${metrics.totalTrials}</span>
          <span class="material-symbols-outlined text-primary text-xl">biotech</span>
        </div>
      </div>

      <!-- Metric 2: Total Enrollment -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between shadow-none">
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Total Enrollment</span>
        <div class="flex items-end justify-between mt-2">
          <span class="font-headline-lg text-headline-lg text-on-background font-semibold">${metrics.totalEnrollment.toLocaleString()}</span>
          <span class="material-symbols-outlined text-primary text-xl">groups</span>
        </div>
      </div>

      <!-- Metric 3: Active Adverse Events (Critical Alert) -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between relative overflow-hidden shadow-none">
        <div class="absolute inset-0 bg-error-container opacity-10"></div>
        <span class="font-label-sm text-label-sm text-critical uppercase tracking-wider relative z-10 flex items-center gap-1 font-medium">
          <span class="material-symbols-outlined text-[14px]">warning</span> Active Adverse Events
        </span>
        <div class="flex items-end justify-between mt-2 relative z-10">
          <span class="font-headline-lg text-headline-lg text-critical font-semibold">${metrics.activeAdverseEvents}</span>
          <span class="font-label-sm text-label-sm text-critical bg-error-container px-2 py-0.5 rounded-DEFAULT font-medium">${metrics.aeWeekChange}</span>
        </div>
      </div>

      <!-- Metric 4: Upcoming Milestones -->
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT p-4 flex flex-col justify-between shadow-none">
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Upcoming Milestones</span>
        <div class="flex items-end justify-between mt-2">
          <span class="font-headline-lg text-headline-lg text-on-background font-semibold">${metrics.upcomingMilestones}</span>
          <span class="material-symbols-outlined text-primary text-xl">event_available</span>
        </div>
      </div>
    </div>
  `;
}
