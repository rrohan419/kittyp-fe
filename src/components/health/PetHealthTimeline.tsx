import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Loader2, Stethoscope } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { ClinicVisitModel, VisitStatus } from '@/services/clinicService';
import { fetchParentPetVisits } from '@/services/visitService';

interface PetHealthTimelineProps {
  petId: string;
  petName: string;
  /** Poll interval ms; default 15s so clinic/doctor status changes appear. */
  pollMs?: number;
}

const CURRENT: VisitStatus[] = ['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKING_OUT'];
const PAST: VisitStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

function visitWhen(v: ClinicVisitModel): Date | null {
  const raw = v.completedAt || v.startedAt || v.checkedInAt || v.createdAt;
  if (!raw) return null;
  const d = parseISO(raw);
  return isValid(d) ? d : null;
}

function doctorLine(v: ClinicVisitModel): string {
  if (!v.doctorName) return 'Attending doctor not listed';
  const name = `Dr. ${v.doctorName.replace(/^Dr\.?\s*/i, '')}`;
  const bits: string[] = [name];
  if (v.doctorSpecialization) bits.push(v.doctorSpecialization);
  if (v.doctorExperienceYears != null && v.doctorExperienceYears > 0) {
    const y = Math.round(v.doctorExperienceYears);
    bits.push(`${y} yr${y === 1 ? '' : 's'} experience`);
  }
  return bits.join(' · ');
}

function statusLabel(status: VisitStatus): string {
  switch (status) {
    case 'WAITLIST':
      return 'Waitlist';
    case 'CHECKED_IN':
      return 'Checked in';
    case 'IN_PROGRESS':
      return 'With doctor';
    case 'CHECKING_OUT':
      return 'Checkout';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No show';
    default:
      return status;
  }
}

function statusBadgeClass(status: VisitStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case 'CHECKING_OUT':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'bg-muted text-muted-foreground';
    default:
      return '';
  }
}

export const PetHealthTimeline: React.FC<PetHealthTimelineProps> = ({
  petId,
  petName,
  pollMs = 15000,
}) => {
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'all'>('current');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const list = await fetchParentPetVisits(petId);
      setVisits(list);
    } catch {
      if (!quiet) setVisits([]);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void load(false);
    const t = setInterval(() => void load(true), pollMs);
    const onFocus = () => void load(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [load, pollMs]);

  const current = useMemo(() => visits.filter((v) => CURRENT.includes(v.status)), [visits]);
  const history = useMemo(() => visits.filter((v) => PAST.includes(v.status)), [visits]);

  useEffect(() => {
    if (loading) return;
    if (current.length === 0 && history.length > 0) {
      setActiveTab('history');
    } else if (current.length > 0) {
      setActiveTab('current');
    }
  }, [loading, current.length, history.length]);

  const renderVisit = (v: ClinicVisitModel) => {
    const when = visitWhen(v);
    const showReport = Boolean(
      v.chart?.assessment || v.chart?.examinationNotes || v.chart?.plan
    );
    return (
      <Card key={v.uuid} className="border-0 shadow-sm">
        <CardContent className="p-4 flex gap-3">
          <div className="mt-0.5 rounded-full bg-primary/10 p-2 h-fit">
            <Stethoscope className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {v.chart?.assessment || v.reasonForVisit || 'Clinic visit'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{doctorLine(v)}</p>
                {v.clinicName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{v.clinicName}</p>
                )}
              </div>
              <Badge variant="secondary" className={statusBadgeClass(v.status)}>
                {statusLabel(v.status)}
              </Badge>
            </div>
            {showReport && (
              <>
                {v.chart?.assessment && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Diagnosis</p>
                    <p className="text-sm">{v.chart.assessment}</p>
                  </div>
                )}
                {v.chart?.examinationNotes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Report</p>
                    <p className="text-sm whitespace-pre-wrap">{v.chart.examinationNotes}</p>
                  </div>
                )}
                {v.chart?.plan && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Plan</p>
                    <p className="text-sm">{v.chart.plan}</p>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {when ? format(when, 'MMM d, yyyy · h:mm a') : '—'}
              {v.source === 'WALK_IN' ? ' · Walk-in' : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const empty = (msg: string) => (
    <p className="text-sm text-muted-foreground text-center py-8">{msg}</p>
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{petName}&apos;s clinic visits & reports</CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Updates when the clinic or doctor moves your pet through the visit flow.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="current">
                Current ({current.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History ({history.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({visits.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="mt-4">
              <ScrollArea className="max-h-[480px] pr-2">
                <div className="space-y-3">
                  {current.length
                    ? current.map(renderVisit)
                    : empty(`No active visit for ${petName}. Walk-ins and check-ins appear here.`)}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {history.length
                  ? history.map(renderVisit)
                  : empty('No past visits yet. Completed visits include diagnosis and report.')}
              </div>
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <ScrollArea className="max-h-[520px] pr-2">
                <div className="space-y-3">
                  {visits.length
                    ? visits.map(renderVisit)
                    : empty(`No clinic visits yet for ${petName}.`)}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
