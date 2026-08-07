import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Stethoscope } from 'lucide-react';
import { ClinicVisitModel } from '@/services/clinicService';
import {
  completeDoctorVisit,
  fetchMyDoctorVisits,
  returnDoctorVisitToReception,
  saveDoctorVisitChart,
  startDoctorVisit,
} from '@/services/visitService';
import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/utils/validation';

export default function DoctorAppointments() {
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    examinationNotes: '',
    assessment: '',
    plan: '',
    nextVisitNotes: '',
    internalNotes: '',
    weightKg: '',
    temperatureC: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVisits(await fetchMyDoctorVisits());
    } catch {
      setVisits([]);
      toast.error('Failed to load your visit queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  const openChart = async (visit: ClinicVisitModel) => {
    setBusy(true);
    try {
      let current = visit;
      if (visit.status === 'WAITLIST' || visit.status === 'CHECKED_IN') {
        current = await startDoctorVisit(visit.uuid);
        await load();
      }
      setChartVisit(current);
      setForm({
        examinationNotes: current.chart?.examinationNotes || '',
        assessment: current.chart?.assessment || '',
        plan: current.chart?.plan || '',
        nextVisitNotes: current.chart?.nextVisitNotes || '',
        internalNotes: current.chart?.internalNotes || '',
        weightKg: String((current.chart?.vitals as { weightKg?: number })?.weightKg ?? ''),
        temperatureC: String((current.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
      });
    } catch {
      toast.error('Could not start visit');
    } finally {
      setBusy(false);
    }
  };

  const saveChart = async (andComplete: boolean) => {
    if (!chartVisit) return;
    if (andComplete && !form.assessment.trim()) {
      toast.error('Add an assessment / diagnosis before completing');
      return;
    }
    setBusy(true);
    try {
      const vitals: Record<string, number> = {};
      if (form.weightKg) vitals.weightKg = Number(form.weightKg);
      if (form.temperatureC) vitals.temperatureC = Number(form.temperatureC);
      await saveDoctorVisitChart(chartVisit.uuid, {
        examinationNotes: form.examinationNotes,
        assessment: form.assessment,
        plan: form.plan,
        nextVisitNotes: form.nextVisitNotes,
        internalNotes: form.internalNotes,
        vitals: Object.keys(vitals).length ? vitals : undefined,
      });
      if (andComplete) {
        await completeDoctorVisit(chartVisit.uuid);
        toast.success('Treatment finished — patient moved to clinic Checkout');
        setChartVisit(null);
      } else {
        toast.success('Chart saved');
      }
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to save chart'));
    } finally {
      setBusy(false);
    }
  };

  const sendBack = async () => {
    if (!chartVisit) return;
    setBusy(true);
    try {
      if (form.examinationNotes || form.assessment || form.plan) {
        const vitals: Record<string, number> = {};
        if (form.weightKg) vitals.weightKg = Number(form.weightKg);
        if (form.temperatureC) vitals.temperatureC = Number(form.temperatureC);
        await saveDoctorVisitChart(chartVisit.uuid, {
          examinationNotes: form.examinationNotes,
          assessment: form.assessment,
          plan: form.plan,
          nextVisitNotes: form.nextVisitNotes,
          internalNotes: form.internalNotes,
          vitals: Object.keys(vitals).length ? vitals : undefined,
        });
      }
      await returnDoctorVisitToReception(chartVisit.uuid);
      toast.success('Sent back to reception (Checked in)');
      setChartVisit(null);
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Could not send back to reception'));
    } finally {
      setBusy(false);
    }
  };

  const active = visits.filter((v) =>
    ['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS'].includes(v.status)
  );
  const treated = visits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED');

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">My visits</h1>
        <p className="text-sm text-muted-foreground">
          Patients assigned or checked in for you. Finish treatment to send them to clinic Checkout.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Queue</h2>
            {active.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No visits assigned to you today. Ask the front desk to assign and check in a walk-in.
                </CardContent>
              </Card>
            ) : (
              active.map((v) => (
                <Card key={v.uuid}>
                  <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        {v.petName}
                        {v.urgency === 'URGENT' && <Badge variant="destructive">Urgent</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {v.ownerName}
                        {v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                        {v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {v.clinicName ? `${v.clinicName} · ` : ''}
                        {v.status.replace('_', ' ')}
                        {v.createdAt ? ` · since ${format(parseISO(v.createdAt), 'p')}` : ''}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openChart(v)} disabled={busy}>
                      {v.status === 'IN_PROGRESS' || v.status === 'CHECKING_OUT' ? 'Open chart' : 'Start'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {treated.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Treated today</h2>
              {treated.map((v) => (
                <Card key={v.uuid}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {v.petName}
                          {v.ownerName ? ` · ${v.ownerName}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.ownerPhone ? `${v.ownerPhone} · ` : ''}
                          {v.chart?.assessment || v.reasonForVisit || 'Visit'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {v.status === 'CHECKING_OUT' ? 'Checkout' : 'Completed'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!chartVisit} onOpenChange={(o) => !o && setChartVisit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chart · {chartVisit?.petName}
              {chartVisit?.ownerName ? ` (${chartVisit.ownerName})` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {chartVisit?.reasonForVisit && (
              <p className="text-sm text-muted-foreground">Reason: {chartVisit.reasonForVisit}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  value={form.weightKg}
                  onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))}
                />
              </div>
              <div>
                <Label>Temp (°C)</Label>
                <Input
                  value={form.temperatureC}
                  onChange={(e) => setForm((s) => ({ ...s, temperatureC: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Examination / report</Label>
              <Textarea
                value={form.examinationNotes}
                onChange={(e) => setForm((s) => ({ ...s, examinationNotes: e.target.value }))}
                rows={3}
                placeholder="Findings shared with the pet owner"
              />
            </div>
            <div>
              <Label>Assessment / diagnosis</Label>
              <Textarea
                value={form.assessment}
                onChange={(e) => setForm((s) => ({ ...s, assessment: e.target.value }))}
                rows={2}
                placeholder="Required to complete"
              />
            </div>
            <div>
              <Label>Plan</Label>
              <Textarea
                value={form.plan}
                onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>Next visit notes</Label>
              <Input
                value={form.nextVisitNotes}
                onChange={(e) => setForm((s) => ({ ...s, nextVisitNotes: e.target.value }))}
              />
            </div>
            <div>
              <Label>Internal notes (clinic only)</Label>
              <Textarea
                value={form.internalNotes}
                onChange={(e) => setForm((s) => ({ ...s, internalNotes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => saveChart(false)} disabled={busy}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => void sendBack()} disabled={busy}>
              Send to reception
            </Button>
            <Button onClick={() => saveChart(true)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finish treatment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
