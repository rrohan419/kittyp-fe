import { createBrowserRouter, Navigate } from 'react-router-dom';
import { isEcommerceEnabled } from '@/config/features';
import Index from "@/pages/Index";
import Products from "@/pages/Products";
import HowToUse from "@/pages/HowToUse";
import Articles from "@/pages/Articles";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import SelectRole from "@/pages/SelectRole";
import Signup from "@/pages/Signup";
import Profile from "@/pages/Profile";
import ProductDetail from "@/pages/ProductDetail";
import { AdminLayout } from '@/pages/admin/AdminLayout';
import AdminHome from '@/pages/admin/AdminHome';
import AdminDoctors from '@/pages/admin/AdminDoctors';
import AdminOrganizations from '@/pages/admin/AdminOrganizations';
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import MyOrders from "@/pages/MyOrders";
import OrderDetail from "@/pages/OrderDetail";
import About from "@/pages/About";
import ArticleDetail from "@/pages/ArticleDetail";
import AdminArticleEditor from "@/pages/AdminArticleEditor";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Sitemap from "@/pages/Sitemap";
import SitemapXml from "@/pages/SitemapXml";
import WhyEcoLitter from "@/pages/WhyEcoLitter";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetCode from "@/pages/VerifyResetCode";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import ComingSoon from "@/components/portal/ComingSoon";
import App from './App';
import { PageTransition } from './components/layout/PageTransition';
import AdminArticles from './pages/AdminArticles';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminUsers from './pages/AdminUsers';
import AIAssistant from './pages/AIAssistant';
import { VetConsultation } from './pages/VetConsultation';
import { VetDashboardPage } from './pages/VetDashboardPage';
import ParentAppointmentsPage from './pages/parent/ParentAppointmentsPage';
import { PetManagementPage } from './pages/PetManagementPage';
import PetDetail from './pages/PetDetails';
import DoctorSignup from './pages/DoctorSignup';
import ClinicSignup from './pages/ClinicSignup';
import ClinicInviteAccept from './pages/ClinicInviteAccept';

// Doctor Portal
import { DoctorLayout } from './components/doctor/DoctorLayout';
import DoctorHome from './pages/DoctorHome';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorAvailability from './pages/DoctorAvailability';
import DoctorPatients from './pages/DoctorPatients';
import DoctorCreateClinic from './pages/DoctorCreateClinic';
import DoctorMessages from './pages/DoctorMessages';
import DoctorAnalytics from './pages/DoctorAnalytics';
import DoctorSettings from './pages/DoctorSettings';

// Clinic Portal
import { ClinicLayout } from './pages/clinic/ClinicLayout';
import ClinicHome from './pages/clinic/ClinicHome';
import ClinicDoctors from './pages/clinic/ClinicDoctors';
import ClinicDoctorDetail from './pages/clinic/ClinicDoctorDetail';
import ClinicAppointments from './pages/clinic/ClinicAppointments';
import ClinicPatients from './pages/clinic/ClinicPatients';
import ClinicPatientDashboard from './pages/clinic/ClinicPatientDashboard';
import ClinicOwnerProfile from './pages/clinic/ClinicOwnerProfile';
import ClinicCreateClinic from './pages/clinic/ClinicCreateClinic';
import ClinicInventory from './pages/clinic/ClinicInventory';
import ClinicStaff from './pages/clinic/ClinicStaff';
import ClinicReports from './pages/clinic/ClinicReports';
import ClinicSettings from './pages/clinic/ClinicSettings';

// Parent Portal
import { ParentLayout } from './pages/parent/ParentLayout';
import ParentHome from './pages/parent/ParentHome';
import PetDashboardPage from './pages/parent/PetDashboardPage';
import { RoleGuard } from './components/auth/RoleGuard';
import { ROLES } from './utils/roles';
import DoctorBlog from './pages/DoctorBlog';
import DoctorArticleEditor from './pages/DoctorArticleEditor';
import DoctorInvoices from './pages/DoctorInvoices';
import DoctorNutrition from './pages/DoctorNutrition';
import ParentHealthPage from './pages/parent/ParentHealthPage';
import PetParentNutritionTracker from './components/nutrition/PetParentNutritionTracker';

