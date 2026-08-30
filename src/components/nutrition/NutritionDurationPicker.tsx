import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PLAN_DURATION_PRESETS,
  clampPlanDurationDays,
  MAX_PLAN_DURATION_DAYS,
  MIN_PLAN_DURATION_DAYS,
} from '@/utils/nutritionDuration';

type Props = {
  value: number;
  onChange: (days: number) => void;
  id?: string;
};

export function NutritionDurationPicker({ value, onChange, id = 'plan-duration-days' }: Props) {
  const days = clampPlanDurationDays(value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>How many days should this plan be followed?</Label>
      <div className="flex flex-wrap gap-2">
        {PLAN_DURATION_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={days === preset ? 'default' : 'outline'}
            onClick={() => onChange(preset)}
          >
            {preset} days
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={MIN_PLAN_DURATION_DAYS}
          max={MAX_PLAN_DURATION_DAYS}
          value={days}
          onChange={(e) => onChange(clampPlanDurationDays(Number(e.target.value)))}
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">
          Parent can log meals for {days} day{days === 1 ? '' : 's'} starting today.
        </p>
      </div>
    </div>
  );
}
