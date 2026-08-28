import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { RootState } from '@/module/store/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserLocationDisplay from '@/components/ui/UserLocationDisplay';
import { PetSelectionComponent } from '@/components/ui/PetSelectionComponent';
import { NutritionPlanPreview } from '@/components/nutrition/NutritionPlanPreview';
import { useNutritionPets } from '@/hooks/useNutritionPets';
import {
  defaultEnvironmentData,
  defaultPetCarePlan,
  generateNutritionRecommendation,
  handleAIError,
  hasNutritionPlanData,
  saveNutritionPlan,
  type LocationData,
  type PetCarePlan,
} from '@/services/aiService';
import { fetchFilteredNutritionPlans, sendNutritionPlan } from '@/services/petNutritionService';

export default function DoctorNutritionGenerate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPet = searchParams.get('petUuid');
  const user = useSelector((s: RootState) => s.authReducer.user);

  const { pets, loading: petsLoading, sourceLabel } = useNutritionPets();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(preselectedPet);
  const [location, setLocation] = useState<LocationData | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<PetCarePlan>(defaultPetCarePlan);

  useEffect(() => {
    if (preselectedPet) {
      setSelectedPetId(preselectedPet);
    }
  }, [preselectedPet]);

  const selectedPet = pets.find((p) => p.uuid === selectedPetId);

  const handleGenerate = async () => {
    if (!user?.uuid) {
      toast.error('Sign in as a doctor to generate a plan');
      return;
    }
    if (!selectedPetId || selectedPetId === 'manual-entry') {
      toast.error('Select a patient first');
      return;
    }
    const pet = pets.find((p) => p.uuid === selectedPetId);
    if (!pet) {
      toast.error('Selected patient not found');
      return;
    }
    if (!location) {
      toast.error('Share your location so the plan can account for local climate');
      return;
    }
    setIsGenerating(true);
    try {
      const recommendation = await generateNutritionRecommendation(pet, user.uuid, location);
      setPlan(recommendation);
      toast.success(`Plan generated for ${pet.name}. Review it, then save or send.`);
    } catch (error: unknown) {
      const aiError = handleAIError(error);
      toast.error(aiError.userMessage || aiError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const persistPlan = async () => {
    if (!user?.uuid || !selectedPet) {
      throw new Error('Select a patient first');
    }
    if (!hasNutritionPlanData(plan)) {
      throw new Error('Generate a plan first');
    }
    await saveNutritionPlan({
      petUuid: selectedPet.uuid,
      petName: selectedPet.name,
      userUuid: user.uuid,
      recommendationResponse: plan,
      environmentDataDto: plan.environment ?? defaultEnvironmentData,
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await persistPlan();
      toast.success(`Draft saved for ${selectedPet?.name}.`);
      navigate('/doctor/nutrition');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save draft';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!selectedPet) {
      toast.error('Select a patient first');
      return;
    }
    setSaving(true);
    try {
      await persistPlan();
      const page = await fetchFilteredNutritionPlans(0, 5, { petUuid: selectedPet.uuid });
      const latest = page.models?.[0];
      if (!latest?.uuid) {
        toast.success('Draft saved. Send it from the nutrition inbox.');
        navigate('/doctor/nutrition');
        return;
      }
      await sendNutritionPlan(latest.uuid);
      toast.success(`Plan sent for ${selectedPet.name}`);
      navigate('/doctor/nutrition');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send plan';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/doctor/nutrition">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to nutrition
            </Link>
          </Button>
          <h1 className="text-2xl font-bold mt-2">Generate nutrition plan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create an AI plan for a patient, review it, then save a draft or send it to the parent.
          </p>
        </div>
      </div>

      <PetSelectionComponent
        selectedPetId={selectedPetId}
        setSelectedPetId={setSelectedPetId}
        pets={pets}
        petsLoading={petsLoading}
        petsLabel={sourceLabel || 'Patients'}
        emptyHint="Treat a patient first, or open Patients to add one."
        allowManualEntry={false}
        onGenerateRecommendation={() => void handleGenerate()}
        isGenerating={isGenerating}
        recommendations={plan}
      />

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
          <CardDescription>
            Used to adjust hydration and calorie needs for local climate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserLocationDisplay
            onLocationUpdate={(data) => {
              if (!data) return;
              setLocation(data);
            }}
            onPermissionDenied={() =>
              toast.error('Location is required to generate a personalized plan')
            }
          />
        </CardContent>
      </Card>

      {hasNutritionPlanData(plan) && (
        <>
          <NutritionPlanPreview
            plan={plan}
            editable
            onPlanChange={setPlan}
            petName={selectedPet?.name}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => navigate('/doctor/nutrition')}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={saving} onClick={() => void handleSaveDraft()}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving…' : 'Save draft'}
            </Button>
            <Button disabled={saving} onClick={() => void handleSaveAndSend()}>
              <Send className="h-4 w-4 mr-1.5" />
              {saving ? 'Sending…' : 'Save and send to parent'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