const ecommerceElement = (element: React.ReactNode) =>
  isEcommerceEnabled() ? element : <Navigate to="/" replace />;

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
          element: ecommerceElement(<PageTransition><Products /></PageTransition>),
        },
        {
          path: "product/:uuid",
          element: ecommerceElement(<PageTransition><ProductDetail /></PageTransition>),
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
          path: "articles/:slug",
          element: <PageTransition><ArticleDetail /></PageTransition>,
        },
        {
          path: "articles/id/:id",
          element: <PageTransition><ArticleDetail /></PageTransition>,
        },
        {
          path: "pet/:uuid",
          element: <PageTransition><PetDetail /></PageTransition>,
        },
        {
          path: "pet/:petId",
          element: <PageTransition><PetDetail /></PageTransition>,
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
          path: "select-role",
          element: <PageTransition><SelectRole /></PageTransition>,
        },
        {
          path: "signup",
          element: <Navigate to="/signup/parent" replace />,
        },
        {
          path: "signup/parent",
          element: <PageTransition><Signup /></PageTransition>,
        },
        {
          path: "signup/doctor",
          element: <PageTransition><DoctorSignup /></PageTransition>,
        },
        {
          path: "signup/clinic-admin",
          element: <PageTransition><ClinicSignup /></PageTransition>,
        },
        {
          path: "profile",
          element: <PageTransition><Profile /></PageTransition>,
        },
        {
          path: "cart",
          element: ecommerceElement(<PageTransition><Cart /></PageTransition>),
        },
        {
          path: "checkout",
          element: ecommerceElement(<PageTransition><Checkout /></PageTransition>),
        },
        {
          path: "ai-assistant",
          element: <PageTransition><AIAssistant /></PageTransition>,
        },
        {
          path: "doctor-signup",
          element: <Navigate to="/signup/doctor" replace />,
        },
        {
          path: "clinic-signup",
          element: <Navigate to="/signup/clinic-admin" replace />,
        },
        {
          path: "clinic-invite/accept",
          element: <PageTransition><ClinicInviteAccept /></PageTransition>,
        },
        {
          path: "orders",
          element: ecommerceElement(<PageTransition><MyOrders /></PageTransition>),
        },
        {
          path: "orders/:orderId",
          element: ecommerceElement(<PageTransition><OrderDetail /></PageTransition>),
        },
        {
          path: "about",
          element: <PageTransition><About /></PageTransition>,
        },
        {
          path: "why-eco-litter",
          element: ecommerceElement(<PageTransition><WhyEcoLitter /></PageTransition>),
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
          path: "sitemap.xml",
          element: <SitemapXml />,
        },
        {
          path: "robots.txt",
          element: <div>User-agent: *<br/>Allow: /<br/>Sitemap: https://www.kittyp.in/sitemap.xml</div>,
        },
        {
          path: "app",
          element: (
            <RoleGuard allowed={ROLES.USER}>
              <PageTransition><ParentLayout /></PageTransition>
            </RoleGuard>
          ),
          children: [
            {
              index: true,
              element: <PageTransition><ParentHome /></PageTransition>,
            },
            {
              path: "pets",
              element: <PageTransition><PetManagementPage /></PageTransition>,
            },
            {
              path: "pets/:petId",
              element: <PageTransition><PetDashboardPage /></PageTransition>,
            },
            {
              path: "nutrition",
              element: <PageTransition><PetParentNutritionTracker /></PageTransition>,
            },
            {
              path: "health",
              element: <PageTransition><ParentHealthPage /></PageTransition>,
            },
            {
              path: "appointments",
              element: <PageTransition><ParentAppointmentsPage /></PageTransition>,
            },
            {
              path: "orders",
              element: ecommerceElement(<PageTransition><MyOrders /></PageTransition>),
            },
            {
              path: "cart",
              element: ecommerceElement(<PageTransition><Cart /></PageTransition>),
            },
            {
              path: "checkout",
              element: ecommerceElement(<PageTransition><Checkout /></PageTransition>),
            },
            {
              path: "articles",
              element: <PageTransition><Articles /></PageTransition>,
            },
            {
              path: "profile",
              element: <PageTransition><Profile /></PageTransition>,
            },
          ],
        },
        {
          path: "doctor",
          element: (
            <RoleGuard allowed={ROLES.DOCTOR}>
              <PageTransition><DoctorLayout /></PageTransition>
            </RoleGuard>
          ),
          children: [
            {
              index: true,
              element: <PageTransition><DoctorHome /></PageTransition>,
            },
            {
              path: "appointments",
              element: <PageTransition><DoctorAppointments /></PageTransition>,
            },
            {
              path: "availability",
              element: <PageTransition><DoctorAvailability /></PageTransition>,
            },
            {
              path: "patients",
              element: <PageTransition><DoctorPatients /></PageTransition>,
            },
            {
              path: "clinics/new",
              element: <PageTransition><DoctorCreateClinic /></PageTransition>,
            },
            {
              path: "nutrition",
              element: <PageTransition><DoctorNutrition /></PageTransition>,
            },
            {
              path: "blog",
              element: <PageTransition><DoctorBlog /></PageTransition>,
            },
            {
              path: "blog/new",
              element: <PageTransition><DoctorArticleEditor /></PageTransition>,
            },
            {
              path: "blog/edit/:slug",
              element: <PageTransition><DoctorArticleEditor /></PageTransition>,
            },
            {
              path: "invoices",
              element: <PageTransition><DoctorInvoices /></PageTransition>,
            },
            {
              path: "messages",
              element: <PageTransition><DoctorMessages /></PageTransition>,
            },
            {
              path: "analytics",
              element: <PageTransition><DoctorAnalytics /></PageTransition>,
            },
            {
              path: "settings",
              element: <PageTransition><DoctorSettings /></PageTransition>,
            },
          ],
        },
        {
          path: "clinic",
          element: (
            <RoleGuard allowed={[ROLES.CLINIC_ADMIN, ROLES.CLINIC_STAFF, ROLES.DOCTOR]}>
              <PageTransition><ClinicLayout /></PageTransition>
            </RoleGuard>
          ),
          children: [
            {
              index: true,
              element: <PageTransition><ClinicHome /></PageTransition>,
            },
            {
              path: "doctors",
              element: <PageTransition><ClinicDoctors /></PageTransition>,
            },
            {
              path: "doctors/:doctorUuid",
              element: <PageTransition><ClinicDoctorDetail /></PageTransition>,
            },
            {
              path: "appointments",
              element: <PageTransition><ClinicAppointments /></PageTransition>,
            },
            {
              path: "patients",
              element: <PageTransition><ClinicPatients /></PageTransition>,
            },
            {
              path: "patients/:petUuid",
              element: <PageTransition><ClinicPatientDashboard /></PageTransition>,
            },
            {
              path: "pets/:petUuid",
              element: <PageTransition><ClinicPatientDashboard /></PageTransition>,
            },
            {
              path: "owners/:ownerUuid",
              element: <PageTransition><ClinicOwnerProfile /></PageTransition>,
            },
            {
              path: "clinics/new",
              element: <PageTransition><ClinicCreateClinic /></PageTransition>,
            },
            {
              path: "inventory",
              element: <Navigate to="/clinic" replace />,
            },
            {
              path: "staff",
              element: <PageTransition><ClinicStaff /></PageTransition>,
            },
            {
              path: "reports",
              element: <PageTransition><ClinicReports /></PageTransition>,
            },
            {
              path: "settings",
              element: <PageTransition><ClinicSettings /></PageTransition>,
            },
          ],
        },
        {
          path: "admin",
          element: (
            <RoleGuard allowed={[ROLES.ADMIN, ROLES.MODERATOR]}>
              <PageTransition><AdminLayout /></PageTransition>
            </RoleGuard>
          ),
          children: [
            {
              index: true,
              element: <PageTransition><AdminHome /></PageTransition>,
            },
            {
              path: "doctors",
              element: <PageTransition><AdminDoctors /></PageTransition>,
            },
            {
              path: "organizations",
              element: <PageTransition><AdminOrganizations /></PageTransition>,
            },
            {
              path: "orders",
              element: ecommerceElement(<PageTransition><AdminOrders /></PageTransition>),
            },
            {
              path: "products",
              element: ecommerceElement(<PageTransition><AdminProducts /></PageTransition>),
            },
            {
              path: "users",
              element: <PageTransition><AdminUsers /></PageTransition>,
            },
            {
              path: "articles",
              element: <PageTransition><AdminArticles /></PageTransition>,
            },
            {
              path: "articles/new",
              element: <PageTransition><AdminArticleEditor /></PageTransition>,
            },
            {
              path: "articles/edit/:slug",
              element: <PageTransition><AdminArticleEditor /></PageTransition>,
            },
            {
              path: "settings",
              element: <PageTransition><ComingSoon title="Admin Settings" backTo="/admin" /></PageTransition>,
            },
          ]
        },
        
        {
          path: "forgot-password",
          element: <PageTransition><ForgotPassword /></PageTransition>
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
  ]
); 