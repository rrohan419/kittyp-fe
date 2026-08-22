import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PetImage } from '@/components/ui/PetImage';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Heart, Calendar, Bell, TrendingUp, Award, Activity, ShoppingBag, Lightbulb, Pencil } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { DailyDetails } from '@/components/nutrition/DailyDetails';
import { ProgressCharts } from '@/components/nutrition/ProgressCharts';
import { ProductRecommendations } from '@/components/nutrition/ProductRecommendations';
import { WellnessTips } from '@/components/nutrition/WellnessTips';
import { RootState } from '@/module/store/store';
import { useSelector } from 'react-redux';
// import { usePetManagement } from '@/hooks/usePetManagement';
import { NutritionDashboard } from '@/components/nutrition/NutritionDashboard';
import { NutritionCalendar } from '@/components/nutrition/NutritionCalender';
import { PetBadges } from '@/components/health/PetBadges';
import { NotificationSettings } from '@/components/health/NotificationSettings';
import { PetProfile } from '@/services/authService';
import { formatPetDobWithAge } from '@/utils/petAge';
import { OwnerPetEditDialog } from '@/components/ui/OwnerPetEditDialog';

const PetDetail: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.authReducer);
  // const { pets, selectedPet, setSelectedPetId } = usePetManagement(user?.uuid || '');
  const [activeTab, setActiveTab] = React.useState('nutrition');
  const [editOpen, setEditOpen] = React.useState(false);
  const pets = user?.ownerPets || [];
  const {
    nutritionPlan,
    stats,
    selectedDate,
    setSelectedDate,
    selectedDayLog,
    isLoading: nutritionLoading,
    updateDailyLog,
    toggleMealCompletion,
    toggleSupplementCompletion,
    logWeight,
  } = useNutrition(uuid || '');

  // Set the selected pet based on URL param
  // React.useEffect(() => {
  //   if (uuid) {
  //     setSelectedPetId(uuid);
  //   }
  // }, [uuid, setSelectedPetId]);

  const pet = pets.find(p => (p as any).uuid === uuid);

  if (!pet) {
    return (
      <>
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12">
            <Card>
              <CardContent className="text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Pet not found</h3>
                <p className="text-muted-foreground mb-6">
                  The pet you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate('/profile')}>
                  Back to Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          {/* Pet Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/20 shrink-0">
                  <PetImage pet={pet} alt={pet.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div>
                      <CardTitle className="text-3xl mb-2">{pet.name}</CardTitle>
                      <p className="text-muted-foreground">{(pet as any).breed || (pet as any).species}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Edit pet details"
                        onClick={() => setEditOpen(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pet.dateOfBirth && (
                      <Badge variant="secondary">
                        {formatPetDobWithAge((pet as PetProfile).dateOfBirth)}
                      </Badge>
                    )}
                    {(pet as any).weight && <Badge variant="secondary">{(pet as PetProfile).weight}</Badge>}
                    {(pet as any).gender && <Badge variant="outline">{(pet as PetProfile).gender}</Badge>}
                    {(pet as PetProfile).microchipNumber && (
                      <Badge variant="outline">Chip {(pet as PetProfile).microchipNumber}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {(pet.healthConditions || pet.allergies) && (
              <CardContent>
                <div className="space-y-2">
                  {(pet as any).medicalHistory && (
                    <div className="flex gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Health:</span>
                      <span className="text-sm">{(pet as any).healthConditions}</span>
                    </div>
                  )}
                  {(pet as any).allergies && (
                    <div className="flex gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Allergies:</span>
                      <span className="text-sm">{(pet as any).allergies}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate(`/app/book?petId=${uuid || ''}`)}
            >
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-xs">Book Appointment</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate(`/app?reminders=1&petId=${uuid || ''}`)}
            >
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-xs">Set Reminder</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => setActiveTab('progress')}
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs">Health Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => setActiveTab('badges')}
            >
              <Award className="h-5 w-5 text-primary" />
              <span className="text-xs">View Badges</span>
            </Button>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full overflow-x-auto flex md:grid md:grid-cols-4 lg:grid-cols-7 mb-6">
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Nutrition</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Products</span>
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Tips</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nutrition">
              {nutritionPlan && stats ? (
                <NutritionDashboard
                  profile={nutritionPlan.petProfileSummary}
                  stats={stats}
                />
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  Loading nutrition data...
                </Card>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              {nutritionPlan ? (
                <div className="space-y-4">
                  <NutritionCalendar
                    dailyLogs={nutritionPlan.dailyLogs}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                  <DailyDetails
                    log={selectedDayLog}
                    date={selectedDate}
                    onToggleMeal={(index) => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      toggleMealCompletion(dateStr, index);
                    }}
                    onToggleSupplement={(index) => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      toggleSupplementCompletion(dateStr, index);
                    }}
                    onSaveNotes={(notes) => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      updateDailyLog(dateStr, { notes });
                    }}
                    onSaveHydration={(ml) => {
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      updateDailyLog(dateStr, { hydrationMl: ml });
                    }}
                  />
                </div>
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  Loading calendar data...
                </Card>
              )}
            </TabsContent>

            <TabsContent value="progress">
              {nutritionPlan ? (
                <ProgressCharts
                  weightHistory={nutritionPlan.weightHistory}
                  dailyLogs={nutritionPlan.dailyLogs}
                  currentDate={selectedDate}
                  onLogWeight={(weight) => {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    logWeight(dateStr, weight);
                  }}
                />
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  Loading progress data...
                </Card>
              )}
            </TabsContent>

            <TabsContent value="products">
              {nutritionPlan ? (
                <ProductRecommendations products={nutritionPlan.recommendedProducts} />
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  Loading product recommendations...
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tips">
              {nutritionPlan ? (
                <WellnessTips
                  tips={nutritionPlan.longTermWellnessTips}
                  specialConsiderations={nutritionPlan.specialConsiderations}
                />
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  Loading wellness tips...
                </Card>
              )}
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <PetBadges petName={pet.name} />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <OwnerPetEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pet={pet as PetProfile}
      />
      <Footer />
    </>
  );
};

export default PetDetail;
