import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, RefreshCw, Info, Smartphone } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [hasManifest, setHasManifest] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const installPromptShownRef = useRef(false);
  const { colorScheme, resolvedMode } = useTheme();

  useEffect(() => {
    // Check if app is already installed
    const isCurrentlyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isCurrentlyInstalled);

    // Check for manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    setHasManifest(!!manifestLink);

    // Check for service worker
    setHasServiceWorker('serviceWorker' in navigator);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('PWA: beforeinstallprompt event fired');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      installPromptShownRef.current = true;
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => {
      console.log('PWA: Back online');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('PWA: Went offline');
      setIsOnline(false);
    };

    // Listen for manual trigger event
    const handleManualTrigger = () => {
      console.log('PWA: Manual trigger received');
      if (!isCurrentlyInstalled && !installPromptShownRef.current) {
        setShowManualInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('manual-pwa-trigger', handleManualTrigger);

    // If no beforeinstallprompt after 3s, show manual instructions
    const timer = setTimeout(() => {
      if (!installPromptShownRef.current && !isCurrentlyInstalled && hasManifest) {
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
  }, [hasManifest]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        console.log('PWA: Triggering install prompt');
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        console.log('PWA: User choice:', choiceResult.outcome);
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('PWA: Error during install:', error);
      }
    }
  };

  const handleManualInstall = () => {
    const userAgent = navigator.userAgent;
    let instructions = '';

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      instructions = 'To install: Tap the Share button (square with arrow) and select "Add to Home Screen"';
    } else if (/Android/.test(userAgent)) {
      instructions = 'To install: Tap the menu button (three dots) and select "Add to Home Screen" or "Install App"';
    } else if (/Chrome/.test(userAgent)) {
      instructions = 'To install: Click the install icon in the address bar or use the menu (three dots) → "Install Kittyp"';
    } else {
      instructions = 'Please use your browser\'s menu to install this app. Look for "Install" or "Add to Home Screen" option.';
    }

    alert(instructions);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't show anything if already installed
  if (isInstalled) return null;

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground">Install Kittyp</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallPrompt(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
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
      {showManualInstall && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/30 bg-primary/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-primary">Install Kittyp</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualInstall(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
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

      {/* Offline Indicator */}
      {!isOnline && (
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