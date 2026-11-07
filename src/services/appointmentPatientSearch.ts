import { fetchClinicOwners, fetchClinicPets, searchPlatformUsers } from './clinicService';
import { mergeClientPhoneResults, searchAppointmentPatients } from '../utils/appointmentSearchResults';

export function searchPatientsForAppointment(
  clinicUuid: string,
  query: string,
  scope: 'local' | 'global',
  includePhone = false
) {
  const options = { by: 'appointmentLocal' as const, pageSize: 50 };
  const scopedSearch = searchAppointmentPatients(scope, query, {
    pets: async () => (await fetchClinicPets(clinicUuid, query, options)).models ?? [],
    owners: async () => (await fetchClinicOwners(clinicUuid, query, options)).models ?? [],
    users: () => searchPlatformUsers(clinicUuid, query, { by: 'appointment' }),
  });
  if (!includePhone || !/^[+\d\s().-]+$/.test(query)) return scopedSearch;
  return Promise.all([
    scopedSearch,
    fetchClinicOwners(clinicUuid, query, { pageSize: 50 }),
    scope === 'global' ? searchPlatformUsers(clinicUuid, query) : Promise.resolve([]),
  ]).then(([scoped, owners, users]) => {
    return mergeClientPhoneResults(query, scoped, owners.models ?? [], users);
  });
}
