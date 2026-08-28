import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import { mockDoctors } from '@/data/mockClinic';

const months = [
  { m: 'Jan', v: 18000 }, { m: 'Feb', v: 22000 }, { m: 'Mar', v: 19500 },
  { m: 'Apr', v: 28000 }, { m: 'May', v: 31000 }, { m: 'Jun', v: 27500 },
];
const max = Math.max(...months.map((m) => m.v));

const topServices = [
  { name: 'General Checkup', count: 124, pct: 38 },
  { name: 'Vaccination', count: 87, pct: 27 },
  { name: 'Surgery', count: 42, pct: 13 },
  { name: 'Dental', count: 36, pct: 11 },
  { name: 'Other', count: 35, pct: 11 },
];

export default function ClinicReports() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Performance overview · last 6 months</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { l: 'Total Revenue', v: '$146K', i: DollarSign, c: 'text-green-600 bg-green-500/10' },
          { l: 'Total Visits', v: '1,284', i: Activity, c: 'text-primary bg-primary/10' },
          { l: 'New Patients', v: '218', i: Users, c: 'text-violet-600 bg-violet-500/10' },
          { l: 'Growth', v: '+18%', i: TrendingUp, c: 'text-amber-600 bg-amber-500/10' },
        ].map((s) => {
          const Icon = s.i;
          return (
            <Card key={s.l} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.l}</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-2">{s.v}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${s.c} flex items-center justify-center`}><Icon className="h-4 w-4" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Revenue · Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {months.map((m) => (
                <div key={m.m} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted rounded-t-md relative" style={{ height: `${(m.v / max) * 100}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 rounded-t-md" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.m}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Top Services</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topServices.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct * 2}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Doctor Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockDoctors.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-semibold text-primary">{d.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.specialization}</p>
                </div>
                <Badge variant="secondary" className="bg-muted border-0 text-[10px]">⭐ {d.rating}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
