import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

/** Placeholder page — replaced by Yash in issue #5. */
function PortfolioPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h1 className="font-display text-2xl font-600 tracking-tight">Clinical Trials Dashboard</h1>
      <p className="text-sm text-[var(--muted)]">
        Portfolio view will be built in issue #5. API endpoints are live at{' '}
        <code className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs">/api/trials</code>
      </p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<PortfolioPlaceholder />} />
      </Route>
    </Routes>
  );
}
