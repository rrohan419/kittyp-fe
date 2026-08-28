import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HealthEvent } from '@/types/health';
import { formatIsoDate, parseIsoDate } from '@/utils/isoDate';

interface AddHealthEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: Omit<HealthEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  petId: string;
}

export const AddHealthEventDialog: React.FC<AddHealthEventDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  petId
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: '' as HealthEvent['type'],
    title: '',
    description: '',
    date: new Date(),
    time: '09:00',
    status: 'scheduled' as HealthEvent['status'],
    veterinarian: '',
    clinic: '',
    cost: '',
    notes: '',
    nextDue: null as Date | null,
    reminder: true
  });

  const eventTypes = [
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'deworming', label: 'Deworming' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'vet-visit', label: 'Vet Visit' },
    { value: 'medication', label: 'Medication' },
    { value: 'dental', label: 'Dental Care' },
    { value: 'checkup', label: 'Health Checkup' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'other', label: 'Other' }
  ];

  const eventTitles: Record<HealthEvent['type'], string[]> = {
    vaccination: [
      'Annual Vaccination',
      'DHPP Vaccination',
      'Rabies Vaccination',
      'Bordetella Vaccination',
      'Lyme Disease Vaccination'
    ],
    deworming: [
      'Quarterly Deworming',
      'Monthly Deworming',
      'Roundworm Treatment',
      'Hookworm Treatment',
      'Tapeworm Treatment'
    ],
    grooming: [
      'Professional Grooming',
      'Nail Trimming',
      'Bath and Brush',
      'Full Grooming Service',
      'Dental Cleaning'
    ],
    'vet-visit': [
      'Routine Check-up',
      'Follow-up Visit',
      'Consultation',
      'Second Opinion',
      'Health Assessment'
    ],
    medication: [
      'Flea/Tick Prevention',
      'Heartworm Prevention',
      'Antibiotic Treatment',
      'Pain Medication',
      'Allergy Medication'
    ],
    dental: [
      'Dental Cleaning',
      'Tooth Extraction',
      'Dental X-rays',
      'Oral Examination',
      'Dental Surgery'
    ],
    checkup: [
      'Annual Health Checkup',
      'Senior Pet Checkup',
      'Wellness Exam',
      'Pre-surgery Checkup',
      'Health Screening'
    ],
    emergency: [
      'Emergency Visit',
      'Urgent Care',
      'After-hours Visit',
      'Emergency Surgery',
      'Critical Care'
    ],
    surgery: [
      'Spay/Neuter Surgery',
      'Dental Surgery',
      'Tumor Removal',
      'Orthopedic Surgery',
      'Soft Tissue Surgery'
    ],
    other: [
      'Blood Work',
      'X-rays',
      'Ultrasound',
      'Microchip Implantation',
      'Health Certificate'
    ]
  };

  const handleTypeChange = (type: HealthEvent['type']) => {
    setFormData(prev => ({
      ...prev,
      type,
      title: '' // Reset title when type changes
    }));
  };

  const handleSubmit = () => {
    if (!formData.type || !formData.title || !formData.date) {
      toast.warning("Missing Information");
      return;
    }

    // Combine date and time
    const [hours, minutes] = formData.time.split(':').map(Number);
    const eventDate = new Date(formData.date);
    eventDate.setHours(hours, minutes, 0, 0);

    const event: Omit<HealthEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      petId,
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      date: eventDate.toISOString(),
      status: formData.status,
      veterinarian: formData.veterinarian || undefined,
      clinic: formData.clinic || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      notes: formData.notes || undefined,
      nextDue: formData.nextDue?.toISOString(),
      reminder: formData.reminder
    };

    onAdd(event);
    onClose();
    
    // Reset form
    setFormData({
      type: '' as HealthEvent['type'],
      title: '',
      description: '',
      date: new Date(),
      time: '09:00',
      status: 'scheduled',
      veterinarian: '',
      clinic: '',
      cost: '',
      notes: '',
      nextDue: null,
      reminder: true
    });

    toast("Event Added");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Health Event</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            {formData.type && eventTitles[formData.type] ? (
              <Select value={formData.title} onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type custom title" />
                </SelectTrigger>
                <SelectContent>
                  {eventTitles[formData.type].map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Title...</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
              />
            )}
            {formData.title === 'custom' && (
              <Input
                value=""
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter custom title"
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="health-event-date">Date *</Label>
            <DatePicker
              id="health-event-date"
              value={formatIsoDate(formData.date)}
              onChange={(value) => {
                const date = parseIsoDate(value);
                if (date) setFormData((prev) => ({ ...prev, date }));
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: HealthEvent['status']) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinarian</Label>
            <Input
              value={formData.veterinarian}
              onChange={(e) => setFormData(prev => ({ ...prev, veterinarian: e.target.value }))}
              placeholder="Dr. Jane Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinic">Clinic/Location</Label>
            <Input
              value={formData.clinic}
              onChange={(e) => setFormData(prev => ({ ...prev, clinic: e.target.value }))}
              placeholder="Pawsome Vet Clinic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the event"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes or observations"
            rows={3}
          />
        </div>

        {(formData.type === 'vaccination' || formData.type === 'deworming' || formData.type === 'medication') && (
          <div className="space-y-2">
            <Label htmlFor="health-event-next-due">Next Due Date</Label>
            <DatePicker
              id="health-event-next-due"
              value={formData.nextDue ? formatIsoDate(formData.nextDue) : ''}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, nextDue: parseIsoDate(value) ?? null }))
              }
              placeholder="Set next due date"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.reminder}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reminder: checked }))}
          />
          <Label htmlFor="reminder">Set reminder for this event</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};