import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Building2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClinicAddressSearch } from '@/components/clinic/ClinicAddressSearch';
import { AppDispatch } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { createClinic } from '@/services/clinicService';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { EMPTY_CLINIC_ADDRESS, toClinicGeoPayload, type ParsedClinicAddress } from '@/utils/googlePlaces';
import { digitsOnlyPhone, validateEmail, validatePhone } from '@/utils/validation';

export default function ClinicCreateClinic() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { refresh } = useActiveClinic();
  const [loading, setLoading] = useState(false);
  const [clinicAddress, setClinicAddress] = useState<ParsedClinicAddress>(EMPTY_CLINIC_ADDRESS);
  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    phone: '',
    email: '',
    operatingHours: '',
  });

  const set = (key: keyof typeof form, value: string) => setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Clinic name is required.');
      return;
    }
    const phoneErr = validatePhone(form.phone, false);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    if (form.email.trim()) {
      const emailErr = validateEmail(form.email);
      if (emailErr) {
        toast.error(emailErr);
        return;
      }
    }
    setLoading(true);
    try {
      const geoPayload = toClinicGeoPayload(clinicAddress);
      const clinic = await createClinic({
        name: form.name.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
        ...geoPayload,
        phone: form.phone ? digitsOnlyPhone(form.phone) : undefined,
        email: form.email.trim() || undefined,
        operatingHours: form.operatingHours.trim() || undefined,
      });
      dispatch(setActiveClinic(clinic.uuid));
      await refresh();
      toast.success('Clinic created');
      navigate('/clinic');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add a clinic</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a clinic to this account. Clinic details and patient records stay separate when you switch clinics.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Clinic application
          </CardTitle>
          <CardDescription>
            You&apos;ll be the owner of this clinic. Submit its details for verification before using clinic services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Clinic details</h2>
                <p className="text-xs text-muted-foreground mt-1">Enter the clinic&apos;s registered details.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic name *</Label>
                  <Input
                    id="name"
                    autoComplete="organization"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Happy Paws Veterinary"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License number</Label>
                  <Input
                    id="license"
                    value={form.licenseNumber}
                    onChange={(e) => set('licenseNumber', e.target.value)}
                    placeholder="VC-XXXX-XXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <div>
                <h2 className="text-sm font-semibold">Clinic location</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Search for the clinic and select a Google Maps suggestion to save its location.
                </p>
              </div>
              <ClinicAddressSearch
                idPrefix="add-clinic"
                value={clinicAddress}
                onChange={setClinicAddress}
                disabled={loading}
              />
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <div>
                <h2 className="text-sm font-semibold">Clinic contact</h2>
                <p className="text-xs text-muted-foreground mt-1">Optional contact details for this clinic.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (10 digits)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={10}
                      className="pl-9"
                      value={form.phone}
                      onChange={(e) => set('phone', digitsOnlyPhone(e.target.value))}
                      placeholder="9876543210"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Clinic email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="pl-9"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="contact@clinic.com"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <div>
                <h2 className="text-sm font-semibold">Operating hours</h2>
                <p className="text-xs text-muted-foreground mt-1">Add a short summary of when the clinic is open.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Textarea
                  id="hours"
                  rows={3}
                  className="resize-y"
                  value={form.operatingHours}
                  onChange={(e) => set('operatingHours', e.target.value)}
                  placeholder="Mon–Fri 9:00 AM – 7:00 PM"
                  disabled={loading}
                />
              </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" asChild>
                <Link to="/clinic/settings">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Submit clinic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
