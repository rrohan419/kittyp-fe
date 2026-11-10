export function isValidWeight(value: string): boolean {
  const weight = Number(value);
  return value.trim() !== '' && Number.isFinite(weight) && weight > 0;
}
