import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, RefreshCw, Info, Smartphone, Bell, BellOff, ArrowUpCircle } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
// Add this import for Vite PWA update detection
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  hasManifest: boolean;
  hasServiceWorker: boolean;
  canInstall: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  userDismissed: boolean;
  installAttempts: number;
}

const PWA_STORAGE_KEY = 'kittyp-pwa-preferences';

export function PWAInstaller() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    hasManifest: false,
    hasServiceWorker: false,
    canInstall: false,
    deferredPrompt: null,
    userDismissed: false,
    installAttempts: 0
  });
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const installPromptShownRef = useRef(false);
  const { colorScheme, resolvedMode } = useTheme();

  // Add new state for update available
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Improved install detection
  const isAppInstalled = useCallback(() => {
    // Standalone mode (most platforms)
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari
    if ((window.navigator as any).standalone) return true;
    // Trusted Web Activity (Android)
    if (document.referrer.startsWith('android-app://')) return true;
    return false;
  }, []);

  // Load user preferences from localStorage
  const loadUserPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem(PWA_STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          userDismissed: preferences.userDismissed || false,
          installAttempts: preferences.installAttempts || 0
        }));
      }
    } catch (error) {
      console.error('Error loading PWA preferences:', error);
    }
  }, []);

  // Save user preferences to localStorage
  const saveUserPreferences = useCallback((updates: Partial<PWAState>) => {
    try {
      const current = JSON.parse(localStorage.getItem(PWA_STORAGE_KEY) || '{}');
      const updated = { ...current, ...updates };
      localStorage.setItem(PWA_STORAGE_KEY, JSON.stringify(updated));
      setState(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error saving PWA preferences:', error);
    }
  }, []);

  // Check if browser supports PWA installation
  const checkBrowserSupport = useCallback(() => {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;
    
    // Chrome, Edge, and Firefox support PWA installation
    const supportsInstall = isChrome || isEdge || isFirefox;
    
    // Safari on iOS supports "Add to Home Screen" but not standard PWA install
    const supportsManualInstall = isSafari || supportsInstall;
    
    return { supportsInstall, supportsManualInstall };
  }, []);

  // Check PWA status
  const checkPWAStatus = useCallback(async () => {
    const isCurrentlyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const hasServiceWorker = 'serviceWorker' in navigator;
    const { supportsInstall, supportsManualInstall } = checkBrowserSupport();
    
    // Check if service worker is actually registered
    let serviceWorkerActive = false;
    if (hasServiceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerActive = !!registration?.active;
      } catch (error) {
        console.error('Error checking service worker:', error);
      }
    }

    setState(prev => ({
      ...prev,
      isInstalled: isCurrentlyInstalled,
      hasManifest: !!manifestLink,
      hasServiceWorker: serviceWorkerActive,
      canInstall: supportsInstall && !isCurrentlyInstalled
    }));
  }, [checkBrowserSupport]);

  // Handle install prompt
  const handleInstallClick = useCallback(async () => {
    if (state.deferredPrompt) {
      try {
        console.log('PWA: Triggering install prompt');
        state.deferredPrompt.prompt();
        const choiceResult = await state.deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          saveUserPreferences({ installAttempts: state.installAttempts + 1 });
        } else {
          // User dismissed the prompt
          saveUserPreferences({ 
            userDismissed: true, 
            installAttempts: state.installAttempts + 1 
          });
        }
        
        setState(prev => ({ ...prev, deferredPrompt: null }));
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('PWA: Error during install:', error);
      }
    }
  }, [state.deferredPrompt, state.installAttempts, saveUserPreferences]);

  // Handle manual install
  const handleManualInstall = useCallback(() => {
    const userAgent = navigator.userAgent;
    let instructions = '';

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      instructions = 'To install Kittyp:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
    } else if (/Android/.test(userAgent)) {
      instructions = 'To install Kittyp:\n\n1. Tap the menu button (three dots)\n2. Tap "Add to Home Screen" or "Install App"\n3. Tap "Add" or "Install" to confirm';
    } else if (/Chrome/.test(userAgent)) {
      instructions = 'To install Kittyp:\n\n1. Look for the install icon in the address bar\n2. Or use the menu (three dots) → "Install Kittyp"\n3. Click "Install" to confirm';
    } else {
      instructions = 'To install Kittyp:\n\nPlease use your browser\'s menu to install this app.\nLook for "Install" or "Add to Home Screen" option.';
    }

    alert(instructions);
    saveUserPreferences({ installAttempts: state.installAttempts + 1 });
  }, [state.installAttempts, saveUserPreferences]);

  // Handle dismiss
  const handleDismiss = useCallback((type: 'install' | 'manual') => {
    if (type === 'install') {
      setShowInstallPrompt(false);
    } else {
      setShowManualInstall(false);
    }
    
    // Don't show again for this session
    saveUserPreferences({ userDismissed: true });
  }, [saveUserPreferences]);

  // Handle permanent dismiss
  const handlePermanentDismiss = useCallback(() => {
    saveUserPreferences({ userDismissed: true });
    setShowInstallPrompt(false);
    setShowManualInstall(false);
  }, [saveUserPreferences]);

  // Service Worker update logic
  useEffect(() => {
    // Only run in production
    if (import.meta.env.MODE !== 'production') return;
    // Register service worker and listen for updates
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        // Optionally notify user offline is ready
      },
      onRegisteredSW(swScriptUrl, registration) {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      }
    });
    return () => {
      // No cleanup needed for registerSW
    };
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    } else {
      // fallback: reload
      window.location.reload();
    }
  }, [waitingWorker]);

  useEffect(() => {
    loadUserPreferences();
    checkPWAStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('PWA: beforeinstallprompt event fired');
      
      // Only show if user hasn't permanently dismissed and app isn't installed
      if (!state.userDismissed && !isAppInstalled()) {
        setState(prev => ({ 
          ...prev, 
          deferredPrompt: e as BeforeInstallPromptEvent,
          canInstall: true 
        }));
        setShowInstallPrompt(true);
        installPromptShownRef.current = true;
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setState(prev => ({ 
        ...prev, 
        isInstalled: true,
        deferredPrompt: null 
      }));
      setShowInstallPrompt(false);
      setShowManualInstall(false);
    };

    // Listen for online/offline status
    const handleOnline = () => {
      console.log('PWA: Back online');
      setState(prev => ({ ...prev, isOnline: true }));
      setShowOfflineAlert(false);
    };
    
    const handleOffline = () => {
      console.log('PWA: Went offline');
      setState(prev => ({ ...prev, isOnline: false }));
      setShowOfflineAlert(true);
    };

    // Listen for manual trigger event
    const handleManualTrigger = () => {
      const { supportsInstall, supportsManualInstall } = checkBrowserSupport();
      
      if (!isAppInstalled() && 
          !installPromptShownRef.current && 
          !state.userDismissed &&
          supportsManualInstall && 
          !supportsInstall) {
        setShowManualInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('manual-pwa-trigger', handleManualTrigger);

    // Show manual install if no prompt after delay
    const timer = setTimeout(() => {
      const { supportsInstall, supportsManualInstall } = checkBrowserSupport();
      
      if (!installPromptShownRef.current && 
          !isAppInstalled() && 
          state.hasManifest && 
          !state.userDismissed &&
          supportsManualInstall && 
          !supportsInstall) {
        console.log('PWA: No install prompt detected, showing manual install');
        setShowManualInstall(true);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('manual-pwa-trigger', handleManualTrigger);
    };
  }, [loadUserPreferences, checkPWAStatus, checkBrowserSupport, state.userDismissed, isAppInstalled]);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't show anything if already installed or user permanently dismissed
  if (isAppInstalled() || state.userDismissed) return null;

  return (
    <>
      {/* Update Available Banner */}
      {updateAvailable && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">Update Available</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUpdateAvailable(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-muted-foreground">
              A new version of Kittyp is available. Reload to update!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={handleUpdate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Reload & Update
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Install Prompt */}
      {showInstallPrompt && !isAppInstalled() && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">Install Kittyp</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss('install')}
                  className="text-muted-foreground hover:text-foreground"
                  title="Don't show again"
                >
                  <BellOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-muted-foreground">
              Install our app for a better experience with offline access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={handleInstallClick} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Manual Install Prompt */}
      {showManualInstall && !isAppInstalled() && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/30 bg-primary/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-primary">Install Kittyp</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss('manual')}
                  className="text-muted-foreground hover:text-foreground"
                  title="Don't show again"
                >
                  <BellOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManualInstall(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="text-muted-foreground">
              Install our app for offline access and better experience
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={handleManualInstall} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Install Instructions
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Offline Alert */}
      {showOfflineAlert && (
        <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg border-destructive/30 bg-destructive/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive">You're Offline</CardTitle>
            <CardDescription className="text-muted-foreground">
              Some features may be limited. Check your connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="w-full border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
} 