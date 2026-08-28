import { useEffect, useState, FormEvent } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PetPhotoUpload } from '@/components/ui/PetPhotoUpload';
import { PetProfile } from '@/services/authService';
import { AddPet, UpdatePet } from '@/services/UserService';
import { addPetToUser, updatePetInUser } from '@/module/slice/AuthSlice';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { normalizePetGender } from '@/utils/petType';

type PetForm = Omit<UpdatePet, 'uuid' | 'isNeutered'> & { isNeutered: string; type: string };

const emptyForm: PetForm = {
  name: '',
  profilePicture: '',
  type: '',
  breed: '',
  dateOfBirth: '',
  weight: '',
  activityLevel: '',
  gender: '',
  currentFoodBrand: '',
  healthConditions: '',
  allergies: '',
  isNeutered: '',
};

function extractNumericWeight(rawWeight: string): string {
  if (!rawWeight) return '';
  const match = rawWeight.toString().match(/\d+(?:\.\d+)?/);
  return match ? match[0] : '';
}

function formatWeightForSave(rawWeight: string): string {
  if (!rawWeight) return '';
  const numeric = extractNumericWeight(rawWeight);
  if (!numeric) return '';
  return `${numeric} kg`;
}

function toDateInput(value?: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formFromPet(pet: PetProfile): PetForm {
  return {
    name: pet.name || '',
    profilePicture: pet.profilePicture || '',
    type: pet.type || '',
    breed: pet.breed || '',
    dateOfBirth: toDateInput(pet.dateOfBirth),
    weight: extractNumericWeight(pet.weight),
    activityLevel: pet.activityLevel || '',
    gender: normalizePetGender(pet.gender),
    currentFoodBrand: pet.currentFoodBrand || '',
    healthConditions: pet.healthConditions || '',
    allergies: pet.allergies || '',
    isNeutered: pet.isNeutered ? 'yes' : 'no',
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: PetProfile | null;
  onSaved?: () => Promise<void> | void;
};

export function OwnerPetEditDialog({ open, onOpenChange, pet, onSaved }: Props) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((state) => state.authReducer.saving);
  const [form, setForm] = useState<PetForm>(emptyForm);
  const isEdit = !!pet?.uuid;

  useEffect(() => {
    if (!open) return;
    setForm(pet ? formFromPet(pet) : emptyForm);
  }, [open, pet]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    try {
      if (isEdit && pet) {
        const updatePetDto: UpdatePet = {
          uuid: pet.uuid,
          name: form.name,
          profilePicture: form.profilePicture,
          type: form.type,
          breed: form.breed,
          dateOfBirth: form.dateOfBirth,
          weight: formatWeightForSave(form.weight),
          activityLevel: form.activityLevel,
          gender: form.gender,
          currentFoodBrand: form.currentFoodBrand,
          healthConditions: form.healthConditions,
          allergies: form.allergies,
          isNeutered: form.isNeutered === 'yes',
        };
        await dispatch(updatePetInUser(updatePetDto)).unwrap();
      } else {
        const addPetDto: AddPet = {
          name: form.name,
          profilePicture: form.profilePicture,
          type: form.type,
          breed: form.breed,
          dateOfBirth: form.dateOfBirth,
          weight: formatWeightForSave(form.weight),
          activityLevel: form.activityLevel,
          gender: form.gender,
          currentFoodBrand: form.currentFoodBrand,
          healthConditions: form.healthConditions,
          allergies: form.allergies,
          isNeutered: form.isNeutered === 'yes',
        };
        await dispatch(addPetToUser({ petDto: addPetDto })).unwrap();
      }
      onOpenChange(false);
      await onSaved?.();
    } catch {
      // toast handled in updatePetInUser
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${pet?.name ?? 'pet'}` : 'Add pet'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4 py-2">
            <PetPhotoUpload
              currentPhotos={form.profilePicture ? [form.profilePicture] : []}
              petUuid={isEdit ? pet?.uuid : undefined}
              onUploadComplete={(urls) => {
                setForm((s) => ({ ...s, profilePicture: urls[0] || '' }));
              }}
              petName={form.name}
              maxPhotos={1}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner-pet-name">Pet Name *</Label>
              <Input
                id="owner-pet-name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-type">Pet Type</Label>
              <Select
                value={form.type || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, type: value }))}
                disabled={saving}
              >
                <SelectTrigger id="owner-pet-type">
                  <SelectValue placeholder="Select pet type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-breed">Breed</Label>
              <Input
                id="owner-pet-breed"
                value={form.breed}
                onChange={(e) => setForm((s) => ({ ...s, breed: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-dob">Date of Birth</Label>
              <DatePicker
                id="owner-pet-dob"
                value={form.dateOfBirth}
                onChange={(dateOfBirth) => setForm((s) => ({ ...s, dateOfBirth }))}
                placeholder="Select date of birth"
                disableFuture
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-weight">Weight (kg)</Label>
              <Input
                id="owner-pet-weight"
                type="number"
                value={form.weight}
                onChange={(e) => setForm((s) => ({ ...s, weight: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-activity">Activity Level</Label>
              <Select
                value={form.activityLevel || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, activityLevel: value }))}
                disabled={saving}
              >
                <SelectTrigger id="owner-pet-activity">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very-high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-gender">Gender</Label>
              <Select
                value={form.gender || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, gender: value }))}
                disabled={saving}
              >
                <SelectTrigger id="owner-pet-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-pet-neutered">Neutered/Spayed</Label>
              <Select
                value={form.isNeutered || undefined}
                onValueChange={(value) => setForm((s) => ({ ...s, isNeutered: value }))}
                disabled={saving}
              >
                <SelectTrigger id="owner-pet-neutered">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && pet.microchipNumber ? (
          <div className="space-y-2">
            <Label htmlFor="owner-pet-microchip">Microchip</Label>
            <Input
              id="owner-pet-microchip"
              value={pet.microchipNumber}
              readOnly
              disabled
            />
          </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="owner-pet-food">Current Food Brand</Label>
            <Input
              id="owner-pet-food"
              value={form.currentFoodBrand}
              onChange={(e) => setForm((s) => ({ ...s, currentFoodBrand: e.target.value }))}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-pet-health">Health Conditions</Label>
            <Textarea
              id="owner-pet-health"
              value={form.healthConditions}
              onChange={(e) => setForm((s) => ({ ...s, healthConditions: e.target.value }))}
              rows={3}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-pet-allergies">Food Allergies/Sensitivities</Label>
            <Textarea
              id="owner-pet-allergies"
              value={form.allergies}
              onChange={(e) => setForm((s) => ({ ...s, allergies: e.target.value }))}
              rows={2}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : isEdit ? 'Save' : 'Add pet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
