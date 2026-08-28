import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CopyableId({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value?: string | null;
  hint?: string;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={cn('flex items-start gap-2 text-muted-foreground', className)}>
      <div className="min-w-0">
        <p className="text-xs">{label}</p>
        <p className="text-foreground font-mono tracking-wide">{value}</p>
        {hint ? <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p> : null}
      </div>
      <button
        type="button"
        className="shrink-0 mt-3 text-muted-foreground hover:text-foreground"
        aria-label={`Copy ${label}`}
        onClick={() => {
          void navigator.clipboard.writeText(value);
          toast.success(`Copied ${label}`);
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
