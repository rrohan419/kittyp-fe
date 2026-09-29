import { useEffect, useState } from 'react';
import { Activity, DollarSign, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicReportsModel, fetchClinicReports } from '@/services/clinicService';

const PERIODS = [{ value: 3, label: 'Last 3 months' }, { value: 6, label: 'Last 6 months' }, { value: 12, label: 'Last 12 months' }];
const formatCurrency = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function ClinicReports() {
  const { clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [period, setPeriod] = useState(6);
  const [report, setReport] = useState<ClinicReportsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    if (!clinicUuid) { setReport(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setReport(await fetchClinicReports(clinicUuid, period)); } catch { setReport(null); setError('Reports could not be loaded. Please try again.'); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [clinicUuid, period]);
  const maxRevenue = Math.max(...(report?.revenueSeries ?? []).map((point) => point.value), 1);
  const stats = report ? [
    { label: 'Total Revenue', value: formatCurrency(report.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-500/10' },
    { label: 'Total Visits', value: report.totalVisits.toLocaleString(), icon: Activity, color: 'text-primary bg-primary/10' },
    { label: 'New Patients', value: report.newPatients.toLocaleString(), icon: Users, color: 'text-violet-600 bg-violet-500/10' },
    { label: 'Growth', value: report.growthPercentage == null ? '—' : `${report.growthPercentage > 0 ? '+' : ''}${report.growthPercentage}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-500/10' },
  ] : [];
  const hasData = Boolean(report && (report.revenueSeries.length || report.doctorPerformance.length || report.serviceBreakdown.length));
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports</h1><p className="text-muted-foreground mt-1 text-sm">Live performance overview{report?.periodLabel ? ` · ${report.periodLabel}` : ''}</p></div><div className="flex items-center gap-2"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={period} onChange={(event) => setPeriod(Number(event.target.value))} disabled={!clinicUuid || loading}>{PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><Button variant="outline" size="sm" onClick={() => void load()} disabled={!clinicUuid || loading} aria-label="Refresh reports"><RefreshCw className="h-4 w-4" /></Button></div></div>
      {clinicLoading || loading ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Loading live report data...</div> : null}
      {!clinicLoading && !loading && !clinicUuid ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Select a clinic branch to view reports.</div> : null}
      {!loading && clinicUuid && error ? <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center"><p className="text-sm text-destructive">{error}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => void load()}>Try again</Button></div> : null}
      {!loading && clinicUuid && !error && report && !hasData ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">There is no report data for this period.</div> : null}
      {!loading && !error && report && hasData ? <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{stats.map((stat) => { const Icon = stat.icon; return <Card key={stat.label} className="border-0 shadow-sm"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p></div><div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}><Icon className="h-4 w-4" /></div></div></CardContent></Card>; })}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"><Card className="lg:col-span-2 border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Revenue</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between gap-2 h-48">{report.revenueSeries.map((point) => <div key={point.label} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-muted rounded-t-md relative" style={{ height: `${(point.value / maxRevenue) * 100}%` }}><div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 rounded-t-md" /></div><span className="text-[10px] text-muted-foreground">{point.label}</span></div>)}</div></CardContent></Card><Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Top Services</CardTitle></CardHeader><CardContent className="space-y-3">{report.serviceBreakdown.map((service) => <div key={service.name}><div className="flex items-center justify-between text-xs mb-1"><span className="font-medium">{service.name}</span><span className="text-muted-foreground">{service.count} ({service.percentage}%)</span></div><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(service.percentage, 100)}%` }} /></div></div>)}</CardContent></Card></div>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Doctor Performance</CardTitle></CardHeader><CardContent className="space-y-3">{report.doctorPerformance.map((doctor, index) => <div key={doctor.doctorUuid} className="flex items-center gap-3"><span className="text-xs text-muted-foreground w-4">{index + 1}</span><div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-[11px] font-semibold text-primary">{doctor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{doctor.name}</p><p className="text-[11px] text-muted-foreground truncate">{doctor.specialization || 'Doctor'} · {doctor.visits} visits</p></div>{doctor.rating != null ? <Badge variant="secondary" className="bg-muted border-0 text-[10px]">{doctor.rating.toFixed(1)}</Badge> : null}</div>)}</CardContent></Card>
      </> : null}
    </div>
}
