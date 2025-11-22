import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DailyLog } from '@/types/nutrition';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface NutritionCalendarProps {
  dailyLogs: DailyLog[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const NutritionCalendar = ({ dailyLogs, selectedDate, onDateSelect }: NutritionCalendarProps) => {
  const getStatusIcon = (status: DailyLog['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: DailyLog['status']) => {
    const variants: Record<DailyLog['status'], 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      skipped: 'destructive',
    };
    
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const isSelectedDate = (date: string) => {
    return date === selectedDate.toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">30-Day Nutrition Log</h3>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="hidden sm:inline">Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">Skipped</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
        {dailyLogs.map((log) => {
          const { day, month, weekday } = formatDate(log.date);
          const selected = isSelectedDate(log.date);

          return (
            <button
              key={log.date}
              onClick={() => onDateSelect(new Date(log.date))}
              className={`p-2 sm:p-3 rounded-lg border transition-all hover:shadow-md ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{weekday}</p>
                  <p className="text-lg sm:text-2xl font-bold">{day}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{month}</p>
                </div>
                <div className="scale-75 sm:scale-100">
                  {getStatusIcon(log.status)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
