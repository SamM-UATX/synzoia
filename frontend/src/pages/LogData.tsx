import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/api/client';

type Tab = 'steps' | 'sleep';

export default function LogData() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('steps');
  const [steps, setSteps] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepMins, setSleepMins] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'idle'|'submitting'|'done'|'error'>('idle');
  const [msg, setMsg] = useState('');

  if (!currentUser) {
    return (
      <div className="surface-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground mb-4">You need to set your username first.</p>
        <a href="/users" className="text-primary label-mono">Browse users →</a>
      </div>
    );
  }

  const submitSteps = async () => {
    setStatus('submitting');
    try {
      await apiFetch('/steps/manual', {
        method: 'POST',
        body: JSON.stringify({ username: currentUser, date, total: parseInt(steps) }),
      });
      setMsg(`✓ Logged ${parseInt(steps).toLocaleString()} steps for ${date}`);
      setStatus('done');
      setSteps('');
    } catch (e: any) {
      setMsg(e.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const submitSleep = async () => {
    setStatus('submitting');
    const duration = parseInt(sleepHours) * 60 + parseInt(sleepMins || '0');
    try {
      await apiFetch('/sleep/manual', {
        method: 'POST',
        body: JSON.stringify({ username: currentUser, date, duration_min: duration }),
      });
      setMsg(`✓ Logged ${sleepHours}h ${sleepMins}m sleep for ${date}`);
      setStatus('done');
      setSleepHours('');
    } catch (e: any) {
      setMsg(e.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Log data</h1>
        <p className="label-mono text-muted-foreground mt-0.5">
          Manually add steps or sleep for @{currentUser}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['steps', 'sleep'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setStatus('idle'); setMsg(''); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              tab === t ? 'bg-primary text-white border-primary' : 'bg-card border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
            }`}>
            {t === 'steps' ? '🚶 Steps' : '😴 Sleep'}
          </button>
        ))}
      </div>

      <div className="surface-glass rounded-2xl p-6 space-y-5">
        {/* Date */}
        <div>
          <label className="label-mono text-muted-foreground block mb-2">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors" />
        </div>

        {tab === 'steps' ? (
          <div>
            <label className="label-mono text-muted-foreground block mb-2">Step count</label>
            <input type="number" value={steps} onChange={e => setSteps(e.target.value)}
              placeholder="e.g. 8500"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors" />
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label-mono text-muted-foreground block mb-2">Hours</label>
              <input type="number" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
                placeholder="7"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors" />
            </div>
            <div className="flex-1">
              <label className="label-mono text-muted-foreground block mb-2">Minutes</label>
              <input type="number" value={sleepMins} onChange={e => setSleepMins(e.target.value)}
                placeholder="30"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors" />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="rounded-xl p-3 text-sm font-medium" style={{ background: 'var(--green-lt, #daeee5)', color: 'var(--green)' }}>
            {msg}
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--red-lt, #fae0de)', color: 'var(--red, #d4524a)' }}>
            {msg}
          </div>
        )}

        <button
          onClick={tab === 'steps' ? submitSteps : submitSleep}
          disabled={status === 'submitting' || (tab === 'steps' ? !steps : !sleepHours)}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--primary)' }}>
          {status === 'submitting' ? 'Logging…' : `Log ${tab}`}
        </button>
      </div>

      <p className="label-mono text-muted-foreground text-center">
        Or connect Apple Health via iOS Shortcut for automatic sync →{' '}
        <a href="/join" className="text-primary hover:underline">see setup</a>
      </p>
    </div>
  );
}
