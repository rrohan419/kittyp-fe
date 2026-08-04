import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Video,
  TrendingUp,
  ArrowRight,
  Star,
  Bell,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  statusLabel,
} from '@/services/doctorVerificationService';
import { useAppSelector } from '@/module/store/hooks';

const mockUpcomingAppointments = [
  { id: '1', petName: 'Whiskers', ownerName: 'Sarah M.', time: '10:00 AM', type: 'General Checkup', status: 'confirmed' as const },
  { id: '2', petName: 'Luna', ownerName: 'James K.', time: '11:30 AM', type: 'Vaccination', status: 'confirmed' as const },
  { id: '3', petName: 'Milo', ownerName: 'Priya R.', time: '2:00 PM', type: 'Dental', status: 'pending' as const },
];

const mockRecentActivity = [
  { id: '1', text: 'Completed consultation with Whiskers', time: '2 hours ago', icon: CheckCircle2 },
  { id: '2', text: 'New booking from Sarah M.', time: '3 hours ago', icon: Calendar },
  { id: '3', text: 'Received 5-star review', time: '5 hours ago', icon: Star },
  { id: '4', text: 'Updated availability for next week', time: '1 day ago', icon: Clock },
];

export default function DoctorHome() {
  const user = useAppSelector((s) => s.authReducer.user);
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.firstName ? `Dr. ${user.firstName}` : 'Doctor';
  const isVerified =
    profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED';

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex flex-wrap items-center gap-2">
            {greeting}, {displayName}
            {isVerified && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1 font-medium">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
            {profile && !isVerified && (
              <Badge variant="secondary" className="font-medium">
                {statusLabel(profile.status)}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your day at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center">
              2
            </span>
          </Button>
          <Button size="sm" asChild>
            <Link to="/doctor/appointments">
              <Video className="h-4 w-4 mr-2" />
              Start Consultation
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Appointments</p>
                <p className="text-3xl font-bold text-foreground mt-2">3</p>
                <p className="text-xs text-muted-foreground mt-1">1 pending confirmation</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Patients</p>
                <p className="text-3xl font-bold text-foreground mt-2">48</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600">+5 this week</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Month</p>
                <p className="text-3xl font-bold text-foreground mt-2">$2,450</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-amber-600" />
                  <p className="text-xs text-amber-600">+12% vs last</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500/5 to-violet-500/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rating</p>
                <p className="text-3xl font-bold text-foreground mt-2">4.9</p>
                <p className="text-xs text-muted-foreground mt-1">32 reviews</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/doctor/appointments" className="text-primary">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {apt.petName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{apt.petName}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.ownerName} · {apt.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{apt.time}</p>
                    <Badge
                      variant="secondary"
                      className={
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px]'
                      }
                    >
                      {apt.status}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="h-8">
                    <Video className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {mockUpcomingAppointments.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No appointments today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{activity.text}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/availability">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-xs">Set Availability</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/patients">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs">View Patients</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/analytics">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-xs">Earnings Report</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/settings">
                <Star className="h-5 w-5 text-primary" />
                <span className="text-xs">Edit Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
