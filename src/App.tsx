
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import HowToUse from "./pages/HowToUse";
import Blogs from "./pages/Blogs";
import WhyEcoLitter from "./pages/WhyEcoLitter";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Sitemap from "./pages/Sitemap";
import { ScrollToTop } from "./utils/ScrollToTop";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import AdminArticleEditor from "./pages/AdminArticleEditor";
import ProductDetail from "./pages/ProductDetail";
import { FavoritesProvider } from "./context/FavoritesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
    <FavoritesProvider>
      <CartProvider>
        <Toaster  />
        <Sonner position="bottom-left"
                toastOptions={{
                  style: {
                    background: '#9D57FF',
                    color: '#ffffff',
                    border: '1px solid #e5e7eb',
                  },
                }}/>
        <BrowserRouter>
        <ScrollToTop />
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
            {/* <Route path="/articles/:id" element={<ArticleDetail />} /> */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/article/:slug" element={<ArticleDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/articles/new" element={<AdminArticleEditor />} />
            <Route path="/admin/articles/edit/:id" element={<AdminArticleEditor />} />
            {/* <Route path="/articles" element={<ArticlesLayout />}>
    <Route index element={<Articles />} />
    <Route path=":slug" element={<ArticleDetail />} />
  </Route> */}
            
            // {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
      </FavoritesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
