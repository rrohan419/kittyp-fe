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
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import { PatientSearch } from '@/components/clinic/PatientSearch';
import { PatientModeSelector } from '@/components/clinic/PatientModeSelector';
import { PetDobField } from '@/components/ui/PetDobField';
import { BreedInput } from '@/components/ui/BreedInput';
import {
  admitClinicPet,
  ensureClinicOwnerFromUser,
  sendClientAttachOtp,
  sendPetConsentOtp,
  verifyClientAttachOtp,
  verifyPetConsentOtp,
  type ClinicOwnerPetModel,
  type ClinicOwnerModel,
  type ClinicPetListModel,
  type ClinicVisitModel,
  type PlatformUserSearchModel,
  type VisitUrgency,
} from '@/services/clinicService';
import { PetNameType } from '@/components/ui/PetNameType';
import { createPrescriptionFirst, type PrescriptionFirstPayload } from '@/services/visitService';
import { isValidWeight } from '@/utils/weightValidation';
import {
  digitsOnlyPhone,
  parseApiErrorMessage,
  validateEmail,
  validatePhone,
} from '@/utils/validation';

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
  newPetSpecies: 'CAT',
  newPetBreed: '',
  dateOfBirth: '',
  petPhotoUrl: '',
  reason: '',
  urgency: 'ROUTINE' as VisitUrgency,
  temperatureC: '',
  weightKg: '',
  examinationNotes: '',
  assessment: '',
  plan: '',
  nextVisitNotes: '',
};

