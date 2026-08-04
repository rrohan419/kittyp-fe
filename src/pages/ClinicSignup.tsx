import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building2, Mail, Phone, MapPin, Award, User, Lock } from 'lucide-react';
import { signupClinic } from '@/services/authService';

const ClinicSignup = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clinicName: '',
    license: '',
    address: '',
    city: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    about: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicName || !form.adminEmail || !form.password || !form.adminFirstName) {
      toast.error('Please fill in required fields.');
      return;
    }
    setLoading(true);
    try {
      const address = [form.address, form.city].filter(Boolean).join(', ');
      await signupClinic({
        firstName: form.adminFirstName,
        lastName: form.adminLastName,
        email: form.adminEmail,
        password: form.password,
        clinicName: form.clinicName,
        licenseNumber: form.license || undefined,
        address: address || undefined,
        phone: form.adminPhone || undefined,
      });
      setShowSuccess(true);
      toast.success('Clinic registration submitted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Clinic signup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Register Your Clinic</h1>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Bring your veterinary practice onto kittyp — manage doctors, appointments, and patients in one place.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Clinic Application</CardTitle>
                <CardDescription>Create your clinic admin account. Verification follows within 2 business days.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Clinic Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Happy Paws Clinic" value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="VC-XXXX-XXXX" value={form.license} onChange={(e) => set('license', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Street Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="123 Pet Street" value={form.address} onChange={(e) => set('address', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium mb-3 mt-3">Admin Account</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Jane" value={form.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input placeholder="Doe" value={form.adminLastName} onChange={(e) => set('adminLastName', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" className="pl-10" placeholder="+91 555-0100" value={form.adminPhone} onChange={(e) => set('adminPhone', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="email" className="pl-10" placeholder="admin@clinic.com" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type="password" className="pl-10" placeholder="Min 6 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>About Your Clinic</Label>
                    <Textarea rows={4} placeholder="Tell us about your services and team…" value={form.about} onChange={(e) => set('about', e.target.value)} className="resize-none" />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <Building2 className="h-4 w-4 mr-2" />
                    {loading ? 'Submitting…' : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Already registered?{' '}
                  <Link to="/login" className="text-primary hover:text-primary/80 font-medium">Sign in</Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Application Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your clinic admin account is ready. Sign in to open the clinic portal while verification completes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setShowSuccess(false); navigate('/'); }}>Back Home</Button>
            <Button onClick={() => { setShowSuccess(false); navigate('/login'); }}>Sign in</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ClinicSignup;
