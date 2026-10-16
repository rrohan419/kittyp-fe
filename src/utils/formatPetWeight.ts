/**
 * Pet weight as a number. Drops a stored unit such as "12 kg" or "12 KG".
 * The field label supplies KG.
 */
export function formatPetWeight(raw: unknown): string {
  if (raw == null) return '';
  const text = String(raw).trim();
  if (!text || text.includes('-') || text.includes('−')) return '';
  const match = text.match(/\d+(?:\.\d+)?|\.\d+/);
  return match ? match[0] : '';
}
