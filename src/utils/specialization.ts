const SPECIALIZATION_LABELS: Record<string, string> = {
  GENERAL_VETERINARY_MEDICINE: 'General Veterinary Medicine',
  SURGERY: 'Surgery',
  DERMATOLOGY: 'Dermatology',
  DENTISTRY: 'Dentistry',
  INTERNAL_MEDICINE: 'Internal Medicine',
  CARDIOLOGY: 'Cardiology',
  ONCOLOGY: 'Oncology',
  OPHTHALMOLOGY: 'Ophthalmology',
  NUROLOGY: 'Neurology',
  EMERGENCY_AND_CRITICAL_CARE: 'Emergency & Critical Care',
  BEHAVIOUR: 'Behavior',
  NUTRITION: 'Nutrition',
  EXOTIC_ANIMAL_MEDICINE: 'Exotic Animal Medicine',
};

/** Maps stored enum names (including NUROLOGY) to the display label. */
export function specializationLabel(value?: string | null): string {
  if (!value) return '';
  const key = value.trim();
  if (!key) return '';
  return SPECIALIZATION_LABELS[key] || key.replace(/_/g, ' ');
}
