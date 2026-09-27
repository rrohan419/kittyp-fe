import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Boxes,
  Loader2,
  ScanBarcode,
  ArrowLeftRight,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicInventoryItem,
  ClinicInventoryItemRequest,
  InventoryAlert,
  InventoryDashboard,
  InventoryMovementRequest,
  InventoryMovementType,
  InventoryWeeklyReport,
  createClinicInventoryItem,
  createInventoryMovement,
  fetchClinicInventory,
  fetchInventoryAlerts,
  fetchInventoryDashboard,
  fetchInventoryWeeklyReport,
  scanInventoryBarcode,
} from '@/services/clinicService';

const categoryLabels: Record<string, string> = {
  medication: 'Medication',
  supply: 'Supply',
  equipment: 'Equipment',
  food: 'Food',
};

const EMPTY_FORM: ClinicInventoryItemRequest = {
  name: '',
  category: 'medication',
  stock: 0,
  price: 0,
  unit: 'pcs',
  minStock: 0,
};

function stockBadge(status?: string) {
  if (status === 'OUT_OF_STOCK') return <Badge variant="destructive">Out of stock</Badge>;
  if (status === 'LOW_STOCK')
    return <Badge className="bg-amber-500/15 text-amber-700 border-0">Low stock</Badge>;
  return <Badge variant="secondary" className="border-0">In stock</Badge>;
}

function expiryBadge(status?: string) {
  if (status === 'EXPIRED') return <Badge variant="destructive">Expired</Badge>;
  if (status === 'EXPIRING_SOON')
    return <Badge className="bg-orange-500/15 text-orange-700 border-0">Expiring soon</Badge>;
  return null;
}

