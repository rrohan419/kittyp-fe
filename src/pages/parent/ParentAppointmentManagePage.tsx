import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicBookingModel } from '@/services/clinicService';
import { fetchMyParentBooking, patchParentBooking } from '@/services/visitService';

type Action = 'reschedule' | 'cancel';

const RESCHEDULE_BLOCKED =
  'Online rescheduling is no longer available because the 6-hour change window has passed. Please contact the clinic directly for assistance.';
const CANCEL_BLOCKED =
  'Online cancellation is no longer available because the 6-hour cancellation window has passed. Please contact the clinic directly.';

export default function ParentAppointmentManagePage({ action }: { action: Action }) {
  const { bookingUuid = '' } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ClinicBookingModel | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyParentBooking(bookingUuid)
      .then((row) => {
        if (cancelled) return;
        setBooking(row ?? null);
        setMissing(!row);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingUuid]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading appointment…
      </div>
    );
  }

  if (missing || !booking) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Appointment not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/app/appointments">Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (booking.parentChangeAllowed === false) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{action === 'cancel' ? 'Cancellation unavailable' : 'Rescheduling unavailable'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{action === 'cancel' ? CANCEL_BLOCKED : RESCHEDULE_BLOCKED}</p>
            <p className="text-foreground">
              {booking.clinicName || 'Clinic'}
              {booking.clinicPhone ? ` · ${booking.clinicPhone}` : ''}
            </p>
            <Button asChild variant="outline">
              <Link to="/app/appointments">Back to appointments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (action === 'reschedule') {
    return <Navigate to={`/app/book?reschedule=${encodeURIComponent(bookingUuid)}`} replace />;
  }

  const confirmCancel = async () => {
    setBusy(true);
    try {
      await patchParentBooking(bookingUuid, { status: 'CANCELLED' });
      toast.success('Appointment cancelled');
      navigate('/app/appointments');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not cancel appointment';
      toast.error(message);
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Cancel this appointment?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            {booking.petName || 'Your pet'} at {booking.clinicName || 'the clinic'}. This cannot be undone online.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" disabled={busy} onClick={() => void confirmCancel()}>
              {busy ? 'Cancelling…' : 'Confirm cancellation'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/appointments">Keep appointment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
