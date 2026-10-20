import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  admitClinicPet,
  ensureClinicOwnerFromUser,
  fetchClinicOwners,
  fetchClinicPets,
  searchPlatformUsers,
  sendClientAttachOtp,
  sendPetConsentOtp,
  verifyClientAttachOtp,
  verifyPetConsentOtp,
  type ClinicOwnerPetModel,
  type ClinicPetListModel,
  type ClinicVisitModel,
  type PlatformUserSearchModel,
} from '@/services/clinicService';
import {
  APPOINTMENT_SEARCH_MIN,
  matchesEmailOrGeneratedId,
  normalizeAppointmentSearchQuery,
} from '@/utils/appointmentPatientSearch';

type SearchHit =
  | { kind: 'pet'; pet: ClinicPetListModel }
  | { kind: 'user'; user: PlatformUserSearchModel };
import { Badge } from '@/components/ui/badge';
import { PetNameType } from '@/components/ui/PetNameType';
import { createPrescriptionFirst, type PrescriptionFirstPayload } from '@/services/visitService';
import { parseApiErrorMessage } from '@/utils/validation';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  onCreated: (visit: ClinicVisitModel) => void;
};

const EMPTY_FORM = {
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  newPetName: '',
  newPetSpecies: '',
  newPetBreed: '',
  temperatureC: '',
  weightKg: '',
  examinationNotes: '',
  assessment: '',
  plan: '',
  nextVisitNotes: '',
};