export default function ClinicInventory() {
  const { clinicUuid } = useActiveClinic();
  const [items, setItems] = useState<ClinicInventoryItem[]>([]);
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [weekly, setWeekly] = useState<InventoryWeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ClinicInventoryItemRequest>(EMPTY_FORM);
  const [addFromScan, setAddFromScan] = useState(false);
  const [q, setQ] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [scanBuffer, setScanBuffer] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [moveForm, setMoveForm] = useState<{
    itemUuid: string;
    type: InventoryMovementType;
    quantity: number;
    notes: string;
  }>({ itemUuid: '', type: 'STOCK_IN', quantity: 1, notes: '' });

  const load = useCallback(async () => {
    if (!clinicUuid) {
      setItems([]);
      setDashboard(null);
      return;
    }
    setLoading(true);
    try {
      const [list, dash, alertList] = await Promise.all([
        fetchClinicInventory(clinicUuid, {
          q,
          stockStatus: stockFilter === 'all' ? undefined : stockFilter,
          expiryStatus: expiryFilter === 'all' ? undefined : expiryFilter,
        }),
        fetchInventoryDashboard(clinicUuid),
        fetchInventoryAlerts(clinicUuid),
      ]);
      setItems(list);
      setDashboard(dash);
      setAlerts(alertList);
    } catch {
      toast.error('Could not load inventory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [clinicUuid, q, stockFilter, expiryFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddFromScan(false);
    setDialogOpen(true);
  };

  const submitItem = async () => {
    if (!clinicUuid) {
      toast.error('Select a clinic first');
      return;
    }
    const name = form.name.trim();
    if (!name) {
      toast.error('Item name is required');
      return;
    }
    if (form.stock < 0 || form.price < 0) {
      toast.error('Stock and price cannot be negative');
      return;
    }
    setSaving(true);
    try {
      await createClinicInventoryItem(clinicUuid, {
        ...form,
        name,
        unit: 'pcs',
        barcode: addFromScan ? form.barcode : undefined,
      });
      toast.success('Item added');
      setDialogOpen(false);
      setScanOpen(false);
      setAddFromScan(false);
      await load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(ax.response?.data?.message || ax.message || 'Could not add item');
    } finally {
      setSaving(false);
    }
  };

  const runScan = async (code: string) => {
    if (!clinicUuid || !code.trim()) return;
    try {
      const result = await scanInventoryBarcode(clinicUuid, code.trim());
      if (result.found && result.item) {
        setForm({
          name: result.item.name,
          category: result.item.category || 'medication',
          stock: 0,
          price: Number(result.item.price) || 0,
          unit: 'pcs',
          minStock: result.item.minStock ?? 0,
          barcode: result.rawCode,
          gtin: result.gtin || result.item.gtin,
          manufacturer: result.item.manufacturer,
          purchasePrice: result.item.purchasePrice,
          lotNumber: result.lotNumber || undefined,
          expiresOn: result.expiresOn || undefined,
        });
        toast.message('Product found — add stock quantity and save');
      } else {
        setForm({
          ...EMPTY_FORM,
          unit: 'pcs',
          barcode: result.rawCode,
          gtin: result.gtin || undefined,
          lotNumber: result.lotNumber || undefined,
          expiresOn: result.expiresOn || undefined,
        });
        toast.message('No match — fill product details');
      }
      setAddFromScan(true);
      setScanOpen(false);
      setDialogOpen(true);
    } catch {
      toast.error('Barcode lookup failed');
    }
  };

  const submitMove = async () => {
    if (!clinicUuid || !moveForm.itemUuid) {
      toast.error('Select an item');
      return;
    }
    setSaving(true);
    try {
      const payload: InventoryMovementRequest = {
        itemUuid: moveForm.itemUuid,
        type: moveForm.type,
        quantity: moveForm.quantity,
        notes: moveForm.notes || undefined,
      };
      await createInventoryMovement(clinicUuid, payload);
      toast.success('Stock updated');
      setMoveOpen(false);
      await load();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(ax.response?.data?.message || ax.message || 'Movement failed');
    } finally {
      setSaving(false);
    }
  };

  const openWeekly = async () => {
    if (!clinicUuid) return;
    try {
      setWeekly(await fetchInventoryWeeklyReport(clinicUuid));
      setWeeklyOpen(true);
    } catch {
      toast.error('Could not load weekly report');
    }
  };

  const attention = useMemo(() => {
    if (!dashboard) return null;
    return `${dashboard.lowStockCount} low · ${dashboard.expiringSoonCount} expiring · ${dashboard.expiredCount} expired`;
  }, [dashboard]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {loading ? 'Loading…' : attention || `${items.length} items`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setAlertsOpen(true)} disabled={!clinicUuid}>
            <Bell className="h-4 w-4 mr-2" />
            Alerts{alerts.length ? ` (${alerts.length})` : ''}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void openWeekly()} disabled={!clinicUuid}>
            Weekly report
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)} disabled={!clinicUuid}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Stock movement
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setScanBuffer('');
              setScanOpen(true);
              setTimeout(() => scanInputRef.current?.focus(), 100);
            }}
            disabled={!clinicUuid}
          >
            <ScanBarcode className="h-4 w-4 mr-2" />
            Scan barcode
          </Button>
          <Button size="sm" onClick={openAdd} disabled={!clinicUuid || loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add inventory
          </Button>
        </div>
      </div>

      {!clinicUuid ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Select a clinic to manage inventory.
          </CardContent>
        </Card>
      ) : null}

      {dashboard ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total items', value: dashboard.totalItems },
            { label: 'Low stock', value: dashboard.lowStockCount },
            { label: 'Expiring soon', value: dashboard.expiringSoonCount },
            { label: 'Expired', value: dashboard.expiredCount },
          ].map((c) => (
            <Card key={c.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="text-2xl font-semibold mt-1">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {dashboard && (dashboard.lowStockCount > 0 || dashboard.expiredCount > 0) ? (
        <Card className="border-0 shadow-sm bg-amber-500/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Needs attention today</p>
              <p className="text-muted-foreground mt-1">
                {dashboard.lowStockCount} low in stock · {dashboard.expiringSoonCount} expiring ·{' '}
                {dashboard.expiredCount} expired
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {dashboard && (dashboard.recentMovements || []).length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboard.recentMovements.slice(0, 8).map((m) => (
              <div
                key={m.uuid}
                className="flex justify-between gap-2 border-b border-border last:border-0 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.itemName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.type} · {m.notes || '—'}
                  </p>
                </div>
                <span className="shrink-0 font-medium">{Number(m.quantity)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 space-y-3">
          <CardTitle className="text-base font-semibold">Stock list</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search name, barcode, manufacturer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="LOW_STOCK">Low stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
                <SelectItem value="IN_STOCK">In stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All expiry</SelectItem>
                <SelectItem value="EXPIRING_SOON">Expiring soon</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No inventory items yet. Click Add Inventory to create one.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="grid grid-cols-12 gap-3 text-[11px] uppercase tracking-wide font-medium text-muted-foreground pb-2 border-b border-border">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Price</div>
                </div>
                {items.map((i) => (
                  <div
                    key={i.uuid}
                    className="grid grid-cols-12 gap-3 py-3 items-center border-b border-border last:border-0 text-sm"
                  >
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <Boxes className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {i.manufacturer || i.barcode || i.unit || '—'}
                          {i.earliestExpiry ? ` · exp ${i.earliestExpiry}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="secondary" className="bg-muted border-0 text-[10px]">
                        {categoryLabels[i.category] || i.category}
                      </Badge>
                    </div>
                    <div className="col-span-2 font-medium">
                      {Number(i.stock)} {i.unit || ''}
                      {i.minStock != null ? (
                        <span className="text-[11px] text-muted-foreground block">min {i.minStock}</span>
                      ) : null}
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {stockBadge(i.stockStatus)}
                      {expiryBadge(i.expiryStatus)}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      ₹{Number(i.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-3">
                {items.map((i) => (
                  <div
                    key={i.uuid}
                    className="p-3 rounded-xl bg-muted/40 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{i.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {categoryLabels[i.category] || i.category} · ₹{Number(i.price).toFixed(2)}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {stockBadge(i.stockStatus)}
                        {expiryBadge(i.expiryStatus)}
                      </div>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      {Number(i.stock)} {i.unit || ''}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / edit from scan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add inventory item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {addFromScan ? (
              <div className="space-y-2">
                <Label htmlFor="inv-barcode">Barcode</Label>
                <Input
                  id="inv-barcode"
                  value={form.barcode || ''}
                  onChange={(e) => setForm((s) => ({ ...s, barcode: e.target.value }))}
                  placeholder="Scanned code"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="inv-name">Product / medicine</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Amoxicillin 250mg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-mfr">Manufacturer</Label>
                <Input
                  id="inv-mfr"
                  value={form.manufacturer || ''}
                  onChange={(e) => setForm((s) => ({ ...s, manufacturer: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-lot">Batch / lot</Label>
              <Input
                id="inv-lot"
                value={form.lotNumber || ''}
                onChange={(e) => setForm((s) => ({ ...s, lotNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-mfg">Manufacturing date</Label>
                <Input
                  id="inv-mfg"
                  type="date"
                  value={form.manufacturedOn || ''}
                  onChange={(e) => setForm((s) => ({ ...s, manufacturedOn: e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-exp">Expiry date</Label>
                <Input
                  id="inv-exp"
                  type="date"
                  value={form.expiresOn || ''}
                  onChange={(e) => setForm((s) => ({ ...s, expiresOn: e.target.value || undefined }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-stock">Quantity</Label>
                <Input
                  id="inv-stock"
                  type="text"
                  inputMode="decimal"
                  value={String(form.stock)}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/[^\d.]/g, ''));
                    setForm((s) => ({ ...s, stock: Number.isFinite(n) ? n : 0 }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-min">Minimum stock</Label>
                <Input
                  id="inv-min"
                  type="text"
                  inputMode="numeric"
                  value={String(form.minStock ?? 0)}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      minStock: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-price">Sell price (₹)</Label>
                <Input
                  id="inv-price"
                  type="text"
                  inputMode="decimal"
                  value={String(form.price)}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/[^\d.]/g, ''));
                    setForm((s) => ({ ...s, price: Number.isFinite(n) ? n : 0 }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-cost">Purchase price (₹)</Label>
                <Input
                  id="inv-cost"
                  type="text"
                  inputMode="decimal"
                  value={form.purchasePrice != null ? String(form.purchasePrice) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d.]/g, '');
                    const n = Number(raw);
                    setForm((s) => ({
                      ...s,
                      purchasePrice: raw === '' ? undefined : Number.isFinite(n) ? n : undefined,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void submitItem()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan barcode</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Focus the field and scan with a USB/Bluetooth wedge scanner, or type the code and press Enter.
          </p>
          <Input
            ref={scanInputRef}
            value={scanBuffer}
            onChange={(e) => setScanBuffer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runScan(scanBuffer);
              }
            }}
            placeholder="Waiting for scan…"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void runScan(scanBuffer)} disabled={!scanBuffer.trim()}>
              Look up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Item</Label>
              <Select
                value={moveForm.itemUuid}
                onValueChange={(v) => setMoveForm((s) => ({ ...s, itemUuid: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.uuid} value={i.uuid}>
                      {i.name} ({Number(i.stock)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={moveForm.type}
                onValueChange={(v) =>
                  setMoveForm((s) => ({ ...s, type: v as InventoryMovementType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK_IN">Stock in</SelectItem>
                  <SelectItem value="STOCK_OUT">Stock out</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment (set lot qty)</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={String(moveForm.quantity)}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^\d.]/g, ''));
                  setMoveForm((s) => ({ ...s, quantity: Number.isFinite(n) ? n : 0 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={moveForm.notes}
                onChange={(e) => setMoveForm((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitMove()} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inventory alerts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open alerts</p>
            ) : (
              alerts.map((a, idx) => (
                <div key={`${a.alertType}-${a.itemUuid}-${idx}`} className="p-3 rounded-lg bg-muted/40 text-sm">
                  <p className="font-medium text-xs text-muted-foreground">{a.alertType}</p>
                  <p>{a.message}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={weeklyOpen} onOpenChange={setWeeklyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly inventory report</DialogTitle>
          </DialogHeader>
          {weekly ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                {weekly.weekStart} → {weekly.weekEnd} · Added {Number(weekly.stockAdded)} · Consumed{' '}
                {Number(weekly.stockConsumed)}
              </p>
              {dashboard ? (
                <section>
                  <p className="font-medium mb-1">Consumption</p>
                  <p className="text-muted-foreground text-xs mb-2">
                    7d: {Number(dashboard.consumed7d || 0)} · 30d:{' '}
                    {Number(dashboard.consumed30d || 0)} · 90d: {Number(dashboard.consumed90d || 0)}
                  </p>
                </section>
              ) : null}
              <section>
                <p className="font-medium mb-1">Low stock</p>
                <ul className="space-y-1">
                  {weekly.lowStock.map((i) => (
                    <li key={i.uuid}>
                      {i.name} — {Number(i.stock)} remaining
                    </li>
                  ))}
                  {weekly.lowStock.length === 0 ? <li className="text-muted-foreground">None</li> : null}
                </ul>
              </section>
              <section>
                <p className="font-medium mb-1">Expiring soon</p>
                <ul className="space-y-1">
                  {weekly.expiringSoon.map((l) => (
                    <li key={l.uuid}>
                      {l.itemName} — expires {l.expiresOn}
                    </li>
                  ))}
                  {weekly.expiringSoon.length === 0 ? (
                    <li className="text-muted-foreground">None</li>
                  ) : null}
                </ul>
              </section>
              <section>
                <p className="font-medium mb-1">Most consumed (this week)</p>
                <ul className="space-y-1">
                  {weekly.mostConsumed.map((r) => (
                    <li key={r.itemUuid}>
                      {r.name} — {Number(r.quantity)}
                    </li>
                  ))}
                  {weekly.mostConsumed.length === 0 ? (
                    <li className="text-muted-foreground">None</li>
                  ) : null}
                </ul>
              </section>
              <section>
                <p className="font-medium mb-1">Least consumed (this week)</p>
                <ul className="space-y-1">
                  {weekly.leastConsumed.map((r) => (
                    <li key={`least-${r.itemUuid}`}>
                      {r.name} — {Number(r.quantity)}
                    </li>
                  ))}
                  {weekly.leastConsumed.length === 0 ? (
                    <li className="text-muted-foreground">None</li>
                  ) : null}
                </ul>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
