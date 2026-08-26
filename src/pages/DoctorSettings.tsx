import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Mail,
  Phone,
  Award,
  Building2,
  BadgeCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  PawPrint,
} from 'lucide-react';
import { useAppSelector } from '@/module/store/hooks';
import { specializationLabel } from '@/utils/specialization';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  statusLabel,
} from '@/services/doctorVerificationService';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { CopyableId } from '@/components/ui/CopyableId';
import {
  fetchDoctorWhatsAppSettings,
  updateDoctorWhatsAppSettings,
} from '@/services/invoiceService';
import { WhatsAppSettingsForm } from '@/components/whatsapp/WhatsAppSettingsForm';
import { AttendedPatientModel, fetchMyAttendedPatients } from '@/services/visitService';

function DocLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Badge variant="secondary" className="text-[10px]">
          Not uploaded
        </Badge>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
    >
      <span className="inline-flex items-center gap-2 font-medium text-primary">
        <FileText className="h-4 w-4" />
        {label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
      <span>{label}</span>
      {ok ? (
        <Badge className="bg-emerald-100 text-emerald-800 border-0 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1 text-amber-800 bg-amber-100 border-0">
          <XCircle className="h-3 w-3" /> Pending
        </Badge>
      )}
    </div>
  );
}

function formatWhen(raw?: string) {
  if (!raw) return null;
  const d = parseISO(raw);
  return isValid(d) ? format(d, 'MMM d, yyyy') : null;
}

export default function DoctorSettings() {
  const user = useAppSelector((s) => s.authReducer.user);
  const { isPersonalPractice } = useActiveClinic();
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const [attended, setAttended] = useState<AttendedPatientModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [waConfigured, setWaConfigured] = useState(false);
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');

  useEffect(() => {
    void Promise.all([
      fetchMyDoctorProfile().catch(() => null),
      fetchMyAttendedPatients().catch(() => [] as AttendedPatientModel[]),
    ])
      .then(([p, a]) => {
        setProfile(p);
        setAttended(a);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isPersonalPractice) {
      setWaConfigured(false);
      setWaPhoneId('');
      setWaBusinessId('');
      return;
    }
    void fetchDoctorWhatsAppSettings()
      .then((wa) => {
        setWaConfigured(!!wa.whatsappConfigured);
        setWaPhoneId(wa.phoneNumberId || '');
        setWaBusinessId(wa.businessAccountId || '');
      })
      .catch(() => {
        setWaConfigured(false);
        setWaPhoneId('');
        setWaBusinessId('');
      });
  }, [isPersonalPractice]);

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
        <p className="text-sm text-muted-foreground mt-1">
          {isPersonalPractice
            ? 'Your account, WhatsApp, verification, documents, and patients'
            : 'Your account, verification, documents, and patients — WhatsApp for this practice is in Practice Settings'}
        </p>
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
          <CopyableId
            label="Doctor ID"
            value={profile?.uuid}
            hint="Use this ID or your email to sign in. Clinics invite you with this ID."
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              {user?.phoneNumber || profile?.phoneNumber || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4 shrink-0" />
            <span className="text-foreground">
              {specializationLabel(profile?.specialization) || 'Specialization not set'}
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
                ? `Affiliated: ${profile.clinicName}`
                : 'Personal account · online consultations'}
            </span>
          </div>
        </CardContent>
      </Card>

      {isPersonalPractice ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">WhatsApp number</CardTitle>
            <CardDescription>
              Used for Personal practice invoices and receipts. Practice branches use Practice Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppSettingsForm
              configured={waConfigured}
              phoneNumberIdInitial={waPhoneId}
              businessAccountIdInitial={waBusinessId}
              onSave={async (values) => {
                const res = await updateDoctorWhatsAppSettings(values);
                setWaConfigured(!!res.whatsappConfigured);
                setWaPhoneId(res.phoneNumberId || '');
                setWaBusinessId(res.businessAccountId || '');
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <PawPrint className="h-4 w-4" /> Pets attended
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Pets and owners from visits you treated across practices.
            </p>
          </div>
          <Badge variant="secondary">{attended.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {attended.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Finish treatment on a visit and the pet + owner will appear here.
            </p>
          ) : (
            attended.slice(0, 20).map((row) => (
              <div
                key={`${row.petUuid}-${row.clinicUuid || 'x'}`}
                className="rounded-xl border border-border px-3 py-2.5 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {row.petName}
                      {row.ownerName ? ` · ${row.ownerName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[row.species, row.breed].filter(Boolean).join(' · ') || 'Pet'}
                      {row.ownerPhone ? ` · ${row.ownerPhone}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.clinicName || 'Practice'}
                      {row.lastAssessment ? ` · ${row.lastAssessment}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {row.visitCount} visit{row.visitCount === 1 ? '' : 's'}
                    </Badge>
                    {formatWhen(row.lastVisitAt) && (
                      <p className="text-[10px] text-muted-foreground mt-1">{formatWhen(row.lastVisitAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {attended.length > 0 && (
            <Link to="/doctor/appointments" className="text-xs text-primary font-medium inline-block pt-1">
              Open My visits →
            </Link>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckRow label="Email OTP" ok={!!profile?.checkEmailOtp || !!profile?.emailOtpVerified} />
          <CheckRow label="Mobile OTP" ok={!!profile?.checkMobileOtp || !!profile?.phoneOtpVerified} />
          <CheckRow label="Degree certificate" ok={!!profile?.checkDegree} />
          <CheckRow label="Registration certificate" ok={!!profile?.checkRegistrationCertificate} />
          <CheckRow label="Government ID" ok={!!profile?.checkGovernmentId} />
          <CheckRow label="Registration number" ok={!!profile?.checkRegistrationNumber} />
          <p className="text-xs text-muted-foreground pt-1">
            Clinic address and clinic photos are verified on the clinic account, not here.
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Files submitted for verification. Open a link to review what admin and clinics see.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <DocLink href={profile?.degreeCertificateUrl} label="Degree certificate" />
          <DocLink href={profile?.registrationCertificateUrl} label="Registration / license certificate" />
          <DocLink href={profile?.governmentIdUrl} label="Government ID" />
        </CardContent>
      </Card>
    </div>
  );
}
