import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Mail, Loader2, UserPlus, Trash2, ChevronRight, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { useAppSelector } from '@/module/store/hooks';
import { ratingAdjective } from '@/components/schedule/weekCalendarUtils';
import {
  ClinicDoctorModel,
  DoctorInviteModel,
  fetchClinicDoctors,
  fetchDoctorInvites,
  inviteDoctor,
  lookupDoctorByUuid,
  remindDoctorInvite,
  revokeDoctorInvite,
} from '@/services/clinicService';
import { statusLabel } from '@/services/doctorVerificationService';
import { toast } from 'sonner';
import { parseApiErrorMessage, validateEmail } from '@/utils/validation';
import { canInviteDoctors, canViewDoctorCertificates } from '@/utils/roles';
import { useDoctorsBasePath } from '@/hooks/useDoctorsBasePath';
import { specializationLabel } from '@/utils/specialization';

function DoctorRatingLine({
  rating,
  reviewsCount,
  ratingLabel,
}: {
  rating?: number | null;
  reviewsCount?: number | null;
  ratingLabel?: string | null;
}) {
  const count = reviewsCount ?? 0;
  if (!rating || count <= 0) {
    return <p className="text-xs text-muted-foreground">Not rated yet</p>;
  }
  const label = ratingLabel || ratingAdjective(rating);
  return (
    <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      <span>· {label}</span>
      <span>· {count} review{count === 1 ? '' : 's'}</span>
    </p>
  );
}

