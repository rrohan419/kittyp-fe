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

  const splitMonths = (value: string) => {
    const total = value ? dobToTotalMonths(value) : null;
    if (total == null) return { y: '', m: '' };
    const y = Math.floor(total / 12);
    const m = total % 12;
    return { y: y > 0 ? String(y) : '', m: m > 0 || y === 0 ? String(m) : '' };
  };

  const [yearsInput, setYearsInput] = useState<string>(() => splitMonths(value).y);
  const [monthsInput, setMonthsInput] = useState<string>(() => splitMonths(value).m);

  const totalFrom = (y: string, m: string) => {
    const yn = parseInt(y, 10);
    const mn = parseInt(m, 10);
    if (isNaN(yn) && isNaN(mn)) return null;
    return (isNaN(yn) ? 0 : yn) * 12 + (isNaN(mn) ? 0 : mn);
  };

  // Keep inputs in sync if value changes externally
  useEffect(() => {
    if (!value) {
      setYearsInput('');
      setMonthsInput('');
      return;
    }
    // Only update if not already matching the current inputs to avoid cursor jump
    const t = totalFrom(yearsInput, monthsInput);
    const currentFromInput = t != null ? ageInMonthsToDob(t) : '';
    if (value !== currentFromInput) {
      const { y, m } = splitMonths(value);
      setYearsInput(y);
      setMonthsInput(m);
    }
  }, [value]);

  const handleModeChange = (newMode: 'months' | 'date') => {
    setMode(newMode);
    if (newMode === 'months' && value) {
      const { y, m } = splitMonths(value);
      setYearsInput(y);
      setMonthsInput(m);
    }
  };

  const applyAge = (y: string, m: string) => {
    setYearsInput(y);
    setMonthsInput(m);
    const t = totalFrom(y, m);
    onChange(t == null || t < 0 ? '' : ageInMonthsToDob(t));
  };

  const totalMonthsEntered = totalFrom(yearsInput, monthsInput);
  const approxDobText =
    totalMonthsEntered != null && totalMonthsEntered > 0 ? ageInMonthsToDob(totalMonthsEntered) : null;

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
            Enter age (y / m)
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
          <div className="flex items-center gap-2">
            <Input
              id={id}
              type="number"
              min="0"
              max="30"
              value={yearsInput}
              onChange={(e) => applyAge(e.target.value, monthsInput)}
              placeholder="0"
              disabled={disabled}
              className="border-primary/20 focus:border-primary"
            />
            <span className="text-sm text-muted-foreground">y</span>
            <Input
              type="number"
              min="0"
              max="11"
              value={monthsInput}
              onChange={(e) => applyAge(yearsInput, e.target.value)}
              placeholder="0"
              disabled={disabled}
              className="border-primary/20 focus:border-primary"
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
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

