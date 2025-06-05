
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

import "@/styles/global.css";
import { Navbar } from "./components/layout/Navbar";
import { AnimatedRoutes } from "./components/layout/AnimatedRoutes";
import { ThemeProvider } from './components/providers/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <FavoritesProvider>
            <CartProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <div className="fixed top-0 left-0 right-0 z-50">
                    <Navbar />
                  </div>
                  <div className="pt-16">
                    <AnimatedRoutes />
                  </div>
                  <Toaster />
                </div>
              </Router>
            </CartProvider>
          </FavoritesProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;