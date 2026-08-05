import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { shutdownClinic, reopenClinic } from '@/services/clinicService';
import { Link } from 'react-router-dom';

export default function ClinicSettings() {
  const { clinic, clinicUuid, refresh } = useActiveClinic();
  const [acting, setActing] = useState(false);
  const isShutdown = clinic?.status === 'SHUTDOWN';

  const handleShutdown = async () => {
    if (!clinicUuid) return;
    if (!window.confirm('Shut down this clinic? Records stay readable but new writes will be blocked.')) return;
    setActing(true);
    try {
      await shutdownClinic(clinicUuid);
      await refresh();
      toast.success('Clinic shut down');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to shut down clinic');
    } finally {
      setActing(false);
    }
  };

  const handleReopen = async () => {
    if (!clinicUuid) return;
    setActing(true);
    try {
      await reopenClinic(clinicUuid);
      await refresh();
      toast.success('Clinic reopened');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reopen clinic');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clinic Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinic?.name ?? 'Manage your clinic profile'} — switch branches from the top bar
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Multi-clinic</CardTitle>
          <CardDescription>
            Switch clinics from the top bar, or add another clinic under this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to="/clinic/clinics/new">
              <Plus className="h-4 w-4 mr-2" />
              Add another clinic
            </Link>
          </Button>
        </CardContent>
      </Card>

      {isShutdown && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This clinic is shut down. History is read-only until reopened.
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Clinic Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Clinic Name</Label>
              <Input value={clinic?.name ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={clinic?.licenseNumber ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={clinic?.email ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={clinic?.phone ?? ''} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={clinic?.address ?? ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Operating Hours</Label>
            <Textarea rows={4} value={clinic?.operatingHours ?? ''} readOnly className="resize-none" />
          </div>
          <p className={`text-xs ${isShutdown ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>
            Status: {clinic?.status ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Clinic lifecycle</CardTitle>
          <CardDescription>
            Shutting down archives the clinic without deleting data. Other clinics stay unaffected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {isShutdown ? (
            <Button onClick={handleReopen} disabled={acting || !clinicUuid}>
              Reopen clinic
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleShutdown} disabled={acting || !clinicUuid}>
              Shut down clinic
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
