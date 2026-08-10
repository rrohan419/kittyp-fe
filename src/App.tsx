import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useNavigation, useNavigate, useLocation } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { GlobalBreadcrumbs } from "./components/layout/GlobalBreadcrumbs";

import "@/styles/global.css";
import { Navbar } from "./components/layout/Navbar";
import { ThemeProvider } from './components/providers/ThemeProvider';
import { cn } from "./lib/utils";
import { ScrollToTop } from "./utils/ScrollToTop";
import { AuthInitializer } from "./components/auth/AuthInitializer";
import { CartInitializer } from "./components/cart/CartInitializer";
import { PWAInstaller } from "./components/PWAInstaller";
import { FCMInitializer } from "./components/notifications/FCMInitializer";
import { isEcommerceEnabled } from "./config/features";

/** Role portals render their own shell — hide the public marketing chrome. */
function isPortalRoute(pathname: string): boolean {
  return (
    pathname === '/doctor' ||
    pathname.startsWith('/doctor/') ||
    pathname === '/clinic' ||
    pathname.startsWith('/clinic/') ||
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  );
}

function WithOptionalCart({ children }: { children: ReactNode }) {
  if (!isEcommerceEnabled()) {
    return <>{children}</>;
  }
  return <CartInitializer>{children}</CartInitializer>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = navigation.state === "loading";
  const inPortal = isPortalRoute(location.pathname);

  // Dev: drop any previously registered SW so multi-tab auth isn't stuck on
  // an old precached bundle that wrote a shared localStorage token.
  useEffect(() => {
    if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        void reg.unregister();
      });
    });
    if ('caches' in window) {
      void caches.keys().then((keys) => {
        keys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }
  }, []);

  // Listen for navigation messages from service worker (push notifications)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NAVIGATE') {
          const path = event.data.path || '/';
          navigate(path);
        }
      };

      // Listen for messages from service worker controller
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        controller.addEventListener('message', handleMessage);
      }

      // Also listen for when service worker becomes ready
      navigator.serviceWorker.ready.then(() => {
        const newController = navigator.serviceWorker.controller;
        if (newController) {
          newController.addEventListener('message', handleMessage);
        }
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        const newController = navigator.serviceWorker.controller;
        if (newController) {
          newController.addEventListener('message', handleMessage);
        }
      });

      return () => {
        if (controller) {
          controller.removeEventListener('message', handleMessage);
        }
      };
    }
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthInitializer>
            <WithOptionalCart>
              <div className={cn(
                "min-h-screen bg-background transition-opacity duration-200",
                isLoading && "opacity-75"
              )}>
                {!inPortal && (
                  <div className="fixed top-0 left-0 right-0 z-50">
                    <Navbar />
                  </div>
                )}
                <main className={cn(!inPortal && "pt-16")}>
                  {!inPortal && (
                    <div className="fixed top-16 z-40">
                      <GlobalBreadcrumbs />
                    </div>
                  )}
                  <div className="relative">
                    <Outlet />
                  </div>
                </main>
                <Toaster />
                <ScrollToTop />
                <PWAInstaller />
                <FCMInitializer />
              </div>
            </WithOptionalCart>
          </AuthInitializer>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;