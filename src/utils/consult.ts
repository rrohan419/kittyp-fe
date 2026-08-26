export function isVideoConsult(mode?: string | null): boolean {
  return (mode || '').toUpperCase() === 'VIDEO';
}

export function consultPath(bookingUuid: string, portal: 'parent' | 'doctor'): string {
  return portal === 'doctor' ? `/doctor/consult/${bookingUuid}` : `/app/consult/${bookingUuid}`;
}
