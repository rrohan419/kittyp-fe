import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, X } from 'lucide-react';
import { addHours, format, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import {
  ClinicDoctorModel,
  ClinicOwnerModel,
  ClinicPetListModel,
  OwnerEmailLookupModel,
  PlatformUserSearchModel,
  admitClinicPet,
  createClinicBooking,
  createWalkInVisit,
  ensureClinicOwnerFromUser,
  fetchClinicOwners,
  fetchClinicPets,
  lookupOwnerByEmail,
  searchPlatformUsers,
  sendPetConsentOtp,
  verifyPetConsentOtp,
  VisitUrgency,
} from '@/services/clinicService';
import { fetchParentDoctorSlots } from '@/services/discoverService';
import { isPracticeReady } from '@/services/doctorVerificationService';
import { digitsOnlyPhone, validateEmail, validatePhone } from '@/utils/validation';
import { toast } from 'sonner';
import { notifyPortalRefresh } from '@/components/portal/PortalNotifications';
import { cn } from '@/lib/utils';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import { PetNameType } from '@/components/ui/PetNameType';
import {
  APPOINTMENT_SEARCH_MIN,
  matchesEmailOrGeneratedId,
  normalizeAppointmentSearchQuery,
} from '@/utils/appointmentPatientSearch';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  doctors: ClinicDoctorModel[];
  onCreated: () => void;
  /** When set (doctor portal), hide Assign doctor and always use this UUID. */
  lockedDoctorUuid?: string;
  /** Prefill Schedule with this slot (calendar click). */
  initialSlotStart?: Date | null;
};

type TimingMode = 'now' | 'schedule';

const emptyNew = {
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  petName: '',
  petType: 'CAT',
  petBreed: '',
  petPhotoUrl: '',
  reason: '',
  urgency: 'ROUTINE' as VisitUrgency,
  doctorUuid: '',
  slotDate: '',
  slotTime: '',
};

type SearchHit =
  | { kind: 'pet'; pet: ClinicPetListModel }
  | { kind: 'owner'; owner: ClinicOwnerModel; pet: ClinicPetListModel }
  | { kind: 'user'; user: PlatformUserSearchModel };

/** Snap: :00 stays; 1–30 → :30; >30 → next hour :00. */
export function snapToHalfHour(date: Date): Date {
  const minutes = date.getMinutes();
  let rounded = setSeconds(setMilliseconds(date, 0), 0);
  if (minutes === 0) {
    return setMinutes(rounded, 0);
  }
  if (minutes <= 30) {
    return setMinutes(rounded, 30);
  }
  return setMinutes(addHours(rounded, 1), 0);
}

function slotMinuteKey(raw: string): string {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : raw;
}

