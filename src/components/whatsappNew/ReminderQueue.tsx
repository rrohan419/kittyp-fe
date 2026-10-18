import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Syringe, CalendarClock, Bell, Receipt, Pause, Play, Send, Clock3, CheckCheck,
  MailOpen, MessageCircleReply, CalendarCog, Sparkles,
} from 'lucide-react';

export type ReminderType = 'vaccine' | 'appointment' | 'followup' | 'invoice';
export type ReminderStatus = 'scheduled' | 'paused' | 'sent' | 'read' | 'replied';

export interface Reminder {
  id: string;
  autoKey: string;
  type: ReminderType;
  petName: string;
  parentName: string;
  trigger: string;
  scheduledAt: Date;
  status: ReminderStatus;
  price: number;
}

export interface AutoInfo {
  on: boolean;
  templateName: string | null;
  timing: string;
}

const TYPE_ICON: Record<ReminderType, typeof Syringe> = {
  vaccine: Syringe,
  appointment: CalendarClock,
  followup: Bell,
  invoice: Receipt,
};

const HISTORY_META: Record<'sent' | 'read' | 'replied', { label: string; icon: typeof CheckCheck; cls: string }> = {
  sent: { label: 'Sent', icon: CheckCheck, cls: 'text-muted-foreground' },
  read: { label: 'Read', icon: MailOpen, cls: 'text-primary' },
  replied: { label: 'Replied', icon: MessageCircleReply, cls: 'text-primary' },
};

type Filter = 'all' | 'scheduled' | 'paused' | 'sent';

const DAY_START = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function dayLabel(d: Date) {
  const diff = Math.round((DAY_START(d) - DAY_START(new Date())) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return 'Earlier';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const timeLabel = (d: Date) =>
  d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function rescheduleChoices(): { label: string; date: Date }[] {
  const now = new Date();
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const evening = new Date(now);
  evening.setHours(18, 0, 0, 0);
  const todayEve = evening > now ? evening : at(1, 18);
  return [
    { label: 'This evening, 6:00 PM', date: todayEve },
    { label: 'Tomorrow, 10:00 AM', date: at(1, 10) },
    { label: 'In 2 days, same time', date: new Date(now.getTime() + 2 * 86_400_000) },
    { label: 'Next week, same time', date: new Date(now.getTime() + 7 * 86_400_000) },
  ];
}

export function ReminderQueue({ reminders, autoMap, onChange, onSendNow }: {
  reminders: Reminder[];
  autoMap: Record<string, AutoInfo>;
  onChange: (id: string, patch: Partial<Reminder>) => void;
  onSendNow: (r: Reminder) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [rescheduling, setRescheduling] = useState<Reminder | null>(null);

  const isHistory = (s: ReminderStatus) => s === 'sent' || s === 'read' || s === 'replied';

  const visible = useMemo(() => {
    return reminders
      .filter((r) => {
        const a = autoMap[r.autoKey];
        if (isHistory(r.status)) return filter === 'all' || filter === 'sent';
        const live = !!a?.on && !!a.templateName;
        if (filter === 'sent') return false;
        if (filter === 'scheduled') return live && r.status === 'scheduled';
        if (filter === 'paused') return live && r.status === 'paused';
        return live;
      })
      .sort((x, y) => x.scheduledAt.getTime() - y.scheduledAt.getTime());
  }, [reminders, autoMap, filter]);

  const groups = useMemo(() => {
    const m = new Map<string, Reminder[]>();
    for (const r of visible) {
      const k = dayLabel(r.scheduledAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()];
  }, [visible]);

  const scheduledLive = reminders.filter(
    (r) => r.status === 'scheduled' && autoMap[r.autoKey]?.on && autoMap[r.autoKey]?.templateName,
  );
  const week = scheduledLive.filter((r) => r.scheduledAt.getTime() - Date.now() < 7 * 86_400_000);
  const projected = scheduledLive.reduce((s, r) => s + r.price, 0);
  const history = reminders.filter((r) => isHistory(r.status));

  const stats = [
    { label: 'Queued this week', value: String(week.length), sub: 'go out on their own' },
    { label: 'Projected cost', value: inr(projected), sub: 'from wallet on send' },
    { label: 'Sent so far', value: String(history.length), sub: 'last few days' },
    { label: 'Auto-handled', value: '100%', sub: 'zero manual work' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/10 gap-1">
          <Sparkles className="h-3 w-3" /> Auto-generated from pet health records
        </Badge>
        <p className="text-xs text-muted-foreground">
          No setup needed — reminders appear here as vaccines fall due and visits are booked.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['all', 'scheduled', 'paused', 'sent'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3.5 h-9 rounded-full text-sm whitespace-nowrap border transition-colors',
              filter === f ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted')}>
            {f === 'all' ? 'All' : f === 'sent' ? 'History' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nothing here yet. Turn on automations to start sending reminders automatically.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([day, rows]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{day}</p>
              <div className="rounded-2xl border border-border bg-card divide-y divide-border">
                {rows.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  const a = autoMap[r.autoKey];
                  const hm = isHistory(r.status) ? HISTORY_META[r.status] : null;
                  return (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
                          {r.petName} <span className="font-normal text-muted-foreground">· {r.parentName}</span>
                          {r.status === 'paused' && <Badge variant="outline" className="text-[10px] h-5">Paused</Badge>}
                          {hm && (
                            <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', hm.cls)}>
                              <hm.icon className="h-3 w-3" />{hm.label}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.trigger} · {a?.templateName ?? 'no approved template'}
                          {!isHistory(r.status) && a?.templateName && <span> · fires {a.timing.toLowerCase()}</span>}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                        <p className="flex sm:justify-end items-center gap-1">
                          <Clock3 className="h-3 w-3" />{dayLabel(r.scheduledAt)}, {timeLabel(r.scheduledAt)}
                        </p>
                        <p>{inr(r.price)} / message</p>
                      </div>
                      {!isHistory(r.status) && (
                        <div className="flex gap-1.5 shrink-0 flex-wrap">
                          {r.status === 'scheduled' && (
                            <Button size="sm" variant="outline" onClick={() => onSendNow(r)}>
                              <Send className="h-3.5 w-3.5 mr-1" />Send now
                            </Button>
                          )}
                          <Button size="sm" variant="ghost"
                            onClick={() => {
                              onChange(r.id, { status: r.status === 'paused' ? 'scheduled' : 'paused' });
                              toast.success(r.status === 'paused' ? 'Reminder resumed' : 'Reminder paused');
                            }}>
                            {r.status === 'paused'
                              ? <><Play className="h-3.5 w-3.5 mr-1" />Resume</>
                              : <><Pause className="h-3.5 w-3.5 mr-1" />Pause</>}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRescheduling(r)} aria-label="Reschedule">
                            <CalendarCog className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rescheduling} onOpenChange={(v) => !v && setRescheduling(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule reminder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-1">
            {rescheduling?.petName} · {rescheduling?.trigger}
          </p>
          <div className="space-y-2">
            {rescheduleChoices().map((c) => (
              <button key={c.label} type="button"
                onClick={() => {
                  if (rescheduling) {
                    onChange(rescheduling.id, { scheduledAt: c.date, status: 'scheduled' });
                    toast.success('Reminder rescheduled', { description: c.label });
                  }
                  setRescheduling(null);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted hover:border-primary transition-colors text-sm text-left min-h-[44px]">
                <CalendarCog className="h-4 w-4 text-primary shrink-0" />{c.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}