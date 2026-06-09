import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '@/components/ui/EmptyState';
import ErrorCard from '@/components/ui/ErrorCard';
import FeedSkeleton from '@/components/feed/FeedSkeleton';
import GenericPost from '@/components/feed/GenericPost';
import MilestonePost from '@/components/feed/MilestonePost';
import RecapPost from '@/components/feed/RecapPost';
import SleepPost from '@/components/feed/SleepPost';
import { getFeed } from '@/api/posts';
import { groupPostsByDay } from '@/lib/feedGroups';
import { supabase } from '@/lib/supabase';

const FILTERS = ['All', 'Steps', 'Sleep', 'Milestones', 'Recaps'] as const;

function GoogleFitBanner() {
  const [params, setParams] = useSearchParams();
  const status = params.get('gfit');
  if (!status) return null;
  const dismiss = () => { params.delete('gfit'); params.delete('steps'); params.delete('sleep'); setParams(params); };
  const steps = params.get('steps') ?? '0';
  const sleep = params.get('sleep') ?? '0';
  return (
    <div className="mb-5 rounded-2xl p-4 flex items-center justify-between"
         style={{ background: status === 'connected' ? 'var(--green-lt, #daeee5)' : 'var(--red-lt, #fae0de)' }}>
      <div>
        <div className="font-semibold text-sm" style={{ color: status === 'connected' ? 'var(--green)' : 'var(--red, #d4524a)' }}>
          {status === 'connected' ? '✓ Google Fit connected!' : '✗ Google Fit connection failed'}
        </div>
        {status === 'connected' && (
          <div className="label-mono text-muted-foreground mt-0.5">
            Synced {steps} days of steps · {sleep} nights of sleep
          </div>
        )}
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
    </div>
  );
}
type Filter = typeof FILTERS[number];

function filterLabel(f: Filter) {
  return f;
}

export default function Feed() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [searchParams] = useSearchParams();

  const query = useQuery({
    queryKey: ['posts', 'feed', 50],
    queryFn: () => getFeed(50),
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('posts-feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const allPosts = query.data?.posts ?? [];
  const filtered = activeFilter === 'All' ? allPosts : allPosts.filter(p => {
    if (activeFilter === 'Steps')      return p.type === 'steps';
    if (activeFilter === 'Sleep')      return p.type === 'sleep';
    if (activeFilter === 'Milestones') return p.type === 'steps_milestone';
    if (activeFilter === 'Recaps')     return p.type === 'leaderboard_recap';
    return true;
  });

  return (
    <div>
      <GoogleFitBanner />
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Activity Feed</h1>
          <p className="label-mono text-muted-foreground mt-0.5">Public · Chronological · No algorithm</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeFilter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-card border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
            }`}
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
          >
            {filterLabel(f)}
          </button>
        ))}
      </div>

      {/* Feed content */}
      {query.isPending ? (
        <FeedSkeleton />
      ) : query.isError ? (
        <ErrorCard
          error={query.error}
          onRetry={() => query.refetch()}
          fallbackMessage="Could not load the feed."
        />
      ) : filtered.length === 0 ? (
        <div className="surface-glass p-6 rounded-2xl">
          <EmptyState message={allPosts.length === 0 ? 'No posts yet. Start walking.' : `No ${activeFilter.toLowerCase()} posts yet.`} />
        </div>
      ) : (
        <div className="space-y-8">
          {groupPostsByDay(filtered).map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="label-mono text-muted-foreground">{group.label}</h2>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              {group.posts.map((post) => {
                if (post.type === 'leaderboard_recap')  return <RecapPost    key={post.id} post={post} />;
                if (post.type === 'steps_milestone')    return <MilestonePost key={post.id} post={post} />;
                if (post.type === 'sleep')              return <SleepPost     key={post.id} post={post} />;
                return                                         <GenericPost   key={post.id} post={post} />;
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
