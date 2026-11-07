import { Building2, Globe2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type PatientSearchScopeValue = 'local' | 'global';

type Props = {
  value: PatientSearchScopeValue;
  onChange: (scope: PatientSearchScopeValue) => void;
  disabled?: boolean;
};

export function PatientSearchScope({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted-foreground">Search in</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next === 'local' || next === 'global') onChange(next);
        }}
        disabled={disabled}
        aria-label="Patient search scope"
        className="justify-start gap-1 rounded-full border bg-muted/40 p-1"
      >
        <ToggleGroupItem
          value="local"
          size="sm"
          aria-label="Local clinic search"
          className="h-7 gap-1.5 rounded-full px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
        >
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Local
        </ToggleGroupItem>
        <ToggleGroupItem
          value="global"
          size="sm"
          aria-label="Global KittyP search"
          className="h-7 gap-1.5 rounded-full px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
        >
          <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
          Global
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
