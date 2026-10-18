import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Minus, AlertTriangle, Boxes, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ListPager } from '@/components/ui/ListPager';
import { useAppSelector } from '@/module/store/hooks';
import { hasRole, ROLES } from '@/utils/roles';
import {
  ClinicInventoryItem,
  ClinicInventoryMovement,
  ClinicInventoryRequest,
  adjustClinicInventoryStock,
  createClinicInventoryItem,
  deleteClinicInventoryItem,
  fetchClinicInventory,
  fetchClinicInventoryMovements,
  updateClinicInventoryItem,
} from '@/services/clinicService';

const categoryLabels: Record<string, string> = { MEDICATION: 'Medication', SUPPLY: 'Supply', EQUIPMENT: 'Equipment', FOOD: 'Food' };
const emptyForm: ClinicInventoryRequest = { name: '', category: 'SUPPLY', quantity: 0, unit: 'pcs', reorderLevel: 0, unitPrice: 0, active: true };

function movementLabel(movement: ClinicInventoryMovement): string {
  const amount = Math.abs(movement.quantityDelta);
  if (movement.action === 'CONSUME' || movement.source === 'INVOICE') return `Billed ${amount}`;
  if (movement.quantityDelta < 0) return `Removed ${amount}`;
  return `Added ${amount}`;
}

