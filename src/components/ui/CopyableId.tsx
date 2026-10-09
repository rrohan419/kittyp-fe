import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CopyableId({
  label,
  value,
  hint,
  inline = false,
  className,
}: {
  label: string;
  value?: string | null;
  hint?: string;
  inline?: boolean;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      <div className="min-w-0">
        {inline ? (
          <p className="text-sm">
            {label}
            {' - '}
            <span className="text-foreground font-mono tracking-wide">{value}</span>
          </p>
        ) : (
          <>
            <p className="text-xs">{label}</p>
            <p className="text-foreground font-mono tracking-wide">{value}</p>
            {hint ? <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
