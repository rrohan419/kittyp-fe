/**
 * Renders a pet profile weight with a single "kg" suffix.
 * Stored values may already contain the unit ("20 kg", "20 KG", "20 kg kg").
 */
export function formatPetWeight(raw: unknown): string {
  if (raw == null) return '';
  const text = String(raw).trim();
  if (!text || text.includes('-') || text.includes('−')) return '';
  const match = text.match(/\d+(?:\.\d+)?|\.\d+/);
  if (!match) return '';
  return `${match[0]} kg`;
}
