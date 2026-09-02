import './landing.css';
import { LANDING_VIDEOS } from './videoAssets.js';

/* ============================================================
   HELPERS & VIDEO ELEMENT FACTORY
   ============================================================ */

function makeVideo(src, { eager = false } = {}) {
  const container = document.createElement('div');
  container.className = 'lp-video-wrapper';

  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.playsInline = true;
  v.loop = true;
  v.autoplay = false;
  v.setAttribute('webkit-playsinline', 'true');
  
  if (eager) {
    v.preload = 'auto';
  } else {
    v.preload = 'metadata';
    v.setAttribute('loading', 'lazy');
  }

  container.appendChild(v);
  return container;
}

function tryPlay(video) {
  if (!video) return;
  const p = video.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => { /* Autoplay handled gracefully */ });
  }
}

/* ============================================================
   SCROLL REVEAL & VIDEO LIFECYCLE MANAGEMENT
   ============================================================ */
function setupRevealAndVideos() {
  // Reveal observer for text and cards
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .lp-feature-item, .lp-callout, .lp-trace-step, .lp-rec-card').forEach(el => revealIo.observe(el));

  // Video playback observer to ensure smooth performance
  const videoIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const video = e.target.querySelector('video');
      if (!video) return;
      if (e.isIntersecting) {
        video.preload = 'auto';
        tryPlay(video);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.lp-hero-video-panel, .lp-monitors-video-side, .lp-finds-video-side, .lp-trust-video-side, .lp-recs-video-side').forEach(el => videoIo.observe(el));
}

/* ============================================================
   NAVIGATION SCROLL & MODAL BEHAVIOR
   ============================================================ */
function setupNavAndModals() {
  const nav = document.querySelector('.lp-nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Demo Dataset modal trigger
  document.querySelectorAll('[data-action="demo-dataset"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLandingModal('demo_dataset');
    });
  });
}

function openLandingModal(type) {
  let modalContainer = document.getElementById('lp-modal-container');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'lp-modal-container';
    document.body.appendChild(modalContainer);
  }

  if (type === 'demo_dataset') {
    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 lp-modal-backdrop">
        <div class="bg-surface-content border border-border-soft rounded-DEFAULT w-full max-w-xl shadow-2xl flex flex-col overflow-hidden lp-modal-card">
          <div class="px-6 py-4 border-b border-border-soft bg-surface-alternate flex justify-between items-center">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">dataset</span>
              <h3 class="font-headline-sm text-headline-sm font-semibold text-primary">Demo Dataset Information</h3>
            </div>
            <button id="lp-close-modal-btn" class="w-8 h-8 flex items-center justify-center rounded-DEFAULT text-on-surface-variant hover:text-primary hover:bg-surface-base transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div class="p-6 space-y-4 text-body-sm text-on-surface">
            <div class="p-3.5 bg-surface-base border border-border-soft rounded-DEFAULT">
              <h4 class="font-label-md text-label-md font-semibold text-primary mb-1">Synthetic Research Operations Dataset</h4>
              <p class="text-on-surface-variant leading-relaxed text-xs">
                This monitoring system prototype operates on an enterprise synthetic cohort dataset simulating multi-center oncology, cardiology, immunology, and neurology clinical trials.
              </p>
            </div>
            <div class="space-y-2">
              <h5 class="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider text-xs">Operational Governance Notes</h5>
              <ul class="space-y-1.5 text-on-surface-variant list-disc pl-5 text-xs">
                <li><strong>Zero Real Patient Data:</strong> All subject identifiers, sites, and investigator names are synthetically generated.</li>
                <li><strong>Deterministic Traceability:</strong> All operational recommendations link directly to underlying site-level progress and MedDRA-coded safety records.</li>
                <li><strong>Non-Clinical Tool:</strong> Designed for clinical trial research operations (ResOps), monitoring pacing, and safety reporting workflows.</li>
              </ul>
            </div>
            <div class="p-3 bg-error-container/20 border border-error-container rounded-DEFAULT text-xs text-critical">
              <strong>Regulatory Disclaimer:</strong> All data is synthetic. Thresholds and recommendations are demonstration workflow values, not clinical or regulatory standards.
            </div>
          </div>
          <div class="px-6 py-3 bg-surface-base border-t border-border-soft flex justify-end">
            <button id="lp-close-modal-done" class="px-4 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-DEFAULT hover:bg-primary-container cursor-pointer font-medium text-xs">
              Understood
            </button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('lp-close-modal-btn')?.addEventListener('click', close);
    document.getElementById('lp-close-modal-done')?.addEventListener('click', close);
    modalContainer.querySelector('.lp-modal-backdrop')?.addEventListener('click', (e) => {
      if (e.target === modalContainer.querySelector('.lp-modal-backdrop')) close();
    });
  }
}

