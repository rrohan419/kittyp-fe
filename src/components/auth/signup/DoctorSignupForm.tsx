import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchInviteByToken } from '@/services/clinicService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Stethoscope,
  Mail,
  Lock,
  User,
  Building2,
  Award,
  Clock,
  Upload,
  Phone,
  FileCheck,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { signupDoctor, activateRole, confirmActivatedSession } from '@/services/authService';
import { sendSignupOtp, verifySignupOtp, DOCTOR_STATUS_STEPS, statusLabel } from '@/services/doctorVerificationService';
import { openMsg91OtpWidget } from '@/services/msg91Widget';
import { uploadSignupDocuments } from '@/services/fileUploadService';
import ErrorDialog from '@/components/ui/error-dialog';
import { CooldownTimer } from '@/components/ui/cooldown-timer';
import { WhatsAppMark } from '@/components/auth/signup/WhatsAppMark';
import { digitsOnlyPhone, toE164Phone, validateEmail, validatePassword, validatePhone } from '@/utils/validation';
import { apiMessage, duplicateRoleMessage, isAccountExistsMessage, signInToAddRole } from '@/utils/roleActivation';
import { ROLES } from '@/utils/roles';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { setActiveRole, validateAndSetUser } from '@/module/slice/AuthSlice';

/** Value must match backend DoctorSpecialization enum names. */
const specializations = [
  { value: 'GENERAL_VETERINARY_MEDICINE', label: 'General Veterinary Medicine' },
  { value: 'SURGERY', label: 'Surgery' },
  { value: 'DERMATOLOGY', label: 'Dermatology' },
  { value: 'DENTISTRY', label: 'Dentistry' },
  { value: 'INTERNAL_MEDICINE', label: 'Internal Medicine' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'ONCOLOGY', label: 'Oncology' },
  { value: 'OPHTHALMOLOGY', label: 'Ophthalmology' },
  { value: 'NUROLOGY', label: 'Neurology' },
  { value: 'EMERGENCY_AND_CRITICAL_CARE', label: 'Emergency & Critical Care' },
  { value: 'BEHAVIOUR', label: 'Behavior' },
  { value: 'NUTRITION', label: 'Nutrition' },
  { value: 'EXOTIC_ANIMAL_MEDICINE', label: 'Exotic Animal Medicine' },
] as const;

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Documents' },
] as const;

const OTP_RESEND_COOLDOWN_SECONDS = 30;

const DoctorSignupForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const sessionUser = useSelector((state: RootState) => state.authReducer.user);
  const isAuthenticated = useSelector((state: RootState) => state.authReducer.isAuthenticated);
  const addingRole = Boolean(isAuthenticated && sessionUser?.email);
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') || '';
  const [step, setStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpMethod, setPhoneOtpMethod] = useState<'WHATSAPP' | 'PHONE'>('WHATSAPP');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [specialization, setSpecialization] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [bio, setBio] = useState('');
  const [invitedClinicName, setInvitedClinicName] = useState('');

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      try {
        const preview = await fetchInviteByToken(inviteToken);
        if (cancelled) return;
        if (preview.expired || preview.accepted) {
          toast.error('This clinic invite is no longer valid');
          return;
        }
        setEmail(preview.email);
        setInvitedClinicName(preview.clinicName);
        if (preview.doctorName) {
          const parts = preview.doctorName.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
          if (parts[0]) setFirstName(parts[0]);
          if (parts.length > 1) setLastName(parts.slice(1).join(' '));
        }
      } catch {
        toast.error('Could not load clinic invite');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  useEffect(() => {
    if (!addingRole || !sessionUser?.email) return;
    setEmail(sessionUser.email);
    if (sessionUser.firstName) setFirstName(sessionUser.firstName);
    if (sessionUser.lastName) setLastName(sessionUser.lastName);
    setEmailVerified(true);
  }, [addingRole, sessionUser?.email, sessionUser?.firstName, sessionUser?.lastName]);

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [registrationCertFile, setRegistrationCertFile] = useState<File | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (emailCooldown === 0 && phoneCooldown === 0) return;

    const timer = window.setInterval(() => {
      setEmailCooldown((seconds) => Math.max(0, seconds - 1));
      setPhoneCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingRole) {
      if (password !== confirmPassword) {
        toast.error("Passwords don't match");
        return;
      }
      const passErr = validatePassword(password);
      if (passErr) {
        toast.warning(passErr);
        return;
      }
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      toast.error(emailErr);
      return;
    }
    const phoneErr = validatePhone(phone, true);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    setStep(addingRole ? 3 : 2);
  };

  const resumeExistingDoctor = async () => {
    const status = await signInToAddRole(email.trim(), password, 'DOCTOR');
    if (status === 'duplicate') {
      toast.error(duplicateRoleMessage('DOCTOR'), { duration: 2500 });
      await dispatch(validateAndSetUser()).unwrap();
      dispatch(setActiveRole(ROLES.DOCTOR));
      navigate('/doctor', { replace: true });
      return;
    }
    if (status === 'available') {
      await dispatch(validateAndSetUser()).unwrap();
      setEmailVerified(true);
      setStep(3);
      toast.success('Signed in. Finish this form to add the doctor role.', { duration: 2500 });
      return;
    }
    toast.info('This email already has an account. Sign in with its password to add the doctor role.', { duration: 2500 });
    navigate('/login', { state: { addRole: 'DOCTOR' } });
  };

  const sendEmailOtp = async () => {
    if (emailCooldown > 0) return;
    setOtpSending(true);
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: email.trim() });
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
      await verifySignupOtp({ channel: 'EMAIL', email: email.trim(), code: emailOtp.trim() });
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
      const fullPhone = toE164Phone(phone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91');
      await sendSignupOtp({
        channel: 'WHATSAPP',
        phone: fullPhone,
        email: email.trim(),
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
      const fullPhone = toE164Phone(phone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91');
      const accessToken = await openMsg91OtpWidget(fullPhone);
      await verifySignupOtp({
        channel: 'PHONE',
        phone: fullPhone,
        email: email.trim(),
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
      const fullPhone = toE164Phone(phone, /^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91');
      await verifySignupOtp({
        channel: 'WHATSAPP',
        phone: fullPhone,
        email: email.trim(),
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
    if (!emailVerified || !phoneVerified) {
      toast.error('Complete email and phone OTP verification first');
      return;
    }
    if (!specialization) {
      toast.error('Specialization is required');
      return;
    }
    if (!registrationNumber.trim()) {
      toast.error('Veterinary registration number is required');
      return;
    }
    if (!degreeFile || !registrationCertFile) {
      toast.error('Degree and registration certificate uploads are required');
      return;
    }

    setLoading(true);
    try {
      const [degreeCertificateUrl] = await uploadSignupDocuments([degreeFile], email.trim());
      const [registrationCertificateUrl] = await uploadSignupDocuments(
        [registrationCertFile],
        email.trim()
      );
      let governmentIdUrl: string | undefined;
      if (governmentIdFile) {
        [governmentIdUrl] = await uploadSignupDocuments([governmentIdFile], email.trim());
      }

      if (addingRole) {
        await activateRole({
          role: 'DOCTOR',
          email: email.trim(),
          phoneNumber: digitsOnlyPhone(phone),
          registrationNumber: registrationNumber.trim(),
          licenseNumber: registrationNumber.trim(),
          specialization,
          experience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
          professionalSummary: bio.trim() || undefined,
          degreeCertificateUrl,
          registrationCertificateUrl,
          governmentIdUrl,
          inviteToken: inviteToken || undefined,
          rolePassword: password || undefined,
        });
        const ready = await confirmActivatedSession('DOCTOR');
        if (!ready) {
          toast.error('Doctor role was not confirmed. Stay on this page and try again.');
          return;
        }
        dispatch(setActiveRole(ROLES.DOCTOR));
        toast.success('Doctor role added. Verification is pending.');
        navigate('/doctor', { replace: true });
        return;
      }

      await signupDoctor({
        firstName,
        lastName,
        email: email.trim(),
        password,
        phoneNumber: digitsOnlyPhone(phone),
        registrationNumber: registrationNumber.trim(),
        licenseNumber: registrationNumber.trim(),
        specialization,
        experience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        professionalSummary: bio.trim() || undefined,
        degreeCertificateUrl,
        registrationCertificateUrl,
        governmentIdUrl,
        inviteToken: inviteToken || undefined,
      });

      setShowSuccessDialog(true);
      toast.success('Documents submitted for review');
    } catch (error: unknown) {
      const message = apiMessage(error, 'Signup failed');
      if (isAccountExistsMessage(message)) {
        await resumeExistingDoctor();
        return;
      }
      toast.error(message);
      setErrorMessage(message);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Join as a Veterinarian
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          {inviteToken && invitedClinicName
            ? `Joining ${invitedClinicName} via invitation. This is your personal doctor account — you only verify your own credentials.`
            : 'Create a personal doctor account for online consultations. Clinics register and verify separately.'}
        </p>
      </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      step >= s.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px]">
                      {s.id}
                    </span>
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-4 h-px bg-border hidden sm:block" />}
                </div>
              ))}
            </div>

            <Card>
              {step === 1 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Account Details</CardTitle>
                    <CardDescription>Create your login credentials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form method="post" onSubmit={handleStep1} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              name="firstName"
                              autoComplete="given-name"
                              placeholder="John"
                              className="pl-10"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value.replace(/\d/g, ''))}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              name="lastName"
                              autoComplete="family-name"
                              placeholder="Doe"
                              className="pl-10"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value.replace(/\d/g, ''))}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              placeholder="doctor@example.com"
                              className="pl-10"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailVerified(false);
                                setEmailOtp('');
                              }}
                              required
                              readOnly={!!inviteToken || addingRole}
                            />
                          </div>
                          {(inviteToken || addingRole) && (
                            <p className="text-xs text-muted-foreground">
                              {addingRole
                                ? 'Email is locked to your signed-in account.'
                                : 'Email is locked to the invitation.'}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="country-code"
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
                              id="phone"
                              name="phone"
                              type="tel"
                              autoComplete="tel-national"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="10-digit phone"
                              value={phone}
                              onChange={(e) => {
                                setPhone(digitsOnlyPhone(e.target.value));
                                setPhoneVerified(false);
                                setPhoneOtp('');
                                setPhoneOtpMethod('WHATSAPP');
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {!addingRole && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
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
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="pl-10 pr-10"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
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
                      </div>
                      )}

                      <Button type="submit" className="w-full">
                        {addingRole ? 'Continue to phone verification' : 'Continue to Email OTP'}
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Verify email and phone</CardTitle>
                    <CardDescription>
                      WhatsApp is the primary phone check. Phone OTP is the fallback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email
                          </p>
                          <p className="text-xs text-muted-foreground break-all">{email}</p>
                        </div>
                        {!emailVerified ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                id="emailOtp"
                                inputMode="numeric"
                                placeholder="OTP code"
                                maxLength={6}
                                className="min-w-0 flex-1"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0"
                                onClick={sendEmailOtp}
                                disabled={otpSending || emailCooldown > 0}
                              >
                                {otpSending ? 'Sending…' : emailCooldown > 0 ? (
                                  <CooldownTimer seconds={emailCooldown} />
                                ) : 'Send OTP'}
                              </Button>
                            </div>
                            <Button type="button" className="w-full" disabled={loading || !emailOtp.trim()} onClick={() => void verifyEmail()}>
                              {loading ? 'Verifying…' : 'Verify'}
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" className="w-full" disabled>
                            Verified
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 rounded-lg border p-4">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Phone
                          </p>
                          <p className="text-xs text-muted-foreground">{/^\+\d{1,4}$/.test(countryCode) ? countryCode : '+91'} {phone}</p>
                        </div>
                        {!phoneVerified && phoneOtpMethod === 'WHATSAPP' ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                id="phoneOtp"
                                inputMode="numeric"
                                placeholder="OTP code"
                                maxLength={6}
                                className="min-w-0 flex-1"
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="shrink-0"
                                onClick={sendWhatsAppOtp}
                                disabled={otpSending || phoneCooldown > 0}
                              >
                                <WhatsAppMark className="h-4 w-4 mr-2 shrink-0" />
                                {otpSending ? 'Sending…' : phoneCooldown > 0 ? (
                                  <CooldownTimer seconds={phoneCooldown} />
                                ) : 'Send OTP'}
                              </Button>
                            </div>
                            <Button type="button" className="w-full" disabled={loading || !phoneOtp.trim()} onClick={() => void verifyPhone()}>
                              {loading ? 'Verifying…' : 'Verify'}
                            </Button>
                          </div>
                        ) : phoneVerified ? (
                          <Button type="button" variant="outline" className="w-full" disabled>
                            Verified
                          </Button>
                        ) : null}
                        {!phoneVerified && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={usePhoneOtpFallback}
                            disabled={otpSending || phoneCooldown > 0}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {phoneCooldown > 0 ? `Use phone OTP instead (${phoneCooldown}s)` : 'Use phone OTP instead'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={!emailVerified || !phoneVerified}
                        onClick={() => setStep(3)}
                      >
                        Continue to Documents
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Professional Documents</CardTitle>
                    <CardDescription>
                      Upload your veterinary credentials. Admin reviews your documents only — clinic
                      address and clinic photos are not part of doctor verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Specialization</Label>
                          <Select value={specialization} onValueChange={setSpecialization}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                            <SelectContent>
                              {specializations.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registrationNumber">Veterinary Registration Number *</Label>
                          <div className="relative">
                            <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="registrationNumber"
                              placeholder="Council / registration no."
                              className="pl-10"
                              value={registrationNumber}
                              onChange={(e) => setRegistrationNumber(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {inviteToken && invitedClinicName && (
                        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                          <p className="font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            Joining {invitedClinicName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You will be affiliated with this clinic after signup. The clinic is verified
                            separately; you only submit your own documents here.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="60"
                            placeholder="5"
                            className="pl-10"
                            value={yearsOfExperience}
                            onChange={(e) => setYearsOfExperience(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Experience, approach, and areas of expertise..."
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-3 rounded-lg border border-border p-4">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-primary" />
                          Required documents
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="degree">Degree certificate *</Label>
                          <Input
                            id="degree"
                            type="file"
                            accept="image/*,.pdf"
                            className="cursor-pointer file:cursor-pointer"
                            onChange={(e) => setDegreeFile(e.target.files?.[0] ?? null)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="regCert">Registration certificate *</Label>
                          <Input
                            id="regCert"
                            type="file"
                            accept="image/*,.pdf"
                            className="cursor-pointer file:cursor-pointer"
                            onChange={(e) => setRegistrationCertFile(e.target.files?.[0] ?? null)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="govId">Government ID (recommended)</Label>
                          <Input
                            id="govId"
                            type="file"
                            accept="image/*,.pdf"
                            className="cursor-pointer file:cursor-pointer"
                            onChange={(e) => setGovernmentIdFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(2)}
                          className="flex-1"
                          disabled={loading}
                        >
                          Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {loading ? 'Submitting…' : 'Submit for Review'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Documents Submitted</DialogTitle>
            <DialogDescription className="text-center">
              Your personal doctor account is created. Admin will review your documents before the
              Verified badge. Clinic practices are registered and verified separately.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 my-2">
            {DOCTOR_STATUS_STEPS.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-2 text-sm ${
                  s === 'DOCUMENTS_SUBMITTED' ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
                  {i + 1}
                </span>
                {statusLabel(s)}
                {s === 'DOCUMENTS_SUBMITTED' && <span className="text-xs">(current)</span>}
              </li>
            ))}
          </ol>
          <div className="flex justify-center gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/');
              }}
            >
              Back to Home
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/login');
              }}
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ErrorDialog
        showErrorDialog={showErrorDialog}
        setShowErrorDialog={setShowErrorDialog}
        errorMessage={errorMessage}
      />
    </>
  );
};

export default DoctorSignupForm;
