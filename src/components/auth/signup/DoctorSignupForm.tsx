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
  EyeOffIcon,
} from 'lucide-react';
import { signupDoctor } from '@/services/authService';
import { sendSignupOtp, verifySignupOtp, DOCTOR_STATUS_STEPS, statusLabel } from '@/services/doctorVerificationService';
import { otpSendButtonLabel, useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import { uploadSignupDocuments } from '@/services/fileUploadService';
import ErrorDialog from '@/components/ui/error-dialog';
import {
  digitsOnlyPhone,
  EMAIL_ALREADY_REGISTERED,
  isEmailAlreadyRegistered,
  isOtpFailed,
  OTP_FAILED_MESSAGE,
  toE164Phone,
  validateEmail,
  validatePassword,
  validatePersonName,
  validatePhone,
} from '@/utils/validation';

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

const DoctorSignupForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') || '';
  const [step, setStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  /** Email/phone that passed OTP — changing the field clears verification. */
  const [verifiedEmailValue, setVerifiedEmailValue] = useState('');
  const [verifiedPhoneValue, setVerifiedPhoneValue] = useState('');
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [phoneOtpError, setPhoneOtpError] = useState('');

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

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [registrationCertFile, setRegistrationCertFile] = useState<File | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const emailResend = useOtpResendCooldown();
  const phoneResend = useOtpResendCooldown();
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailStillVerified =
    emailVerified && verifiedEmailValue !== '' && verifiedEmailValue === email.trim().toLowerCase();
  const phoneStillVerified =
    phoneVerified && verifiedPhoneValue !== '' && verifiedPhoneValue === phone.replace(/\D/g, '');

  const sendEmailOtp = async (opts?: { silent?: boolean }) => {
    if (emailStillVerified) return;
    setEmailOtpSending(true);
    setEmailOtpError('');
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: email.trim(), role: 'DOCTOR' });
      emailResend.start();
      if (!opts?.silent) toast.success('OTP sent to your email');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email OTP';
      if (isEmailAlreadyRegistered(message)) {
        setEmailError(EMAIL_ALREADY_REGISTERED);
      } else {
        toast.error(message);
      }
    } finally {
      setEmailOtpSending(false);
    }
  };

  const sendPhoneOtp = async (opts?: { silent?: boolean }) => {
    if (phoneStillVerified) return;
    setPhoneOtpSending(true);
    setPhoneOtpError('');
    try {
      const fullPhone = toE164Phone(phone);
      const res = (await sendSignupOtp({
        channel: 'PHONE',
        phone: fullPhone,
        email: email.trim(),
      })) as { data?: { message?: string }; message?: string };
      phoneResend.start();
      if (!opts?.silent) {
        const serverMsg = res?.data?.message || res?.message || '';
        if (/sms unavailable|sent to email/i.test(serverMsg)) {
          toast.success('SMS unavailable — phone OTP emailed (look for Phone OTP, not the email OTP)');
        } else {
          toast.success('Phone OTP sent (SMS). If SMS fails, check email for a Phone OTP message.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send phone OTP';
      setPhoneOtpError(message);
      toast.error(message);
    } finally {
      setPhoneOtpSending(false);
    }
  };

  /** Enter verify step: auto-send email + phone OTPs once (skip channels already verified). */
  const goToVerifyStep = () => {
    setStep(2);
    setOtpError('');
    void (async () => {
      const tasks: Promise<void>[] = [];
      if (!(emailVerified && verifiedEmailValue === email.trim().toLowerCase())) {
        tasks.push(sendEmailOtp({ silent: false }));
      }
      if (!(phoneVerified && verifiedPhoneValue === phone.replace(/\D/g, ''))) {
        tasks.push(sendPhoneOtp({ silent: false }));
      }
      await Promise.all(tasks);
    })();
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const firstErr = validatePersonName(firstName, 'First name');
    if (firstErr) {
      toast.error(firstErr);
      return;
    }
    const lastErr = validatePersonName(lastName, 'Last name', false);
    if (lastErr) {
      toast.error(lastErr);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      toast.error(emailErr);
      return;
    }
    setEmailError('');
    const passErr = validatePassword(password);
    if (passErr) {
      toast.warning(passErr);
      return;
    }
    const phoneErr = validatePhone(phone, true);
    if (phoneErr) {
      toast.error(phoneErr);
      return;
    }
    // Changing account contact after verify invalidates that channel only.
    if (verifiedEmailValue && verifiedEmailValue !== email.trim().toLowerCase()) {
      setEmailVerified(false);
      setVerifiedEmailValue('');
      setEmailOtp('');
    }
    if (verifiedPhoneValue && verifiedPhoneValue !== phone.replace(/\D/g, '')) {
      setPhoneVerified(false);
      setVerifiedPhoneValue('');
      setPhoneOtp('');
    }
    goToVerifyStep();
  };

  const verifyEmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (emailStillVerified || emailVerifying) return;
    setEmailVerifying(true);
    setEmailOtpError('');
    try {
      await verifySignupOtp({
        channel: 'EMAIL',
        email: email.trim(),
        phone: toE164Phone(phone),
        code: emailOtp.trim(),
      });
      setEmailVerified(true);
      setVerifiedEmailValue(email.trim().toLowerCase());
      const usedEmailCode = emailOtp.trim();
      setEmailOtp('');
      // Same digits in the phone box are almost certainly the email OTP — clear them.
      if (phoneOtp.trim() && phoneOtp.trim() === usedEmailCode) {
        setPhoneOtp('');
      }
      toast.success('Email verified');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email OTP';
      setEmailOtpError(isOtpFailed(message) ? OTP_FAILED_MESSAGE : message);
    } finally {
      setEmailVerifying(false);
    }
  };

  const verifyPhone = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phoneStillVerified || phoneVerifying) return;
    setPhoneVerifying(true);
    setPhoneOtpError('');
    try {
      const fullPhone = toE164Phone(phone);
      await verifySignupOtp({
        channel: 'PHONE',
        phone: fullPhone,
        email: email.trim(),
        code: phoneOtp.trim(),
      });
      setPhoneVerified(true);
      setVerifiedPhoneValue(phone.replace(/\D/g, ''));
      const usedPhoneCode = phoneOtp.trim();
      setPhoneOtp('');
      if (emailOtp.trim() && emailOtp.trim() === usedPhoneCode) {
        setEmailOtp('');
      }
      toast.success('Phone verified');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid phone OTP';
      setPhoneOtpError(isOtpFailed(message) ? OTP_FAILED_MESSAGE : message);
    } finally {
      setPhoneVerifying(false);
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
      const message = error instanceof Error ? error.message : 'Signup failed';
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
                              onChange={(e) => setFirstName(e.target.value)}
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
                              onChange={(e) => setLastName(e.target.value)}
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
                                setEmailError('');
                              }}
                              required
                              readOnly={!!inviteToken}
                            />
                          </div>
                          {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
                          {inviteToken && (
                            <p className="text-xs text-muted-foreground">Email is locked to the invitation.</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              autoComplete="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="10-digit phone"
                              className="pl-10"
                              value={phone}
                              onChange={(e) => setPhone(digitsOnlyPhone(e.target.value))}
                              required
                            />
                          </div>
                        </div>
                      </div>

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
                              {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
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
                              {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Continue to verification
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Verify email &amp; phone</CardTitle>
                    <CardDescription>
                      Codes are sent automatically. Email OTP and phone OTP are different — use each in its own box. Verified channels stay locked if you go back.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email OTP */}
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <Mail className="h-4 w-4" /> Email
                            </p>
                            <p className="text-xs text-muted-foreground break-all">{email}</p>
                          </div>
                          {emailStillVerified ? (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full ${
                            emailStillVerified || emailResend.coolingDown
                              ? 'bg-muted text-muted-foreground'
                              : ''
                          }`}
                          onClick={() => void sendEmailOtp()}
                          disabled={
                            emailStillVerified || emailOtpSending || emailResend.coolingDown
                          }
                        >
                          {emailStillVerified
                            ? 'Verified'
                            : otpSendButtonLabel(emailOtpSending, emailResend.remaining, 'Send Email OTP')}
                        </Button>
                        {!emailStillVerified ? (
                          <div className="space-y-2">
                            <Label htmlFor="emailOtp">Email OTP</Label>
                            <Input
                              id="emailOtp"
                              name="kittyp-signup-email-otp"
                              autoComplete="off"
                              inputMode="numeric"
                              placeholder="6-digit code from email"
                              value={emailOtp}
                              onChange={(e) => {
                                setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setEmailOtpError('');
                              }}
                              maxLength={6}
                            />
                            <Button
                              type="button"
                              className="w-full"
                              disabled={emailVerifying || phoneVerifying || emailOtp.length !== 6}
                              onClick={() => void verifyEmail()}
                            >
                              {emailVerifying ? 'Verifying email…' : 'Verify email'}
                            </Button>
                            {emailOtpError ? (
                              <p className="text-sm text-destructive">{emailOtpError}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {/* Phone OTP */}
                      <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              <Phone className="h-4 w-4" /> Phone
                            </p>
                            <p className="text-xs text-muted-foreground">{phone}</p>
                          </div>
                          {phoneStillVerified ? (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full ${
                            phoneStillVerified || phoneResend.coolingDown
                              ? 'bg-muted text-muted-foreground'
                              : ''
                          }`}
                          onClick={() => void sendPhoneOtp()}
                          disabled={
                            phoneStillVerified || phoneOtpSending || phoneResend.coolingDown
                          }
                        >
                          {phoneStillVerified
                            ? 'Verified'
                            : otpSendButtonLabel(phoneOtpSending, phoneResend.remaining, 'Send Phone OTP')}
                        </Button>
                        {!phoneStillVerified ? (
                          <div className="space-y-2">
                            <Label htmlFor="phoneOtp">Phone OTP</Label>
                            <p className="text-xs text-muted-foreground">
                              Use the SMS code, or the email titled for phone — not your email OTP.
                            </p>
                            <Input
                              id="phoneOtp"
                              name="kittyp-signup-phone-otp"
                              autoComplete="one-time-code"
                              inputMode="numeric"
                              placeholder="6-digit phone code"
                              value={phoneOtp}
                              onChange={(e) => {
                                setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setPhoneOtpError('');
                              }}
                              maxLength={6}
                            />
                            <Button
                              type="button"
                              className="w-full"
                              disabled={phoneVerifying || emailVerifying || phoneOtp.length !== 6}
                              onClick={() => void verifyPhone()}
                            >
                              {phoneVerifying ? 'Verifying phone…' : 'Verify phone'}
                            </Button>
                            {phoneOtpError ? (
                              <p className="text-sm text-destructive">{phoneOtpError}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {otpError ? <p className="text-sm text-destructive">{otpError}</p> : null}
                    {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        disabled={!emailStillVerified || !phoneStillVerified}
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
                            placeholder="e.g. 5"
                            className="pl-10 placeholder:text-muted-foreground/50"
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
              Published badge. Clinic practices are registered and published separately.
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