/* ============================================================
   SECTION 01 — HERO (Clinical Trial Command Center)
   ============================================================ */
function buildHero() {
  const section = document.createElement('section');
  section.className = 'lp-hero lp-section';
  section.id = 'section-hero';

  const content = document.createElement('div');
  content.className = 'lp-hero-content';
  content.innerHTML = `
    <div class="lp-eyebrow reveal">CLINICAL TRIAL MONITORING</div>

    <h1 class="lp-hero-headline reveal" style="transition-delay:0.08s">
      One clear view<br>of trial health.
    </h1>

    <p class="lp-hero-subhead reveal" style="transition-delay:0.16s">
      Monitor enrollment, adverse events and upcoming milestones across clinical trials — from one operational workspace.
    </p>

    <div class="lp-hero-actions reveal" style="transition-delay:0.22s">
      <a href="#section-dashboard" class="lp-hero-cta-primary" id="hero-cta-explore">
        Explore the Dashboard
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="8" x2="13" y2="8"/><polyline points="9,4 13,8 9,12"/>
        </svg>
      </a>
      <a href="#section-monitor" class="lp-hero-cta-ghost">
        How It Works
      </a>
    </div>

    <div class="lp-hero-meta reveal" style="transition-delay:0.3s">
      <div class="lp-hero-meta-item">
        <span class="lp-hero-meta-label">Project</span>
        <span class="lp-hero-meta-value">SIH26046</span>
      </div>
      <div class="lp-hero-meta-item">
        <span class="lp-hero-meta-label">Track</span>
        <span class="lp-hero-meta-value">Governance &amp; Monitoring</span>
      </div>
      <div class="lp-hero-meta-item">
        <span class="lp-hero-meta-label">Data</span>
        <span class="lp-hero-meta-value">Demo Dataset</span>
      </div>
    </div>
  `;

  const videoPanel = document.createElement('div');
  videoPanel.className = 'lp-hero-video-panel';
  const videoWrapper = makeVideo(LANDING_VIDEOS.hero, { eager: true });
  videoPanel.appendChild(videoWrapper);
  
  const heroVid = videoWrapper.querySelector('video');
  if (heroVid) tryPlay(heroVid);

  section.appendChild(content);
  section.appendChild(videoPanel);
  return section;
}

/* ============================================================
   SECTION 02 — WHAT IT MONITORS (Three Streams, One Trial View)
   ============================================================ */
function buildMonitors() {
  const section = document.createElement('section');
  section.className = 'lp-monitors lp-section';
  section.id = 'section-monitor';

  const inner = document.createElement('div');
  inner.className = 'lp-monitors-inner';

  const videoSide = document.createElement('div');
  videoSide.className = 'lp-monitors-video-side';
  videoSide.appendChild(makeVideo(LANDING_VIDEOS.unifiedMonitor));

  const content = document.createElement('div');
  content.className = 'lp-monitors-content';
  content.innerHTML = `
    <div class="lp-section-label reveal">WHAT IT MONITORS</div>

    <h2 class="lp-section-headline reveal" style="transition-delay:0.07s">
      Everything that matters.<br>In one view.
    </h2>

    <div class="lp-feature-list">
      <div class="lp-feature-item" style="transition-delay:0.1s">
        <div class="lp-feature-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="6"/><polyline points="8,4 8,8 11,10"/>
          </svg>
        </div>
        <div>
          <div class="lp-feature-title">Enrollment</div>
          <div class="lp-feature-desc">Track progress across trials and sites with pacing indicators that highlight lag before it becomes a bottleneck.</div>
        </div>
      </div>

      <div class="lp-feature-item" style="transition-delay:0.18s">
        <div class="lp-feature-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2L9.5 6h4.5l-3.6 2.6 1.4 4.4L8 10.5l-3.8 2.5 1.4-4.4L2 6h4.5z"/>
          </svg>
        </div>
        <div>
          <div class="lp-feature-title">Adverse Events</div>
          <div class="lp-feature-desc">Surface serious and unresolved events graded by severity, traceable back to the exact subject and clinical site.</div>
        </div>
      </div>

      <div class="lp-feature-item" style="transition-delay:0.26s">
        <div class="lp-feature-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="12" height="11" rx="1"/><line x1="2" y1="7" x2="14" y2="7"/>
            <line x1="6" y1="1" x2="6" y2="5"/><line x1="10" y1="1" x2="10" y2="5"/>
          </svg>
        </div>
        <div>
          <div class="lp-feature-title">Milestones</div>
          <div class="lp-feature-desc">Know what is completed, overdue or due next across protocol milestones and independent DSMB gating reviews.</div>
        </div>
      </div>
    </div>
  `;

  inner.appendChild(videoSide);
  inner.appendChild(content);
  section.appendChild(inner);
  return section;
}

