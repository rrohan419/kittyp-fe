import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Calendar, 
  Activity, 
  Heart, 
  TrendingUp, 
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Pet } from '@/hooks/usePetManagement';

interface WeeklyDigestWidgetProps {
  pet: Pet;
}

export const WeeklyDigestWidget: React.FC<WeeklyDigestWidgetProps> = ({ pet }) => {
  // Mock data for the weekly digest
  const weeklyData = {
    healthScore: 92,
    activitiesLogged: 12,
    mealsCompleted: 21,
    weightChange: '+0.2kg',
    upcomingEvents: 2,
    achievements: ['7-Day Streak', 'Perfect Week']
  };

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Weekly Pet Digest
                <Sparkles className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>
                {pet.name}'s health summary for this week
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-semibold">
            This Week
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Health Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <span className="font-semibold">Overall Health Score</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {weeklyData.healthScore}%
            </span>
          </div>
          <Progress value={weeklyData.healthScore} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Excellent! {pet.name} is in great shape this week 🎉
          </p>
        </div>

        {/* Weekly Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Activities</span>
            </div>
            <div className="text-2xl font-bold">{weeklyData.activitiesLogged}</div>
            <p className="text-xs text-muted-foreground mt-1">Logs this week</p>
          </div>

          <div className="p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Meals</span>
            </div>
            <div className="text-2xl font-bold">{weeklyData.mealsCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">Fed on time</p>
          </div>

          <div className="p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Weight</span>
            </div>
            <div className="text-2xl font-bold">{weeklyData.weightChange}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </div>

          <div className="p-4 rounded-lg bg-accent/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Events</span>
            </div>
            <div className="text-2xl font-bold">{weeklyData.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Coming up</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Award className="h-4 w-4 text-primary" />
            <span>This Week's Achievements</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weeklyData.achievements.map((achievement, index) => (
              <Badge key={index} variant="outline" className="px-3 py-1">
                {achievement}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="default" className="flex-1 gap-2">
            View Full Report
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Me
          </Button>
        </div>

        {/* Email Schedule Info */}
        <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-xs text-muted-foreground text-center">
            📧 Weekly digest emails sent every Monday at 9:00 AM
          </p>
        </div>
      </CardContent>
    </Card>
  );
};