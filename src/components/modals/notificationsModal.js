import { dashboardState } from '../../state/dashboardState.js';

export function renderNotificationsModal(container) {
  const notifs = dashboardState.notifications;
  const unreadCount = dashboardState.getUnreadNotificationsCount();

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs select-none">
      <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">notifications</span>
            <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Monitoring Alerts & Notifications</h3>
            ${unreadCount > 0 ? `
              <span class="px-2 py-0.5 bg-critical text-on-error font-bold text-[10px] rounded-full">
                ${unreadCount} New
              </span>
            ` : ''}
          </div>
          <div class="flex items-center gap-2">
            <button id="mark-all-read-btn" class="text-xs text-primary font-medium hover:underline cursor-pointer">
              Mark all as read
            </button>
            <button id="close-notifs-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        <!-- Notification List -->
        <div class="p-4 overflow-y-auto divide-y divide-border-soft space-y-2">
          ${notifs.length === 0 ? `
            <div class="p-8 text-center text-on-surface-variant text-xs">
              <span class="material-symbols-outlined text-3xl text-primary mb-1">mark_email_read</span>
              <p>No active notifications in the queue.</p>
            </div>
          ` : notifs.map(n => {
            const isCritical = n.type === 'critical';
            const isAttention = n.type === 'attention';

            return `
              <div data-notif-id="${n.id}" class="p-3 rounded-DEFAULT transition-colors ${
                !n.read ? 'bg-surface-base border-l-4 border-l-primary font-medium' : 'hover:bg-surface-alternate/40'
              }">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded-sm font-mono text-[10px] font-bold ${
                      isCritical ? 'bg-error-container text-critical' : isAttention ? 'bg-on-tertiary-container/20 text-on-tertiary-container' : 'bg-surface-alternate text-on-surface'
                    }">
                      ${n.trialId}
                    </span>
                    <span class="font-body-sm text-body-sm font-semibold text-on-surface">${n.title}</span>
                  </div>
                  <span class="text-[11px] text-on-surface-variant flex-shrink-0">${n.timestamp}</span>
                </div>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">${n.desc}</p>
                <div class="flex items-center justify-between mt-2 pt-1">
                  <button data-action="inspect-notif" data-trial="${n.trialId}" data-tab="${n.actionTab}" data-target="${n.targetId}" data-notif-id="${n.id}" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                    Inspect in Workspace <span class="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                  ${!n.read ? `
                    <button data-action="mark-read" data-notif-id="${n.id}" class="text-[11px] text-on-surface-variant hover:text-primary cursor-pointer">
                      Mark as read
                    </button>
                  ` : `
                    <span class="text-[11px] text-outline">Read</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-between items-center text-xs text-on-surface-variant">
          <span>Real-time safety telemetry active</span>
          <button id="notifs-done-btn" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  `;

  const close = () => dashboardState.closeModal();
  container.querySelector('#close-notifs-btn')?.addEventListener('click', close);
  container.querySelector('#notifs-done-btn')?.addEventListener('click', close);

  container.querySelector('#mark-all-read-btn')?.addEventListener('click', () => {
    dashboardState.markAllNotificationsRead();
    renderNotificationsModal(container);
  });

  container.querySelectorAll('button[data-action="mark-read"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-notif-id');
      dashboardState.markNotificationRead(id);
      renderNotificationsModal(container);
    });
  });

  container.querySelectorAll('button[data-action="inspect-notif"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const trialId = e.currentTarget.getAttribute('data-trial');
      const tab = e.currentTarget.getAttribute('data-tab');
      const targetId = e.currentTarget.getAttribute('data-target');
      const notifId = e.currentTarget.getAttribute('data-notif-id');

      dashboardState.markNotificationRead(notifId);
      dashboardState.selectTrial(trialId);
      dashboardState.setTab('dashboard');
      if (tab) dashboardState.setPanelTab(tab);
      if (tab === 'patients' && targetId) dashboardState.selectPatient(targetId);
      if (tab === 'events' && targetId) dashboardState.selectEvent(targetId);

      close();
    });
  });
}
