import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { PetProfile } from '@/services/authService';
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

/**
 * Pets for the nutrition picker:
 * - Pet parent: ownerPets from /user/me
 * - Doctor: pets they treated, or pets that visited a clinic they belong to
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
      const attended = await fetchMyAttendedPatients(clinicUuid).catch(
        () => [] as AttendedPatientModel[]
      );
      setPets(attended.map(mapAttended));
      setSourceLabel(
        isPersonalPractice
          ? 'Pets you treated'
          : 'Clinic patients you treated or that visited this clinic'
      );
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
