import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, Plus, Power, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { shutdownClinic, reopenClinic, updateClinic } from '@/services/clinicService';
import {
  fetchClinicWhatsAppSettings,
  updateClinicWhatsAppSettings,
} from '@/services/invoiceService';
import { WhatsAppSettingsForm } from '@/components/whatsapp/WhatsAppSettingsForm';
import { Link } from 'react-router-dom';
import { RootState } from '@/module/store/store';
import { ROLES, hasAnyRole, hasRole } from '@/utils/roles';
import { CopyableId } from '@/components/ui/CopyableId';

export default function ClinicSettings() {
  const { user } = useSelector((state: RootState) => state.authReducer);
  const canManageWhatsApp = hasRole(user?.roles, ROLES.CLINIC_ADMIN);
  const canManageLocation = hasAnyRole(user?.roles, [ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF, ROLES.DOCTOR]);
  const { clinic, clinicUuid, refresh } = useActiveClinic();
  const [acting, setActing] = useState(false);
  const [waConfigured, setWaConfigured] = useState(false);
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');
  const isShutdown = clinic?.status === 'SHUTDOWN';

  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    setCity(clinic?.city ?? '');
    setLatitude(clinic?.latitude != null ? String(clinic.latitude) : '');
    setLongitude(clinic?.longitude != null ? String(clinic.longitude) : '');
  }, [clinic?.city, clinic?.latitude, clinic?.longitude, clinic?.uuid]);

  useEffect(() => {
    if (!clinicUuid || !canManageWhatsApp) {
      setWaConfigured(false);
      setWaPhoneId('');
      setWaBusinessId('');
      return;
    }
    void fetchClinicWhatsAppSettings(clinicUuid)
      .then((wa) => {
        setWaConfigured(!!wa.whatsappConfigured);
        setWaPhoneId(wa.phoneNumberId || '');
        setWaBusinessId(wa.businessAccountId || '');
      })
      .catch(() => {
        setWaConfigured(!!clinic?.whatsappConfigured);
        setWaPhoneId('');
        setWaBusinessId('');
      });
  }, [clinicUuid, clinic?.whatsappConfigured, canManageWhatsApp]);

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

  const fillFromBrowser = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        toast.success('Coordinates filled from your device');
      },
      () => toast.error('Could not read device location')
    );
  };

  const saveLocation = async () => {
    if (!clinicUuid || !clinic) return;
    const lat = latitude.trim() === '' ? null : Number(latitude);
    const lng = longitude.trim() === '' ? null : Number(longitude);
    if ((lat != null && !Number.isFinite(lat)) || (lng != null && !Number.isFinite(lng))) {
      toast.error('Latitude and longitude must be numbers');
      return;
    }
    setSavingLocation(true);
    try {
      await updateClinic(clinicUuid, {
        name: clinic.name,
        licenseNumber: clinic.licenseNumber,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        timezone: clinic.timezone,
        operatingHours: clinic.operatingHours,
        city: city.trim() || undefined,
        latitude: lat,
        longitude: lng,
        profileImageUrl: clinic.profileImageUrl || undefined,
      });
      await refresh();
      toast.success('Clinic location saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save location');
    } finally {
      setSavingLocation(false);
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
            label="Account ID"
            value={user?.uuid}
            hint="Sign in with this ID or your email."
          />
          <CopyableId
            label="Clinic ID"
            value={clinic?.uuid}
            hint="Clinic owner can sign in with this ID or Account ID."
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
        <CardHeader>
          <CardTitle className="text-base">Practice Profile</CardTitle>
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
              <Input value={clinic?.name ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={clinic?.licenseNumber ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Practice type</Label>
              <Input value={clinic?.practiceType ?? '—'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>kittyp Practice ID</Label>
              <Input value={clinic?.kittypPracticeId ?? '—'} readOnly />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Organization UUID</Label>
              <Input value={clinic?.organizationUuid ?? '—'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={clinic?.email ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={clinic?.phone ?? ''} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={clinic?.address ?? ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Operating Hours</Label>
            <Textarea rows={4} value={clinic?.operatingHours ?? ''} readOnly className="resize-none" />
          </div>
          <p className={`text-xs ${isShutdown ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>
            Status: {clinic?.status ?? '—'}
          </p>
        </CardContent>
      </Card>

      {canManageLocation && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location for nearby search
            </CardTitle>
            <CardDescription>
              City helps area search; latitude/longitude enable distance ranking for pet parents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>City / area</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                disabled={isShutdown}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="18.5204"
                  disabled={isShutdown}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="73.8567"
                  disabled={isShutdown}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={fillFromBrowser} disabled={isShutdown}>
                Use my device location
              </Button>
              <Button type="button" onClick={() => void saveLocation()} disabled={isShutdown || savingLocation}>
                {savingLocation ? 'Saving…' : 'Save location'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageWhatsApp && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">WhatsApp number</CardTitle>
            <CardDescription>
              One practice number for all doctors at this branch — invoices and receipts send from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <WhatsAppSettingsForm
              configured={waConfigured}
              phoneNumberIdInitial={waPhoneId}
              businessAccountIdInitial={waBusinessId}
              helperText="Enter only the Meta values from this practice’s WhatsApp Business account."
              onSave={async (values) => {
                if (!clinicUuid) throw new Error('No clinic');
                const res = await updateClinicWhatsAppSettings(clinicUuid, values);
                setWaConfigured(!!res.whatsappConfigured);
                setWaPhoneId(res.phoneNumberId || '');
                setWaBusinessId(res.businessAccountId || '');
                await refresh();
              }}
            />
          </CardContent>
        </Card>
      )}

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
