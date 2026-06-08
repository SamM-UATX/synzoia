import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';
import ErrorCard from '@/components/ui/ErrorCard';
import RowListSkeleton from '@/components/ui/RowListSkeleton';
import TabStrip from '@/components/ui/TabStrip';
import {
  getGlobalDaily,
  getGlobalRanking,
  type LeaderboardEntry,
} from '@/api/steps';
import { currentDate } from '@/lib/dates';

const TABS = [
  { key: 'today',   label: 'Today' },
  { key: 'ranking', label: 'Last 30 days' },
];

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatHeadingDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

const RANK_COLORS = ['var(--amber)', '#9ba8b0', '#b87040'];

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColor = entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : undefined;
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-b-0 group">
      <span
        className="label-mono w-6 shrink-0 text-center text-xs font-bold"
        style={{ color: rankColor ?? 'var(--muted-foreground)' }}
      >
        {entry.rank}
      </span>
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, var(--primary), var(--fern))` }}
      >
        {entry.username[0]?.toUpperCase()}
      </div>
      <Link
        to={`/u/${encodeURIComponent(entry.username)}`}
        className="font-medium text-sm hover:text-primary transition-colors flex-1 min-w-0 truncate"
      >
        @{entry.username}
      </Link>
      <span className="font-mono text-sm tabular-nums text-foreground font-semibold">
        {formatNumber(entry.total)}
      </span>
    </li>
  );
}

function LeaderboardList({ leaderboard, emptyMessage }: { leaderboard: LeaderboardEntry[]; emptyMessage: string }) {
  if (leaderboard.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <ul>
      {leaderboard.map((entry) => (
        <LeaderboardRow key={entry.username} entry={entry} />
      ))}
    </ul>
  );
}

function TodayPanel() {
  const today = currentDate();
  const query = useQuery({
    queryKey: ['steps', 'daily', today],
    queryFn: () => getGlobalDaily(today),
    staleTime: 30_000,
  });

  if (query.isPending) return <RowListSkeleton />;
  if (query.isError) return <ErrorCard error={query.error} onRetry={() => query.refetch()} fallbackMessage="Could not load the leaderboard." />;

  return (
    <div className="surface-glass rounded-2xl p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-border/60">
        <h2 className="font-display text-xl tracking-tight">{formatHeadingDate(query.data.date)}</h2>
        <span className="label-mono text-muted-foreground">{formatNumber(query.data.total_steps)} total</span>
      </div>
      <LeaderboardList leaderboard={query.data.leaderboard} emptyMessage="No one has posted yet today." />
    </div>
  );
}

function RankingPanel() {
  const today = currentDate();
  const query = useQuery({
    queryKey: ['steps', 'ranking', today],
    queryFn: () => getGlobalRanking(today),
    staleTime: 30_000,
  });

  if (query.isPending) return <RowListSkeleton />;
  if (query.isError) return <ErrorCard error={query.error} onRetry={() => query.refetch()} fallbackMessage="Could not load the leaderboard." />;

  return (
    <div className="surface-glass rounded-2xl p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-border/60">
        <h2 className="font-display text-xl tracking-tight">Last 30 days</h2>
        <span className="label-mono text-muted-foreground">{formatNumber(query.data.total_steps)} total</span>
      </div>
      <LeaderboardList leaderboard={query.data.leaderboard} emptyMessage="No one has posted in the last 30 days." />
    </div>
  );
}

export default function Leaderboard() {
  const [params] = useSearchParams();
  const active = params.get('tab') ?? 'today';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Leaderboard</h1>
        <p className="label-mono text-muted-foreground mt-0.5">Step rankings across all members.</p>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '🥇 Today\'s leader',  color: 'var(--amber)' },
          { label: '🔥 Longest streak',   color: 'var(--primary)' },
          { label: '📅 30-day champion',  color: 'var(--fern)' },
        ].map(({ label, color }) => (
          <div key={label} className="surface-glass rounded-2xl p-4 text-center">
            <div className="label-mono text-muted-foreground text-[9px] mb-1">{label}</div>
            <div className="font-display italic text-lg" style={{ color }}>—</div>
          </div>
        ))}
      </div>

      <TabStrip tabs={TABS} defaultKey="today" />
      {active === 'today' ? <TodayPanel /> : <RankingPanel />}
    </div>
  );
}
