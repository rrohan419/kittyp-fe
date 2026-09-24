import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Calendar, Bell } from 'lucide-react';
import { useNutritionPets } from '@/hooks/useNutritionPets';
import { PetHealthTimeline } from './PetHealthTimeline';
import { NotificationSettings } from './NotificationSettings';
import { WeeklyDigestWidget } from './WeeklyDigestWidget';
import { PetBadges } from './PetBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MultiPetHealthDashboardProps {
  userId: string;
}

export const MultiPetHealthDashboard: React.FC<MultiPetHealthDashboardProps> = ({ userId: _userId }) => {
  const { pets, loading } = useNutritionPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const selectedPet = pets.find((pet) => pet.uuid === selectedPetId) ?? pets[0] ?? null;

  useEffect(() => {
    if (!selectedPetId && pets[0]) setSelectedPetId(pets[0].uuid);
  }, [pets, selectedPetId]);

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading pets...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader><CardTitle>My Pets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pets are available.</p>
              ) : pets.map((pet) => (
                <Button
                  key={pet.uuid}
                  variant={selectedPet?.uuid === pet.uuid ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedPetId(pet.uuid)}
                >
                  <Heart className="mr-2 h-4 w-4" />{pet.name}
                </Button>
              ))}
              {selectedPet && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />Schedule Appointment
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />Set Reminder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          {selectedPet ? (
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-4">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="digest">Weekly Digest</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline"><PetHealthTimeline petId={selectedPet.uuid} petName={selectedPet.name} /></TabsContent>
              <TabsContent value="digest"><WeeklyDigestWidget pet={selectedPet} /></TabsContent>
              <TabsContent value="badges"><PetBadges petName={selectedPet.name} /></TabsContent>
              <TabsContent value="notifications"><NotificationSettings /></TabsContent>
            </Tabs>
          ) : (
            <Card><CardContent className="py-12 text-center"><Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" /><h3 className="mb-2 text-xl font-semibold">No pets registered</h3><p className="text-muted-foreground">Add a pet to view its live health timeline.</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};