export default function ClinicDoctors() {
  const navigate = useNavigate();
  const doctorsBase = useDoctorsBasePath();
  const user = useAppSelector((s) => s.authReducer.user);
  const canInvite = canInviteDoctors(user?.roles) && doctorsBase.startsWith('/clinic');
  const clinicAdminContext = doctorsBase.startsWith('/clinic');
  const { clinicUuid, clinic, loading: clinicLoading } = useActiveClinic();
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [invites, setInvites] = useState<DoctorInviteModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDoctorId, setInviteDoctorId] = useState('');
  const [lookedUp, setLookedUp] = useState<{ name: string; email: string } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  const reload = async () => {
    if (!clinicUuid) {
      setDoctors([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, pending] = await Promise.all([
        fetchClinicDoctors(clinicUuid),
        canInvite ? fetchDoctorInvites(clinicUuid) : Promise.resolve([] as DoctorInviteModel[]),
      ]);
      setDoctors(list);
      setInvites(pending.filter((i) => i.status === 'PENDING'));
    } catch {
      setDoctors([]);
      setInvites([]);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setAutoOpened(false);
    (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicUuid, canInvite]);

  // Personal / single-doctor clinics: open the profile directly (no tile list).
  useEffect(() => {
    if (loading || autoOpened || !clinicUuid || doctors.length !== 1) return;
    const only = doctors[0];
    if (!only?.doctorUuid) return;
    const selfMatch =
      !!user?.uuid && !!only.userUuid && user.uuid === only.userUuid;
    if (clinic?.personal || selfMatch || doctors.length === 1) {
      setAutoOpened(true);
      navigate(`${doctorsBase}/${only.doctorUuid}`, { replace: true });
    }
  }, [loading, autoOpened, clinicUuid, doctors, clinic?.personal, user?.uuid, navigate, doctorsBase]);

  const filtered = useMemo(
    () =>
      doctors.filter((d) =>
        `${d.name} ${d.specialization || ''} ${d.email || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [doctors, search]
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!clinicUuid) {
      toast.error('Select a clinic first, then try inviting again');
      return;
    }

    const byId = inviteDoctorId.trim();
    const byEmail = inviteEmail.trim();

    if (byId && byEmail) {
      toast.error('Use either email or doctor ID, not both');
      return;
    }
    if (!byId && !byEmail) {
      toast.error('Enter a doctor email or doctor ID');
      return;
    }

    if (byEmail) {
      if (!inviteName.trim()) {
        toast.error('Doctor name is required');
        return;
      }
      const emailErr = validateEmail(byEmail);
      if (emailErr) {
        toast.error(emailErr);
        return;
      }
    }

    setInviting(true);
    try {
      const payload = byId
        ? { doctorUuid: byId, name: inviteName.trim() || undefined }
        : { name: inviteName.trim(), email: byEmail };
      const sent = await inviteDoctor(clinicUuid, payload);
      const acceptPath = sent.token
        ? `${window.location.origin}/clinic-invite/accept?token=${encodeURIComponent(sent.token)}`
        : null;
      toast.success('Invitation sent — the doctor will see it under Notifications on /doctor', {
        description: acceptPath
          ? 'Email may be delayed locally — copy the accept link to share manually.'
          : undefined,
        action: acceptPath
          ? {
              label: 'Copy link',
              onClick: () => {
                void navigator.clipboard.writeText(acceptPath);
                toast.message('Accept link copied');
              },
            }
          : undefined,
      });
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteDoctorId('');
      setLookedUp(null);
      await reload();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown; status?: number }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      const message = parseApiErrorMessage(raw, 'Failed to send invite');
      // Already on roster / self-invite — no invite row is created, so the doctor won't get a notification.
      if (ax.response?.status === 409 || /already on your clinic roster|cannot invite your own/i.test(message)) {
        toast.message(message);
      } else {
        toast.error(message);
      }
    } finally {
      setInviting(false);
    }
  };

  const handleLookup = async () => {
    const id = inviteDoctorId.trim();
    if (!id) {
      toast.error('Enter a doctor ID');
      return;
    }
    setLookingUp(true);
    try {
      const doc = await lookupDoctorByUuid(id);
      setLookedUp({ name: doc.name, email: doc.email });
      setInviteName(doc.name);
      setInviteEmail('');
      toast.success(`Found ${doc.name}`);
    } catch (err: unknown) {
      setLookedUp(null);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Doctor not found';
      toast.error(message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleRevoke = async (inviteUuid: string) => {
    if (!clinicUuid) return;
    try {
      await revokeDoctorInvite(clinicUuid, inviteUuid);
      toast.success('Invite cancelled');
      await reload();
    } catch {
      toast.error('Failed to cancel invite');
    }
  };

  const handleRemind = async (inviteUuid: string) => {
    if (!clinicUuid) return;
    setRemindingId(inviteUuid);
    try {
      await remindDoctorInvite(clinicUuid, inviteUuid);
      toast.success('Reminder sent to the doctor');
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Reminder available 24h after invite or last reminder';
      toast.error(message);
    } finally {
      setRemindingId(null);
    }
  };

  if (loading || (doctors.length === 1 && !autoOpened && clinicUuid)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Opening profile…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {clinicLoading || loading
              ? 'Loading…'
              : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}${clinic?.name ? ` at ${clinic.name}` : ''}`}
          </p>
        </div>
        {canInvite && (
          <Button size="sm" onClick={() => setInviteOpen(true)} disabled={!clinicUuid}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Doctor
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search doctors…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {canInvite && invites.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Pending invitations
            </CardTitle>
            <p className="text-xs text-muted-foreground font-normal pt-1">
              Cancel invite ends it from the clinic side. If the doctor declines instead, you&apos;ll see
              that under Notifications → Invites.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{inv.doctorName}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    Pending
                  </Badge>
                  {inv.canRemind && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={remindingId === inv.uuid}
                      onClick={() => void handleRemind(inv.uuid)}
                    >
                      {remindingId === inv.uuid ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 mr-1" />
                      )}
                      Remind
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!clinicUuid) return;
                      try {
                        await inviteDoctor(clinicUuid, { name: inv.doctorName, email: inv.email });
                        toast.success('Invite resent');
                        await reload();
                      } catch {
                        toast.error('Failed to resend invite');
                      }
                    }}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleRevoke(inv.uuid)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Cancel invite
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading doctors…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">
          No doctors linked to this clinic yet.
          {canInvite ? ' Invite a doctor to get started.' : ''}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const initials = (d.name || '?')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link
                key={d.doctorUuid || d.userUuid}
                to={`${doctorsBase}/${d.doctorUuid}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {specializationLabel(d.specialization) || 'General'}
                        </p>
                        <div className="mt-1">
                          <DoctorRatingLine
                            rating={d.rating}
                            reviewsCount={d.reviewsCount}
                            ratingLabel={d.ratingLabel}
                          />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge
                        variant="secondary"
                        className={`${d.isActive === false ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'} border-0 text-[10px] capitalize shrink-0`}
                      >
                        {d.isActive === false ? 'inactive' : 'active'}
                      </Badge>
                      {d.status && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {statusLabel(d.status as Parameters<typeof statusLabel>[0])}
                        </Badge>
                      )}
                      {d.role && (
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {d.role}
                        </Badge>
                      )}
                    </div>

                    {d.email && (
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {d.email}
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-primary font-medium">
                      {canViewDoctorCertificates(user?.roles, user?.uuid, d.userUuid, clinicAdminContext)
                        ? 'View documents & patients →'
                        : 'View profile →'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {canInvite && (
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Doctor</DialogTitle>
            <DialogDescription>
              Send an email invitation. When accepted, the doctor will be linked to this clinic and appear here for
              appointments.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleInvite}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="inviteName">Doctor name {inviteDoctorId.trim() ? '' : '*'}</Label>
              <Input
                id="inviteName"
                name="doctorName"
                autoComplete="name"
                placeholder="Dr. Jane Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required={!inviteDoctorId.trim()}
                disabled={!!inviteDoctorId.trim() && !!lookedUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Doctor email {inviteDoctorId.trim() ? '' : '*'}</Label>
              <Input
                id="inviteEmail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="doctor@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (e.target.value.trim()) {
                    setInviteDoctorId('');
                    setLookedUp(null);
                  }
                }}
                required={!inviteDoctorId.trim()}
                disabled={!!inviteDoctorId.trim()}
              />
            </div>
            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteDoctorId">Doctor ID (already on KittyP)</Label>
              <div className="flex gap-2">
                <Input
                  id="inviteDoctorId"
                  placeholder="6-character Doctor ID"
                  value={inviteDoctorId}
                  onChange={(e) => {
                    setInviteDoctorId(e.target.value);
                    setLookedUp(null);
                    if (e.target.value.trim()) setInviteEmail('');
                  }}
                  disabled={!!inviteEmail.trim()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLookup}
                  disabled={lookingUp || !inviteDoctorId.trim() || !!inviteEmail.trim()}
                >
                  {lookingUp ? '…' : 'Look up'}
                </Button>
              </div>
              {lookedUp && (
                <p className="text-xs text-muted-foreground">
                  Invite will go to <strong>{lookedUp.name}</strong> ({lookedUp.email})
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? 'Sending…' : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
