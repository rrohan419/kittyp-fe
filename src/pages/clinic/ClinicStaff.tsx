import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, UserPlus, Trash2, Copy, UserMinus } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  StaffInviteModel,
  StaffMemberModel,
  disableClinicStaff,
  fetchClinicStaff,
  fetchStaffInvites,
  inviteStaff,
  isClinicActivated,
  CLINIC_NOT_ACTIVATED_MESSAGE,
  revokeStaffInvite,
} from '@/services/clinicService';
import { toast } from 'sonner';
import { parseApiErrorMessage, validateEmail } from '@/utils/validation';

export default function ClinicStaff() {
  const { clinicUuid, clinic, loading: clinicLoading } = useActiveClinic();
  const clinicActivated = isClinicActivated(clinic?.status);
  const [staff, setStaff] = useState<StaffMemberModel[]>([]);
  const [invites, setInvites] = useState<StaffInviteModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    if (!clinicUuid) {
      setStaff([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [members, pending] = await Promise.all([
        fetchClinicStaff(clinicUuid),
        fetchStaffInvites(clinicUuid),
      ]);
      setStaff(members);
      setInvites(pending.filter((inv) => inv.status === 'PENDING'));
    } catch {
      setStaff([]);
      setInvites([]);
      toast.error('Failed to load clinic staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicUuid]);

  const handleInvite = async () => {
    if (!clinicUuid) return;
    if (!clinicActivated) {
      toast.error(CLINIC_NOT_ACTIVATED_MESSAGE);
      return;
    }
    const emailErr = validateEmail(inviteEmail);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    if (!inviteName.trim()) {
      toast.error('Staff name is required');
      return;
    }
    setSending(true);
    try {
      const sent = await inviteStaff(clinicUuid, {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
      });
      toast.success(`Invite sent to ${sent.email}`);
      setInviteOpen(false);
      setInviteName('');
      setInviteEmail('');
      await load();
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Failed to send invite'));
    } finally {
      setSending(false);
    }
  };

  const copyLink = async (token?: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/staff-invite/accept?token=${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Invite link copied');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Staff</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Invite front-desk staff to this clinic. They cannot sign up publicly.
          </p>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          disabled={!clinicUuid || clinicLoading || !clinicActivated}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite staff
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading staff…
        </div>
      ) : (
        <>
          {invites.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Pending invites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invites.map((inv) => (
                  <div
                    key={inv.uuid}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{inv.staffName}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void copyLink(inv.token)}
                        disabled={!inv.token}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === inv.uuid}
                        onClick={async () => {
                          if (!clinicUuid) return;
                          setActingId(inv.uuid);
                          try {
                            await revokeStaffInvite(clinicUuid, inv.uuid);
                            toast.success('Invite cancelled');
                            await load();
                          } catch (err: unknown) {
                            toast.error(parseApiErrorMessage(err, 'Failed to cancel invite'));
                          } finally {
                            setActingId(null);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {staff.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                No staff at this clinic yet. Invite someone by email.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => (
                <Card key={member.userUuid} className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] border-0 capitalize">
                        {member.role || 'staff'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {member.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actingId === member.userUuid}
                      onClick={async () => {
                        if (!clinicUuid) return;
                        setActingId(member.userUuid);
                        try {
                          await disableClinicStaff(clinicUuid, member.userUuid);
                          toast.success(`${member.name} can no longer sign in`);
                          await load();
                        } catch (err: unknown) {
                          toast.error(parseApiErrorMessage(err, 'Failed to disable staff'));
                        } finally {
                          setActingId(null);
                        }
                      }}
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-1" />
                      Disable
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite staff</DialogTitle>
            <DialogDescription>
              They will receive a link to create a password for this clinic only.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="staffName">Name</Label>
              <Input
                id="staffName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Reception name"
              />
            </div>
            <div>
              <Label htmlFor="staffEmail">Work email</Label>
              <Input
                id="staffEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@clinic.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleInvite()} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
