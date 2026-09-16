export function isVideoConsult(mode?: string | null): boolean {
  return (mode || '').toUpperCase() === 'VIDEO';
}

export function consultPath(bookingUuid: string, portal: 'parent' | 'doctor'): string {
  return portal === 'doctor' ? `/doctor/consult/${bookingUuid}` : `/app/consult/${bookingUuid}`;
}

export function shouldShowIncomingVideoCall(pathname: string, joinPath?: string | null): boolean {
  if (!joinPath) return false;
  return pathname !== joinPath;
}

export function isVideoCallPush(data?: Record<string, unknown> | null): boolean {
  if (!data) return false;
  const type = String(data.type || '');
  const url = String(data.url || data.path || '');
  return type === 'VIDEO_CALL' || url.includes('/consult/');
}

export function parentCanJoinVideo(
  mode?: string | null,
  videoLive?: boolean | null,
  videoJoinOpen?: boolean | null
): boolean {
  return isVideoConsult(mode) && videoLive === true && videoJoinOpen !== false;
}

export function doctorCanJoinVideo(mode?: string | null, videoJoinOpen?: boolean | null): boolean {
  return isVideoConsult(mode) && videoJoinOpen !== false;
}

export function incomingCallerLabel(name?: string | null): string {
  const n = (name || 'Someone').trim() || 'Someone';
  if (/^dr\.?\s/i.test(n)) {
    return n;
  }
  return `Dr. ${n}`;
}

export function incomingCallerPhotoUrl(url?: string | null): string | null {
  const photo = (url || '').trim();
  return photo || null;
}

export function isVideoJoinWindowClosed(message?: string | null): boolean {
  return (message || '').toLowerCase().includes('window is not open');
}
