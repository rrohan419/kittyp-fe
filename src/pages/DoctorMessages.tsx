import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function DoctorMessages() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">No messages yet. Patient messages will show here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
