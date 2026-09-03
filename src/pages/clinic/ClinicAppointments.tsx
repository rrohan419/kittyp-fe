import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Loader2, Pencil, Plus, User } from 'lucide-react';
import { format, parseISO, isValid, isSameDay, startOfDay, addMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { useAppSelector } from '@/module/store/hooks';
import type { InvoiceFromVisitState } from '@/services/invoiceService';
import { fetchClinicInvoicePdfUrl } from '@/services/invoiceService';
import { InvoicePdfDialog } from '@/components/invoice/InvoicePdfDialog';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
import { BookingEditDialog } from '@/components/clinic/BookingEditDialog';
import { fetchMyDoctorProfile, isPracticeReady, statusLabel } from '@/services/doctorVerificationService';
import { canInviteDoctors, resolveLockedDoctorUuid, shouldLockAssigneeDoctor } from '@/utils/roles';
import { hasAuthToken } from '@/utils/authStorage';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicVisitModel,
  VisitStatus,
  VisitUrgency,
  fetchClinicBookings,
  fetchClinicDoctors,
  fetchClinicVisits,
  patchClinicVisit,
  isClinicActivated,
  CLINIC_NOT_ACTIVATED_MESSAGE,
} from '@/services/clinicService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { petNameWithType } from '@/utils/petType';
import {
  attendedVisitSurfaceClass,
  dashboardVisitSurfaceClass,
  isUrgentVisit,
  urgentVisitBadgeClass,
} from '@/utils/visitUrgency';

const FLOW_COLUMNS: { status: VisitStatus; title: string }[] = [
  { status: 'WAITLIST', title: 'Waitlist' },
  { status: 'IN_PROGRESS', title: 'With doctor' },
  { status: 'CHECKING_OUT', title: 'Checkout' },
];

const statusBadge: Record<string, string> = {
  WAITLIST: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CHECKED_IN: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  IN_PROGRESS: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  CHECKING_OUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-muted text-muted-foreground',
  NO_SHOW: 'bg-muted text-muted-foreground',
  URGENT: urgentVisitBadgeClass,
};

function bookingStart(b: ClinicBookingModel): Date | null {
  if (!b.slotStart) return null;
  const d = parseISO(b.slotStart);
  return isValid(d) ? d : null;
}

function isEditableBooking(
  b: ClinicBookingModel,
  lockAssignee: boolean,
  lockedDoctorUuid?: string
): boolean {
  const status = (b.status || '').toUpperCase();
  if (!['PENDING', 'CONFIRMED'].includes(status)) return false;
  if (lockAssignee && !lockedDoctorUuid) return false;
  if (lockAssignee && b.doctorUuid && b.doctorUuid !== lockedDoctorUuid) return false;
  return true;
}

