/** CRM list/profile URLs for clinic portal vs affiliated-doctor portal. */
export function clinicCrmPaths(pathname: string) {
  const doctor = pathname.startsWith('/doctor');
  const base = doctor ? '/doctor' : '/clinic';
  return {
    clients: doctor ? `${base}/clients` : `${base}/patients`,
    owner: (ownerUuid: string) => `${base}/owners/${ownerUuid}`,
    pet: (petUuid: string) => (doctor ? `${base}/patients/${petUuid}` : `${base}/pets/${petUuid}`),
  };
}
