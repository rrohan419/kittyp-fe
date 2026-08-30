import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  actionFor,
  fetchSystemHealth,
  HealthAction,
  HealthComponent,
  HealthOptimizeTarget,
  loadActive,
  optimizeSystemHealth,
  startHealthLoad,
  stopHealthLoad,
  SystemHealth,
} from '@/services/systemHealthService';
import { formatBytes, usagePercent } from '@/utils/formatBytes';
import {
  appendSample,
  donutArcs,
  formatHealthDetail,
  HealthSample,
  linePath,
  numDetail,
  stackedPercents,
  type DonutPart,
} from '@/utils/healthChart';
import { parseApiErrorMessage } from '@/utils/validation';
import { cn } from '@/lib/utils';

const HISTORY_KEY = 'kittyp-admin-health-history';
const COOLDOWN_MS = 30_000;
const COLORS = {
  used: '#4f46e5',
  free: '#10b981',
  idle: '#10b981',
  unused: '#cbd5e1',
  disk: '#f59e0b',
  workers: '#8b5cf6',
};

function statusTone(status: string): string {
  if (status === 'UP') {
    return 'bg-emerald-500/10 text-emerald-700 border-0';
  }
  if (status === 'DOWN') {
    return 'bg-red-500/10 text-red-700 border-0';
  }
  return 'bg-amber-500/10 text-amber-700 border-0';
}

function severityTone(severity?: string): string {
  if (severity === 'CRITICAL') {
    return 'bg-red-500/10 text-red-700 border-0';
  }
  if (severity === 'WATCH') {
    return 'bg-amber-500/10 text-amber-800 border-0';
  }
  return 'bg-emerald-500/10 text-emerald-700 border-0';
}

function barTone(pct: number): string {
  if (pct >= 90) {
    return 'bg-red-500';
  }
  if (pct >= 70) {
    return 'bg-amber-500';
  }
  return 'bg-primary';
}

function loadHistory(): HealthSample[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const rows = raw ? JSON.parse(raw) as HealthSample[] : [];
    return rows.map((row) => ({ mem: row.mem, disk: row.disk, pool: row.pool, workers: row.workers ?? 0 }));
  } catch {
    return [];
  }
}

function componentOf(health: SystemHealth, name: string): HealthComponent | undefined {
  return health.components[name];
}

