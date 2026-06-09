import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import Button from '@/components/ui/AppButton';
import Card from '@/components/ui/AppCard';
import RangeTrendCard from '@/components/ui/RangeTrendCard';
import EmptyState from '@/components/ui/EmptyState';
import ErrorCard from '@/components/ui/ErrorCard';
import TabStrip from '@/components/ui/TabStrip';
import FeedSkeleton from '@/components/feed/FeedSkeleton';
import GenericPost from '@/components/feed/GenericPost';
import MilestonePost from '@/components/feed/MilestonePost';
import RecapPost from '@/components/feed/RecapPost';
import SleepPost from '@/components/feed/SleepPost';
import { ApiError } from '@/api/client';
import { type FeedPost } from '@/api/posts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/api/client';
import type { UserDailyResponse, UserSummaryResponse } from '@/api/steps';
import type {
  UserDailyResponse as SleepDailyResponse,
  UserSummaryResponse as SleepSummaryResponse,
} from '@/api/sleep';
import {
  stepsSummaryQuery,
  stepsDailyQuery,
  stepsWeeklyQuery,
  stepsMonthlyQuery,
  sleepSummaryQuery,
  sleepDailyQuery,
  sleepWeeklyQuery,
  sleepMonthlyQuery,
  userFeedQuery,
} from '@/api/userSummaryQueries';
import {
  currentDate,
  lastNightDate,
  formatDateMedium,
  formatDuration,
  formatTimestampDate,
} from '@/lib/dates';

function formatNumber(n: number): string { return n.toLocaleString(); }
const formatHeadingDate = formatDateMedium;
const formatJoinDate = formatTimestampDate;

/* ── Google Fit connect button ───────────────────────────────────── */
function GoogleFitButton({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle'|'connected'|'syncing'>('idle');
  const [lastSync, setLastSync] = useState<string|null>(null);

  useEffect(() => {
    apiFetch<{ connected: boolean; last_sync_at: string|null }>(
      `/google-fit/status?token=${encodeURIComponent(token)}`
    ).then(d => {
      if (d.connected) { setStatus('connected'); setLastSync(d.last_sync_at); }
    }).catch(() => {});
  }, [token]);

  const handleConnect = () => {
    const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
    window.location.href = `${base}/google-fit/auth?token=${encodeURIComponent(token)}`;
  };

  const handleSync = async () => {
    setStatus('syncing');
    try {
      await apiFetch('/google-fit/sync', { method: 'POST', body: JSON.stringify({ token }) });
      setStatus('connected');
      setLastSync(new Date().toISOString());
    } catch { setStatus('connected'); }
  };

  if (status === 'connected') return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
           style={{ background: 'var(--green-lt, #daeee5)', color: 'var(--green)' }}>
        <span>✓</span> Google Fit connected
      </div>
      <button onClick={handleSync}
        className="label-mono text-muted-foreground hover:text-primary transition-colors text-[10px]">
        {status === 'syncing' ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );

  return (
    <button onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
      Connect Google Fit
    </button>
  );
}

/* ── Coastal health ring SVG ──────────────────────────────────────── */
function HealthRing({ value, label, pct, color }: { value: string; label: string; pct: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 100) / 100;
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[9px] font-bold text-foreground leading-tight text-center px-0.5">{value}</span>
        </div>
      </div>
      <div className="label-mono text-muted-foreground">{label}</div>
    </div>
  );
}

