import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Syringe, Calendar, UtensilsCrossed, AlertCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'health' | 'food' | 'activity';
}

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'vaccination-due',
      title: 'Vaccination Reminders',
      description: 'Get notified 7 days before vaccinations are due',
      icon: <Syringe className="h-4 w-4" />,
      enabled: true,
      category: 'health'
    },
    {
      id: 'missed-log',
      title: 'Missed Activity Log',
      description: 'Reminder if you haven\'t logged activity for 24 hours',
      icon: <AlertCircle className="h-4 w-4" />,
      enabled: true,
      category: 'activity'
    },
    {
      id: 'food-reminder',
      title: 'Feeding Time',
      description: 'Daily reminders for meal times',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      enabled: false,
      category: 'food'
    },
    {
      id: 'vet-appointment',
      title: 'Vet Appointments',
      description: 'Reminder 1 day before scheduled visits',
      icon: <Calendar className="h-4 w-4" />,
      enabled: true,
      category: 'health'
    },
    {
      id: 'medication-time',
      title: 'Medication Schedule',
      description: 'Alerts when it\'s time for medications',
      icon: <Clock className="h-4 w-4" />,
      enabled: false,
      category: 'health'
    }
  ]);

  const togglePreference = (id: string) => {
    setPreferences(prefs =>
      prefs.map(pref =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
    toast.success("Notification settings updated");
  };

  const enabledCount = preferences.filter(p => p.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Push Notification Settings
            </CardTitle>
            <CardDescription>
              Configure behavior-based alerts for your pets
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {enabledCount} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Health & Medical</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {preferences
            .filter(p => p.category === 'health')
            .map(pref => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    {pref.icon}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={pref.id} className="text-base font-medium cursor-pointer">
                      {pref.title}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pref.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={pref.id}
                  checked={pref.enabled}
                  onCheckedChange={() => togglePreference(pref.id)}
                />
              </div>
            ))}
        </div>

        {/* Food Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Feeding & Nutrition</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {preferences
            .filter(p => p.category === 'food')
            .map(pref => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    {pref.icon}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={pref.id} className="text-base font-medium cursor-pointer">
                      {pref.title}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pref.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={pref.id}
                  checked={pref.enabled}
                  onCheckedChange={() => togglePreference(pref.id)}
                />
              </div>
            ))}
        </div>

        {/* Activity Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>Activity & Engagement</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {preferences
            .filter(p => p.category === 'activity')
            .map(pref => (
              <div
                key={pref.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                    {pref.icon}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={pref.id} className="text-base font-medium cursor-pointer">
                      {pref.title}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pref.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={pref.id}
                  checked={pref.enabled}
                  onCheckedChange={() => togglePreference(pref.id)}
                />
              </div>
            ))}
        </div>

        <div className="pt-4 border-t">
          <Button className="w-full">
            Save Notification Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};