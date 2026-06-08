import { Link, NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CircleUser, Rss, Trophy, Users, UserPlus, Database } from 'lucide-react';
import type { ReactNode } from 'react';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getGlobalDaily } from '@/api/steps';
import { currentDate } from '@/lib/dates';

function MiniLeaderboard() {
  const today = currentDate();
  const query = useQuery({
    queryKey: ['steps', 'daily', today],
    queryFn: () => getGlobalDaily(today),
    staleTime: 60_000,
  });

  const rows = query.data?.leaderboard.slice(0, 5) ?? [];

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 mt-2">
      <div className="px-3 py-2 label-mono text-[10px]" style={{ background: 'var(--primary)', color: 'white' }}>
        📊 Today's Steps
      </div>
      {query.isPending ? (
        <div className="p-3 space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-3 label-mono text-muted-foreground text-[10px]">No posts yet today.</div>
      ) : (
        <div>
          {rows.map((entry, i) => (
            <Link
              key={entry.username}
              to={`/u/${encodeURIComponent(entry.username)}`}
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent/40 transition-colors border-b border-border/40 last:border-0 group"
            >
              <span className="label-mono text-[10px] w-4 flex-shrink-0" style={{
                color: i === 0 ? 'var(--amber)' : i === 1 ? '#9ba8b0' : i === 2 ? '#b87040' : 'var(--muted-foreground)'
              }}>
                {i + 1}
              </span>
              <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
                @{entry.username}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {entry.total.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SideNavItem({ to, icon, label, end = false }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        }`
      }
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
    </NavLink>
  );
}

function BottomNavItem({ to, icon, label, end = false }: { to: string; icon: ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full transition-all ${
          isActive
            ? 'text-primary bg-[color-mix(in_oklch,var(--primary)_14%,transparent)]'
            : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      <span>{icon}</span>
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { currentUser } = useCurrentUser();
  const profileTarget = currentUser ? `/u/${encodeURIComponent(currentUser)}` : '/users';

  return (
    <div className="min-h-screen flex flex-col text-foreground">

      {/* ── TOPBAR ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-md bg-background/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link to="/feed" className="flex items-baseline gap-2 flex-shrink-0">
            <span data-logo-slot className="font-display italic text-xl tracking-tight text-foreground">
              synzoia
            </span>
          </Link>

          {/* Search — desktop */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="w-full bg-muted/50 border border-border/60 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs">🔍</span>
              <span>Search people, activities…</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={profileTarget}
              className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 -m-2"
              aria-label="Your profile"
            >
              <CircleUser size={20} strokeWidth={1.75} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN BODY ───────────────────────────────────────────── */}
      <div className="flex-1 w-full max-w-[1280px] mx-auto flex">

        {/* LEFT SIDEBAR — hidden on mobile */}
        <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-border/60 py-5 px-3">
          <div className="label-mono text-muted-foreground text-[9px] px-3 mb-2">Navigate</div>
          <SideNavItem to="/feed"        end icon={<Rss size={15}        strokeWidth={1.75}/>} label="Feed" />
          <SideNavItem to="/leaderboard"     icon={<Trophy size={15}     strokeWidth={1.75}/>} label="Leaderboard" />
          <SideNavItem to={profileTarget}    icon={<CircleUser size={15} strokeWidth={1.75}/>} label="My Profile" />
          <SideNavItem to="/users"           icon={<Users size={15}      strokeWidth={1.75}/>} label="Users" />
          <SideNavItem to="/join"            icon={<UserPlus size={15}   strokeWidth={1.75}/>} label="Join" />
          <SideNavItem to="/db"              icon={<Database size={15}   strokeWidth={1.75}/>} label="Database" />

          <div className="mt-4">
            <div className="label-mono text-muted-foreground text-[9px] px-3 mb-2">Today's Board</div>
            <MiniLeaderboard />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5 pb-28 lg:pb-6">
          <Outlet />
        </main>

        {/* RIGHT SIDEBAR — hidden on mobile */}
        <aside className="hidden xl:flex flex-col w-[260px] flex-shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-l border-border/60 py-5 px-4">
          {/* Weather widget */}
          <div
            className="rounded-xl p-4 mb-4 relative overflow-hidden text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--fern))' }}
          >
            <div className="label-mono text-[9px] opacity-70 mb-1">📍 Santa Cruz, CA</div>
            <div className="font-display text-4xl font-light">63°</div>
            <div className="text-sm opacity-80 mt-1">Morning fog clearing</div>
            <div className="label-mono text-[9px] mt-3 pt-3 border-t border-white/20 opacity-70">
              🌲 Perfect trail conditions
            </div>
          </div>

          {/* Trending tags */}
          <div className="rounded-xl border border-border/60 overflow-hidden mb-4 bg-card">
            <div className="px-3 py-2.5 border-b border-border/60 label-mono text-[9px] text-foreground font-bold">
              Trending today
            </div>
            <div className="p-3 space-y-2.5">
              {[
                ['#MorningHike',    '48 posts'],
                ['#SleepStreak',    '31 posts'],
                ['#RedwoodRun',     '27 posts'],
                ['#BreakfastGoals', '19 posts'],
              ].map(([tag, count]) => (
                <div key={tag} className="flex items-center justify-between text-xs">
                  <span className="text-primary font-medium">{tag}</span>
                  <span className="label-mono text-muted-foreground text-[9px]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="label-mono text-[8px] text-muted-foreground leading-relaxed px-1">
            © 2026 synzoia · No algorithm. No ads.<br />Public by default.
          </div>
        </aside>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="lg:hidden fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <div className="glass-bar flex items-center gap-1 p-1.5 pointer-events-auto">
          <BottomNavItem to="/feed"        end icon={<Rss size={18} strokeWidth={1.75}/>}        label="Feed" />
          <BottomNavItem to="/leaderboard"     icon={<Trophy size={18} strokeWidth={1.75}/>}     label="Board" />
          <BottomNavItem to="/users"           icon={<Users size={18} strokeWidth={1.75}/>}      label="Users" />
          <BottomNavItem to="/join"            icon={<UserPlus size={18} strokeWidth={1.75}/>}   label="Join" />
          <BottomNavItem to={profileTarget}    icon={<CircleUser size={18} strokeWidth={1.75}/>} label="Me" ariaLabel="Your profile" />
        </div>
      </nav>

    </div>
  );
}

export default AppLayout;
