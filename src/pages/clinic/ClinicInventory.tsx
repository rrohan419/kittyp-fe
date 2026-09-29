import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, AlertTriangle, Boxes, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ListPager } from '@/components/ui/ListPager';
import {
  ClinicInventoryItem,
  ClinicInventoryRequest,
  createClinicInventoryItem,
  deleteClinicInventoryItem,
  fetchClinicInventory,
  updateClinicInventoryItem,
} from '@/services/clinicService';

const categoryLabels: Record<string, string> = { MEDICATION: 'Medication', SUPPLY: 'Supply', EQUIPMENT: 'Equipment', FOOD: 'Food' };
const emptyForm: ClinicInventoryRequest = { name: '', category: 'SUPPLY', quantity: 0, unit: 'pcs', reorderLevel: 0, unitPrice: 0, active: true };

export default function ClinicInventory() {
  const { clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [items, setItems] = useState<ClinicInventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicInventoryRequest>(emptyForm);
  const [editing, setEditing] = useState<ClinicInventoryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async (requestedPage: number) => {
    if (!clinicUuid) { setItems([]); setLoading(false); setTotalPages(0); setTotalItems(0); return; }
    setLoading(true); setError(null);
    try {
      const result = await fetchClinicInventory(clinicUuid, { pageNumber: requestedPage, pageSize: 20 });
      setItems(result.models);
      setPage(result.pageNumber ?? requestedPage);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalElements);
    } catch { setItems([]); setError('Inventory could not be loaded. Please try again.'); } finally { setLoading(false); }
  }, [clinicUuid]);
  useEffect(() => { void load(page); }, [load, page]);
  const lowStock = items.filter((item) => item.quantity < item.reorderLevel);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (item: ClinicInventoryItem) => { setEditing(item); setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, reorderLevel: item.reorderLevel, unitPrice: item.unitPrice, active: item.active }); setFormOpen(true); };
  const updateField = (field: keyof ClinicInventoryRequest, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!clinicUuid || !form.name.trim()) return; setSaving(true); try { if (editing) await updateClinicInventoryItem(clinicUuid, editing.uuid, form); else await createClinicInventoryItem(clinicUuid, { ...form, name: form.name.trim() }); setFormOpen(false); await load(page); toast.success(editing ? 'Inventory item updated' : 'Inventory item added'); } catch { toast.error('Could not save inventory item'); } finally { setSaving(false); } };
  const remove = async (item: ClinicInventoryItem) => { if (!clinicUuid || !window.confirm(`Delete ${item.name}?`)) return; setDeleting(item.uuid); try { await deleteClinicInventoryItem(clinicUuid, item.uuid); await load(page); toast.success('Inventory item deleted'); } catch { toast.error('Could not delete inventory item'); } finally { setDeleting(null); } };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">{totalItems} items · {lowStock.length} below reorder on this page</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void load(page)} disabled={!clinicUuid || loading} aria-label="Refresh inventory"><RefreshCw className="h-4 w-4" /></Button><Button size="sm" onClick={openCreate} disabled={!clinicUuid}><Plus className="h-4 w-4 mr-2" />Add Item</Button></div>
      </div>

      {clinicLoading || loading ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Loading live inventory...</div> : null}
      {!clinicLoading && !loading && !clinicUuid ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Select a clinic branch to manage inventory.</div> : null}
      {!loading && clinicUuid && error ? <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center"><p className="text-sm text-destructive">{error}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => void load(page)}>Try again</Button></div> : null}

      {lowStock.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-500/10">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{lowStock.length} items need reordering</p>
              <p className="text-xs text-muted-foreground mt-1">{lowStock.map((i) => i.name).join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Stock List</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-3 text-[11px] uppercase tracking-wide font-medium text-muted-foreground pb-2 border-b border-border">
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-2">Reorder Level</div>
              <div className="col-span-1 text-right">Price</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {items.map((i) => {
              const low = i.quantity < i.reorderLevel;
              return (
                <div key={i.uuid} className="grid grid-cols-12 gap-3 py-3 items-center border-b border-border last:border-0 text-sm">
                  <div className="col-span-3 flex items-center gap-2"><Boxes className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-medium truncate">{i.name}</span></div>
                  <div className="col-span-2"><Badge variant="secondary" className="bg-muted border-0 text-[10px]">{categoryLabels[i.category] || i.category}</Badge></div>
                  <div className={`col-span-2 font-medium ${low ? 'text-amber-600' : ''}`}>{i.quantity} {i.unit}</div>
                  <div className="col-span-2 text-muted-foreground">{i.reorderLevel} {i.unit}</div>
                  <div className="col-span-1 text-right font-medium">₹{i.unitPrice.toFixed(2)}</div>
                  <div className="col-span-2 flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(i)} aria-label={`Edit ${i.name}`}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void remove(i)} disabled={deleting === i.uuid} aria-label={`Delete ${i.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((i) => {
              const low = i.quantity < i.reorderLevel;
              return (
                <div key={i.uuid} className="p-3 rounded-xl bg-muted/40 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{categoryLabels[i.category] || i.category} · ₹{i.unitPrice.toFixed(2)}</p>
                    <div className="flex gap-1 mt-2"><Button variant="outline" size="sm" onClick={() => openEdit(i)}><Pencil className="h-3 w-3 mr-1" />Edit</Button><Button variant="outline" size="sm" onClick={() => void remove(i)} disabled={deleting === i.uuid}><Trash2 className="h-3 w-3 mr-1" />Delete</Button></div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${low ? 'text-amber-600' : ''}`}>{i.quantity} {i.unit}</p>
                    {low && <p className="text-[10px] text-amber-600">Reorder</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <ListPager page={page} totalPages={totalPages} totalElements={totalItems} noun="items" disabled={loading} onPageChange={setPage} />
        </CardContent>
      </Card>

      {formOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={save} className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg space-y-4"><h2 className="text-lg font-semibold">{editing ? 'Edit inventory item' : 'Add inventory item'}</h2><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><Label htmlFor="inventory-name">Name</Label><Input id="inventory-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></div><div><Label htmlFor="inventory-category">Category</Label><select id="inventory-category" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(event) => updateField('category', event.target.value)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><Label htmlFor="inventory-unit">Unit</Label><Input id="inventory-unit" value={form.unit} onChange={(event) => updateField('unit', event.target.value)} required /></div><div><Label htmlFor="inventory-quantity">Quantity</Label><Input id="inventory-quantity" type="number" min="0" value={form.quantity} onChange={(event) => updateField('quantity', Number(event.target.value))} required /></div><div><Label htmlFor="inventory-reorder">Reorder level</Label><Input id="inventory-reorder" type="number" min="0" value={form.reorderLevel} onChange={(event) => updateField('reorderLevel', Number(event.target.value))} required /></div><div><Label htmlFor="inventory-price">Unit price</Label><Input id="inventory-price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => updateField('unitPrice', Number(event.target.value))} required /></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save item'}</Button></div></form></div>}
    </div>
  );
}
