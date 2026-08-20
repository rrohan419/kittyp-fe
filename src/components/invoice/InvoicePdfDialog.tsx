import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  invoiceUuid: string | null;
  onOpenChange: (open: boolean) => void;
  fetchUrl: (invoiceUuid: string) => Promise<string>;
};

export function InvoicePdfDialog({ open, invoiceUuid, onOpenChange, fetchUrl }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !invoiceUuid) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    void fetchUrl(invoiceUuid)
      .then((next) => {
        if (!cancelled) setUrl(next);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('PDF not available yet — generate it first');
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // fetchUrl is memoized by callers; onOpenChange is not used as a fetch trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceUuid, fetchUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 rounded-md border bg-muted/30 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : url ? (
            <iframe title="Invoice PDF" src={url} className="h-full w-full border-0" />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