/** Default schedule start: ~3 hours from now, snapped to half hour. */
function defaultScheduleParts() {
  const rounded = snapToHalfHour(addHours(new Date(), 3));
  return {
    slotDate: format(rounded, 'yyyy-MM-dd'),
    slotTime: format(rounded, 'HH:mm'),
  };
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  clinicUuid,
  doctors,
  onCreated,
  lockedDoctorUuid,
  initialSlotStart,
}: Props) {
  const hideDoctorSelect = Boolean(lockedDoctorUuid);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [timing, setTiming] = useState<TimingMode>('now');
  const [petSearch, setPetSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selectedPet, setSelectedPet] = useState<ClinicPetListModel | null>(null);
  const [form, setForm] = useState(emptyNew);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyHint, setBusyHint] = useState<string | null>(null);
  const [emailLookup, setEmailLookup] = useState<OwnerEmailLookupModel | null>(null);
  const [matchedOwner, setMatchedOwner] = useState<ClinicOwnerModel | null>(null);
  const [consentCode, setConsentCode] = useState('');
  const [consentVerified, setConsentVerified] = useState(false);
  const [consentSending, setConsentSending] = useState(false);
  const [consentVerifying, setConsentVerifying] = useState(false);

  const activeDoctors = useMemo(
    () =>
      doctors.filter(
        (d) =>
          d.isActive !== false &&
          d.doctorUuid &&
          (isPracticeReady(d.status) || d.doctorUuid === lockedDoctorUuid)
      ),
    [doctors, lockedDoctorUuid]
  );

  const resolvedDoctorUuid = lockedDoctorUuid || form.doctorUuid;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(normalizeAppointmentSearchQuery(petSearch)), 250);
    return () => clearTimeout(t);
  }, [petSearch]);

  useEffect(() => {
    if (!open || !clinicUuid || mode !== 'existing' || selectedPet) {
      return;
    }
    let cancelled = false;
    (async () => {
      const q = debouncedQ.trim();
      if (q.length < APPOINTMENT_SEARCH_MIN) {
        setHits([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const emailOrId = { by: 'emailOrId' as const };
        const [petsPage, ownersPage, users] = await Promise.all([
          fetchClinicPets(clinicUuid, q, { ...emailOrId, pageSize: 50 }),
          fetchClinicOwners(clinicUuid, q, { ...emailOrId, pageSize: 50 }),
          searchPlatformUsers(clinicUuid, q, emailOrId),
        ]);
        if (cancelled) return;
        const pets = petsPage.models ?? [];
        const owners = ownersPage.models ?? [];
        const petHits: SearchHit[] = pets.slice(0, 30).map((pet) => ({ kind: 'pet', pet }));
        const ownerPetHits: SearchHit[] = [];
        for (const owner of owners.slice(0, 20)) {
          const petsOfOwner = owner.pets ?? [];
          if (petsOfOwner.length === 0) continue;
          for (const op of petsOfOwner.slice(0, 5)) {
            ownerPetHits.push({
              kind: 'owner',
              owner,
              pet: {
                petUuid: op.petUuid,
                globalPetId: op.globalPetId,
                name: op.name,
                species: op.species,
                breed: op.breed,
                gender: op.gender,
                dateOfBirth: op.dateOfBirth,
                weight: op.weight,
                microchipNumber: op.microchipNumber,
                photoUrl: op.photoUrl,
                patientNumber: op.patientNumber,
                ownerUuid: owner.ownerUuid,
                ownerName: owner.name,
                ownerPhone: owner.phone,
                ownerEmail: owner.email,
                linked: owner.linked,
                lastVisit: op.lastVisit,
              },
            });
          }
        }
        const userHits: SearchHit[] = users.slice(0, 20).map((user) => ({ kind: 'user', user }));
        const seenPet = new Set<string>();
        const seenOwner = new Set<string>();
        const seenUser = new Set<string>();
        const merged: SearchHit[] = [];

        for (const hit of petHits) {
          if (seenPet.has(hit.pet.petUuid)) continue;
          seenPet.add(hit.pet.petUuid);
          if (hit.pet.ownerUuid) seenOwner.add(hit.pet.ownerUuid);
          if (hit.pet.ownerEmail) seenOwner.add(hit.pet.ownerEmail.toLowerCase());
          merged.push(hit);
        }
        for (const hit of ownerPetHits) {
          if (seenPet.has(hit.pet.petUuid)) continue;
          seenPet.add(hit.pet.petUuid);
          if (hit.owner.ownerUuid) seenOwner.add(hit.owner.ownerUuid);
          if (hit.owner.email) seenOwner.add(hit.owner.email.toLowerCase());
          merged.push(hit);
        }
        for (const hit of userHits) {
          if (seenUser.has(hit.user.userUuid)) continue;
          const ownerKey = hit.user.clinicOwnerUuid;
          const emailKey = hit.user.email?.toLowerCase();
          // Skip only when we already listed one of their pets — still show
          // KittyP users who are clients but have no pets yet at this clinic.
          if (ownerKey && seenOwner.has(ownerKey)) continue;
          if (emailKey && seenOwner.has(emailKey)) continue;
          seenUser.add(hit.user.userUuid);
          merged.push(hit);
        }
        const byEmailOrId = merged.filter((hit) => {
          if (hit.kind === 'user') {
            return matchesEmailOrGeneratedId(q, hit.user.email, hit.user.userUuid);
          }
          if (hit.kind === 'owner') {
            return matchesEmailOrGeneratedId(
              q,
              hit.owner.email,
              hit.owner.ownerUuid,
              hit.pet.petUuid,
              hit.pet.globalPetId,
              hit.pet.patientNumber
            );
          }
          return matchesEmailOrGeneratedId(
            q,
            hit.pet.ownerEmail,
            hit.pet.ownerUuid,
            hit.pet.petUuid,
            hit.pet.globalPetId,
            hit.pet.patientNumber
          );
        });
        setHits(byEmailOrId.slice(0, 40));
      } catch (err) {
        console.error('Appointment patient search failed', err);
        if (!cancelled) {
          setHits([]);
          toast.error('Could not search patients — check clinic selection and try again');
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, clinicUuid, mode, debouncedQ, selectedPet]);

  useEffect(() => {
    if (!open) {
      setForm({ ...emptyNew, ...defaultScheduleParts(), doctorUuid: lockedDoctorUuid || '' });
      setSelectedPet(null);
      setPetSearch('');
      setDebouncedQ('');
      setHits([]);
      setMode('existing');
      setTiming('now');
      setFieldErrors({});
      setBusyHint(null);
      setEmailLookup(null);
      setMatchedOwner(null);
      setConsentCode('');
      setConsentVerified(false);
      return;
    }
    if (initialSlotStart && !Number.isNaN(initialSlotStart.getTime())) {
      const snapped = snapToHalfHour(initialSlotStart);
      setTiming('schedule');
      setForm((s) => ({
        ...s,
        slotDate: format(snapped, 'yyyy-MM-dd'),
        slotTime: format(snapped, 'HH:mm'),
        doctorUuid: lockedDoctorUuid || s.doctorUuid,
      }));
      return;
    }
    setForm((s) => ({
      ...s,
      ...defaultScheduleParts(),
      doctorUuid: lockedDoctorUuid || s.doctorUuid,
    }));
  }, [open, lockedDoctorUuid, initialSlotStart]);

  /** Block times outside doctor hours or already booked. Runs for clinic and locked doctor. */
  useEffect(() => {
    if (!open || timing !== 'schedule') {
      setBusyHint(null);
      return;
    }
    if (!resolvedDoctorUuid || !form.slotDate || !form.slotTime || !clinicUuid) {
      setBusyHint(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const raw = new Date(`${form.slotDate}T${form.slotTime}`);
          if (Number.isNaN(raw.getTime())) return;
          const snapped = snapToHalfHour(raw);
          const startKey = slotMinuteKey(format(snapped, "yyyy-MM-dd'T'HH:mm:ss"));
          const free = await fetchParentDoctorSlots(clinicUuid, resolvedDoctorUuid, form.slotDate);
          if (cancelled) return;
          if (free.length === 0) {
            setBusyHint('Doctor has no availability on this day');
            return;
          }
          const openSlot = free.some((s) => slotMinuteKey(s) === startKey);
          if (!openSlot) {
            setBusyHint(
              `Doctor not available at ${format(snapped, 'h:mm a')} — outside working hours or already booked`
            );
            return;
          }
          setBusyHint(null);
        } catch {
          if (!cancelled) {
            setBusyHint('Could not confirm doctor availability for this time');
          }
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [open, timing, resolvedDoctorUuid, form.slotDate, form.slotTime, clinicUuid]);

  const set = (key: keyof typeof emptyNew, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
    setFieldErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const applyTimeSnap = () => {
    if (!form.slotDate || !form.slotTime) return;
    const raw = new Date(`${form.slotDate}T${form.slotTime}`);
    if (Number.isNaN(raw.getTime())) return;
    const snapped = snapToHalfHour(raw);
    const nextDate = format(snapped, 'yyyy-MM-dd');
    const nextTime = format(snapped, 'HH:mm');
    if (nextDate !== form.slotDate || nextTime !== form.slotTime) {
      setForm((s) => ({ ...s, slotDate: nextDate, slotTime: nextTime }));
      if (!hideDoctorSelect) {
        toast.message(`Time adjusted to ${format(snapped, 'h:mm a')} (30‑min slots)`);
      }
    }
  };

  const selectPet = async (p: ClinicPetListModel) => {
    try {
      setSearching(true);
      const admitted = await admitClinicPet(clinicUuid, p.petUuid);
      setSelectedPet(admitted);
      setPetSearch('');
      setHits([]);
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not admit pet to this clinic';
      toast.error(message);
      return false;
    } finally {
      setSearching(false);
    }
  };

  const selectPlatformUser = async (user: PlatformUserSearchModel) => {
    try {
      setSearching(true);
      const owner = await ensureClinicOwnerFromUser(clinicUuid, user.userUuid);
      const petsOfOwner = owner.pets ?? [];
      if (petsOfOwner.length > 0) {
        const op = petsOfOwner[0];
        await selectPet({
          petUuid: op.petUuid,
          globalPetId: op.globalPetId,
          name: op.name,
          species: op.species,
          breed: op.breed,
          gender: op.gender,
          dateOfBirth: op.dateOfBirth,
          weight: op.weight,
          microchipNumber: op.microchipNumber,
          photoUrl: op.photoUrl,
          patientNumber: op.patientNumber,
          ownerUuid: owner.ownerUuid,
          ownerName: owner.name,
          ownerPhone: owner.phone,
          ownerEmail: owner.email,
          linked: owner.linked,
          lastVisit: op.lastVisit,
        });
        return;
      }
      const [first = '', ...rest] = (user.name || '').trim().split(/\s+/);
      setMode('new');
      setMatchedOwner(owner);
      setEmailLookup({
        found: true,
        source: 'PLATFORM',
        owner,
        platformUser: user,
      });
      setForm((s) => ({
        ...s,
        ownerFirstName: first || user.email?.split('@')[0] || '',
        ownerLastName: rest.join(' '),
        ownerEmail: user.email || '',
        ownerPhone: digitsOnlyPhone(user.phone || ''),
      }));
      setHits([]);
      toast.message('Account selected — add the pet for this appointment');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not select KittyP user';
      toast.error(message);
    } finally {
      setSearching(false);
    }
  };

  const clearSelectedPet = () => {
    setSelectedPet(null);
    setPetSearch('');
  };

  const resetConsent = () => {
    setConsentCode('');
    setConsentVerified(false);
  };

  const applyMatchedOwner = async (hit: OwnerEmailLookupModel) => {
    if (!hit.found) return;
    try {
      setSearching(true);
      let owner = hit.owner ?? null;
      if (!owner && hit.platformUser) {
        owner = await ensureClinicOwnerFromUser(clinicUuid, hit.platformUser.userUuid);
      }
      if (!owner) {
        toast.error('Could not load existing profile');
        return;
      }
      setMatchedOwner(owner);
      setForm((s) => ({
        ...s,
        ownerFirstName: owner.firstName || owner.name?.split(/\s+/)[0] || '',
        ownerLastName: owner.lastName || owner.name?.split(/\s+/).slice(1).join(' ') || '',
        ownerEmail: owner.email || s.ownerEmail,
        ownerPhone: digitsOnlyPhone(owner.phone || s.ownerPhone || hit.platformUser?.phone || ''),
      }));
      resetConsent();
      toast.message('Existing profile loaded — pick a pet or add a new one');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not use existing profile';
      toast.error(message);
    } finally {
      setSearching(false);
    }
  };

  const runEmailLookup = async (rawEmail: string) => {
    const emailErr = validateEmail(rawEmail);
    if (emailErr) {
      setFieldErrors((s) => ({ ...s, ownerEmail: emailErr }));
      setEmailLookup(null);
      setMatchedOwner(null);
      return;
    }
    try {
      const hit = await lookupOwnerByEmail(clinicUuid, rawEmail.trim());
      setEmailLookup(hit);
      if (!hit.found) {
        setMatchedOwner(null);
        resetConsent();
        return;
      }
      // Don't leave staff on an empty "create patient" form — attach to the existing profile.
      await applyMatchedOwner(hit);
    } catch {
      setEmailLookup(null);
    }
  };

  const ensureConsentOwner = async (): Promise<ClinicOwnerModel | null> => {
    if (matchedOwner) return matchedOwner;
    if (emailLookup?.owner) return emailLookup.owner;
    if (emailLookup?.platformUser) {
      const owner = await ensureClinicOwnerFromUser(clinicUuid, emailLookup.platformUser.userUuid);
      setMatchedOwner(owner);
      return owner;
    }
    return null;
  };

  const handleSendConsent = async () => {
    if (!form.petName.trim()) {
      toast.error('Enter the pet name before sending consent');
      return;
    }
    try {
      setConsentSending(true);
      const owner = await ensureConsentOwner();
      if (!owner) {
        toast.error('No existing owner profile for consent');
        return;
      }
      await sendPetConsentOtp(clinicUuid, owner.ownerUuid, form.petName.trim());
      setConsentVerified(false);
      toast.success('Consent code sent to owner email');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send consent code';
      toast.error(message);
    } finally {
      setConsentSending(false);
    }
  };

  const handleVerifyConsent = async () => {
    if (!form.petName.trim() || !consentCode.trim()) {
      toast.error('Enter pet name and the code from the owner');
      return;
    }
    try {
      setConsentVerifying(true);
      const owner = await ensureConsentOwner();
      if (!owner) {
        toast.error('No existing owner profile for consent');
        return;
      }
      await verifyPetConsentOtp(clinicUuid, owner.ownerUuid, form.petName.trim(), consentCode.trim());
      setConsentVerified(true);
      toast.success('Owner consent verified');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid consent code';
      toast.error(message);
      setConsentVerified(false);
    } finally {
      setConsentVerifying(false);
    }
  };

  const validateNewPatient = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.ownerFirstName.trim()) errors.ownerFirstName = 'First name is required';
    if (!form.petName.trim()) errors.petName = 'Pet name is required';
    const emailErr = validateEmail(form.ownerEmail);
    if (emailErr) errors.ownerEmail = emailErr;
    const phoneErr = validatePhone(form.ownerPhone, true);
    if (phoneErr) errors.ownerPhone = phoneErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSchedule = (): boolean => {
    const errors: Record<string, string> = {};
    // Doctor is optional — unassigned appointments appear in the Unassigned filter.
    if (!form.slotDate) errors.slotDate = 'Date is required';
    if (!form.slotTime) errors.slotTime = 'Time is required';
    if (form.slotDate && form.slotTime) {
      const start = snapToHalfHour(new Date(`${form.slotDate}T${form.slotTime}`));
      if (Number.isNaN(start.getTime())) {
        errors.slotTime = 'Invalid date/time';
      } else if (start.getTime() < Date.now() - 60_000) {
        errors.slotTime = 'Pick a future time';
      }
    }
    if (busyHint && resolvedDoctorUuid) {
      errors.slotTime = busyHint;
    }
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const needsOwnerConsent =
    mode === 'new' &&
    timing === 'schedule' &&
    Boolean(emailLookup?.found || matchedOwner) &&
    !selectedPet;

  const patientPayload = () => {
    if (mode === 'existing' && selectedPet) {
      return { petUuid: selectedPet.petUuid };
    }
    if (mode === 'new' && selectedPet) {
      return { petUuid: selectedPet.petUuid };
    }
    return {
      owner: {
        firstName: form.ownerFirstName.trim(),
        lastName: form.ownerLastName.trim() || undefined,
        email: form.ownerEmail.trim(),
        phone: digitsOnlyPhone(form.ownerPhone),
      },
      newPet: {
        name: form.petName.trim(),
        species: form.petType || undefined,
        breed: form.petBreed || undefined,
        photoUrl: form.petPhotoUrl.trim() || undefined,
      },
    };
  };

  const submit = async () => {
    if (!clinicUuid) {
      toast.error('No active clinic selected — use the clinic switcher or Add clinic');
      return;
    }
    if (mode === 'existing' && !selectedPet) {
      toast.error('Search and select a pet or owner first');
      return;
    }
    if (mode === 'new' && !selectedPet && !validateNewPatient()) {
      toast.error('Fix the highlighted fields');
      return;
    }
    if (emailLookup?.found && !matchedOwner && !selectedPet && mode === 'new') {
      toast.error('This email already exists — use that profile instead of creating a new patient');
      return;
    }
    if (needsOwnerConsent && !consentVerified) {
      toast.error('Verify owner email consent before scheduling a new pet on this profile');
      return;
    }
    if (timing === 'schedule' && !validateSchedule()) {
      toast.error(busyHint || 'Fix the schedule fields');
      return;
    }

    setSaving(true);
    try {
      if (needsOwnerConsent) {
        await ensureConsentOwner();
      }
      const doctorUuid = resolvedDoctorUuid || undefined;
      if (timing === 'now') {
        await createWalkInVisit(clinicUuid, {
          ...patientPayload(),
          reasonForVisit: form.reason || undefined,
          urgency: form.urgency,
          doctorUuid,
        });
        toast.success('Added to waitlist');
      } else {
        const raw = new Date(`${form.slotDate}T${form.slotTime}`);
        const slotStart = snapToHalfHour(raw);
        const snappedDate = format(slotStart, 'yyyy-MM-dd');
        const snappedTime = format(slotStart, 'HH:mm');
        if (snappedDate !== form.slotDate || snappedTime !== form.slotTime) {
          setForm((s) => ({ ...s, slotDate: snappedDate, slotTime: snappedTime }));
        }
        await createClinicBooking(clinicUuid, {
          ...patientPayload(),
          doctorUuid: doctorUuid || undefined,
          slotStart: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
          durationMinutes: 30,
          notes: form.reason || undefined,
          mode: 'IN_PERSON',
        });
        toast.success(
          doctorUuid ? 'Appointment scheduled — doctor notified' : 'Appointment scheduled — unassigned'
        );
      }
      onCreated();
      notifyPortalRefresh();
      onOpenChange(false);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response
        ?.status;
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (status === 404
          ? 'API not found — restart the backend with the latest build'
          : status === 500
            ? 'Server error — try again; if it persists, restart the backend'
            : timing === 'now'
              ? 'Failed to create walk-in'
              : 'Failed to schedule appointment');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const assignedDoctor = activeDoctors.find((d) => d.doctorUuid === resolvedDoctorUuid);
  const assignedDoctorLabel = assignedDoctor
    ? assignedDoctor.name || assignedDoctor.email || 'Doctor'
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add appointment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          <button
            type="button"
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium',
              mode === 'existing' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
            onClick={() => {
              setMode('existing');
              clearSelectedPet();
              setFieldErrors({});
              setEmailLookup(null);
              setMatchedOwner(null);
              resetConsent();
            }}
          >
            Existing patient
          </button>
          <button
            type="button"
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium',
              mode === 'new' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            )}
            onClick={() => {
              setMode('new');
              clearSelectedPet();
              setFieldErrors({});
              setEmailLookup(null);
              setMatchedOwner(null);
              resetConsent();
            }}
          >
            New patient
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="space-y-3 mt-1">
            {selectedPet ? (
              <div>
                <Label>Pet</Label>
                <div className="mt-1 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <PetNameType name={selectedPet.name} type={selectedPet.species} />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={clearSelectedPet}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Label>Search by email or ID</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Owner email, pet ID, or patient number..."
                    value={petSearch}
                    autoFocus
                    onChange={(e) => setPetSearch(e.target.value)}
                  />
                </div>
                {searching ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-md max-h-52 overflow-y-auto divide-y mt-2">
                    {hits.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        {debouncedQ.trim().length >= APPOINTMENT_SEARCH_MIN
                          ? 'No match for that email or ID — try New patient'
                          : 'Type at least 3 characters of an email or generated ID'}
                      </p>
                    ) : (
                      hits.map((hit) =>
                        hit.kind === 'user' ? (
                          <button
                            key={`user-${hit.user.userUuid}`}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                            onClick={() => void selectPlatformUser(hit.user)}
                          >
                            <div className="font-medium flex items-center gap-2">
                              {hit.user.email || hit.user.name}
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                KittyP
                              </Badge>
                            </div>
                            {hit.user.userUuid ? (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {hit.user.userUuid}
                              </p>
                            ) : null}
                          </button>
                        ) : (
                          <button
                            key={hit.pet.petUuid}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                            onClick={() => void selectPet(hit.pet)}
                          >
                            <PetNameType name={hit.pet.name} type={hit.pet.species} />
                            <p className="text-xs text-muted-foreground truncate">
                              {hit.kind === 'owner' ? hit.owner.email : hit.pet.ownerEmail}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {[hit.pet.patientNumber, hit.pet.globalPetId || hit.pet.petUuid]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </button>
                        )
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 mt-1">
            {emailLookup?.found || matchedOwner ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm space-y-1">
                <p className="text-foreground font-medium">
                  This email is already on KittyP
                  {matchedOwner?.name ? ` — ${matchedOwner.name}` : ''}.
                </p>
                <p className="text-muted-foreground text-xs">
                  New patient create is blocked. Pick a pet on this profile or add a new pet below.
                </p>
              </div>
            ) : null}

            {matchedOwner ? (
              <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{matchedOwner.name}</p>
                    <p className="text-xs text-muted-foreground">{matchedOwner.email}</p>
                  </div>
                  <Badge variant="secondary">Existing</Badge>
                </div>
                {(matchedOwner.pets?.length ?? 0) > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pets on this profile — click to schedule</p>
                    <div className="border rounded-md divide-y max-h-36 overflow-y-auto bg-background">
                      {matchedOwner.pets.map((op) => (
                        <button
                          key={op.petUuid}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                          onClick={() =>
                            void selectPet({
                              petUuid: op.petUuid,
                              globalPetId: op.globalPetId,
                              name: op.name,
                              species: op.species,
                              breed: op.breed,
                              gender: op.gender,
                              dateOfBirth: op.dateOfBirth,
                              weight: op.weight,
                              microchipNumber: op.microchipNumber,
                              photoUrl: op.photoUrl,
                              patientNumber: op.patientNumber,
                              ownerUuid: matchedOwner.ownerUuid,
                              ownerName: matchedOwner.name,
                              ownerPhone: matchedOwner.phone,
                              ownerEmail: matchedOwner.email,
                              linked: matchedOwner.linked,
                              lastVisit: op.lastVisit,
                            }).then((ok) => {
                              if (ok) setMode('existing');
                            })
                          }
                        >
                          <PetNameType name={op.name} type={op.species} />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Or add a new pet for this owner below
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No pets yet — add one below</p>
                )}
              </div>
            ) : null}

            {selectedPet && mode === 'new' ? (
              <div>
                <Label>Selected pet</Label>
                <div className="mt-1 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <PetNameType name={selectedPet.name} type={selectedPet.species} />
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={clearSelectedPet}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {!matchedOwner ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Owner first name</Label>
                  <Input
                    value={form.ownerFirstName}
                    onChange={(e) => set('ownerFirstName', e.target.value)}
                  />
                  {fieldErrors.ownerFirstName && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.ownerFirstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input
                    value={form.ownerLastName}
                    onChange={(e) => set('ownerLastName', e.target.value)}
                  />
                </div>
              </div>
            ) : null}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => {
                  set('ownerEmail', e.target.value);
                  setEmailLookup(null);
                  setMatchedOwner(null);
                  resetConsent();
                }}
                onBlur={() => void runEmailLookup(form.ownerEmail)}
              />
              {fieldErrors.ownerEmail && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.ownerEmail}</p>
              )}
            </div>
            {!matchedOwner ? (
              <div>
                <Label>Phone (10 digits)</Label>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.ownerPhone}
                  onChange={(e) => set('ownerPhone', digitsOnlyPhone(e.target.value))}
                  onBlur={() => {
                    const err = validatePhone(form.ownerPhone, true);
                    if (err) setFieldErrors((s) => ({ ...s, ownerPhone: err }));
                  }}
                />
                {fieldErrors.ownerPhone && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.ownerPhone}</p>
                )}
              </div>
            ) : (
              <div>
                <Label>Phone</Label>
                <Input value={form.ownerPhone} disabled />
              </div>
            )}
            {!selectedPet ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Pet name</Label>
                    <Input
                      value={form.petName}
                      onChange={(e) => {
                        set('petName', e.target.value);
                        resetConsent();
                      }}
                    />
                    {fieldErrors.petName && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.petName}</p>
                    )}
                  </div>
                  <div>
                    <Label>Species</Label>
                    <Select value={form.petType} onValueChange={(v) => set('petType', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAT">Cat</SelectItem>
                        <SelectItem value="DOG">Dog</SelectItem>
                        <SelectItem value="BIRD">Bird</SelectItem>
                        <SelectItem value="RABBIT">Rabbit</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Breed</Label>
                  <Input value={form.petBreed} onChange={(e) => set('petBreed', e.target.value)} />
                </div>
                <PetPhotoField
                  value={form.petPhotoUrl || null}
                  onChange={(url) => set('petPhotoUrl', url || '')}
                  disabled={saving}
                />
              </>
            ) : null}

            {needsOwnerConsent ? (
              <div className="rounded-md border px-3 py-2.5 space-y-2">
                <p className="text-sm font-medium">Owner consent (email OTP)</p>
                <p className="text-xs text-muted-foreground">
                  Scheduling a new pet on an existing profile requires a one-time code sent to the
                  owner&apos;s email. Walk-ins skip this.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={consentSending || !form.petName.trim()}
                    onClick={() => void handleSendConsent()}
                  >
                    {consentSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Send code
                  </Button>
                  <Input
                    className="max-w-[140px] h-8"
                    placeholder="6-digit code"
                    value={consentCode}
                    onChange={(e) => {
                      setConsentCode(e.target.value);
                      setConsentVerified(false);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={consentVerifying || !consentCode.trim()}
                    onClick={() => void handleVerifyConsent()}
                  >
                    {consentVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Verify
                  </Button>
                  {consentVerified ? (
                    <Badge variant="secondary" className="self-center">
                      Verified
                    </Badge>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-3 pt-2 border-t">
          <div>
            <Label className="mb-1.5 block">When</Label>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
              <button
                type="button"
                className={cn(
                  'rounded-sm px-3 py-1.5 text-sm font-medium',
                  timing === 'now' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
                onClick={() => {
                  setTiming('now');
                  setBusyHint(null);
                  setFieldErrors((e) => {
                    const next = { ...e };
                    delete next.doctorUuid;
                    delete next.slotDate;
                    delete next.slotTime;
                    return next;
                  });
                }}
              >
                Here now
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-sm px-3 py-1.5 text-sm font-medium',
                  timing === 'schedule' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
                onClick={() => setTiming('schedule')}
              >
                Schedule
              </button>
            </div>
          </div>

          <div>
            <Label>Reason for visit</Label>
            <Input
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="e.g. Leg injury"
            />
          </div>

          {timing === 'now' ? (
            <div className={cn('grid gap-2', hideDoctorSelect ? 'grid-cols-1' : 'grid-cols-2')}>
              <div>
                <Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => set('urgency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUTINE">Routine</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!hideDoctorSelect && (
                <div>
                  <Label>Assign doctor</Label>
                  <Select
                    value={form.doctorUuid || 'none'}
                    onValueChange={(v) => set('doctorUuid', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {activeDoctors.map((d) => (
                        <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                          {d.name || d.email || d.doctorUuid}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!hideDoctorSelect && (
                <div>
                  <Label>Assign doctor</Label>
                  <Select
                    value={form.doctorUuid || 'none'}
                    onValueChange={(v) => set('doctorUuid', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {activeDoctors.map((d) => (
                        <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                          {d.name || d.email || d.doctorUuid}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave unassigned to assign later from the board
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="walk-in-date">Date</Label>
                  <DatePicker
                    id="walk-in-date"
                    value={form.slotDate}
                    onChange={(slotDate) => set('slotDate', slotDate)}
                    placeholder="Select date"
                    disablePast
                  />
                  {fieldErrors.slotDate && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.slotDate}</p>
                  )}
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={form.slotTime}
                    min={
                      form.slotDate === format(new Date(), 'yyyy-MM-dd')
                        ? format(snapToHalfHour(new Date()), 'HH:mm')
                        : undefined
                    }
                    onChange={(e) => set('slotTime', e.target.value)}
                    onBlur={applyTimeSnap}
                  />
                  {fieldErrors.slotTime && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.slotTime}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Appointments are 30 minutes.</p>
              {busyHint && <p className="text-xs text-amber-600">{busyHint}</p>}
            </div>
          )}

          {!hideDoctorSelect && activeDoctors.length === 0 && (
            <p className="text-xs text-amber-600">
              No doctors linked yet. Invite under Doctors — then assign here or from the board.
            </p>
          )}
        </div>

        {(mode === 'existing'
          ? Boolean(selectedPet)
          : Boolean(form.petName.trim() || form.ownerFirstName.trim())) ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">Summary</p>
            {mode === 'existing' ? (
              <PetNameType name={selectedPet?.name} type={selectedPet?.species} />
            ) : (
              <PetNameType name={form.petName} type={form.petType} />
            )}
            <p className="text-xs text-muted-foreground">
              {timing === 'now'
                ? 'Here now'
                : form.slotDate && form.slotTime && !Number.isNaN(new Date(`${form.slotDate}T${form.slotTime}`).getTime())
                  ? format(snapToHalfHour(new Date(`${form.slotDate}T${form.slotTime}`)), 'PPp')
                  : 'Time TBD'}
              {resolvedDoctorUuid ? ` · ${assignedDoctorLabel || 'Doctor'}` : ''}
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || Boolean(busyHint && timing === 'schedule')}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {timing === 'now' ? 'Add to waitlist' : 'Schedule appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use AddAppointmentDialog */
export const WalkInDialog = AddAppointmentDialog;
