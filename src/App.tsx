
// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { CartProvider } from "@/context/CartContext";
// import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";
// import Products from "./pages/Products";
// import HowToUse from "./pages/HowToUse";
// import Blogs from "./pages/Blogs";
// import WhyEcoLitter from "./pages/WhyEcoLitter";
// import About from "./pages/About";
// import PrivacyPolicy from "./pages/PrivacyPolicy";
// import TermsOfService from "./pages/TermsOfService";
// import Sitemap from "./pages/Sitemap";
// import { ScrollToTop } from "./utils/ScrollToTop";
// import Contact from "./pages/Contact";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Articles from "./pages/Articles";
// import ArticleDetail from "./pages/ArticleDetail";
// import Cart from "./pages/Cart";
// import AdminDashboard from "./pages/AdminDashboard";
// import AdminArticleEditor from "./pages/AdminArticleEditor";
// import ProductDetail from "./pages/ProductDetail";
// import { FavoritesProvider } from "./context/FavoritesContext";
// import MyOrders from "./pages/MyOrders";
// import OrderDetail from "./pages/OrderDetail";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <FavoritesProvider>
//         <CartProvider>
//           <Toaster />
//           <Sonner position="bottom-left"
//             toastOptions={{
//               style: {
//                 background: '#9D57FF',
//                 color: '#ffffff',
//                 border: '1px solid #e5e7eb',
//               },
//             }} />
//           <BrowserRouter>
//             <ScrollToTop />
//             <Routes>
//               <Route path="/" element={<Index />} />
//               <Route path="/products" element={<Products />} />
//               <Route path="/product/:uuid" element={<ProductDetail />} />
//               <Route path="/how-to-use" element={<HowToUse />} />
//               <Route path="/blogs" element={<Blogs />} />
//               <Route path="/why-eco-litter" element={<WhyEcoLitter />} />
//               <Route path="/about" element={<About />} />
//               <Route path="/privacy" element={<PrivacyPolicy />} />
//               <Route path="/terms" element={<TermsOfService />} />
//               <Route path="/sitemap" element={<Sitemap />} />
//               <Route path="/contact" element={<Contact />} />
//               <Route path="/login" element={<Login />} />
//               <Route path="/signup" element={<Signup />} />
//               <Route path="/articles" element={<Articles />} />
//               <Route path="/cart" element={<Cart />} />
//               <Route path="/article/:slug" element={<ArticleDetail />} />
//               <Route path="/admin" element={<AdminDashboard />} />
//               <Route path="/admin/articles/new" element={<AdminArticleEditor />} />
//               <Route path="/admin/articles/edit/:id" element={<AdminArticleEditor />} />
//               <Route path="/orders" element={<MyOrders />} />
//               <Route path="/orders/:orderId" element={<OrderDetail />} />
//               <Route path="/checkout" element={<Checkout />} />

//             // {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </BrowserRouter>
//         </CartProvider>
//       </FavoritesProvider>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;


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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    }
  }
});
// Lazy-load your page components
const Index = lazy(() => import('./pages/Index'));
// const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const HowToUse = lazy(() => import('./pages/HowToUse'));
const Blogs = lazy(() => import('./pages/Blogs'));
const WhyEcoLitter = lazy(() => import('./pages/WhyEcoLitter'));
const About = lazy(() => import('./pages/About'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Sitemap = lazy(() => import('./pages/Sitemap'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Articles = lazy(() => import('./pages/Articles'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminArticleEditor = lazy(() => import('./pages/AdminArticleEditor'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FavoritesProvider>
        <CartProvider>
          <OrderProvider>
          <Toaster />
          <Sonner position="bottom-left"
            toastOptions={{
              style: {
                background: '#9D57FF',
                color: '#ffffff',
                border: '1px solid #e5e7eb',
              },
            }} />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<Loading />}> {/* Wrap your Routes with Suspense */}
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </OrderProvider>
        </CartProvider>
      </FavoritesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;