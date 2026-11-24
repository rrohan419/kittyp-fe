import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sendProfileOtp, updateUserDetails, verifyProfileOtp } from '@/services/UserService';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { setUser } from '@/module/slice/AuthSlice';
import { toast } from 'sonner';
import { CheckCircle2, Pencil, X } from 'lucide-react';
import { digitsOnlyPhone, EMAIL_REGEX, normalizeLocalPhone, PHONE_REGEX } from '@/utils/validation';
import { setAuthItem } from '@/utils/authStorage';
import { CooldownTimer } from '@/components/ui/cooldown-timer';
import { openMsg91OtpWidget } from '@/services/msg91Widget';

const OTP_RESEND_COOLDOWN_SECONDS = 30;

const formSchema = z
  .object({
    firstName: z.string().min(2, 'Name must be at least 2 characters'),
    lastName: z.string().optional().default(''),
    email: z.string().regex(EMAIL_REGEX, 'Invalid email address'),
    phoneCountryCode: z.string().optional().default('+91'),
    phoneNumber: z.string().optional().default(''),
    whatsappCountryCode: z.string().optional().default('+91'),
    whatsappNumber: z.string().optional().default(''),
    age: z
      .string()
      .optional()
      .refine((v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 120), {
        message: 'Age must be between 1 and 120',
      }),
  })
  .superRefine((data, ctx) => {
    const phone = normalizeLocalPhone(data.phoneNumber || '');
    if (phone && !PHONE_REGEX.test(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number must be exactly 10 digits',
        path: ['phoneNumber'],
      });
    }
    const whatsapp = normalizeLocalPhone(data.whatsappNumber || '');
    if (whatsapp && !PHONE_REGEX.test(whatsapp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'WhatsApp number must be exactly 10 digits',
        path: ['whatsappNumber'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const countryCodeOptions = [
  { value: '+1', label: '+1 (USA/Canada)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+49', label: '+49 (Germany)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+81', label: '+81 (Japan)' },
  { value: '+86', label: '+86 (China)' },
];

const EditProfileForm = ({
  onSuccess,
  initiallyEditing = true,
}: {
  onSuccess?: () => void;
  initiallyEditing?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.authReducer.user);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(initiallyEditing);
  const [saving, setSaving] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState<'EMAIL' | 'PHONE' | 'WHATSAPP' | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [whatsappCooldown, setWhatsappCooldown] = useState(0);
  /** Persisted phone shown with green tick after successful verify+save */
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
  const [confirmedWhatsapp, setConfirmedWhatsapp] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '+91',
      phoneNumber: '',
      whatsappCountryCode: '+91',
      whatsappNumber: '',
      age: '',
    },
  });

  const watched = form.watch();

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneCountryCode: user.phoneCountryCode || '+91',
        phoneNumber: user.phoneNumber || '',
        whatsappCountryCode: user.whatsappCountryCode || user.phoneCountryCode || '+91',
        whatsappNumber: user.whatsappNumber || '',
        age: user.age != null ? String(user.age) : '',
      });
      setEmailVerified(false);
      setPhoneVerified(false);
      setEmailOtpSent(false);
      setWhatsappOtpSent(false);
      setEmailOtp('');
      setWhatsappOtp('');
      setEmailCooldown(0);
      setPhoneCooldown(0);
      setWhatsappCooldown(0);
      if (user.phoneNumber) {
        setConfirmedPhone(`${user.phoneCountryCode || ''}${user.phoneNumber}`);
      }
      if (user.whatsappNumber) {
        setConfirmedWhatsapp(`${user.whatsappCountryCode || '+91'}${user.whatsappNumber}`);
      }
    }
  }, [user, form]);

  const emailChanged = useMemo(() => {
    if (!user) return false;
    return (watched.email || '').trim().toLowerCase() !== (user.email || '').trim().toLowerCase();
  }, [watched.email, user]);

  const phoneChanged = useMemo(() => {
    if (!user) return false;
    const nextNumber = (watched.phoneNumber || '').trim();
    if (!nextNumber) return false;
    const nextCode = (watched.phoneCountryCode || '+91').trim() || '+91';
    const currentCode = (user.phoneCountryCode || '+91').trim() || '+91';
    const next = `${nextCode}${nextNumber}`.trim();
    const current = `${currentCode}${(user.phoneNumber || '').trim()}`.trim();
    return next !== current;
  }, [watched.phoneCountryCode, watched.phoneNumber, user]);

  const whatsappChanged = useMemo(() => {
    const nextNumber = (watched.whatsappNumber || '').trim();
    if (!nextNumber) return false;
    const nextCode = (watched.whatsappCountryCode || '+91').trim() || '+91';
    const currentCode = (user?.whatsappCountryCode || '+91').trim() || '+91';
    return `${nextCode}${nextNumber}` !== `${currentCode}${(user?.whatsappNumber || '').trim()}`;
  }, [watched.whatsappCountryCode, watched.whatsappNumber, user]);

  useEffect(() => {
    if (emailCooldown === 0 && phoneCooldown === 0 && whatsappCooldown === 0) return;
    const timer = window.setInterval(() => {
      setEmailCooldown((seconds) => Math.max(0, seconds - 1));
      setPhoneCooldown((seconds) => Math.max(0, seconds - 1));
      setWhatsappCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [emailCooldown, phoneCooldown, whatsappCooldown]);

  useEffect(() => {
    setEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtp('');
  }, [watched.email]);

  useEffect(() => {
    setPhoneVerified(false);
  }, [watched.phoneCountryCode, watched.phoneNumber]);

  useEffect(() => {
    setWhatsappVerified(false);
    setWhatsappOtpSent(false);
    setWhatsappOtp('');
  }, [watched.whatsappCountryCode, watched.whatsappNumber]);

  const handleSendOtp = async (channel: 'EMAIL' | 'PHONE' | 'WHATSAPP') => {
    try {
      setOtpBusy(channel);
      if (channel === 'EMAIL') {
        await sendProfileOtp({ channel: 'EMAIL', email: watched.email.trim() });
        setEmailOtpSent(true);
        setEmailCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        toast.success('OTP sent to the new email');
      } else if (channel === 'PHONE') {
        const local = normalizeLocalPhone(watched.phoneNumber || '');
        if (!PHONE_REGEX.test(local)) {
          toast.error('Enter a valid 10-digit phone number first');
          return;
        }
        const phone = `${watched.phoneCountryCode}${local}`.trim();
        const accessToken = await openMsg91OtpWidget(phone);
        await verifyProfileOtp({ channel: 'PHONE', phone, accessToken });
        setPhoneVerified(true);
        setPhoneCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        toast.success('Phone number verified by SMS OTP');
      } else {
        const local = normalizeLocalPhone(watched.whatsappNumber || '');
        if (!PHONE_REGEX.test(local)) {
          toast.error('Enter a valid 10-digit WhatsApp number first');
          return;
        }
        const phone = `${watched.whatsappCountryCode}${local}`.trim();
        await sendProfileOtp({ channel: 'WHATSAPP', phone });
        setWhatsappOtpSent(true);
        setWhatsappCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        toast.success('OTP sent to your WhatsApp number');
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        'Failed to send OTP';
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

  const handleVerifyOtp = async (channel: 'EMAIL' | 'WHATSAPP') => {
    try {
      setOtpBusy(channel);
      if (channel === 'EMAIL') {
        await verifyProfileOtp({
          channel: 'EMAIL',
          email: watched.email.trim(),
          code: emailOtp.trim(),
        });
        setEmailVerified(true);
        toast.success('Email verified');
      } else {
        const phone = `${watched.whatsappCountryCode}${watched.whatsappNumber}`.trim();
        await verifyProfileOtp({
          channel: 'WHATSAPP',
          phone,
          code: whatsappOtp.trim(),
        });
        setWhatsappVerified(true);
        toast.success('WhatsApp number verified');
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        'Invalid or expired OTP';
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

  const cancelEditing = () => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneCountryCode: user.phoneCountryCode || '+91',
        phoneNumber: user.phoneNumber || '',
        whatsappCountryCode: user.whatsappCountryCode || user.phoneCountryCode || '+91',
        whatsappNumber: user.whatsappNumber || '',
        age: user.age != null ? String(user.age) : '',
      });
    }
    setEditing(false);
    setEmailVerified(false);
    setPhoneVerified(false);
    setWhatsappVerified(false);
    setEmailOtpSent(false);
    setWhatsappOtpSent(false);
    setEmailCooldown(0);
    setPhoneCooldown(0);
    setWhatsappCooldown(0);
  };

  async function onSubmit(values: FormValues) {
    if (!user?.uuid) {
      toast.error('Please login to update your profile');
      return;
    }

    if (emailChanged && !emailVerified) {
      toast.error('Please verify your new email before saving');
      return;
    }
    if (phoneChanged && !phoneVerified) {
      toast.error('Please verify your new phone number by SMS before saving');
      return;
    }
    if (whatsappChanged && !whatsappVerified) {
      toast.error('Please verify your new WhatsApp number before saving');
      return;
    }

    try {
      setSaving(true);
      const userDetail = await updateUserDetails(user.uuid, {
        email: values.email.trim(),
        firstName: values.firstName.trim(),
        lastName: (values.lastName || '').trim(),
        phoneCountryCode: values.phoneCountryCode || '+91',
        phoneNumber: (values.phoneNumber || '').trim(),
        whatsappCountryCode: values.whatsappCountryCode || '+91',
        whatsappNumber: (values.whatsappNumber || '').trim(),
        age: values.age ? Number(values.age) : null,
      });

      if (userDetail.accessToken) {
        setAuthItem('access_token', userDetail.accessToken);
      }

      // Preserve roles if API somehow omits them
      const merged = {
        ...user,
        ...userDetail,
        roles: userDetail.roles?.length ? userDetail.roles : user.roles,
      };
      dispatch(setUser(merged));
      setAuthItem('user', JSON.stringify(merged));

      if (values.phoneNumber?.trim()) {
        setConfirmedPhone(`${values.phoneCountryCode || ''}${values.phoneNumber.trim()}`);
      }
      if (values.whatsappNumber?.trim()) {
        setConfirmedWhatsapp(`${values.whatsappCountryCode || '+91'}${values.whatsappNumber.trim()}`);
      }

      toast.success('Profile updated successfully');
      setEditing(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile. Please try again.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (!user?.uuid) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Please login to edit your profile</p>
        <Button onClick={() => navigate('/login')} variant="outline">
          Go to Login
        </Button>
      </div>
    );
  }

  const displayPhoneVerified =
    phoneVerified ||
    (!!user.phoneNumber &&
      confirmedPhone === `${user.phoneCountryCode || ''}${user.phoneNumber}` &&
      !phoneChanged);
  const displayWhatsappVerified =
    whatsappVerified ||
    (!!user.whatsappNumber &&
      confirmedWhatsapp === `${user.whatsappCountryCode || '+91'}${user.whatsappNumber}` &&
      !whatsappChanged);

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Full Name</p>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Age</p>
            <p className="font-medium">{user.age != null ? user.age : 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium flex items-center gap-2">
              {user.email}
              <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Verified" />
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Phone</p>
            <p className="font-medium flex items-center gap-2">
              {user.phoneNumber
                ? `${user.phoneCountryCode || '+91'} ${user.phoneNumber}`
                : 'Not provided'}
              {displayPhoneVerified && user.phoneNumber && (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Verified" />
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">WhatsApp</p>
            <p className="font-medium flex items-center gap-2">
              {user.whatsappNumber
                ? `${user.whatsappCountryCode || '+91'} ${user.whatsappNumber}`
                : 'Not provided'}
              {displayWhatsappVerified && user.whatsappNumber && (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Verified" />
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          {!initiallyEditing && <h2 className="text-2xl font-bold">Edit Profile</h2>}
          <p className={`text-sm text-muted-foreground ${initiallyEditing ? '' : 'mt-1'}`}>
            Changing email, phone, or WhatsApp requires OTP confirmation. Phone uses SMS;
            WhatsApp uses your WhatsApp OTP.
          </p>
        </div>
        {!initiallyEditing && (
          <Button variant="ghost" size="icon" onClick={cancelEditing} aria-label="Cancel editing">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Age <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={120} placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Email
                  {(!emailChanged || emailVerified) && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {emailChanged && !emailVerified && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={otpBusy === 'EMAIL' || emailCooldown > 0}
                onClick={() => handleSendOtp('EMAIL')}
              >
                {otpBusy === 'EMAIL' ? 'Sending…' : emailCooldown > 0
                  ? <CooldownTimer seconds={emailCooldown} />
                  : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
              {emailOtpSent && (
                <>
                  <Input
                    className="sm:max-w-[160px]"
                    placeholder="Email OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!emailOtp.trim() || otpBusy === 'EMAIL'}
                    onClick={() => handleVerifyOtp('EMAIL')}
                  >
                    Confirm
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
              {(phoneVerified || (displayPhoneVerified && !phoneChanged)) && (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Verified" />
              )}
            </FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit number"
                        value={field.value}
                        onChange={(e) => field.onChange(digitsOnlyPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {phoneChanged && !phoneVerified && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={otpBusy === 'PHONE' || phoneCooldown > 0}
                onClick={() => handleSendOtp('PHONE')}
              >
                {otpBusy === 'PHONE' ? 'Opening SMS verification…' : phoneCooldown > 0
                  ? <CooldownTimer seconds={phoneCooldown} />
                  : 'Send SMS OTP'}
              </Button>
              <p className="text-xs text-muted-foreground sm:ml-1">
                A secure MSG91 window will verify the SMS OTP.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              WhatsApp Number <span className="text-muted-foreground font-normal">(optional)</span>
              {(whatsappVerified || (displayWhatsappVerified && !whatsappChanged)) && (
                <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Verified" />
              )}
            </FormLabel>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="whatsappCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countryCodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit WhatsApp number"
                        value={field.value}
                        onChange={(e) => field.onChange(digitsOnlyPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {whatsappChanged && !whatsappVerified && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={otpBusy === 'WHATSAPP' || whatsappCooldown > 0}
                onClick={() => handleSendOtp('WHATSAPP')}
              >
                {otpBusy === 'WHATSAPP' ? 'Sending…' : whatsappCooldown > 0
                  ? <CooldownTimer seconds={whatsappCooldown} />
                  : whatsappOtpSent ? 'Resend WhatsApp OTP' : 'Send WhatsApp OTP'}
              </Button>
              {whatsappOtpSent && (
                <>
                  <Input
                    className="sm:max-w-[160px]"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="WhatsApp OTP"
                    value={whatsappOtp}
                    onChange={(event) => setWhatsappOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!whatsappOtp.trim() || otpBusy === 'WHATSAPP'}
                    onClick={() => handleVerifyOtp('WHATSAPP')}
                  >
                    Confirm
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!initiallyEditing && (
              <Button type="button" variant="outline" className="sm:w-auto" onClick={cancelEditing}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="w-full sm:flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditProfileForm;
