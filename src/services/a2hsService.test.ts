import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import {
  A2HS_LAST_PROMPT_KEY,
  COARSE_POINTER_MQ,
  MOBILE_MQ,
  ONE_DAY_MS,
  PWA_PREFS_KEY,
  captureInstallPrompt,
  getA2hsInstructions,
  getDeferredPrompt,
  isAppInstalled,
  isIosClient,
  isMobileUserAgent,
  isMobileViewport,
  markPromptShown,
  shouldShowPrompt,
} from './a2hsService.ts';

const memory = new Map<string, string>();

const localStorageMock = {
  getItem(key: string): string | null {
    return memory.has(key) ? memory.get(key)! : null;
  },
  setItem(key: string, value: string): void {
    memory.set(key, String(value));
  },
  removeItem(key: string): void {
    memory.delete(key);
  },
  clear(): void {
    memory.clear();
  },
};

const env = {
  mobile: false,
  coarse: false,
  standalone: false,
};

function matchMedia(query: string) {
  return {
    matches:
      query === MOBILE_MQ
        ? env.mobile
        : query === COARSE_POINTER_MQ
          ? env.coarse
          : query === '(display-mode: standalone)'
            ? env.standalone
            : false,
    media: query,
    onchange: null,
    addListener(): void {},
    removeListener(): void {},
    addEventListener(): void {},
    removeEventListener(): void {},
    dispatchEvent(): boolean {
      return false;
    },
  };
}

function installGlobals(): void {
  const g = globalThis as typeof globalThis & {
    window: typeof globalThis;
    localStorage: typeof localStorageMock;
    matchMedia: typeof matchMedia;
  };

  Object.defineProperty(g, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });
  Object.defineProperty(g, 'matchMedia', {
    value: matchMedia,
    configurable: true,
  });
  g.window = g;
}

before(() => {
  installGlobals();
});

beforeEach(() => {
  memory.clear();
  env.mobile = false;
  env.coarse = false;
  env.standalone = false;
});

describe('isMobileUserAgent', () => {
  it('detects Android, iPhone, BlackBerry, KaiOS, Windows Phone', () => {
    assert.equal(isMobileUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0.0.0 Mobile Safari/537.36'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.1.0.4633 Mobile Safari/537.10+'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (Mobile; Nokia_8110_4G; rv:48.0) Gecko/48.0 Firefox/48.0 KAIOS/2.5'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Lumia) Chrome/52.0.2743.116 Mobile Safari/537.36'), true);
    assert.equal(isMobileUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'), false);
  });
});

describe('isIosClient', () => {
  it('detects iPhone, iPad, and iPadOS desktop UA', () => {
    assert.equal(isIosClient('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
    assert.equal(isIosClient('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)'), true);
    assert.equal(isIosClient('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5), true);
    assert.equal(isIosClient('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0), false);
  });
});

describe('shouldShowPrompt', () => {
  it('is false on desktop', () => {
    env.mobile = false;
    assert.equal(isMobileViewport(), false);
    assert.equal(shouldShowPrompt(), false);
  });

  it('is true on mobile with no timestamp', () => {
    env.mobile = true;
    assert.equal(shouldShowPrompt(), true);
  });

  it('is true on landscape phone via coarse pointer when width exceeds 767', () => {
    env.mobile = false;
    env.coarse = true;
    assert.equal(isMobileViewport(), true);
    assert.equal(shouldShowPrompt(), true);
  });

  it('is false on mobile when timestamp is 1h ago', () => {
    env.mobile = true;
    const now = 1_700_000_000_000;
    markPromptShown(now - 60 * 60 * 1000);
    assert.equal(shouldShowPrompt(now), false);
  });

  it('is true on mobile when timestamp is 25h ago', () => {
    env.mobile = true;
    const now = 1_700_000_000_000;
    markPromptShown(now - 25 * 60 * 60 * 1000);
    assert.equal(shouldShowPrompt(now), true);
  });

  it('is false in standalone even on mobile with no timestamp', () => {
    env.mobile = true;
    env.standalone = true;
    assert.equal(isAppInstalled(), true);
    assert.equal(shouldShowPrompt(), false);
  });
});

describe('markPromptShown', () => {
  it('writes last-prompt timestamp', () => {
    const now = 1_700_000_000_000;
    markPromptShown(now);
    assert.equal(memory.get(A2HS_LAST_PROMPT_KEY), String(now));
  });

  it('allows show again exactly at 24h', () => {
    env.mobile = true;
    const now = 1_700_000_000_000;
    markPromptShown(now);
    assert.equal(shouldShowPrompt(now + ONE_DAY_MS), true);
  });
});

describe('isAppInstalled', () => {
  it('is true when installedAt is stored', () => {
    memory.set(PWA_PREFS_KEY, JSON.stringify({ installedAt: Date.now() }));
    assert.equal(isAppInstalled(), true);
    env.mobile = true;
    assert.equal(shouldShowPrompt(), false);
  });
});

describe('captureInstallPrompt', () => {
  it('prevents default, stores event, and clears stale installedAt', () => {
    memory.set(PWA_PREFS_KEY, JSON.stringify({ installedAt: 1_700_000_000_000 }));
    let prevented = false;
    const event = {
      preventDefault() {
        prevented = true;
      },
      platforms: ['web'],
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
      prompt: async () => {},
    } as unknown as Event;

    captureInstallPrompt(event);

    assert.equal(prevented, true);
    assert.equal(getDeferredPrompt(), event);
    assert.equal(JSON.parse(memory.get(PWA_PREFS_KEY) ?? '{}').installedAt, null);
    env.mobile = true;
    assert.equal(shouldShowPrompt(), true);
  });
});

describe('getA2hsInstructions', () => {
  it('returns iOS, Android, and BlackBerry specific steps', () => {
    assert.match(getA2hsInstructions('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), /Share button/);
    assert.match(getA2hsInstructions('Mozilla/5.0 (Linux; Android 14)'), /three dots/);
    assert.match(getA2hsInstructions('Mozilla/5.0 (BB10; Touch)'), /Add to Home Screen/);
    assert.match(getA2hsInstructions('Mozilla/5.0 (Windows NT 10.0)'), /browser menu/);
  });
});
