import { FormEvent, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  VaccineCatalogModel,
  VaccineScheduleModel,
  addClinicVaccineDue,
  fetchVaccineCatalog,
  markClinicVaccineGiven,
} from '@/services/clinicService';
import { uploadClinicalFiles } from '@/services/fileUploadService';
import { parseApiErrorMessage } from '@/utils/validation';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: unknown }; message?: string };
  const raw =
    typeof ax.response?.data === 'string'
      ? ax.response.data
      : ax.response?.data
        ? JSON.stringify(ax.response.data)
        : ax.message || '';
  return parseApiErrorMessage(raw, fallback);
}

export function VaccinationsTab({
  vaccinations,
  clinicUuid,
  petUuid,
  species,
  onSaved,
}: {
  vaccinations: VaccineScheduleModel[];
  clinicUuid: string;
  petUuid: string;
  species?: string;
  onSaved: () => Promise<void> | void;
}) {
  const [dueOpen, setDueOpen] = useState(false);
  const [givenOpen, setGivenOpen] = useState<VaccineScheduleModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<VaccineCatalogModel[]>([]);
  const [vaccineMasterId, setVaccineMasterId] = useState('');
  const [dueDate, setDueDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [givenDate, setGivenDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!dueOpen) return;
    let cancelled = false;
    fetchVaccineCatalog(clinicUuid, species)
      .then((rows) => {
        if (!cancelled) setCatalog(rows);
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiError(err, 'Failed to load vaccines'));
      });
    return () => {
      cancelled = true;
    };
  }, [dueOpen, clinicUuid, species]);

  const addDue = async (event: FormEvent) => {
    event.preventDefault();
    if (!vaccineMasterId) {
      toast.error('Select a vaccine');
      return;
    }
    setSaving(true);
    try {
      await addClinicVaccineDue(clinicUuid, petUuid, {
        vaccineMasterId: Number(vaccineMasterId),
        dueDate,
      });
      toast.success('Next due added');
      setDueOpen(false);
      setVaccineMasterId('');
      await onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Failed to add vaccine due'));
    } finally {
      setSaving(false);
    }
  };

  const markGiven = async (event: FormEvent) => {
    event.preventDefault();
    if (!givenOpen) return;
    setSaving(true);
    try {
      let certificateUrl: string | undefined;
      if (file) {
        const urls = await uploadClinicalFiles([file], {
          clinicUuid,
          petUuid,
          kind: 'vaccines',
        });
        certificateUrl = urls[0];
      }
      await markClinicVaccineGiven(clinicUuid, petUuid, givenOpen.id, {
        completedDate: givenDate,
        certificateUrl,
      });
      toast.success('Marked as given');
      setGivenOpen(null);
      setFile(null);
      await onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Failed to mark vaccine given'));
    } finally {
      setSaving(false);
    }
  };

  const due = vaccinations.filter((v) => !v.completed);
  const given = vaccinations.filter((v) => v.completed);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDueOpen(true)}>
          Add next due
        </Button>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Due</p>
        {due.length ? (
          due.map((v) => (
            <Card key={v.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{v.vaccineName}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {v.dueDate ? format(parseISO(v.dueDate), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Due</Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setGivenDate(format(new Date(), 'yyyy-MM-dd'));
                      setFile(null);
                      setGivenOpen(v);
                    }}
                  >
                    Mark given
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No vaccines due.</p>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">Given</p>
        {given.length ? (
          given.map((v) => (
            <Card key={v.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{v.vaccineName}</p>
                  <p className="text-xs text-muted-foreground">
                    Given {v.completedDate ? format(parseISO(v.completedDate), 'MMM d, yyyy') : '—'}
                  </p>
                  {v.certificateUrl && (
                    <a
                      href={v.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Certificate
                    </a>
                  )}
                </div>
                <Badge variant="secondary">Given</Badge>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No vaccines marked given yet.</p>
        )}
      </section>

      <Dialog open={dueOpen} onOpenChange={(next) => !saving && setDueOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add next due</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={addDue}>
            <div className="space-y-2">
              <Label>Vaccine</Label>
              <Select value={vaccineMasterId} onValueChange={setVaccineMasterId}>
                <SelectTrigger>
                  <SelectValue placeholder={catalog.length ? 'Select vaccine' : 'No vaccines in catalog'} />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setDueOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !catalog.length}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!givenOpen} onOpenChange={(next) => !saving && !next && setGivenOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {givenOpen?.vaccineName} given</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={markGiven}>
            <div className="space-y-2">
              <Label>Given date</Label>
              <DatePicker value={givenDate} onChange={setGivenDate} disableFuture />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaccine-cert">Certificate (optional)</Label>
              <Input
                id="vaccine-cert"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setGivenOpen(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mark given
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