/* ============================================================
   SECTION 03 — WHAT IT FINDS (From Data to Attention)
   ============================================================ */
function buildFinds() {
  const section = document.createElement('section');
  section.className = 'lp-finds lp-section';
  section.id = 'section-finds';

  const inner = document.createElement('div');
  inner.className = 'lp-finds-inner';

  const content = document.createElement('div');
  content.className = 'lp-finds-content';
  content.innerHTML = `
    <div class="lp-section-label reveal" style="color:rgba(198,235,220,0.7)">WHAT IT FINDS</div>

    <h2 class="lp-finds-headline reveal" style="transition-delay:0.07s">
      From raw data to<br>what needs attention.
    </h2>

    <p class="lp-finds-subtext reveal" style="transition-delay:0.13s">
      The monitoring layer identifies operational issues before they get buried inside separate reports.
    </p>

    <div class="lp-callouts">
      <div class="lp-callout" style="transition-delay:0.1s">
        <span class="lp-callout-badge red">Behind Plan</span>
        <div>
          <div class="lp-callout-title">Behind Plan</div>
          <div class="lp-callout-desc">Enrollment is falling behind expected pace.</div>
        </div>
      </div>

      <div class="lp-callout" style="transition-delay:0.18s">
        <span class="lp-callout-badge amber">Unresolved</span>
        <div>
          <div class="lp-callout-title">Unresolved</div>
          <div class="lp-callout-desc">Serious events remain visible until reviewed.</div>
        </div>
      </div>

      <div class="lp-callout" style="transition-delay:0.26s">
        <span class="lp-callout-badge teal">Due Next</span>
        <div>
          <div class="lp-callout-title">Due Next</div>
          <div class="lp-callout-desc">Upcoming and overdue milestones stay in view.</div>
        </div>
      </div>
    </div>
  `;

  const videoSide = document.createElement('div');
  videoSide.className = 'lp-finds-video-side';
  videoSide.appendChild(makeVideo(LANDING_VIDEOS.attention));

  inner.appendChild(content);
  inner.appendChild(videoSide);
  section.appendChild(inner);
  return section;
}

/* ============================================================
   SECTION 04 — WHY IT CAN BE TRUSTED (From Alert to Source)
   ============================================================ */
