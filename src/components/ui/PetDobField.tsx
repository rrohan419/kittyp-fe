import { useEffect, useState } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ageInMonthsToDob, dobToTotalMonths } from '@/utils/petAgeInput';

export interface PetDobFieldProps {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  defaultMode?: 'months' | 'date';
  className?: string;
  required?: boolean;
}

export function PetDobField({
  id = 'pet-dob',
  value = '',
  onChange,
  disabled = false,
  label = 'Date of birth / Age',
  defaultMode = 'months',
  className = '',
  required = false,
}: PetDobFieldProps) {
  // If a valid date already exists when mounted, prefer date mode unless defaultMode is explicitly forced
  const [mode, setMode] = useState<'months' | 'date'>(() => {
    if (value && defaultMode !== 'months') return 'date';
    return defaultMode;
  });

  const [monthsInput, setMonthsInput] = useState<string>(() => {
    if (value) {
      const calculatedMonths = dobToTotalMonths(value);
      return calculatedMonths != null ? String(calculatedMonths) : '';
    }
    return '';
  });

  // Keep monthsInput in sync if value changes externally
  useEffect(() => {
    if (!value) {
      setMonthsInput('');
      return;
    }
    // Only update if not already matching the current months input to avoid cursor jump
    const currentFromInput = monthsInput ? ageInMonthsToDob(parseInt(monthsInput, 10) || 0) : '';
    if (value !== currentFromInput) {
      const m = dobToTotalMonths(value);
      setMonthsInput(m != null ? String(m) : '');
    }
  }, [value]);

  const handleModeChange = (newMode: 'months' | 'date') => {
    setMode(newMode);
    if (newMode === 'months') {
      if (value) {
        const m = dobToTotalMonths(value);
        setMonthsInput(m != null ? String(m) : '');
      }
    } else {
      // Switching to date picker mode: if we had months entered, value is already computed
    }
  };

  const handleMonthsChange = (val: string) => {
    setMonthsInput(val);
    const num = parseInt(val, 10);
    if (!val || isNaN(num) || num < 0) {
      onChange('');
    } else {
      onChange(ageInMonthsToDob(num));
    }
  };

  const approxDobText = monthsInput && parseInt(monthsInput, 10) > 0 ? ageInMonthsToDob(parseInt(monthsInput, 10)) : null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required ? '*' : ''}
        </Label>
        <div className="flex rounded-md border border-primary/20 overflow-hidden text-xs font-medium">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange('months')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'months'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Age in months
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeChange('date')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'date'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Pick exact date
          </button>
        </div>
      </div>

      {mode === 'months' ? (
        <div className="space-y-1">
          <Input
            id={id}
            type="number"
            min="0"
            max="360"
            value={monthsInput}
            onChange={(e) => handleMonthsChange(e.target.value)}
            placeholder="Enter age in months (e.g. 6)"
            disabled={disabled}
            className="border-primary/20 focus:border-primary"
          />
          {approxDobText ? (
            <p className="text-xs text-muted-foreground">
              Approx. date of birth: <span className="font-medium">{approxDobText}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <DatePicker
          id={id}
          value={value}
          onChange={onChange}
          placeholder="Select date of birth"
          disableFuture
          disabled={disabled}
          className="border-primary/20"
        />
      )}
    </div>
  );
}

