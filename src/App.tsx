import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useNavigation } from "react-router-dom";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthInitializer>
            <CartInitializer>
              <div className={cn(
                "min-h-screen bg-background transition-opacity duration-200",
                isLoading && "opacity-75"
              )}>
                <div className="fixed top-0 left-0 right-0 z-50">
                  <Navbar />
                </div>
                <main className="pt-16">
                  <div className="fixed top-16 z-40">
                    <GlobalBreadcrumbs />
                  </div>
                  <div className="relative">
                    <Outlet />
                  </div>
                </main>
                <Toaster />
                <ScrollToTop />
                <PWAInstaller />
                <FCMInitializer />
              </div>
            </CartInitializer>
          </AuthInitializer>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;