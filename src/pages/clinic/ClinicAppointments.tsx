import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, User, Loader2 } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  fetchClinicBookings,
  fetchClinicDoctors,
} from '@/services/clinicService';
import { toast } from 'sonner';
import { format, isSameDay, addDays, parseISO, isValid } from 'date-fns';

const statusColor: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

function bookingStart(b: ClinicBookingModel): Date | null {
  if (!b.slotStart) return null;
  const d = parseISO(b.slotStart);
  return isValid(d) ? d : null;
}

export default function ClinicAppointments() {
  const { clinicUuid } = useActiveClinic();
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [tab, setTab] = useState('today');
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicUuid) {
        setBookings([]);
        setDoctors([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [bookingPage, doctorList] = await Promise.all([
          fetchClinicBookings(clinicUuid, 0, 50),
          fetchClinicDoctors(clinicUuid),
        ]);
        if (!cancelled) {
          setBookings(bookingPage?.models ?? []);
          setDoctors(doctorList);
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          setDoctors([]);
          toast.error('Failed to load appointments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  const doctorName = (uuid?: string) =>
    doctors.find((d) => d.doctorUuid === uuid || d.userUuid === uuid)?.name || 'Doctor';

  const filteredByDoctor = useMemo(
    () =>
      bookings.filter(
        (b) => doctorFilter === 'all' || b.doctorUuid === doctorFilter
      ),
    [bookings, doctorFilter]
  );

  const renderList = (dayOffset: 0 | 1) => {
    const target = addDays(new Date(), dayOffset);
    const items = filteredByDoctor.filter((b) => {
      const start = bookingStart(b);
      return start && isSameDay(start, target);
    });
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      );
    }
    if (items.length === 0) {
      return <p className="text-center text-muted-foreground py-10 text-sm">No appointments.</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((a) => {
          const start = bookingStart(a);
          return (
            <Card key={a.uuid} className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(a.petName || '?').charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {a.petName}
                      {a.mode ? ` · ${a.mode}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      <User className="inline h-3 w-3 mr-1" />
                      {a.ownerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {start ? format(start, 'h:mm a') : '—'}
                  </div>
                  <Badge variant="secondary" className="text-[10px] bg-muted border-0 hidden sm:inline-flex">
                    {doctorName(a.doctorUuid)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`${statusColor[a.status] || 'bg-muted text-muted-foreground'} border-0 text-[10px] capitalize`}
                  >
                    {a.status?.toLowerCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1 text-sm">All bookings across the clinic</p>
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.doctorUuid || d.userUuid} value={d.doctorUuid || d.userUuid}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          {renderList(0)}
        </TabsContent>
        <TabsContent value="tomorrow" className="mt-4">
          {renderList(1)}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filteredByDoctor.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">No appointments.</p>
          ) : (
            <div className="space-y-3">
              {filteredByDoctor.map((a) => {
                const start = bookingStart(a);
                return (
                  <Card key={a.uuid} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{a.petName} · {a.ownerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {start ? format(start, 'MMM d, yyyy h:mm a') : a.slotStart}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${statusColor[a.status] || ''} border-0 text-[10px] capitalize`}
                      >
                        {a.status?.toLowerCase()}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
