import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { CooldownTimer } from '@/components/ui/cooldown-timer';
import { openMsg91OtpWidget } from '@/services/msg91Widget';
import {
  digitsOnlyPhone,
  toE164Phone,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/utils/validation';

const OTP_RESEND_COOLDOWN_SECONDS = 30;

const ClinicSignupForm = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpMethod, setPhoneOtpMethod] = useState<'WHATSAPP' | 'PHONE'>('WHATSAPP');
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

  useEffect(() => {
    if (emailCooldown === 0 && phoneCooldown === 0) return;

    const timer = window.setInterval(() => {
      setEmailCooldown((seconds) => Math.max(0, seconds - 1));
      setPhoneCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const sendEmailOtp = async () => {
    if (emailCooldown > 0) return;
    const emailErr = validateEmail(form.adminEmail);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    setOtpSending(true);
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: form.adminEmail.trim() });
      setEmailCooldown(OTP_RESEND_COOLDOWN_SECONDS);
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

  const sendWhatsAppOtp = async () => {
    if (phoneCooldown > 0) return;
    setOtpSending(true);
    try {
      await sendSignupOtp({
        channel: 'WHATSAPP',
        phone: toE164Phone(form.adminPhone),
        email: form.adminEmail.trim(),
      });
      setPhoneCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setPhoneOtpMethod('WHATSAPP');
      toast.success('OTP sent to your WhatsApp number');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send phone OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const usePhoneOtpFallback = async () => {
    if (phoneCooldown > 0) return;
    setOtpSending(true);
    try {
      const accessToken = await openMsg91OtpWidget(toE164Phone(form.adminPhone));
      await verifySignupOtp({
        channel: 'PHONE',
        phone: toE164Phone(form.adminPhone),
        email: form.adminEmail.trim(),
        accessToken,
      });
      setPhoneCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setPhoneOtpMethod('PHONE');
      setPhoneVerified(true);
      toast.success('Phone verified');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify phone with MSG91');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyPhone = async () => {
    if (!phoneOtp.trim()) {
      toast.error('Enter the WhatsApp OTP');
      return;
    }
    setLoading(true);
    try {
      await verifySignupOtp({
        channel: 'WHATSAPP',
        phone: toE164Phone(form.adminPhone),
        email: form.adminEmail.trim(),
        code: phoneOtp.trim(),
      });
      setPhoneVerified(true);
      toast.success('Phone verified');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid phone OTP');
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
    if (!emailVerified || !phoneVerified) {
      toast.error('Verify your email and phone with OTP before submitting');
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
    const phoneErr = validatePhone(form.adminPhone, true);
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
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Register Your Clinic</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Register the hospital as its own account, then invite doctors. Clinic verification is
          separate from individual doctor credentials.
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
                <form method="post" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="clinicName" name="clinicName" autoComplete="organization" className="pl-10" placeholder="Happy Paws Clinic" value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <div className="relative">
                        <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="license" name="license" className="pl-10" placeholder="VC-XXXX-XXXX" value={form.license} onChange={(e) => set('license', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="address" name="address" autoComplete="street-address" className="pl-10" placeholder="123 Pet Street" value={form.address} onChange={(e) => set('address', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" autoComplete="address-level2" placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium mb-3 mt-3">Admin Account</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminFirstName">First Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="adminFirstName" name="adminFirstName" autoComplete="given-name" className="pl-10" placeholder="Jane" value={form.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value)} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminLastName">Last Name</Label>
                        <Input id="adminLastName" name="adminLastName" autoComplete="family-name" placeholder="Doe" value={form.adminLastName} onChange={(e) => set('adminLastName', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPhone">Phone (10 digits)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="adminPhone"
                            name="adminPhone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            className="pl-10"
                            placeholder="9876543210"
                            value={form.adminPhone}
                              onChange={(e) => {
                                setPhoneVerified(false);
                                setPhoneOtp('');
                                setPhoneOtpMethod('WHATSAPP');
                                set('adminPhone', digitsOnlyPhone(e.target.value));
                              }}
                              required
                          />
                        </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={sendWhatsAppOtp}
                              disabled={otpSending || phoneVerified || phoneCooldown > 0}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              {otpSending ? 'Sending…' : phoneVerified ? 'Verified' : phoneCooldown > 0 ? <CooldownTimer seconds={phoneCooldown} /> : 'Send WhatsApp OTP'}
                            </Button>
                            {!phoneVerified && phoneOtpMethod === 'WHATSAPP' && (
                              <>
                                <Input
                                  id="phoneOtp"
                                  name="phoneOtp"
                                  inputMode="numeric"
                                  className="max-w-[140px] h-9"
                                  placeholder="OTP code"
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value)}
                                />
                                <Button type="button" size="sm" onClick={verifyPhone} disabled={loading || !phoneOtp.trim()}>
                                  Verify
                                </Button>
                              </>
                            )}
                          </div>
                          {!phoneVerified && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="px-0"
                              onClick={usePhoneOtpFallback}
                              disabled={otpSending || phoneCooldown > 0}
                            >
                              {phoneCooldown > 0 ? `Use phone OTP instead (${phoneCooldown}s)` : 'Use phone OTP instead'}
                            </Button>
                          )}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="adminEmail">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="adminEmail"
                            name="email"
                            type="email"
                            autoComplete="email"
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
                          <Button type="button" variant="outline" size="sm" onClick={sendEmailOtp} disabled={otpSending || emailVerified || emailCooldown > 0}>
                            {otpSending ? 'Sending…' : emailVerified ? 'Verified' : emailCooldown > 0 ? <CooldownTimer seconds={emailCooldown} /> : 'Send OTP'}
                          </Button>
                          {!emailVerified && (
                            <>
                              <Input
                                id="emailOtp"
                                name="emailOtp"
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
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
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
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
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

                  <Button type="submit" className="w-full" disabled={loading || !emailVerified || !phoneVerified}>
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
    </>
  );
};

export default ClinicSignupForm;
