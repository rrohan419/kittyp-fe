import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { mockAppointments, mockDoctors } from '@/data/mockClinic';

const statusColor: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function ClinicAppointments() {
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [tab, setTab] = useState('today');

  const filterByDate = (date: 'Today' | 'Tomorrow') =>
    mockAppointments.filter((a) => a.date === date && (doctorFilter === 'all' || a.doctorId === doctorFilter));

  const renderList = (date: 'Today' | 'Tomorrow') => {
    const items = filterByDate(date);
    if (items.length === 0) {
      return <p className="text-center text-muted-foreground py-10 text-sm">No appointments.</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className="border-0 shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{a.petName.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{a.petName} · {a.type}</p>
                  <p className="text-xs text-muted-foreground truncate"><User className="inline h-3 w-3 mr-1" />{a.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{a.time}</div>
                <Badge variant="secondary" className="text-[10px] bg-muted border-0 hidden sm:inline-flex">{a.doctorName}</Badge>
                <Badge variant="secondary" className={`${statusColor[a.status]} border-0 text-[10px] capitalize`}>{a.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground mt-1 text-sm">All bookings across the clinic</p>
        </div>
        <Select value={doctorFilter} onValueChange={setDoctorFilter}>
          <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {mockDoctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">{renderList('Today')}</TabsContent>
        <TabsContent value="tomorrow" className="mt-4">{renderList('Tomorrow')}</TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Calendar view coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
