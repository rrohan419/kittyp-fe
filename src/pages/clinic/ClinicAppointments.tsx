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
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
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
} from '@/services/clinicService';
import { toast } from 'sonner';

const FLOW_COLUMNS: { status: VisitStatus; title: string }[] = [
  { status: 'WAITLIST', title: 'Waitlist' },
  { status: 'CHECKED_IN', title: 'Checked in' },
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
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function bookingStart(b: ClinicBookingModel): Date | null {
  if (!b.slotStart) return null;
  const d = parseISO(b.slotStart);
  return isValid(d) ? d : null;
}

export default function ClinicAppointments() {
  const { clinicUuid } = useActiveClinic();
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [editVisit, setEditVisit] = useState<ClinicVisitModel | null>(null);
  const [editForm, setEditForm] = useState({
    doctorUuid: '',
    status: 'WAITLIST' as VisitStatus,
    urgency: 'ROUTINE' as VisitUrgency,
    reasonForVisit: '',
  });
  const [editSaving, setEditSaving] = useState(false);

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

  useEffect(() => {
    if (!clinicUuid) return;
    const t = setInterval(() => {
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
    filteredVisits.filter((v) => v.status === status);

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

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clinic flow</h1>
          <p className="text-sm text-muted-foreground">
            Today&apos;s visit board and upcoming appointments. Use + to check someone in or schedule
            for later.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={!clinicUuid} aria-label="Add appointment">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-[200px]">
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
          <TabsList>
            <TabsTrigger value="flow">Today&apos;s flow</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
            <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {FLOW_COLUMNS.map((col) => (
                <Card key={col.status} className="min-h-[280px]">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      {col.title}
                      <Badge variant="secondary">
                        {col.status === 'WAITLIST'
                          ? byStatus(col.status).length + todayScheduledBookings.length
                          : byStatus(col.status).length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {col.status === 'WAITLIST' &&
                      todayScheduledBookings.map((b) => {
                        const start = bookingStart(b);
                        const doc = doctorName(b.doctorUuid);
                        return (
                          <div
                            key={`booking-${b.uuid}`}
                            className="rounded-md border border-sky-200 bg-sky-50/60 dark:bg-sky-950/20 dark:border-sky-900 p-2.5 space-y-1.5 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium min-w-0">
                                {b.petName}
                                <span className="text-muted-foreground font-normal">
                                  {' '}
                                  · {b.ownerName || 'Owner'}
                                </span>
                              </div>
                              <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 shrink-0">
                                Scheduled
                              </Badge>
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
                        onCheckIn={() => {
                          if (!v.doctorUuid) {
                            toast.error('Assign a doctor first — they are notified on check-in');
                            return;
                          }
                          patch(v.uuid, { status: 'CHECKED_IN' });
                        }}
                        onCheckout={() => patch(v.uuid, { status: 'CHECKING_OUT' })}
                        onComplete={() => patch(v.uuid, { status: 'COMPLETED' })}
                        onCancel={() => patch(v.uuid, { status: 'CANCELLED' })}
                        onAssign={(doctorUuid) =>
                          patch(v.uuid, { doctorUuid: doctorUuid || null })
                        }
                        onEdit={() => {
                          setEditVisit(v);
                          setEditForm({
                            doctorUuid: v.doctorUuid || '',
                            status: v.status,
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
              completedToday.map((v) => (
                <Card key={v.uuid}>
                  <CardContent className="py-3 flex justify-between gap-2 text-sm">
                    <div>
                      <div className="font-medium">
                        {v.petName} · {v.ownerName || 'Owner'}
                        {v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                      </div>
                      <div className="text-muted-foreground">
                        {v.doctorName ? `Dr. ${v.doctorName.replace(/^Dr\.?\s*/i, '')} · ` : ''}
                        {v.chart?.assessment || v.reasonForVisit || 'Visit'}
                      </div>
                    </div>
                    <Badge className={statusBadge.COMPLETED}>Completed</Badge>
                  </CardContent>
                </Card>
              ))
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
                return (
                  <Card key={b.uuid}>
                    <CardContent className="py-3 text-sm flex justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {b.petName} · {b.ownerName}
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
                      <Badge variant="outline">{b.status}</Badge>
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
          onCreated={load}
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
                  No doctors on this clinic. Invite doctors first.
                </p>
              )}
            </div>
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
                  {FLOW_COLUMNS.map((c) => (
                    <SelectItem key={c.status} value={c.status}>
                      {c.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="COMPLETED">Completed</SelectItem>
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
                setEditSaving(true);
                try {
                  await patchClinicVisit(clinicUuid, editVisit.uuid, {
                    doctorUuid: editForm.doctorUuid || null,
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
    </div>
  );
}

function VisitCard({
  visit,
  doctors,
  busy,
  onCheckIn,
  onCheckout,
  onComplete,
  onCancel,
  onAssign,
  onEdit,
}: {
  visit: ClinicVisitModel;
  doctors: ClinicDoctorModel[];
  busy: boolean;
  onCheckIn: () => void;
  onCheckout: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onAssign: (doctorUuid: string) => void;
  onEdit: () => void;
}) {
  const activeDoctors = doctors.filter((d) => d.isActive !== false && d.doctorUuid);
  return (
    <div className="rounded-md border p-2.5 space-y-2 bg-background">
      <div className="flex items-start justify-between gap-1">
        <div>
          <div className="font-medium text-sm">{visit.petName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" />
            {visit.ownerName || 'Owner'}
            {visit.ownerPhone ? ` · ${visit.ownerPhone}` : ''}
          </div>
          {visit.doctorName && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Dr. {visit.doctorName.replace(/^Dr\.?\s*/i, '')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {visit.urgency === 'URGENT' && <Badge className={statusBadge.URGENT}>Urgent</Badge>}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onEdit} title="Edit visit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
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
      <Select
        value={visit.doctorUuid || 'none'}
        onValueChange={(v) => onAssign(v === 'none' ? '' : v)}
        disabled={busy}
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
        <p className="text-[10px] text-amber-600">No clinic doctors — invite under Doctors</p>
      )}
      <div className="flex flex-wrap gap-1">
        {visit.status === 'WAITLIST' && (
          <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={busy} onClick={onCheckIn}>
            Check in
          </Button>
        )}
        {visit.status === 'IN_PROGRESS' && (
          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={onCheckout}>
            Move to checkout
          </Button>
        )}
        {visit.status === 'CHECKING_OUT' && (
          <Button size="sm" variant="secondary" className="h-7 text-xs" disabled={busy} onClick={onComplete}>
            Complete checkout
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
