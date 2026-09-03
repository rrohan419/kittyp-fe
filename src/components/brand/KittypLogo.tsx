import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type KittypLogoProps = {
  className?: string;
  /** text-2xl by default */
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
};

const sizeClass = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
} as const;

export function KittypLogo({ className, size = 'md', asLink = false }: KittypLogoProps) {
  const mark = (
    <span
      className={cn(
        'inline-flex items-baseline leading-none font-extrabold tracking-tight',
        sizeClass[size],
        !asLink && className
      )}
      aria-label="kittyp"
    >
      <span className="text-foreground">kitty</span>
      <span className="text-primary">p</span>
    </span>
  );

  if (asLink) {
    return (
      <Link to="/" className={cn('inline-flex shrink-0', className)}>
        {mark}
      </Link>
    );
  }

  return mark;
}
