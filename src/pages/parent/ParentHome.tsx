import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { PawPrint, Calendar, Heart, Apple, ArrowRight, Bell, Lightbulb, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { RootState } from '@/module/store/store';
import { calculatePetAgeForDisplay } from '@/services/UserService';
import { ClinicVisitModel } from '@/services/clinicService';
import { fetchMyParentVisits } from '@/services/visitService';

const ACTIVE = new Set(['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKING_OUT']);

export default function ParentHome() {
  const { user } = useSelector((s: RootState) => s.authReducer);
  const pets = user?.ownerPets ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || 'there';
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);

  const tip = useMemo(() => {
    const tips = [
      'Fresh water daily keeps kidneys happier — refill bowls morning and night.',
      'A short play session before meals can reduce begging and support healthy weight.',
      'Check gums weekly: healthy pink color is a quick at-home wellness signal.',
      'Keep vaccine and deworming dates in your pet dashboard so boosters never slip.',
    ];
    const day = new Date().getDate();
    return tips[day % tips.length];
  }, []);

  const loadVisits = useCallback(async () => {
    try {
      setVisits(await fetchMyParentVisits());
    } catch {
      setVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  }, []);

  useEffect(() => {
    void loadVisits();
    const t = setInterval(() => void loadVisits(), 20000);
    return () => clearInterval(t);
  }, [loadVisits]);

  const currentVisit = useMemo(
    () => visits.find((v) => ACTIVE.has(v.status)),
    [visits]
  );
  const recentCompleted = useMemo(
    () => visits.find((v) => v.status === 'COMPLETED' || v.status === 'CHECKING_OUT'),
    [visits]
  );
  const highlight = currentVisit || recentCompleted;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d')} — Here&apos;s how your pets are doing.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/app/appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Tip of the Day</p>
            <p className="text-sm text-foreground mt-1 leading-relaxed">{tip}</p>
          </div>
        </CardContent>
      </Card>

      {pets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <PawPrint className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-semibold">Add your first pet</p>
            <p className="text-sm text-muted-foreground">
              Create a pet profile to unlock the health dashboard, nutrition plans, and daily tips.
              Clinic pets also appear here when your email matches the clinic record.
            </p>
            <Button asChild>
              <Link to="/app/pets">Go to My Pets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : pets.length === 1 ? (
        (() => {
          const p = pets[0];
          const age = p.dateOfBirth ? calculatePetAgeForDisplay(p.dateOfBirth) : '—';
          return (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/20 to-primary/5">
                {p.profilePicture ? (
                  <img
                    src={p.profilePicture}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PawPrint className="h-20 w-20 text-primary/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              </div>
              <CardContent className="p-6 space-y-5 -mt-10 relative">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="w-20 h-20 rounded-3xl border-4 border-background bg-muted overflow-hidden shadow-md shrink-0">
                    {p.profilePicture ? (
                      <img src={p.profilePicture} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <PawPrint className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Your pet</p>
                    <h2 className="text-2xl font-bold truncate">{p.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {p.type} · {p.breed || 'Mixed'} · {age}
                      {p.gender ? ` · ${p.gender}` : ''}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`/app/pets/${p.uuid}`}>Open full dashboard</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Weight</p>
                    <p className="font-semibold">{p.weight != null ? `${p.weight} kg` : '—'}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Activity</p>
                    <p className="font-semibold truncate">{p.activityLevel || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Conditions</p>
                    <p className="font-semibold truncate text-sm">{p.healthConditions || 'None'}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground">Allergies</p>
                    <p className="font-semibold truncate text-sm">{p.allergies || 'None'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {pets.map((p) => {
            const age = p.dateOfBirth ? calculatePetAgeForDisplay(p.dateOfBirth) : '—';
            return (
              <Link
                key={p.uuid}
                to={`/app/pets/${p.uuid}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="aspect-square bg-muted relative">
                  {p.profilePicture ? (
                    <img
                      src={p.profilePicture}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <PawPrint className="h-10 w-10 text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.type} · {p.breed || 'Mixed'} · {age}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              {currentVisit ? 'Current visit' : 'Latest appointment'}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/appointments" className="text-primary">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading visits…
              </div>
            ) : highlight ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {highlight.petName}
                      {highlight.chart?.assessment
                        ? ` · ${highlight.chart.assessment}`
                        : highlight.reasonForVisit
                          ? ` · ${highlight.reasonForVisit}`
                          : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {highlight.clinicName || 'Clinic'}
                      {highlight.doctorName
                        ? ` · Dr. ${highlight.doctorName.replace(/^Dr\.?\s*/i, '')}`
                        : ''}
                    </p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {highlight.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link
                    to={
                      highlight.petUuid
                        ? `/app/pets/${highlight.petUuid}`
                        : '/app/appointments'
                    }
                  >
                    Details
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">No visits yet</p>
                    <p className="text-xs text-muted-foreground">
                      Clinic walk-ins and reports appear here after signup if your email matches.
                    </p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to="/app/appointments">Open</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" /> Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground leading-snug">
              Vaccine and nutrition reminders will appear here once your clinic or doctor sends them.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'My Pets', icon: PawPrint, to: '/app/pets' },
              { label: 'Health Log', icon: Heart, to: '/app/health' },
              { label: 'Nutrition', icon: Apple, to: '/app/nutrition' },
              { label: 'Appointments', icon: Calendar, to: '/app/appointments' },
            ].map((q) => {
              const Icon = q.icon;
              return (
                <Button key={q.label} variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to={q.to}>
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{q.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
