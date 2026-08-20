const KNOWN_TYPES: Record<string, string> = {
  cat: 'Cat',
  feline: 'Feline',
  dog: 'Dog',
  canine: 'Canine',
  bird: 'Bird',
  rabbit: 'Rabbit',
  other: 'Other',
};

/** `male` / `female` for selects. Mixed-case stored values still match. */
export function normalizePetGender(raw?: string | null): string {
  const value = raw?.trim().toLowerCase();
  return value === 'male' || value === 'female' ? value : '';
}

/** Normalize stored pet type for display. Blank stays blank; unknown values keep stored text. */
export function formatPetType(raw?: string | null): string {
  const value = raw?.trim();
  if (!value) return '';
  return KNOWN_TYPES[value.toLowerCase()] ?? value;
}

/** `Bruno · Dog`, or name only when type is blank. */
export function petNameWithType(name?: string | null, type?: string | null): string {
  const petName = name?.trim() || '';
  const petType = formatPetType(type);
  if (!petName) return petType;
  if (!petType) return petName;
  return `${petName} · ${petType}`;
}
