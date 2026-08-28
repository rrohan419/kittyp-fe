/**
 * Radix Dropdown/Dialog/Select can leave `pointer-events: none` on <body>
 * after an interrupted close (scroll, async remount, overlapping portals).
 * That makes the whole app feel "dead" until a full refresh.
 */

function hasOpenRadixOverlay(): boolean {
  return Boolean(
    document.querySelector(
      [
        '[role="dialog"][data-state="open"]',
        '[role="menu"][data-state="open"]',
        '[role="listbox"][data-state="open"]',
        '[data-radix-popper-content-wrapper]',
        '[data-state="open"].fixed.inset-0',
      ].join(',')
    )
  );
}

export function clearStuckUiLocks(): void {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const html = document.documentElement;

  // Only clear when nothing interactive is actually open
  if (hasOpenRadixOverlay()) return;

  if (body.style.pointerEvents === 'none') {
    body.style.pointerEvents = '';
  }
  if (body.style.overflow === 'hidden' && !body.hasAttribute('data-scroll-locked')) {
    // Keep scroll lock if a library still owns it via attribute; otherwise clear orphan overflow
  }
  if (body.getAttribute('data-scroll-locked') != null && !hasOpenRadixOverlay()) {
    body.removeAttribute('data-scroll-locked');
    body.style.overflow = '';
    body.style.paddingRight = '';
    html.style.overflow = '';
  }

  // Orphan dismiss layers from aborted modal menus
  document.querySelectorAll('[data-aria-hidden="true"]').forEach((el) => {
    if (el === body || el === html) {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('data-aria-hidden');
    }
  });
}

/** Call from portal shell — clears locks on route change and first click after a stuck state. */
export function installStuckUiLockGuard(): () => void {
  const onPointerDown = () => {
    if (document.body.style.pointerEvents === 'none' && !hasOpenRadixOverlay()) {
      clearStuckUiLocks();
    }
  };
  const onFocus = () => clearStuckUiLocks();
  const onVisibility = () => {
    if (document.visibilityState === 'visible') clearStuckUiLocks();
  };

  // Observe body style mutations (Radix sets pointer-events inline)
  const observer = new MutationObserver(() => {
    if (document.body.style.pointerEvents === 'none') {
      // Defer so open animations can finish; then clear if nothing stayed open
      window.setTimeout(() => clearStuckUiLocks(), 120);
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-scroll-locked', 'aria-hidden'] });

  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    observer.disconnect();
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
