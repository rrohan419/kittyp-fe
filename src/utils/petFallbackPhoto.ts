const PET_FALLBACK_BASE = 'https://kittyp-users.s3.ap-south-1.amazonaws.com/defaults/pets';

const PET_FALLBACK_KINDS = ['dog', 'cat', 'rabbit', 'bird', 'other'] as const;

export type PetFallbackKind = (typeof PET_FALLBACK_KINDS)[number];

/** Five stock photos per type, used only when a pet has no uploaded image. */
export const PET_FALLBACK_PHOTOS: Record<PetFallbackKind, readonly string[]> = {
  dog: photoUrls('dog'),
  cat: photoUrls('cat'),
  rabbit: photoUrls('rabbit'),
  bird: photoUrls('bird'),
  other: photoUrls('other'),
};

function photoUrls(kind: PetFallbackKind): readonly string[] {
  return [1, 2, 3, 4, 5].map((index) => `${PET_FALLBACK_BASE}/${kind}-${index}.jpg`);
}

/** Map a stored species or parent pet type onto a stock-photo set. */
export function petFallbackKind(speciesOrType?: string | null): PetFallbackKind {
  const value = (speciesOrType ?? '').trim().toLowerCase();
  if (value.includes('cat') || value.includes('feline')) return 'cat';
  if (value.includes('dog') || value.includes('canine')) return 'dog';
  if (value.includes('rabbit') || value.includes('bunny')) return 'rabbit';
  if (value.includes('bird') || value.includes('avian')) return 'bird';
  return 'other';
}

/** `images[petIndex % images.length]` within the species set. */
export function petFallbackPhotoUrl(speciesOrType?: string | null, petIndex = 0): string {
  const images = PET_FALLBACK_PHOTOS[petFallbackKind(speciesOrType)];
  const index = petIndex >= 0 ? petIndex : 0;
  return images[index % images.length];
}
