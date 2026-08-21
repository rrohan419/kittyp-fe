import { ROLES } from '@/utils/roles';
import { ECOMMERCE_NAV_PATHS, isEcommerceEnabled } from '@/config/features';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Settings,
  Stethoscope,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  PawPrint,
  Apple,
  Heart,
  ShoppingBag,
  User,
  MoreHorizontal,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getAuthItem } from '@/utils/authStorage';

export type PortalRole = (typeof ROLES)[keyof typeof ROLES];

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
}

export interface PortalConfig {
  name: string;
  subtitle: string;
  basePath: string;
  brandIcon: LucideIcon;
  navItems: NavItem[];
  bottomTabs: NavItem[]; // 4-5 items, last one usually "More"
  user: { name: string; subtitle: string; initials: string };
}

export const portalConfigs: Record<PortalRole, PortalConfig> = {
  ROLE_USER: {
    name: 'kittyp',
    subtitle: 'Pet Parent',
    basePath: '/app',
    brandIcon: PawPrint,
    user: { name: 'Sarah Miller', subtitle: 'Pet Parent', initials: 'SM' },
    navItems: [
      { label: 'Dashboard', path: '/app', icon: LayoutDashboard, end: true },
      { label: 'My Pets', path: '/app/pets', icon: PawPrint },
      { label: 'Nutrition', path: '/app/nutrition', icon: Apple },
      { label: 'Health', path: '/app/health', icon: Heart },
      { label: 'Appointments', path: '/app/appointments', icon: Calendar },
      { label: 'Cart', path: '/app/cart', icon: ShoppingCart },
      { label: 'Orders', path: '/app/orders', icon: ShoppingBag },
      { label: 'Articles', path: '/app/articles', icon: FileText },
      { label: 'Profile', path: '/app/profile', icon: User },
    ],
    bottomTabs: [
      { label: 'Home', path: '/app', icon: LayoutDashboard, end: true },
      { label: 'Pets', path: '/app/pets', icon: PawPrint },
      { label: 'Health', path: '/app/health', icon: Heart },
      { label: 'Nutrition', path: '/app/nutrition', icon: Apple },
      { label: 'More', path: '/app/profile', icon: MoreHorizontal },
    ],
  },
  ROLE_DOCTOR: {
    name: 'kittyp',
    subtitle: 'Doctor Portal',
    basePath: '/doctor',
    brandIcon: Stethoscope,
    user: { name: 'Dr. John Doe', subtitle: 'General Veterinary', initials: 'DR' },
    navItems: [
      { label: 'Dashboard', path: '/doctor', icon: LayoutDashboard, end: true },
      { label: 'Appointments', path: '/doctor/appointments', icon: Calendar, badge: '3' },
      { label: 'Availability', path: '/doctor/availability', icon: Clock },
      { label: 'Patients', path: '/doctor/patients', icon: Users },
      { label: 'Nutrition', path: '/doctor/nutrition', icon: Apple },
      { label: 'Blog', path: '/doctor/blog', icon: FileText },
      { label: 'Invoices', path: '/doctor/invoices', icon: Package },
      { label: 'Settings', path: '/doctor/settings', icon: Settings },
    ],
    bottomTabs: [
      { label: 'Home', path: '/doctor', icon: LayoutDashboard, end: true },
      { label: 'Visits', path: '/doctor/appointments', icon: Calendar },
      { label: 'Patients', path: '/doctor/patients', icon: Users },
      { label: 'Nutrition', path: '/doctor/nutrition', icon: Apple },
      { label: 'More', path: '/doctor/settings', icon: MoreHorizontal },
    ],
  },
  ROLE_CLINIC_ADMIN: {
    name: 'kittyp',
    subtitle: 'Practice Portal',
    basePath: '/clinic',
    brandIcon: Building2,
    user: { name: 'Happy Paws Clinic', subtitle: 'Clinic Admin', initials: 'HP' },
    navItems: [
      { label: 'Dashboard', path: '/clinic', icon: LayoutDashboard, end: true },
      { label: 'Appointments', path: '/clinic/appointments', icon: Calendar },
      { label: 'Clients', path: '/clinic/patients', icon: PawPrint },
      { label: 'Doctors', path: '/clinic/doctors', icon: Stethoscope },
      { label: 'Articles', path: '/clinic/blog', icon: FileText },
      { label: 'Billing', path: '/clinic/invoices', icon: Package },
      { label: 'Settings', path: '/clinic/settings', icon: Settings },
    ],
    bottomTabs: [
      { label: 'Home', path: '/clinic', icon: LayoutDashboard, end: true },
      { label: 'Visits', path: '/clinic/appointments', icon: Calendar },
      { label: 'Clients', path: '/clinic/patients', icon: PawPrint },
      { label: 'Doctors', path: '/clinic/doctors', icon: Stethoscope },
      { label: 'More', path: '/clinic/settings', icon: MoreHorizontal },
    ],
  },
  ROLE_CLINIC_STAFF: {
    name: 'kittyp',
    subtitle: 'Practice Portal',
    basePath: '/clinic',
    brandIcon: Building2,
    user: { name: 'Happy Paws Clinic', subtitle: 'Clinic Staff', initials: 'HS' },
    navItems: [
      { label: 'Dashboard', path: '/clinic', icon: LayoutDashboard, end: true },
      { label: 'Appointments', path: '/clinic/appointments', icon: Calendar },
      { label: 'Clients', path: '/clinic/patients', icon: PawPrint },
      { label: 'Doctors', path: '/clinic/doctors', icon: Stethoscope },
      { label: 'Articles', path: '/clinic/blog', icon: FileText },
      { label: 'Billing', path: '/clinic/invoices', icon: Package },
      { label: 'Settings', path: '/clinic/settings', icon: Settings },
    ],
    bottomTabs: [
      { label: 'Home', path: '/clinic', icon: LayoutDashboard, end: true },
      { label: 'Visits', path: '/clinic/appointments', icon: Calendar },
      { label: 'Clients', path: '/clinic/patients', icon: PawPrint },
      { label: 'Billing', path: '/clinic/invoices', icon: Package },
      { label: 'More', path: '/clinic/settings', icon: MoreHorizontal },
    ],
  },
  ROLE_ADMIN: {
    name: 'kittyp',
    subtitle: 'Admin Portal',
    basePath: '/admin',
    brandIcon: ShieldCheck,
    user: { name: 'Admin', subtitle: 'Platform Admin', initials: 'AD' },
    navItems: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { label: 'Clinics', path: '/admin/clinics', icon: Building2 },
      { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'Health', path: '/admin/health', icon: Activity },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
    bottomTabs: [
      { label: 'Home', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'More', path: '/admin/settings', icon: MoreHorizontal },
    ],
  },
  ROLE_MODERATOR: {
    name: 'kittyp',
    subtitle: 'Moderator Portal',
    basePath: '/admin',
    brandIcon: ShieldCheck,
    user: { name: 'Moderator', subtitle: 'Platform Moderator', initials: 'MO' },
    navItems: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { label: 'Clinics', path: '/admin/clinics', icon: Building2 },
      { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'Health', path: '/admin/health', icon: Activity },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
    bottomTabs: [
      { label: 'Home', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'More', path: '/admin/settings', icon: MoreHorizontal },
    ],
  },
};

