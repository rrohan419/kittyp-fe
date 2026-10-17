/**
 * Pet weight as a number. Drops a stored unit such as "12 kg" or "12 kg".
 * The field label supplies kg.
 */
export function formatPetWeight(raw: unknown): string {
  if (raw == null) return '';
  const text = String(raw).trim();
  if (!text || text.includes('-') || text.includes('−')) return '';
  const match = text.match(/\d+(?:\.\d+)?|\.\d+/);
  return match ? match[0] : '';
}
