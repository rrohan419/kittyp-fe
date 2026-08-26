import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Plus, Trash2, AlertTriangle, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { formatIsoDate, parseIsoDate } from '@/utils/isoDate';

interface ExceptionDate {
  id: string;
  date: string;
  type: 'unavailable' | 'holiday' | 'reduced-hours' | 'emergency-only';
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

interface ExceptionDatesProps {
  vetId: string;
  exceptions?: ExceptionDate[];
  onChange?: (exceptions: ExceptionDate[]) => void;
}

export const ExceptionDates: React.FC<ExceptionDatesProps> = ({
  exceptions: controlledExceptions,
  onChange,
}) => {
  const [internalExceptions, setInternalExceptions] = useState<ExceptionDate[]>([]);
  const exceptions = controlledExceptions ?? internalExceptions;
  const setExceptions = (updater: ExceptionDate[] | ((prev: ExceptionDate[]) => ExceptionDate[])) => {
    const next = typeof updater === 'function' ? updater(exceptions) : updater;
    if (onChange) onChange(next);
    else setInternalExceptions(next);
  };

  const [newException, setNewException] = useState<Partial<ExceptionDate>>({
    type: 'unavailable',
    title: '',
    description: ''
  });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();

  const exceptionTypes = [
    {
      value: 'unavailable',
      label: 'Unavailable',
      description: 'Completely unavailable for consultations',
      color: 'bg-red-500',
      icon: AlertTriangle
    },
    {
      value: 'holiday',
      label: 'Holiday',
      description: 'Public holiday or personal vacation',
      color: 'bg-orange-500',
      icon: Coffee
    },
    {
      value: 'reduced-hours',
      label: 'Reduced Hours',
      description: 'Limited availability with custom hours',
      color: 'bg-yellow-500',
      icon: CalendarIcon
    },
    {
      value: 'emergency-only',
      label: 'Emergency Only',
      description: 'Only emergency consultations available',
      color: 'bg-blue-500',
      icon: AlertTriangle
    }
  ];

  const addException = () => {
    if (!selectedDate || !newException.title) {
      toast.error("Please select a date and provide a title.");
      return;
    }

    const exception: ExceptionDate = {
      id: Date.now().toString(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      type: newException.type as ExceptionDate['type'],
      title: newException.title,
      description: newException.description,
      startTime: newException.startTime,
      endTime: newException.endTime
    };

    setExceptions((prev) => [...prev, exception]);
    setNewException({ type: 'unavailable', title: '', description: '' });
    setSelectedDate(undefined);

    toast.success(`Exception for ${format(selectedDate, 'MMMM d, yyyy')} added. Save to persist.`);
  };

  const removeException = (id: string) => {
    setExceptions((prev) => prev.filter((ex) => ex.id !== id));
    toast.info('Exception removed. Save to persist.');
  };

  const getTypeConfig = (type: string) => {
    return exceptionTypes.find(t => t.value === type) || exceptionTypes[0];
  };

  const isDateException = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return exceptions.some(ex => ex.date === dateStr);
  };

  const upcomingExceptions = exceptions
    .filter(ex => new Date(ex.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastExceptions = exceptions
    .filter(ex => new Date(ex.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Add New Exception */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Exception Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="exception-date">Select Date</Label>
                <DatePicker
                  id="exception-date"
                  value={selectedDate ? formatIsoDate(selectedDate) : ''}
                  onChange={(value) => setSelectedDate(parseIsoDate(value))}
                  placeholder="Select date"
                  disablePast
                  calendarProps={{
                    modifiers: {
                      exception: (date) => isDateException(date),
                    },
                    modifiersClassNames: {
                      exception: 'bg-destructive/15 text-destructive font-medium',
                    },
                  }}
                />
              </div>

              {/* Exception Type */}
              <div>
                <Label>Exception Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {exceptionTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={newException.type === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewException(prev => ({ ...prev, type: type.value as ExceptionDate['type'] }))}
                        className="h-auto p-3 flex-col"
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-xs">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Exception Details */}
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Vacation, Conference, Personal Day"
                  value={newException.title || ''}
                  onChange={(e) => setNewException(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Additional details about this exception..."
                  value={newException.description || ''}
                  onChange={(e) => setNewException(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {newException.type === 'reduced-hours' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newException.startTime || ''}
                      onChange={(e) => setNewException(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newException.endTime || ''}
                      onChange={(e) => setNewException(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <Button onClick={addException} className="w-full">
                Add Exception
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exceptions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExceptions.length > 0 ? (
              <div className="space-y-3">
                {upcomingExceptions.map(exception => {
                  const typeConfig = getTypeConfig(exception.type);
                  const Icon = typeConfig.icon;
                  
                  return (
                    <div key={exception.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded ${typeConfig.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{exception.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(exception.date), 'MMMM d, yyyy')}
                            </p>
                            {exception.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {exception.description}
                              </p>
                            )}
                            {exception.type === 'reduced-hours' && exception.startTime && exception.endTime && (
                              <p className="text-sm font-medium mt-1">
                                {exception.startTime} - {exception.endTime}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {typeConfig.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeException(exception.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No upcoming exceptions scheduled.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Past Exceptions */}
        <Card>
          <CardHeader>
            <CardTitle>Past Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            {pastExceptions.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pastExceptions.slice(0, 5).map(exception => {
                  const typeConfig = getTypeConfig(exception.type);
                  
                  return (
                    <div key={exception.id} className="p-3 border rounded-lg opacity-75">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{exception.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(exception.date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {pastExceptions.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    And {pastExceptions.length - 5} more...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No past exceptions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Exception dates will override your regular availability schedule. 
          Patients will not be able to book appointments during unavailable periods, 
          and existing appointments may need to be rescheduled.
        </AlertDescription>
      </Alert>
    </div>
  );
};