/** Return portal config with ecommerce (and deferred inventory) nav stripped when flags are off. */
export function getPortalConfig(role: PortalRole): PortalConfig {
  const base = portalConfigs[role];
  if (isEcommerceEnabled()) {
    return base;
  }
  return {
    ...base,
    navItems: base.navItems.filter((item) => !ECOMMERCE_NAV_PATHS.has(item.path)),
    bottomTabs: base.bottomTabs.filter((item) => !ECOMMERCE_NAV_PATHS.has(item.path)),
  };
}

export const demoCredentials: { email: string; role: PortalRole; label: string }[] = [
  { email: 'parent@demo.com', role: 'ROLE_USER', label: 'Pet Parent' },
  { email: 'doctor@demo.com', role: 'ROLE_DOCTOR', label: 'Doctor' },
  { email: 'clinic_admin@demo.com', role: 'ROLE_CLINIC_ADMIN', label: 'Clinic Admin' },
  { email: 'clinic_staff@demo.com', role: 'ROLE_CLINIC_STAFF', label: 'Clinic Staff' },
  { email: 'admin@demo.com', role: 'ROLE_ADMIN', label: 'Admin' },
];

export function getRoleFromEmail(email: string): PortalRole | null {
  const match = demoCredentials.find((c) => c.email.toLowerCase() === email.toLowerCase().trim());
  return match?.role ?? null;
}

export function getStoredRole(): PortalRole | null {
  const r = getAuthItem('role');
  if (!r) return null;
  const valid = Object.values(ROLES) as string[];
  if (valid.includes(r)) {
    return r as PortalRole;
  }
  return null;
}
