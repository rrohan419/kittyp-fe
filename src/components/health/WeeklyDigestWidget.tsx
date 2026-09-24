import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { PetProfile } from '@/services/authService';

interface WeeklyDigestWidgetProps {
  pet: PetProfile;
}

export const WeeklyDigestWidget: React.FC<WeeklyDigestWidgetProps> = ({ pet }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Weekly Pet Digest</CardTitle>
              <CardDescription>
                {pet.name}'s health summary for this week
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          A weekly digest is not available yet. Live clinic visits, reports, and invoices are shown in the Timeline tab.
        </p>
      </CardContent>
    </Card>
  );
};