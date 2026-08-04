import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function ClinicSettings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Clinic Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your clinic profile</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Clinic Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="h-8 w-8 text-primary" /></div>
            <Button variant="outline" size="sm">Upload Logo</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Clinic Name</Label><Input defaultValue="Happy Paws Clinic" /></div>
            <div className="space-y-2"><Label>License Number</Label><Input defaultValue="VC-2024-1234" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" defaultValue="contact@happypaws.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" defaultValue="+1 555-0100" /></div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Input defaultValue="123 Pet Street, Wellness City" /></div>
          <div className="space-y-2"><Label>About</Label><Textarea rows={4} defaultValue="A full-service veterinary clinic offering compassionate care since 2010." className="resize-none" /></div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Operating Hours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium w-24">{day}</span>
              <span className="text-sm text-muted-foreground">{day === 'Sunday' ? 'Closed' : '9:00 AM – 7:00 PM'}</span>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
