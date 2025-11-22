import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Activity,
  Bell
} from 'lucide-react';
import { usePetManagement } from '@/hooks/usePetManagement';
import { PetSelector } from './PetSelector';
import { PetHealthTimeline } from './PetHealthTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationSettings } from './NotificationSettings';
import { WeeklyDigestWidget } from './WeeklyDigestWidget';
import { PetBadges } from './PetBadges';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PetManagement } from './PetManagement';

interface MultiPetHealthDashboardProps {
  userId: string;
}

export const MultiPetHealthDashboard: React.FC<MultiPetHealthDashboardProps> = ({ userId }) => {
  const { 
    pets, 
    selectedPetId, 
    selectedPet, 
    setSelectedPetId, 
    addPet, 
    updatePet, 
    deletePet 
  } = usePetManagement(userId);
  
  const [showAddPetDialog, setShowAddPetDialog] = useState(false);

  // Mock health stats for all pets
  const getHealthOverview = () => {
    return {
      totalEvents: pets.length * 8, // Mock calculation
      upcomingEvents: pets.length * 2,
      overdueEvents: Math.floor(pets.length * 0.5),
      completedThisMonth: pets.length * 3
    };
  };

  const healthStats = getHealthOverview();

  return (
    <div className="space-y-6">
      {/* Multi-Pet Health Overview */}
      {pets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Health Overview - All Pets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{healthStats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{healthStats.upcomingEvents}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{healthStats.overdueEvents}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{healthStats.completedThisMonth}</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pet Selector Sidebar */}
        <div className="lg:col-span-4">
          <PetSelector
            pets={pets}
            selectedPetId={selectedPetId}
            onSelectPet={setSelectedPetId}
            onAddPet={() => setShowAddPetDialog(true)}
          />

          {/* Quick Actions */}
          {selectedPet && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
                <Button size="sm" variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Health Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          {selectedPet ? (
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="digest">Weekly Digest</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="space-y-4">
                <PetHealthTimeline 
                  petId={selectedPet.id} 
                  petName={selectedPet.name}
                />
              </TabsContent>
              
              <TabsContent value="digest">
                <WeeklyDigestWidget pet={selectedPet} />
              </TabsContent>
              
              <TabsContent value="badges">
                <PetBadges petName={selectedPet.name} />
              </TabsContent>
              
              <TabsContent value="notifications">
                <NotificationSettings />
              </TabsContent>
            </Tabs>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No pets registered</h3>
                <p className="text-muted-foreground mb-6">
                  Add your pets to start tracking their health timeline with vaccinations, 
                  vet visits, and important health events.
                </p>
                <Button onClick={() => setShowAddPetDialog(true)}>
                  Add Your First Pet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Select a pet</h3>
                <p className="text-muted-foreground">
                  Choose a pet from the sidebar to view their health timeline
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Pet Dialog */}
      <Dialog open={showAddPetDialog} onOpenChange={setShowAddPetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Pet</DialogTitle>
          </DialogHeader>
          <PetManagement userId={userId} />
        </DialogContent>
      </Dialog>
    </div>
  );
};