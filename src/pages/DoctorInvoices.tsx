import { useEffect, useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ConsultationInvoice,
  createConsultationInvoice,
  fetchMyInvoices,
} from '@/services/invoiceService';

export default function DoctorInvoices() {
  const [petName, setPetName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Consultation');
  const [invoices, setInvoices] = useState<ConsultationInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setInvoices(await fetchMyInvoices());
    } catch {
      setInvoices([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName || !amount) {
      toast.error('Pet name and amount are required');
      return;
    }
    setLoading(true);
    try {
      await createConsultationInvoice({
        amount: Number(amount),
        currency: 'INR',
        notes: `${description} — ${petName}`,
        lineItems: JSON.stringify([{ description, petName, amount: Number(amount) }]),
      });
      toast.success('Draft invoice created');
      setPetName('');
      setAmount('');
      await load();
    } catch {
      toast.error('Failed to create invoice — ensure you are logged in as a doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quick invoices for consultations and treatments.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Quick create
          </CardTitle>
          <CardDescription>Generate a draft consultation invoice in seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={createDraft} className="space-y-4">
            <div className="space-y-2">
              <Label>Pet name</Label>
              <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Whiskers" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (INR)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" />
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4 mr-1.5" />
              {loading ? 'Creating…' : 'Create draft invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!invoices.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.uuid} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{inv.notes || inv.uuid}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.amount} {inv.currency || 'INR'}
                  </p>
                </div>
                <Badge variant="secondary">{inv.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
