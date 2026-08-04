import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PawPrint, Calendar, Heart, Apple, ArrowRight, Bell, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { RootState } from '@/module/store/store';
import { calculatePetAgeForDisplay } from '@/services/UserService';

export default function ParentHome() {
  const { user } = useSelector((s: RootState) => s.authReducer);
  const pets = user?.ownerPets ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || 'there';

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
            Book Visit
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
            </p>
            <Button asChild>
              <Link to="/app/pets">Go to My Pets</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pets.map((p) => {
            const age = p.dateOfBirth ? calculatePetAgeForDisplay(p.dateOfBirth) : '—';
            return (
              <Card key={p.uuid} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center shrink-0">
                      <PawPrint className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.type} · {p.breed || 'Mixed'} · {age}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/pets/${p.uuid}`}>Dashboard</Link>
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Weight</p>
                      <p className="text-sm font-semibold">{p.weight ? `${p.weight} kg` : '—'}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Activity</p>
                      <p className="text-sm font-semibold truncate">{p.activityLevel || '—'}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase">Status</p>
                      <p className="text-sm font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Next Appointment</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/appointments" className="text-primary">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">No upcoming visits booked</p>
                  <p className="text-xs text-muted-foreground">Schedule a checkup from Appointments</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link to="/app/appointments">Book</Link>
              </Button>
            </div>
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
              { label: 'Book Visit', icon: Calendar, to: '/app/appointments' },
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
