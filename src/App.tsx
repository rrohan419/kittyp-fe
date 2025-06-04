import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "./utils/ScrollToTop";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Loading from "@/components/ui/loading";
import Checkout from './pages/Checkout';
import Products from './pages/Products';
import { OrderProvider } from './context/OrderContext';
import UserProfile from './pages/UserProfile';
import Profile from './pages/Profile';
import Index from './pages/Index';
import About from './pages/About';
import AdminArticleEditor from './pages/AdminArticleEditor';
import AdminDashboard from './pages/AdminDashboard';
import ArticleDetail from './pages/ArticleDetail';
import Articles from './pages/Articles';
import Blogs from './pages/Blogs';
import Cart from './pages/Cart';
import HowToUse from './pages/HowToUse';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProductDetail from './pages/ProductDetail';
import Signup from './pages/Signup';
import Sitemap from './pages/Sitemap';
import TermsOfService from './pages/TermsOfService';
import WhyEcoLitter from './pages/WhyEcoLitter';
import Contact from './pages/Contact';
import { AdminProvider } from './context/AdminContext';
import { Provider } from 'react-redux';
import { persistor, store } from './module/store';
import { PersistGate } from 'redux-persist/integration/react';
import ForgotPassword from './pages/ForgotPassword';
import VerifyResetCode from './pages/VerifyResetCode';
import ResetPassword from './pages/ResetPassword';
import { CartInitializer } from './components/cart/CartInitializer';
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
                <div className="relative min-h-screen bg-background overflow-hidden">
                  <div className="fixed top-0 left-0 right-0 z-50">
                    <Navbar />
                  </div>
                  <div className="relative min-h-screen">
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