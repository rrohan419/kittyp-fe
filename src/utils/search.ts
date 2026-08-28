/** Case-insensitive contains match. Empty query matches everything. Null fields do not throw. */
export function matchesQuery(
  query: string,
  ...values: Array<string | number | null | undefined>
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => String(value ?? '').toLowerCase().includes(needle));
}
