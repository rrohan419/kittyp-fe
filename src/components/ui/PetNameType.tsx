import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatPetType } from '@/utils/petType';

type PetNameTypeProps = {
  name?: string | null;
  type?: string | null;
  className?: string;
};

/** Pet name with type badge. Type omitted when blank. */
export function PetNameType({ name, type, className }: PetNameTypeProps) {
  const petName = name?.trim() || 'Pet';
  const petType = formatPetType(type);
  return (
    <span className={cn('inline-flex items-center gap-2 min-w-0', className)}>
      <span className="font-medium truncate">{petName}</span>
      {petType ? (
        <Badge variant="outline" className="shrink-0 font-normal text-[11px] text-muted-foreground">
          {petType}
        </Badge>
      ) : null}
    </span>
  );
}
