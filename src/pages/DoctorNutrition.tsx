import { Link } from 'react-router-dom';
import { Apple, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorNutrition() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nutrition plans</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review AI-generated 30-day plans, approve, and send to pet parents.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Apple className="h-4 w-4" /> Approve &amp; send workflow
          </CardTitle>
          <CardDescription>
            Generate a plan in the AI Assistant, edit as a doctor, then return here to track sent plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/ai-assistant">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Generate / review plan
            </Link>
          </Button>
          <Button variant="outline" disabled>
            <Send className="h-4 w-4 mr-1.5" />
            Send to parent (API next)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
