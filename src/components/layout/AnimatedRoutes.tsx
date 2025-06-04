import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import Index from "@/pages/Index";
import Products from "@/pages/Products";
import HowToUse from "@/pages/HowToUse";
import Articles from "@/pages/Articles";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import MyOrders from "@/pages/MyOrders";
import OrderDetail from "@/pages/OrderDetail";
import About from "@/pages/About";
import Blogs from "@/pages/Blogs";
import ArticleDetail from "@/pages/ArticleDetail";
import AdminArticleEditor from "@/pages/AdminArticleEditor";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Sitemap from "@/pages/Sitemap";
import WhyEcoLitter from "@/pages/WhyEcoLitter";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetCode from "@/pages/VerifyResetCode";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition key={location.pathname}>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/products"
          element={
            <PageTransition key={location.pathname}>
              <Products />
            </PageTransition>
          }
        />
        <Route
          path="/product/:uuid"
          element={
            <PageTransition key={location.pathname}>
              <ProductDetail />
            </PageTransition>
          }
        />
        <Route
          path="/how-to-use"
          element={
            <PageTransition key={location.pathname}>
              <HowToUse />
            </PageTransition>
          }
        />
        <Route
          path="/articles"
          element={
            <PageTransition key={location.pathname}>
              <Articles />
            </PageTransition>
          }
        />
        <Route
          path="/article/:slug"
          element={
            <PageTransition key={location.pathname}>
              <ArticleDetail />
            </PageTransition>
          }
        />
        <Route
          path="/contact"
          element={
            <PageTransition key={location.pathname}>
              <Contact />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition key={location.pathname}>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransition key={location.pathname}>
              <Signup />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition key={location.pathname}>
              <Profile />
            </PageTransition>
          }
        />
        <Route
          path="/cart"
          element={
            <PageTransition key={location.pathname}>
              <Cart />
            </PageTransition>
          }
        />
        <Route
          path="/checkout"
          element={
            <PageTransition key={location.pathname}>
              <Checkout />
            </PageTransition>
          }
        />
        <Route
          path="/orders"
          element={
            <PageTransition key={location.pathname}>
              <MyOrders />
            </PageTransition>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <PageTransition key={location.pathname}>
              <OrderDetail />
            </PageTransition>
          }
        />
        <Route
          path="/about"
          element={
            <PageTransition key={location.pathname}>
              <About />
            </PageTransition>
          }
        />
        <Route
          path="/blogs"
          element={
            <PageTransition key={location.pathname}>
              <Blogs />
            </PageTransition>
          }
        />
        <Route
          path="/why-eco-litter"
          element={
            <PageTransition key={location.pathname}>
              <WhyEcoLitter />
            </PageTransition>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition key={location.pathname}>
              <PrivacyPolicy />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition key={location.pathname}>
              <TermsOfService />
            </PageTransition>
          }
        />
        <Route
          path="/sitemap"
          element={
            <PageTransition key={location.pathname}>
              <Sitemap />
            </PageTransition>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PageTransition key={location.pathname}>
              <AdminDashboard />
            </PageTransition>
          }
        />
        <Route
          path="/admin/articles/new"
          element={
            <PageTransition key={location.pathname}>
              <AdminArticleEditor />
            </PageTransition>
          }
        />
        <Route
          path="/admin/articles/edit/:id"
          element={
            <PageTransition key={location.pathname}>
              <AdminArticleEditor />
            </PageTransition>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransition key={location.pathname}>
              <ForgotPassword />
            </PageTransition>
          }
        />
        <Route
          path="/verify-reset-code"
          element={
            <PageTransition key={location.pathname}>
              <VerifyResetCode />
            </PageTransition>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageTransition key={location.pathname}>
              <ResetPassword />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition key={location.pathname}>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
} 