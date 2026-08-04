import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function DoctorPatients() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Patients</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Patient records will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