export default function ClinicAppointments() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.authReducer.user);
  const canInvite = canInviteDoctors(user?.roles);
  const { clinicUuid, clinic, isPersonalPractice } = useActiveClinic();
  const clinicActivated = isClinicActivated(clinic?.status, clinic?.personal);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [myDoctorUuid, setMyDoctorUuid] = useState<string | null>(null);
  const [practiceReady, setPracticeReady] = useState(true);
  const [doctorStatusLabel, setDoctorStatusLabel] = useState<string | null>(null);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [editVisit, setEditVisit] = useState<ClinicVisitModel | null>(null);
  const [editBooking, setEditBooking] = useState<ClinicBookingModel | null>(null);
  const [editForm, setEditForm] = useState({
    doctorUuid: '',
    status: 'WAITLIST' as VisitStatus,
    urgency: 'ROUTINE' as VisitUrgency,
    reasonForVisit: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<VisitStatus | null>(null);
  const [previewInvoiceUuid, setPreviewInvoiceUuid] = useState<string | null>(null);

  const fetchPreviewUrl = useCallback(
    (uuid: string) => {
      if (!clinicUuid) return Promise.reject(new Error('No clinic'));
      return fetchClinicInvoicePdfUrl(clinicUuid, uuid);
    },
    [clinicUuid]
  );

  const load = useCallback(async () => {
    if (!clinicUuid) {
      setVisits([]);
      setBookings([]);
      setDoctors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [visitList, bookingPage, doctorList] = await Promise.all([
        fetchClinicVisits(clinicUuid),
        fetchClinicBookings(clinicUuid, 0, 100),
        fetchClinicDoctors(clinicUuid),
      ]);
      setVisits(visitList);
      setBookings(bookingPage?.models ?? []);
      setDoctors(doctorList);
    } catch {
      setVisits([]);
      setBookings([]);
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [clinicUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const lockAssignee = shouldLockAssigneeDoctor(user?.roles, isPersonalPractice);

  useEffect(() => {
    if (!lockAssignee) {
      setMyDoctorUuid(null);
      setPracticeReady(true);
      setDoctorStatusLabel(null);
      return;
    }
    void fetchMyDoctorProfile()
      .then((p) => {
        if (p?.uuid) setMyDoctorUuid(p.uuid);
        setPracticeReady(isPracticeReady(p?.status));
        setDoctorStatusLabel(p?.status ? statusLabel(p.status) : null);
      })
      .catch(() => {
        setPracticeReady(true);
      });
  }, [lockAssignee]);

  const lockedDoctorUuid = lockAssignee
    ? resolveLockedDoctorUuid({
        isPersonalPractice,
        viewerUserUuid: user?.uuid,
        myDoctorUuid,
        doctors,
      })
    : undefined;

  useEffect(() => {
    if (!clinicUuid) return;
    const t = setInterval(() => {
      if (!hasAuthToken()) return;
      void (async () => {
        try {
          const [visitList, bookingPage, doctorList] = await Promise.all([
            fetchClinicVisits(clinicUuid),
            fetchClinicBookings(clinicUuid, 0, 100),
            fetchClinicDoctors(clinicUuid),
          ]);
          setVisits(visitList);
          setBookings(bookingPage?.models ?? []);
          setDoctors(doctorList);
        } catch {
          /* keep board */
        }
      })();
    }, 12000);
    return () => clearInterval(t);
  }, [clinicUuid]);

  const filteredVisits = useMemo(() => {
    if (doctorFilter === 'all') return visits;
    if (doctorFilter === 'unassigned') return visits.filter((v) => !v.doctorUuid);
    return visits.filter((v) => v.doctorUuid === doctorFilter);
  }, [visits, doctorFilter]);

  const byStatus = (status: VisitStatus) =>
    filteredVisits.filter((v) =>
      status === 'WAITLIST' ? v.status === 'WAITLIST' || v.status === 'CHECKED_IN' : v.status === status
    );

  const completedToday = filteredVisits.filter((v) => v.status === 'COMPLETED');

  const upcomingBookings = useMemo(() => {
    const now = Date.now();
    return [...bookings]
      .filter((b) => {
        const status = (b.status || '').toUpperCase();
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(status)) return false;
        const start = bookingStart(b);
        if (!start) return false;
        return start.getTime() >= now;
      })
      .sort((a, b) => {
        const sa = bookingStart(a)?.getTime() ?? 0;
        const sb = bookingStart(b)?.getTime() ?? 0;
        return sa - sb;
      });
  }, [bookings]);

  /** Today's still-relevant scheduled cards for Waitlist (include until slot end passes). */
  const todayScheduledBookings = useMemo(() => {
    const today = startOfDay(new Date());
    const now = Date.now();
    return [...bookings]
      .filter((b) => {
        const status = (b.status || '').toUpperCase();
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(status)) return false;
        const start = bookingStart(b);
        if (!start || !isSameDay(start, today)) return false;
        const end = b.slotEnd ? parseISO(b.slotEnd) : addMinutes(start, 30);
        return end.getTime() >= now;
      })
      .sort((a, b) => {
        const sa = bookingStart(a)?.getTime() ?? 0;
        const sb = bookingStart(b)?.getTime() ?? 0;
        return sa - sb;
      });
  }, [bookings]);

  const doctorName = (doctorUuid?: string | null) => {
    if (!doctorUuid) return null;
    const d = doctors.find((x) => x.doctorUuid === doctorUuid);
    return d?.name || d?.email || null;
  };

  const patch = async (
    visitUuid: string,
    payload: Parameters<typeof patchClinicVisit>[2]
  ) => {
    if (!clinicUuid) return;
    setActingId(visitUuid);
    try {
      await patchClinicVisit(clinicUuid, visitUuid, payload);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Update failed';
      toast.error(msg);
    } finally {
      setActingId(null);
    }
  };

  const onDropVisit = async (visitUuid: string, status: VisitStatus) => {
    const visit = visits.find((v) => v.uuid === visitUuid);
    if (!visit || visit.status === status) return;
    // Doctors (personal + clinic-affiliated) finish treatment from the chart — no board handoff.
    if (status === 'CHECKING_OUT' && lockAssignee) return;
    const assignee = visit.doctorUuid || lockedDoctorUuid;
    if (status === 'IN_PROGRESS' && !assignee) {
      toast.error('Assign a doctor before moving to With doctor');
      return;
    }
    if (status === 'CHECKING_OUT' && !assignee) {
      toast.error('Assign a doctor before moving to Checkout');
      return;
    }
    if (status === 'COMPLETED' && !assignee) {
      toast.error('Assign a doctor before completing the visit');
      return;
    }
    if (visit.status === 'COMPLETED') {
      if (!visit.completedAt) {
        toast.error('Cannot reopen this visit');
        return;
      }
      const completedAt = parseISO(visit.completedAt);
      if (!isValid(completedAt) || Date.now() - completedAt.getTime() > 30 * 60 * 1000) {
        toast.error('Can only reopen a completed visit within 30 minutes');
        return;
      }
      if (visit.parentRating != null && visit.parentRating > 0) {
        toast.error('Cannot reopen a visit that already has a parent rating');
        return;
      }
    }
    if (
      visit.status === 'CHECKING_OUT' &&
      (status === 'WAITLIST' || status === 'CHECKED_IN' || status === 'IN_PROGRESS')
    ) {
      if (!visit.checkingOutAt) {
        toast.error('Can only move out of Checkout within 30 minutes');
        return;
      }
      const checkingOutAt = parseISO(visit.checkingOutAt);
      if (!isValid(checkingOutAt) || Date.now() - checkingOutAt.getTime() > 30 * 60 * 1000) {
        toast.error('Can only move out of Checkout within 30 minutes');
        return;
      }
    }
    await patch(
      visitUuid,
      !visit.doctorUuid && lockedDoctorUuid
        ? { status, doctorUuid: lockedDoctorUuid }
        : { status }
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Clinic flow</h1>
          <p className="text-sm text-muted-foreground">
            Today&apos;s visit board and upcoming appointments. Use + to check someone in or schedule
            for later.
          </p>
          {lockAssignee && !practiceReady ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              Certificates must be verified by admin before you can take appointments
              {doctorStatusLabel ? ` (current: ${doctorStatusLabel})` : ''}.
            </p>
          ) : null}
          {clinic && !clinicActivated ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              {CLINIC_NOT_ACTIVATED_MESSAGE}
              {clinic.status ? ` (current: ${clinic.status})` : ''}.
            </p>
          ) : null}
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          disabled={
            !clinicUuid ||
            !clinicActivated ||
            (lockAssignee && !lockedDoctorUuid) ||
            (lockAssignee && !practiceReady)
          }
          aria-label="Add appointment"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="flow">
          <TabsList className="w-full max-w-full h-auto flex flex-wrap justify-start">
            <TabsTrigger value="flow">Today&apos;s flow</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
            <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {FLOW_COLUMNS.map((col) => (
                <Card
                  key={col.status}
                  className={`min-h-[280px] transition-colors ${
                    dragOverStatus === col.status ? 'ring-2 ring-primary/60 bg-primary/5' : ''
                  }`}
                  onDragOver={(e) => {
                    if (lockAssignee && col.status === 'CHECKING_OUT') return;
                    e.preventDefault();
                    setDragOverStatus(col.status);
                  }}
                  onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverStatus(null);
                    const visitUuid = e.dataTransfer.getData('text/visit-uuid');
                    if (visitUuid) void onDropVisit(visitUuid, col.status);
                  }}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      {col.title}
                      <Badge variant="secondary">
                        {col.status === 'WAITLIST'
                          ? byStatus(col.status).length + todayScheduledBookings.length
                          : byStatus(col.status).length}
                      </Badge>
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground font-normal">Drop visits here</p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {col.status === 'WAITLIST' &&
                      todayScheduledBookings.map((b) => {
                        const start = bookingStart(b);
                        const doc = doctorName(b.doctorUuid);
                        const canEdit = isEditableBooking(b, lockAssignee, lockedDoctorUuid);
                        return (
                          <div
                            key={`booking-${b.uuid}`}
                            className="rounded-md border border-sky-200 bg-sky-50/60 dark:bg-sky-950/20 dark:border-sky-900 p-2.5 space-y-1.5 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium min-w-0">
                                {petNameWithType(b.petName, b.species)}
                                <span className="text-muted-foreground font-normal">
                                  {' '}
                                  · {b.ownerName || 'Owner'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                                  Scheduled
                                </Badge>
                                {canEdit ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    title="Edit appointment"
                                    onClick={() => setEditBooking(b)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {start ? format(start, 'p') : '—'}
                              {doc ? ` · Dr. ${doc.replace(/^Dr\.?\s*/i, '')}` : ''}
                            </div>
                            {b.notes ? (
                              <p className="text-xs text-muted-foreground truncate">{b.notes}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    {byStatus(col.status).map((v) => (
                      <VisitCard
                        key={v.uuid}
                        visit={v}
                        doctors={doctors}
                        busy={actingId === v.uuid}
                        lockAssignee={lockAssignee}
                        lockedDoctorUuid={lockedDoctorUuid}
                        canSendToCheckout={!lockAssignee}
                        canInvite={canInvite}
                        onCheckIn={() => {
                          const assignee = v.doctorUuid || lockedDoctorUuid;
                          if (!assignee) {
                            toast.error('Assign a doctor before moving to With doctor');
                            return;
                          }
                          patch(
                            v.uuid,
                            !v.doctorUuid && lockedDoctorUuid
                              ? { status: 'IN_PROGRESS', doctorUuid: lockedDoctorUuid }
                              : { status: 'IN_PROGRESS' }
                          );
                        }}
                        onCheckout={() => {
                          const assignee = v.doctorUuid || lockedDoctorUuid;
                          if (!assignee) {
                            toast.error('Assign a doctor before moving to Checkout');
                            return;
                          }
                          patch(v.uuid, { status: 'CHECKING_OUT' });
                        }}
                        onComplete={() => {
                          const assignee = v.doctorUuid || lockedDoctorUuid;
                          if (!assignee) {
                            toast.error('Assign a doctor before completing the visit');
                            return;
                          }
                          patch(
                            v.uuid,
                            !v.doctorUuid && lockedDoctorUuid
                              ? { status: 'COMPLETED', doctorUuid: lockedDoctorUuid }
                              : { status: 'COMPLETED' }
                          );
                        }}
                        onInvoice={() => {
                          if (v.invoiceUuid) {
                            setPreviewInvoiceUuid(v.invoiceUuid);
                            return;
                          }
                          const fromVisit: InvoiceFromVisitState = {
                            visitUuid: v.uuid,
                            clinicUuid: v.clinicUuid || clinicUuid || undefined,
                            petUuid: v.petUuid,
                            petName: v.petName,
                            ownerName: v.ownerName || undefined,
                            ownerPhone: v.ownerPhone || undefined,
                            ownerEmail: v.ownerEmail || undefined,
                            reason: v.reasonForVisit || undefined,
                            diagnosis: v.chart?.assessment || undefined,
                            doctorNotes: v.chart?.plan || undefined,
                            nextVisitNotes: v.chart?.nextVisitNotes || undefined,
                          };
                          navigate(`/clinic/invoices?visit=${encodeURIComponent(v.uuid)}`, {
                            state: { fromVisit },
                          });
                        }}
                        onCancel={() => patch(v.uuid, { status: 'CANCELLED' })}
                        onAssign={(doctorUuid) =>
                          patch(v.uuid, { doctorUuid: doctorUuid || null })
                        }
                        onEdit={() => {
                          setEditVisit(v);
                          setEditForm({
                            doctorUuid: v.doctorUuid || lockedDoctorUuid || '',
                            status: v.status === 'CHECKED_IN' ? 'WAITLIST' : v.status,
                            urgency: v.urgency,
                            reasonForVisit: v.reasonForVisit || '',
                          });
                        }}
                      />
                    ))}
                    {byStatus(col.status).length === 0 &&
                      !(col.status === 'WAITLIST' && todayScheduledBookings.length > 0) && (
                      <p className="text-xs text-muted-foreground py-6 text-center">Empty</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="done" className="mt-4 space-y-2">
            {completedToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed visits today.</p>
            ) : (
              completedToday.map((v) => {
                const completedAt = v.completedAt ? parseISO(v.completedAt) : null;
                const rated = v.parentRating != null && v.parentRating > 0;
                const canReopen =
                  !rated &&
                  completedAt != null &&
                  isValid(completedAt) &&
                  Date.now() - completedAt.getTime() <= 30 * 60 * 1000;
                return (
                  <Card
                    key={v.uuid}
                    draggable={canReopen}
                    onDragStart={(e) => {
                      if (!canReopen) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.setData('text/visit-uuid', v.uuid);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className={cn(
                      attendedVisitSurfaceClass,
                      canReopen ? 'cursor-grab active:cursor-grabbing' : undefined
                    )}
                  >
                    <CardContent className="py-3 flex justify-between gap-2 text-sm">
                      <div>
                        <div className="font-medium">
                          {petNameWithType(v.petName, v.species)} · {v.ownerName || 'Owner'}
                          {v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                        </div>
                        <div className="text-muted-foreground">
                          {v.doctorName ? `Dr. ${v.doctorName.replace(/^Dr\.?\s*/i, '')} · ` : ''}
                          {v.chart?.assessment || v.reasonForVisit || 'Visit'}
                        </div>
                        {canReopen && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Drag onto Today&apos;s flow within 30 min to reopen
                          </p>
                        )}
                      </div>
                      <Badge className={statusBadge.COMPLETED}>Completed</Badge>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-4 space-y-2">
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming appointments. Use + → Schedule to book a future slot for a doctor.
              </p>
            ) : (
              upcomingBookings.map((b) => {
                const start = bookingStart(b);
                const doc = doctorName(b.doctorUuid);
                const canEdit = isEditableBooking(b, lockAssignee, lockedDoctorUuid);
                return (
                  <Card key={b.uuid}>
                    <CardContent className="py-3 text-sm flex justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {petNameWithType(b.petName, b.species)} · {b.ownerName}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {start ? format(start, 'PPp') : '—'}
                          {doc ? ` · Dr. ${doc.replace(/^Dr\.?\s*/i, '')}` : ''}
                          {b.mode ? ` · ${b.mode}` : ''}
                        </div>
                        {b.notes ? (
                          <div className="text-muted-foreground text-xs mt-0.5">{b.notes}</div>
                        ) : null}
                      </div>
                      <div className="flex items-start gap-1">
                        <Badge variant="outline">{b.status}</Badge>
                        {canEdit ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Edit appointment"
                            onClick={() => setEditBooking(b)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}

      {clinicUuid && (
        <WalkInDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          clinicUuid={clinicUuid}
          doctors={doctors}
          lockedDoctorUuid={lockedDoctorUuid}
          onCreated={load}
        />
      )}

      {clinicUuid && (
        <BookingEditDialog
          open={!!editBooking}
          onOpenChange={(o) => !o && setEditBooking(null)}
          clinicUuid={clinicUuid}
          booking={editBooking}
          doctors={doctors}
          lockAssignee={lockAssignee}
          lockedDoctorUuid={lockedDoctorUuid}
          onSaved={load}
        />
      )}

      <Dialog open={!!editVisit} onOpenChange={(o) => !o && setEditVisit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit visit · {editVisit?.petName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {lockAssignee ? null : (
            <div>
              <Label>Assign doctor</Label>
              <Select
                value={editForm.doctorUuid || 'none'}
                onValueChange={(v) =>
                  setEditForm((s) => ({ ...s, doctorUuid: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {doctors
                    .filter((d) => d.isActive !== false)
                    .map((d) => (
                      <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                        {d.name || d.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {doctors.filter((d) => d.isActive !== false).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {canInvite
                    ? 'No doctors on this clinic. Invite doctors first.'
                    : 'No doctors on this clinic.'}
                </p>
              )}
            </div>
            )}
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((s) => ({ ...s, status: v as VisitStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLOW_COLUMNS.filter(
                    (c) =>
                      c.status !== 'CHECKING_OUT' ||
                      !lockAssignee ||
                      editVisit?.status === 'CHECKING_OUT'
                  ).map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.title}
                    </SelectItem>
                  ))}
                  {(editVisit?.status === 'CHECKING_OUT' || editForm.status === 'COMPLETED') && (
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  )}
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgency</Label>
              <Select
                value={editForm.urgency}
                onValueChange={(v) => setEditForm((s) => ({ ...s, urgency: v as VisitUrgency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={editForm.reasonForVisit}
                onChange={(e) => setEditForm((s) => ({ ...s, reasonForVisit: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVisit(null)}>
              Cancel
            </Button>
            <Button
              disabled={editSaving || !clinicUuid || !editVisit}
              onClick={async () => {
                if (!clinicUuid || !editVisit) return;
                const assignee = editForm.doctorUuid || lockedDoctorUuid || '';
                if (editForm.status === 'IN_PROGRESS' && !assignee) {
                  toast.error('Assign a doctor before moving to With doctor');
                  return;
                }
                if (editForm.status === 'CHECKING_OUT' && !assignee) {
                  toast.error('Assign a doctor before moving to Checkout');
                  return;
                }
                if (editForm.status === 'COMPLETED' && !assignee) {
                  toast.error('Assign a doctor before completing the visit');
                  return;
                }
                if (
                  editVisit.status === 'CHECKING_OUT' &&
                  (editForm.status === 'WAITLIST' ||
                    editForm.status === 'CHECKED_IN' ||
                    editForm.status === 'IN_PROGRESS')
                ) {
                  if (!editVisit.checkingOutAt) {
                    toast.error('Can only move out of Checkout within 30 minutes');
                    return;
                  }
                  const checkingOutAt = parseISO(editVisit.checkingOutAt);
                  if (
                    !isValid(checkingOutAt) ||
                    Date.now() - checkingOutAt.getTime() > 30 * 60 * 1000
                  ) {
                    toast.error('Can only move out of Checkout within 30 minutes');
                    return;
                  }
                }
                setEditSaving(true);
                try {
                  await patchClinicVisit(clinicUuid, editVisit.uuid, {
                    doctorUuid: assignee || null,
                    status: editForm.status,
                    urgency: editForm.urgency,
                    reasonForVisit: editForm.reasonForVisit,
                  });
                  toast.success('Visit updated');
                  setEditVisit(null);
                  await load();
                } catch (e: unknown) {
                  const msg =
                    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    'Could not update visit';
                  toast.error(msg);
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InvoicePdfDialog
        open={Boolean(previewInvoiceUuid)}
        invoiceUuid={previewInvoiceUuid}
        onOpenChange={(open) => {
          if (!open) setPreviewInvoiceUuid(null);
        }}
        fetchUrl={fetchPreviewUrl}
      />
    </div>
  );
}

function VisitCard({
  visit,
  doctors,
  busy,
  lockAssignee,
  lockedDoctorUuid,
  canSendToCheckout,
  canInvite,
  onCheckIn,
  onCheckout,
  onComplete,
  onInvoice,
  onCancel,
  onAssign,
  onEdit,
}: {
  visit: ClinicVisitModel;
  doctors: ClinicDoctorModel[];
  busy: boolean;
  lockAssignee?: boolean;
  lockedDoctorUuid?: string;
  canSendToCheckout?: boolean;
  canInvite?: boolean;
  onCheckIn: () => void;
  onCheckout: () => void;
  onComplete: () => void;
  onInvoice: () => void;
  onCancel: () => void;
  onAssign: (doctorUuid: string) => void;
  onEdit: () => void;
}) {
  const lockedDoctor = lockedDoctorUuid
    ? doctors.find((d) => d.doctorUuid === lockedDoctorUuid)
    : undefined;
  const displayDoctorName = visit.doctorName || lockedDoctor?.name || lockedDoctor?.email;
  const activeDoctors = doctors.filter(
    (d) =>
      d.isActive !== false &&
      d.doctorUuid &&
      (isPracticeReady(d.status) || d.doctorUuid === visit.doctorUuid)
  );
  const checkingOutAt = visit.checkingOutAt ? parseISO(visit.checkingOutAt) : null;
  const canLeaveCheckout =
    visit.status !== 'CHECKING_OUT' ||
    (checkingOutAt != null &&
      isValid(checkingOutAt) &&
      Date.now() - checkingOutAt.getTime() <= 30 * 60 * 1000);
  const canEditVisit =
    visit.status !== 'CHECKING_OUT' ||
    (checkingOutAt != null &&
      isValid(checkingOutAt) &&
      Date.now() - checkingOutAt.getTime() <= 30 * 60 * 1000);
  const urgent = isUrgentVisit(visit.urgency);
  const attended = visit.status === 'CHECKING_OUT' || visit.status === 'COMPLETED';
  const waiting = visit.status === 'WAITLIST' || visit.status === 'CHECKED_IN';
  const hasDoctor = Boolean(visit.doctorUuid || lockedDoctorUuid);
  const canDrag = !busy && canLeaveCheckout && (!waiting || hasDoctor);
  return (
    <div
      className={cn(
        'rounded-md border p-2.5 space-y-2',
        attended ? attendedVisitSurfaceClass : dashboardVisitSurfaceClass(urgent),
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
      aria-label={urgent ? `Urgent visit: ${visit.petName}` : undefined}
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/visit-uuid', visit.uuid);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="font-medium text-sm">{petNameWithType(visit.petName, visit.species)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {visit.ownerName || 'Owner'}
            {visit.ownerPhone ? ` · ${visit.ownerPhone}` : ''}
          </div>
          {displayDoctorName && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Dr. {displayDoctorName.replace(/^Dr\.?\s*/i, '')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {urgent && <Badge className={statusBadge.URGENT}>Urgent</Badge>}
          {canEditVisit ? (
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit} title="Edit visit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span
              className="text-[10px] text-muted-foreground px-1"
              title="Checkout edit window (30 min) has ended"
            >
              Locked
            </span>
          )}
        </div>
      </div>
      {visit.reasonForVisit && (
        <p className="text-xs text-muted-foreground line-clamp-2">{visit.reasonForVisit}</p>
      )}
      {visit.status === 'CHECKING_OUT' && visit.chart?.assessment && (
        <p className="text-[11px] text-foreground line-clamp-2">
          Dx: {visit.chart.assessment}
        </p>
      )}
      {lockAssignee ? null : (
        <>
          <Select
            value={visit.doctorUuid || 'none'}
            onValueChange={(v) => onAssign(v === 'none' ? '' : v)}
            disabled={busy || !canEditVisit}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Assign doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {activeDoctors.map((d) => (
                <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                  {d.name || d.email || 'Doctor'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeDoctors.length === 0 && (
            <p className="text-[10px] text-amber-600">
              {canInvite ? 'No clinic doctors — invite under Doctors' : 'No clinic doctors assigned'}
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-1">
        {visit.status === 'WAITLIST' || visit.status === 'CHECKED_IN' ? (
          <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={busy} onClick={onCheckIn}>
            With doctor
          </Button>
        ) : null}
        {visit.status === 'IN_PROGRESS' && canSendToCheckout && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onCheckout}>
            Move to checkout
          </Button>
        )}
        {visit.status === 'CHECKING_OUT' && (
          <>
            <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={busy} onClick={onComplete}>
              Complete checkout
            </Button>
            {!visit.invoiceUuid && (
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onInvoice}>
                Create invoice
              </Button>
            )}
          </>
        )}
        {(visit.status === 'COMPLETED' || visit.status === 'CHECKING_OUT') && visit.invoiceUuid && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onInvoice}>
            View invoice
          </Button>
        )}
        {visit.status === 'COMPLETED' && !visit.invoiceUuid && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onInvoice}>
            Create invoice
          </Button>
        )}
        {(visit.status === 'WAITLIST' || visit.status === 'CHECKED_IN') && (
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {visit.createdAt && (
        <div className="text-[10px] text-muted-foreground">
          Since {format(parseISO(visit.createdAt), 'p')}
        </div>
      )}
    </div>
  );
}
