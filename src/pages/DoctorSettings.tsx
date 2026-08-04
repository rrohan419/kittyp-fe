import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function DoctorSettings() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Profile settings and preferences will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
