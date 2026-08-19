import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  PET_IMAGE_PLACEHOLDER,
  resolvePetImageSrc,
  type PetImageSource,
} from './petImageSrc';

export { PET_IMAGE_PLACEHOLDER, resolvePetImageSrc };
export type { PetImageSource };

type PetImageProps = {
  pet?: PetImageSource;
  src?: string | null;
  alt: string;
  className?: string;
};

export function PetImage({ pet, src, alt, className }: PetImageProps) {
  const resolved =
    src !== undefined
      ? src?.trim() || PET_IMAGE_PLACEHOLDER
      : resolvePetImageSrc(pet ?? {});
  const [erroredFor, setErroredFor] = useState<string | null>(null);
  const imageSrc = erroredFor === resolved ? PET_IMAGE_PLACEHOLDER : resolved;

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={256}
      height={256}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn('object-cover', className)}
      onError={() => {
        if (resolved !== PET_IMAGE_PLACEHOLDER) {
          setErroredFor(resolved);
        }
      }}
    />
  );
}
