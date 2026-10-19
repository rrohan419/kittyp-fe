import { updatePetPhotos } from '@/services/UserService';
import { updateUserPet } from '@/module/slice/AuthSlice';
import { store } from '@/module/store/store';
import { petFallbackPhotoUrl } from '@/utils/petFallbackPhoto';

const inFlight = new Set<string>();
const assigned = new Map<string, string>();

/** If blank, pick a stable stock URL for this pet, save once, and sync Redux. */
export async function ensurePetDefaultPhoto(
  petUuid: string,
  existingUrl: string | null | undefined,
  speciesOrType: string | null | undefined
): Promise<string> {
  const existing = existingUrl?.trim();
  if (existing) {
    assigned.set(petUuid, existing);
    return existing;
  }

  const cached = assigned.get(petUuid);
  if (cached) return cached;

  const url = petFallbackPhotoUrl(speciesOrType, petUuid);
  if (!petUuid || inFlight.has(petUuid)) return url;

  inFlight.add(petUuid);
  try {
    const result = await updatePetPhotos(petUuid, [url]);
    const savedUrl = result.profilePicture?.trim() || url;
    assigned.set(petUuid, savedUrl);
    store.dispatch(updateUserPet({ uuid: petUuid, profilePicture: savedUrl }));
    return savedUrl;
  } catch {
    return url;
  } finally {
    inFlight.delete(petUuid);
  }
}
