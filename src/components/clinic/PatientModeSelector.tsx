import { cn } from '@/lib/utils';

export type PatientMode = 'existing' | 'new';

type Props = {
  value: PatientMode;
  onChange: (mode: PatientMode) => void;
  disabled?: boolean;
};

export function PatientModeSelector({ value, onChange, disabled = false }: Props) {
  return (
    <div role="group" aria-label="Patient type" className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
      {([
        { value: 'existing', label: 'Existing patient' },
        { value: 'new', label: 'New patient' },
      ] as const).map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === option.value}
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            value === option.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
