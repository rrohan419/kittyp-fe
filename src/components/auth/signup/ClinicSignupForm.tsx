import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building2, Mail, Phone, Award, User, Lock, Eye, EyeOffIcon } from 'lucide-react';
import { signupClinic } from '@/services/authService';
import { ClinicAddressSearch } from '@/components/clinic/ClinicAddressSearch';
import { EMPTY_CLINIC_ADDRESS, toClinicGeoPayload } from '@/utils/googlePlaces';
import { sendSignupOtp, verifySignupOtp } from '@/services/doctorVerificationService';
import { otpSendButtonLabel, useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import {
  digitsOnlyPhone,
  EMAIL_ALREADY_REGISTERED,
  isEmailAlreadyRegistered,
  isOtpFailed,
  OTP_FAILED_MESSAGE,
  validateClinicName,
  validateEmail,
  validatePassword,
  validatePersonName,
  validatePhone,
} from '@/utils/validation';

const ClinicSignupForm = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const emailResend = useOtpResendCooldown();
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [form, setForm] = useState({
    clinicName: '',
    license: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: '',
    about: '',
  });
  const [clinicAddress, setClinicAddress] = useState(EMPTY_CLINIC_ADDRESS);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const sendEmailOtp = async () => {
    const emailErr = validateEmail(form.adminEmail);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    setOtpSending(true);
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: form.adminEmail.trim(), role: 'CLINIC' });
      emailResend.start();
      toast.success('OTP sent to your email');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email OTP';
      if (isEmailAlreadyRegistered(message)) {
        setEmailError(EMAIL_ALREADY_REGISTERED);
      } else {
        toast.error(message);
      }
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
      setOtpError('');
      emailResend.reset();
      toast.success('Email verified');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email OTP';
      setOtpError(isOtpFailed(message) ? OTP_FAILED_MESSAGE : message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clinicErr = validateClinicName(form.clinicName);
    if (clinicErr) {
      toast.error(clinicErr);
      return;
    }
    const firstErr = validatePersonName(form.adminFirstName, 'First name');
    if (firstErr) {
      toast.error(firstErr);
      return;
    }
    const lastErr = validatePersonName(form.adminLastName, 'Last name', false);
    if (lastErr) {
      toast.error(lastErr);
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
      const geo = toClinicGeoPayload(clinicAddress);
      await signupClinic({
        firstName: form.adminFirstName,
        lastName: form.adminLastName,
        email: form.adminEmail.trim(),
        password: form.password,
        clinicName: form.clinicName,
        licenseNumber: form.license || undefined,
        address: geo.address,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
        phone: form.adminPhone ? digitsOnlyPhone(form.adminPhone) : undefined,
      });
      setShowSuccess(true);
      toast.success('Clinic registration submitted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Clinic signup failed';
      if (isEmailAlreadyRegistered(message)) {
        setEmailError(EMAIL_ALREADY_REGISTERED);
      } else {
        toast.error(message);
      }
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

                  <ClinicAddressSearch
                    idPrefix="signup-clinic"
                    value={clinicAddress}
                    onChange={setClinicAddress}
                    disabled={loading}
                    publicApi
                  />

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
                            onChange={(e) => set('adminPhone', digitsOnlyPhone(e.target.value))}
                          />
                        </div>
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
                              setEmailError('');
                              emailResend.reset();
                              set('adminEmail', e.target.value);
                            }}
                            required
                            disabled={emailVerified}
                          />
                        </div>
                        {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={emailResend.coolingDown ? 'bg-muted text-muted-foreground' : undefined}
                            onClick={sendEmailOtp}
                            disabled={otpSending || emailVerified || emailResend.coolingDown}
                          >
                            {otpSendButtonLabel(
                              otpSending,
                              emailResend.remaining,
                              emailVerified ? 'Verified' : 'Send OTP'
                            )}
                          </Button>
                          {!emailVerified && (
                            <>
                              <Input
                                id="emailOtp"
                                name="emailOtp"
                                className="max-w-[140px] h-9"
                                placeholder="OTP code"
                                value={emailOtp}
                                onChange={(e) => {
                                  setEmailOtp(e.target.value);
                                  setOtpError('');
                                }}
                              />
                              <Button type="button" size="sm" onClick={verifyEmail} disabled={loading || emailOtp.trim().length !== 6}>
                                Verify
                              </Button>
                            </>
                          )}
                        </div>
                        {otpError ? <p className="text-sm text-destructive">{otpError}</p> : null}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            placeholder="8+ chars, upper, lower, number, special"
                            value={form.password}
                            onChange={(e) => set('password', e.target.value)}
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
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
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="pl-10 pr-10"
                            placeholder="Re-enter password"
                            value={form.confirmPassword}
                            onChange={(e) => set('confirmPassword', e.target.value)}
                            required
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
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
