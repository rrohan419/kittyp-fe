import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ensurePetDefaultPhoto } from '@/utils/ensurePetDefaultPhoto';
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
  const initial =
    src !== undefined
      ? src?.trim() || PET_IMAGE_PLACEHOLDER
      : resolvePetImageSrc(pet ?? {});
  const [resolved, setResolved] = useState(initial);
  const [erroredFor, setErroredFor] = useState<string | null>(null);

  useEffect(() => {
    if (src !== undefined) {
      setResolved(src?.trim() || PET_IMAGE_PLACEHOLDER);
      return;
    }
    const existing =
      pet?.profilePicture?.trim() || pet?.photoUrl?.trim() || pet?.photos?.[0]?.trim() || '';
    if (existing) {
      setResolved(existing);
      return;
    }
    const uuid = pet?.uuid?.trim();
    if (!uuid) {
      setResolved(resolvePetImageSrc(pet ?? {}));
      return;
    }
    let alive = true;
    ensurePetDefaultPhoto(uuid, existing, pet?.species ?? pet?.type).then((url) => {
      if (alive) setResolved(url);
    });
    return () => {
      alive = false;
    };
  }, [src, pet?.uuid, pet?.profilePicture, pet?.photoUrl, pet?.photos, pet?.species, pet?.type]);

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
        if (resolved !== PET_IMAGE_PLACEHOLDER) setErroredFor(resolved);
      }}
    />
  );
}
