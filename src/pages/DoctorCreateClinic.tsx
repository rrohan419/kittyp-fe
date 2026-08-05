import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppDispatch } from '@/module/store/store';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { createClinic } from '@/services/clinicService';
import { digitsOnlyPhone, validatePhone } from '@/utils/validation';

export default function DoctorCreateClinic() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    address: '',
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
    setLoading(true);
    try {
      const clinic = await createClinic({
        name: form.name.trim(),
        licenseNumber: form.licenseNumber || undefined,
        address: form.address || undefined,
        phone: form.phone ? digitsOnlyPhone(form.phone) : undefined,
        email: form.email || undefined,
        operatingHours: form.operatingHours || undefined,
      });
      dispatch(setActiveClinic(clinic.uuid));
      toast.success('Clinic created');
      navigate('/doctor');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Register a Clinic</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a new clinic to your account. Each clinic keeps its own patients and records.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Clinic details
          </CardTitle>
          <CardDescription>You'll be linked as the clinic owner.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Clinic name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Happy Paws Veterinary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License number</Label>
              <Input
                id="license"
                value={form.licenseNumber}
                onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder="VC-2024-1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  className="pl-9"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="123 Pet Street"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (10 digits)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="pl-9"
                    value={form.phone}
                    onChange={(e) => set('phone', digitsOnlyPhone(e.target.value))}
                    placeholder="9876543210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="contact@clinic.com"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Operating hours</Label>
              <Textarea
                id="hours"
                rows={3}
                className="resize-none"
                value={form.operatingHours}
                onChange={(e) => set('operatingHours', e.target.value)}
                placeholder="Mon–Fri 9:00 AM – 7:00 PM"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate('/doctor')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create clinic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
