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
          path="/admin/*"
          element={
            <PageTransition key={location.pathname}>
              <AdminDashboard />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
} 