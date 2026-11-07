import type {
  ClinicOwnerModel,
  ClinicOwnerPetModel,
  ClinicPetListModel,
  PlatformUserSearchModel,
} from '../services/clinicService';
import { matchesAppointmentSearch } from './appointmentPatientSearch.ts';

export type AppointmentSearchHit =
  | { kind: 'pet'; pet: ClinicPetListModel }
  | { kind: 'client'; owner: ClinicOwnerModel }
  | { kind: 'user'; user: PlatformUserSearchModel }
  | { kind: 'platformPet'; user: PlatformUserSearchModel; pet: ClinicOwnerPetModel };

export async function searchAppointmentPatients(
  scope: 'local' | 'global',
  query: string,
  api: {
    pets: () => Promise<ClinicPetListModel[]>;
    owners: () => Promise<ClinicOwnerModel[]>;
    users: () => Promise<PlatformUserSearchModel[]>;
  }
): Promise<AppointmentSearchHit[]> {
  const [pets, owners, users] = await Promise.all([
    api.pets(),
    api.owners(),
    scope === 'global' ? api.users() : Promise.resolve([]),
  ]);
  return mergeAppointmentSearchResults(query, pets, owners, users);
}

export function mergeAppointmentSearchResults(
  query: string,
  pets: ClinicPetListModel[],
  owners: ClinicOwnerModel[],
  users: PlatformUserSearchModel[],
  includePhone = false
): AppointmentSearchHit[] {
  const hits: AppointmentSearchHit[] = [];
  const seenPets = new Set<string>();
  const seenOwners = new Set<string>();
  const addPet = (pet: ClinicPetListModel) => {
    if (seenPets.has(pet.petUuid)) return;
    seenPets.add(pet.petUuid);
    if (pet.ownerUuid) seenOwners.add(pet.ownerUuid);
    if (pet.ownerEmail) seenOwners.add(pet.ownerEmail.toLowerCase());
    hits.push({ kind: 'pet', pet });
  };

  pets.forEach(addPet);
  for (const owner of owners) {
    const alreadySeen = seenOwners.has(owner.ownerUuid)
      || Boolean(owner.email && seenOwners.has(owner.email.toLowerCase()));
    if (owner.ownerUuid) seenOwners.add(owner.ownerUuid);
    if (owner.email) seenOwners.add(owner.email.toLowerCase());
    if (!owner.pets?.length && !alreadySeen) {
      hits.push({ kind: 'client', owner });
    }
    for (const pet of owner.pets ?? []) {
      addPet({
        ...pet,
        ownerUuid: owner.ownerUuid,
        ownerName: owner.name,
        ownerPhone: owner.phone,
        ownerEmail: owner.email,
        linked: owner.linked,
      });
    }
  }
  const seenUsers = new Set<string>();
  for (const user of users) {
    if (seenUsers.has(user.userUuid)) continue;
    seenUsers.add(user.userUuid);
    if (!user.pets?.length) {
      if ((!user.clinicOwnerUuid || !seenOwners.has(user.clinicOwnerUuid))
          && (!user.email || !seenOwners.has(user.email.toLowerCase()))) {
        hits.push({ kind: 'user', user });
      }
      continue;
    }
    for (const pet of user.pets) {
      if (seenPets.has(pet.petUuid)) continue;
      seenPets.add(pet.petUuid);
      hits.push({ kind: 'platformPet', user, pet });
    }
  }

  return hits.filter((hit) => {
    switch (hit.kind) {
      case 'client':
        return true;
      case 'user':
        return matchesAppointmentSearch(query, hit.user.name, hit.user.email, hit.user.userUuid,
          includePhone ? hit.user.phone : undefined);
      case 'platformPet':
        return matchesAppointmentSearch(query, hit.user.name, hit.user.email, hit.user.userUuid,
          hit.user.clinicOwnerUuid, hit.pet.name, hit.pet.petUuid, hit.pet.globalPetId,
          hit.pet.patientNumber);
      case 'pet':
        return true;
    }
  }).slice(0, 100);
}

export function mergeClientPhoneResults(
  query: string,
  scoped: AppointmentSearchHit[],
  owners: ClinicOwnerModel[],
  users: PlatformUserSearchModel[]
): AppointmentSearchHit[] {
  const phoneHits = mergeAppointmentSearchResults(
    query,
    [],
    owners.map((owner) => ({
      ...owner,
      pets: (owner.pets ?? []).filter((pet) => pet.clinicPatient === true),
    })),
    users.map((user) => ({ ...user, pets: [] })),
    true
  );
  const keyOf = (hit: AppointmentSearchHit) => hit.kind === 'client' ? `owner-${hit.owner.ownerUuid}`
    : hit.kind === 'user' ? `user-${hit.user.userUuid}` : `pet-${hit.pet.petUuid}`;
  const seen = new Set(scoped.map(keyOf));
  const seenOwners = new Set(scoped.flatMap((hit) => hit.kind === 'client' ? [hit.owner.ownerUuid]
    : hit.kind === 'pet' && hit.pet.ownerUuid ? [hit.pet.ownerUuid]
      : hit.kind === 'platformPet' && hit.user.clinicOwnerUuid ? [hit.user.clinicOwnerUuid]
        : hit.kind === 'user' && hit.user.clinicOwnerUuid ? [hit.user.clinicOwnerUuid] : []));
  return [...scoped, ...phoneHits.filter((hit) => {
    const key = keyOf(hit);
    if (seen.has(key) || (hit.kind === 'user' && hit.user.clinicOwnerUuid
      && seenOwners.has(hit.user.clinicOwnerUuid))) return false;
    seen.add(key);
    return true;
  })].slice(0, 100);
}
