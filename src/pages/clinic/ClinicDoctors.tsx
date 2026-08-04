import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, Phone, Star, Calendar } from 'lucide-react';
import { mockDoctors } from '@/data/mockClinic';

const statusColor = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  off: 'bg-muted text-muted-foreground',
};

export default function ClinicDoctors() {
  const [search, setSearch] = useState('');
  const filtered = mockDoctors.filter((d) =>
    `${d.name} ${d.specialization}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Doctors</h1>
          <p className="text-muted-foreground mt-1 text-sm">{mockDoctors.length} doctors at Happy Paws Clinic</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Invite Doctor</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search doctors…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <Card key={d.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{d.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.specialization}</p>
                </div>
                <Badge variant="secondary" className={`${statusColor[d.status]} border-0 text-[10px] capitalize shrink-0`}>{d.status}</Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{d.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{d.phone}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="font-medium">{d.rating}</span></div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{d.appointmentsToday} today</div>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-4">View Schedule</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