function buildTrust() {
  const section = document.createElement('section');
  section.className = 'lp-trust lp-section';
  section.id = 'section-trust';

  const inner = document.createElement('div');
  inner.className = 'lp-trust-inner';

  const videoSide = document.createElement('div');
  videoSide.className = 'lp-trust-video-side';
  videoSide.appendChild(makeVideo(LANDING_VIDEOS.traceability));

  const content = document.createElement('div');
  content.className = 'lp-trust-content';
  content.innerHTML = `
    <div class="lp-section-label reveal">WHY IT CAN BE TRUSTED</div>

    <h2 class="lp-section-headline reveal" style="transition-delay:0.07s">
      Every alert has a reason.
    </h2>

    <p class="lp-finds-subtext reveal" style="transition-delay:0.12s; color:var(--color-text-muted)">
      Move from a portfolio-level warning to the exact site, event or milestone record behind it.
    </p>

    <div class="lp-trace-chain reveal" style="transition-delay:0.18s">
      <div class="lp-trace-step visible" style="transition-delay:0.1s">
        <div class="lp-trace-dot active"></div>
        <div>
          <div class="lp-trace-label">Flag</div>
          <div class="lp-trace-text">Identify the issue.</div>
        </div>
      </div>
      <div class="lp-trace-step" style="transition-delay:0.2s">
        <div class="lp-trace-dot"></div>
        <div>
          <div class="lp-trace-label">Drill Down</div>
          <div class="lp-trace-text">Follow it into the trial.</div>
        </div>
      </div>
      <div class="lp-trace-step" style="transition-delay:0.3s">
        <div class="lp-trace-dot"></div>
        <div>
          <div class="lp-trace-label">Source</div>
          <div class="lp-trace-text">See the underlying record.</div>
        </div>
      </div>
    </div>

    <div class="lp-trust-statement reveal" style="transition-delay:0.4s">
      <span class="lp-trust-statement-line">No unexplained alerts.</span>
      <span class="lp-trust-statement-line">No hidden source data.</span>
    </div>
  `;

  inner.appendChild(videoSide);
  inner.appendChild(content);
  section.appendChild(inner);
  return section;
}

/* ============================================================
   SECTION 05 — WHAT TO DO NEXT (Operational Recommendations)
   ============================================================ */
function buildRecommendations() {
  const section = document.createElement('section');
  section.className = 'lp-recs lp-section';
  section.id = 'section-recs';

  const inner = document.createElement('div');
  inner.className = 'lp-recs-inner';

  const content = document.createElement('div');
  content.className = 'lp-recs-content';
  content.innerHTML = `
    <div class="lp-section-label reveal">WHAT TO DO NEXT</div>

    <h2 class="lp-recs-headline reveal" style="transition-delay:0.07s">
      Know what deserves<br>attention next.
    </h2>

    <p class="lp-recs-subtext reveal" style="transition-delay:0.13s">
      Turn monitoring signals into a clear operational next step without replacing the underlying data.
    </p>

    <div class="lp-rec-card" style="transition-delay:0.2s">
      <div class="lp-rec-card-header">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-attention)">
          <path d="M8 2L14 12H2L8 2z"/><line x1="8" y1="8" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.5" fill="currentColor"/>
        </svg>
        <span class="lp-rec-card-label">RECOMMENDATION</span>
        <span class="lp-rec-card-priority">HIGH PRIORITY</span>
      </div>
      <div class="lp-rec-card-title">Prioritize enrollment review</div>
      <p class="lp-rec-card-text">
        Enrollment is currently below the expected trajectory. Review site-level enrollment performance before the next monitoring milestone.
      </p>
      <div class="lp-rec-card-action">Review Enrollment</div>
      <div class="lp-rec-card-note">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="6"/><line x1="8" y1="10" x2="8" y2="8"/><circle cx="8" cy="5.5" r="0.5" fill="currentColor"/>
        </svg>
        Visual preview — the interactive recommendation engine runs live below.
      </div>
    </div>
  `;

  const videoSide = document.createElement('div');
  videoSide.className = 'lp-recs-video-side';
  videoSide.appendChild(makeVideo(LANDING_VIDEOS.recommendations));

  inner.appendChild(content);
  inner.appendChild(videoSide);
  section.appendChild(inner);
  return section;
}

/* ============================================================
   SECTION 06 — LIVE MONITORING WORKSPACE (Interactive Dashboard)
   ============================================================ */
