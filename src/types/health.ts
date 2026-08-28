export interface HealthEvent {
    id: string;
    petId: string;
    type: 'vaccination' | 'deworming' | 'grooming' | 'vet-visit' | 'medication' | 'dental' | 'checkup' | 'emergency' | 'surgery' | 'other';
    title: string;
    description?: string;
    date: string; // ISO string
    status: 'completed' | 'scheduled' | 'overdue' | 'cancelled';
    veterinarian?: string;
    clinic?: string;
    cost?: number;
    notes?: string;
    nextDue?: string; // ISO string for recurring events
    reminder?: boolean;
    attachments?: string[]; // URLs or file paths
    createdAt: string;
    updatedAt: string;
  }
  
  export interface HealthEventFormData {
    type: HealthEvent['type'];
    title: string;
    description?: string;
    date: string;
    status: HealthEvent['status'];
    veterinarian?: string;
    clinic?: string;
    cost?: number;
    notes?: string;
    nextDue?: string;
    reminder?: boolean;
  }
  
  export interface HealthEventFilters {
    petId?: string;
    type?: HealthEvent['type'];
    status?: HealthEvent['status'];
    dateRange?: {
      start: string;
      end: string;
    };
  }
  
  export interface VaccinationRecord extends Omit<HealthEvent, 'type'> {
    type: 'vaccination';
    vaccineName: string;
    batchNumber?: string;
    manufacturer?: string;
    administeredBy: string;
    nextDueDate: string;
    reactionNotes?: string;
  }
  
  export interface HealthReminder {
    id: string;
    petId: string;
    eventType: HealthEvent['type'];
    title: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRecurring: boolean;
    recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    lastCompleted?: string;
    createdAt: string;
  }