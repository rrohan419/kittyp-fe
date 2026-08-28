export interface ClinicDoctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'off';
  appointmentsToday: number;
  rating: number;
  initials: string;
}

export interface ClinicAppointment {
  id: string;
  petName: string;
  ownerName: string;
  doctorName: string;
  doctorId: string;
  time: string;
  date: string;
  type: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

export interface ClinicPatient {
  id: string;
  petName: string;
  species: string;
  breed: string;
  ownerName: string;
  ownerPhone: string;
  lastVisit: string;
  visits: number;
  initials: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'medication' | 'supply' | 'equipment' | 'food';
  stock: number;
  unit: string;
  reorderLevel: number;
  price: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'active' | 'on-leave';
  initials: string;
}

export const mockDoctors: ClinicDoctor[] = [
  { id: 'd1', name: 'Dr. John Doe', specialization: 'General Veterinary', email: 'john@happypaws.com', phone: '+1 555-0101', status: 'available', appointmentsToday: 6, rating: 4.9, initials: 'JD' },
  { id: 'd2', name: 'Dr. Priya Sharma', specialization: 'Surgery', email: 'priya@happypaws.com', phone: '+1 555-0102', status: 'busy', appointmentsToday: 4, rating: 4.8, initials: 'PS' },
  { id: 'd3', name: 'Dr. Michael Chen', specialization: 'Dermatology', email: 'michael@happypaws.com', phone: '+1 555-0103', status: 'available', appointmentsToday: 5, rating: 4.7, initials: 'MC' },
  { id: 'd4', name: 'Dr. Aisha Khan', specialization: 'Dentistry', email: 'aisha@happypaws.com', phone: '+1 555-0104', status: 'off', appointmentsToday: 0, rating: 4.9, initials: 'AK' },
  { id: 'd5', name: 'Dr. Carlos Rivera', specialization: 'Cardiology', email: 'carlos@happypaws.com', phone: '+1 555-0105', status: 'available', appointmentsToday: 3, rating: 4.6, initials: 'CR' },
];

export const mockAppointments: ClinicAppointment[] = [
  { id: 'a1', petName: 'Whiskers', ownerName: 'Sarah Miller', doctorName: 'Dr. John Doe', doctorId: 'd1', time: '09:00 AM', date: 'Today', type: 'General Checkup', status: 'confirmed' },
  { id: 'a2', petName: 'Luna', ownerName: 'James Kim', doctorName: 'Dr. John Doe', doctorId: 'd1', time: '10:30 AM', date: 'Today', type: 'Vaccination', status: 'confirmed' },
  { id: 'a3', petName: 'Milo', ownerName: 'Priya Raj', doctorName: 'Dr. Priya Sharma', doctorId: 'd2', time: '11:00 AM', date: 'Today', type: 'Surgery Consult', status: 'pending' },
  { id: 'a4', petName: 'Bella', ownerName: 'Tom Hardy', doctorName: 'Dr. Michael Chen', doctorId: 'd3', time: '01:00 PM', date: 'Today', type: 'Skin Allergy', status: 'confirmed' },
  { id: 'a5', petName: 'Rocky', ownerName: 'Emma Davis', doctorName: 'Dr. Carlos Rivera', doctorId: 'd5', time: '02:30 PM', date: 'Today', type: 'Heart Checkup', status: 'confirmed' },
  { id: 'a6', petName: 'Coco', ownerName: 'Liam Smith', doctorName: 'Dr. John Doe', doctorId: 'd1', time: '04:00 PM', date: 'Today', type: 'Follow-up', status: 'pending' },
  { id: 'a7', petName: 'Daisy', ownerName: 'Olivia Wong', doctorName: 'Dr. Priya Sharma', doctorId: 'd2', time: '09:30 AM', date: 'Tomorrow', type: 'Dental', status: 'confirmed' },
  { id: 'a8', petName: 'Max', ownerName: 'Noah Patel', doctorName: 'Dr. Michael Chen', doctorId: 'd3', time: '11:00 AM', date: 'Tomorrow', type: 'Dermatology', status: 'confirmed' },
];

export const mockPatients: ClinicPatient[] = [
  { id: 'p1', petName: 'Whiskers', species: 'Cat', breed: 'Persian', ownerName: 'Sarah Miller', ownerPhone: '+1 555-1001', lastVisit: '2 days ago', visits: 8, initials: 'WH' },
  { id: 'p2', petName: 'Luna', species: 'Dog', breed: 'Labrador', ownerName: 'James Kim', ownerPhone: '+1 555-1002', lastVisit: '1 week ago', visits: 12, initials: 'LU' },
  { id: 'p3', petName: 'Milo', species: 'Cat', breed: 'Maine Coon', ownerName: 'Priya Raj', ownerPhone: '+1 555-1003', lastVisit: '3 days ago', visits: 4, initials: 'MI' },
  { id: 'p4', petName: 'Bella', species: 'Dog', breed: 'Golden Retriever', ownerName: 'Tom Hardy', ownerPhone: '+1 555-1004', lastVisit: 'Today', visits: 6, initials: 'BE' },
  { id: 'p5', petName: 'Rocky', species: 'Dog', breed: 'Bulldog', ownerName: 'Emma Davis', ownerPhone: '+1 555-1005', lastVisit: '2 weeks ago', visits: 9, initials: 'RO' },
  { id: 'p6', petName: 'Coco', species: 'Cat', breed: 'Siamese', ownerName: 'Liam Smith', ownerPhone: '+1 555-1006', lastVisit: '5 days ago', visits: 3, initials: 'CO' },
  { id: 'p7', petName: 'Daisy', species: 'Dog', breed: 'Poodle', ownerName: 'Olivia Wong', ownerPhone: '+1 555-1007', lastVisit: '1 month ago', visits: 5, initials: 'DA' },
  { id: 'p8', petName: 'Max', species: 'Dog', breed: 'Beagle', ownerName: 'Noah Patel', ownerPhone: '+1 555-1008', lastVisit: '3 weeks ago', visits: 7, initials: 'MA' },
];

export const mockInventory: InventoryItem[] = [
  { id: 'i1', name: 'Amoxicillin 250mg', category: 'medication', stock: 45, unit: 'tablets', reorderLevel: 50, price: 0.5 },
  { id: 'i2', name: 'Rabies Vaccine', category: 'medication', stock: 12, unit: 'vials', reorderLevel: 15, price: 25 },
  { id: 'i3', name: 'Disposable Syringes', category: 'supply', stock: 230, unit: 'pcs', reorderLevel: 100, price: 0.15 },
  { id: 'i4', name: 'Surgical Gloves (Box)', category: 'supply', stock: 8, unit: 'boxes', reorderLevel: 10, price: 12 },
  { id: 'i5', name: 'Cat Recovery Food', category: 'food', stock: 22, unit: 'cans', reorderLevel: 20, price: 4.5 },
  { id: 'i6', name: 'Digital Thermometer', category: 'equipment', stock: 6, unit: 'pcs', reorderLevel: 5, price: 35 },
  { id: 'i7', name: 'Bandage Roll', category: 'supply', stock: 80, unit: 'rolls', reorderLevel: 50, price: 2 },
  { id: 'i8', name: 'Flea & Tick Drops', category: 'medication', stock: 4, unit: 'packs', reorderLevel: 15, price: 18 },
];

export const mockStaff: StaffMember[] = [
  { id: 's1', name: 'Lisa Anderson', role: 'Receptionist', email: 'lisa@happypaws.com', phone: '+1 555-2001', status: 'active', initials: 'LA' },
  { id: 's2', name: 'Mark Johnson', role: 'Vet Assistant', email: 'mark@happypaws.com', phone: '+1 555-2002', status: 'active', initials: 'MJ' },
  { id: 's3', name: 'Sophie Lee', role: 'Vet Technician', email: 'sophie@happypaws.com', phone: '+1 555-2003', status: 'active', initials: 'SL' },
  { id: 's4', name: 'David Park', role: 'Office Manager', email: 'david@happypaws.com', phone: '+1 555-2004', status: 'on-leave', initials: 'DP' },
  { id: 's5', name: 'Rachel Green', role: 'Receptionist', email: 'rachel@happypaws.com', phone: '+1 555-2005', status: 'active', initials: 'RG' },
];
