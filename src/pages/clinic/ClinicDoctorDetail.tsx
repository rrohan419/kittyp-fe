import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO, differenceInMonths, isValid } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  PawPrint,
  Phone,
  Star,
  Stethoscope,
  User,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ratingAdjective } from '@/components/schedule/weekCalendarUtils';
import {
  ClinicDoctorDetailModel,
  ClinicDoctorModel,
  fetchClinicDoctorDetail,
  fetchClinicDoctors,
} from '@/services/clinicService';
import { statusLabel } from '@/services/doctorVerificationService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type CheckItem = { key: keyof ClinicDoctorDetailModel; label: string; submitted?: boolean };

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

function VerifyRow({ label, verified, submitted }: { label: string; verified: boolean; submitted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {submitted === false && (
          <p className="text-[11px] text-muted-foreground">Not submitted yet</p>
        )}
      </div>
      {verified ? (
        <Badge className="bg-emerald-100 text-emerald-800 border-0 gap-1 shrink-0">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1 shrink-0 text-amber-800 bg-amber-100 border-0">
          <XCircle className="h-3 w-3" /> Not verified
        </Badge>
      )}
    </div>
  );
}

function formatWhen(value?: string | null) {
  if (!value) return null;
  try {
    return format(parseISO(value.length === 10 ? `${value}T00:00:00` : value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function tenureLabel(joinedAt?: string | null): string | null {
  if (!joinedAt) return null;
  const raw = joinedAt.length === 10 ? `${joinedAt}T00:00:00` : joinedAt;
  const d = parseISO(raw);
  if (!isValid(d)) return null;
  const months = Math.max(0, differenceInMonths(new Date(), d));
  if (months < 1) return 'Joined this month';
  if (months < 12) return `Since ${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  return `Since ${years} year${years === 1 ? '' : 's'}`;
}

export default function ClinicDoctorDetail() {
  const { doctorUuid = '' } = useParams();
  const navigate = useNavigate();
  const { clinicUuid, clinic, loading: clinicLoading } = useActiveClinic();
  const [detail, setDetail] = useState<ClinicDoctorDetailModel | null>(null);
  const [roster, setRoster] = useState<ClinicDoctorModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!clinicUuid) {
        setRoster([]);
        return;
      }
      try {
        const list = await fetchClinicDoctors(clinicUuid);
        if (!cancelled) setRoster(list);
      } catch {
        if (!cancelled) setRoster([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!clinicUuid || !doctorUuid) {
        setDetail(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchClinicDoctorDetail(clinicUuid, doctorUuid);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) {
          setDetail(null);
          toast.error('Failed to load doctor details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid, doctorUuid]);

  const rosterIndex = useMemo(
    () => roster.findIndex((d) => d.doctorUuid === doctorUuid),
    [roster, doctorUuid]
  );
  const prevDoctor = rosterIndex > 0 ? roster[rosterIndex - 1] : null;
  const nextDoctor =
    rosterIndex >= 0 && rosterIndex < roster.length - 1 ? roster[rosterIndex + 1] : null;

  const checks: CheckItem[] = useMemo(() => {
    if (!detail) return [];
    return [
      { key: 'phoneOtpVerified', label: 'Phone OTP (doctor completed)', submitted: true },
      { key: 'emailOtpVerified', label: 'Email OTP (doctor completed)', submitted: true },
      { key: 'checkMobileOtp', label: 'Mobile OTP (admin check)' },
      { key: 'checkEmailOtp', label: 'Email OTP (admin check)' },
      {
        key: 'checkDegree',
        label: 'Degree certificate',
        submitted: Boolean(detail.degreeCertificateUrl),
      },
      {
        key: 'checkRegistrationCertificate',
        label: 'Registration certificate',
        submitted: Boolean(detail.registrationCertificateUrl || detail.licenseDocumentUrl),
      },
      {
        key: 'checkGovernmentId',
        label: 'Government ID',
        submitted: Boolean(detail.governmentIdUrl),
      },
      {
        key: 'checkRegistrationNumber',
        label: 'Registration number',
        submitted: Boolean(detail.registrationNumber),
      },
      { key: 'checkClinicAddress', label: 'Clinic address check' },
      { key: 'checkGoogleMapsMatch', label: 'Google Maps match' },
      {
        key: 'checkClinicPhotos',
        label: 'Clinic photos',
        submitted: Boolean(detail.clinicPhotosUrls),
      },
    ];
  }, [detail]);

  const clinicPhotoLinks = (detail?.clinicPhotosUrls || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const initials = (detail?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (clinicLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading doctor…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/clinic/doctors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to profile
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Doctor not found on this clinic roster.</p>
      </div>
    );
  }

  const verifiedCount = checks.filter((c) => Boolean(detail[c.key])).length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {roster.length > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevDoctor}
            onClick={() => prevDoctor && navigate(`/clinic/doctors/${prevDoctor.doctorUuid}`)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[140px] truncate">
              {prevDoctor ? prevDoctor.name : 'Previous'}
            </span>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/clinic/doctors">All profiles</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextDoctor}
            onClick={() => nextDoctor && navigate(`/clinic/doctors/${nextDoctor.doctorUuid}`)}
            className="gap-1"
          >
            <span className="hidden sm:inline max-w-[140px] truncate">
              {nextDoctor ? nextDoctor.name : 'Next'}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/clinic/doctors">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to profile
            </Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          {detail.photoUrl ? (
            <img
              src={detail.photoUrl}
              alt={detail.name}
              className="w-16 h-16 rounded-2xl object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground truncate">{detail.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {(detail.specialization || 'General').replace(/_/g, ' ')}
              {clinic?.name ? ` · ${clinic.name}` : ''}
              {rosterIndex >= 0 ? ` · ${rosterIndex + 1} of ${roster.length}` : ''}
            </p>
            <p className="text-sm mt-2 inline-flex items-center gap-1.5 text-muted-foreground">
              {detail.rating != null && (detail.reviewsCount ?? 0) > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{detail.rating.toFixed(1)}</span>
                  <span>· {detail.ratingLabel || ratingAdjective(detail.rating)}</span>
                  <span>
                    · {detail.reviewsCount} review{detail.reviewsCount === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span>Not rated yet</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn(
                  'border-0 capitalize',
                  detail.isActive === false
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-green-100 text-green-700'
                )}
              >
                {detail.isActive === false ? 'inactive' : 'active'}
              </Badge>
              {detail.status && (
                <Badge variant="outline" className="capitalize">
                  {statusLabel(detail.status as Parameters<typeof statusLabel>[0])}
                </Badge>
              )}
              {detail.role && (
                <Badge variant="secondary" className="capitalize">
                  {detail.role}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium break-all inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {detail.email || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {detail.phoneNumber || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registration no.</p>
                <p className="font-medium">{detail.registrationNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">License no.</p>
                <p className="font-medium">{detail.licenseNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="font-medium">
                  {detail.experienceYears != null ? `${detail.experienceYears} years` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">With clinic</p>
                <p className="font-medium">
                  {tenureLabel(detail.joinedAt) || formatWhen(detail.joinedAt) || '—'}
                </p>
                {formatWhen(detail.joinedAt) && tenureLabel(detail.joinedAt) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Joined {formatWhen(detail.joinedAt)}
                  </p>
                )}
              </div>
              {detail.bio && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{detail.bio}</p>
                </div>
              )}
              {(detail.submittedAt || detail.reviewedAt || detail.reviewNotes) && (
                <div className="sm:col-span-2 rounded-lg bg-muted/40 px-3 py-2 space-y-1">
                  {detail.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatWhen(detail.submittedAt)}
                    </p>
                  )}
                  {detail.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed {formatWhen(detail.reviewedAt)}
                    </p>
                  )}
                  {detail.reviewNotes && <p className="text-sm">{detail.reviewNotes}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DocLink href={detail.degreeCertificateUrl} label="Degree certificate" />
              <DocLink
                href={detail.registrationCertificateUrl || detail.licenseDocumentUrl}
                label="Registration certificate"
              />
              <DocLink href={detail.governmentIdUrl} label="Government ID" />
              {clinicPhotoLinks.length === 0 ? (
                <DocLink href={undefined} label="Clinic photos" />
              ) : (
                clinicPhotoLinks.map((url, i) => (
                  <DocLink key={url} href={url} label={`Clinic photo ${i + 1}`} />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PawPrint className="h-4 w-4" /> Pets you&apos;ve seen
              </CardTitle>
              <Badge variant="secondary">{detail.patients?.length || 0}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {(detail.patients || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No treated pets yet. Pets appear here after this doctor sees them (with doctor,
                  checkout, or completed)—not from waitlist or bookings alone.
                </p>
              ) : (
                detail.patients.map((row) => (
                  <div
                    key={row.pet.petUuid}
                    className="rounded-xl border border-border p-4 space-y-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{row.pet.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[row.pet.species, row.pet.breed, row.pet.gender].filter(Boolean).join(' · ') ||
                            'Pet'}
                          {row.pet.patientNumber && !row.pet.patientNumber.startsWith('doc:')
                            ? ` · #${row.pet.patientNumber}`
                            : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.appointmentCount > 0
                            ? `${row.appointmentCount} visit${row.appointmentCount === 1 ? '' : 's'} with this doctor`
                            : 'Seen at this clinic'}
                          {row.lastAppointment ? ` · last ${formatWhen(row.lastAppointment)}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/clinic/pets/${row.pet.petUuid}`}>Pet profile</Link>
                        </Button>
                        {row.owner?.ownerUuid && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/clinic/owners/${row.owner.ownerUuid}`}>Owner</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm rounded-lg bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Owner</p>
                        <p className="font-medium">{row.owner?.name || row.pet.ownerName || '—'}</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {row.owner?.email || row.pet.ownerEmail || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Contact</p>
                        <p className="font-medium">{row.owner?.phone || row.pet.ownerPhone || '—'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {row.owner?.address || 'No address on file'}
                        </p>
                      </div>
                      {(row.pet.weight || row.pet.microchipNumber || row.pet.dateOfBirth) && (
                        <div className="sm:col-span-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                          {row.pet.dateOfBirth && <span>DOB {formatWhen(row.pet.dateOfBirth)}</span>}
                          {row.pet.weight && <span>Weight {row.pet.weight}</span>}
                          {row.pet.microchipNumber && <span>Chip {row.pet.microchipNumber}</span>}
                          {row.pet.globalPetId && <span>ID {row.pet.globalPetId}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Verification
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {verifiedCount} of {checks.length} checks marked verified
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {checks.map((c) => (
                <VerifyRow
                  key={c.key}
                  label={c.label}
                  verified={Boolean(detail[c.key])}
                  submitted={c.submitted}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
