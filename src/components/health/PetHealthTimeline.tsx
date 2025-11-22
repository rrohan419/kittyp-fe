import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Heart, 
  Shield, 
  Scissors, 
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Filter
} from 'lucide-react';
import { format, isAfter, isBefore, isToday, addDays, startOfDay } from 'date-fns';
import { HealthEvent, HealthEventFilters } from '@/types/health';
import { AddHealthEventDialog } from './AddHealthEventDialog';
import { HealthEventCard } from './HealthEventCard';

interface PetHealthTimelineProps {
  petId: string;
  petName: string;
}

export const PetHealthTimeline: React.FC<PetHealthTimelineProps> = ({ petId, petName }) => {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<HealthEventFilters>({ petId });
  const [activeTab, setActiveTab] = useState<'timeline' | 'upcoming' | 'history'>('timeline');

  // Generate mock data specific to the pet
  useEffect(() => {
    const mockEvents: HealthEvent[] = [
      {
        id: `${petId}_1`,
        petId,
        type: 'vaccination',
        title: 'Annual Vaccination',
        description: 'DHPP + Rabies vaccination',
        date: '2024-03-15T10:00:00Z',
        status: 'completed',
        veterinarian: 'Dr. Sarah Johnson',
        clinic: 'Pawsome Vet Clinic',
        cost: 120,
        notes: 'No adverse reactions. Next due in 1 year.',
        nextDue: '2025-03-15T10:00:00Z',
        reminder: true,
        createdAt: '2024-03-15T10:00:00Z',
        updatedAt: '2024-03-15T10:00:00Z'
      },
      {
        id: `${petId}_2`,
        petId,
        type: 'deworming',
        title: 'Deworming Treatment',
        description: 'Quarterly deworming',
        date: '2024-06-01T09:00:00Z',
        status: 'completed',
        veterinarian: 'Dr. Mike Chen',
        clinic: 'Pawsome Vet Clinic',
        cost: 45,
        nextDue: '2024-09-01T09:00:00Z',
        reminder: true,
        createdAt: '2024-06-01T09:00:00Z',
        updatedAt: '2024-06-01T09:00:00Z'
      },
      {
        id: `${petId}_3`,
        petId,
        type: 'grooming',
        title: 'Professional Grooming',
        date: '2024-08-20T14:00:00Z',
        status: 'scheduled',
        clinic: 'Furry Friends Grooming',
        cost: 80,
        notes: 'Full grooming service with nail trimming',
        createdAt: '2024-08-15T10:00:00Z',
        updatedAt: '2024-08-15T10:00:00Z'
      },
      {
        id: `${petId}_4`,
        petId,
        type: 'checkup',
        title: 'Annual Health Checkup',
        description: 'Comprehensive health examination',
        date: '2024-09-15T11:00:00Z',
        status: 'scheduled',
        veterinarian: 'Dr. Sarah Johnson',
        clinic: 'Pawsome Vet Clinic',
        reminder: true,
        createdAt: '2024-08-20T10:00:00Z',
        updatedAt: '2024-08-20T10:00:00Z'
      }
    ];
    setEvents(mockEvents);
  }, [petId]);

  const getEventIcon = (type: HealthEvent['type']) => {
    const iconMap = {
      vaccination: Shield,
      deworming: Pill,
      grooming: Scissors,
      'vet-visit': Stethoscope,
      medication: Pill,
      dental: Heart,
      checkup: Stethoscope,
      emergency: AlertCircle,
      surgery: Heart,
      other: Calendar
    };
    return iconMap[type] || Calendar;
  };

  const getStatusColor = (status: HealthEvent['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'scheduled': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'default';
    }
  };

  const categorizeEvents = () => {
    const now = new Date();
    const today = startOfDay(now);
    const nextWeek = addDays(today, 7);

    const upcoming = events.filter(event => 
      isAfter(new Date(event.date), now) && 
      ['scheduled'].includes(event.status)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const overdue = events.filter(event => 
      isBefore(new Date(event.date), now) && 
      event.status === 'scheduled'
    );

    const history = events.filter(event => 
      event.status === 'completed' || 
      isBefore(new Date(event.date), now)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const todayEvents = events.filter(event => 
      isToday(new Date(event.date))
    );

    const thisWeekEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return isAfter(eventDate, today) && 
             isBefore(eventDate, nextWeek) && 
             event.status === 'scheduled';
    });

    return { upcoming, overdue, history, todayEvents, thisWeekEvents };
  };

  const { upcoming, overdue, history, todayEvents, thisWeekEvents } = categorizeEvents();

  const handleAddEvent = (eventData: Omit<HealthEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: HealthEvent = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEvents([...events, newEvent]);
  };

  const renderTimelineView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{upcoming.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{overdue.length}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-secondary">{todayEvents.length}</div>
            <div className="text-sm text-muted-foreground">Today</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">{thisWeekEvents.length}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Events */}
      {overdue.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Overdue Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.map((event) => (
              <HealthEventCard key={event.id} event={event} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CalendarDays className="h-5 w-5" />
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayEvents.map((event) => (
              <HealthEventCard key={event.id} event={event} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Health Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {[...upcoming, ...history].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              ).map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      event.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' :
                      event.status === 'scheduled' ? 'bg-secondary border-secondary text-secondary-foreground' :
                      'bg-destructive border-destructive text-destructive-foreground'
                    }`}>
                      {React.createElement(getEventIcon(event.type), { className: 'h-4 w-4' })}
                    </div>
                    {index < [...upcoming, ...history].length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <HealthEventCard event={event} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            {petName}'s Health Timeline
          </h2>
          <p className="text-muted-foreground">Track vaccinations, treatments, and health records</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {renderTimelineView()}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((event) => (
                  <HealthEventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {history.length > 0 ? (
                    history.map((event) => (
                      <HealthEventCard key={event.id} event={event} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No health records found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddHealthEventDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddEvent}
        petId={petId}
      />
    </div>
  );
};