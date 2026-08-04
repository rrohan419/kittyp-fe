import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Phone } from 'lucide-react';
import { mockStaff } from '@/data/mockClinic';

export default function ClinicStaff() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Staff</h1>
          <p className="text-muted-foreground mt-1 text-sm">{mockStaff.length} team members</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStaff.map((s) => (
          <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{s.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.role}</p>
                </div>
                <Badge variant="secondary" className={s.status === 'active' ? 'bg-green-100 text-green-700 border-0 text-[10px]' : 'bg-amber-100 text-amber-700 border-0 text-[10px]'}>{s.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{s.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{s.phone}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
