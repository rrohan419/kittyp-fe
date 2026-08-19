export const A2HS_LAST_PROMPT_KEY = 'kittyp-a2hs-last-prompt';
export const PWA_PREFS_KEY = 'kittyp-pwa-preferences';
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const MOBILE_MQ = '(max-width: 767px)';
export const COARSE_POINTER_MQ = '(hover: none) and (pointer: coarse)';

/** Phones/tablets across Android, iOS, BlackBerry, KaiOS, Windows Phone, and OEM browsers. */
const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB10|PlayBook|IEMobile|Opera Mini|Opera Mobi|Mobile|Windows Phone|Windows CE|Kindle|Silk|KaiOS|Nokia|SamsungBrowser|UCBrowser|HuaweiBrowser|HarmonyOS|MiuiBrowser|VivoBrowser|HeyTapBrowser|Fennec/i;

const DISPLAY_MODES = [
  '(display-mode: standalone)',
  '(display-mode: fullscreen)',
  '(display-mode: minimal-ui)',
  '(display-mode: window-controls-overlay)',
] as const;

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PwaPrefs = {
  installedAt?: number | null;
};

type A2hsListener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listening = false;
const listeners = new Set<A2hsListener>();

function readStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function readPrefs(): PwaPrefs {
  const raw = readStorage(PWA_PREFS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PwaPrefs;
  } catch {
    return {};
  }
}

function writePrefs(updates: PwaPrefs): void {
  const next = { ...readPrefs(), ...updates };
  writeStorage(PWA_PREFS_KEY, JSON.stringify(next));
}

function readLastPromptAt(): number | null {
  const raw = readStorage(A2HS_LAST_PROMPT_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function isMobileUserAgent(ua: string): boolean {
  return MOBILE_UA_RE.test(ua);
}

export function isIosClient(
  ua: string,
  platform = '',
  maxTouchPoints = 0
): boolean {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Macintosh desktop Safari.
  return platform === 'MacIntel' && maxTouchPoints > 1;
}

function currentNavigator(): Navigator | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator;
}

export function isIosDevice(): boolean {
  const nav = currentNavigator();
  if (!nav) return false;
  return isIosClient(nav.userAgent, nav.platform, nav.maxTouchPoints);
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function') {
    if (window.matchMedia(MOBILE_MQ).matches) return true;
    // Phones in landscape often exceed 767px.
    if (window.matchMedia(COARSE_POINTER_MQ).matches) return true;
  }
  const nav = currentNavigator();
  if (!nav) return false;
  if (isIosClient(nav.userAgent, nav.platform, nav.maxTouchPoints)) return true;
  return isMobileUserAgent(nav.userAgent);
}

function matchesDisplayMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return DISPLAY_MODES.some((query) => window.matchMedia(query).matches);
}

export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (matchesDisplayMode()) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) {
    return true;
  }
  const installedAt = readPrefs().installedAt;
  return typeof installedAt === 'number';
}

export function shouldShowPrompt(now = Date.now()): boolean {
  if (!isMobileViewport()) return false;
  if (isAppInstalled()) return false;
  const lastPromptAt = readLastPromptAt();
  if (lastPromptAt == null) return true;
  return now - lastPromptAt >= ONE_DAY_MS;
}

export function markPromptShown(now = Date.now()): void {
  writeStorage(A2HS_LAST_PROMPT_KEY, String(now));
}

export function markInstalled(now = Date.now()): void {
  writePrefs({ installedAt: now });
  deferredPrompt = null;
  notify();
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function subscribe(listener: A2hsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Capture BIP. Browser would not fire this if the app is already installed. */
export function captureInstallPrompt(event: Event): void {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  if (readPrefs().installedAt != null) {
    writePrefs({ installedAt: null });
  }
  notify();
}

function onAppInstalled(): void {
  markInstalled();
}

export function startListening(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeinstallprompt', captureInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
}

if (typeof window !== 'undefined') {
  startListening();
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const event = deferredPrompt;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') {
      markInstalled();
    } else {
      notify();
    }
    return choice.outcome;
  } catch {
    deferredPrompt = null;
    notify();
    return 'unavailable';
  }
}

export function getA2hsInstructions(
  ua: string,
  platform = '',
  maxTouchPoints = 0
): string {
  if (isIosClient(ua, platform, maxTouchPoints)) {
    return 'To install Kittyp:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
  }
  if (/BlackBerry|BB10|PlayBook/i.test(ua)) {
    return 'To install Kittyp:\n\n1. Open the browser menu\n2. Tap "Add to Home Screen"\n3. Confirm to add the Kittyp icon';
  }
  if (/Android/i.test(ua)) {
    return 'To install Kittyp:\n\n1. Tap the menu button (three dots)\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap "Add" or "Install" to confirm';
  }
  return 'To install Kittyp:\n\nOpen your browser menu and choose "Add to Home Screen" or "Install app", then confirm.';
}
