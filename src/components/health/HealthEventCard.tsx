import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  User, 
  DollarSign, 
  FileText,
  Shield,
  Pill,
  Scissors,
  Stethoscope,
  Heart,
  AlertCircle,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HealthEvent } from '@/types/health';

interface HealthEventCardProps {
  event: HealthEvent;
  onEdit?: (event: HealthEvent) => void;
  onDelete?: (eventId: string) => void;
  onMarkComplete?: (eventId: string) => void;
}

export const HealthEventCard: React.FC<HealthEventCardProps> = ({ 
  event, 
  onEdit, 
  onDelete, 
  onMarkComplete 
}) => {
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

  const getTypeColor = (type: HealthEvent['type']) => {
    const colorMap = {
      vaccination: 'bg-blue-500/10 text-blue-600 border-blue-200',
      deworming: 'bg-green-500/10 text-green-600 border-green-200',
      grooming: 'bg-purple-500/10 text-purple-600 border-purple-200',
      'vet-visit': 'bg-orange-500/10 text-orange-600 border-orange-200',
      medication: 'bg-pink-500/10 text-pink-600 border-pink-200',
      dental: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
      checkup: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
      emergency: 'bg-red-500/10 text-red-600 border-red-200',
      surgery: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      other: 'bg-gray-500/10 text-gray-600 border-gray-200'
    };
    return colorMap[type] || colorMap.other;
  };

  const EventIcon = getEventIcon(event.type);

  return (
    <Card className={`relative transition-all hover:shadow-md ${
      event.status === 'overdue' ? 'border-destructive/50 bg-destructive/5' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg border ${getTypeColor(event.type)}`}>
              <EventIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{event.title}</h4>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(event.status)} className="text-xs">
              {event.status}
            </Badge>
            {(onEdit || onDelete || onMarkComplete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(event)}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onMarkComplete && event.status === 'scheduled' && (
                    <DropdownMenuItem onClick={() => onMarkComplete(event.id)}>
                      <Calendar className="h-3 w-3 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(event.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <AlertCircle className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
            <span className="ml-1">{format(new Date(event.date), 'h:mm a')}</span>
          </div>
          
          {event.veterinarian && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{event.veterinarian}</span>
            </div>
          )}
          
          {event.clinic && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{event.clinic}</span>
            </div>
          )}
          
          {event.cost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>${event.cost}</span>
            </div>
          )}
        </div>

        {event.notes && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
            <div className="flex items-start gap-1">
              <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <span className="text-muted-foreground">{event.notes}</span>
            </div>
          </div>
        )}

        {event.nextDue && event.status === 'completed' && (
          <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs">
            <div className="flex items-center gap-1 text-primary">
              <AlertCircle className="h-3 w-3" />
              <span>Next due: {format(new Date(event.nextDue), 'MMM d, yyyy')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};