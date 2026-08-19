import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, RefreshCw, Smartphone, ArrowUpCircle } from 'lucide-react';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import {
  getA2hsInstructions,
  getDeferredPrompt,
  isAppInstalled,
  isIosDevice,
  markPromptShown,
  promptInstall,
  shouldShowPrompt,
  startListening,
  subscribe,
} from '@/services/a2hsService';

export function PWAInstaller() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [installed, setInstalled] = useState(() => isAppInstalled());
  const promptShownRef = useRef(false);
  const showingManualRef = useRef(false);

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const revealPrompt = useCallback((kind: 'install' | 'manual') => {
    if (isAppInstalled()) return;

    if (kind === 'install' && showingManualRef.current) {
      showingManualRef.current = false;
      setShowManualInstall(false);
      setShowInstallPrompt(true);
      return;
    }

    if (promptShownRef.current) return;
    if (!shouldShowPrompt()) return;

    promptShownRef.current = true;
    markPromptShown();
    if (kind === 'install') {
      setShowInstallPrompt(true);
    } else {
      showingManualRef.current = true;
      setShowManualInstall(true);
    }
  }, []);

  useEffect(() => {
    startListening();
    setInstalled(isAppInstalled());

    const unsubscribe = subscribe(() => {
      setInstalled(isAppInstalled());
      if (getDeferredPrompt()) {
        revealPrompt('install');
      }
    });

    if (getDeferredPrompt()) {
      revealPrompt('install');
    } else if (isIosDevice()) {
      revealPrompt('manual');
    }

    const timer = window.setTimeout(() => {
      if (!getDeferredPrompt() && !promptShownRef.current) {
        revealPrompt('manual');
      }
    }, 3000);

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [revealPrompt]);

  useEffect(() => {
    if (import.meta.env.MODE !== 'production') return;
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {},
      onRegisteredSW(_swScriptUrl: string, registration?: ServiceWorkerRegistration) {
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
      },
    });
    return () => {
      void updateSW;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowInstallPrompt(false);
      return;
    }
    if (outcome === 'unavailable') {
      setShowInstallPrompt(false);
      setShowManualInstall(true);
      return;
    }
    setShowInstallPrompt(false);
  }, []);

  const handleManualInstall = useCallback(() => {
    const nav = navigator as Navigator & { platform?: string };
    alert(getA2hsInstructions(nav.userAgent, nav.platform, nav.maxTouchPoints));
  }, []);

  const handleDismiss = useCallback((type: 'install' | 'manual') => {
    if (type === 'install') {
      setShowInstallPrompt(false);
    } else {
      showingManualRef.current = false;
      setShowManualInstall(false);
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const hideInstallUi = installed || isAppInstalled();

  return (
    <>
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
      {showInstallPrompt && !hideInstallUi && (
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
                  title="Hide for today"
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
      {showManualInstall && !showInstallPrompt && !hideInstallUi && (
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
                  title="Hide for today"
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
      {showOfflineAlert && !isOnline && (
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
