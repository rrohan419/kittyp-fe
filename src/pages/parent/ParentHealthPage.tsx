import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { Heart, PawPrint } from 'lucide-react';
import { RootState } from '@/module/store/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculatePetAgeForDisplay } from '@/services/UserService';

export default function ParentHealthPage() {
  const { user } = useSelector((s: RootState) => s.authReducer);
  const pets = user?.ownerPets ?? [];

  if (pets.length === 1) {
    return <Navigate to={`/app/pets/${pets[0].uuid}`} replace />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Health
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Open a pet for visit history, diagnosis/reports, vaccines, and daily logging. Updates when
          the clinic or doctor changes a visit.
        </p>
      </div>

      {!pets.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <PawPrint className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-semibold">No pets yet</p>
            <Button asChild>
              <Link to="/app/pets">Add a pet</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <Card key={pet.uuid} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <PawPrint className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{pet.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {pet.type} · {pet.dateOfBirth ? calculatePetAgeForDisplay(pet.dateOfBirth) : '—'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pet.healthConditions || 'No conditions on file'} · Weight:{' '}
                  {pet.weight != null ? `${pet.weight} kg` : '—'}
                </p>
                <Button size="sm" className="w-full" asChild>
                  <Link to={`/app/pets/${pet.uuid}`}>Open pet dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
