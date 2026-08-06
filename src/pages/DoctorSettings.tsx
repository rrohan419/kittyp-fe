import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, Award, Building2, BadgeCheck } from 'lucide-react';
import { useAppSelector } from '@/module/store/hooks';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  statusLabel,
} from '@/services/doctorVerificationService';

export default function DoctorSettings() {
  const user = useAppSelector((s) => s.authReducer.user);
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Doctor';
  const isVerified = profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account and verification details</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex flex-wrap items-center gap-2">
            Dr. {fullName}
            {isVerified ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            ) : profile ? (
              <Badge variant="secondary">{statusLabel(profile.status)}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="text-foreground">{user?.email || profile?.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              {user?.phoneNumber || profile?.phoneNumber || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              {profile?.specialization?.replace(/_/g, ' ') || 'Specialization not set'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              Reg. no. {profile?.registrationNumber || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              {profile?.clinicName
                ? `${profile.clinicName}${profile.clinicAddress ? ` · ${profile.clinicAddress}` : ''}`
                : 'Independent (no clinic)'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
