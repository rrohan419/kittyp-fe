import { Activity, CalendarDays, ClipboardList, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PetProfile } from '@/services/authService';
import { formatPetAgeCompact, formatPetDobDate } from '@/utils/petAge';
import { formatPetType } from '@/utils/petType';
import { formatPetWeight } from '@/utils/formatPetWeight';

type Props = {
  pet: PetProfile;
  latestWeight?: number | null;
  onEdit?: () => void;
};

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">
        {value?.trim() || <span className="font-normal text-muted-foreground">Not added</span>}
      </dd>
    </div>
  );
}

export function PetOverviewDetails({ pet, latestWeight, onEdit }: Props) {
  const weight = formatPetWeight(latestWeight ?? pet.weight);
  const age = pet.dateOfBirth ? formatPetAgeCompact(pet.dateOfBirth) : '';

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-background p-2.5 text-primary shadow-sm">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">Pet information</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">The little details that make your pet unique.</p>
          </div>
        </div>
        {onEdit && (
          <Button type="button" variant="outline" size="sm" className="shrink-0 bg-background" onClick={onEdit}>
            <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Edit details
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-5 sm:p-6">
        <section aria-labelledby="pet-basics-heading" className="space-y-4">
          <h3 id="pet-basics-heading" className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            The basics
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            <Detail label="Species" value={formatPetType(pet.type)} />
            <Detail label="Breed" value={pet.breed} />
            <Detail label="Gender" value={pet.gender} />
            <Detail label="Date of birth" value={pet.dateOfBirth ? formatPetDobDate(pet.dateOfBirth) : ''} />
            <Detail label="Age" value={age} />
            <Detail label="Weight" value={weight ? `${weight} kg` : ''} />
            <Detail
              label="Neutered / spayed"
              value={pet.isNeutered === true ? 'Yes' : pet.isNeutered === false ? 'No' : ''}
            />
            <Detail label="Microchip number" value={pet.microchipNumber} />
          </dl>
        </section>
        <div className="border-t" />
        <section aria-labelledby="pet-care-heading" className="space-y-4">
          <h3 id="pet-care-heading" className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            Everyday care
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            <Detail label="Activity level" value={pet.activityLevel} />
            <Detail label="Current food brand" value={pet.currentFoodBrand} />
          </dl>
        </section>
      </CardContent>
    </Card>
  );
}
