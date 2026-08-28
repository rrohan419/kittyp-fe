import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyLog } from '@/types/nutrition';
import { Clock, Utensils, Pill, Droplets, Save } from 'lucide-react';
import { useState } from 'react';

interface DailyDetailsProps {
  log: DailyLog | null;
  date: Date;
  onToggleMeal: (mealIndex: number) => void;
  onToggleSupplement: (supplementIndex: number) => void;
  onSaveNotes: (notes: string) => void;
  onSaveHydration: (ml: number) => void;
}

export const DailyDetails = ({
  log,
  date,
  onToggleMeal,
  onToggleSupplement,
  onSaveNotes,
  onSaveHydration,
}: DailyDetailsProps) => {
  const [notes, setNotes] = useState(log?.notes || '');
  const [hydration, setHydration] = useState(log?.hydrationMl?.toString() || '0');

  if (!log) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No data available for {date.toLocaleDateString()}
        </p>
      </Card>
    );
  }

  const handleSave = () => {
    onSaveNotes(notes);
    onSaveHydration(Number(hydration) || 0);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <Badge variant={log.status === 'completed' ? 'default' : 'secondary'} className="capitalize w-fit">
            {log.status}
          </Badge>
        </div>

        {/* Meals Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-sm sm:text-base">Meals</h4>
          </div>
          <div className="space-y-3">
            {log.meals.map((meal, index) => (
              <div
                key={index}
                className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-card"
              >
                <Checkbox
                  checked={meal.completed}
                  onCheckedChange={() => onToggleMeal(index)}
                  className="mt-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm">{meal.time}</span>
                  </div>
                  <p className="text-sm font-medium break-words">{meal.foodType}</p>
                  <div className="flex flex-col sm:flex-row sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                    <span>Portion: {meal.portionSize}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{meal.calories} kcal</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Total: {log.meals.reduce((sum, m) => sum + m.calories, 0)} kcal
          </div>
        </div>

        {/* Supplements Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-sm sm:text-base">Supplements</h4>
          </div>
          <div className="space-y-3">
            {log.supplements.map((supplement, index) => (
              <div
                key={index}
                className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-card"
              >
                <Checkbox
                  checked={supplement.completed}
                  onCheckedChange={() => onToggleSupplement(index)}
                  className="mt-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm break-words">{supplement.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{supplement.purpose}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Dosage: {supplement.dosage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hydration Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-sm sm:text-base">Hydration</h4>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={hydration}
              onChange={(e) => setHydration(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter ml"
            />
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap shrink-0">ml</span>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-4">
          <h4 className="font-semibold text-sm sm:text-base mb-3">Notes</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations or notes about your pet's day..."
            className="min-h-[80px] sm:min-h-[100px] text-sm"
          />
        </div>

        <Button onClick={handleSave} className="w-full text-sm sm:text-base">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </Card>
    </div>
  );
};
