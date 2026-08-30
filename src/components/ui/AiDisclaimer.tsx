import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiDisclaimerProps {
  className?: string;
}

export function AiDisclaimer({ className }: AiDisclaimerProps) {
  return (
    <p
      role="note"
      className={cn(
        'flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground',
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" aria-hidden />
      <span>
        AI can make mistakes. Review this with a veterinarian before accepting it as final.
      </span>
    </p>
  );
}
