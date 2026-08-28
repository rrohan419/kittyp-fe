import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Boxes } from 'lucide-react';
import { mockInventory } from '@/data/mockClinic';

const categoryLabels: Record<string, string> = {
  medication: 'Medication',
  supply: 'Supply',
  equipment: 'Equipment',
  food: 'Food',
};

export default function ClinicInventory() {
  const lowStock = mockInventory.filter((i) => i.stock < i.reorderLevel);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">{mockInventory.length} items · {lowStock.length} below reorder</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
      </div>

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
              <div className="col-span-4">Item</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-2">Reorder Level</div>
              <div className="col-span-2 text-right">Price</div>
            </div>
            {mockInventory.map((i) => {
              const low = i.stock < i.reorderLevel;
              return (
                <div key={i.id} className="grid grid-cols-12 gap-3 py-3 items-center border-b border-border last:border-0 text-sm">
                  <div className="col-span-4 flex items-center gap-2"><Boxes className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-medium truncate">{i.name}</span></div>
                  <div className="col-span-2"><Badge variant="secondary" className="bg-muted border-0 text-[10px]">{categoryLabels[i.category]}</Badge></div>
                  <div className={`col-span-2 font-medium ${low ? 'text-amber-600' : ''}`}>{i.stock} {i.unit}</div>
                  <div className="col-span-2 text-muted-foreground">{i.reorderLevel} {i.unit}</div>
                  <div className="col-span-2 text-right font-medium">${i.price.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {mockInventory.map((i) => {
              const low = i.stock < i.reorderLevel;
              return (
                <div key={i.id} className="p-3 rounded-xl bg-muted/40 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{categoryLabels[i.category]} · ${i.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${low ? 'text-amber-600' : ''}`}>{i.stock} {i.unit}</p>
                    {low && <p className="text-[10px] text-amber-600">Reorder</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
