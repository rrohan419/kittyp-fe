import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, Plus, Power, Pencil, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  shutdownClinic,
  reopenClinic,
  sendClinicContactOtp,
  updateClinic,
  verifyClinicContactOtp,
} from '@/services/clinicService';
import { ClinicHoursDisplay, ClinicHoursEditor } from '@/components/clinic/ClinicHoursEditor';
import { TimeZoneSelect } from '@/components/clinic/TimeZoneSelect';
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
import { digitsOnlyPhone, normalizeLocalPhone, validateEmail, validatePhone } from '@/utils/validation';
import { WhatsAppMark } from '@/components/auth/signup/WhatsAppMark';
import { openMsg91OtpWidget } from '@/services/msg91Widget';

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
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpMethod, setPhoneOtpMethod] = useState<'WHATSAPP' | 'PHONE'>('WHATSAPP');
  const [otpBusy, setOtpBusy] = useState<'EMAIL' | 'PHONE' | null>(null);

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

  const emailChanged = useMemo(
    () => (email || '').trim().toLowerCase() !== (clinic?.email || '').trim().toLowerCase(),
    [email, clinic?.email]
  );
  const phoneChanged = useMemo(
    () => normalizeLocalPhone(phone) !== normalizeLocalPhone(clinic?.phone || ''),
    [phone, clinic?.phone]
  );

  useEffect(() => {
    setEmailOtp('');
    setEmailOtpSent(false);
    setEmailVerified(false);
  }, [email]);

  useEffect(() => {
    setPhoneOtp('');
    setPhoneOtpSent(false);
    setPhoneVerified(false);
    setPhoneOtpMethod('WHATSAPP');
  }, [phone]);

  const requestContactOtp = async (channel: 'EMAIL' | 'PHONE') => {
    if (!clinicUuid) return;
    if (channel === 'EMAIL') {
      const validation = validateEmail(email);
      if (validation) {
        toast.error(validation);
        return;
      }
    } else {
      const validation = validatePhone(phone, true);
      if (validation) {
        toast.error(validation);
        return;
      }
    }
    setOtpBusy(channel);
    try {
      await sendClinicContactOtp(
        clinicUuid,
        channel === 'EMAIL'
          ? { channel, email: email.trim() }
          : { channel: 'WHATSAPP', phone: `+91${digitsOnlyPhone(phone)}` }
      );
      if (channel === 'EMAIL') setEmailOtpSent(true);
      else {
        setPhoneOtpSent(true);
        setPhoneOtpMethod('WHATSAPP');
      }
      toast.success(channel === 'EMAIL' ? 'OTP sent to the new practice email' : 'WhatsApp OTP sent to the new practice number');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send verification code';
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

  const verifyPracticePhoneBySms = async () => {
    if (!clinicUuid) return;
    const validation = validatePhone(phone, true);
    if (validation) {
      toast.error(validation);
      return;
    }
    setOtpBusy('PHONE');
    try {
      const fullPhone = `+91${digitsOnlyPhone(phone)}`;
      const accessToken = await openMsg91OtpWidget(fullPhone);
      await verifyClinicContactOtp(clinicUuid, {
        channel: 'PHONE',
        phone: fullPhone,
        accessToken,
      });
      setPhoneVerified(true);
      setPhoneOtpMethod('PHONE');
      toast.success('Practice phone verified by SMS');
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to verify practice phone by SMS');
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

  const confirmContactOtp = async (channel: 'EMAIL' | 'PHONE') => {
    if (!clinicUuid) return;
    const code = channel === 'EMAIL' ? emailOtp.trim() : phoneOtp.trim();
    if (!code) {
      toast.error('Enter the verification code');
      return;
    }
    setOtpBusy(channel);
    try {
      await verifyClinicContactOtp(
        clinicUuid,
        channel === 'EMAIL'
          ? { channel, email: email.trim(), code }
          : { channel: 'WHATSAPP', phone: `+91${digitsOnlyPhone(phone)}`, code }
      );
      if (channel === 'EMAIL') setEmailVerified(true);
      else setPhoneVerified(true);
      toast.success(`Practice ${channel === 'EMAIL' ? 'email' : 'phone'} verified`);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid or expired verification code';
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

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
    if (emailChanged && email.trim() && !emailVerified) {
      toast.error('Verify the new practice email before saving');
      return;
    }
    if (phoneChanged && phone.trim() && !phoneVerified) {
      toast.error('Verify the new practice phone before saving');
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
        phone: phone.trim() ? digitsOnlyPhone(phone) : undefined,
        email: email.trim().toLowerCase() || undefined,
        timezone: nextTimezone || undefined,
        operatingHours: serializeOperatingHours(hours),
        profileImageUrl: clinic.profileImageUrl || undefined,
      });
      await refresh();
      setEditingProfile(false);
      setLegacyHours(null);
      setEmailOtp('');
      setEmailOtpSent(false);
      setEmailVerified(false);
      setPhoneOtp('');
      setPhoneOtpSent(false);
      setPhoneVerified(false);
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
                disabled={savingProfile}
              />
              {editingProfile && emailChanged && email.trim() && (
                <div className="space-y-2">
                  {emailVerified ? (
                    <p className="text-xs text-green-600">New practice email verified</p>
                  ) : (
                    <>
                      {emailOtpSent && (
                        <div className="flex gap-2">
                          <Input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Email OTP"
                            maxLength={6}
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={savingProfile || otpBusy !== null}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void confirmContactOtp('EMAIL')}
                            disabled={savingProfile || otpBusy !== null || !emailOtp.trim()}
                          >
                            {otpBusy === 'EMAIL' ? 'Verifying…' : 'Verify'}
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void requestContactOtp('EMAIL')}
                        disabled={savingProfile || otpBusy !== null}
                      >
                        {otpBusy === 'EMAIL' ? 'Sending…' : emailOtpSent ? 'Resend email OTP' : 'Verify new email'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={editingProfile ? phone : clinic?.phone ?? ''}
                readOnly={!editingProfile}
                onChange={(e) => setPhone(digitsOnlyPhone(e.target.value))}
                disabled={savingProfile}
              />
              {editingProfile && phoneChanged && phone.trim() && (
                <div className="space-y-2">
                  {phoneVerified ? (
                    <p className="text-xs text-green-600">
                      New practice phone verified via {phoneOtpMethod === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                    </p>
                  ) : (
                    <>
                      {phoneOtpSent && (
                        <div className="flex gap-2">
                          <Input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="WhatsApp OTP"
                            maxLength={6}
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={savingProfile || otpBusy !== null}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void confirmContactOtp('PHONE')}
                            disabled={savingProfile || otpBusy !== null || !phoneOtp.trim()}
                          >
                            {otpBusy === 'PHONE' ? 'Verifying…' : 'Verify WhatsApp OTP'}
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void requestContactOtp('PHONE')}
                        disabled={savingProfile || otpBusy !== null}
                      >
                        <WhatsAppMark className="h-4 w-4 mr-2" />
                        {otpBusy === 'PHONE' ? 'Sending WhatsApp OTP…' : phoneOtpSent ? 'Resend WhatsApp OTP' : 'Send WhatsApp OTP'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void verifyPracticePhoneBySms()}
                        disabled={savingProfile || otpBusy !== null}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {otpBusy === 'PHONE' ? 'Verifying by SMS…' : 'Verify by SMS instead'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-timezone">Time zone</Label>
              <TimeZoneSelect
                value={timezone}
                onChange={setTimezone}
                disabled={!editingProfile || savingProfile}
                readOnly={!editingProfile}
              />
              {editingProfile && (
                <p className="text-xs text-muted-foreground">Search and select an IANA time zone.</p>
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
                disabled={savingProfile || otpBusy !== null}
                onClick={() => {
                  setEmailOtp('');
                  setEmailOtpSent(false);
                  setEmailVerified(false);
                  setPhoneOtp('');
                  setPhoneOtpSent(false);
                  setPhoneVerified(false);
                  setPhoneOtpMethod('WHATSAPP');
                  setEditingProfile(false);
                }}
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