function Sparkline({ points, color, label }: { points: number[]; color: string; label: string }) {
  if (points.length < 2) {
    return <p className="text-[11px] text-muted-foreground">Collecting samples…</p>;
  }
  return (
    <svg viewBox="0 0 160 36" width="160" height="36" role="img" aria-label={label}>
      <path d={linePath(points, 160, 36, 4)} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function Donut({ parts, center }: { parts: DonutPart[]; center: string }) {
  const arcs = donutArcs(parts);
  const [hover, setHover] = useState<DonutPart | null>(null);
  const label = hover ? `${hover.label} ${hover.display}` : center;
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={label}>
        {arcs.map((arc, index) => (
          <circle
            key={arc.label}
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke={arc.color}
            strokeWidth={hover?.label === arc.label ? 18 : 16}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            transform={`rotate(${arc.rotate} 60 60)`}
            className="cursor-pointer"
            tabIndex={0}
            onMouseEnter={() => setHover(parts[index])}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(parts[index])}
            onBlur={() => setHover(null)}
          />
        ))}
        <circle cx="60" cy="60" r="28" className="fill-background" />
        <text x="60" y="64" textAnchor="middle" className="fill-foreground text-[11px] font-bold">
          {hover ? hover.display : center}
        </text>
      </svg>
      <ul className="grid gap-1.5 text-xs">
        {parts.map((part) => (
          <li
            key={part.label}
            className={cn('flex items-center gap-2', hover?.label === part.label && 'font-semibold')}
          >
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: part.color }} />
            <span>{part.label}</span>
            <span className="tabular-nums">{part.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Gauge({ label, used, max, display }: { label: string; used: number; max: number; display: string }) {
  const pct = usagePercent(used, max);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{display} · {pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden" role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn('h-full rounded-full transition-all', barTone(pct))} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stacked({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const widths = stackedPercents(segments.map((s) => s.value));
  return (
    <div className="h-3 rounded-full bg-muted overflow-hidden flex" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
      {segments.map((segment, index) => (
        <div key={segment.label} className="h-full" style={{ width: `${widths[index]}%`, backgroundColor: segment.color }} title={`${segment.label}: ${segment.value}`} />
      ))}
    </div>
  );
}

function Trend({ history }: { history: HealthSample[] }) {
  const w = 640;
  const h = 160;
  const pad = 28;
  const series = [
    { label: 'Memory used %', color: COLORS.used, points: history.map((s) => s.mem) },
    { label: 'Disk used %', color: COLORS.disk, points: history.map((s) => s.disk) },
    { label: 'Pool active %', color: COLORS.idle, points: history.map((s) => s.pool) },
    { label: 'Worker queue %', color: COLORS.workers, points: history.map((s) => s.workers) },
  ];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="160" role="img" aria-label="Health trend">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="stroke-muted" />
        {series.map((s) => (
          <path key={s.label} d={linePath(s.points, w, h, pad)} fill="none" stroke={s.color} strokeWidth="2.5" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 text-xs mt-2">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  action,
  expanded,
  onToggle,
  onOptimize,
  cooling,
  sparkPoints,
  sparkColor,
  loadTestEnabled,
  loadRunning,
  onStartLoad,
  onStopLoad,
  children,
}: {
  title: string;
  action?: HealthAction;
  expanded: boolean;
  onToggle: () => void;
  onOptimize: () => void;
  cooling: boolean;
  sparkPoints: number[];
  sparkColor: string;
  loadTestEnabled: boolean;
  loadRunning: boolean;
  onStartLoad: () => void;
  onStopLoad: () => void;
  children: ReactNode;
}) {
  return (
    <Card className={cn('border-0 shadow-sm', action && action.severity !== 'OK' && 'ring-1 ring-inset ring-amber-200')}>
      <CardHeader className="pb-3">
        <button type="button" className="text-left w-full" onClick={onToggle} aria-expanded={expanded}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {action && (
              <Badge className={cn('shrink-0', severityTone(action.severity))}>{action.severity}</Badge>
            )}
          </div>
          {action && <p className="text-xs text-muted-foreground mt-1">{action.headline}</p>}
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Sparkline points={sparkPoints} color={sparkColor} label={`${title} trend`} />
        {loadTestEnabled && loadRunning && (
          <Button size="sm" variant="outline" disabled={cooling} onClick={onStopLoad}>
            Stop load
          </Button>
        )}
        {expanded && action && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-sm">{action.detail}</p>
            <p className="text-xs text-muted-foreground">{action.optimizeHint}</p>
            <div className="flex flex-wrap gap-2">
              {action.optimizeEnabled && (
                <Button size="sm" disabled={cooling} onClick={onOptimize}>
                  {cooling ? 'Wait before next Optimize' : 'Optimize'}
                </Button>
              )}
              {loadTestEnabled && !loadRunning && (
                <Button size="sm" variant="outline" disabled={cooling} onClick={onStartLoad}>
                  Start load
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [history, setHistory] = useState<HealthSample[]>(loadHistory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());
  const [now, setNow] = useState<number>(Date.now());
  const [expanded, setExpanded] = useState<HealthOptimizeTarget | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<HealthOptimizeTarget | null>(null);
  const [confirmKind, setConfirmKind] = useState<'optimize' | 'load'>('optimize');
  const [saving, setSaving] = useState(false);
  const [cooldowns, setCooldowns] = useState<Partial<Record<HealthOptimizeTarget, number>>>({});

  const applySnapshot = useCallback((next: SystemHealth) => {
    setHealth(next);
    setError(null);
    setUpdatedAt(Date.now());
    const memory = componentOf(next, 'memory')?.details;
    const disk = componentOf(next, 'diskSpace')?.details;
    const pool = componentOf(next, 'hikariPool')?.details;
    const workers = componentOf(next, 'backgroundWorkers')?.details;
    const diskUsed = Math.max(0, numDetail(disk, 'total') - numDetail(disk, 'free'));
    const sample = {
      mem: usagePercent(numDetail(memory, 'used'), numDetail(memory, 'max')),
      disk: usagePercent(diskUsed, numDetail(disk, 'total')),
      pool: usagePercent(numDetail(pool, 'active'), numDetail(pool, 'max')),
      workers: usagePercent(numDetail(workers, 'queueSize'), numDetail(workers, 'queueCapacity')),
    };
    setHistory((prev) => {
      const rows = appendSample(prev, sample);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(rows));
      return rows;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      applySnapshot(await fetchSystemHealth());
    } catch {
      setError('Could not load system health.');
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    let id: number | undefined;
    const start = () => {
      void load();
      id = window.setInterval(() => {
        void load();
      }, 3000);
    };
    const stop = () => {
      if (id) {
        window.clearInterval(id);
        id = undefined;
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') {
      start();
    }
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const names = useMemo(() => (health ? Object.keys(health.components) : []), [health]);
  const alerts = useMemo(
    () => (health?.actions ?? []).filter((action) => action.severity === 'WATCH' || action.severity === 'CRITICAL'),
    [health]
  );

  const memory = health ? componentOf(health, 'memory') : undefined;
  const disk = health ? componentOf(health, 'diskSpace') : undefined;
  const pool = health ? componentOf(health, 'hikariPool') : undefined;
  const workers = health ? componentOf(health, 'backgroundWorkers') : undefined;

  const memUsed = numDetail(memory?.details, 'used');
  const memMax = numDetail(memory?.details, 'max');
  const memHeap = numDetail(memory?.details, 'heap');
  const diskTotal = numDetail(disk?.details, 'total');
  const diskFree = numDetail(disk?.details, 'free');
  const diskUsed = Math.max(0, diskTotal - diskFree);
  const poolActive = numDetail(pool?.details, 'active');
  const poolIdle = numDetail(pool?.details, 'idle');
  const poolMax = numDetail(pool?.details, 'max');
  const poolTotal = numDetail(pool?.details, 'total');
  const poolUnused = Math.max(0, poolMax - poolTotal);
  const workerActive = numDetail(workers?.details, 'active');
  const workerMax = numDetail(workers?.details, 'maxPoolSize');
  const workerPool = numDetail(workers?.details, 'poolSize');
  const queueSize = numDetail(workers?.details, 'queueSize');
  const queueCap = numDetail(workers?.details, 'queueCapacity');
  const secondsAgo = Math.max(0, Math.round((now - updatedAt) / 1000));

  const cooling = (target: HealthOptimizeTarget) => {
    const until = cooldowns[target];
    return Boolean(until && until > now);
  };

  const runOptimize = async () => {
    if (!confirmTarget) {
      return;
    }
    setSaving(true);
    try {
      const result = confirmKind === 'load'
        ? await startHealthLoad(confirmTarget)
        : await optimizeSystemHealth(confirmTarget);
      applySnapshot(result.after);
      if (confirmKind === 'optimize') {
        setCooldowns((prev) => ({ ...prev, [confirmTarget]: Date.now() + COOLDOWN_MS }));
      }
      if (result.applied) {
        toast.success(result.summary);
      } else {
        toast.message(result.summary);
      }
      if (result.remainingHint) {
        toast.message(result.remainingHint);
      }
    } catch (e: unknown) {
      toast.error(parseApiErrorMessage(e, confirmKind === 'load' ? 'Could not start load' : 'Optimize failed'));
    } finally {
      setSaving(false);
      setConfirmTarget(null);
    }
  };

  const runStopLoad = async (target: HealthOptimizeTarget) => {
    setSaving(true);
    try {
      const result = await stopHealthLoad(target);
      applySnapshot(result.after);
      toast.success(result.summary);
      if (result.remainingHint) {
        toast.message(result.remainingHint);
      }
    } catch (e: unknown) {
      toast.error(parseApiErrorMessage(e, 'Could not stop load'));
    } finally {
      setSaving(false);
    }
  };

  const askOptimize = (target: HealthOptimizeTarget) => {
    setConfirmKind('optimize');
    setConfirmTarget(target);
  };

  const askLoad = (target: HealthOptimizeTarget) => {
    setConfirmKind('load');
    setConfirmTarget(target);
  };

  const toggle = (target: HealthOptimizeTarget) => {
    setExpanded((prev) => (prev === target ? null : target));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System health</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Live while this tab is open · click a card to see what it means · Optimize only touches KittyP
          </p>
          {health && (
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">Updated {secondsAgo}s ago</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load(); }} disabled={loading && !health}>
          {loading && !health ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2" role="status">
          {alerts.map((alert) => (
            <Card key={alert.target} className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <Badge className={severityTone(alert.severity)}>{alert.severity}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{alert.headline}</p>
                  <p className="text-xs text-muted-foreground">{alert.optimizeHint}</p>
                </div>
                {alert.optimizeEnabled && (
                  <Button size="sm" disabled={cooling(alert.target) || saving} onClick={() => askOptimize(alert.target)}>
                    Optimize
                  </Button>
                )}
                {health?.loadTestEnabled && !loadActive(health, alert.target) && (
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => askLoad(alert.target)}>
                    Start load
                  </Button>
                )}
                {health?.loadTestEnabled && loadActive(health, alert.target) && (
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => void runStopLoad(alert.target)}>
                    Stop load
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !health && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load(); }}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {loading && !health && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((key) => (
            <Card key={key} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5 h-24 animate-pulse bg-muted/40 rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {health && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Overall</p>
                <Badge className={cn('mt-2', statusTone(health.status))}>{health.status}</Badge>
              </CardContent>
            </Card>
            {names.map((name) => {
              const component = health.components[name];
              return (
                <Card key={name} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{name}</p>
                    <Badge className={cn('mt-2', statusTone(component.status))}>{component.status}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {memory && (
              <MetricCard
                title="Memory"
                action={actionFor(health, 'MEMORY')}
                expanded={expanded === 'MEMORY'}
                onToggle={() => toggle('MEMORY')}
                onOptimize={() => askOptimize('MEMORY')}
                cooling={cooling('MEMORY') || saving}
                sparkPoints={history.map((s) => s.mem)}
                sparkColor={COLORS.used}
                loadTestEnabled={Boolean(health.loadTestEnabled)}
                loadRunning={loadActive(health, 'MEMORY')}
                onStartLoad={() => askLoad('MEMORY')}
                onStopLoad={() => void runStopLoad('MEMORY')}
              >
                <Donut
                  center={`${usagePercent(memUsed, memMax)}%`}
                  parts={[
                    { label: 'Used', value: memUsed, display: formatBytes(memUsed), color: COLORS.used },
                    { label: 'Free of max', value: Math.max(0, memMax - memUsed), display: formatBytes(Math.max(0, memMax - memUsed)), color: COLORS.unused },
                  ]}
                />
                <Gauge label="Committed heap / max" used={memHeap} max={memMax} display={`${formatBytes(memHeap)} / ${formatBytes(memMax)}`} />
              </MetricCard>
            )}

            {disk && (
              <MetricCard
                title="Disk"
                action={actionFor(health, 'DISK')}
                expanded={expanded === 'DISK'}
                onToggle={() => toggle('DISK')}
                onOptimize={() => askOptimize('DISK')}
                cooling={cooling('DISK') || saving}
                sparkPoints={history.map((s) => s.disk)}
                sparkColor={COLORS.disk}
                loadTestEnabled={Boolean(health.loadTestEnabled)}
                loadRunning={loadActive(health, 'DISK')}
                onStartLoad={() => askLoad('DISK')}
                onStopLoad={() => void runStopLoad('DISK')}
              >
                <Donut
                  center={`${usagePercent(diskUsed, diskTotal)}%`}
                  parts={[
                    { label: 'Used', value: diskUsed, display: formatBytes(diskUsed), color: COLORS.disk },
                    { label: 'Free', value: diskFree, display: formatBytes(diskFree), color: COLORS.free },
                  ]}
                />
              </MetricCard>
            )}

            {pool && (
              <MetricCard
                title="Database pool"
                action={actionFor(health, 'POOL')}
                expanded={expanded === 'POOL'}
                onToggle={() => toggle('POOL')}
                onOptimize={() => askOptimize('POOL')}
                cooling={cooling('POOL') || saving}
                sparkPoints={history.map((s) => s.pool)}
                sparkColor={COLORS.used}
                loadTestEnabled={Boolean(health.loadTestEnabled)}
                loadRunning={loadActive(health, 'POOL')}
                onStartLoad={() => askLoad('POOL')}
                onStopLoad={() => void runStopLoad('POOL')}
              >
                <Donut
                  center={`${poolActive}/${poolMax}`}
                  parts={[
                    { label: 'Active', value: poolActive, display: String(poolActive), color: COLORS.used },
                    { label: 'Idle', value: poolIdle, display: String(poolIdle), color: COLORS.idle },
                    { label: 'Unused slots', value: poolUnused, display: String(poolUnused), color: COLORS.unused },
                  ]}
                />
                <Stacked
                  segments={[
                    { label: 'active', value: poolActive, color: COLORS.used },
                    { label: 'idle', value: poolIdle, color: COLORS.idle },
                    { label: 'unused', value: poolUnused, color: COLORS.unused },
                  ]}
                />
              </MetricCard>
            )}

            {workers && (
              <MetricCard
                title="Workers"
                action={actionFor(health, 'WORKERS')}
                expanded={expanded === 'WORKERS'}
                onToggle={() => toggle('WORKERS')}
                onOptimize={() => askOptimize('WORKERS')}
                cooling={cooling('WORKERS') || saving}
                sparkPoints={history.map((s) => s.workers)}
                sparkColor={COLORS.workers}
                loadTestEnabled={Boolean(health.loadTestEnabled)}
                loadRunning={loadActive(health, 'WORKERS')}
                onStartLoad={() => askLoad('WORKERS')}
                onStopLoad={() => void runStopLoad('WORKERS')}
              >
                <Donut
                  center={`${workerActive}/${workerMax}`}
                  parts={[
                    { label: 'Active threads', value: workerActive, display: String(workerActive), color: COLORS.workers },
                    { label: 'Idle pool', value: Math.max(0, workerMax - workerActive), display: String(Math.max(0, workerMax - workerActive)), color: COLORS.unused },
                  ]}
                />
                <Gauge label="Pool size / max" used={workerPool} max={workerMax} display={`${workerPool} / ${workerMax}`} />
                <Gauge label="Queue" used={queueSize} max={queueCap} display={`${queueSize} / ${queueCap}`} />
              </MetricCard>
            )}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Trend · last {history.length} samples</CardTitle></CardHeader>
            <CardContent>
              {history.length ? <Trend history={history} /> : <p className="text-sm text-muted-foreground">Waiting for samples.</p>}
            </CardContent>
          </Card>

          <h2 className="text-base font-semibold">All components ({names.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {names.map((name) => {
              const component = health.components[name];
              const keys = Object.keys(component.details);
              return (
                <Card key={name} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base font-semibold min-w-0 break-words">{name}</CardTitle>
                      <Badge className={cn('shrink-0', statusTone(component.status))}>{component.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {keys.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No extra details.</p>
                    ) : (
                      <dl className="space-y-2.5 min-w-0">
                        {keys.map((key) => (
                          <div key={key}>
                            <dt className="text-xs text-muted-foreground">{key}</dt>
                            <dd className="text-sm font-medium tabular-nums break-all">{formatHealthDetail(key, component.details[key], formatBytes)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <AlertDialog open={confirmTarget !== null} onOpenChange={(open) => { if (!open && !saving) setConfirmTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmKind === 'load' ? 'Start load?' : 'Run Optimize?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmKind === 'load'
                ? 'This will raise this metric on purpose. Stop load (or wait 60s) to recover. Postgres data is not deleted.'
                : 'Only KittyP internals and KittyP temp/logs. Postgres and other apps stay up. HTTP request threads are not killed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); void runOptimize(); }}>
              {saving ? 'Working…' : confirmKind === 'load' ? 'Start load' : 'Optimize'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
