import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { completeStaffInvite, fetchStaffInviteByToken, StaffInvitePreview } from '@/services/clinicService';
import { login } from '@/services/authService';
import { toast } from 'sonner';
import { AppDispatch } from '@/module/store/store';
import { clearUser, setActiveRole, validateAndSetUser } from '@/module/slice/AuthSlice';
import { parseApiErrorMessage, validatePassword } from '@/utils/validation';
import { ROLES } from '@/utils/roles';

export default function StaffInviteAccept() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [preview, setPreview] = useState<StaffInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setError('Missing invite token');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchStaffInviteByToken(token);
        if (!cancelled) {
          setPreview(data);
          const parts = (data.staffName || '').trim().split(/\s+/);
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' '));
        }
      } catch {
        if (!cancelled) setError('Invite not found or no longer valid');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const pending =
    preview && !preview.expired && !preview.accepted && preview.status === 'PENDING';

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !preview) return;
    if (firstName.trim().length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      toast.error(pwdErr);
      return;
    }
    setSubmitting(true);
    try {
      await completeStaffInvite(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        password,
      });
      await login({ email: preview.email, password });
      dispatch(clearUser());
      await dispatch(validateAndSetUser()).unwrap();
      dispatch(setActiveRole(ROLES.CLINIC_STAFF));
      toast.success('You joined the clinic');
      navigate('/clinic/appointments');
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Could not complete invite'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Clinic staff invite</CardTitle>
            <CardDescription>
              {preview
                ? `Join ${preview.clinicName} as staff`
                : 'Complete your clinic staff invite'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading invite…
              </div>
            ) : error ? (
              <p className="text-sm text-destructive inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            ) : preview?.accepted ? (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> This invite was already used.
              </p>
            ) : preview?.expired || preview?.status !== 'PENDING' ? (
              <p className="text-sm text-muted-foreground">This invite is no longer valid.</p>
            ) : pending ? (
              <form className="space-y-3" onSubmit={(e) => void handleComplete(e)}>
                <p className="text-sm text-muted-foreground">
                  Invited email: <span className="font-medium text-foreground">{preview.email}</span>
                </p>
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Create a password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    8–72 characters with upper, lower, number, and special character.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Join clinic
                </Button>
              </form>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Already have access? <Link to="/login" className="underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
