function withoutDoctorTitle(name: string): string {
  return name.replace(/^Dr\.?\s*/i, '').trim();
}

/** True when the clinic label is just the doctor's own name, with or without a Dr. prefix. */
export function sameClinicAndDoctor(clinicName?: string | null, doctorName?: string | null): boolean {
  const clinic = clinicName?.trim();
  const doctor = doctorName?.trim();
  if (!clinic || !doctor) return false;
  return withoutDoctorTitle(clinic).toLowerCase() === withoutDoctorTitle(doctor).toLowerCase();
}

export function formatDoctorName(doctorName?: string | null): string {
  const core = doctorName ? withoutDoctorTitle(doctorName) : '';
  return core ? `Dr. ${core}` : '';
}
