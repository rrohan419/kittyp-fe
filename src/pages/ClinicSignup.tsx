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
import { sendSignupOtp, verifySignupOtp } from '@/services/doctorVerificationService';
import {
  digitsOnlyPhone,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/utils/validation';

const ClinicSignup = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
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
    confirmPassword: '',
    about: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const sendEmailOtp = async () => {
    const emailErr = validateEmail(form.adminEmail);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    setOtpSending(true);
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: form.adminEmail.trim() });
      toast.success('OTP sent to your email');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyEmail = async () => {
    if (!emailOtp.trim()) {
      toast.error('Enter the email OTP');
      return;
    }
    setLoading(true);
    try {
      await verifySignupOtp({ channel: 'EMAIL', email: form.adminEmail.trim(), code: emailOtp.trim() });
      setEmailVerified(true);
      toast.success('Email verified');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid email OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinicName || !form.adminFirstName) {
      toast.error('Please fill in required fields.');
      return;
    }
    const emailErr = validateEmail(form.adminEmail);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    if (!emailVerified) {
      toast.error('Verify your email with OTP before submitting');
      return;
    }
    const passErr = validatePassword(form.password);
    if (passErr) {
      toast.error(passErr);
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    const phoneErr = validatePhone(form.adminPhone, false);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    setLoading(true);
    try {
      const address = [form.address, form.city].filter(Boolean).join(', ');
      await signupClinic({
        firstName: form.adminFirstName,
        lastName: form.adminLastName,
        email: form.adminEmail.trim(),
        password: form.password,
        clinicName: form.clinicName,
        licenseNumber: form.license || undefined,
        address: address || undefined,
        phone: form.adminPhone ? digitsOnlyPhone(form.adminPhone) : undefined,
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
                <CardDescription>
                  Verify your admin email, then create your clinic account.
                </CardDescription>
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
                        <Label>Phone (10 digits)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            className="pl-10"
                            placeholder="9876543210"
                            value={form.adminPhone}
                            onChange={(e) => set('adminPhone', digitsOnlyPhone(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            className="pl-10"
                            placeholder="admin@clinic.com"
                            value={form.adminEmail}
                            onChange={(e) => {
                              setEmailVerified(false);
                              setEmailOtp('');
                              set('adminEmail', e.target.value);
                            }}
                            required
                            disabled={emailVerified}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button type="button" variant="outline" size="sm" onClick={sendEmailOtp} disabled={otpSending || emailVerified}>
                            {otpSending ? 'Sending…' : emailVerified ? 'Verified' : 'Send OTP'}
                          </Button>
                          {!emailVerified && (
                            <>
                              <Input
                                className="max-w-[140px] h-9"
                                placeholder="OTP code"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value)}
                              />
                              <Button type="button" size="sm" onClick={verifyEmail} disabled={loading || !emailOtp.trim()}>
                                Verify
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            className="pl-10"
                            placeholder="8+ chars, upper, lower, number, special"
                            value={form.password}
                            onChange={(e) => set('password', e.target.value)}
                            required
                            minLength={8}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Must be 8–72 characters with uppercase, lowercase, a number, and a special character.
                        </p>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            className="pl-10"
                            placeholder="Re-enter password"
                            value={form.confirmPassword}
                            onChange={(e) => set('confirmPassword', e.target.value)}
                            required
                            minLength={8}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>About Your Clinic</Label>
                    <Textarea rows={4} placeholder="Tell us about your services and team…" value={form.about} onChange={(e) => set('about', e.target.value)} className="resize-none" />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !emailVerified}>
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
            <Button onClick={() => { setShowSuccess(false); navigate('/login?redirect=/clinic'); }}>Sign in</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ClinicSignup;
