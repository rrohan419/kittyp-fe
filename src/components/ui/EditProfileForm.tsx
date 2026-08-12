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

const formSchema = z
  .object({
    firstName: z.string().min(2, 'Name must be at least 2 characters'),
    lastName: z.string().optional().default(''),
    email: z.string().regex(EMAIL_REGEX, 'Invalid email address'),
    phoneCountryCode: z.string().optional().default('+91'),
    phoneNumber: z.string().optional().default(''),
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
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState<'EMAIL' | 'PHONE' | null>(null);
  /** Persisted phone shown with green tick after successful verify+save */
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '+91',
      phoneNumber: '',
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
        age: user.age != null ? String(user.age) : '',
      });
      setEmailVerified(false);
      setPhoneVerified(false);
      setEmailOtpSent(false);
      setPhoneOtpSent(false);
      setEmailOtp('');
      setPhoneOtp('');
      if (user.phoneNumber) {
        setConfirmedPhone(`${user.phoneCountryCode || ''}${user.phoneNumber}`);
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

  useEffect(() => {
    setEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtp('');
  }, [watched.email]);

  useEffect(() => {
    setPhoneVerified(false);
    setPhoneOtpSent(false);
    setPhoneOtp('');
  }, [watched.phoneCountryCode, watched.phoneNumber]);

  const handleSendOtp = async (channel: 'EMAIL' | 'PHONE') => {
    try {
      setOtpBusy(channel);
      if (channel === 'EMAIL') {
        await sendProfileOtp({ channel: 'EMAIL', email: watched.email.trim() });
        setEmailOtpSent(true);
        toast.success('OTP sent to the new email');
      } else {
        const local = normalizeLocalPhone(watched.phoneNumber || '');
        if (!PHONE_REGEX.test(local)) {
          toast.error('Enter a valid 10-digit phone number first');
          return;
        }
        const phone = `${watched.phoneCountryCode}${local}`.trim();
        await sendProfileOtp({ channel: 'PHONE', phone });
        setPhoneOtpSent(true);
        toast.success('OTP sent to your phone (check your phone, or server logs in local)');
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send OTP';
      toast.error(message);
    } finally {
      setOtpBusy(null);
    }
  };

  const handleVerifyOtp = async (channel: 'EMAIL' | 'PHONE') => {
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
        const phone = `${watched.phoneCountryCode}${watched.phoneNumber}`.trim();
        await verifyProfileOtp({
          channel: 'PHONE',
          phone,
          code: phoneOtp.trim(),
        });
        setPhoneVerified(true);
        toast.success('Phone verified');
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
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
        age: user.age != null ? String(user.age) : '',
      });
    }
    setEditing(false);
    setEmailVerified(false);
    setPhoneVerified(false);
    setEmailOtpSent(false);
    setPhoneOtpSent(false);
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
      toast.error('Please verify your new phone number before saving');
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
            Changing email or phone requires OTP confirmation next to the field before save.
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
                disabled={otpBusy === 'EMAIL'}
                onClick={() => handleSendOtp('EMAIL')}
              >
                {otpBusy === 'EMAIL' ? 'Sending…' : emailOtpSent ? 'Resend OTP' : 'Send OTP'}
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
                disabled={otpBusy === 'PHONE'}
                onClick={() => handleSendOtp('PHONE')}
              >
                {otpBusy === 'PHONE' ? 'Sending…' : phoneOtpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
              {phoneOtpSent && (
                <>
                  <Input
                    className="sm:max-w-[160px]"
                    placeholder="Phone OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!phoneOtp.trim() || otpBusy === 'PHONE'}
                    onClick={() => handleVerifyOtp('PHONE')}
                  >
                    Confirm
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground sm:ml-1">OTP is sent to your phone number</p>
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
