import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Link2,
  Apple,
} from 'lucide-react';
import { PrescriptionsTab } from '@/components/chart/PrescriptionsTab';
import { parsePatientDashboardTab } from '@/components/chart/chartTabs';
import { prescriptionsFromVisits } from '@/components/chart/prescriptionsFromVisits';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicPetMedicalProfileModel,
  ClinicVisitModel,
  fetchClinicPetMedicalProfile,
  fetchClinicPetVisits,
} from '@/services/clinicService';
import { PetPhoto } from '@/components/clinic/PetPhoto';
import { formatPetDobWithAge } from '@/utils/petAge';
import { toast } from 'sonner';
import { saveDoctorVisitChart } from '@/services/visitService';
import { parseApiErrorMessage } from '@/utils/validation';
import { canEditVisitChart } from '@/utils/visitChartLock';

const WRITABLE_VISIT = ['IN_PROGRESS', 'CHECKING_OUT', 'CHECKED_IN', 'WAITLIST', 'COMPLETED'];

function EmptyTab({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground py-8 text-center">
      No {label.toLowerCase()} recorded yet.
    </p>
  );
}

export default function ClinicPatientDashboard() {
  const { petUuid = '' } = useParams();
  const { pathname } = useLocation();
  const isDoctorPortal = pathname.startsWith('/doctor');
  const patientsPath = isDoctorPortal ? '/doctor/patients' : '/clinic/patients';
  const patientsLabel = isDoctorPortal ? 'Patients' : 'Clients & Pets';
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parsePatientDashboardTab(searchParams.get('tab'));
  const { clinicUuid, loading: clinicLoading, error: clinicError } = useActiveClinic();
  const [profile, setProfile] = useState<ClinicPetMedicalProfileModel | null>(null);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rxDraft, setRxDraft] = useState('');
  const [rxSaving, setRxSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (clinicLoading) return;
      if (!clinicUuid) {
        setLoading(false);
        setLoadError('No active clinic selected');
        setProfile(null);
        setVisits([]);
        return;
      }
      if (!petUuid) {
        setLoading(false);
        setLoadError('Missing pet');
        setProfile(null);
        setVisits([]);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const [data, visitList] = await Promise.all([
          fetchClinicPetMedicalProfile(clinicUuid, petUuid),
          fetchClinicPetVisits(clinicUuid, petUuid).catch(() => [] as ClinicVisitModel[]),
        ]);
        if (cancelled) return;
        setProfile(data);
        setVisits(visitList);
      } catch (err: unknown) {
        if (!cancelled) {
          setProfile(null);
          setVisits([]);
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to load pet profile';
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid, petUuid, clinicLoading]);

  const prescriptionHistory = useMemo(() => prescriptionsFromVisits(visits), [visits]);

  const onTabChange = (value: string) => {
    const next = parsePatientDashboardTab(value);
    const params = new URLSearchParams(searchParams);
    if (next === 'timeline') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const savePrescription = async () => {
    const text = rxDraft.trim();
    if (!text) {
      toast.error('Write a prescription first');
      return;
    }
    if (!clinicUuid) return;
    const openVisit = [...visits]
      .filter((v) => canEditVisitChart(v))
      .sort((a, b) => WRITABLE_VISIT.indexOf(a.status) - WRITABLE_VISIT.indexOf(b.status))[0];
    if (!openVisit) {
      toast.error('Attend a visit to add a prescription');
      return;
    }
    if (!canEditVisitChart(openVisit)) {
      toast.error('Prescription can no longer be edited. More than one hour has passed since checkout.');
      return;
    }
    setRxSaving(true);
    try {
      await saveDoctorVisitChart(openVisit.uuid, { plan: text });
      const visitList = await fetchClinicPetVisits(clinicUuid, petUuid).catch(() => [] as ClinicVisitModel[]);
      setVisits(visitList);
      setRxDraft('');
      toast.success('Prescription saved');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to save prescription'));
    } finally {
      setRxSaving(false);
    }
  };

  if (clinicLoading || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading pet profile…
      </div>
    );
  }

  if (clinicError || loadError || !profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={patientsPath}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {patientsLabel.toLowerCase()}
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">
          {loadError || clinicError || 'Pet not found for this clinic.'}
        </p>
      </div>
    );
  }

  const { pet, owner } = profile;
  const openVisitForRx = [...visits]
    .filter((v) => canEditVisitChart(v))
    .sort((a, b) => WRITABLE_VISIT.indexOf(a.status) - WRITABLE_VISIT.indexOf(b.status))[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link to={patientsPath}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {patientsLabel}
          </Link>
        </Button>
        {owner?.ownerUuid && !isDoctorPortal && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/clinic/owners/${owner.ownerUuid}`}>View client</Link>
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex-1 order-2 md:order-1 p-5 sm:p-8 flex flex-col justify-center gap-6 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight">{pet.name}</h1>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">Patient</Badge>
                {owner?.linked && (
                  <Badge variant="secondary" className="gap-1">
                    <Link2 className="h-3 w-3" /> Owner linked
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                {[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Pet'}
              </p>
              {isDoctorPortal && (
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to={`/doctor/nutrition/new?petUuid=${pet.petUuid}`}>
                    <Apple className="h-4 w-4 mr-1.5" />
                    Create nutrition plan
                  </Link>
                </Button>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs mb-1">Gender</dt>
                <dd className="font-medium">{pet.gender || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-1">Date of birth</dt>
                <dd className="font-medium">
                  {pet.dateOfBirth ? formatPetDobWithAge(pet.dateOfBirth) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs mb-1">Weight</dt>
                <dd className="font-medium">{pet.weight || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs mb-1">Microchip</dt>
                <dd className="font-medium">{pet.microchipNumber || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground text-xs mb-1">Pet ID</dt>
                <dd className="font-medium font-mono text-xs break-all">{pet.petUuid}</dd>
              </div>
            </dl>

            <div className="border-t pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Owner</p>
                <p className="font-medium">{owner?.name || pet.ownerName}</p>
                <p className="text-muted-foreground text-xs mt-2 mb-1">Owner ID</p>
                <p className="font-medium font-mono text-xs break-all">
                  {owner?.ownerUuid || pet.ownerUuid || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Contact</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{owner?.phone || pet.ownerPhone || '—'}</span>
                </p>
                <p className="font-medium flex items-center gap-2 mt-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{owner?.email || pet.ownerEmail || '—'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 w-full md:w-[42%] shrink-0 p-4 md:p-5 flex items-center justify-center bg-muted/20">
            <PetPhoto
              photoUrl={pet.photoUrl}
              name={pet.name}
              species={pet.species}
              seed={pet.globalPetId || pet.petUuid}
              variant="cover"
              fit="contain"
              rounded="2xl"
              className="h-52 sm:h-64 md:h-72 w-full rounded-2xl bg-background"
            />
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start h-auto gap-1">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="appointments">Visits</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
          <TabsTrigger value="labs">Lab Reports</TabsTrigger>
          <TabsTrigger value="surgeries">Surgeries</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4 space-y-3">
          {profile.timeline.length ? (
            profile.timeline.map((ev) => (
              <Card key={ev.uuid} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{ev.title || ev.type}</p>
                      {ev.description && (
                        <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">{ev.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {ev.date ? format(parseISO(ev.date), 'MMM d, yyyy') : '—'}
                    {ev.status ? ` · ${ev.status}` : ''}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyTab label="Timeline events" />
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-3">
          {visits.length ? (
            visits.map((v) => (
              <Card key={v.uuid} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {v.chart?.assessment || v.reasonForVisit || (v.source === 'WALK_IN' ? 'Walk-in' : 'Visit')}
                      {v.doctorName ? ` · Dr. ${v.doctorName.replace(/^Dr\.?\s*/i, '')}` : ''}
                    </p>
                    {v.chart?.examinationNotes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        Report: {v.chart.examinationNotes}
                      </p>
                    )}
                    {v.chart?.plan && (
                      <p className="text-xs text-muted-foreground line-clamp-2">Plan: {v.chart.plan}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {v.completedAt
                        ? format(parseISO(v.completedAt), 'MMM d, yyyy · h:mm a')
                        : v.createdAt
                          ? format(parseISO(v.createdAt), 'MMM d, yyyy · h:mm a')
                          : '—'}
                    </p>
                  </div>
                  <Badge variant="secondary">{v.status.replace('_', ' ')}</Badge>
                </CardContent>
              </Card>
            ))
          ) : profile.appointments.length ? (
            profile.appointments.map((b) => (
              <Card key={b.uuid} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {b.slotStart ? format(parseISO(b.slotStart), 'MMM d, yyyy · h:mm a') : 'Appointment'}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.notes || b.mode || 'Visit'}</p>
                  </div>
                  <Badge variant="secondary">{b.status}</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyTab label="Visits" />
          )}
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4 space-y-3">
          {profile.vaccinations.length ? (
            profile.vaccinations.map((v) => (
              <Card key={v.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{v.vaccineName}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {v.dueDate ? format(parseISO(v.dueDate), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <Badge variant={v.completed ? 'secondary' : 'outline'}>
                    {v.completed ? 'Completed' : 'Pending'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyTab label="Vaccinations" />
          )}
        </TabsContent>

        {tab === 'prescriptions' ? (
          <TabsContent value="prescriptions" className="mt-4">
            <PrescriptionsTab
              editable={!!openVisitForRx && canEditVisitChart(openVisitForRx)}
              plan={rxDraft}
              onPlanChange={setRxDraft}
              onSavePrescription={savePrescription}
              saving={rxSaving}
              pet={{
                name: pet.name,
                sex: pet.gender,
                dateOfBirth: pet.dateOfBirth,
                species: pet.species,
                breed: pet.breed,
                weight: pet.weight,
                ownerName: owner?.name || pet.ownerName,
              }}
              clinicUuid={clinicUuid}
              petUuid={pet.petUuid}
              history={prescriptionHistory}
              thisVisit={
                openVisitForRx
                  ? {
                      uuid: openVisitForRx.uuid,
                      doctorName: openVisitForRx.doctorName,
                      date: openVisitForRx.startedAt || openVisitForRx.createdAt,
                    }
                  : null
              }
            />
          </TabsContent>
        ) : null}

        <TabsContent value="labs" className="mt-4">
          <EmptyTab label="Lab reports" />
        </TabsContent>
        <TabsContent value="surgeries" className="mt-4">
          <EmptyTab label="Surgeries" />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          {profile.invoices.length ? (
            profile.invoices.map((inv) => (
              <Card key={inv.uuid} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {inv.currency || 'INR'} {inv.amount ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inv.createdAt ? format(parseISO(inv.createdAt), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <Badge variant="outline">{inv.status || '—'}</Badge>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyTab label="Invoices" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
