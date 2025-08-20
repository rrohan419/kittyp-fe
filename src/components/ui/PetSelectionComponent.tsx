import { PetCarePlan } from "@/services/aiService";
import { PetProfile } from "@/services/authService";
import { staggerContainer, fadeUp, scaleUp } from "@/utils/animations";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from "framer-motion";
import { Heart, PawPrint, Plus, CheckCircle, Sparkles, Wand2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { useSelector } from "react-redux";
import { RootState } from "@/module/store/store";

interface PetSelectionProps {
  selectedPetId: string | null;
  setSelectedPetId: (id: string | null) => void;
  // savedPets: PetProfile[];
  // user: any;
  onGenerateRecommendation: (manualPetData?: PetProfile) => void;
  isGenerating: boolean;
  recommendations: PetCarePlan;
}

export const PetSelectionComponent: React.FC<PetSelectionProps> = ({
  selectedPetId,
  setSelectedPetId,
  // savedPets,
  // user,
  onGenerateRecommendation,
  isGenerating,
  recommendations
}) => {
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [manualPetData, setManualPetData] = useState<PetProfile>({
    uuid: '',
    name: '',
    profilePicture: '',
    type: '',
    breed: '',
    age: '',
    weight: '',
    activityLevel: 'low',
    gender: 'male',
    currentFoodBrand: '',
    healthConditions: '',
    allergies: '',
    isNeutered: true,
    createdAt: '',
  });
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.authReducer);
  const savedPets = user?.ownerPets || [];

  // Clear selectedPetId if the selected pet no longer exists
  useEffect(() => {
    if (selectedPetId && selectedPetId !== 'manual-entry') {
      const petExists = savedPets.some(pet => pet.uuid === selectedPetId);
      if (!petExists) {
        setSelectedPetId(null);
      }
    }
  }, [savedPets, selectedPetId, setSelectedPetId]);

  const selectedPet = savedPets.find(pet => pet.uuid === selectedPetId) ||
    (useManualEntry ? { ...manualPetData, id: 'manual' } : null);

  return (
    <motion.div className="space-y-6" variants={staggerContainer(0.1)}>
      {/* Pet Selection Options */}
      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Choose Your Pet
              </span>
            </CardTitle>
            <CardDescription>
              Select a saved pet or enter details manually for personalized nutrition analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle between saved pets and manual entry */}
            <div className="flex space-x-2 mb-6">
              <Button
                variant={!useManualEntry ? "default" : "outline"}
                onClick={() => {
                  setUseManualEntry(false);
                  if (savedPets.length > 0) setSelectedPetId(savedPets[0].uuid);
                }}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                <PawPrint className="h-4 w-4 mr-2" />
                Saved Pets {savedPets.length > 0 && `(${savedPets.length})`}
              </Button>
              <Button
                variant={useManualEntry ? "default" : "outline"}
                onClick={() => {
                  setUseManualEntry(true);
                  setSelectedPetId('manual-entry');
                }}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Enter Manually
              </Button>
            </div>

            {!useManualEntry ? (
              // Saved Pets Section
              savedPets.length === 0 ? (
                <motion.div
                  className="text-center py-12 text-muted-foreground"
                  variants={fadeUp}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <PawPrint className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  </motion.div>
                  <p className="text-lg mb-4">No saved pets found</p>
                  <p className="text-sm mb-6">Add your pet's profile to get personalized recommendations</p>
                  {user ? (
                    <Button asChild variant="outline" size="lg" className="mr-4">
                      <a href="/profile?tab=pets">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Pet Profile
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setUseManualEntry(true)}
                      className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                    >
                      Enter Pet Details Manually
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPets.map((pet, index) => (
                    <motion.div
                      key={pet.uuid}
                      variants={scaleUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${selectedPetId === pet.uuid
                          ? 'ring-2 ring-primary border-primary/30 bg-primary/5'
                          : 'hover:border-primary/20 hover:bg-primary/5'
                          }`}
                        onClick={() => setSelectedPetId(pet.uuid)}
                        title={selectedPetId === pet.uuid ? 'Currently selected' : 'Click to select this pet (will clear current recommendations)'}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                              <AvatarImage src={pet.profilePicture} alt={pet.name} />
                              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {pet.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base truncate">{pet.name}</h4>
                              <p className="text-sm text-muted-foreground">{pet.breed}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                  {pet.age}
                                </Badge>
                                {pet.weight && (
                                  <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                                    {pet.weight}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* {selectedPetId === pet.uuid && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                  className="flex flex-col items-center space-y-1"
                                >
                                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs border-primary/30 text-primary/70 bg-primary/5"
                                  >
                                    {(() => {
                                      const hasRecommendations = recommendations && (
                                        (recommendations.petProfileSummary && Object.keys(recommendations.petProfileSummary).some(key => recommendations.petProfileSummary[key])) ||
                                        (recommendations.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0) ||
                                        (recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0) ||
                                        (recommendations.recommendedProducts && recommendations.recommendedProducts.length > 0) ||
                                        (recommendations.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0) ||
                                        (recommendations.environmentalImpact && (
                                          recommendations.environmentalImpact.climateConsiderations ||
                                          recommendations.environmentalImpact.hydrationNeeds ||
                                          recommendations.environmentalImpact.energyNeedsAdjustment
                                        ))
                                      );
                                      return hasRecommendations ? 'Has Plan' : 'No Plan';
                                    })()}
                                  </Badge>
                                  {(() => {
                                    const hasRecommendations = recommendations && (
                                      (recommendations.petProfileSummary && Object.keys(recommendations.petProfileSummary).some(key => recommendations.petProfileSummary[key])) ||
                                      (recommendations.dailyFeedingPlan && recommendations.dailyFeedingPlan.meals && recommendations.dailyFeedingPlan.meals.length > 0) ||
                                      (recommendations.specialConsiderations && recommendations.specialConsiderations.length > 0) ||
                                      (recommendations.recommendedProducts && recommendations.recommendedProducts.length > 0) ||
                                      (recommendations.longTermWellnessTips && recommendations.longTermWellnessTips.length > 0) ||
                                      (recommendations.environmentalImpact && (
                                        recommendations.environmentalImpact.climateConsiderations ||
                                        recommendations.environmentalImpact.hydrationNeeds ||
                                        recommendations.environmentalImpact.energyNeedsAdjustment
                                      ))
                                    );
                                    
                                    if (hasRecommendations) {
                                      return (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadNutritionPlan(recommendations, pet.name);
                                          }}
                                          className="h-6 px-2 text-xs text-primary/70 hover:text-primary hover:bg-primary/10"
                                          title="Download nutrition plan"
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </motion.div>
                              )} */}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              // Manual Entry Form
              <motion.div className="space-y-4" variants={fadeUp}>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="petName" className="text-primary font-medium">Pet Name</Label>
                    <Input
                      id="petName"
                      value={manualPetData.name}
                      onChange={(e) => setManualPetData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your pet's name"
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petType" className="text-primary font-medium">Pet Type</Label>
                    <Select
                      value={manualPetData.type}
                      onValueChange={(value) => setManualPetData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select pet type" />
                      </SelectTrigger>
                      <SelectContent >
                        <SelectItem value="cat">🐱 Cat</SelectItem>
                        <SelectItem value="dog">🐶 Dog</SelectItem>
                        <SelectItem value="bird">🐦 Bird</SelectItem>
                        <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                        <SelectItem value="other">🐾 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="isNeutered" className="text-primary font-medium">Neutered/Spayed</Label>
                    <Select
                      value={
                        manualPetData.isNeutered === true
                          ? "yes"
                          : manualPetData.isNeutered === false
                            ? "no"
                            : undefined
                      }
                      onValueChange={(value) =>
                        setManualPetData({
                          ...manualPetData,
                          isNeutered: value === "yes", // always store as boolean
                        })
                      }
                    >
                      <SelectTrigger className="border-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="petBreed" className="text-primary font-medium">Breed</Label>
                    <Input
                      id="petBreed"
                      value={manualPetData.breed}
                      onChange={(e) => setManualPetData(prev => ({ ...prev, breed: e.target.value }))}
                      placeholder="Pet breed"
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petAge" className="text-primary font-medium">Age</Label>
                    <Input
                      id="petAge"
                      value={manualPetData.age}
                      onChange={(e) => setManualPetData(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="e.g., 2 years"
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petWeight" className="text-primary font-medium">Weight (kg)</Label>
                    <Input
                      id="petWeight"
                      type="number"
                      value={manualPetData.weight}
                      onChange={(e) => setManualPetData(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="Weight in kg"
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="petFoodBrand" className="text-primary font-medium">Current Food Brand</Label>
                    <Input
                      id="petFoodBrand"
                      value={manualPetData.currentFoodBrand}
                      onChange={(e) => setManualPetData(prev => ({ ...prev, currentFoodBrand: e.target.value }))}
                      placeholder="eg. drools"
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="petGender" className="text-primary font-medium">Gender</Label>
                    <Select
                      value={manualPetData.gender}
                      onValueChange={(value) => setManualPetData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="border-primary/20 focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div>
                  <Label htmlFor="activityLevel" className="text-primary font-medium">Activity Level</Label>
                  <Select
                    value={manualPetData.activityLevel}
                    onValueChange={(value) => setManualPetData(prev => ({ ...prev, activityLevel: value }))}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🛌 Low - Mostly indoor, minimal exercise</SelectItem>
                      <SelectItem value="moderate">🚶 Moderate - Regular walks, some playtime</SelectItem>
                      <SelectItem value="high">🏃 High - Very active, lots of exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="healthConditions" className="text-primary font-medium">Health Conditions</Label>
                  <Textarea
                    id="healthConditions"
                    value={manualPetData.healthConditions}
                    onChange={(e) => setManualPetData(prev => ({ ...prev, healthConditions: e.target.value }))}
                    placeholder="e.g., kidney"
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="allergies" className="text-primary font-medium">Food Allergies/Sensitivities</Label>
                  <Textarea
                    id="allergies"
                    value={manualPetData.allergies}
                    onChange={(e) => setManualPetData(prev => ({ ...prev, allergies: e.target.value }))}
                    placeholder="e.g., milk"
                    className="border-primary/20 focus:border-primary"
                    rows={2}
                  />
                </div>


                {manualPetData.name && manualPetData.breed && (
                  <motion.div
                    className="p-4 bg-primary/5 rounded-xl border border-primary/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-2 text-sm text-primary mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Pet details ready for analysis</span>
                    </div>
                    <p className="text-sm text-primary/80">
                      <strong>{manualPetData.name}</strong> - {manualPetData.breed || 'Mixed breed'} {manualPetData.breed}
                      {manualPetData.age && `, ${manualPetData.age}`}
                      {manualPetData.weight && `, ${manualPetData.weight}kg`}
                    </p>
                    <br />
                    <span className="text-sm text-primary/80">
                      {manualPetData.activityLevel && `Activity level - ${manualPetData.activityLevel}`}</span> <br />
                    <span className="text-sm text-primary/80">
                      {manualPetData.healthConditions && `Health conditions - ${manualPetData.healthConditions}`}</span> <br />
                    <span className="text-sm text-primary/80">
                      {manualPetData.allergies && `Allergies - ${manualPetData.allergies}`}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Pet Analysis */}
      <AnimatePresence>
        {selectedPet && selectedPet.name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Nutrition Analysis for {selectedPet.name}
                  </span>
                </CardTitle>
                <CardDescription>
                  AI-powered nutrition recommendations based on your pet's unique profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pet Profile Summary */}
                <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                    <AvatarImage src={selectedPet.profilePicture} alt={selectedPet.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {selectedPet.profilePicture ? selectedPet.profilePicture : selectedPet.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-primary mb-2">{selectedPet.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-secondary/50 p-2 rounded-lg">
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-semibold text-primary">{selectedPet.type}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded-lg">
                        <span className="text-muted-foreground">Breed:</span>
                        <p className="font-semibold text-primary">{selectedPet.breed}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded-lg">
                        <span className="text-muted-foreground">Age:</span>
                        <p className="font-semibold text-primary">{selectedPet.age}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 rounded-lg">
                        <span className="text-muted-foreground">Weight:</span>
                        <p className="font-semibold text-primary">{selectedPet.weight || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => {
                        if (selectedPetId === 'manual-entry') {
                          onGenerateRecommendation(manualPetData);
                        } else {
                          onGenerateRecommendation();
                        }
                      }}
                      size="lg"
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-3"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Analyzing {selectedPet.name}'s Needs...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5 mr-3" />
                          <span>Generate Nutrition Plan for {selectedPet.name}</span>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="h-5 w-5 ml-3" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};