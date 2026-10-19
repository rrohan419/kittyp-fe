import { useEffect, useState } from 'react';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ensurePetDefaultPhoto } from '@/utils/ensurePetDefaultPhoto';
import { petFallbackPhotoUrl } from '@/utils/petFallbackPhoto';

type PetPhotoProps = {
  photoUrl?: string | null;
  name: string;
  species?: string | null;
  petUuid?: string | null;
  className?: string;
  imgClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'xl' | '2xl' | 'full' | 'none';
  variant?: 'avatar' | 'cover';
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
  petUuid,
  className,
  imgClassName,
  size = 'md',
  rounded = '2xl',
  variant = 'avatar',
  fit = 'cover',
}: PetPhotoProps) {
  const [src, setSrc] = useState(
    () => photoUrl?.trim() || petFallbackPhotoUrl(species, petUuid)
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const existing = photoUrl?.trim();
    if (existing) {
      setSrc(existing);
      return;
    }
    if (!petUuid) {
      setSrc(petFallbackPhotoUrl(species, petUuid));
      return;
    }
    let alive = true;
    ensurePetDefaultPhoto(petUuid, photoUrl, species).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [photoUrl, petUuid, species]);

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
