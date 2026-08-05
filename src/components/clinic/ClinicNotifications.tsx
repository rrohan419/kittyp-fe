import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Bell,
  CalendarClock,
  Loader2,
  Mail,
  PawPrint,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  DoctorInviteModel,
  RetentionAlertModel,
  fetchDoctorInvites,
  fetchRetentionAlerts,
} from '@/services/clinicService';
import { cn } from '@/lib/utils';

type NotifItem = {
  id: string;
  kind: 'alert' | 'invite' | 'update';
  title: string;
  body: string;
  href: string;
  time?: string;
};

export function ClinicNotifications() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);

  const load = useCallback(async () => {
    if (!clinicUuid) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const [alerts, invites] = await Promise.all([
        fetchRetentionAlerts(clinicUuid).catch(() => [] as RetentionAlertModel[]),
        fetchDoctorInvites(clinicUuid).catch(() => [] as DoctorInviteModel[]),
      ]);
      const next: NotifItem[] = [];

      for (const a of alerts.filter((x) => !x.status || x.status.toUpperCase() === 'OPEN').slice(0, 8)) {
        next.push({
          id: `alert-${a.id}`,
          kind: 'alert',
          title: `${a.petName} · follow-up`,
          body: a.message || a.type,
          href: `/clinic/retention`,
        });
      }

      for (const inv of invites.filter((i) => i.status === 'PENDING' || i.status === 'SENT').slice(0, 5)) {
        next.push({
          id: `invite-${inv.uuid}`,
          kind: 'invite',
          title: 'Doctor invite pending',
          body: `${inv.doctorName || inv.email} · ${inv.clinicName || clinic?.name || 'Clinic'}`,
          href: `/clinic/doctors`,
          time: inv.expiresAt,
        });
      }

      if (next.length === 0) {
        next.push({
          id: 'empty-tip',
          kind: 'update',
          title: 'All caught up',
          body: `No open alerts for ${clinic?.name || 'this clinic'}. Pet health updates will appear here.`,
          href: `/clinic/patients`,
        });
      }

      setItems(next);
    } finally {
      setLoading(false);
    }
  }, [clinicUuid, clinic?.name]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    void load();
  }, [load]);

  const actionable = items.filter((i) => i.id !== 'empty-tip').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {actionable > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
              {actionable > 9 ? '9+' : actionable}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 via-background to-background">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground truncate">
            {clinic?.name ? `${clinic.name} only` : 'Active clinic'}
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border/60 last:border-0"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    item.kind === 'alert' && 'bg-destructive/10 text-destructive',
                    item.kind === 'invite' && 'bg-primary/15 text-primary',
                    item.kind === 'update' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {item.kind === 'alert' && <PawPrint className="h-4 w-4" />}
                  {item.kind === 'invite' && <UserPlus className="h-4 w-4" />}
                  {item.kind === 'update' && <Mail className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.kind !== 'update' && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
                        {item.kind}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.body}</p>
                  {item.time && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      Expires {(() => {
                        try {
                          return format(parseISO(item.time), 'MMM d');
                        } catch {
                          return item.time;
                        }
                      })()}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border bg-muted/30 flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild onClick={() => setOpen(false)}>
            <Link to="/clinic/retention">Retention</Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild onClick={() => setOpen(false)}>
            <Link to="/clinic/doctors">Invites</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
