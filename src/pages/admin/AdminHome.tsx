import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingCart, Package, FileText, Stethoscope, Building2, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '2,420', icon: Users, color: 'text-blue-600 bg-blue-500/10', route: '/admin/users' },
  { label: 'Pending Doctors', value: '4', icon: Stethoscope, color: 'text-amber-600 bg-amber-500/10', route: '/admin/doctors' },
  { label: 'Organizations', value: '12', icon: Building2, color: 'text-violet-600 bg-violet-500/10', route: '/admin/organizations' },
  { label: 'Orders', value: '845', icon: ShoppingCart, color: 'text-green-600 bg-green-500/10', route: '/admin/orders' },
  { label: 'Products', value: '12', icon: Package, color: 'text-pink-600 bg-pink-500/10', route: '/admin/products' },
  { label: 'Articles', value: '6', icon: FileText, color: 'text-cyan-600 bg-cyan-500/10', route: '/admin/articles' },
];

export default function AdminHome() {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Platform overview and quick actions</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} onClick={() => navigate(s.route)} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}><Icon className="h-4 w-4" /></div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Doctor Approvals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/doctors')} className="text-primary">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">4 doctors awaiting verification.</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Organizations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/organizations')} className="text-primary">View <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">12 active clinics on the platform.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
