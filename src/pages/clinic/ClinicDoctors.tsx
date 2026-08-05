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
import { Plus, Search, Mail, Loader2, UserPlus, Trash2 } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicDoctorModel,
  DoctorInviteModel,
  fetchClinicDoctors,
  fetchDoctorInvites,
  inviteDoctor,
  lookupDoctorByUuid,
  revokeDoctorInvite,
} from '@/services/clinicService';
import { toast } from 'sonner';
import { validateEmail } from '@/utils/validation';

export default function ClinicDoctors() {
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
        fetchDoctorInvites(clinicUuid),
      ]);
      setDoctors(list);
      setInvites(pending.filter((i) => i.status === 'PENDING'));
    } catch {
      setDoctors([]);
      setInvites([]);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicUuid]);

  const filtered = useMemo(
    () =>
      doctors.filter((d) =>
        `${d.name} ${d.specialization || ''} ${d.email || ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [doctors, search]
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicUuid) return;

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
      if (byId) {
        await inviteDoctor(clinicUuid, {
          doctorUuid: byId,
          name: inviteName.trim() || undefined,
        });
      } else {
        await inviteDoctor(clinicUuid, { name: inviteName.trim(), email: byEmail });
      }
      toast.success('Invitation sent');
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteDoctorId('');
      setLookedUp(null);
      await reload();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send invite';
      toast.error(message);
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
      toast.success('Invite revoked');
      await reload();
    } catch {
      toast.error('Failed to revoke invite');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {clinicLoading || loading
              ? 'Loading…'
              : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}${clinic?.name ? ` at ${clinic.name}` : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)} disabled={!clinicUuid}>
          <Plus className="h-4 w-4 mr-2" />
          Invite Doctor
        </Button>
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

      {invites.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Pending invitations
            </CardTitle>
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    Pending
                  </Badge>
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
                    Revoke
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
          No doctors linked to this clinic yet. Invite a doctor to get started.
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
              <Card key={d.doctorUuid || d.userUuid} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.specialization || 'General'}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${d.isActive === false ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'} border-0 text-[10px] capitalize shrink-0`}
                    >
                      {d.isActive === false ? 'inactive' : 'active'}
                    </Badge>
                  </div>

                  {d.email && (
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {d.email}
                      </div>
                    </div>
                  )}

                  {d.role && <p className="mt-3 text-xs text-muted-foreground">Role: {d.role}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Doctor</DialogTitle>
            <DialogDescription>
              Send an email invitation. When accepted, the doctor will be linked to this clinic and appear here for
              appointments.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Doctor name {inviteDoctorId.trim() ? '' : '*'}</Label>
              <Input
                id="inviteName"
                placeholder="Dr. Jane Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required={!inviteDoctorId.trim()}
                disabled={!!inviteDoctorId.trim() && !!lookedUp}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Doctor email *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="doctor@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (e.target.value.trim()) {
                    setInviteDoctorId('');
                    setLookedUp(null);
                  }
                }}
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
                  placeholder="Doctor profile UUID"
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
    </div>
  );
}
