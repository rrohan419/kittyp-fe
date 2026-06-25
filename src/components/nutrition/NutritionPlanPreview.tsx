import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  PawPrint,
  Utensils,
  Activity,
  AlertTriangle,
  Heart,
  Gift,
  CheckCircle,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { fadeUp, staggerContainer, scaleUp } from '@/utils/animations';
import {
  type PetCarePlan,
  type RecommendedProduct,
  hasNutritionPlanData,
} from '@/services/aiService';
import { cn } from '@/lib/utils';

interface NutritionPlanPreviewProps {
  plan: PetCarePlan;
  onPlanChange: (plan: PetCarePlan) => void;
  editable?: boolean;
  petName?: string;
  showSavePrompt?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
  canSave?: boolean;
  saveDisabledReason?: string;
  onSave?: () => void;
  onDiscard?: () => void;
}

const readOnlyFieldClass = 'bg-muted/30 border-transparent cursor-default focus-visible:ring-0';

export const NutritionPlanPreview: React.FC<NutritionPlanPreviewProps> = ({
  plan,
  onPlanChange,
  editable = false,
  petName,
  showSavePrompt = false,
  isSaving = false,
  isSaved = false,
  canSave = true,
  saveDisabledReason,
  onSave,
  onDiscard,
}) => {
  if (!hasNutritionPlanData(plan)) {
    return null;
  }

  const updatePlan = (updater: (prev: PetCarePlan) => PetCarePlan) => {
    if (!editable) return;
    onPlanChange(updater(plan));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="mt-8 border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
              <span>Nutrition Plan Preview</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {petName ? `For ${petName}` : 'Personalized'}
              </Badge>
              {editable ? (
                <Badge variant="outline" className="text-xs font-normal text-primary border-primary/30">
                  Editable
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                  Preview only
                </Badge>
              )}
              {isSaved && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                  Saved
                </Badge>
              )}
            </CardTitle>
          </div>
          {showSavePrompt && !isSaved && (
            <p className="text-sm text-muted-foreground mt-2">
              Review the plan below. When you are happy with it, save it to {petName ? `${petName}'s` : "your pet's"} profile.
              {editable
                ? ' You can edit sections before saving.'
                : ' Editing will be available for veterinary professionals soon.'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <motion.div
            className="space-y-6"
            variants={staggerContainer(0.1, 0.1)}
            initial="hidden"
            animate="visible"
          >
            {plan.petProfileSummary && Object.keys(plan.petProfileSummary).length > 0 && (
              <motion.div variants={fadeUp} className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-xl border">
                <h4 className="font-semibold mb-4 flex items-center space-x-2">
                  <PawPrint className="h-4 w-4 text-primary" />
                  <span>Pet Profile Summary</span>
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {(
                    [
                      ['name', 'Name'],
                      ['type', 'Type'],
                      ['breed', 'Breed'],
                      ['age', 'Age'],
                      ['weight', 'Weight'],
                      ['activityLevel', 'Activity'],
                      ['gender', 'Gender'],
                      ['currentFoodBrand', 'Current food brand'],
                      ['healthConditions', 'Health conditions'],
                      ['allergies', 'Allergies'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      <Input
                        readOnly={!editable}
                        value={String(plan.petProfileSummary[key] ?? '')}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            petProfileSummary: {
                              ...prev.petProfileSummary,
                              [key]: e.target.value,
                            },
                          }))
                        }
                        className={cn('mt-1 h-9', !editable && readOnlyFieldClass)}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {plan.dailyFeedingPlan?.meals?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h4 className="font-semibold mb-4 flex flex-wrap items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  <span>Daily Feeding Plan</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="calories-per-day" className="text-xs font-normal text-muted-foreground">
                      Cal/day
                    </Label>
                    <Input
                      id="calories-per-day"
                      type="number"
                      min={0}
                      readOnly={!editable}
                      className={cn('h-8 w-24', !editable && readOnlyFieldClass)}
                      value={plan.dailyFeedingPlan.caloriesPerDay || ''}
                      onChange={(e) =>
                        updatePlan((prev) => ({
                          ...prev,
                          dailyFeedingPlan: {
                            ...prev.dailyFeedingPlan,
                            caloriesPerDay: Number(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </div>
                </h4>
                <div className="grid gap-4">
                  {plan.dailyFeedingPlan.meals.map((meal, index) => (
                    <motion.div
                      key={index}
                      className="p-4 border rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all duration-300 space-y-3"
                      variants={scaleUp}
                    >
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[120px]">
                          <Label className="text-xs text-muted-foreground">Time</Label>
                          <Input
                            readOnly={!editable}
                            value={meal.time ?? ''}
                            onChange={(e) =>
                              updatePlan((prev) => ({
                                ...prev,
                                dailyFeedingPlan: {
                                  ...prev.dailyFeedingPlan,
                                  meals: prev.dailyFeedingPlan.meals.map((m, i) =>
                                    i === index ? { ...m, time: e.target.value } : m
                                  ),
                                },
                              }))
                            }
                            className={cn('mt-1', !editable && readOnlyFieldClass)}
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-xs text-muted-foreground">Portion (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            readOnly={!editable}
                            value={meal.portionSizeGrams ?? ''}
                            onChange={(e) =>
                              updatePlan((prev) => ({
                                ...prev,
                                dailyFeedingPlan: {
                                  ...prev.dailyFeedingPlan,
                                  meals: prev.dailyFeedingPlan.meals.map((m, i) =>
                                    i === index
                                      ? { ...m, portionSizeGrams: Number(e.target.value) || 0 }
                                      : m
                                  ),
                                },
                              }))
                            }
                            className={cn('mt-1', !editable && readOnlyFieldClass)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Food type</Label>
                        <Textarea
                          readOnly={!editable}
                          value={meal.foodType ?? ''}
                          onChange={(e) =>
                            updatePlan((prev) => ({
                              ...prev,
                              dailyFeedingPlan: {
                                ...prev.dailyFeedingPlan,
                                meals: prev.dailyFeedingPlan.meals.map((m, i) =>
                                  i === index ? { ...m, foodType: e.target.value } : m
                                ),
                              },
                            }))
                          }
                          className={cn('mt-1 min-h-[60px] resize-y', !editable && readOnlyFieldClass)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <Textarea
                          readOnly={!editable}
                          value={meal.notes ?? ''}
                          onChange={(e) =>
                            updatePlan((prev) => ({
                              ...prev,
                              dailyFeedingPlan: {
                                ...prev.dailyFeedingPlan,
                                meals: prev.dailyFeedingPlan.meals.map((m, i) =>
                                  i === index ? { ...m, notes: e.target.value } : m
                                ),
                              },
                            }))
                          }
                          className={cn('mt-1 min-h-[50px] resize-y', !editable && readOnlyFieldClass)}
                          rows={2}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {plan.dailyFeedingPlan.supplements && (
                  <div className="mt-4 space-y-3">
                    <h5 className="font-medium text-secondary-foreground">Supplements</h5>
                    {plan.dailyFeedingPlan.supplements.map((supplement, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border space-y-2"
                      >
                        <div>
                          <Label className="text-xs text-blue-600 dark:text-blue-400">Name</Label>
                          <Input
                            readOnly={!editable}
                            value={supplement.name ?? ''}
                            onChange={(e) =>
                              updatePlan((prev) => ({
                                ...prev,
                                dailyFeedingPlan: {
                                  ...prev.dailyFeedingPlan,
                                  supplements: prev.dailyFeedingPlan.supplements.map((s, i) =>
                                    i === index ? { ...s, name: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                            className={cn('mt-1', !editable && readOnlyFieldClass)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-600 dark:text-blue-400">Purpose</Label>
                          <Textarea
                            readOnly={!editable}
                            value={supplement.purpose ?? ''}
                            onChange={(e) =>
                              updatePlan((prev) => ({
                                ...prev,
                                dailyFeedingPlan: {
                                  ...prev.dailyFeedingPlan,
                                  supplements: prev.dailyFeedingPlan.supplements.map((s, i) =>
                                    i === index ? { ...s, purpose: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                            className={cn('mt-1 min-h-[50px]', !editable && readOnlyFieldClass)}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-600 dark:text-blue-400">Dosage</Label>
                          <Input
                            readOnly={!editable}
                            value={supplement.dosage ?? ''}
                            onChange={(e) =>
                              updatePlan((prev) => ({
                                ...prev,
                                dailyFeedingPlan: {
                                  ...prev.dailyFeedingPlan,
                                  supplements: prev.dailyFeedingPlan.supplements.map((s, i) =>
                                    i === index ? { ...s, dosage: e.target.value } : s
                                  ),
                                },
                              }))
                            }
                            className={cn('mt-1', !editable && readOnlyFieldClass)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {plan.environmentalImpact && (
              <motion.div
                variants={fadeUp}
                className="bg-green-50 dark:bg-green-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800"
              >
                <h4 className="font-semibold mb-4 flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <Activity className="h-4 w-4" />
                  <span>Environmental Considerations</span>
                </h4>
                <div className="space-y-3 text-sm">
                  {(
                    [
                      ['climateConsiderations', 'Climate'],
                      ['hydrationNeeds', 'Hydration'],
                      ['energyNeedsAdjustment', 'Energy needs'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-green-600 dark:text-green-400">{label}</Label>
                      <Textarea
                        readOnly={!editable}
                        value={plan.environmentalImpact[key] ?? ''}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            environmentalImpact: {
                              ...prev.environmentalImpact,
                              [key]: e.target.value,
                            },
                          }))
                        }
                        className={cn(
                          'mt-1 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 min-h-[72px]',
                          !editable && readOnlyFieldClass
                        )}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {plan.specialConsiderations?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h4 className="font-semibold mb-4 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>Special Considerations</span>
                </h4>
                <div className="grid gap-3">
                  {plan.specialConsiderations.map((consideration, index) => (
                    <div
                      key={index}
                      className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 space-y-2"
                    >
                      <div>
                        <Label className="text-xs text-orange-700 dark:text-orange-300">Condition</Label>
                        <Input
                          readOnly={!editable}
                          value={consideration.condition ?? ''}
                          onChange={(e) =>
                            updatePlan((prev) => ({
                              ...prev,
                              specialConsiderations: prev.specialConsiderations.map((c, i) =>
                                i === index ? { ...c, condition: e.target.value } : c
                              ),
                            }))
                          }
                          className={cn('mt-1', !editable && readOnlyFieldClass)}
                          placeholder="General"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-orange-700 dark:text-orange-300">Recommendation</Label>
                        <Textarea
                          readOnly={!editable}
                          value={consideration.recommendation ?? ''}
                          onChange={(e) =>
                            updatePlan((prev) => ({
                              ...prev,
                              specialConsiderations: prev.specialConsiderations.map((c, i) =>
                                i === index ? { ...c, recommendation: e.target.value } : c
                              ),
                            }))
                          }
                          className={cn(
                            'mt-1 text-orange-800 dark:text-orange-200 min-h-[70px]',
                            !editable && readOnlyFieldClass
                          )}
                          rows={3}
                          placeholder="Notes…"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {plan.longTermWellnessTips?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h4 className="font-semibold mb-4 flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span>Long-term Wellness Tips</span>
                </h4>
                <div className="grid gap-2">
                  {plan.longTermWellnessTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-2 flex-shrink-0" />
                      <Textarea
                        readOnly={!editable}
                        value={tip ?? ''}
                        onChange={(e) =>
                          updatePlan((prev) => ({
                            ...prev,
                            longTermWellnessTips: prev.longTermWellnessTips.map((t, i) =>
                              i === index ? e.target.value : t
                            ),
                          }))
                        }
                        className={cn('text-sm min-h-[60px] flex-1 resize-y', !editable && readOnlyFieldClass)}
                        rows={2}
                        placeholder="Wellness tip"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {plan.recommendedProducts?.length > 0 && (
              <motion.div variants={fadeUp}>
                <h4 className="font-semibold mb-4 flex items-center space-x-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span>Recommended Products</span>
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.recommendedProducts.map((product: RecommendedProduct, index) => (
                    <motion.div
                      key={index}
                      variants={scaleUp}
                      whileHover={{ scale: editable ? 1.02 : 1, y: editable ? -5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20">
                        <CardContent className="p-4 space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Category</Label>
                            {editable ? (
                              <select
                                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm capitalize"
                                value={product.category}
                                onChange={(e) => {
                                  const category = e.target.value as RecommendedProduct['category'];
                                  updatePlan((prev) => ({
                                    ...prev,
                                    recommendedProducts: prev.recommendedProducts.map((p, i) =>
                                      i === index ? { ...p, category } : p
                                    ),
                                  }));
                                }}
                              >
                                <option value="food">food</option>
                                <option value="supplement">supplement</option>
                                <option value="accessory">accessory</option>
                              </select>
                            ) : (
                              <p className="mt-1 text-sm capitalize">{product.category}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Product name</Label>
                            <Input
                              readOnly={!editable}
                              value={product.productName ?? ''}
                              onChange={(e) =>
                                updatePlan((prev) => ({
                                  ...prev,
                                  recommendedProducts: prev.recommendedProducts.map((p, i) =>
                                    i === index ? { ...p, productName: e.target.value } : p
                                  ),
                                }))
                              }
                              className={cn('mt-1 font-medium', !editable && readOnlyFieldClass)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Purpose</Label>
                            <Textarea
                              readOnly={!editable}
                              value={product.purpose ?? ''}
                              onChange={(e) =>
                                updatePlan((prev) => ({
                                  ...prev,
                                  recommendedProducts: prev.recommendedProducts.map((p, i) =>
                                    i === index ? { ...p, purpose: e.target.value } : p
                                  ),
                                }))
                              }
                              className={cn('mt-1 text-sm min-h-[60px]', !editable && readOnlyFieldClass)}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">URL</Label>
                            <Input
                              readOnly={!editable}
                              value={product.url ?? ''}
                              onChange={(e) =>
                                updatePlan((prev) => ({
                                  ...prev,
                                  recommendedProducts: prev.recommendedProducts.map((p, i) =>
                                    i === index ? { ...p, url: e.target.value } : p
                                  ),
                                }))
                              }
                              className={cn('mt-1 text-xs', !editable && readOnlyFieldClass)}
                              placeholder="https://…"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              variants={fadeUp}
              className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Notice</h5>
                  <Textarea
                    readOnly={!editable}
                    value={plan.vetAdviceDisclaimer ?? ''}
                    onChange={(e) =>
                      updatePlan((prev) => ({
                        ...prev,
                        vetAdviceDisclaimer: e.target.value,
                      }))
                    }
                    className={cn(
                      'text-sm text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 min-h-[80px]',
                      !editable && readOnlyFieldClass
                    )}
                    rows={4}
                    placeholder="Vet disclaimer…"
                  />
                </div>
              </div>
            </motion.div>

            {showSavePrompt && !isSaved && (
              <motion.div
                variants={fadeUp}
                className="mt-2 p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4"
              >
                <div>
                  <h5 className="font-semibold text-foreground">Save this nutrition plan?</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    {canSave
                      ? `Saving will store this plan for ${petName ?? 'your pet'} so you can access it later.`
                      : saveDisabledReason ??
                        'Add this pet to your profile before saving a nutrition plan.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={onSave}
                    disabled={!canSave || isSaving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save plan
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Discard
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
