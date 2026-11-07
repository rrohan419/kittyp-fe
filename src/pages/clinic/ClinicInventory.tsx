import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
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
import { Plus, AlertTriangle, Boxes, CalendarClock, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { useDebounce } from '@/hooks/useDebounce';
import { ListPager } from '@/components/ui/ListPager';
import { useAppSelector } from '@/module/store/hooks';
import { hasRole, ROLES } from '@/utils/roles';
import InventoryBatchDialog from '@/components/clinic/InventoryBatchDialog';
import {
  ClinicInventoryItem,
  ClinicInventoryMovement,
  ClinicInventoryRequest,
  createClinicInventoryItem,
  deleteClinicInventoryItem,
  fetchClinicInventory,
  fetchClinicInventoryEditAccess,
  fetchClinicInventoryMovements,
  updateClinicInventoryItem,
} from '@/services/clinicService';

const categoryLabels: Record<string, string> = { MEDICATION: 'Medication', SUPPLY: 'Supply', EQUIPMENT: 'Equipment', FOOD: 'Food' };
const emptyForm: ClinicInventoryRequest = { name: '', category: 'SUPPLY', quantity: 0, unit: 'pcs', reorderLevel: 0, unitPrice: 0, active: true };

function onHandLabel(quantity: number, unit: string, reserved = 0): string {
  const held = reserved > 0 ? ` · ${reserved} ${unit} held` : '';
  if (quantity <= 0) return `0 ${unit} · Out of stock${held}`;
  return `${quantity} ${unit}${held}`;
}

function billableQuantity(item: ClinicInventoryItem): number {
  return Math.max(0, item.availableQuantity ?? item.quantity - (item.reserved ?? 0));
}

function onHandClass(quantity: number, reorderLevel: number): string {
  if (quantity <= 0) return 'font-medium text-red-700 dark:text-red-400';
  if (quantity < reorderLevel) return 'font-medium text-amber-600';
  return 'font-medium';
}

function movementLabel(movement: ClinicInventoryMovement): string {
  const amount = Math.abs(movement.quantityDelta);
  if (movement.action === 'RECEIVE') return `Received ${amount}`;
  if (movement.action === 'REVIEW') return 'Expiry reviewed';
  if (movement.action === 'RESERVE') return `Reserved ${amount}`;
  if (movement.action === 'RELEASE') return `Released ${amount}`;
  if (movement.action === 'CONSUME' || movement.source === 'INVOICE') return `Billed ${amount}`;
  if (movement.quantityDelta < 0) return `Removed ${amount}`;
  return `Added ${amount}`;
}

export default function ClinicInventory() {
  const location = useLocation();
  const doctorPortal = location.pathname.startsWith('/doctor');
  const user = useAppSelector((s) => s.authReducer.user);
  const canAdjust = hasRole(user?.roles, ROLES.CLINIC_ADMIN) && !doctorPortal;
  const [canEditItems, setCanEditItems] = useState(false);
  const showActions = canAdjust || canEditItems;
  const { clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [items, setItems] = useState<ClinicInventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const searchPending = search.trim() !== debouncedSearch;
  const inventoryRequest = useRef(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedSearch, setLoadedSearch] = useState<string | null>(null);
  const [inventoryRevision, setInventoryRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicInventoryRequest>(emptyForm);
  const [editing, setEditing] = useState<ClinicInventoryItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [batchItem, setBatchItem] = useState<ClinicInventoryItem | null>(null);
  const [movements, setMovements] = useState<ClinicInventoryMovement[]>([]);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(0);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const load = useCallback(async (requestedPage: number) => {
    const requestId = ++inventoryRequest.current;
    if (!clinicUuid) { setItems([]); setLoading(false); setTotalPages(0); setTotalItems(0); return; }
    setLoading(true); setError(null);
    try {
      const result = await fetchClinicInventory(clinicUuid, { pageNumber: requestedPage, pageSize: 20, search: debouncedSearch || undefined });
      if (requestId !== inventoryRequest.current) return;
      setItems(result.models);
      setLoadedSearch(debouncedSearch);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalElements);
    } catch {
      if (requestId === inventoryRequest.current) { setItems([]); setError('Inventory could not be loaded. Please try again.'); }
    } finally {
      if (requestId === inventoryRequest.current) setLoading(false);
    }
  }, [clinicUuid, debouncedSearch]);
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
  useEffect(() => {
    if (!clinicUuid) {
      setCanEditItems(false);
      return;
    }
    if (canAdjust) {
      setCanEditItems(true);
      return;
    }
    let cancelled = false;
    void fetchClinicInventoryEditAccess(clinicUuid)
      .then((access) => {
        if (!cancelled) setCanEditItems(Boolean(access.canEditInventory));
      })
      .catch(() => {
        if (!cancelled) setCanEditItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicUuid, canAdjust]);
  useEffect(() => {
    void load(page);
    return () => { inventoryRequest.current += 1; };
  }, [load, page, inventoryRevision]);
  useEffect(() => { void loadMovements(movementPage); }, [loadMovements, movementPage]);
  const visibleItems = searchPending || loading || loadedSearch !== debouncedSearch ? [] : items;
  const lowStock = visibleItems.filter((item) => billableQuantity(item) < item.reorderLevel);
  const expiryAttentionCount = visibleItems.filter((item) =>
    (item.expiredQuantity ?? 0) > 0 || (item.unreviewedQuantity ?? 0) > 0 || (item.expiringSoonQuantity ?? 0) > 0,
  ).length;
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openStock = (item: ClinicInventoryItem) => setBatchItem(item);
  const openEdit = (item: ClinicInventoryItem) => { setEditing(item); setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, reorderLevel: item.reorderLevel, unitPrice: item.unitPrice, active: item.active }); setFormOpen(true); };
  const updateField = (field: keyof ClinicInventoryRequest, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (!clinicUuid || !form.name.trim()) return; setSaving(true); try { if (editing) await updateClinicInventoryItem(clinicUuid, editing.uuid, form); else await createClinicInventoryItem(clinicUuid, { ...form, name: form.name.trim() }); setFormOpen(false); setInventoryRevision((value) => value + 1); await loadMovements(1); toast.success(editing ? 'Inventory item updated' : 'Inventory item added'); } catch { toast.error('Could not save inventory item'); } finally { setSaving(false); } };
  const remove = async (item: ClinicInventoryItem) => { if (!clinicUuid || !window.confirm(`Delete ${item.name}?`)) return; setDeleting(item.uuid); try { await deleteClinicInventoryItem(clinicUuid, item.uuid); setInventoryRevision((value) => value + 1); await loadMovements(1); toast.success('Inventory item deleted'); } catch { toast.error('Could not delete inventory item'); } finally { setDeleting(null); } };

  const catalogCell = 'border-b border-border py-3';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">{totalItems} items{debouncedSearch ? ' matching search' : ''} · {lowStock.length} below reorder on this page</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { void load(page); void loadMovements(movementPage); }} disabled={!clinicUuid || loading} aria-label="Refresh inventory"><RefreshCw className="h-4 w-4" /></Button>{canEditItems ? <Button size="sm" onClick={openCreate} disabled={!clinicUuid}><Plus className="h-4 w-4 mr-2" />Add Item</Button> : null}</div>
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
      {expiryAttentionCount > 0 && (
        <Card className="border-0 bg-red-500/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-medium">{expiryAttentionCount} items on this page need expiry attention</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Review unknown expiry, remove expired stock, or use batches expiring within 90 days. Expired and unreviewed stock cannot be billed.
              </p>
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search inventory by item name or category"
              placeholder="Search name or category"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          {searchPending ? <p className="text-sm text-muted-foreground">Searching inventory...</p> : null}
          {!loading && !searchPending && clinicUuid && !error && items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{debouncedSearch ? 'No inventory items match your search.' : 'No inventory items yet.'}</p>
          ) : null}

          <div className="hidden overflow-x-auto md:block">
            <div className="grid min-w-[48rem] grid-cols-[minmax(10rem,1.6fr)_9rem_8rem_8rem_7rem_11.5rem] items-center gap-x-4 text-sm">
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Item</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Category</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">On hand</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reorder</div>
              <div className="border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Price</div>
              <div className="border-b border-border pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{showActions ? 'Actions' : ''}</div>
              {visibleItems.map((item) => {
                return (
                  <Fragment key={item.uuid}>
                    <div className={`${catalogCell} flex min-w-0 items-center gap-2`}>
                      <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className={catalogCell}>
                      <Badge variant="secondary" className="border-0 bg-muted text-[10px]">{categoryLabels[item.category] || item.category}</Badge>
                    </div>
                    <div className={`${catalogCell} ${onHandClass(billableQuantity(item), item.reorderLevel)}`}>
                      {onHandLabel(item.quantity, item.unit, item.reserved ?? 0)}
                      {item.availableQuantity !== undefined ? <p className="mt-1 text-xs font-normal text-muted-foreground">{item.availableQuantity} {item.unit} available to bill</p> : null}
                      {item.nextExpiryDate ? <p className="mt-1 text-xs font-normal text-muted-foreground">Next expiry {item.nextExpiryDate}</p> : null}
                      {(item.expiredQuantity ?? 0) > 0 || (item.unreviewedQuantity ?? 0) > 0 || (item.expiringSoonQuantity ?? 0) > 0 ? (
                        <p className="mt-1 text-xs font-normal text-amber-700">
                          {(item.expiredQuantity ?? 0) > 0 ? `${item.expiredQuantity} expired · ` : ''}
                          {(item.unreviewedQuantity ?? 0) > 0 ? `${item.unreviewedQuantity} unreviewed · ` : ''}
                          {(item.expiringSoonQuantity ?? 0) > 0 ? `${item.expiringSoonQuantity} expiring soon` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className={`${catalogCell} text-muted-foreground`}>{item.reorderLevel} {item.unit}</div>
                    <div className={`${catalogCell} font-medium`}>₹{item.unitPrice.toFixed(2)}</div>
                    <div className={`${catalogCell} flex flex-nowrap justify-center gap-0.5`}>
                      <Button variant="ghost" size="icon" title={`View batches for ${item.name}`} aria-label={`View batches for ${item.name}`} onClick={() => openStock(item)}><CalendarClock className="h-4 w-4" /></Button>
                      {showActions ? (
                        <>
                          {canEditItems ? (
                            <>
                              <Button variant="ghost" size="icon" title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`} onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                            </>
                          ) : null}
                          {canAdjust ? (
                            <Button variant="ghost" size="icon" title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`} onClick={() => void remove(item)} disabled={deleting === item.uuid}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {visibleItems.map((item) => {
              return (
                <div key={item.uuid} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <Badge variant="secondary" className="mt-1 border-0 bg-muted text-[10px]">{categoryLabels[item.category] || item.category}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground">On hand</p>
                      <p className={onHandClass(billableQuantity(item), item.reorderLevel)}>{onHandLabel(item.quantity, item.unit, item.reserved ?? 0)}</p>
                      {item.availableQuantity !== undefined ? <p className="mt-1 text-xs text-muted-foreground">{item.availableQuantity} {item.unit} available to bill</p> : null}
                      {(item.expiredQuantity ?? 0) > 0 || (item.unreviewedQuantity ?? 0) > 0 || (item.expiringSoonQuantity ?? 0) > 0 ? (
                        <p className="mt-1 text-xs text-amber-700">
                          {(item.expiredQuantity ?? 0) > 0 ? `${item.expiredQuantity} expired ` : ''}
                          {(item.unreviewedQuantity ?? 0) > 0 ? `${item.unreviewedQuantity} unreviewed ` : ''}
                          {(item.expiringSoonQuantity ?? 0) > 0 ? `${item.expiringSoonQuantity} expiring soon` : ''}
                        </p>
                      ) : null}
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="col-span-2" onClick={() => openStock(item)}><CalendarClock className="mr-1 h-3.5 w-3.5" />View batches</Button>
                    {showActions ? (
                      <>
                      {canEditItems ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                        </>
                      ) : null}
                      {canAdjust ? (
                        <Button variant="outline" size="sm" onClick={() => void remove(item)} disabled={deleting === item.uuid}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                      ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <ListPager page={page} totalPages={totalPages} totalElements={totalItems} noun="items" disabled={loading || searchPending} onPageChange={setPage} />
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
                      {[movement.actorName, movement.invoiceNumber, movement.batchNumber ? `Batch ${movement.batchNumber}` : null].filter(Boolean).join(' · ') || 'Manual'}
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

      {clinicUuid ? (
        <InventoryBatchDialog
          clinicUuid={clinicUuid}
          item={batchItem}
          open={batchItem !== null}
          canEdit={canEditItems}
          onOpenChange={(open) => { if (!open) setBatchItem(null); }}
          onChanged={() => { setInventoryRevision((value) => value + 1); void loadMovements(1); }}
        />
      ) : null}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit inventory item' : 'Add inventory item'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Name, category, unit, reorder level, and price. On-hand quantity stays the same.' : 'Create the catalog item first, then receive stock in batches with expiry details.'}
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
              ) : <p className="text-sm text-muted-foreground sm:col-span-2">Starting stock is added after creation so expiry information can be recorded for each batch.</p>}
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
