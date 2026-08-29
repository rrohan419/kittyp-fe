import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Check, ExternalLink, Loader2, Search, Stethoscope } from 'lucide-react';
import {
  ChecklistKey,
  DoctorStatus,
  DoctorVerificationModel,
  DOCTOR_STATUS_STEPS,
  allApplicableChecksPassed,
  fetchAdminDoctors,
  isChecklistItemApplicable,
  statusLabel,
  updateDoctorChecklist,
  updateDoctorStatus,
} from '@/services/doctorVerificationService';
import { specializationLabel } from '@/utils/specialization';
import { matchesQuery } from '@/utils/search';

const CHECKLIST: { key: ChecklistKey; label: string }[] = [
  { key: 'checkMobileOtp', label: 'Mobile OTP' },
  { key: 'checkEmailOtp', label: 'Email OTP' },
  { key: 'checkGovernmentId', label: 'Government ID' },
  { key: 'checkDegree', label: 'Degree' },
  { key: 'checkRegistrationCertificate', label: 'Registration Certificate' },
  { key: 'checkRegistrationNumber', label: 'Registration Number' },
];

function DocLink({ href, label }: { href?: string; label: string }) {
  if (!href) return <span className="text-xs text-muted-foreground">{label}: —</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function AdminDoctors() {
  const [filter, setFilter] = useState<DoctorStatus | 'ALL'>('DOCUMENTS_SUBMITTED');
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<DoctorVerificationModel[]>([]);
  const [selected, setSelected] = useState<DoctorVerificationModel | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminDoctors(filter === 'ALL' ? undefined : filter);
      setDoctors(list);
      if (selected) {
        const refreshed = list.find((d) => d.uuid === selected.uuid);
        setSelected(refreshed ?? list[0] ?? null);
      } else if (list.length) {
        setSelected(list[0]);
      } else {
        setSelected(null);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const visible = useMemo(
    () =>
      doctors.filter((d) =>
        matchesQuery(
          search,
          d.firstName,
          d.lastName,
          `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(),
          d.email,
          d.phoneNumber,
          d.registrationNumber,
          d.clinicName,
          d.clinicAddress,
          specializationLabel(d.specialization),
          d.uuid
        )
      ),
    [doctors, search]
  );

  useEffect(() => {
    if (!selected) {
      setSelected(visible[0] ?? null);
      return;
    }
    if (!visible.some((d) => d.uuid === selected.uuid)) {
      setSelected(visible[0] ?? null);
    }
  }, [visible, selected]);

  const toggleCheck = async (key: ChecklistKey, value: boolean) => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateDoctorChecklist(selected.uuid, { [key]: value });
      setSelected(updated);
      setDoctors((prev) => prev.map((d) => (d.uuid === updated.uuid ? updated : d)));
      toast.success('Checklist updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update checklist');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: DoctorStatus) => {
    if (!selected) return;
    if ((status === 'VERIFIED' || status === 'PUBLISHED') && !allApplicableChecksPassed(selected)) {
      toast.error('Complete all applicable checklist items before Verified / Published');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateDoctorStatus(selected.uuid, status, notes || undefined);
      setSelected(updated);
      toast.success(`Status → ${statusLabel(status)}`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const applicableChecks = selected
    ? CHECKLIST.filter((c) => isChecklistItemApplicable(selected, c.key))
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Doctor Verification</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Clinic-affiliated doctors appear first. Optional fields only show when provided.
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as DoctorStatus | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {DOCTOR_STATUS_STEPS.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search doctors by name, email, clinic, registration…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center text-muted-foreground text-sm">
            {search.trim() ? 'No doctors match this search.' : 'No doctors in this status.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {visible.map((d) => {
              const initials = `${d.firstName?.[0] ?? ''}${d.lastName?.[0] ?? ''}`.toUpperCase() || 'DR';
              return (
                <Card
                  key={d.uuid}
                  className={`border-0 shadow-sm cursor-pointer transition-colors ${
                    selected?.uuid === d.uuid ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelected(d);
                    setNotes(d.reviewNotes ?? '');
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        Dr. {d.firstName} {d.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {specializationLabel(d.specialization) || '—'} · {d.registrationNumber ?? '—'}
                      </p>
                      {d.clinicName && (
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {d.clinicName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {d.clinicPriority && (
                        <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-0">
                          Clinic
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {statusLabel(d.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selected && (
            <Card className="lg:col-span-3 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Dr. {selected.firstName} {selected.lastName}
                  {selected.clinicPriority && (
                    <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-0 font-normal">
                      Clinic priority
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selected.email} · {selected.phoneNumber}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {DOCTOR_STATUS_STEPS.map((s) => (
                    <Badge
                      key={s}
                      variant={selected.status === s ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {statusLabel(s)}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Registration:</span>{' '}
                    {selected.registrationNumber || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Affiliation:</span>{' '}
                    {selected.clinicName || 'Personal account (online consultation)'}
                  </p>
                  <DocLink href={selected.degreeCertificateUrl} label="Degree certificate" />
                  <DocLink
                    href={selected.registrationCertificateUrl}
                    label="Registration certificate"
                  />
                  <DocLink href={selected.governmentIdUrl} label="Government ID" />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Admin Verification Checklist</p>
                  <p className="text-xs text-muted-foreground">
                    Verify the doctor&apos;s credentials only. Clinic address, maps, and photos are
                    reviewed on the clinic account.
                  </p>
                  {applicableChecks.map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <Checkbox
                        id={c.key}
                        checked={Boolean(selected[c.key])}
                        disabled={saving}
                        onCheckedChange={(v) => void toggleCheck(c.key, v === true)}
                      />
                      <Label htmlFor={c.key} className="text-sm font-normal cursor-pointer">
                        {c.label}
                        {Boolean(selected[c.key]) && (
                          <Check className="inline h-3.5 w-3.5 ml-1 text-green-600" />
                        )}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Review notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes for this application…"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => void setStatus('UNDER_REVIEW')}
                  >
                    Mark Under Review
                  </Button>
                  <Button
                    size="sm"
                    disabled={saving || !allApplicableChecksPassed(selected)}
                    onClick={() => void setStatus('VERIFIED')}
                  >
                    Approve Verified
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving || selected.status !== 'VERIFIED'}
                    onClick={() => void setStatus('PUBLISHED')}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => void setStatus('REJECTED')}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
