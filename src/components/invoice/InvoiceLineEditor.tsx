import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  ClinicInventoryItem,
  fetchClinicInventoryOptions,
} from '@/services/clinicService';
import {
  ITEM_TYPE_OPTIONS,
  TreatmentItemType,
  TreatmentLineItem,
} from '@/services/invoiceService';

type StockLevel = 'healthy' | 'watch' | 'critical';

/** Green above twice the reorder level, yellow between that and reorder, red at or below reorder. */
export function stockLevel(quantity: number, reorderLevel: number): StockLevel {
  if (quantity <= reorderLevel) return 'critical';
  if (quantity > reorderLevel * 2) return 'healthy';
  return 'watch';
}

const stockLevelStyle: Record<StockLevel, { text: string; dot: string; label: string }> = {
  healthy: {
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Well stocked',
  },
  watch: {
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    label: 'Running low',
  },
  critical: {
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Reorder',
  },
};

function stockStatus(quantity: number, reorderLevel: number) {
  if (quantity <= 0) {
    return { ...stockLevelStyle.critical, label: 'Out of stock' };
  }
  return stockLevelStyle[stockLevel(quantity, reorderLevel)];
}

function StockOnHand({
  quantity,
  unit,
  reorderLevel,
}: {
  quantity: number;
  unit: string;
  reorderLevel: number;
}) {
  const style = stockStatus(quantity, reorderLevel);
  return (
    <p className={`flex min-w-0 items-center gap-1.5 truncate text-[11px] font-medium leading-4 ${style.text}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      <span className="truncate">
        {quantity} {unit} on hand
        <span className="font-normal"> · {style.label}</span>
      </span>
    </p>
  );
}

export function stockCategoryForItemType(
  itemType: TreatmentItemType,
): 'MEDICATION' | 'SUPPLY' | 'FOOD' | 'EQUIPMENT' | null {
  if (itemType === 'MEDICINE' || itemType === 'VACCINATION') return 'MEDICATION';
  if (itemType === 'CONSUMABLE') return 'SUPPLY';
  if (itemType === 'FOOD') return 'FOOD';
  if (itemType === 'EQUIPMENT') return 'EQUIPMENT';
  return null;
}

export function useInventoryCatalog(clinicUuid?: string | null) {
  const [items, setItems] = useState<ClinicInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clinicUuid) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [medication, supply, food, equipment] = await Promise.all([
        fetchClinicInventoryOptions(clinicUuid, 'MEDICATION'),
        fetchClinicInventoryOptions(clinicUuid, 'SUPPLY'),
        fetchClinicInventoryOptions(clinicUuid, 'FOOD'),
        fetchClinicInventoryOptions(clinicUuid, 'EQUIPMENT'),
      ]);
      setItems([...medication, ...supply, ...food, ...equipment]);
    } catch {
      setItems([]);
      setError('Inventory could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clinicUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}

function freeQuantity(item: ClinicInventoryItem): number {
  return Math.max(0, item.quantity - (item.reserved ?? 0));
}

/** Returns lines ready to save, or null when the form itself is invalid. */
export function prepareInventoryLines(
  items: TreatmentLineItem[],
  catalog: ClinicInventoryItem[],
  clinicUuid?: string | null,
): TreatmentLineItem[] | null {
  if (!items.length) {
    toast.error('Add at least one line item');
    return null;
  }
  if (!clinicUuid) {
    if (items.some((item) => !item.description.trim())) {
      toast.error('Add at least one line item with a description');
      return null;
    }
    return items.map((item) => ({ ...item, inventoryItemUuid: undefined }));
  }
  const byId = new Map(catalog.map((item) => [item.uuid, item]));
  const remaining = new Map(catalog.map((item) => [item.uuid, freeQuantity(item)]));
  const next = items.map((item) => ({ ...item }));
  for (const item of next) {
    const category = stockCategoryForItemType(item.itemType);
    if (!category) {
      item.inventoryItemUuid = undefined;
      if (!item.description.trim()) {
        toast.error('Add a description for every line');
        return null;
      }
      continue;
    }
    if (!item.inventoryItemUuid) {
      toast.error(`Choose a ${category.toLowerCase()} item from inventory`);
      return null;
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      toast.error('Stocked items must be billed in whole units');
      return null;
    }
    const stock = byId.get(item.inventoryItemUuid);
    if (!stock) {
      toast.error('That inventory item is no longer available');
      return null;
    }
    item.description = stock.name;
    item.unit = stock.unit;
    const onHand = remaining.get(item.inventoryItemUuid) ?? 0;
    remaining.set(item.inventoryItemUuid, onHand - item.quantity);
  }
  return next;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string } } })?.response?.data;
  return data?.message || fallback;
}

interface InvoiceLineEditorProps {
  items: TreatmentLineItem[];
  clinicUuid?: string | null;
  catalog: ClinicInventoryItem[];
  catalogLoading: boolean;
  catalogError: string | null;
  onRetryCatalog: () => void;
  onChange: (items: TreatmentLineItem[]) => void;
}

export function InvoiceLineEditor({
  items,
  clinicUuid,
  catalog,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  onChange,
}: InvoiceLineEditorProps) {
  const updateItem = (index: number, patch: Partial<TreatmentLineItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Line items</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, emptyLine()])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add item
        </Button>
      </div>
      {clinicUuid && catalogError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="text-destructive">{catalogError}</p>
          <Button className="mt-2" type="button" variant="outline" size="sm" onClick={onRetryCatalog}>
            Try again
          </Button>
        </div>
      ) : null}
      {items.map((item, index) => {
        const category = clinicUuid ? stockCategoryForItemType(item.itemType) : null;
        const choices = category
          ? catalog.filter((row) => row.category?.toUpperCase() === category)
          : [];
        const selected = item.inventoryItemUuid
          ? catalog.find((row) => row.uuid === item.inventoryItemUuid)
          : undefined;
        return (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg border border-border">
            <div className="sm:col-span-3">
              <Select
                value={item.itemType}
                onValueChange={(value) => {
                  const itemType = value as TreatmentItemType;
                  const stocked = Boolean(clinicUuid && stockCategoryForItemType(itemType));
                  updateItem(index, stocked
                    ? { itemType, description: '', inventoryItemUuid: undefined, unit: undefined }
                    : { itemType, inventoryItemUuid: undefined });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              {category ? (
                <div className="space-y-1">
                  <Select
                    value={item.inventoryItemUuid || undefined}
                    disabled={catalogLoading || choices.length === 0}
                    onValueChange={(uuid) => {
                      const stock = catalog.find((row) => row.uuid === uuid);
                      if (!stock) return;
                      updateItem(index, {
                        inventoryItemUuid: stock.uuid,
                        description: stock.name,
                        unit: stock.unit,
                        unitPrice: Number(stock.unitPrice),
                      });
                    }}
                  >
                    <SelectTrigger aria-label="Inventory item">
                      <SelectValue placeholder={catalogLoading ? 'Loading inventory...' : choices.length === 0 ? 'No items in this category' : 'Choose item'} />
                    </SelectTrigger>
                    <SelectContent>
                      {choices.map((row) => (
                        <SelectItem key={row.uuid} value={row.uuid} title={row.name}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-h-4">
                    {selected ? (
                      <StockOnHand
                        quantity={freeQuantity(selected)}
                        unit={selected.unit}
                        reorderLevel={selected.reorderLevel}
                      />
                    ) : (
                      <p className="truncate text-[11px] leading-4 text-muted-foreground">On hand shows here after you choose an item</p>
                    )}
                  </div>
                </div>
              ) : (
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <Input
                type="number"
                min={category ? 1 : 0}
                step={category ? 1 : 0.01}
                placeholder="Qty"
                value={item.quantity}
                onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="Rate ₹"
                value={item.unitPrice}
                onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
              />
            </div>
            <div className="sm:col-span-1 flex items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={items.length === 1}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function emptyLine(): TreatmentLineItem {
  return { itemType: 'CONSULTATION', description: 'Consultation', quantity: 1, unitPrice: 500 };
}
