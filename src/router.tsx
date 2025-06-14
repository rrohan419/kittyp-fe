import { createBrowserRouter } from 'react-router-dom';
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
import App from './App';
import { PageTransition } from './components/layout/PageTransition';

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          element: <PageTransition><Index /></PageTransition>,
        },
        {
          path: "products",
          element: <PageTransition><Products /></PageTransition>,
        },
        {
          path: "product/:uuid",
          element: <PageTransition><ProductDetail /></PageTransition>,
        },
        {
          path: "how-to-use",
          element: <PageTransition><HowToUse /></PageTransition>,
        },
        {
          path: "articles",
          element: <PageTransition><Articles /></PageTransition>,
        },
        {
          path: "article/:slug",
          element: <PageTransition><ArticleDetail /></PageTransition>,
        },
        {
          path: "contact",
          element: <PageTransition><Contact /></PageTransition>,
        },
        {
          path: "login",
          element: <PageTransition><Login /></PageTransition>,
        },
        {
          path: "signup",
          element: <PageTransition><Signup /></PageTransition>,
        },
        {
          path: "profile",
          element: <PageTransition><Profile /></PageTransition>,
        },
        {
          path: "cart",
          element: <PageTransition><Cart /></PageTransition>,
        },
        {
          path: "checkout",
          element: <PageTransition><Checkout /></PageTransition>,
        },
        {
          path: "orders",
          element: <PageTransition><MyOrders /></PageTransition>,
        },
        {
          path: "orders/:orderId",
          element: <PageTransition><OrderDetail /></PageTransition>,
        },
        {
          path: "about",
          element: <PageTransition><About /></PageTransition>,
        },
        {
          path: "blogs",
          element: <PageTransition><Blogs /></PageTransition>,
        },
        {
          path: "why-eco-litter",
          element: <PageTransition><WhyEcoLitter /></PageTransition>,
        },
        {
          path: "privacy",
          element: <PageTransition><PrivacyPolicy /></PageTransition>,
        },
        {
          path: "terms",
          element: <PageTransition><TermsOfService /></PageTransition>,
        },
        {
          path: "sitemap",
          element: <PageTransition><Sitemap /></PageTransition>,
        },
        {
          path: "admin/*",
          element: <PageTransition><AdminDashboard /></PageTransition>,
        },
        {
          path: "admin/articles/new",
          element: <PageTransition><AdminArticleEditor /></PageTransition>,
        },
        {
          path: "admin/articles/edit/:id",
          element: <PageTransition><AdminArticleEditor /></PageTransition>,
        },
        {
          path: "forgot-password",
          element: <PageTransition><ForgotPassword /></PageTransition>,
        },
        {
          path: "verify-reset-code",
          element: <PageTransition><VerifyResetCode /></PageTransition>,
        },
        {
          path: "reset-password",
          element: <PageTransition><ResetPassword /></PageTransition>,
        },
        {
          path: "*",
          element: <PageTransition><NotFound /></PageTransition>,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
); 