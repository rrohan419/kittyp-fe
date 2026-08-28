import { Link } from 'react-router-dom';
import {
  Activity,
  Building2,
  FileText,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EditProfileForm from '@/components/ui/EditProfileForm';
import { CopyableId } from '@/components/ui/CopyableId';
import { useAppSelector } from '@/module/store/hooks';
import { getRoleLabel, type AppRole } from '@/utils/roles';
import { isEcommerceEnabled } from '@/config/features';

const LINKS: { label: string; path: string; description: string; icon: typeof Users; ecommerce?: boolean }[] = [
  { label: 'Users', path: '/admin/users', description: 'Accounts and roles', icon: Users },
  { label: 'Doctors', path: '/admin/doctors', description: 'Verification checklist', icon: Stethoscope },
  { label: 'Clinics', path: '/admin/clinics', description: 'Verify clinics', icon: Building2 },
  { label: 'Articles', path: '/admin/articles', description: 'Publish and edit', icon: FileText },
  { label: 'System health', path: '/admin/health', description: 'Runtime and resources', icon: Activity },
];

export default function AdminSettings() {
  const user = useAppSelector((s) => s.authReducer.user);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Admin';
  const roles = (user?.roles ?? []).filter((r): r is AppRole => Boolean(r));
  const links = LINKS.filter((item) => !item.ecommerce || isEcommerceEnabled());

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Account details and shortcuts for platform admin work.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex flex-wrap items-center gap-2">
            {name}
            <Badge className="bg-primary/10 text-primary border-0 gap-1 font-normal">
              <ShieldCheck className="h-3.5 w-3.5" />
              {roles.map((r) => getRoleLabel(r)).join(' · ') || 'Admin'}
            </Badge>
          </CardTitle>
          <CardDescription>Signed-in email and public account ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span> {user?.email || '—'}
          </p>
          <CopyableId
            label="Account ID"
            value={user?.uuid}
            hint="Sign in with this ID or your email."
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Name, phone, and email. Email or phone changes need OTP.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm initiallyEditing={false} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Admin tools</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="font-medium block">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
