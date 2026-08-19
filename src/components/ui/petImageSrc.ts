export type PetImageSource = {
  profilePicture?: string | null;
  photoUrl?: string | null;
  photos?: Array<string | null | undefined> | null;
};

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">
  <rect width="64" height="64" rx="12" fill="#f4f4f5"/>
  <ellipse cx="32" cy="42" rx="14" ry="11" fill="#a1a1aa"/>
  <circle cx="18" cy="26" r="7" fill="#a1a1aa"/>
  <circle cx="32" cy="20" r="7" fill="#a1a1aa"/>
  <circle cx="46" cy="26" r="7" fill="#a1a1aa"/>
  <circle cx="50" cy="38" r="5.5" fill="#a1a1aa"/>
</svg>`;

export const PET_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

function firstNonBlank(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/** Prefer parent API `profilePicture`, then clinic `photoUrl`, then `photos[0]`. */
export function resolvePetImageSrc(pet: PetImageSource): string {
  return firstNonBlank(pet.profilePicture, pet.photoUrl, pet.photos?.[0]) ?? PET_IMAGE_PLACEHOLDER;
}
