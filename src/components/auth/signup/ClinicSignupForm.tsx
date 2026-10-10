import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building2, Mail, Phone, Award, User, Lock, Eye, EyeOff } from 'lucide-react';
import { ClinicAddressSearch } from '@/components/clinic/ClinicAddressSearch';
import { signupClinic, activateRole, confirmActivatedSession } from '@/services/authService';
import { EMPTY_CLINIC_ADDRESS, toClinicGeoPayload, type ParsedClinicAddress } from '@/utils/googlePlaces';
import { sendSignupOtp, verifySignupOtp } from '@/services/doctorVerificationService';
import { CooldownTimer } from '@/components/ui/cooldown-timer';
import { WhatsAppMark } from '@/components/auth/signup/WhatsAppMark';
import { openMsg91OtpWidget } from '@/services/msg91Widget';
import {
  digitsOnlyPhone,
  toE164Phone,
  validateEmail,
  validatePassword,
  validatePhone,
} from '@/utils/validation';
import { apiMessage, duplicateRoleMessage, isAccountExistsMessage, signInToAddRole } from '@/utils/roleActivation';
import { ROLES } from '@/utils/roles';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveRole, validateAndSetUser } from '@/module/slice/AuthSlice';

const OTP_RESEND_COOLDOWN_SECONDS = 30;

const ClinicSignupForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const sessionUser = useSelector((state: RootState) => state.authReducer.user);
  const isAuthenticated = useSelector((state: RootState) => state.authReducer.isAuthenticated);
  const addingRole = Boolean(isAuthenticated && sessionUser?.email);
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
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clinicAddress, setClinicAddress] = useState<ParsedClinicAddress>(EMPTY_CLINIC_ADDRESS);
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

  useEffect(() => {
    if (emailCooldown === 0 && phoneCooldown === 0) return;

    const timer = window.setInterval(() => {
      setEmailCooldown((seconds) => Math.max(0, seconds - 1));
      setPhoneCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  useEffect(() => {
    if (!addingRole || !sessionUser?.email) return;
    setForm((current) => ({
      ...current,
      adminEmail: sessionUser.email,
      adminFirstName: current.adminFirstName || sessionUser.firstName || '',
      adminLastName: current.adminLastName || sessionUser.lastName || '',
    }));
    setEmailVerified(true);
  }, [addingRole, sessionUser?.email, sessionUser?.firstName, sessionUser?.lastName]);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const resumeExistingClinic = async () => {
    const status = await signInToAddRole(form.adminEmail.trim(), form.password, 'CLINIC');
    if (status === 'duplicate') {
      toast.error(duplicateRoleMessage('CLINIC'), { duration: 2500 });
      await dispatch(validateAndSetUser()).unwrap();
      dispatch(setActiveRole(ROLES.CLINIC_ADMIN));
      navigate('/clinic', { replace: true });
      return;
    }
    if (status === 'available') {
      await dispatch(validateAndSetUser()).unwrap();
      setEmailVerified(true);
      toast.success('Signed in. Finish this form to add the clinic role.', { duration: 2500 });
      return;
    }
    toast.info('This email already has an account. Sign in with its password to add the clinic role.', { duration: 2500 });
    navigate('/login', { state: { addRole: 'CLINIC' } });
  };

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
      toast.error(apiMessage(err, 'Failed to send email OTP'));
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
        phone: toE164Phone(form.adminPhone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91'),
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
      const accessToken = await openMsg91OtpWidget(toE164Phone(form.adminPhone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91'));
      await verifySignupOtp({
        channel: 'PHONE',
        phone: toE164Phone(form.adminPhone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91'),
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
        phone: toE164Phone(form.adminPhone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91'),
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
    if (!addingRole && (!emailVerified || !phoneVerified)) {
      toast.error('Verify your email and phone with OTP before submitting');
      return;
    }
    if (addingRole && !phoneVerified) {
      toast.error('Verify your phone with OTP before submitting');
      return;
    }
    if (!addingRole) {
      const passErr = validatePassword(form.password);
      if (passErr) {
        toast.error(passErr);
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
    }
    const phoneErr = validatePhone(form.adminPhone, true);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    setLoading(true);
    try {
      const geoPayload = toClinicGeoPayload(clinicAddress);
      if (addingRole) {
        await activateRole({
          role: 'CLINIC',
          email: form.adminEmail.trim(),
          clinicName: form.clinicName,
          licenseNumber: form.license || undefined,
          address: geoPayload.address,
          phone: form.adminPhone ? digitsOnlyPhone(form.adminPhone) : undefined,
          rolePassword: form.password || undefined,
        });
        const ready = await confirmActivatedSession('CLINIC');
        if (!ready) {
          toast.error('Clinic role was not confirmed. Stay on this page and try again.');
          return;
        }
        dispatch(setActiveRole(ROLES.CLINIC_ADMIN));
        toast.success('Clinic admin role added. Verification is pending.');
        navigate('/clinic', { replace: true });
        return;
      }

      await signupClinic({
        firstName: form.adminFirstName,
        lastName: form.adminLastName,
        email: form.adminEmail.trim(),
        password: form.password,
        clinicName: form.clinicName,
        licenseNumber: form.license || undefined,
        ...geoPayload,
        phone: form.adminPhone ? digitsOnlyPhone(form.adminPhone) : undefined,
      });
      setShowSuccess(true);
      toast.success('Clinic registration submitted');
    } catch (err: unknown) {
      const message = apiMessage(err, 'Clinic signup failed');
      if (isAccountExistsMessage(message)) {
        await resumeExistingClinic();
        return;
      }
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

                  <ClinicAddressSearch
                    idPrefix="signup-clinic"
                    value={clinicAddress}
                    onChange={setClinicAddress}
                    disabled={loading}
                  />

                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-medium mb-3 mt-3">Admin Account</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminFirstName">First Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input id="adminFirstName" name="adminFirstName" autoComplete="given-name" className="pl-10" placeholder="Jane" value={form.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value.replace(/\d/g, ''))} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminLastName">Last Name</Label>
                        <Input id="adminLastName" name="adminLastName" autoComplete="family-name" placeholder="Doe" value={form.adminLastName} onChange={(e) => set('adminLastName', e.target.value.replace(/\d/g, ''))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPhone">Phone (10 digits)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="clinic-country-code"
                            name="countryCode"
                            aria-label="Country code"
                            autoComplete="tel-country-code"
                            inputMode="tel"
                            value={countryCode}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCountryCode(digits ? `+${digits}` : '+');
                              setPhoneVerified(false);
                              setPhoneOtp('');
                              setPhoneOtpMethod('WHATSAPP');
                            }}
                            onBlur={() => {
                              if (!/^\+\d{1,4}$/.test(countryCode)) setCountryCode('+91');
                            }}
                            className="w-16 shrink-0 px-2 text-center"
                          />
                          <Input
                            id="adminPhone"
                            name="adminPhone"
                            type="tel"
                            autoComplete="tel-national"
                            inputMode="numeric"
                            maxLength={10}
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
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            {!phoneVerified && phoneOtpMethod === 'WHATSAPP' && (
                              <Input
                                id="phoneOtp"
                                name="phoneOtp"
                                inputMode="numeric"
                                className="h-9 min-w-0 flex-1"
                                placeholder="OTP code"
                                maxLength={6}
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={sendWhatsAppOtp}
                              disabled={otpSending || phoneVerified || phoneCooldown > 0}
                            >
                              <WhatsAppMark className="h-4 w-4 mr-2 shrink-0" />
                              {otpSending ? 'Sending…' : phoneVerified ? 'Verified' : phoneCooldown > 0 ? <CooldownTimer seconds={phoneCooldown} /> : 'Send OTP'}
                            </Button>
                          </div>
                          {!phoneVerified && phoneOtpMethod === 'WHATSAPP' && (
                            <Button type="button" size="sm" className="w-full" onClick={verifyPhone} disabled={loading || !phoneOtp.trim()}>
                              Verify
                            </Button>
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
                            <Phone className="h-4 w-4 mr-2" />
                            {phoneCooldown > 0 ? `Use phone OTP instead (${phoneCooldown}s)` : 'Use phone OTP instead'}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
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
                            disabled={emailVerified || addingRole}
                          />
                        </div>
                        {addingRole && (
                          <p className="text-xs text-muted-foreground">Email is locked to your signed-in account.</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            {!emailVerified && (
                              <Input
                                id="emailOtp"
                                name="emailOtp"
                                inputMode="numeric"
                                className="h-9 min-w-0 flex-1"
                                placeholder="OTP code"
                                maxLength={6}
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                            )}
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={sendEmailOtp} disabled={otpSending || emailVerified || emailCooldown > 0}>
                              {otpSending ? 'Sending…' : emailVerified ? 'Verified' : emailCooldown > 0 ? <CooldownTimer seconds={emailCooldown} /> : 'Send OTP'}
                            </Button>
                          </div>
                          {!emailVerified && (
                            <Button type="button" size="sm" className="w-full" onClick={verifyEmail} disabled={loading || !emailOtp.trim()}>
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                      {!addingRole && (
                      <>
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
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>About Your Clinic</Label>
                    <Textarea rows={4} placeholder="Tell us about your services and team…" value={form.about} onChange={(e) => set('about', e.target.value)} className="resize-none" />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || (!addingRole && !emailVerified) || !phoneVerified}>
                    <Building2 className="h-4 w-4 mr-2" />
                    {loading ? 'Submitting…' : addingRole ? 'Add clinic admin role' : 'Submit Application'}
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
