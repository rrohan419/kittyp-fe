import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInHours, format, parseISO } from 'date-fns';
import {
  Bell,
  CalendarClock,
  Loader2,
  Mail,
  PawPrint,
  Stethoscope,
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
  fetchDoctorInvites,
  fetchMyPendingInvites,
  remindDoctorInvite,
} from '@/services/clinicService';
import { fetchMyDoctorVisits } from '@/services/visitService';
import { ROLES, canInviteDoctors, hasAnyRole } from '@/utils/roles';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type NotifItem = {
  id: string;
  kind: 'alert' | 'invite' | 'update' | 'visit' | 'booking';
  title: string;
  body: string;
  href: string;
  time?: string;
  inviteUuid?: string;
  canRemind?: boolean;
  inviteStatus?: string;
};

const ADDRESSED_INVITE_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'REVOKED', 'EXPIRED']);

type PortalKind = 'clinic' | 'doctor' | 'other';
type ClinicFilter = 'all' | 'invites';

const NOTIF_CLICKED_KEY = 'kittyp-notif-clicked';

function loadClickedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_CLICKED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function persistClickedIds(ids: Set<string>) {
  try {
    localStorage.setItem(NOTIF_CLICKED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

const NOTIF_REFRESH_EVENT = 'kittyp-notif-refresh';

/** Call after accept/decline so the bell drops the invite immediately. */
export function notifyInviteAddressed(inviteUuid?: string) {
  if (inviteUuid) {
    const ids = loadClickedIds();
    ids.add(`my-invite-${inviteUuid}`);
    persistClickedIds(ids);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIF_REFRESH_EVENT));
  }
}

function resolvePortalKind(basePath: string, roles: string[] | undefined): PortalKind {
  if (basePath === '/clinic') return 'clinic';
  if (basePath === '/doctor') return 'doctor';
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
  const [filter, setFilter] = useState<ClinicFilter>('all');
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [clickedIds, setClickedIds] = useState<Set<string>>(() => loadClickedIds());
  const [showAll, setShowAll] = useState(false);

  const isDoctor = hasAnyRole(user?.roles, [ROLES.DOCTOR]);
  const canManageInvites = canInviteDoctors(user?.roles);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next: NotifItem[] = [];

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
            body: `You've been invited to join as ${inv.doctorName || 'a doctor'}. Tap to accept or decline.`,
            href: inv.token
              ? `/clinic-invite/accept?token=${encodeURIComponent(inv.token)}`
              : '/doctor',
            time: inv.expiresAt,
          });
        }

        try {
          const mine = await fetchMyDoctorVisits({ clinicUuid: clinicUuid || undefined });
          for (const v of mine.filter((x) =>
            ['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS'].includes(x.status)
          ).slice(0, 12)) {
            next.push({
              id: `visit-${v.uuid}`,
              kind: 'visit',
              title:
                v.status === 'CHECKED_IN'
                  ? `${v.petName} checked in`
                  : v.status === 'IN_PROGRESS'
                    ? `${v.petName} with you`
                    : `${v.petName} assigned`,
              body: `${v.ownerName || 'Owner'}${v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}${
                v.clinicName ? ` · ${v.clinicName}` : ''
              }`,
              href: '/doctor/appointments',
            });
          }
        } catch (err) {
          console.error('Failed to load doctor visits for notifications', err);
        }
      }

      if (portal === 'clinic' && clinicUuid && canManageInvites) {
        const invites = await fetchDoctorInvites(clinicUuid).catch(() => [] as DoctorInviteModel[]);

        for (const inv of invites.slice(0, 20)) {
          const pending = inv.status === 'PENDING';
          const hoursSinceCreate = inv.createdAt
            ? differenceInHours(new Date(), parseISO(inv.createdAt))
            : 0;
          const hoursSinceRemind = inv.lastRemindedAt
            ? differenceInHours(new Date(), parseISO(inv.lastRemindedAt))
            : 999;
          const canRemind =
            pending &&
            (inv.canRemind === true || (hoursSinceCreate >= 24 && hoursSinceRemind >= 24));

          next.push({
            id: `out-invite-${inv.uuid}`,
            kind: 'invite',
            title: pending
              ? 'Doctor invite pending'
              : inv.status === 'ACCEPTED'
                ? 'Doctor accepted invite'
                : inv.status === 'REJECTED'
                  ? 'Doctor declined invite'
                  : `Invite ${inv.status?.toLowerCase() || 'update'}`,
            body: `${inv.doctorName || inv.email} · ${inv.clinicName || clinic?.name || 'Clinic'}`,
            href: `/clinic/doctors`,
            time: inv.expiresAt,
            inviteUuid: pending ? inv.uuid : undefined,
            canRemind,
            inviteStatus: inv.status,
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
  }, [portal, clinicUuid, clinic?.name, basePath, isDoctor, canManageInvites]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => {
      setClickedIds(loadClickedIds());
      void load();
    };
    window.addEventListener(NOTIF_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(NOTIF_REFRESH_EVENT, onRefresh);
  }, [load]);

  const visible = useMemo(() => {
    let list = items;
    if (portal === 'clinic' && filter === 'invites') {
      const invites = items.filter((i) => i.kind === 'invite');
      list = invites.length
        ? invites
        : [
            {
              id: 'empty-invites',
              kind: 'update' as const,
              title: 'No doctor invites',
              body: 'Pending and recent invite responses will appear here.',
              href: '/clinic/doctors',
            },
          ];
    }

    if (!showAll) {
      const filtered = list.filter((i) => {
        if (i.id.startsWith('empty-') || i.kind === 'update') return true;
        if (clickedIds.has(i.id)) return false;
        if (
          i.kind === 'invite' &&
          i.inviteStatus &&
          ADDRESSED_INVITE_STATUSES.has(i.inviteStatus)
        ) {
          return false;
        }
        return true;
      });
      // If everything real was clicked, keep a quiet empty tip instead of a blank panel.
      const hasReal = filtered.some((i) => !i.id.startsWith('empty-') && i.kind !== 'update');
      if (!hasReal && list.some((i) => !i.id.startsWith('empty-') && i.kind !== 'update')) {
        return [
          {
            id: 'empty-clicked',
            kind: 'update' as const,
            title: 'No new notifications',
            body: 'Opened items are hidden. Tap Show all to see them again.',
            href: basePath || '/',
          },
        ];
      }
      return filtered;
    }
    return list;
  }, [items, filter, portal, showAll, clickedIds, basePath]);

  const actionable = items.filter((i) => {
    if (i.id.startsWith('empty-') || i.kind === 'update') return false;
    if (!showAll && clickedIds.has(i.id)) return false;
    if (
      i.kind === 'invite' &&
      i.inviteStatus &&
      ADDRESSED_INVITE_STATUSES.has(i.inviteStatus)
    ) {
      return false;
    }
    if (i.kind === 'alert' || i.kind === 'visit' || i.kind === 'booking') return true;
    return i.kind === 'invite' && (i.canRemind || i.inviteUuid || i.href.includes('clinic-invite'));
  }).length;

  const markClicked = (id: string) => {
    if (id.startsWith('empty-') || id === 'empty-tip') return;
    setClickedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistClickedIds(next);
      return next;
    });
  };

  const onRemind = async (inviteUuid: string) => {
    if (!clinicUuid) return;
    setRemindingId(inviteUuid);
    try {
      await remindDoctorInvite(clinicUuid, inviteUuid);
      toast.success('Reminder sent to the doctor');
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not send reminder (wait 24h after invite/last reminder)';
      toast.error(msg);
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setFilter('all');
          setShowAll(false);
        }
      }}
    >
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
      <PopoverContent align="end" sideOffset={8} collisionPadding={12} className="w-[min(380px,calc(100vw-1.5rem))] p-0 overflow-hidden z-[200]">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground truncate">
            {portal === 'clinic'
              ? clinic?.name
                ? `${clinic.name} only`
                : 'Active clinic'
              : portal === 'doctor'
                ? 'Invites & assigned patients'
                : 'Account updates'}
          </p>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            visible.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 px-4 py-3 border-b border-border/60 last:border-0"
              >
                <Link
                  to={item.href}
                  onClick={() => {
                    markClicked(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex gap-3 min-w-0 flex-1 hover:opacity-90',
                    clickedIds.has(item.id) && showAll && 'opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      item.kind === 'alert' && 'bg-destructive/10 text-destructive',
                      item.kind === 'invite' && 'bg-primary/15 text-primary',
                      item.kind === 'visit' && 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
                      item.kind === 'booking' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                      item.kind === 'update' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.kind === 'alert' && <PawPrint className="h-4 w-4" />}
                    {item.kind === 'invite' && <UserPlus className="h-4 w-4" />}
                    {item.kind === 'visit' && <Stethoscope className="h-4 w-4" />}
                    {item.kind === 'booking' && <CalendarClock className="h-4 w-4" />}
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
                {item.canRemind && item.inviteUuid && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 text-xs self-center"
                    disabled={remindingId === item.inviteUuid}
                    onClick={() => onRemind(item.inviteUuid!)}
                  >
                    {remindingId === item.inviteUuid ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Remind'
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-border bg-muted/30 flex gap-2 flex-wrap">
          {portal === 'clinic' && canManageInvites && (
            <Button
              variant={filter === 'invites' ? 'secondary' : 'ghost'}
              size="sm"
              className="flex-1 text-xs min-w-[40%]"
              onClick={() => setFilter((f) => (f === 'invites' ? 'all' : 'invites'))}
            >
              Invites
            </Button>
          )}
          <Button
            variant={showAll ? 'secondary' : 'ghost'}
            size="sm"
            className="flex-1 text-xs min-w-[40%]"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Hide opened' : 'Show all'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
