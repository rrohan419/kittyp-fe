import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import {
  acceptInvite,
  DoctorInvitePreview,
  fetchInviteByToken,
  rejectInvite,
} from '@/services/clinicService';
import { toast } from 'sonner';
import { notifyInviteAddressed } from '@/components/portal/PortalNotifications';
import { ROLES, hasAnyRole } from '@/utils/roles';
import { parseApiErrorMessage } from '@/utils/validation';
import { fetchMyDoctorProfile, isPracticeReady, statusLabel } from '@/services/doctorVerificationService';

export default function ClinicInviteAccept() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.authReducer);

  const [preview, setPreview] = useState<DoctorInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practiceReady, setPracticeReady] = useState(true);
  const [doctorStatusLabel, setDoctorStatusLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setError('Missing invite token');
        setLoading(false);
        return;
      }
      try {
        const data = await fetchInviteByToken(token);
        if (!cancelled) setPreview(data);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchMyDoctorProfile()
      .then((p) => {
        setPracticeReady(isPracticeReady(p?.status));
        setDoctorStatusLabel(p?.status ? statusLabel(p.status) : null);
      })
      .catch(() => {
        setPracticeReady(false);
      });
  }, [isAuthenticated]);

  const redirectLogin = `/login?redirect=${encodeURIComponent(`/clinic-invite/accept?token=${token}`)}`;
  const redirectSignup = `/signup/doctor?inviteToken=${encodeURIComponent(token)}`;

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      await acceptInvite(token);
      toast.success('You joined the clinic');
      notifyInviteAddressed();
      navigate('/doctor');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to accept invite'));
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setRejecting(true);
    try {
      await rejectInvite(token);
      toast.success('Invite declined — the clinic has been notified');
      notifyInviteAddressed();
      navigate('/doctor');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to decline invite'));
    } finally {
      setRejecting(false);
    }
  };

  const isDoctor = hasAnyRole(user?.roles, [ROLES.DOCTOR]);
  const declined = preview?.status === 'REJECTED';
  const pending =
    preview && !preview.expired && !preview.accepted && preview.status === 'PENDING';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Clinic invitation</CardTitle>
              <CardDescription>Join a clinic on kittyp to receive appointments and bookings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading invite…
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive py-4">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {!loading && preview && (
                <>
                  <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Clinic:</span>{' '}
                      <strong>{preview.clinicName}</strong>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Invited as:</span> {preview.doctorName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {preview.email}
                    </p>
                  </div>

                  {preview.accepted && (
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> This invite was already accepted.
                    </p>
                  )}

                  {declined && (
                    <p className="text-sm text-muted-foreground">This invite was declined.</p>
                  )}

                  {preview.expired && !preview.accepted && !declined && (
                    <p className="text-sm text-destructive">
                      This invite has expired. Ask the clinic to send a new one.
                    </p>
                  )}

                  {pending && (
                    <>
                      {!isAuthenticated && (
                        <div className="flex flex-col gap-2">
                          <Button asChild>
                            <Link to={redirectLogin}>Sign in to respond</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to={redirectSignup}>Create doctor account</Link>
                          </Button>
                        </div>
                      )}

                      {isAuthenticated && !isDoctor && (
                        <p className="text-sm text-muted-foreground">
                          You are signed in, but this invite requires a doctor account. Sign up as a doctor with the
                          invited email ({preview.email}).
                          <Button variant="link" className="px-1" asChild>
                            <Link to={redirectSignup}>Doctor signup</Link>
                          </Button>
                        </p>
                      )}

                      {isAuthenticated && isDoctor && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Responding as <strong>{user?.email}</strong>. You must be signed in with the invited
                            email ({preview.email}).
                          </p>
                          {!practiceReady ? (
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              Certificates must be verified by admin before you can join a clinic
                              {doctorStatusLabel ? ` (current: ${doctorStatusLabel})` : ''}.
                            </p>
                          ) : null}
                          <Button
                            className="w-full"
                            onClick={handleAccept}
                            disabled={accepting || rejecting || !practiceReady}
                          >
                            {accepting ? 'Joining…' : 'Accept invitation'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleReject}
                            disabled={accepting || rejecting}
                          >
                            {rejecting ? 'Declining…' : 'Decline invitation'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