function buildDashboardSection() {
  const section = document.createElement('section');
  section.className = 'lp-dashboard-section lp-section';
  section.id = 'section-dashboard';

  section.innerHTML = `
    <div class="lp-dashboard-container">
      <!-- Section Header -->
      <div class="lp-dashboard-header text-center mb-8">
        <div class="lp-eyebrow justify-center mb-2 reveal">LIVE MONITORING WORKSPACE</div>
        <h2 class="lp-section-headline text-white mb-3 reveal" style="transition-delay:0.08s">
          See the signals in context.
        </h2>
        <p class="lp-hero-subhead text-white/70 mx-auto max-w-2xl reveal" style="transition-delay:0.16s">
          Explore trials, enrollment, adverse events, milestones and operational recommendations in the live monitoring workspace.
        </p>
      </div>

      <!-- Live Interactive Window Frame -->
      <div class="lp-workspace-window-frame reveal" style="transition-delay:0.24s">
        <!-- Window Chrome Top Bar -->
        <div class="lp-window-topbar">
          <div class="lp-window-dots">
            <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
          </div>
          <div class="lp-window-title">
            <span class="material-symbols-outlined text-xs text-primary">biotech</span>
            <span>Clinical Trial Monitoring Workspace — Live Interactive Session</span>
          </div>
          <div class="lp-window-actions">
            <a href="/index.html" class="lp-window-btn" title="Open Fullscreen Workspace">
              <span class="material-symbols-outlined text-xs">open_in_new</span> Fullscreen
            </a>
          </div>
        </div>

        <!-- Embedded Live Application -->
        <div class="lp-window-canvas">
          <iframe 
            src="/index.html" 
            title="Clinical Trial Monitoring Dashboard"
            class="lp-embedded-app"
            loading="lazy"
            allow="fullscreen"
          ></iframe>
        </div>
      </div>
    </div>
  `;

  return section;
}

/* ============================================================
   SECTION 07 — CLOSING CTA
   ============================================================ */
function buildClosingCta() {
  const section = document.createElement('section');
  section.className = 'lp-closing-section lp-section';
  section.id = 'section-closing';

  section.innerHTML = `
    <div class="lp-closing-content text-center">
      <h2 class="lp-closing-headline reveal">
        Built for clearer trial oversight.
      </h2>
      <p class="lp-closing-subhead reveal" style="transition-delay:0.08s">
        A unified monitoring workflow for enrollment, safety and milestones.
      </p>
      <div class="lp-closing-actions reveal" style="transition-delay:0.16s">
        <a href="/index.html" class="lp-hero-cta-primary">
          Explore Dashboard
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="8" x2="13" y2="8"/><polyline points="9,4 13,8 9,12"/>
          </svg>
        </a>
        <a href="#section-hero" class="lp-hero-cta-ghost">
          Back to Overview
        </a>
      </div>
      <div class="lp-closing-disclaimer reveal" style="transition-delay:0.24s">
        <span class="material-symbols-outlined text-xs">info</span>
        All data is synthetic. Thresholds and recommendations are demonstration workflow values, not clinical or regulatory standards.
      </div>
    </div>
  `;

  return section;
}

/* ============================================================
   TOP NAVIGATION BAR
   ============================================================ */
function buildNav() {
  const nav = document.createElement('nav');
  nav.className = 'lp-nav';
  nav.setAttribute('aria-label', 'Primary navigation');

  nav.innerHTML = `
    <a href="#section-hero" class="lp-nav-brand" aria-label="Research Ops — Home">
      <span class="lp-nav-brand-dot" aria-hidden="true"></span>
      Research Ops
    </a>

    <ul class="lp-nav-links" role="list">
      <li><a href="#section-hero">Overview</a></li>
      <li><a href="#section-monitor">How It Works</a></li>
      <li><a href="#section-dashboard">Dashboard</a></li>
    </ul>

    <div class="lp-nav-actions">
      <button data-action="demo-dataset" class="lp-nav-demo-badge cursor-pointer hover:bg-surface-variant transition-colors" aria-label="Demo dataset active">
        <span class="material-symbols-outlined text-xs">dataset</span>
        Demo Dataset
      </button>
      <a href="/index.html" class="lp-btn-primary" id="nav-open-dashboard">
        Open Dashboard
      </a>
    </div>
  `;

  return nav;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
function init() {
  document.body.innerHTML = '';

  const nav = buildNav();
  document.body.appendChild(nav);

  document.body.appendChild(buildHero());
  document.body.appendChild(buildMonitors());
  document.body.appendChild(buildFinds());
  document.body.appendChild(buildTrust());
  document.body.appendChild(buildRecommendations());
  document.body.appendChild(buildDashboardSection());
  document.body.appendChild(buildClosingCta());

  // Attach interactive behaviors
  setupNavAndModals();
  setupRevealAndVideos();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
