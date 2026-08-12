import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { PetProfile } from '@/services/authService';
import { fetchClinicPets } from '@/services/clinicService';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { AttendedPatientModel, fetchMyAttendedPatients } from '@/services/visitService';
import { ROLES, hasRole } from '@/utils/roles';

function mapAttended(row: AttendedPatientModel): PetProfile {
  return {
    uuid: row.petUuid,
    name: row.petName || 'Pet',
    profilePicture: '',
    type: row.species || '',
    breed: row.breed || '',
    dateOfBirth: '',
    weight: '',
    activityLevel: 'moderate',
    gender: '',
    currentFoodBrand: '',
    healthConditions: '',
    allergies: '',
    isNeutered: true,
    createdAt: '',
  };
}

function mapClinicPet(row: {
  petUuid: string;
  name: string;
  species?: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: string;
  photoUrl?: string;
}): PetProfile {
  return {
    uuid: row.petUuid,
    name: row.name || 'Pet',
    profilePicture: row.photoUrl || '',
    type: row.species || '',
    breed: row.breed || '',
    dateOfBirth: row.dateOfBirth || '',
    weight: row.weight || '',
    activityLevel: 'moderate',
    gender: row.gender || '',
    currentFoodBrand: '',
    healthConditions: '',
    allergies: '',
    isNeutered: true,
    createdAt: '',
  };
}

function mergeByUuid(lists: PetProfile[][]): PetProfile[] {
  const map = new Map<string, PetProfile>();
  for (const list of lists) {
    for (const pet of list) {
      if (pet.uuid && !map.has(pet.uuid)) {
        map.set(pet.uuid, pet);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Pets for the nutrition picker:
 * - Pet parent: ownerPets from /user/me
 * - Doctor on personal practice: personal clinic pets + pets the doctor attended
 * - Doctor on a clinic branch: that clinic's pets (+ attended at that clinic)
 */
export function useNutritionPets() {
  const { user } = useSelector((s: RootState) => s.authReducer);
  const { clinicUuid, isPersonalPractice, loading: clinicLoading } = useActiveClinic();
  const isDoctor = hasRole(user?.roles, ROLES.DOCTOR);
  const [pets, setPets] = useState<PetProfile[]>(user?.ownerPets || []);
  const [loading, setLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState('Your pets');

  const reload = useCallback(async () => {
    if (!isDoctor) {
      setPets(user?.ownerPets || []);
      setSourceLabel('Your pets');
      return;
    }
    if (clinicLoading || !clinicUuid) {
      return;
    }
    setLoading(true);
    try {
      if (isPersonalPractice) {
        const [clinicPets, attended] = await Promise.all([
          fetchClinicPets(clinicUuid).catch(() => []),
          fetchMyAttendedPatients().catch(() => [] as AttendedPatientModel[]),
        ]);
        setPets(mergeByUuid([clinicPets.map(mapClinicPet), attended.map(mapAttended)]));
        setSourceLabel('Personal practice & attended pets');
      } else {
        const [clinicPets, attended] = await Promise.all([
          fetchClinicPets(clinicUuid).catch(() => []),
          fetchMyAttendedPatients(clinicUuid).catch(() => [] as AttendedPatientModel[]),
        ]);
        setPets(mergeByUuid([clinicPets.map(mapClinicPet), attended.map(mapAttended)]));
        setSourceLabel('Clinic patients');
      }
    } catch {
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [isDoctor, clinicLoading, clinicUuid, isPersonalPractice, user?.ownerPets]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { pets, loading, sourceLabel, reload, isDoctor };
}
