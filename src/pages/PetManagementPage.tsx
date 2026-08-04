import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { PawPrint, Plus } from 'lucide-react';
import { RootState } from '@/module/store/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculatePetAgeForDisplay } from '@/services/UserService';

export const PetManagementPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.authReducer);
  const pets = user?.ownerPets ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My Pets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Open a pet dashboard for health history, nutrition logging, and trends.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/app/profile">
            <Plus className="h-4 w-4 mr-1.5" />
            Add pet
          </Link>
        </Button>
      </div>

      {!pets.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center space-y-3">
            <PawPrint className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-semibold">No pets yet</p>
            <p className="text-sm text-muted-foreground">Add a pet from your profile to get started.</p>
            <Button asChild>
              <Link to="/app/profile">Go to Profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pets.map((pet) => (
            <Card key={pet.uuid} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <PawPrint className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{pet.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pet.type} · {pet.breed || 'Mixed'} ·{' '}
                    {pet.dateOfBirth ? calculatePetAgeForDisplay(pet.dateOfBirth) : '—'}
                  </p>
                  {pet.weight != null && (
                    <p className="text-xs text-muted-foreground mt-1">{pet.weight} kg</p>
                  )}
                </div>
                <Button size="sm" asChild>
                  <Link to={`/app/pets/${pet.uuid}`}>Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