export default function ClinicInventory() {
  const location = useLocation();
  const doctorPortal = location.pathname.startsWith('/doctor');
  const user = useAppSelector((s) => s.authReducer.user);
  const canManage = hasRole(user?.roles, ROLES.CLINIC_ADMIN) && !doctorPortal;
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
  const [stockItem, setStockItem] = useState<ClinicInventoryItem | null>(null);
  const [stockDirection, setStockDirection] = useState<'ADD' | 'REMOVE'>('ADD');
  const [stockQty, setStockQty] = useState(1);
  const [stockNote, setStockNote] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const [movements, setMovements] = useState<ClinicInventoryMovement[]>([]);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(0);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementsError, setMovementsError] = useState<string | null>(null);
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
  const loadMovements = useCallback(async (requestedPage: number) => {
    if (!clinicUuid) { setMovements([]); setMovementsLoading(false); setMovementTotalPages(0); setMovementTotal(0); return; }
    setMovementsLoading(true); setMovementsError(null);
    try {
      const result = await fetchClinicInventoryMovements(clinicUuid, { pageNumber: requestedPage, pageSize: 20 });
      setMovements(result.models ?? []);
      setMovementPage(result.pageNumber ?? requestedPage);
      setMovementTotalPages(result.totalPages);
      setMovementTotal(result.totalElements);
    } catch { setMovements([]); setMovementsError('Inventory audit could not be loaded. Please try again.'); } finally { setMovementsLoading(false); }
  }, [clinicUuid]);
  useEffect(() => { void load(page); }, [load, page]);
  useEffect(() => { void loadMovements(movementPage); }, [loadMovements, movementPage]);
  const lowStock = items.filter((item) => item.quantity < item.reorderLevel);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openStock = (item: ClinicInventoryItem, direction: 'ADD' | 'REMOVE') => { setStockItem(item); setStockDirection(direction); setStockQty(1); setStockNote(''); };
  const openEdit = (item: ClinicInventoryItem) => { setEditing(item); setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, reorderLevel: item.reorderLevel, unitPrice: item.unitPrice, active: item.active }); setFormOpen(true); };
  const updateField = (field: keyof ClinicInventoryRequest, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!clinicUuid || !form.name.trim()) return; setSaving(true); try { if (editing) await updateClinicInventoryItem(clinicUuid, editing.uuid, form); else await createClinicInventoryItem(clinicUuid, { ...form, name: form.name.trim() });       setFormOpen(false); await load(page); await loadMovements(1); toast.success(editing ? 'Inventory item updated' : 'Inventory item added'); } catch { toast.error('Could not save inventory item'); } finally { setSaving(false); } };
  const saveStock = async (event: React.FormEvent) => { event.preventDefault(); if (!clinicUuid || !stockItem || stockQty < 1) return; setStockSaving(true); try { await adjustClinicInventoryStock(clinicUuid, stockItem.uuid, { direction: stockDirection, quantity: stockQty, note: stockNote.trim() || undefined }); setStockItem(null); await load(page); await loadMovements(1); toast.success(stockDirection === 'ADD' ? 'Stock added' : 'Stock removed'); } catch (error) { const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message; toast.error(message || 'Could not update stock'); } finally { setStockSaving(false); } };
  const remove = async (item: ClinicInventoryItem) => { if (!clinicUuid || !window.confirm(`Delete ${item.name}?`)) return; setDeleting(item.uuid); try { await deleteClinicInventoryItem(clinicUuid, item.uuid); await load(page); await loadMovements(1); toast.success('Inventory item deleted'); } catch { toast.error('Could not delete inventory item'); } finally { setDeleting(null); } };

  const catalogCell = 'border-b border-border py-3';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">{totalItems} items · {lowStock.length} below reorder on this page</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { void load(page); void loadMovements(movementPage); }} disabled={!clinicUuid || loading} aria-label="Refresh inventory"><RefreshCw className="h-4 w-4" /></Button>{canManage ? <Button size="sm" onClick={openCreate} disabled={!clinicUuid}><Plus className="h-4 w-4 mr-2" />Add Item</Button> : null}</div>
      </div>

      {clinicLoading || loading ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Loading live inventory...</div> : null}
      {!clinicLoading && !loading && !clinicUuid ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{doctorPortal ? 'You are not linked to a clinic, so there is no inventory audit to show.' : 'Select a clinic branch to manage inventory.'}</div> : null}
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

      <Tabs defaultValue="catalog" className="space-y-4">
      <TabsList>
        <TabsTrigger value="catalog">Catalog</TabsTrigger>
        <TabsTrigger value="movements">Movements</TabsTrigger>
      </TabsList>
      <TabsContent value="catalog">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Stock list</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!loading && clinicUuid && !error && items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No inventory items yet.</p>
          ) : null}

          <div className="hidden overflow-x-auto md:block">
            <div className="grid min-w-[48rem] grid-cols-[minmax(10rem,1.6fr)_9rem_8rem_8rem_7rem_11.5rem] items-center gap-x-4 text-sm">
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Item</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Category</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">On hand</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reorder</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Price</div>
              <div className="border-b border-border pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{canManage ? 'Actions' : ''}</div>
              {items.map((item) => {
                const low = item.quantity < item.reorderLevel;
                return (
                  <Fragment key={item.uuid}>
                    <div className={`${catalogCell} flex min-w-0 items-center gap-2`}>
                      <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className={catalogCell}>
                      <Badge variant="secondary" className="border-0 bg-muted text-[10px]">{categoryLabels[item.category] || item.category}</Badge>
                    </div>
                    <div className={`${catalogCell} font-medium ${low ? 'text-amber-600' : ''}`}>{item.quantity} {item.unit}</div>
                    <div className={`${catalogCell} text-muted-foreground`}>{item.reorderLevel} {item.unit}</div>
                    <div className={`${catalogCell} font-medium`}>₹{item.unitPrice.toFixed(2)}</div>
                    <div className={`${catalogCell} flex flex-nowrap justify-center gap-0.5`}>
                      {canManage ? (
                        <>
                          <Button variant="ghost" size="icon" title={`Add stock to ${item.name}`} aria-label={`Add stock to ${item.name}`} onClick={() => openStock(item, 'ADD')}><Plus className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title={`Remove stock from ${item.name}`} aria-label={`Remove stock from ${item.name}`} onClick={() => openStock(item, 'REMOVE')}><Minus className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => void remove(item)} disabled={deleting === item.uuid}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((item) => {
              const low = item.quantity < item.reorderLevel;
              return (
                <div key={item.uuid} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <Badge variant="secondary" className="mt-1 border-0 bg-muted text-[10px]">{categoryLabels[item.category] || item.category}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground">On hand</p>
                      <p className={`font-medium ${low ? 'text-amber-600' : ''}`}>{item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Reorder</p>
                      <p className="font-medium">{item.reorderLevel} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Price</p>
                      <p className="font-medium">₹{item.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => openStock(item, 'ADD')}>Add</Button>
                      <Button variant="outline" size="sm" onClick={() => openStock(item, 'REMOVE')}>Remove</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => void remove(item)} disabled={deleting === item.uuid}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <ListPager page={page} totalPages={totalPages} totalElements={totalItems} noun="items" disabled={loading} onPageChange={setPage} />
        </CardContent>
      </Card>
      </TabsContent>
      <TabsContent value="movements">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Inventory audit</CardTitle></CardHeader>
          <CardContent>
            {movementsLoading ? <p className="text-sm text-muted-foreground">Loading movements...</p> : null}
            {!movementsLoading && movementsError ? <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center"><p className="text-sm text-destructive">{movementsError}</p><Button className="mt-3" variant="outline" size="sm" onClick={() => void loadMovements(movementPage)}>Try again</Button></div> : null}
            {!movementsLoading && !movementsError && movements.length === 0 ? <p className="text-sm text-muted-foreground">No inventory movements yet.</p> : null}
            <div>
              {movements.map((movement) => (
                <div key={movement.uuid} className="flex items-start justify-between gap-4 border-b border-border py-3 text-sm last:border-0">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{movement.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[movement.actorName, movement.invoiceNumber].filter(Boolean).join(' · ') || 'Manual'}
                    </p>
                    {movement.note ? <p className="text-xs text-muted-foreground">{movement.note}</p> : null}
                    {movement.createdAt ? <p className="text-xs text-muted-foreground">{new Date(movement.createdAt).toLocaleString()}</p> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={movement.quantityDelta < 0 ? 'font-medium text-amber-600' : 'font-medium'}>{movementLabel(movement)}</p>
                    <p className="text-xs text-muted-foreground">Balance {movement.quantityAfter}</p>
                  </div>
                </div>
              ))}
            </div>
            <ListPager page={movementPage} totalPages={movementTotalPages} totalElements={movementTotal} noun="movements" disabled={movementsLoading} onPageChange={setMovementPage} />
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      <Dialog open={stockItem !== null} onOpenChange={(open) => { if (!open) setStockItem(null); }}>
        <DialogContent>
          <form onSubmit={saveStock} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{stockDirection === 'ADD' ? 'Add stock' : 'Remove stock'}</DialogTitle>
              <DialogDescription>
                {stockItem ? `${stockItem.name} · ${stockItem.quantity} ${stockItem.unit} on hand` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="stock-qty">Quantity</Label>
              <Input id="stock-qty" type="number" min="1" step="1" value={stockQty} onChange={(event) => setStockQty(Number(event.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock-note">Note</Label>
              <Input id="stock-note" value={stockNote} onChange={(event) => setStockNote(event.target.value)} placeholder="Optional" maxLength={200} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStockItem(null)}>Cancel</Button>
              <Button type="submit" disabled={stockSaving}>{stockSaving ? 'Saving...' : stockDirection === 'ADD' ? 'Add stock' : 'Remove stock'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit inventory item' : 'Add inventory item'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Name, category, unit, reorder level, and price. On-hand quantity stays the same.' : 'Add a catalog item and its starting quantity.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="inventory-name">Name</Label>
                <Input id="inventory-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-category">Category</Label>
                <select id="inventory-category" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                  {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory-unit">Unit</Label>
                <Input id="inventory-unit" value={form.unit} onChange={(event) => updateField('unit', event.target.value)} required />
              </div>
              {editing ? (
                <div className="space-y-2">
                  <Label>On hand</Label>
                  <p className="flex h-10 items-center text-sm font-medium">{editing.quantity} {editing.unit}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="inventory-quantity">Starting quantity</Label>
                  <Input id="inventory-quantity" type="number" min="0" value={form.quantity} onChange={(event) => updateField('quantity', Number(event.target.value))} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="inventory-reorder">Reorder level</Label>
                <Input id="inventory-reorder" type="number" min="0" value={form.reorderLevel} onChange={(event) => updateField('reorderLevel', Number(event.target.value))} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="inventory-price">Unit price</Label>
                <Input id="inventory-price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => updateField('unitPrice', Number(event.target.value))} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save item'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
