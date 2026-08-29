import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SIGNUP_ROLE_LABELS, type SignupRole } from '@/utils/roles';

interface SignupRoleToggleProps {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
  disabled?: boolean;
}

const OPTIONS: SignupRole[] = ['USER', 'DOCTOR', 'CLINIC'];

const SignupRoleToggle = ({ value, onChange, disabled }: SignupRoleToggleProps) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={(next) => {
      if (next === 'USER' || next === 'DOCTOR' || next === 'CLINIC') {
        onChange(next);
      }
    }}
    variant="outline"
    aria-label="Account type"
    disabled={disabled}
    className="w-full grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
  >
    {OPTIONS.map((role) => (
      <ToggleGroupItem
        key={role}
        value={role}
        aria-label={SIGNUP_ROLE_LABELS[role]}
        className="rounded-md text-xs sm:text-sm px-1 sm:px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
      >
        {SIGNUP_ROLE_LABELS[role]}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export default SignupRoleToggle;