export function PrescriptionFirstDialog({ open, onOpenChange, clinicUuid, onCreated }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [petUuid, setPetUuid] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [attachUser, setAttachUser] = useState<PlatformUserSearchModel | null>(null);
  const [attachCode, setAttachCode] = useState('');
  const [ownerPets, setOwnerPets] = useState<ClinicOwnerPetModel[]>([]);
  const [attachedOwnerUuid, setAttachedOwnerUuid] = useState('');
  const [consentPet, setConsentPet] = useState<ClinicPetListModel | null>(null);
  const [consentCode, setConsentCode] = useState('');

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Dialog stays mounted between uses — start blank on every open.
  useEffect(() => {
    if (!open) return;
    setMode('existing');
    setSearch('');
    setHits([]);
    setPetUuid('');
    setSelectedLabel('');
    setForm(EMPTY_FORM);
    setConflict(false);
    setAttachUser(null);
    setAttachCode('');
    setOwnerPets([]);
    setAttachedOwnerUuid('');
    setConsentPet(null);
    setConsentCode('');
  }, [open ]);

  // Same existing-patient search as new appointment (WalkInDialog): clinic pets + owners +
  // KittyP users in one deduped list, filtered by email / generated ID.
  useEffect(() => {
    if (!open || mode !== 'existing' || petUuid) return;
    const t = setTimeout(() => {
      const q = normalizeAppointmentSearchQuery(search);
      if (q.length < APPOINTMENT_SEARCH_MIN) {
        setHits([]);
        return;
      }
      const emailOrId = { by: 'emailOrId' as const };
      void Promise.all([
        fetchClinicPets(clinicUuid, q, { ...emailOrId, pageSize: 50 }),
        fetchClinicOwners(clinicUuid, q, { ...emailOrId, pageSize: 50 }),
        searchPlatformUsers(clinicUuid, q, emailOrId),
      ])
        .then(([petsPage, ownersPage, users]) => {
          const merged: SearchHit[] = [];
          const seenPet = new Set<string>();
          const seenOwner = new Set<string>();
          const addPet = (pet: ClinicPetListModel) => {
            if (seenPet.has(pet.petUuid)) return;
            seenPet.add(pet.petUuid);
            if (pet.ownerUuid) seenOwner.add(pet.ownerUuid);
            if (pet.ownerEmail) seenOwner.add(pet.ownerEmail.toLowerCase());
            merged.push({ kind: 'pet', pet });
          };
          (petsPage.models ?? []).slice(0, 30).forEach(addPet);
          (ownersPage.models ?? []).slice(0, 20).forEach((owner) =>
            (owner.pets ?? []).slice(0, 5).forEach((op) =>
              addPet({
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
              })
            )
          );
          users.slice(0, 20).forEach((user) => {
            if (user.clinicOwnerUuid && seenOwner.has(user.clinicOwnerUuid)) return;
            if (user.email && seenOwner.has(user.email.toLowerCase())) return;
            merged.push({ kind: 'user', user });
          });
          setHits(
            merged
              .filter((hit) =>
                hit.kind === 'user'
                  ? matchesEmailOrGeneratedId(q, hit.user.email, hit.user.userUuid)
                  : matchesEmailOrGeneratedId(
                      q,
                      hit.pet.ownerEmail,
                      hit.pet.ownerUuid,
                      hit.pet.petUuid,
                      hit.pet.globalPetId,
                      hit.pet.patientNumber
                    )
              )
              .slice(0, 40)
          );
        })
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [open, mode, search, clinicUuid, petUuid]);

  // Same as new appointment (WalkInDialog): pet not linked to clinic -> email OTP to share data.
  const selectPet = (pet: ClinicPetListModel) => {
    void admitClinicPet(clinicUuid, pet.petUuid)
      .then((admitted) => {
        setPetUuid(admitted.petUuid);
        setSearch(admitted.name);
        setSelectedLabel(`${admitted.name} · ${admitted.ownerName}`);
        setOwnerPets([]);
        setHits([]);
        setConsentPet(null);
      })
      .catch((err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
        if (message.toLowerCase().includes('consent')) {
          // Same as new appointment: owner email OTP before this pet can be admitted.
          setConsentPet(pet);
          toast.error('Owner consent required — send and verify the email OTP for this pet');
        } else {
          toast.error(message || 'Could not admit pet to this clinic');
        }
      });
  };

  const verifyConsent = () => {
    if (!consentPet || !consentCode.trim()) return;
    void verifyPetConsentOtp(clinicUuid, consentPet.ownerUuid, consentPet.name, consentCode.trim())
      .then(() => {
        setConsentCode('');
        selectPet(consentPet);
      })
      .catch(() => toast.error('Invalid consent code'));
  };

  const selectPlatformUser = (user: PlatformUserSearchModel) => {
    if (user.alreadyClient) {
      void ensureClinicOwnerFromUser(clinicUuid, user.userUuid)
        .then((owner) => {
          setOwnerPets(owner.pets ?? []);
          setAttachedOwnerUuid(owner.ownerUuid);
        })
        .catch(() => toast.error('Could not load existing profile'));
      return;
    }
    setAttachUser(user);
    setAttachCode('');
    void sendClientAttachOtp(clinicUuid, user.userUuid)
      .then(() => toast.success('Confirmation code sent to their email — enter it to attach this account'))
      .catch(() => toast.error('Could not send confirmation code'));
  };

  const verifyAttach = () => {
    if (!attachUser || !attachCode.trim()) return;
    void verifyClientAttachOtp(clinicUuid, attachUser.userUuid, attachCode.trim())
      .then(() => ensureClinicOwnerFromUser(clinicUuid, attachUser.userUuid))
      .then((owner) => {
        setAttachUser(null);
        setOwnerPets(owner.pets ?? []);
        setAttachedOwnerUuid(owner.ownerUuid);
        toast.success('Account attached — select the pet');
      })
      .catch(() => toast.error('Invalid confirmation code'));
  };

  const save = async (confirmNewConsultation: boolean) => {
    if (!form.plan.trim()) return toast.error('Add a prescription before saving');
    if (mode === 'existing' && !petUuid) return toast.error('Select a pet');
    if (mode === 'new' && (!form.ownerFirstName.trim() || !form.ownerEmail.trim() || !form.newPetName.trim()))
      return toast.error('Enter owner name, email and pet name');
    if (mode === 'new' && form.ownerPhone.replace(/\D/g, '').length !== 10)
      return toast.error('Enter a valid 10-digit owner phone');

    const vitals: Record<string, unknown> = {};
    if (form.temperatureC && Number.isFinite(Number(form.temperatureC))) vitals.temperatureC = Number(form.temperatureC);
    if (form.weightKg && Number.isFinite(Number(form.weightKg))) vitals.weightKg = Number(form.weightKg);

    const payload: PrescriptionFirstPayload = {
      clinicUuid,
      confirmNewConsultation,
      chart: {
        examinationNotes: form.examinationNotes || undefined,
        assessment: form.assessment || undefined,
        plan: form.plan.trim(),
        nextVisitNotes: form.nextVisitNotes || undefined,
        vitals: Object.keys(vitals).length ? vitals : undefined,
      },
      ...(mode === 'existing'
        ? { petUuid }
        : {
            owner: {
              firstName: form.ownerFirstName.trim(),
              lastName: form.ownerLastName.trim() || undefined,
              email: form.ownerEmail.trim(),
              phone: form.ownerPhone.replace(/\D/g, ''),
            },
            newPet: {
              name: form.newPetName.trim(),
              species: form.newPetSpecies || undefined,
              breed: form.newPetBreed.trim() || undefined,
            },
          }),
    };

    setSaving(true);
    try {
      const visit = await createPrescriptionFirst(payload);
      setConflict(false);
      onOpenChange(false);
      onCreated(visit);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: unknown }; message?: string };
      if (ax.response?.status === 409) {
        // Not attached anywhere. Doctor decides: open that visit from Appointments, or create separate.
        setConflict(true);
      } else {
        const raw =
          typeof ax.response?.data === 'string'
            ? ax.response.data
            : ax.response?.data
              ? JSON.stringify(ax.response.data)
              : ax.message || '';
        toast.error(parseApiErrorMessage(raw, 'Failed to save prescription'));
      }
    } finally {
      setSaving(false);
    }
  };

  const field = (id: string, label: string, key: keyof typeof form, area?: boolean) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {area ? (
        <Textarea id={id} value={form[key]} onChange={set(key)} />
      ) : (
        <Input id={id} value={form[key]} onChange={set(key)} />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New prescription</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => setMode('existing')}>
              Existing patient
            </Button>
            <Button size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => setMode('new')}>
              New patient
            </Button>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-2">
              <Label htmlFor="rx-pet-search">Search by email or ID</Label>
              <Input
                id="rx-pet-search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPetUuid(''); }}
                placeholder="Owner email, pet ID, or patient number..."
              />
              {!petUuid && !attachUser && ownerPets.length === 0 && hits.length > 0 ? (
                <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                  {hits.map((hit) =>
                    hit.kind === 'pet' ? (
                      <button
                        key={hit.pet.petUuid}
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                        onClick={() => selectPet(hit.pet)}
                      >
                        <PetNameType name={hit.pet.name} type={hit.pet.species} />
                        <p className="text-xs text-muted-foreground truncate">{hit.pet.ownerEmail}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {[hit.pet.patientNumber, hit.pet.globalPetId || hit.pet.petUuid]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </button>
                    ) : (
                      <button
                        key={hit.user.userUuid}
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60"
                        onClick={() => selectPlatformUser(hit.user)}
                      >
                        <div className="font-medium flex items-center gap-2">
                          {hit.user.email || hit.user.name}
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            KittyP
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Not linked to clinic — OTP verification on select
                        </p>
                      </button>
                    )
                  )}
                </div>
              ) : null}
              {attachUser ? (
                <div className="flex gap-2">
                  <Input
                    value={attachCode}
                    onChange={(e) => setAttachCode(e.target.value)}
                    placeholder="Email OTP from pet parent"
                  />
                  <Button size="sm" onClick={verifyAttach} disabled={!attachCode.trim()}>
                    Verify OTP
                  </Button>
                </div>
              ) : null}
              {!petUuid && ownerPets.map((p) => (
                <button
                  key={p.petUuid}
                  type="button"
                  className="block w-full text-left text-sm border rounded-md px-3 py-2"
                  onClick={() =>
                    selectPet({
                      petUuid: p.petUuid,
                      name: p.name,
                      species: p.species,
                      ownerUuid: attachedOwnerUuid,
                      ownerName: '',
                      linked: true,
                    })
                  }
                >
                  {p.name}
                  {p.species ? ` (${p.species})` : ''}
                </button>
              ))}
              {consentPet ? (
                <div className="space-y-2 border rounded-md p-3">
                  <p className="text-sm">
                    Owner consent (email OTP) required to admit {consentPet.name}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void sendPetConsentOtp(clinicUuid, consentPet.ownerUuid, consentPet.name)
                          .then(() => toast.success('Consent code sent to owner email'))
                          .catch(() => toast.error('Could not send consent code'))
                      }
                    >
                      Send code
                    </Button>
                    <Input
                      value={consentCode}
                      onChange={(e) => setConsentCode(e.target.value)}
                      placeholder="OTP code"
                    />
                    <Button size="sm" onClick={verifyConsent} disabled={!consentCode.trim()}>
                      Verify &amp; select
                    </Button>
                  </div>
                </div>
              ) : null}
              {petUuid ? (
                <p className="text-sm border rounded-md px-3 py-2">Selected: {selectedLabel} ✓</p>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {field('rx-owner-name', 'Owner first name', 'ownerFirstName')}
              {field('rx-owner-last-name', 'Owner last name', 'ownerLastName')}
              {field('rx-owner-phone', 'Owner phone (10-digit)', 'ownerPhone')}
              {field('rx-owner-email', 'Owner email', 'ownerEmail')}
              {field('rx-pet-name', 'Pet name', 'newPetName')}
              <div>
                <Label htmlFor="rx-pet-species">Species</Label>
                <Select
                  value={form.newPetSpecies || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, newPetSpecies: v }))}
                >
                  <SelectTrigger id="rx-pet-species">
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
              <div className="col-span-2">{field('rx-pet-breed', 'Breed', 'newPetBreed')}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {field('rx-temp', 'Temperature (°C)', 'temperatureC')}
            {field('rx-weight', 'Weight (kg)', 'weightKg')}
          </div>
          {field('rx-exam', 'Examination / symptoms', 'examinationNotes', true)}
          {field('rx-assessment', 'Diagnosis', 'assessment', true)}
          {field('rx-plan', 'Prescription (medicines, dose, duration)', 'plan', true)}
          {field('rx-followup', 'Follow-up', 'nextVisitNotes')}

          {conflict ? (
            <div className="space-y-2 border rounded-md p-3 text-sm">
              <p>
                An open visit for this pet already exists today. Prescription was <b>not</b> attached to it.
                Open that visit from Appointments, or:
              </p>
              <Button size="sm" disabled={saving} onClick={() => void save(true)}>
                Create separate consultation
              </Button>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={saving} onClick={() => void save(false)}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save prescription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
