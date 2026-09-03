import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { snapToHalfHour } from '@/components/clinic/WalkInDialog';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  patchClinicBooking,
} from '@/services/clinicService';
import { fetchParentDoctorSlots } from '@/services/discoverService';
import { petNameWithType } from '@/utils/petType';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  booking: ClinicBookingModel | null;
  doctors: ClinicDoctorModel[];
  lockAssignee?: boolean;
  lockedDoctorUuid?: string;
  onSaved: () => void;
};

function slotMinuteKey(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : raw;
}

function ownSlotKey(slotStart?: string): string {
  if (!slotStart) return '';
  const d = parseISO(slotStart);
  if (!isValid(d)) return slotMinuteKey(slotStart);
  return slotMinuteKey(format(d, "yyyy-MM-dd'T'HH:mm:ss"));
}

function apiErrorMessage(e: unknown, fallback: string): string {
  const res = e as { response?: { status?: number; data?: { message?: string } } };
  return res.response?.data?.message || fallback;
}

export function BookingEditDialog({
  open,
  onOpenChange,
  clinicUuid,
  booking,
  doctors,
  lockAssignee,
  lockedDoctorUuid,
  onSaved,
}: Props) {
  const hideDoctorSelect = Boolean(lockAssignee);
  const [doctorUuid, setDoctorUuid] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busyHint, setBusyHint] = useState<string | null>(null);

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.isActive !== false && d.doctorUuid),
    [doctors]
  );

  const resolvedDoctorUuid = (hideDoctorSelect ? lockedDoctorUuid : doctorUuid) || booking?.doctorUuid || '';

  useEffect(() => {
    if (!open || !booking) return;
    const start = booking.slotStart ? parseISO(booking.slotStart) : null;
    setDoctorUuid(lockedDoctorUuid || booking.doctorUuid || '');
    setSlotDate(start && isValid(start) ? format(start, 'yyyy-MM-dd') : '');
    setSlotTime(start && isValid(start) ? format(start, 'HH:mm') : '');
    setNotes(booking.notes || '');
    setBusyHint(null);
  }, [open, booking, lockedDoctorUuid]);

  useEffect(() => {
    if (!open || !resolvedDoctorUuid || !slotDate || !slotTime || !clinicUuid || !booking) {
      setBusyHint(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const raw = new Date(`${slotDate}T${slotTime}`);
          if (Number.isNaN(raw.getTime())) return;
          const snapped = snapToHalfHour(raw);
          const startKey = slotMinuteKey(format(snapped, "yyyy-MM-dd'T'HH:mm:ss"));
          const sameDoctor = resolvedDoctorUuid === (booking.doctorUuid || '');
          const keepingOwn = sameDoctor && startKey === ownSlotKey(booking.slotStart);
          const free = await fetchParentDoctorSlots(clinicUuid, resolvedDoctorUuid, slotDate);
          if (cancelled) return;
          if (free.length === 0) {
            setBusyHint(keepingOwn ? null : 'Doctor has no availability on this day');
            return;
          }
          const openSlot = free.some((s) => slotMinuteKey(s) === startKey);
          if (!openSlot && !keepingOwn) {
            setBusyHint(
              `Doctor not available at ${format(snapped, 'h:mm a')} — outside working hours or already booked`
            );
            return;
          }
          setBusyHint(null);
        } catch {
          if (!cancelled) setBusyHint('Could not confirm doctor availability for this time');
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, clinicUuid, resolvedDoctorUuid, slotDate, slotTime, booking]);

  const save = async () => {
    if (!booking || !clinicUuid) return;
    if (!resolvedDoctorUuid) {
      toast.error('Assign a doctor');
      return;
    }
    const raw = new Date(`${slotDate}T${slotTime}`);
    if (Number.isNaN(raw.getTime())) {
      toast.error('Pick a valid date and time');
      return;
    }
    const snapped = snapToHalfHour(raw);
    const nextStart = format(snapped, "yyyy-MM-dd'T'HH:mm:ss");
    const prevStart = ownSlotKey(booking.slotStart);
    const payload: Parameters<typeof patchClinicBooking>[2] = {};
    if (resolvedDoctorUuid !== (booking.doctorUuid || '')) {
      payload.doctorUuid = resolvedDoctorUuid;
    }
    if (slotMinuteKey(nextStart) !== prevStart) {
      payload.slotStart = nextStart;
    }
    if ((notes || '') !== (booking.notes || '')) {
      payload.notes = notes;
    }
    if (Object.keys(payload).length === 0) {
      toast.message('No changes');
      return;
    }
    if (busyHint) {
      toast.error(busyHint);
      return;
    }
    setSaving(true);
    try {
      await patchClinicBooking(clinicUuid, booking.uuid, payload);
      toast.success('Appointment updated');
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e, 'Failed to update appointment'));
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async () => {
    if (!booking || !clinicUuid) return;
    if (!window.confirm('Cancel this scheduled appointment?')) return;
    setCancelling(true);
    try {
      await patchClinicBooking(clinicUuid, booking.uuid, { status: 'CANCELLED' });
      toast.success('Appointment cancelled');
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(apiErrorMessage(e, 'Failed to cancel appointment'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit appointment
            {booking ? ` · ${petNameWithType(booking.petName, booking.species)}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {hideDoctorSelect ? null : (
            <div>
              <Label>Doctor</Label>
              <Select value={doctorUuid || 'none'} onValueChange={(v) => setDoctorUuid(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select doctor</SelectItem>
                  {activeDoctors.map((d) => (
                    <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                      {d.name || d.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="booking-edit-date">Date</Label>
              <DatePicker
                id="booking-edit-date"
                value={slotDate}
                onChange={setSlotDate}
                placeholder="Select date"
                disablePast
              />
            </div>
            <div>
              <Label htmlFor="booking-edit-time">Time</Label>
              <Input
                id="booking-edit-time"
                type="time"
                step={1800}
                value={slotTime}
                min={
                  slotDate === format(new Date(), 'yyyy-MM-dd')
                    ? format(snapToHalfHour(new Date()), 'HH:mm')
                    : undefined
                }
                onChange={(e) => setSlotTime(e.target.value)}
              />
            </div>
          </div>
          {busyHint ? <p className="text-xs text-amber-600">{busyHint}</p> : null}
          <div>
            <Label htmlFor="booking-edit-notes">Notes</Label>
            <Input
              id="booking-edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void cancelAppointment()}
            disabled={saving || cancelling || !booking}
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cancel appointment
          </Button>
          <Button
            type="button"
            onClick={() => void save()}
            disabled={saving || cancelling || Boolean(busyHint) || !booking}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
