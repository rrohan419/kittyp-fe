import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { addHours, addMinutes, format, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import {
  ClinicDoctorModel,
  ClinicOwnerModel,
  ClinicPetListModel,
  PlatformUserSearchModel,
  createClinicBooking,
  createWalkInVisit,
  ensureClinicOwnerFromUser,
  fetchClinicOwners,
  fetchClinicPets,
  fetchDoctorBusySlots,
  searchPlatformUsers,
  VisitUrgency,
} from '@/services/clinicService';
import { digitsOnlyPhone, validateEmail, validatePhone } from '@/utils/validation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  doctors: ClinicDoctorModel[];
  onCreated: () => void;
  /** When set (doctor portal), hide Assign doctor and always use this UUID. */
  lockedDoctorUuid?: string;
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

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.isActive !== false && d.doctorUuid),
    [doctors]
  );

  const resolvedDoctorUuid = lockedDoctorUuid || form.doctorUuid;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(petSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [petSearch]);

  useEffect(() => {
    if (!open || !clinicUuid || mode !== 'existing' || selectedPet) {
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const q = debouncedQ || undefined;
        const [pets, owners, users] = await Promise.all([
          fetchClinicPets(clinicUuid, q),
          fetchClinicOwners(clinicUuid, q),
          debouncedQ.length >= 3
            ? searchPlatformUsers(clinicUuid, debouncedQ)
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
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
        setHits(merged.slice(0, 40));
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
    } else {
      setForm((s) => ({
        ...s,
        ...defaultScheduleParts(),
        doctorUuid: lockedDoctorUuid || s.doctorUuid,
      }));
    }
  }, [open, lockedDoctorUuid]);

  /** Clinic path: proactive busy check when doctor + date/time are set. */
  useEffect(() => {
    if (!open || hideDoctorSelect || timing !== 'schedule') {
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
          const startIso = format(snapped, "yyyy-MM-dd'T'HH:mm:ss");
          const endIso = format(addMinutes(snapped, 30), "yyyy-MM-dd'T'HH:mm:ss");
          const busy = await fetchDoctorBusySlots(clinicUuid, resolvedDoctorUuid, {
            from: startIso,
            to: endIso,
          });
          if (cancelled) return;
          if (busy.length > 0) {
            const next = snapToHalfHour(addMinutes(snapped, 30));
            setBusyHint(
              `Doctor not available at ${format(snapped, 'h:mm a')} — try ${format(next, 'h:mm a')}`
            );
          } else {
            setBusyHint(null);
          }
        } catch {
          if (!cancelled) setBusyHint(null);
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    open,
    hideDoctorSelect,
    timing,
    resolvedDoctorUuid,
    form.slotDate,
    form.slotTime,
    clinicUuid,
  ]);

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

  const selectPet = (p: ClinicPetListModel) => {
    setSelectedPet(p);
    setPetSearch(`${p.name} · ${p.ownerName || 'Owner'}${p.ownerPhone ? ` · ${p.ownerPhone}` : ''}`);
    setHits([]);
  };

  const selectPlatformUser = async (user: PlatformUserSearchModel) => {
    try {
      setSearching(true);
      const owner = await ensureClinicOwnerFromUser(clinicUuid, user.userUuid);
      const petsOfOwner = owner.pets ?? [];
      if (petsOfOwner.length > 0) {
        const op = petsOfOwner[0];
        selectPet({
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
    if (!resolvedDoctorUuid) errors.doctorUuid = 'Doctor is required to schedule';
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
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const patientPayload = () => {
    if (mode === 'existing' && selectedPet) {
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
    if (mode === 'new' && !validateNewPatient()) {
      toast.error('Fix the highlighted fields');
      return;
    }
    if (timing === 'schedule' && !validateSchedule()) {
      toast.error('Fix the schedule fields');
      return;
    }

    setSaving(true);
    try {
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
          doctorUuid: doctorUuid!,
          slotStart: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
          durationMinutes: 30,
          notes: form.reason || undefined,
          mode: 'IN_PERSON',
        });
        toast.success('Appointment scheduled — doctor notified');
      }
      onCreated();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
            }}
          >
            New patient
          </button>
        </div>

        {mode === 'existing' ? (
          <div className="space-y-3 mt-1">
            <div>
              <Label>Search pet or owner</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 pr-9"
                  placeholder="Type name, phone, or email..."
                  value={petSearch}
                  readOnly={!!selectedPet}
                  autoFocus
                  onChange={(e) => {
                    if (selectedPet) return;
                    setPetSearch(e.target.value);
                  }}
                />
                {selectedPet && (
                  <button
                    type="button"
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={clearSelectedPet}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {selectedPet && (
                <div className="mt-2">
                  <Badge variant="secondary" className="gap-1 py-1.5 px-2.5">
                    Selected: {selectedPet.name} · {selectedPet.ownerName || 'Owner'}
                  </Badge>
                </div>
              )}
            </div>
            {selectedPet ? null : searching ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                {hits.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    {debouncedQ
                      ? 'No matching KittyP users, pets, or owners — try New patient'
                      : 'Start typing to search KittyP users and clinic patients'}
                  </p>
                ) : (
                  hits.map((hit) =>
                    hit.kind === 'user' ? (
                      <button
                        key={`user-${hit.user.userUuid}`}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                        onClick={() => void selectPlatformUser(hit.user)}
                      >
                        <div className="font-medium flex items-center gap-2">
                          {hit.user.name}
                          <Badge variant="secondary" className="text-[10px]">
                            KittyP
                          </Badge>
                          {hit.user.alreadyClient ? (
                            <Badge variant="outline" className="text-[10px]">
                              Client · add pet
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground text-xs">{hit.user.email || '—'}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5 break-all">
                          Owner ID: {hit.user.userUuid}
                        </div>
                      </button>
                    ) : (
                      <button
                        key={hit.pet.petUuid}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60"
                        onClick={() => selectPet(hit.pet)}
                      >
                        <div className="font-medium">{hit.pet.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {hit.pet.ownerName}
                          {hit.pet.ownerPhone ? ` · ${hit.pet.ownerPhone}` : ''}
                          {hit.pet.ownerEmail ? ` · ${hit.pet.ownerEmail}` : ''}
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 mt-1">
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
                <Input value={form.ownerLastName} onChange={(e) => set('ownerLastName', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
                onBlur={() => {
                  const err = validateEmail(form.ownerEmail);
                  if (err) setFieldErrors((s) => ({ ...s, ownerEmail: err }));
                }}
              />
              {fieldErrors.ownerEmail && (
                <p className="text-xs text-destructive mt-1">{fieldErrors.ownerEmail}</p>
              )}
            </div>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Pet name</Label>
                <Input value={form.petName} onChange={(e) => set('petName', e.target.value)} />
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
                    value={form.doctorUuid || undefined}
                    onValueChange={(v) => set('doctorUuid', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDoctors.map((d) => (
                        <SelectItem key={d.doctorUuid} value={d.doctorUuid}>
                          {d.name || d.email || d.doctorUuid}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.doctorUuid && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.doctorUuid}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.slotDate}
                    onChange={(e) => set('slotDate', e.target.value)}
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
