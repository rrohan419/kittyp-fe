import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
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
} from 'lucide-react';
import { signupDoctor } from '@/services/authService';
import { sendSignupOtp, verifySignupOtp, DOCTOR_STATUS_STEPS, statusLabel } from '@/services/doctorVerificationService';
import { uploadSignupDocuments } from '@/services/fileUploadService';
import ErrorDialog from '@/components/ui/error-dialog';

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
  { id: 2, label: 'Email OTP' },
  { id: 3, label: 'Phone OTP' },
  { id: 4, label: 'Documents' },
] as const;

const DoctorSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [specialization, setSpecialization] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [bio, setBio] = useState('');

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [registrationCertFile, setRegistrationCertFile] = useState<File | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [clinicPhotoFiles, setClinicPhotoFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      toast.warning('Password must be at least 8 characters.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required for OTP verification');
      return;
    }
    setStep(2);
  };

  const sendEmailOtp = async () => {
    setOtpSending(true);
    try {
      await sendSignupOtp({ channel: 'EMAIL', email: email.trim() });
      toast.success('OTP sent to your email');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifySignupOtp({ channel: 'EMAIL', email: email.trim(), code: emailOtp.trim() });
      setEmailVerified(true);
      toast.success('Email verified');
      setStep(3);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid email OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async () => {
    setOtpSending(true);
    try {
      await sendSignupOtp({
        channel: 'PHONE',
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success('Phone OTP sent (delivered to your email)');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send phone OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const verifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifySignupOtp({
        channel: 'PHONE',
        phone: phone.trim(),
        email: email.trim(),
        code: phoneOtp.trim(),
      });
      setPhoneVerified(true);
      toast.success('Phone verified');
      setStep(4);
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
    if (!clinicAddress.trim()) {
      toast.error('Clinic address is required for verification');
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
      let clinicPhotosUrls: string | undefined;
      if (clinicPhotoFiles.length > 0) {
        const urls = await uploadSignupDocuments(clinicPhotoFiles, email.trim());
        clinicPhotosUrls = urls.join(',');
      }

      await signupDoctor({
        firstName,
        lastName,
        email: email.trim(),
        password,
        phoneNumber: phone.trim(),
        registrationNumber: registrationNumber.trim(),
        licenseNumber: registrationNumber.trim(),
        specialization,
        experience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        clinicName: clinicName.trim() || undefined,
        clinicAddress: clinicAddress.trim(),
        professionalSummary: bio.trim() || undefined,
        degreeCertificateUrl,
        registrationCertificateUrl,
        governmentIdUrl,
        clinicPhotosUrls,
      });

      setShowSuccessDialog(true);
      toast.success('Documents submitted for review');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      setErrorMessage(message);
      setShowErrorDialog(true);
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
                <Stethoscope className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Join as a Veterinarian
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                OTP-verified signup with mandatory credentials. Manual review before your Verified badge.
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
                    <form onSubmit={handleStep1} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
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
                              type="email"
                              placeholder="doctor@example.com"
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 555-0000"
                              className="pl-10"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
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
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              minLength={8}
                            />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="w-full">
                        Continue to Email OTP
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}

              {step === 2 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Verify Email</CardTitle>
                    <CardDescription>We&apos;ll send a one-time code to {email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={verifyEmail} className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={sendEmailOtp}
                        disabled={otpSending}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {otpSending ? 'Sending…' : 'Send Email OTP'}
                      </Button>
                      <div className="space-y-2">
                        <Label htmlFor="emailOtp">Email OTP</Label>
                        <Input
                          id="emailOtp"
                          inputMode="numeric"
                          placeholder="6-digit code"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                          Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                          {loading ? 'Verifying…' : 'Verify & Continue'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {step === 3 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Verify Phone</CardTitle>
                    <CardDescription>
                      Phone OTP is delivered to your email for now ({email})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={verifyPhone} className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={sendPhoneOtp}
                        disabled={otpSending}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {otpSending ? 'Sending…' : 'Send Phone OTP'}
                      </Button>
                      <div className="space-y-2">
                        <Label htmlFor="phoneOtp">Phone OTP</Label>
                        <Input
                          id="phoneOtp"
                          inputMode="numeric"
                          placeholder="6-digit code"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                          Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                          {loading ? 'Verifying…' : 'Verify & Continue'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {step === 4 && (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">Professional Documents</CardTitle>
                    <CardDescription>
                      Registration number and certificates are mandatory. Admin review is required before
                      Verified.
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <Label htmlFor="clinicName">Clinic / Hospital Name</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="clinicName"
                              placeholder="Happy Paws Clinic"
                              className="pl-10"
                              value={clinicName}
                              onChange={(e) => setClinicName(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clinicAddress">Clinic Address *</Label>
                        <Input
                          id="clinicAddress"
                          placeholder="Full address (must match Google Maps)"
                          value={clinicAddress}
                          onChange={(e) => setClinicAddress(e.target.value)}
                          required
                        />
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
                        <div className="space-y-2">
                          <Label htmlFor="clinicPhotos">Clinic photos (recommended)</Label>
                          <Input
                            id="clinicPhotos"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) =>
                              setClinicPhotoFiles(e.target.files ? Array.from(e.target.files) : [])
                            }
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(3)}
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
          </div>
        </div>
      </main>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Documents Submitted</DialogTitle>
            <DialogDescription className="text-center">
              Your application is in the verification pipeline. You can sign in now; the Verified badge
              appears only after admin checklist approval.
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

      <Footer />
    </div>
  );
};

export default DoctorSignup;
