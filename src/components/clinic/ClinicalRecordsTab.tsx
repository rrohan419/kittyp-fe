import { FormEvent, useMemo, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ClinicalRecordModel,
  ClinicVisitModel,
  createClinicClinicalRecord,
} from '@/services/clinicService';
import { uploadClinicalFiles } from '@/services/fileUploadService';
import { parseApiErrorMessage } from '@/utils/validation';
import { toast } from 'sonner';

type Kind = 'labs' | 'surgeries';

function visitLabel(visit: ClinicVisitModel): string {
  const when = visit.completedAt || visit.startedAt || visit.createdAt;
  const date = when ? format(parseISO(when), 'MMM d, yyyy') : 'Visit';
  const doctor = visit.doctorName
    ? ` · Dr. ${visit.doctorName.replace(/^Dr\.?\s*/i, '')}`
    : '';
  return `${date}${doctor}`;
}

function fileLabel(url: string, index: number): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split('/').pop() || '');
    return name || `File ${index + 1}`;
  } catch {
    return `File ${index + 1}`;
  }
}

export function ClinicalRecordsTab({
  kind,
  records,
  visits,
  clinicUuid,
  petUuid,
  onSaved,
}: {
  kind: Kind;
  records: ClinicalRecordModel[];
  visits: ClinicVisitModel[];
  clinicUuid: string;
  petUuid: string;
  onSaved: () => Promise<void> | void;
}) {
  const isLabs = kind === 'labs';
  const label = isLabs ? 'lab report' : 'surgery';
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [visitUuid, setVisitUuid] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const visitRequired = isLabs && visits.length > 0;
  const visitById = useMemo(() => new Map(visits.map((v) => [v.uuid, v])), [visits]);

  const reset = () => {
    setTitle('');
    setNotes('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setVisitUuid('');
    setFile(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (visitRequired && !visitUuid) {
      toast.error('Select the visit this report belongs to');
      return;
    }
    if (!isLabs && !title.trim()) {
      toast.error('Enter the procedure name');
      return;
    }
    setSaving(true);
    try {
      let attachments: string[] = [];
      if (file) {
        attachments = await uploadClinicalFiles([file], {
          clinicUuid,
          petUuid,
          kind,
          visitUuid: visitUuid || undefined,
        });
      }
      await createClinicClinicalRecord(clinicUuid, petUuid, {
        type: isLabs ? 'LAB_REPORT' : 'SURGERY',
        title: title.trim() || (isLabs ? 'Lab report' : 'Surgery'),
        description: notes.trim() || undefined,
        date,
        visitUuid: visitUuid || undefined,
        attachments,
      });
      toast.success(isLabs ? 'Lab report added' : 'Surgery recorded');
      setOpen(false);
      reset();
      await onSaved();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, `Failed to save ${label}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          {isLabs ? 'Upload lab report' : 'Add surgery'}
        </Button>
      </div>

      {records.length ? (
        records.map((record) => {
          const visit = record.visitUuid ? visitById.get(record.visitUuid) : undefined;
          return (
            <Card key={record.uuid} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{record.title || (isLabs ? 'Lab report' : 'Surgery')}</p>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {record.date ? format(parseISO(record.date), 'MMM d, yyyy') : '—'}
                  </Badge>
                </div>
                {visit && (
                  <p className="text-xs text-muted-foreground">Visit: {visitLabel(visit)}</p>
                )}
                {record.attachments?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {record.attachments.map((url, index) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        {fileLabel(url, index)}
                      </a>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No {isLabs ? 'lab reports' : 'surgeries'} recorded yet.
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!saving) {
            setOpen(next);
            if (!next) reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isLabs ? 'Upload lab report' : 'Add surgery'}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor={`${kind}-title`}>{isLabs ? 'Title' : 'Procedure'}</Label>
              <Input
                id={`${kind}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isLabs ? 'CBC, culture…' : 'Spay, mass removal…'}
              />
            </div>
            {visits.length > 0 && (
              <div className="space-y-2">
                <Label>Visit {visitRequired ? '' : '(optional)'}</Label>
                <Select
                  value={visitUuid || (visitRequired ? undefined : 'none')}
                  onValueChange={(value) => setVisitUuid(value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a visit" />
                  </SelectTrigger>
                  <SelectContent>
                    {!visitRequired && <SelectItem value="none">Not linked to a visit</SelectItem>}
                    {visits.map((visit) => (
                      <SelectItem key={visit.uuid} value={visit.uuid}>
                        {visitLabel(visit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{isLabs ? 'Result date' : 'Surgery date'}</Label>
              <DatePicker value={date} onChange={setDate} disableFuture />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${kind}-notes`}>Notes</Label>
              <Textarea
                id={`${kind}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${kind}-file`}>{isLabs ? 'PDF or image' : 'File (optional)'}</Label>
              <Input
                id={`${kind}-file`}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
