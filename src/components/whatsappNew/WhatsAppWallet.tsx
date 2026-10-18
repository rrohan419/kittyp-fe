import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Wallet, Plus, TrendingDown, MessageSquare, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';

type Txn = { id: string; type: 'credit' | 'debit'; label: string; amount: number; date: string; count?: number };

const RATES = [
  { label: 'Utility (invoice, reminders)', price: 0.12 },
  { label: 'Marketing (offers)', price: 0.86 },
  { label: 'Replies within 24h', price: 0 },
];

const INITIAL_TXNS: Txn[] = [
  { id: 't1', type: 'debit', label: 'Vaccine reminders', amount: 38.4, date: 'Today', count: 320 },
  { id: 't2', type: 'debit', label: 'Invoices sent', amount: 14.4, date: 'Yesterday', count: 120 },
  { id: 't3', type: 'credit', label: 'Funds added via UPI', amount: 1000, date: '22 Sep' },
  { id: 't4', type: 'debit', label: 'Festive offer campaign', amount: 172, date: '20 Sep', count: 200 },
  { id: 't5', type: 'debit', label: 'Follow-up reminders', amount: 9.6, date: '18 Sep', count: 80 },
];

const SPEND_BREAKDOWN = [
  { label: 'Reminders', value: 412 },
  { label: 'Invoices', value: 186 },
  { label: 'Offers', value: 344 },
  { label: 'Follow-ups', value: 98 },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function WhatsAppWallet() {
  const [balance, setBalance] = useState(1265.6);
  const [txns, setTxns] = useState<Txn[]>(INITIAL_TXNS);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [paying, setPaying] = useState(false);

  const monthSpent = useMemo(() => SPEND_BREAKDOWN.reduce((s, x) => s + x.value, 0), []);
  const maxSpend = Math.max(...SPEND_BREAKDOWN.map((s) => s.value));
  const estMessages = Math.floor(balance / 0.12);
  const low = balance < 500;

  const pay = () => {
    const amt = Number(amount);
    if (!amt || amt < 100 || amt > 100000) {
      toast.error('Enter an amount between ₹100 and ₹1,00,000');
      return;
    }
    setPaying(true);
    setTimeout(() => {
      setBalance((b) => b + amt);
      setTxns((t) => [{ id: crypto.randomUUID(), type: 'credit', label: `Funds added via ${method.toUpperCase()}`, amount: amt, date: 'Just now' }, ...t]);
      setPaying(false);
      setOpen(false);
      toast.success(`${inr(amt)} added to your wallet`);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl bg-primary text-primary-foreground p-5 sm:p-6 flex flex-col justify-between gap-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80 flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet balance</p>
              <p className="text-4xl font-bold mt-1">{inr(balance)}</p>
              <p className="text-sm opacity-80 mt-1">≈ {estMessages.toLocaleString('en-IN')} utility messages left</p>
            </div>
            {low && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Low</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000].map((v) => (
              <Button key={v} variant="secondary" size="sm" onClick={() => { setAmount(String(v)); setOpen(true); }}>+ {inr(v)}</Button>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add funds</Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Spent this month</p>
          <p className="text-3xl font-bold">{inr(monthSpent)}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4" /> 4,210 messages sent</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Where your money goes</h3>
          <div className="space-y-3">
            {SPEND_BREAKDOWN.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="font-medium">{inr(s.value)}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(s.value / maxSpend) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold mb-4">Price per message</h3>
          <div className="divide-y">
            {RATES.map((r) => (
              <div key={r.label} className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium">{r.price === 0 ? 'Free' : inr(r.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Recent activity</h3>
        <div className="divide-y">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3">
              <div className={cn('h-9 w-9 rounded-full flex items-center justify-center', t.type === 'credit' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {t.type === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.date}{t.count ? ` · ${t.count} messages` : ''}</p>
              </div>
              <span className={cn('text-sm font-semibold', t.type === 'credit' ? 'text-primary' : 'text-foreground')}>
                {t.type === 'credit' ? '+' : '−'}{inr(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add funds to wallet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (₹)</Label>
              <Input id="amt" type="number" min={100} max={100000} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map((v) => (
                  <Button key={v} type="button" variant={amount === String(v) ? 'default' : 'outline'} size="sm" onClick={() => setAmount(String(v))}>{inr(v)}</Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">≈ {Math.floor((Number(amount) || 0) / 0.12).toLocaleString('en-IN')} utility messages</p>
            </div>
            <div className="space-y-2">
              <Label>Pay with</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['upi', 'card', 'netbanking'] as const).map((m) => (
                  <Button key={m} type="button" variant={method === m ? 'default' : 'outline'} size="sm" onClick={() => setMethod(m)}>
                    {m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : 'Net banking'}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={pay} disabled={paying}>{paying ? 'Processing…' : `Pay ${inr(Number(amount) || 0)}`}</Button>
            <p className="text-xs text-center text-muted-foreground">Secure payment. Funds are used only for WhatsApp messages.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
