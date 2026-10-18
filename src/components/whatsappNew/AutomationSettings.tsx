import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Clock3, MoonStar, FileCheck2, CheckCircle2 } from 'lucide-react';

export interface AutomationConfig {
  key: string;
  title: string;
  timing: string;
  timingOptions: string[];
  quietHours: string;
  templateId?: string;
}

const QUIET_OPTIONS = ['None', '10 PM – 8 AM', '9 PM – 9 AM'];

export function AutomationSettings({ open, onOpenChange, automation, approvedTemplates, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  automation: AutomationConfig | null;
  approvedTemplates: { id: string; name: string }[];
  onSave: (patch: { timing: string; quietHours: string; templateId?: string }) => void;
}) {
  const [timing, setTiming] = useState('');
  const [quiet, setQuiet] = useState('None');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open && automation) {
      setTiming(automation.timing);
      setQuiet(automation.quietHours);
      setTemplateId(automation.templateId ?? approvedTemplates[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, automation]);

  if (!automation) return null;

  const submit = () => {
    onSave({ timing, quietHours: quiet, templateId });
    toast.success('Automation updated', { description: automation.title });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{automation.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-1">
          <section className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />When should it send?
            </p>
            <div className="flex flex-wrap gap-2">
              {automation.timingOptions.map((t) => (
                <button key={t} type="button" onClick={() => setTiming(t)}
                  className={cn('px-3 h-9 rounded-full text-sm border transition-colors',
                    timing === t ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted')}>
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MoonStar className="h-4 w-4 text-primary" />Quiet hours
            </p>
            <p className="text-xs text-muted-foreground">
              Messages pause during these hours and go out the next morning.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUIET_OPTIONS.map((q) => (
                <button key={q} type="button" onClick={() => setQuiet(q)}
                  className={cn('px-3 h-9 rounded-full text-sm border transition-colors',
                    quiet === q ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-muted')}>
                  {q === 'None' ? 'No quiet hours' : q}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />Template to use
            </p>
            {approvedTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-xl bg-muted p-3">
                No approved template for this yet — create one in the Templates tab.
              </p>
            ) : (
              <div className="space-y-2">
                {approvedTemplates.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTemplateId(t.id)}
                    className={cn('w-full flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-colors min-h-[44px]',
                      templateId === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted')}>
                    <CheckCircle2 className={cn('h-4 w-4 shrink-0', templateId === t.id ? 'text-primary' : 'text-muted-foreground/40')} />
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit}>Save changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
