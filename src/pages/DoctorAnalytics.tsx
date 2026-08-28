import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function DoctorAnalytics() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Analytics and earnings reports will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
