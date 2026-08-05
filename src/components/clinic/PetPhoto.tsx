import { useState } from 'react';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOG_FALLBACKS = [
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
];
const CAT_FALLBACKS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&h=400&fit=crop',
];

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Prefer uploaded photo; otherwise a stable species stock image so tiles aren't blank. */
export function resolvePetPhotoUrl(
  photoUrl?: string | null,
  species?: string | null,
  seed?: string | null
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  const kind = (species || '').toLowerCase().includes('cat') ? 'cat' : 'dog';
  const pool = kind === 'cat' ? CAT_FALLBACKS : DOG_FALLBACKS;
  return pool[hashSeed(seed || species || 'pet') % pool.length];
}

type PetPhotoProps = {
  photoUrl?: string | null;
  name: string;
  species?: string | null;
  seed?: string | null;
  className?: string;
  imgClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'xl' | '2xl' | 'full' | 'none';
  /** Full-bleed area for card headers / profile panels */
  variant?: 'avatar' | 'cover';
  /** contain = show full image (no crop); cover = fill frame */
  fit?: 'contain' | 'cover';
};

const sizeClass = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28 sm:w-32 sm:h-32',
};

export function PetPhoto({
  photoUrl,
  name,
  species,
  seed,
  className,
  imgClassName,
  size = 'md',
  rounded = '2xl',
  variant = 'avatar',
  fit = 'cover',
}: PetPhotoProps) {
  const src = resolvePetPhotoUrl(photoUrl, species, seed || name);
  const [failed, setFailed] = useState(false);
  const radius =
    rounded === 'none'
      ? 'rounded-none'
      : rounded === 'full'
        ? 'rounded-full'
        : rounded === 'xl'
          ? 'rounded-xl'
          : 'rounded-2xl';
  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover';

  if (failed) {
    if (variant === 'cover') {
      return (
        <div
          className={cn(
            'h-36 w-full bg-muted/40 text-primary flex items-center justify-center rounded-xl',
            className
          )}
          aria-label={name}
        >
          <PawPrint className="h-10 w-10 opacity-50" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          sizeClass[size],
          radius,
          'bg-primary/10 text-primary flex items-center justify-center shrink-0',
          className
        )}
        aria-label={name}
      >
        <PawPrint className={cn(size === 'sm' ? 'h-5 w-5' : size === 'xl' ? 'h-10 w-10' : 'h-7 w-7')} />
      </div>
    );
  }

  if (variant === 'cover') {
    return (
      <div className={cn('relative h-36 w-full overflow-hidden bg-muted/40 rounded-xl', className)}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          className={cn('h-full w-full', objectFit, imgClassName)}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(sizeClass[size], radius, 'overflow-hidden shrink-0 bg-muted ring-1 ring-border', className)}
    >
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn('h-full w-full', objectFit, imgClassName)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