export function PrescriptionFirstDialog({ open, onOpenChange, clinicUuid, onCreated }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [searchScope, setSearchScope] = useState<'local' | 'global'>('local');
  const [search, setSearch] = useState('');
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [petUuid, setPetUuid] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [attachUser, setAttachUser] = useState<PlatformUserSearchModel | null>(null);
  const [attachCode, setAttachCode] = useState('');
  const [pendingPet, setPendingPet] = useState<ClinicOwnerPetModel | null>(null);
  const [ownerPets, setOwnerPets] = useState<ClinicOwnerPetModel[]>([]);
  const [attachedOwnerUuid, setAttachedOwnerUuid] = useState('');
  const [consentPet, setConsentPet] = useState<ClinicPetListModel | null>(null);
  const [consentCode, setConsentCode] = useState('');

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  // Dialog stays mounted between uses — start blank on every open.
  useEffect(() => {
    if (!open) return;
    setMode('existing');
    setSearchScope('local');
    setSearch('');
    setPetUuid('');
    setSelectedLabel('');
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setConflict(false);
    setAttachUser(null);
    setAttachCode('');
    setPendingPet(null);
    setOwnerPets([]);
    setAttachedOwnerUuid('');
    setConsentPet(null);
    setConsentCode('');
  }, [open]);

  const selectPet = async (pet: ClinicPetListModel) => {
    try {
      setSelectionBusy(true);
      const admitted = await admitClinicPet(clinicUuid, pet.petUuid);
      setPetUuid(admitted.petUuid);
      setSearch(admitted.name);
      setSelectedLabel(`${admitted.name} · ${admitted.ownerName}`);
      setOwnerPets([]);
      setConsentPet(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (message.toLowerCase().includes('consent') && pet.ownerUuid) {
        setConsentPet(pet);
        toast.error('Owner consent required — send and verify the email OTP for this pet');
      } else {
        toast.error(message || 'Could not admit pet to this clinic');
      }
    } finally {
      setSelectionBusy(false);
    }
  };

  const verifyConsent = async () => {
    if (!consentPet || !consentCode.trim()) return;
    try {
      setSelectionBusy(true);
      await verifyPetConsentOtp(clinicUuid, consentPet.ownerUuid, consentPet.name, consentCode.trim());
      setConsentCode('');
      await selectPet(consentPet);
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Invalid consent code'));
    } finally {
      setSelectionBusy(false);
    }
  };

  const sendConsent = async () => {
    if (!consentPet) return;
    try {
      setSelectionBusy(true);
      await sendPetConsentOtp(clinicUuid, consentPet.ownerUuid, consentPet.name);
      toast.success('Consent code sent to owner email');
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Could not send consent code'));
    } finally {
      setSelectionBusy(false);
    }
  };

  const changeMode = (next: 'existing' | 'new') => {
    if (next === mode) return;
    setMode(next);
    setPetUuid('');
    setSelectedLabel('');
    setAttachUser(null);
    setAttachCode('');
    setPendingPet(null);
    setOwnerPets([]);
    setAttachedOwnerUuid('');
    setConsentPet(null);
    setConsentCode('');
  };

  const selectClient = (owner: ClinicOwnerModel) => {
    const [first = '', ...last] = (owner.name || '').trim().split(/\s+/);
    setForm((current) => ({
      ...current,
      ownerFirstName: owner.firstName || first,
      ownerLastName: owner.lastName || last.join(' '),
      ownerEmail: owner.email || '',
      ownerPhone: digitsOnlyPhone(owner.phone || ''),
    }));
    setMode('new');
    toast.message('Client selected — add a pet for this prescription');
  };

  const selectAttachedOwner = async (owner: ClinicOwnerModel, pet?: ClinicOwnerPetModel | null) => {
    if (pet) {
      await selectPet({
        ...pet,
        ownerUuid: owner.ownerUuid,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerPhone: owner.phone,
        linked: owner.linked,
      });
    } else if (owner.pets?.length) {
      setOwnerPets(owner.pets);
      setAttachedOwnerUuid(owner.ownerUuid);
    } else {
      selectClient(owner);
    }
  };

  const selectPlatformUser = async (user: PlatformUserSearchModel, pet?: ClinicOwnerPetModel) => {
    try {
      setSelectionBusy(true);
      if (user.alreadyClient) {
        const owner = await ensureClinicOwnerFromUser(clinicUuid, user.userUuid);
        await selectAttachedOwner(owner, pet);
      } else {
        await sendClientAttachOtp(clinicUuid, user.userUuid);
        setAttachUser(user);
        setPendingPet(pet ?? null);
        setAttachCode('');
        toast.success('Confirmation code sent to their email — enter it to attach this account');
      }
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Could not select KittyP user'));
    } finally {
      setSelectionBusy(false);
    }
  };

  const verifyAttach = async () => {
    if (!attachUser || !attachCode.trim()) return;
    try {
      setSelectionBusy(true);
      await verifyClientAttachOtp(clinicUuid, attachUser.userUuid, attachCode.trim());
      const owner = await ensureClinicOwnerFromUser(clinicUuid, attachUser.userUuid);
      setAttachUser(null);
      setAttachCode('');
      setPendingPet(null);
      toast.success('Account attached');
      await selectAttachedOwner(owner, pendingPet);
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(err, 'Could not attach account'));
    } finally {
      setSelectionBusy(false);
    }
  };

  const save = async (confirmNewConsultation: boolean) => {
    if (!form.plan.trim()) return toast.error('Add a prescription before saving');
    if (form.weightKg && !isValidWeight(form.weightKg)) return toast.error('Enter a valid positive weight in kg');
    if (mode === 'existing' && !petUuid) return toast.error('Select a pet');
    if (mode === 'new') {
      const errors: Record<string, string> = {};
      if (!form.ownerFirstName.trim()) errors.ownerFirstName = 'First name is required';
      const emailError = validateEmail(form.ownerEmail);
      if (emailError) errors.ownerEmail = emailError;
      const phoneError = validatePhone(form.ownerPhone, false);
      if (phoneError) errors.ownerPhone = phoneError;
      if (!form.newPetName.trim()) errors.newPetName = 'Pet name is required';
      setFieldErrors(errors);
      if (Object.keys(errors).length) return toast.error('Fix the highlighted fields');
    }

    const vitals: Record<string, unknown> = {};
    if (form.temperatureC && Number.isFinite(Number(form.temperatureC))) vitals.temperatureC = Number(form.temperatureC);
    if (form.weightKg && Number.isFinite(Number(form.weightKg))) vitals.weightKg = Number(form.weightKg);

    const payload: PrescriptionFirstPayload = {
      clinicUuid,
      confirmNewConsultation,
      reasonForVisit: form.reason.trim() || undefined,
      urgency: form.urgency,
      chart: {
        examinationNotes: form.examinationNotes || undefined,
        assessment: form.assessment || undefined,
        plan: form.plan.trim(),
        nextVisitNotes: form.nextVisitNotes || undefined,
        vitals: Object.keys(vitals).length ? vitals : undefined,
        weightMeasured: !!form.weightKg,
      },
      ...(mode === 'existing'
        ? { petUuid }
        : {
            owner: {
              firstName: form.ownerFirstName.trim(),
              lastName: form.ownerLastName.trim() || undefined,
              email: form.ownerEmail.trim(),
              phone: digitsOnlyPhone(form.ownerPhone) || undefined,
            },
            newPet: {
              name: form.newPetName.trim(),
              species: form.newPetSpecies || undefined,
              breed: form.newPetBreed.trim() || undefined,
              dateOfBirth: form.dateOfBirth || undefined,
              photoUrl: form.petPhotoUrl || undefined,
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
          <PatientModeSelector value={mode} onChange={changeMode} disabled={selectionBusy} />

          {mode === 'existing' ? (
            <div className="space-y-2">
              <PatientSearch
                clinicUuid={clinicUuid}
                scope={searchScope}
                query={search}
                inputId="rx-pet-search"
                disabled={selectionBusy}
                paused={Boolean(petUuid || attachUser || consentPet || ownerPets.length)}
                onQueryChange={(value) => { setSearch(value); setPetUuid(''); setSelectedLabel(''); }}
                onScopeChange={(scope) => {
                  setSearchScope(scope);
                  setPetUuid('');
                  setSelectedLabel('');
                  setAttachUser(null);
                  setAttachCode('');
                  setPendingPet(null);
                  setOwnerPets([]);
                  setAttachedOwnerUuid('');
                  setConsentPet(null);
                  setConsentCode('');
                }}
                onSelect={(hit) => {
                  if (hit.kind === 'pet') void selectPet(hit.pet);
                  else if (hit.kind === 'client') selectClient(hit.owner);
                  else if (hit.kind === 'user') void selectPlatformUser(hit.user);
                  else if (hit.pet.clinicPatient) void selectPet({
                    ...hit.pet, ownerUuid: hit.user.clinicOwnerUuid ?? '', ownerName: hit.user.name,
                    ownerEmail: hit.user.email, ownerPhone: hit.user.phone, linked: hit.user.alreadyClient,
                  });
                  else void selectPlatformUser(hit.user, hit.pet);
                }}
              />
              {attachUser ? (
                <div className="flex gap-2">
                  <Input
                    value={attachCode}
                    onChange={(e) => setAttachCode(e.target.value)}
                    placeholder="Email OTP from pet parent"
                  />
                  <Button size="sm" onClick={() => void verifyAttach()} disabled={selectionBusy || !attachCode.trim()}>
                    Verify OTP
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={selectionBusy}
                    onClick={() => { setAttachUser(null); setAttachCode(''); setPendingPet(null); }}>
                    Cancel
                  </Button>
                </div>
              ) : null}
              {!petUuid && ownerPets.length > 0 ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Select a pet on this client&apos;s account.</p>
                  <Button type="button" variant="ghost" size="sm" disabled={selectionBusy}
                    onClick={() => { setOwnerPets([]); setAttachedOwnerUuid(''); }}>
                    Cancel
                  </Button>
                </div>
              ) : null}
              {!petUuid && ownerPets.map((p) => (
                <button
                  key={p.petUuid}
                  type="button"
                  disabled={selectionBusy}
                  className="block w-full text-left text-sm border rounded-md px-3 py-2"
                  onClick={() =>
                    void selectPet({
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
                      disabled={selectionBusy}
                      onClick={() => void sendConsent()}
                    >
                      Send code
                    </Button>
                    <Input
                      value={consentCode}
                      onChange={(e) => setConsentCode(e.target.value)}
                      placeholder="OTP code"
                    />
                    <Button size="sm" onClick={() => void verifyConsent()} disabled={selectionBusy || !consentCode.trim()}>
                      Verify &amp; select
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={selectionBusy}
                      onClick={() => { setConsentPet(null); setConsentCode(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              {petUuid ? (
                <div className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2">
                  <span>Selected: {selectedLabel} ✓</span>
                  <Button type="button" variant="ghost" size="sm" disabled={selectionBusy}
                    onClick={() => { setPetUuid(''); setSelectedLabel(''); setSearch(''); }}>
                    Change
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rx-owner-name">Owner first name *</Label>
                <Input
                  id="rx-owner-name"
                  value={form.ownerFirstName}
                  onChange={set('ownerFirstName')}
                  required
                />
                {fieldErrors.ownerFirstName ? (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.ownerFirstName}</p>
                ) : null}
              </div>
              {field('rx-owner-last-name', 'Owner last name', 'ownerLastName')}
              <div>
                <Label htmlFor="rx-owner-phone">Owner phone (optional)</Label>
                <Input
                  id="rx-owner-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.ownerPhone}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, ownerPhone: digitsOnlyPhone(e.target.value) }));
                    setFieldErrors((current) => {
                      if (!current.ownerPhone) return current;
                      const next = { ...current };
                      delete next.ownerPhone;
                      return next;
                    });
                  }}
                />
                {fieldErrors.ownerPhone ? (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.ownerPhone}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="rx-owner-email">Owner email *</Label>
                <Input
                  id="rx-owner-email"
                  type="email"
                  value={form.ownerEmail}
                  onChange={set('ownerEmail')}
                  required
                />
                {fieldErrors.ownerEmail ? (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.ownerEmail}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="rx-pet-name">Pet name *</Label>
                <Input
                  id="rx-pet-name"
                  value={form.newPetName}
                  onChange={set('newPetName')}
                  required
                />
                {fieldErrors.newPetName ? (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.newPetName}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="rx-pet-species">Species</Label>
                <Select
                  value={form.newPetSpecies || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, newPetSpecies: v, newPetBreed: f.newPetSpecies === v ? f.newPetBreed : '' }))}
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
              <div className="col-span-2">
                <Label htmlFor="rx-pet-breed">Breed</Label>
                <BreedInput id="rx-pet-breed" species={form.newPetSpecies} value={form.newPetBreed} onChange={(v) => setForm((f) => ({ ...f, newPetBreed: v }))} />
              </div>
              <div className="col-span-2">
                <PetDobField
                  id="rx-pet-dob"
                  value={form.dateOfBirth}
                  onChange={(dateOfBirth) => setForm((f) => ({ ...f, dateOfBirth }))}
                  defaultMode="months"
                />
              </div>
              <PetPhotoField
                className="col-span-2"
                value={form.petPhotoUrl || null}
                onChange={(petPhotoUrl) => setForm((f) => ({ ...f, petPhotoUrl: petPhotoUrl || '' }))}
                disabled={saving}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rx-reason">Reason for visit</Label>
              <Input
                id="rx-reason"
                value={form.reason}
                onChange={set('reason')}
                placeholder="e.g. Leg injury"
              />
            </div>
            <div>
              <Label htmlFor="rx-urgency">Urgency</Label>
              <Select
                value={form.urgency}
                onValueChange={(urgency) => {
                  if (urgency === 'ROUTINE' || urgency === 'URGENT') {
                    setForm((f) => ({ ...f, urgency }));
                  }
                }}
              >
                <SelectTrigger id="rx-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
