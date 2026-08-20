import { useEffect, useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PetPhotoField } from '@/components/clinic/PetPhotoField';
import {
  ClinicPetListModel,
  updateClinicPet,
} from '@/services/clinicService';
import { parseApiErrorMessage } from '@/utils/validation';
import { normalizePetGender } from '@/utils/petType';
import { toast } from 'sonner';

const SPECIES_OPTIONS = [
  { value: 'CAT', label: 'Cat' },
  { value: 'DOG', label: 'Dog' },
  { value: 'BIRD', label: 'Bird' },
  { value: 'RABBIT', label: 'Rabbit' },
  { value: 'OTHER', label: 'Other' },
] as const;

const SPECIES_VALUES = new Set<string>(SPECIES_OPTIONS.map((o) => o.value));

function normalizeSpecies(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  return SPECIES_VALUES.has(upper) ? upper : trimmed;
}

type PetForm = {
  name: string;
  species: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  weight: string;
  microchipNumber: string;
  photoUrl: string;
};

const emptyForm: PetForm = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  dateOfBirth: '',
  weight: '',
  microchipNumber: '',
  photoUrl: '',
};

function toDateInput(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formFromPet(pet: ClinicPetListModel): PetForm {
  return {
    name: pet.name || '',
    species: normalizeSpecies(pet.species),
    breed: pet.breed || '',
    gender: normalizePetGender(pet.gender),
    dateOfBirth: toDateInput(pet.dateOfBirth),
    weight: pet.weight || '',
    microchipNumber: pet.microchipNumber || '',
    photoUrl: pet.photoUrl || '',
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicUuid: string;
  pet: ClinicPetListModel;
  onSaved: () => Promise<void> | void;
  canEditMicrochip?: boolean;
};

export function ClinicPetEditDialog({
  open,
  onOpenChange,
  clinicUuid,
  pet,
  onSaved,
  canEditMicrochip = false,
}: Props) {
  const [form, setForm] = useState<PetForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formFromPet(pet));
    }
  }, [open, pet]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warning('Missing information', { description: 'Pet name is required.' });
      return;
    }
    setSaving(true);
    try {
      await updateClinicPet(clinicUuid, pet.petUuid, {
        name: form.name.trim(),
        species: form.species.trim() || undefined,
        breed: form.breed.trim() || undefined,
        gender: form.gender.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        weight: form.weight.trim() || undefined,
        ...(canEditMicrochip ? { microchipNumber: form.microchipNumber.trim() || undefined } : {}),
        photoUrl: form.photoUrl.trim() || undefined,
      });
      toast.success(`${form.name.trim()} updated`);
      onOpenChange(false);
      await onSaved();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to update pet'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit pet details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="clinic-pet-name">Pet name *</Label>
            <Input
              id="clinic-pet-name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-species">Species</Label>
              <Select
                value={form.species || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, species: value }))}
                disabled={saving}
              >
                <SelectTrigger id="clinic-pet-species">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  {form.species && !SPECIES_VALUES.has(form.species.toUpperCase()) ? (
                    <SelectItem value={form.species}>{form.species}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-breed">Breed</Label>
              <Input
                id="clinic-pet-breed"
                value={form.breed}
                onChange={(e) => setForm((s) => ({ ...s, breed: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-gender">Gender</Label>
              <Select
                value={form.gender || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, gender: value }))}
                disabled={saving}
              >
                <SelectTrigger id="clinic-pet-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-dob">Date of birth</Label>
              <Input
                id="clinic-pet-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((s) => ({ ...s, dateOfBirth: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-weight">Weight</Label>
              <Input
                id="clinic-pet-weight"
                value={form.weight}
                onChange={(e) => setForm((s) => ({ ...s, weight: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-pet-microchip">Microchip</Label>
              <Input
                id="clinic-pet-microchip"
                value={form.microchipNumber}
                onChange={(e) => setForm((s) => ({ ...s, microchipNumber: e.target.value }))}
                disabled={saving || !canEditMicrochip}
                readOnly={!canEditMicrochip}
                placeholder={canEditMicrochip ? '' : '—'}
              />
            </div>
          </div>
          <PetPhotoField
            value={form.photoUrl || null}
            onChange={(url) => setForm((s) => ({ ...s, photoUrl: url || '' }))}
            disabled={saving}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
