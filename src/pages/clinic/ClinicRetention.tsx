import { useEffect, useMemo, useState } from 'react';
import { Bell, Send, CheckCircle2, Syringe, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  RetentionAlertModel,
  fetchRetentionAlerts,
  notifyRetentionAlert,
} from '@/services/clinicService';

const FALLBACK: RetentionAlertModel[] = [
  {
    id: '1',
    petUuid: 'demo-1',
    petName: 'Whiskers',
    ownerName: 'Sarah Miller',
    type: 'VACCINATION_DUE',
    message: 'Rabies booster due in 3 months. Offer a 15% wellness visit discount.',
    dueInDays: 90,
    status: 'OPEN',
  },
  {
    id: '2',
    petUuid: 'demo-2',
    petName: 'Buddy',
    ownerName: 'Raj Patel',
    type: 'BOOSTER_OVERDUE',
    message: 'DHPP booster is 12 days overdue. Send a retention reminder.',
    dueInDays: -12,
    status: 'OPEN',
  },
  {
    id: '3',
    petUuid: 'demo-3',
    petName: 'Luna',
    ownerName: 'Anita Desai',
    type: 'LAPSED_PATIENT',
    message: 'No clinic visit in 8 months. Re-engage with a checkup offer.',
    dueInDays: 0,
    status: 'OPEN',
  },
];

function alertIcon(type: string) {
  if (type === 'LAPSED_PATIENT') return CalendarClock;
  return Syringe;
}

export default function ClinicRetention() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [alerts, setAlerts] = useState<RetentionAlertModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!clinicUuid) {
      setAlerts(FALLBACK);
      setFallback(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchRetentionAlerts(clinicUuid);
        if (cancelled) return;
        setAlerts(data.length ? data : FALLBACK);
        setFallback(!data.length);
      } catch {
        if (!cancelled) {
          setAlerts(FALLBACK);
          setFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  const openCount = useMemo(
    () => alerts.filter((a) => String(a.status).toUpperCase() === 'OPEN').length,
    [alerts]
  );

  const sendReminder = async (id: string) => {
    if (!clinicUuid || fallback) {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'SENT' } : a)));
      toast.success('Retention reminder queued (demo)');
      return;
    }
    try {
      await notifyRetentionAlert(clinicUuid, id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'SENT' } : a)));
      toast.success('Retention reminder sent to the pet parent');
    } catch {
      toast.error('Failed to send reminder');
    }
  };

  const markHandled = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'HANDLED' } : a)));
    toast.success('Alert marked as handled');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Retention Alerts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {clinic?.name ? `${clinic.name} — ` : ''}
            Actionable follow-ups so vaccines and checkups do not slip through the cracks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="w-fit">
            <Bell className="h-3.5 w-3.5 mr-1" />
            {openCount} open
          </Badge>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcon(alert.type);
            const status = String(alert.status).toUpperCase();
            return (
              <Card key={alert.id} className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {alert.petName}
                          <span className="text-muted-foreground font-normal"> · {alert.ownerName}</span>
                        </CardTitle>
                        <CardDescription className="mt-1">{alert.message}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={status === 'OPEN' ? 'default' : 'outline'} className="shrink-0 capitalize">
                      {status.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  <Button size="sm" disabled={status !== 'OPEN'} onClick={() => sendReminder(alert.id)}>
                    <Send className="h-4 w-4 mr-1.5" />
                    Send reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={status === 'HANDLED'}
                    onClick={() => markHandled(alert.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Mark handled
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
