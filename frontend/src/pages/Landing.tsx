import { Link } from 'react-router-dom';
import Button from '@/components/ui/AppButton';
import ThemeToggle from '@/components/layout/ThemeToggle';
import WaveCurve from '@/components/ui/WaveCurve';

const features = [
  {
    n: '01',
    accent: 'var(--primary)',
    title: 'Steps, automatically',
    body: 'A Siri Shortcut reads your Apple Health step count and posts it on your behalf. Set it up once — after that, nothing. Your phone does the daily check-in.',
  },
  {
    n: '02',
    accent: 'var(--fern)',
    title: 'Sleep every morning',
    body: 'Deep, REM, awake — your nightly breakdown hits the feed when you wake up. See how your rest stacks up against the whole community.',
  },
  {
    n: '03',
    accent: 'var(--bark)',
    title: 'Heart rate & HRV',
    body: 'Resting HR, peak HR, heart rate variability. The numbers your watch already tracks, now part of your public health record.',
  },
  {
    n: '04',
    accent: 'var(--amber)',
    title: 'Food photo log',
    body: 'Snap what you eat. Tag it. Let the community react, comment, and get inspired. No calorie counting required — unless you want to.',
  },
  {
    n: '05',
    accent: 'var(--fern)',
    title: 'Comments & messages',
    body: 'Comment on a friend\'s run. DM someone whose consistency you admire. Build accountability in public or in private — your choice.',
  },
  {
    n: '06',
    accent: 'var(--primary)',
    title: 'Three leaderboards',
    body: 'Today\'s leader. The week\'s grind. The all-time best. Clean, ranked, honest. The kind of table you actually want your name on.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Pick a username',
    body: 'Type one in. We give you back a token — four blocks of four uppercase letters. Don\'t lose it; we don\'t store a way to recover it.',
  },
  {
    n: '02',
    title: 'Install the Shortcut',
    body: 'One-tap install on iPhone. Paste your token in. The Shortcut reads Apple Health — steps, sleep, heart rate, calories — and POSTs it on your behalf.',
  },
  {
    n: '03',
    title: 'Live publicly',
    body: 'Walk. Sleep. Eat. Your numbers show up in real time. Comment on others\'. Watch each other grow — no algorithm, no feed manipulation.',
  },
];

const quotes = [
  {
    text: 'Seeing my sleep score next to everyone else\'s on Monday morning is more motivating than any private tracker ever was.',
    name: 'sierra_walker',
    handle: '14,200 avg steps/day',
  },
  {
    text: 'Someone DMed me asking what I ate after I posted my lunch. Now we swap recipes every week. That\'s a community I didn\'t expect.',
    name: 'redwood_rob',
    handle: '52-day streak',
  },
  {
    text: 'My resting HR dropped 8 points in 90 days. I have the public feed to thank — I didn\'t want to be the one who stopped showing up.',
    name: 'marina_steps',
    handle: '3rd on weekly board',
  },
  {
    text: 'The no-algorithm feed is everything. I actually see my friends\' posts, not curated nonsense. Chronological is an underrated superpower.',
    name: 'pacific_palo',
    handle: 'joined week 1',
  },
];

const healthMetrics = [
  { label: 'Steps', value: '11,204', pct: 75, color: 'var(--primary)' },
  { label: 'Sleep',  value: '8h 12m', pct: 85, color: 'var(--fern)' },
  { label: 'HR',     value: '61 bpm', pct: 20, color: '#d4524a' },
  { label: 'Cal',    value: '1,924',  pct: 65, color: 'var(--amber)' },
];

