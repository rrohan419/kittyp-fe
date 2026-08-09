import {
  ClinicOwnerModel,
  ClinicPetListModel,
  fetchClinicOwners,
  fetchClinicPets,
} from '@/services/clinicService';

function norm(s: string | undefined | null): string {
  return (s || '').trim().toLowerCase();
}

function digits(s: string | undefined | null): string {
  return (s || '').replace(/\D/g, '');
}

/**
 * Resolve a clinic search query to a single pet or owner detail route when unambiguous.
 * Returns null when multiple (or zero) hits — caller should fall back to the patients list.
 */
export async function resolveClinicSearchTarget(
  clinicUuid: string,
  rawQuery: string
): Promise<string | null> {
  const q = rawQuery.trim();
  if (!q || !clinicUuid) return null;

  const [pets, owners] = await Promise.all([
    fetchClinicPets(clinicUuid, q).catch(() => [] as ClinicPetListModel[]),
    fetchClinicOwners(clinicUuid, q).catch(() => [] as ClinicOwnerModel[]),
  ]);

  const qn = norm(q);
  const qd = digits(q);

  const exactPet =
    pets.find((p) => norm(p.name) === qn) ||
    pets.find((p) => p.microchipNumber && norm(p.microchipNumber) === qn) ||
    (qd.length >= 8
      ? pets.find((p) => p.microchipNumber && digits(p.microchipNumber) === qd)
      : undefined);

  if (exactPet) {
    return `/clinic/pets/${exactPet.petUuid}`;
  }

  const exactOwner =
    owners.find((o) => norm(o.name) === qn) ||
    owners.find((o) => o.email && norm(o.email) === qn) ||
    (qd.length >= 8
      ? owners.find((o) => o.phone && digits(o.phone).endsWith(qd))
      : undefined) ||
    owners.find((o) => o.phone && digits(o.phone) === qd);

  if (exactOwner) {
    return `/clinic/owners/${exactOwner.ownerUuid}`;
  }

  // Single unambiguous entity
  if (pets.length === 1 && owners.length === 0) {
    return `/clinic/pets/${pets[0].petUuid}`;
  }
  if (owners.length === 1 && pets.length === 0) {
    return `/clinic/owners/${owners[0].ownerUuid}`;
  }
  if (pets.length === 1 && owners.length === 1) {
    // Prefer the pet when both match (more specific)
    return `/clinic/pets/${pets[0].petUuid}`;
  }

  return null;
}
