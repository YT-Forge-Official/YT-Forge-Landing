import { loadDashboard } from '@/lib/analytics/read';
import Dashboard from './Dashboard';
import './stats.css';

// Private and always live: middleware.js puts a password in front of it, and
// every load reads the database rather than a cached render.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics · YT-FORGE',
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default async function StatsPage({ searchParams }) {
  const initial = await searchParams;

  let data;
  try {
    data = await loadDashboard();
  } catch (error) {
    console.error('stats: failed to load', error);
    return (
      <main className="stats-page">
        <div className="panel stats-card mx-auto mt-24 max-w-[560px] p-8">
          <p className="eyebrow mb-3">Analytics</p>
          <h1 className="text-[20px] font-medium tracking-[-0.02em]">Couldn’t reach the database</h1>
          <pre className="mt-4 overflow-x-auto rounded-[var(--radius-control)] bg-bg-elevated p-3 font-[family-name:var(--font-geist-mono)] text-[12px] text-err">
            {error.message}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Dashboard data={data} initial={initial} />
    </main>
  );
}