export default function Landing() {
  return (
    <div className="min-h-screen text-foreground">

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span data-logo-slot className="font-display italic text-2xl tracking-tight">
              synzoia
            </span>
            <span className="label-mono text-muted-foreground hidden sm:inline">
              est. 2026
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/feed"        className="label-mono text-muted-foreground hover:text-foreground hidden sm:inline transition-colors">Feed</Link>
            <Link to="/leaderboard" className="label-mono text-muted-foreground hover:text-foreground hidden sm:inline transition-colors">Leaderboard</Link>
            <Link to="/join"        className="label-mono text-muted-foreground hover:text-foreground transition-colors">Join</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-12 right-0 w-[60%] sm:w-[45%] text-primary/30 pointer-events-none rise rise-1"
          >
            <WaveCurve shape="tide" className="h-32 sm:h-40" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 pb-24 sm:pb-40">
            <div className="flex items-center gap-3 rise rise-1">
              <span className="hairline w-12" />
              <span className="label-mono text-muted-foreground">
                Santa Cruz · Est. 2026 · Public beta
              </span>
            </div>

            <h1 className="mt-10 font-display text-foreground text-[3.25rem] sm:text-[5.5rem] leading-[0.95] tracking-tight max-w-4xl rise rise-2">
              Your whole health story.
              <br />
              <em className="text-primary font-display glow-primary">Wide open.</em>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed rise rise-3">
              Sleep, steps, heart rate, meals — tracked automatically, shared
              openly. A community built on showing up, every single day.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-5 rise rise-4">
              <Button variant="primary" to="/join">
                Start your journey
              </Button>
              <Link
                to="/feed"
                className="label-mono text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground transition-colors pb-0.5"
              >
                See today's feed →
              </Link>
            </div>

            {/* Live stats strip */}
            <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 max-w-3xl rise rise-5">
              {[
                ['Walkers',    '2,841'],
                ['Steps today','4.2M'],
                ['Meals logged','847'],
                ['Avg sleep',  '7h 23m'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="label-mono text-muted-foreground">{label}</div>
                  <div className="font-display italic text-2xl mt-1">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ───────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-12 gap-x-6 gap-y-4 mb-16">
              <div className="col-span-12 sm:col-span-3">
                <span className="label-mono text-muted-foreground">Section 02</span>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight">
                  More than a{' '}
                  <em className="text-primary">step counter.</em>
                </h2>
                <p className="text-muted-foreground mt-4 max-w-xl">
                  Every metric your phone already tracks — made visible, shared
                  publicly, and turned into something worth showing up for.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 border border-border/60">
              {features.map((f) => (
                <article
                  key={f.n}
                  className="bg-card p-8 sm:p-10 group transition-colors hover:bg-accent/30"
                  style={{ borderLeft: `3px solid ${f.accent}` }}
                >
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-mono text-sm text-muted-foreground">{f.n}</span>
                    <span className="hairline flex-1 ml-4" />
                  </div>
                  <h3 className="font-display text-2xl tracking-tight mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── HEALTH RINGS VISUAL ────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16 items-center">

              {/* Copy side */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="hairline w-12" />
                  <span className="label-mono text-muted-foreground">Section 03 · Health</span>
                </div>
                <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight">
                  Every ring.<br />
                  <em className="text-primary">Every number.</em><br />
                  In the open.
                </h2>
                <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
                  Your Apple Watch and iPhone already have the data. synzoia
                  makes it a living, public story — one that friends and strangers
                  can react to, comment on, and be inspired by.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: '🏃', title: 'Auto-posted activity',    desc: 'Siri Shortcut reads Apple Health and posts on your behalf. Set it, forget it.' },
                    { icon: '😴', title: 'Morning sleep recap',     desc: 'Wake up and your sleep score is already on the feed. React to friends\' nights.' },
                    { icon: '🍽️', title: 'Meal moment captures',    desc: 'Photo, tag, post. Others comment, share recipes, send you DMs about what you ate.' },
                  ].map(({ icon, title, desc }) => (
                    <li key={title} className="flex gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'var(--fern-light)' }}
                      >
                        {icon}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{title}</div>
                        <div className="text-muted-foreground text-sm leading-relaxed mt-0.5">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rings demo card */}
              <div className="bg-card border border-border/60 rounded-2xl p-8 relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)' }}
                />
                <div className="label-mono text-muted-foreground mb-2">@sierra_walker · today</div>
                <div className="font-display italic text-lg mb-8">Jun 8, 2026</div>

                {/* Ring meters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {healthMetrics.map(({ label, value, pct, color }) => {
                    const r = 26;
                    const circ = 2 * Math.PI * r;
                    const dash = circ * (pct / 100);
                    return (
                      <div key={label} className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-2">
                          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
                            <circle
                              cx="32" cy="32" r={r} fill="none"
                              stroke={color} strokeWidth="6"
                              strokeDasharray={`${dash} ${circ}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-mono text-[9px] font-bold text-foreground leading-none text-center px-0.5">{value}</span>
                          </div>
                        </div>
                        <div className="label-mono text-muted-foreground">{label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Meal photo thumbnails */}
                <div className="mt-8 pt-6 border-t border-border/60">
                  <div className="label-mono text-muted-foreground mb-3">Today's meals</div>
                  <div className="flex gap-2">
                    {['seed/food1/120/120', 'seed/food2/120/120', 'seed/food3/120/120'].map((s) => (
                      <div
                        key={s}
                        className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0"
                        style={{ backgroundImage: `url(https://picsum.photos/${s})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                    ))}
                    <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="label-mono text-muted-foreground">+2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMMUNITY / APP PREVIEW — forest green dark band ───────────── */}
        <section className="border-t border-border forest-band">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-12 gap-x-6 gap-y-4 mb-20">
              <div className="col-span-12 sm:col-span-3">
                <span className="label-mono opacity-60">Section 04 · Community</span>
              </div>
              <div className="col-span-12 sm:col-span-9">
                <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight">
                  The whole feed.<br />
                  <em>The whole person.</em>
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed" style={{ opacity: 0.65 }}>
                  Comments, DMs, food photos, sleep scores, health rings — all of
                  it in one chronological feed. No algorithm. No ads. Just people
                  showing up.
                </p>
              </div>
            </div>

            {/* Three mini app-screen cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'Activity Feed',
                  lines: [
                    { name: 'sierra_walker', detail: '11,204 steps · 8h 12m sleep', tag: '🌲 Morning hike' },
                    { name: 'redwood_rob',   detail: '9,880 steps · 2,104 cal',    tag: '🥑 Breakfast logged' },
                    { name: 'marina_steps',  detail: '7h 48m sleep · score 91',    tag: '😴 Night recap' },
                  ],
                },
                {
                  label: 'Profile Dashboard',
                  lines: [
                    { name: 'Steps this week',   detail: '68,441',   tag: '↑ 12% vs last week' },
                    { name: 'Avg sleep',         detail: '7h 58m',   tag: '↑ 0.4h' },
                    { name: 'Resting HR',        detail: '61 bpm',   tag: '↓ 3 bpm' },
                    { name: '54-day streak 🔥', detail: '',          tag: '' },
                  ],
                },
                {
                  label: 'Messages',
                  lines: [
                    { name: 'sierra_walker', detail: 'that trail was worth it 🌲', tag: '9:14 am' },
                    { name: 'You',           detail: 'My HRV was through the roof 📈', tag: '9:22 am' },
                    { name: 'sierra_walker', detail: 'Shared health data →',       tag: '9:31 am' },
                  ],
                },
              ].map(({ label, lines }) => (
                <div
                  key={label}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  {/* Fake browser chrome */}
                  <div
                    className="flex items-center gap-1.5 px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                    <span className="label-mono ml-3" style={{ opacity: 0.35, fontSize: '8px' }}>{label}</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {lines.map((l, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{l.name}</span>
                          {l.tag && <span className="label-mono" style={{ opacity: 0.45, fontSize: '8px' }}>{l.tag}</span>}
                        </div>
                        {l.detail && (
                          <div className="font-mono text-xs mt-1" style={{ color: 'var(--primary)', opacity: 0.9 }}>
                            {l.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="hairline w-12" />
                  <span className="label-mono text-muted-foreground">Section 05 · Setup</span>
                </div>
                <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight">
                  Three steps<br />
                  to a life<br />
                  <em className="text-primary">in the open.</em>
                </h2>
              </div>
              <ol className="space-y-10">
                {steps.map((s) => (
                  <li key={s.n} className="grid grid-cols-[56px_1fr] gap-4 items-start border-b border-border pb-10 last:border-0 last:pb-0">
                    <div
                      className="font-display italic leading-none pt-1"
                      style={{ fontSize: '56px', color: 'color-mix(in oklch, var(--bark) 35%, var(--border))' }}
                    >
                      {s.n}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl tracking-tight">{s.title}</h3>
                      <p className="text-muted-foreground mt-2 leading-relaxed text-sm">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── QUOTES ─────────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 sm:pt-32 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="hairline w-12" />
              <span className="label-mono text-muted-foreground">Section 06 · Community voices</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl leading-tight tracking-tight">
              What the feed <em className="text-primary">says back.</em>
            </h2>
          </div>
          {/* Horizontally scrolling quote strip */}
          <div className="flex gap-5 px-6 sm:px-8 pb-24 sm:pb-32 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
               style={{ scrollbarWidth: 'none' }}>
            {quotes.map((q) => (
              <div
                key={q.name}
                className="flex-shrink-0 w-80 snap-start bg-card border border-border/60 rounded-2xl p-7"
                style={{ borderLeft: '3px solid var(--fern-light)' }}
              >
                <p className="font-display italic text-lg leading-snug text-foreground mb-5">
                  "{q.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--fern))' }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{q.name}</div>
                    <div className="label-mono text-muted-foreground">{q.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="border-t border-border hero-wash surface-grain">
          <div className="relative max-w-4xl mx-auto px-6 sm:px-8 py-28 sm:py-36 text-center">
            <span className="label-mono text-muted-foreground">
              Section 07 · Now in public beta
            </span>
            <p className="mt-10 font-display italic text-4xl sm:text-6xl leading-[1.05] tracking-tight">
              "If you're already living it,
              <br />
              <span className="text-primary">everyone</span> should see."
            </p>
            <p className="mt-8 label-mono text-muted-foreground">
              — what synzoia is built around
            </p>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
              <Button variant="primary" to="/join">
                Get your token
              </Button>
              <Link
                to="/feed"
                className="label-mono text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground transition-colors pb-0.5"
              >
                Browse the feed first →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2">
            <span className="font-display italic text-2xl tracking-tight">synzoia</span>
            <p className="label-mono text-muted-foreground mt-3 leading-relaxed">
              Public by default.<br />Santa Cruz, California.<br />Est. 2026.
            </p>
          </div>
          <div>
            <div className="label-mono text-muted-foreground mb-3">Product</div>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/join"        className="hover:text-primary transition-colors">Get started</Link></li>
              <li><Link to="/feed"        className="hover:text-primary transition-colors">Today's feed</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><Link to="/style-guide" className="hover:text-primary transition-colors">Style guide</Link></li>
            </ul>
          </div>
          <div>
            <div className="label-mono text-muted-foreground mb-3">Colophon</div>
            <ul className="space-y-2 text-muted-foreground">
              <li>Lora · DM Sans · IBM Plex Mono</li>
              <li>No algorithm. No ads.</li>
              <li>© {new Date().getFullYear()} synzoia</li>
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}
