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
import { useAppSelector } from '@/module/store/hooks';
import {
  DoctorInviteModel,
  RetentionAlertModel,
  fetchDoctorInvites,
  fetchMyPendingInvites,
  fetchRetentionAlerts,
} from '@/services/clinicService';
import { ROLES, hasAnyRole } from '@/utils/roles';
import { cn } from '@/lib/utils';

type NotifItem = {
  id: string;
  kind: 'alert' | 'invite' | 'update';
  title: string;
  body: string;
  href: string;
  time?: string;
};

type PortalKind = 'clinic' | 'doctor' | 'other';

function resolvePortalKind(basePath: string, roles: string[] | undefined): PortalKind {
  if (basePath === '/clinic') return 'clinic';
  if (basePath === '/doctor') return 'doctor';
  // Multi-role users on other shells: still surface clinic invites for doctors.
  if (hasAnyRole(roles, [ROLES.DOCTOR])) return 'doctor';
  return 'other';
}

export function PortalNotifications({ basePath }: { basePath: string }) {
  const { clinicUuid, clinic } = useActiveClinic();
  const user = useAppSelector((s) => s.authReducer.user);
  const portal = resolvePortalKind(basePath, user?.roles);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotifItem[]>([]);

  const isDoctor = hasAnyRole(user?.roles, [ROLES.DOCTOR]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next: NotifItem[] = [];

      // Incoming clinic→doctor invites for any doctor account (even while using clinic portal).
      if (isDoctor) {
        let myInvites: DoctorInviteModel[] = [];
        try {
          myInvites = await fetchMyPendingInvites();
        } catch (err) {
          console.error('Failed to load doctor invites', err);
        }
        for (const inv of myInvites.filter((i) => i.status === 'PENDING')) {
          next.push({
            id: `my-invite-${inv.uuid}`,
            kind: 'invite',
            title: `Invite from ${inv.clinicName}`,
            body: `You've been invited to join as ${inv.doctorName || 'a doctor'}. Tap to accept.`,
            href: inv.token
              ? `/clinic-invite/accept?token=${encodeURIComponent(inv.token)}`
              : '/doctor',
            time: inv.expiresAt,
          });
        }
      }

      if (portal === 'clinic' && clinicUuid) {
        const [alerts, invites] = await Promise.all([
          fetchRetentionAlerts(clinicUuid).catch(() => [] as RetentionAlertModel[]),
          fetchDoctorInvites(clinicUuid).catch(() => [] as DoctorInviteModel[]),
        ]);

        for (const a of alerts
          .filter((x) => !x.status || x.status.toUpperCase() === 'OPEN')
          .slice(0, 8)) {
          next.push({
            id: `alert-${a.id}`,
            kind: 'alert',
            title: `${a.petName} · follow-up`,
            body: a.message || a.type,
            href: `/clinic/retention`,
          });
        }

        for (const inv of invites.filter((i) => i.status === 'PENDING').slice(0, 5)) {
          next.push({
            id: `out-invite-${inv.uuid}`,
            kind: 'invite',
            title: 'Doctor invite pending',
            body: `${inv.doctorName || inv.email} · ${inv.clinicName || clinic?.name || 'Clinic'}`,
            href: `/clinic/doctors`,
            time: inv.expiresAt,
          });
        }
      }

      if (next.length === 0) {
        if (portal === 'clinic') {
          next.push({
            id: 'empty-tip',
            kind: 'update',
            title: 'All caught up',
            body: `No open alerts for ${clinic?.name || 'this clinic'}.`,
            href: `/clinic/patients`,
          });
        } else if (isDoctor || portal === 'doctor') {
          next.push({
            id: 'empty-tip',
            kind: 'update',
            title: 'No clinic invites',
            body: 'When a clinic invites you, it will show up here.',
            href: '/doctor',
          });
        } else {
          next.push({
            id: 'empty-tip',
            kind: 'update',
            title: 'No notifications yet',
            body: 'Updates and alerts for your account will appear here.',
            href: basePath || '/',
          });
        }
      }

      setItems(next);
    } finally {
      setLoading(false);
    }
  }, [portal, clinicUuid, clinic?.name, basePath, isDoctor]);

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
            {portal === 'clinic'
              ? clinic?.name
                ? `${clinic.name} only`
                : 'Active clinic'
              : portal === 'doctor'
                ? 'Clinic invitations'
                : 'Account updates'}
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
                      Expires{' '}
                      {(() => {
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
        {portal === 'clinic' && (
          <div className="p-2 border-t border-border bg-muted/30 flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild onClick={() => setOpen(false)}>
              <Link to="/clinic/retention">Retention</Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-xs" asChild onClick={() => setOpen(false)}>
              <Link to="/clinic/doctors">Invites</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
