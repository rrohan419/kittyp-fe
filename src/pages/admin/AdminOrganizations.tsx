import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2, MapPin, Phone, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  ClinicModel,
  fetchAdminClinics,
  updateAdminClinicStatus,
} from '@/services/clinicService';
import { CopyableId } from '@/components/ui/CopyableId';
import { ClinicHoursDisplay } from '@/components/clinic/ClinicHoursEditor';
import { parseOperatingHours } from '@/utils/clinicHours';
import { parseApiErrorMessage } from '@/utils/validation';
import { matchesQuery } from '@/utils/search';
import { Input } from '@/components/ui/input';

function clinicStatus(status?: string | null): string {
  return (status ?? 'PENDING').toUpperCase();
}

function statusBadgeClass(status?: string) {
  const normalized = clinicStatus(status);
  if (normalized === 'VERIFIED') {
    return 'bg-green-100 text-green-700 border-0 text-[10px]';
  }
  if (normalized === 'SHUTDOWN' || normalized === 'REJECTED') {
    return 'bg-red-100 text-red-700 border-0 text-[10px]';
  }
  return 'bg-amber-100 text-amber-700 border-0 text-[10px]';
}

export default function AdminOrganizations() {
  const [clinics, setClinics] = useState<ClinicModel[]>([]);
  const [selected, setSelected] = useState<ClinicModel | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminClinics();
      setClinics(list);
      setSelected((prev) => {
        if (prev) {
          return list.find((c) => c.uuid === prev.uuid) ?? list[0] ?? null;
        }
        return list[0] ?? null;
      });
    } catch (e: unknown) {
      toast.error(parseApiErrorMessage(e, 'Failed to load clinics'));
      setClinics([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () =>
      clinics.filter((c) => {
        const statusOk = filter === 'ALL' || clinicStatus(c.status) === filter;
        return (
          statusOk &&
          matchesQuery(
            search,
            c.name,
            c.city,
            c.address,
            c.email,
            c.phone,
            c.licenseNumber,
            c.uuid
          )
        );
      }),
    [clinics, filter, search]
  );

  useEffect(() => {
    if (!selected) {
      setSelected(visible[0] ?? null);
      return;
    }
    if (!visible.some((c) => c.uuid === selected.uuid)) {
      setSelected(visible[0] ?? null);
    }
  }, [visible, selected]);

  const setStatus = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await updateAdminClinicStatus(selected.uuid, status);
      setClinics((prev) => prev.map((c) => (c.uuid === updated.uuid ? updated : c)));
      setSelected(updated);
      setFilter(status);
      toast.success(status === 'VERIFIED' ? 'Clinic verified' : 'Clinic rejected');
    } catch (e: unknown) {
      toast.error(parseApiErrorMessage(e, 'Failed to update clinic status'));
    } finally {
      setSaving(false);
    }
  };

  const hours = selected ? parseOperatingHours(selected.operatingHours) : null;
  const selectedStatus = selected ? clinicStatus(selected.status) : '';
  const canVerify = selected && selectedStatus !== 'SHUTDOWN';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clinics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Verify a clinic before it can take appointments, bookings, or invite doctors.
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SHUTDOWN">Shutdown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clinics by name, city, email, phone, license…"
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
            {search.trim() ? 'No clinics match this search.' : 'No clinics in this status.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {visible.map((clinic) => (
              <Card
                key={clinic.uuid}
                className={`border-0 shadow-sm cursor-pointer transition-colors ${
                  selected?.uuid === clinic.uuid ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelected(clinic)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{clinic.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {clinic.city || clinic.address || '—'}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusBadgeClass(clinic.status)}>
                    {clinicStatus(clinic.status)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && (
            <Card className="lg:col-span-3 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selected.name}
                  {selected.personal && (
                    <Badge className="text-[10px] bg-amber-500/15 text-amber-700 border-0 font-normal">
                      Personal practice
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <CopyableId label="Clinic ID" value={selected.uuid} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span>{selected.address || selected.city || '—'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">City:</span> {selected.city || '—'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {selected.phone || '—'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    {selected.email || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">License:</span>{' '}
                    {selected.licenseNumber || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Timezone:</span>{' '}
                    {selected.timezone || '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">WhatsApp:</span>{' '}
                    {selected.whatsappConfigured ? 'Configured' : 'Not set'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span> {selectedStatus || '—'}
                  </p>
                </div>
                {hours && (
                  <div>
                    <p className="text-muted-foreground mb-2">Hours</p>
                    <ClinicHoursDisplay days={hours.days} legacyText={hours.legacyText} />
                  </div>
                )}
                {canVerify && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      disabled={saving || selectedStatus === 'VERIFIED'}
                      onClick={() => void setStatus('VERIFIED')}
                    >
                      Approve Verified
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={saving || selectedStatus === 'REJECTED'}
                      onClick={() => void setStatus('REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
