import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, RefreshCw, Info } from 'lucide-react';

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
  const [showReinstallPrompt, setShowReinstallPrompt] = useState(false);
  const [hasBeenInstalled, setHasBeenInstalled] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const hasBeenInstalledRef = useRef(false);
  const installPromptShownRef = useRef(false);

  useEffect(() => {
    console.log('PWA Installer: Component mounted');
    
    // Check if app is already installed
    const isCurrentlyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    console.log('PWA Installer: Currently installed:', isCurrentlyInstalled);
    setIsInstalled(isCurrentlyInstalled);

    // Check if app was previously installed (localStorage)
    const wasInstalled = localStorage.getItem('kittyp-pwa-installed');
    console.log('PWA Installer: Was previously installed:', wasInstalled);
    if (wasInstalled === 'true') {
      setHasBeenInstalled(true);
      hasBeenInstalledRef.current = true;
    }

    // If currently installed, mark as has been installed
    if (isCurrentlyInstalled) {
      setHasBeenInstalled(true);
      hasBeenInstalledRef.current = true;
    }

    // Check PWA criteria
    const checkPWACriteria = () => {
      console.log('PWA Installer: Checking PWA criteria...');
      console.log('PWA Installer: Service Worker available:', 'serviceWorker' in navigator);
      console.log('PWA Installer: HTTPS:', window.location.protocol === 'https:');
      console.log('PWA Installer: Manifest:', !!document.querySelector('link[rel="manifest"]'));
      console.log('PWA Installer: Display mode:', window.matchMedia('(display-mode: standalone)').matches);
    };
    
    checkPWACriteria();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Installer: beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      installPromptShownRef.current = true;
      
      // Show reinstall prompt if previously installed
      if (hasBeenInstalledRef.current) {
        console.log('PWA Installer: Showing reinstall prompt');
        setShowReinstallPrompt(true);
      } else {
        console.log('PWA Installer: Showing install prompt');
        setShowInstallPrompt(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA Installer: App installed event fired');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowReinstallPrompt(false);
      setShowManualInstall(false);
      setDeferredPrompt(null);
      setHasBeenInstalled(true);
      hasBeenInstalledRef.current = true;
      localStorage.setItem('kittyp-pwa-installed', 'true');
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check for app uninstallation (when display mode changes from standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('PWA Installer: Display mode changed:', e.matches);
      if (!e.matches && hasBeenInstalledRef.current) {
        // App was uninstalled
        console.log('PWA Installer: App was uninstalled, showing reinstall prompt');
        setIsInstalled(false);
        setShowReinstallPrompt(true);
      } else if (e.matches) {
        // App was installed
        console.log('PWA Installer: App was installed');
        setIsInstalled(true);
        setShowReinstallPrompt(false);
        setShowInstallPrompt(false);
        setShowManualInstall(false);
      }
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show manual install option after a delay if no beforeinstallprompt event fires
    // and the app hasn't been installed yet
    const timer = setTimeout(() => {
      console.log('PWA Installer: Timer fired, checking if we should show manual install');
      console.log('PWA Installer: Current state - installed:', isCurrentlyInstalled, 'hasBeenInstalled:', hasBeenInstalledRef.current, 'deferredPrompt:', !!deferredPrompt, 'installPromptShown:', installPromptShownRef.current);
      
      // Only show manual install if:
      // 1. App is not currently installed
      // 2. App was never installed before
      // 3. No deferred prompt available
      // 4. No install prompt was shown by beforeinstallprompt event
      if (!isCurrentlyInstalled && !hasBeenInstalledRef.current && !deferredPrompt && !installPromptShownRef.current) {
        console.log('PWA Installer: Showing manual install prompt');
        setShowManualInstall(true);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remove dependencies to avoid re-running effect

  const handleInstallClick = async () => {
    console.log('PWA Installer: Install button clicked');
    if (!deferredPrompt) {
      console.log('PWA Installer: No deferred prompt available');
      return;
    }

    console.log('PWA Installer: Prompting for installation');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('PWA Installer: User choice outcome:', outcome);
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
    setShowReinstallPrompt(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleManualInstall = () => {
    console.log('PWA Installer: Manual install button clicked');
    // For iOS Safari, show instructions
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      alert('To install: Tap the Share button (square with arrow) and select "Add to Home Screen"');
    } else {
      // For other browsers, try to trigger install
      if (deferredPrompt) {
        handleInstallClick();
      } else {
        alert('Please use your browser\'s menu to install this app. Look for "Install" or "Add to Home Screen" option.');
      }
    }
  };

  // Debug info
  console.log('PWA Installer: Render state -', {
    isInstalled,
    hasBeenInstalled: hasBeenInstalledRef.current,
    deferredPrompt: !!deferredPrompt,
    showInstallPrompt,
    showReinstallPrompt,
    showManualInstall,
    installPromptShown: installPromptShownRef.current
  });

  if (isInstalled) return null;

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Install Kittyp</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Install our app for a better experience with offline access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reinstall Prompt */}
      {showReinstallPrompt && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-purple-800">Reinstall Kittyp</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReinstallPrompt(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-purple-600">
              Get back offline access and app features
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={handleInstallClick} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Reinstall App
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Install Prompt */}
      {showManualInstall && (
        <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-800">Install Kittyp</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualInstall(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-blue-600">
              Install our app for offline access and better experience
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              onClick={handleManualInstall} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Info className="h-4 w-4 mr-2" />
              Install Instructions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-800">You're Offline</CardTitle>
            <CardDescription className="text-orange-600">
              Some features may be limited. Check your connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="w-full border-orange-200 text-orange-700 hover:bg-orange-100"
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