/* ── Sub-components (all logic intact) ───────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="label-mono text-muted-foreground">{label}</div>
      <div className="font-display text-3xl mt-1 tabular-nums">{value}</div>
      {sub && <div className="label-mono text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}

function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted/60 rounded mt-2 animate-pulse" />
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton({ heightClass = 'h-32' }: { heightClass?: string }) {
  return <Card><div className={`${heightClass} bg-muted/40 rounded animate-pulse`} /></Card>;
}

function NotFoundView({ username }: { username: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold tracking-tight">No one named {username}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          That profile doesn't exist. Check the spelling, or head back to the feed.
        </p>
        <Button variant="primary" className="mt-4" to="/feed">Back to feed</Button>
      </Card>
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Could not load this profile.';
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <p className="text-destructive text-sm">{message}</p>
      <Button variant="secondary" className="mt-3" onClick={onRetry}>Try again</Button>
    </Card>
  );
}

function StatStrip({ data }: { data: UserSummaryResponse }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <StatCard label="30-day score" value={formatNumber(data.score)} />
      <StatCard label="Rank" value={data.rank !== null ? `#${data.rank}` : '—'} />
      <StatCard label="Best day" value={data.best_day ? formatNumber(data.best_day.total) : '—'} sub={data.best_day ? formatHeadingDate(data.best_day.date) : undefined} />
    </div>
  );
}

function TodayCard({ data }: { data: UserDailyResponse }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">Today</h2>
        <span className="label-mono text-muted-foreground">{data.rank_today !== null ? `#${data.rank_today}` : '—'}</span>
      </div>
      <div className="font-display text-4xl mt-2 tabular-nums">{formatNumber(data.total)}</div>
      <div className="label-mono text-muted-foreground mt-1">
        {data.posts.length === 0 ? 'No posts yet today.' : `${data.posts.length} ${data.posts.length === 1 ? 'snapshot' : 'snapshots'}`}
      </div>
    </Card>
  );
}

function formatSleepHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}h`;
}

function SleepStatStrip({ data }: { data: SleepSummaryResponse }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <StatCard label="30-day score" value={formatSleepHours(data.score)} />
      <StatCard label="Rank" value={data.rank !== null ? `#${data.rank}` : '—'} />
      <StatCard label="Best night" value={data.best_night ? formatDuration(data.best_night.total) : '—'} sub={data.best_night ? formatHeadingDate(data.best_night.date) : undefined} />
    </div>
  );
}

function SleepTodayCard({ data }: { data: SleepDailyResponse }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-tight">Last night</h2>
        <span className="label-mono text-muted-foreground">{data.rank_today !== null ? `#${data.rank_today}` : '—'}</span>
      </div>
      <div className="font-display text-4xl mt-2 tabular-nums">{data.total > 0 ? formatDuration(data.total) : '—'}</div>
      <div className="label-mono text-muted-foreground mt-1">{data.post === null ? 'No sleep logged.' : 'Logged'}</div>
    </Card>
  );
}

const TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'feed',    label: 'Feed' },
] as const;

function SummaryPanel({ username }: { username: string }) {
  const today      = currentDate();
  const lastNight  = lastNightDate();

  const summary      = useQuery({ ...stepsSummaryQuery(username),         enabled: !!username });
  const daily        = useQuery({ ...stepsDailyQuery(username, today),    enabled: !!username });
  const weekly       = useQuery({ ...stepsWeeklyQuery(username, today),   enabled: !!username });
  const monthly      = useQuery({ ...stepsMonthlyQuery(username, today),  enabled: !!username });
  const sleepSummary = useQuery({ ...sleepSummaryQuery(username),         enabled: !!username });
  const sleepDaily   = useQuery({ ...sleepDailyQuery(username, lastNight),enabled: !!username });
  const sleepWeekly  = useQuery({ ...sleepWeeklyQuery(username, lastNight), enabled: !!username });
  const sleepMonthly = useQuery({ ...sleepMonthlyQuery(username, lastNight), enabled: !!username });

  /* Derive ring values from real data */
  const stepsToday   = daily.data?.total ?? 0;
  const sleepTonight = sleepDaily.data?.total ?? 0;
  const stepsPct     = Math.min((stepsToday / 10000) * 100, 100);
  const sleepPct     = Math.min((sleepTonight / 480) * 100, 100);

  return (
    <div className="space-y-8">
      {/* Health rings — derived from real data */}
      {(daily.data || sleepDaily.data) && (
        <div className="surface-glass rounded-2xl p-5">
          <div className="label-mono text-muted-foreground mb-4">Today's rings</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <HealthRing value={stepsToday > 0 ? formatNumber(stepsToday) : '—'} label="Steps"   pct={stepsPct}  color="var(--primary)" />
            <HealthRing value={sleepTonight > 0 ? formatDuration(sleepTonight) : '—'} label="Sleep" pct={sleepPct}  color="var(--fern)" />
            <HealthRing value="—" label="HR"     pct={0}  color="#d4524a" />
            <HealthRing value="—" label="Cal"    pct={0}  color="var(--amber)" />
          </div>
        </div>
      )}

      <section className="space-y-6">
        <h2 className="label-mono text-muted-foreground">Steps</h2>
        {summary.isPending   ? <StatStripSkeleton /> :
         summary.isError     ? <ErrorView error={summary.error} onRetry={() => summary.refetch()} /> :
                               <StatStrip data={summary.data} />}
        {daily.isPending     ? <CardSkeleton heightClass="h-20" /> :
         daily.isError       ? <ErrorView error={daily.error} onRetry={() => daily.refetch()} /> :
                               <TodayCard data={daily.data} />}
        <RangeTrendCard
          week={{
            isPending: weekly.isPending,   isError: weekly.isError,   error: weekly.error,
            onRetry: () => weekly.refetch(),
            days: weekly.data?.daily_breakdown ?? [],
            total: weekly.data?.weekly_total ?? 0,
            rank: weekly.data?.rank_this_week ?? null,
          }}
          month={{
            isPending: monthly.isPending,  isError: monthly.isError,  error: monthly.error,
            onRetry: () => monthly.refetch(),
            days: monthly.data?.daily_breakdown ?? [],
            total: monthly.data?.monthly_total ?? 0,
            rank: monthly.data?.rank_this_month ?? null,
          }}
          emptyMonthMessage="No activity in the last 30 days yet."
        />
      </section>

      <section className="space-y-6">
        <h2 className="label-mono text-muted-foreground">Sleep</h2>
        {sleepSummary.isPending ? <StatStripSkeleton /> :
         sleepSummary.isError   ? <ErrorView error={sleepSummary.error} onRetry={() => sleepSummary.refetch()} /> :
                                  <SleepStatStrip data={sleepSummary.data} />}
        {sleepDaily.isPending   ? <CardSkeleton heightClass="h-20" /> :
         sleepDaily.isError     ? <ErrorView error={sleepDaily.error} onRetry={() => sleepDaily.refetch()} /> :
                                  <SleepTodayCard data={sleepDaily.data} />}
        <RangeTrendCard
          week={{
            isPending: sleepWeekly.isPending,  isError: sleepWeekly.isError,  error: sleepWeekly.error,
            onRetry: () => sleepWeekly.refetch(),
            days: sleepWeekly.data?.daily_breakdown ?? [],
            total: sleepWeekly.data?.weekly_total ?? 0,
            rank: sleepWeekly.data?.rank_this_week ?? null,
          }}
          month={{
            isPending: sleepMonthly.isPending, isError: sleepMonthly.isError, error: sleepMonthly.error,
            onRetry: () => sleepMonthly.refetch(),
            days: sleepMonthly.data?.daily_breakdown ?? [],
            total: sleepMonthly.data?.monthly_total ?? 0,
            rank: sleepMonthly.data?.rank_this_month ?? null,
          }}
          formatValue={formatDuration}
          unit=""
          emptyMonthMessage="No sleep in the last 30 days yet."
        />
      </section>
    </div>
  );
}

