import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    }
  }
});

const AppContent = () => (
  <TooltipProvider>
    <OrderProvider>
      <AdminProvider>
        <FavoritesProvider>
          <CartProvider>
            <Toaster />
            <Sonner 
              position="bottom-left"
              toastOptions={{
                style: {
                  background: '#9D57FF',
                  color: '#ffffff',
                  border: '1px solid #e5e7eb',
                },
              }} 
            />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:uuid" element={<ProductDetail />} />
                  <Route path="/how-to-use" element={<HowToUse />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/why-eco-litter" element={<WhyEcoLitter />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/sitemap" element={<Sitemap />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/article/:slug" element={<ArticleDetail />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/articles/new" element={<AdminArticleEditor />} />
                  <Route path="/admin/articles/edit/:id" element={<AdminArticleEditor />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/:orderId" element={<OrderDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-reset-code" element={<VerifyResetCode />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </AdminProvider>
    </OrderProvider>
  </TooltipProvider>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <CartInitializer>
            <AppContent />
          </CartInitializer>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;