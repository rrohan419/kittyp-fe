import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Stethoscope } from 'lucide-react';

const orgs = [
  { id: '1', name: 'Happy Paws Clinic', city: 'Wellness City', doctors: 5, patients: 328, status: 'active' },
  { id: '2', name: 'Urban Vet Hospital', city: 'Metro', doctors: 8, patients: 612, status: 'active' },
  { id: '3', name: 'Sunshine Pet Care', city: 'Riverside', doctors: 3, patients: 145, status: 'active' },
  { id: '4', name: 'Greenfield Animal Hospital', city: 'Greenfield', doctors: 6, patients: 421, status: 'pending' },
  { id: '5', name: 'Coastal Vets', city: 'Shoreline', doctors: 4, patients: 198, status: 'active' },
];

export default function AdminOrganizations() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Organizations</h1>
        <p className="text-muted-foreground mt-1 text-sm">{orgs.length} clinics on the platform</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map((o) => (
          <Card key={o.id} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0"><Building2 className="h-6 w-6 text-violet-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{o.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.city}</p>
                </div>
                <Badge variant="secondary" className={o.status === 'active' ? 'bg-green-100 text-green-700 border-0 text-[10px]' : 'bg-amber-100 text-amber-700 border-0 text-[10px]'}>{o.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-border text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Stethoscope className="h-3.5 w-3.5" />{o.doctors} doctors</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" />{o.patients} patients</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
