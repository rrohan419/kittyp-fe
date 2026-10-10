import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShoppingCart,
  Package,
  FileText,
  Stethoscope,
  Building2,
  ArrowRight,
  Activity,
  Loader2,
  PawPrint,
  type LucideIcon,
} from 'lucide-react';
import { isEcommerceEnabled } from '@/config/features';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { initializeAdminDashboard } from '@/module/slice/AdminSlice';
import { tipForToday } from '@/utils/dailyTips';

function formatCount(n: number): string {
  return n.toLocaleString();
}

function greetingFor(name?: string | null): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const trimmed = name?.trim();
  return trimmed ? `${part}, ${trimmed}` : part;
}

function FlowChart({ values, label }: { values: number[]; label: string }) {
  const width = 120;
  const height = 36;
  const series = values.length > 0 ? values : [0, 0];
  const peak = Math.max(1, ...series);
  const step = series.length <= 1 ? 0 : width / (series.length - 1);
  const points = series.map((value, index) => {
    const x = series.length <= 1 ? width / 2 : index * step;
    const y = height - 4 - (value / peak) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(' ');
  const area = `M${points[0]} L${points.slice(1).join(' L')} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-8 w-full text-current sm:h-10"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path d={area} fill="currentColor" opacity="0.2" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  onClick,
  iconWrap,
  flow,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  loading: boolean;
  onClick: () => void;
  iconWrap: string;
  flow?: { values: number[]; label: string; tone: string };
  footer: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-left text-white shadow-lg backdrop-blur-md transition hover:bg-slate-950/90 sm:p-[calc(1rem+0.5cm)]"
    >
      <div className="flex items-center gap-2 min-w-0 sm:gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconWrap}`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </span>
        <span className="min-w-0 text-sm font-medium leading-tight text-white sm:text-xl">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 sm:mt-4 sm:gap-3">
        <p className="text-3xl font-semibold leading-none tracking-tight sm:text-5xl">
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-white/60 sm:h-8 sm:w-8" /> : value}
        </p>
        {flow ? (
          <div className={`w-16 shrink-0 sm:w-24 ${flow.tone}`}>
            <FlowChart values={flow.values} label={flow.label} />
          </div>
        ) : null}
      </div>
      <div className="mt-auto flex pt-3 text-xs leading-tight text-white/70 sm:pt-4 sm:text-sm">{footer}</div>
    </button>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const firstName = useAppSelector((s) => s.authReducer.user?.firstName);
  const {
    productCount,
    isDashboardLoading,
    totalOrderCount,
    totalUserCount,
    totalArticleCount,
    doctorsCount,
    clinicsCount,
    pendingDoctorsCount,
    usersJoinedThisMonth,
    pendingClinicsCount,
    userSignupsByDay,
    ordersByDay,
  } = useAppSelector((s) => s.adminReducer);

  useEffect(() => {
    void dispatch(initializeAdminDashboard());
  }, [dispatch]);

  const ordersThisMonth = ordersByDay.reduce((sum, count) => sum + count, 0);

  const stats: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    route: string;
    ecommerce?: boolean;
    iconWrap: string;
    flow?: { values: number[]; label: string; tone: string };
    footer: ReactNode;
  }> = [
    {
      label: 'Total Users',
      value: formatCount(totalUserCount),
      icon: Users,
      route: '/admin/users',
      iconWrap: 'bg-sky-500/25 text-sky-300',
      flow: {
        values: userSignupsByDay,
        label: 'Users who joined each day this month',
        tone: 'text-sky-400',
      },
      footer: <span className="text-emerald-400">+{formatCount(usersJoinedThisMonth)} this month</span>,
    },
    {
      label: 'Doctors',
      value: formatCount(doctorsCount),
      icon: Stethoscope,
      route: '/admin/doctors',
      iconWrap: 'bg-amber-500/25 text-amber-300',
      footer: (
        <span className="ml-auto font-bold text-amber-300">
          <span className="text-xl sm:text-2xl">{formatCount(pendingDoctorsCount)}</span>
          <span className="ml-1 text-xs font-semibold sm:ml-2 sm:text-sm  ">Pending</span>
        </span>
      ),
    },
    {
      label: 'Clinics',
      value: formatCount(clinicsCount),
      icon: Building2,
      route: '/admin/clinics',
      iconWrap: 'bg-violet-500/25 text-violet-300',
      footer: (
        <span className="ml-auto font-bold text-amber-300">
          <span className="text-xl sm:text-2xl">{formatCount(pendingClinicsCount)}</span>
          <span className="ml-1 text-xs font-semibold sm:ml-2 sm:text-sm  ">Pending</span>
        </span>
      ),
    },
    {
      label: 'Orders',
      value: formatCount(totalOrderCount),
      icon: ShoppingCart,
      route: '/admin/orders',
      ecommerce: true,
      iconWrap: 'bg-emerald-500/25 text-emerald-300',
      flow: {
        values: ordersByDay,
        label: 'Orders placed each day this month',
        tone: 'text-emerald-400',
      },
      footer: <span>{ordersThisMonth === 0 ? 'No recent orders' : `${formatCount(ordersThisMonth)} this month`}</span>,
    },
    {
      label: 'Products',
      value: formatCount(productCount),
      icon: Package,
      route: '/admin/products',
      ecommerce: true,
      iconWrap: 'bg-pink-500/25 text-pink-300',
      footer: <span>In store</span>,
    },
    {
      label: 'Articles',
      value: formatCount(totalArticleCount),
      icon: FileText,
      route: '/admin/articles',
      iconWrap: 'bg-cyan-500/25 text-cyan-300',
      footer: <span>In the library</span>,
    },
  ];

  const visibleStats = stats.filter((s) => !s.ecommerce || isEcommerceEnabled());

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="relative h-[240px] overflow-hidden rounded-2xl bg-black sm:h-[280px]">
        <img
          src="/admin-dashboard-hero.jpg"
          alt=""
          className="absolute left-[30%] top-1/2 h-full w-auto origin-center -translate-x-1/2 -translate-y-1/2 scale-[1.45] object-contain [mask-image:linear-gradient(to_right,black_78%,transparent)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/15 to-black/80" />
        <div className="absolute inset-0 flex flex-col justify-center gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-pink-400 sm:text-base">{greetingFor(firstName)}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Here&apos;s what&apos;s happening with KittyP
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/80 sm:text-base">
              Grow a healthier and happier pet community
              <span aria-hidden>🐾</span>
            </p>
          </div>
          <div className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 text-white backdrop-blur-md">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-500/25 text-pink-300">
              <PawPrint className="h-4 w-4" />
            </span>
            <p className="text-sm leading-relaxed text-white/90">
              &ldquo;{tipForToday()}&rdquo;
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {visibleStats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            loading={isDashboardLoading}
            onClick={() => navigate(s.route)}
            iconWrap={s.iconWrap}
            flow={s.flow}
            footer={s.footer}
          />
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">System health</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/health')} className="text-primary">
            View <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">Runtime, resources, and service status.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
