import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, Plus, Power, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { shutdownClinic, reopenClinic, updateClinic } from '@/services/clinicService';
import { ClinicHoursDisplay, ClinicHoursEditor } from '@/components/clinic/ClinicHoursEditor';
import {
  type ClinicHourDay,
  defaultClinicHours,
  parseOperatingHours,
  serializeOperatingHours,
} from '@/utils/clinicHours';
import { Link } from 'react-router-dom';
import { RootState } from '@/module/store/store';
import { ROLES, hasRole } from '@/utils/roles';
import { CopyableId } from '@/components/ui/CopyableId';

export default function ClinicSettings() {
  const { user } = useSelector((state: RootState) => state.authReducer);
  const { clinic, clinicUuid, refresh } = useActiveClinic();
  const canManagePracticeProfile =
    hasRole(user?.roles, ROLES.CLINIC_ADMIN) ||
    (hasRole(user?.roles, ROLES.DOCTOR) && !!clinic?.personal);
  const [acting, setActing] = useState(false);
  const isShutdown = clinic?.status === 'SHUTDOWN';

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('');
  const [hours, setHours] = useState<ClinicHourDay[]>([]);
  const [legacyHours, setLegacyHours] = useState<string | null>(null);

  useEffect(() => {
    if (!clinic || editingProfile) return;
    setName(clinic.name ?? '');
    setLicenseNumber(clinic.licenseNumber ?? '');
    setEmail(clinic.email ?? '');
    setPhone(clinic.phone ?? '');
    setAddress(clinic.address ?? '');
    setTimezone(clinic.timezone ?? '');
    const parsed = parseOperatingHours(clinic.operatingHours);
    setHours(parsed.days);
    setLegacyHours(parsed.legacyText);
  }, [clinic, editingProfile]);

  const handleShutdown = async () => {
    if (!clinicUuid) return;
    if (!window.confirm('Shut down this clinic? Records stay readable but new writes will be blocked.')) return;
    setActing(true);
    try {
      await shutdownClinic(clinicUuid);
      await refresh();
      toast.success('Clinic shut down');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to shut down clinic');
    } finally {
      setActing(false);
    }
  };

  const handleReopen = async () => {
    if (!clinicUuid) return;
    setActing(true);
    try {
      await reopenClinic(clinicUuid);
      await refresh();
      toast.success('Clinic reopened');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reopen clinic');
    } finally {
      setActing(false);
    }
  };

  const saveProfile = async () => {
    if (!clinicUuid || !clinic) return;
    if (!name.trim()) {
      toast.error('Practice name is required');
      return;
    }
    const nextTimezone = timezone.trim();
    if (nextTimezone) {
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: nextTimezone });
      } catch {
        toast.error('Enter a valid IANA time zone, such as Asia/Kolkata');
        return;
      }
    }
    setSavingProfile(true);
    try {
      await updateClinic(clinicUuid, {
        name: name.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        timezone: nextTimezone || undefined,
        operatingHours: serializeOperatingHours(hours),
        profileImageUrl: clinic.profileImageUrl || undefined,
      });
      await refresh();
      setEditingProfile(false);
      setLegacyHours(null);
      toast.success('Practice profile saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save practice profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Practice Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinic?.name ?? 'Manage your practice profile'} — switch branches from the top bar
        </p>
        <div className="mt-3 space-y-2">
          <CopyableId
            label="Clinic ID"
            value={clinic?.uuid}
            hint="Sign in with this ID or your email."
          />
        </div>
      </div>

      {isShutdown && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This clinic is shut down. History is read-only until reopened.
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Practice Profile</CardTitle>
          {canManagePracticeProfile && !isShutdown && !editingProfile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!hours.length) setHours(defaultClinicHours());
                setEditingProfile(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Practice Name</Label>
              <Input
                value={editingProfile ? name : clinic?.name ?? ''}
                readOnly={!editingProfile}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input
                value={editingProfile ? licenseNumber : clinic?.licenseNumber ?? ''}
                readOnly={!editingProfile}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editingProfile ? email : clinic?.email ?? ''}
                readOnly={!editingProfile}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={editingProfile ? phone : clinic?.phone ?? ''}
                readOnly={!editingProfile}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-timezone">Time zone</Label>
              <Input
                id="clinic-timezone"
                value={timezone}
                readOnly={!editingProfile}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Asia/Kolkata"
                autoComplete="off"
              />
              {editingProfile && (
                <p className="text-xs text-muted-foreground">Use an IANA time zone name.</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={editingProfile ? address : clinic?.address ?? ''}
              readOnly={!editingProfile}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Operating Hours</Label>
            {editingProfile ? (
              <ClinicHoursEditor value={hours} onChange={setHours} disabled={savingProfile} />
            ) : (
              <ClinicHoursDisplay days={hours} legacyText={legacyHours} />
            )}
          </div>
          {editingProfile && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveProfile()} disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={savingProfile}
                onClick={() => setEditingProfile(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          <p className={`text-xs ${isShutdown ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>
            Status: {clinic?.status ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Multi-practice</CardTitle>
          <CardDescription>
            Switch practices from the top bar, or add another branch under this organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/clinic/clinics/new">
              <Plus className="h-4 w-4 mr-2" />
              Add another practice
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card
        className={`border shadow-sm ${
          isShutdown
            ? 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20'
            : 'border-border'
        }`}
      >
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Power className="h-4 w-4" />
            Clinic lifecycle
          </CardTitle>
          <CardDescription>
            Shutting down archives this branch without deleting data. Other clinics stay unaffected.
            Reopen anytime to resume bookings and writes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {isShutdown ? (
              <Button onClick={handleReopen} disabled={acting || !clinicUuid}>
                Reopen clinic
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleShutdown} disabled={acting || !clinicUuid}>
                Shut down clinic
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