function FeedPanel({ username }: { username: string }) {
  const query = useQuery({ ...userFeedQuery(username), enabled: !!username });
  if (query.isPending) return <FeedSkeleton />;
  if (query.isError)   return <ErrorCard error={query.error} onRetry={() => query.refetch()} fallbackMessage="Could not load this user's feed." />;
  if (query.data.posts.length === 0) return <Card><EmptyState message="No posts yet." /></Card>;
  return (
    <div className="space-y-3">
      {query.data.posts.map((post: FeedPost) => {
        if (post.type === 'leaderboard_recap')  return <RecapPost    key={post.id} post={post} />;
        if (post.type === 'steps_milestone')    return <MilestonePost key={post.id} post={post} />;
        if (post.type === 'sleep')              return <SleepPost     key={post.id} post={post} />;
        return                                         <GenericPost   key={post.id} post={post} />;
      })}
    </div>
  );
}

export default function Profile() {
  const { username = '' } = useParams<{ username: string }>();
  const [params] = useSearchParams();
  const active = params.get('tab') ?? 'summary';

  const summary = useQuery({ ...stepsSummaryQuery(username), enabled: !!username });
  const { currentUser, setCurrentUser } = useCurrentUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (username) queryClient.prefetchQuery(userFeedQuery(username));
  }, [queryClient, username]);

  if (!username) return <NotFoundView username="" />;
  if (summary.error instanceof ApiError && summary.error.code === 'user_not_found') return <NotFoundView username={username} />;

  const displayName = summary.data?.username ?? username;

  return (
    <div className="space-y-0">

      {/* ── Coastal banner + avatar header ─────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-5 border border-border/60">
        {/* Banner */}
        <div
          className="h-28 relative"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--fern-deep, #1e4d2b))' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        {/* Avatar row */}
        <div className="bg-card px-5 pb-4">
          <div className="flex items-end justify-between -mt-8 mb-3">
            {/* Avatar circle */}
            <div
              className="w-16 h-16 rounded-full border-4 border-card flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--fern))' }}
            >
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex items-center gap-2 pb-1">
              {currentUser === username ? (
                <Button variant="secondary" disabled>✓ This is you</Button>
              ) : (
                <Button variant="primary" onClick={() => setCurrentUser(username)}>Make this me</Button>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div>
            <h1 className="font-display text-2xl tracking-tight">@{displayName}</h1>
            {summary.data?.join_date && (
              <p className="label-mono text-muted-foreground mt-0.5">
                Joined {formatJoinDate(summary.data.join_date)}
                {summary.data.rank !== null && <span className="ml-3">Rank #{summary.data.rank}</span>}
              </p>
            )}
            {currentUser === username && (
              <div className="mt-3">
                <GoogleFitButton token={localStorage.getItem('synzoia_token') ?? ''} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs + content ─────────────────────────────────────────── */}
      <div className="space-y-5">
        <TabStrip tabs={[...TABS]} defaultKey="summary" />
        {active === 'feed' ? <FeedPanel username={username} /> : <SummaryPanel username={username} />}
      </div>

    </div>
  );
}
