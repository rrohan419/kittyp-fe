import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  ClinicDoctorModel,
  ClinicOwnerModel,
  ClinicPetListModel,
  PlatformUserSearchModel,
  createWalkInVisit,
  ensureClinicOwnerFromUser,
  fetchClinicOwners,
  fetchClinicPets,
  searchPlatformUsers,
  VisitUrgency,
} from '@/services/clinicService';
import { digitsOnlyPhone, validateEmail, validatePhone } from '@/utils/validation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  doctors: ClinicDoctorModel[];
  onCreated: () => void;
};

const emptyNew = {
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  petName: '',
  petType: 'CAT',
  petBreed: '',
  reason: '',
  urgency: 'ROUTINE' as VisitUrgency,
  doctorUuid: '',
};

type SearchHit =
  | { kind: 'pet'; pet: ClinicPetListModel }
  | { kind: 'owner'; owner: ClinicOwnerModel; pet: ClinicPetListModel }
  | { kind: 'user'; user: PlatformUserSearchModel };

export function WalkInDialog({ open, onOpenChange, clinicUuid, doctors, onCreated }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [petSearch, setPetSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selectedPet, setSelectedPet] = useState<ClinicPetListModel | null>(null);
  const [form, setForm] = useState(emptyNew);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const activeDoctors = useMemo(
    () => doctors.filter((d) => d.isActive !== false && d.doctorUuid),
    [doctors]
  );

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
        const seen = new Set<string>();
        const merged: SearchHit[] = [];
        for (const hit of [...userHits, ...petHits, ...ownerPetHits]) {
          const id =
            hit.kind === 'user' ? `user-${hit.user.userUuid}` : hit.pet.petUuid;
          if (seen.has(id)) continue;
          seen.add(id);
          merged.push(hit);
        }
        setHits(merged.slice(0, 40));
      } catch (err) {
        console.error('Walk-in patient search failed', err);
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
      setForm(emptyNew);
      setSelectedPet(null);
      setPetSearch('');
      setDebouncedQ('');
      setHits([]);
      setMode('existing');
      setFieldErrors({});
    }
  }, [open]);

  const set = (key: keyof typeof emptyNew, value: string) => {
    setForm((s) => ({ ...s, [key]: value }));
    setFieldErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
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
      // No clinic pets yet — switch to new-patient form with account prefilled.
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
      toast.message('Account selected — add the pet for this walk-in');
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

  const submit = async () => {
    if (!clinicUuid) {
      toast.error('No active clinic selected — use the clinic switcher or Add clinic');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'existing') {
        if (!selectedPet) {
          toast.error('Search and select a pet or owner first');
          return;
        }
        await createWalkInVisit(clinicUuid, {
          petUuid: selectedPet.petUuid,
          reasonForVisit: form.reason || undefined,
          urgency: form.urgency,
          doctorUuid: form.doctorUuid || undefined,
        });
      } else {
        if (!validateNewPatient()) {
          toast.error('Fix the highlighted fields');
          return;
        }
        await createWalkInVisit(clinicUuid, {
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
          },
          reasonForVisit: form.reason || undefined,
          urgency: form.urgency,
          doctorUuid: form.doctorUuid || undefined,
        });
      }
      toast.success('Walk-in added to waitlist');
      onCreated();
      onOpenChange(false);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response
        ?.status;
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (status === 404
          ? 'Visit API not found — restart the backend with the latest build'
          : status === 500
            ? 'Server error creating walk-in — try again; if it persists, restart the backend'
            : 'Failed to create walk-in');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add walk-in</DialogTitle>
          <DialogDescription>
            Unscheduled clinic arrival — goes to the waitlist. Assign a doctor now or later from the
            board.
          </DialogDescription>
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
                <Input value={form.petType} onChange={(e) => set('petType', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Breed</Label>
              <Input value={form.petBreed} onChange={(e) => set('petBreed', e.target.value)} />
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div>
            <Label>Reason for visit</Label>
            <Input
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              placeholder="e.g. Leg injury"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
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
              {activeDoctors.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No doctors linked yet. Invite under Doctors — then assign here or from the board.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add to waitlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
