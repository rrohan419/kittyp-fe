import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingCart, Package, FileText, Stethoscope, Building2, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { isEcommerceEnabled } from '@/config/features';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { initializeAdminDashboard } from '@/module/slice/AdminSlice';
import { CopyableId } from '@/components/ui/CopyableId';

function formatCount(n: number): string {
  return n.toLocaleString();
}

export default function AdminHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.authReducer.user);
  const {
    productCount,
    isDashboardLoading,
    totalOrderCount,
    totalUserCount,
    totalArticleCount,
    pendingDoctorsCount,
    clinicsCount,
  } = useAppSelector((s) => s.adminReducer);

  useEffect(() => {
    void dispatch(initializeAdminDashboard());
  }, [dispatch]);

  const stats = [
    { label: 'Total Users', value: formatCount(totalUserCount), icon: Users, color: 'text-blue-600 bg-blue-500/10', route: '/admin/users' },
    { label: 'Pending Doctors', value: formatCount(pendingDoctorsCount), icon: Stethoscope, color: 'text-amber-600 bg-amber-500/10', route: '/admin/doctors' },
    { label: 'Clinics', value: formatCount(clinicsCount), icon: Building2, color: 'text-violet-600 bg-violet-500/10', route: '/admin/clinics' },
    { label: 'Orders', value: formatCount(totalOrderCount), icon: ShoppingCart, color: 'text-green-600 bg-green-500/10', route: '/admin/orders', ecommerce: true },
    { label: 'Products', value: formatCount(productCount), icon: Package, color: 'text-pink-600 bg-pink-500/10', route: '/admin/products', ecommerce: true },
    { label: 'Articles', value: formatCount(totalArticleCount), icon: FileText, color: 'text-cyan-600 bg-cyan-500/10', route: '/admin/articles' },
  ];

  const visibleStats = stats.filter((s) => !s.ecommerce || isEcommerceEnabled());

  const doctorsAwaitingCopy =
    pendingDoctorsCount === 1
      ? '1 doctor awaiting verification.'
      : `${formatCount(pendingDoctorsCount)} doctors awaiting verification.`;

  const clinicsCopy =
    clinicsCount === 1
      ? '1 clinic on the platform.'
      : `${formatCount(clinicsCount)} clinics on the platform.`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Platform overview and quick actions</p>
        <div className="mt-3">
          <CopyableId
            label="Account ID"
            value={user?.uuid}
            hint="Sign in with this ID or your email."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {visibleStats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} onClick={() => navigate(s.route)} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}><Icon className="h-4 w-4" /></div>
                {isDashboardLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold">{s.value}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Doctor Approvals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/doctors')} className="text-primary">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isDashboardLoading ? 'Loading…' : doctorsAwaitingCopy}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Clinics</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/clinics')} className="text-primary">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isDashboardLoading ? 'Loading…' : clinicsCopy}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">System health</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/health')} className="text-primary">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <p className="text-sm text-muted-foreground">Donuts, trend, and every Actuator component.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
