import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Trophy, 
  Star, 
  Flame, 
  Heart, 
  Sparkles,
  Target,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  category: 'health' | 'nutrition' | 'activity' | 'milestone';
}

interface PetBadgesProps {
  petName: string;
}

export const PetBadges: React.FC<PetBadgesProps> = ({ petName }) => {
  const badges: PetBadge[] = [
    {
      id: 'healthy-streak',
      title: 'Healthy Streak',
      description: '30 days of consistent health tracking',
      icon: <Flame className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500',
      earned: true,
      earnedDate: '2025-01-15',
      category: 'health'
    },
    {
      id: 'first-vaccine',
      title: 'First Vaccine Done',
      description: 'Completed first vaccination',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
      earned: true,
      earnedDate: '2024-12-10',
      category: 'milestone'
    },
    {
      id: 'good-eater',
      title: 'Good Eater',
      description: 'Maintained healthy eating habits for 2 weeks',
      icon: <Heart className="h-5 w-5" />,
      color: 'from-pink-500 to-rose-500',
      earned: true,
      earnedDate: '2025-01-20',
      category: 'nutrition'
    },
    {
      id: 'perfect-week',
      title: 'Perfect Week',
      description: 'All activities logged for 7 days',
      icon: <Star className="h-5 w-5" />,
      color: 'from-yellow-500 to-amber-500',
      earned: true,
      earnedDate: '2025-01-22',
      category: 'activity'
    },
    {
      id: 'health-champion',
      title: 'Health Champion',
      description: 'Complete 10 vet checkups',
      icon: <Trophy className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
      earned: false,
      progress: 70,
      category: 'health'
    },
    {
      id: 'wellness-guru',
      title: 'Wellness Guru',
      description: 'Maintain 90+ health score for 60 days',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'from-purple-500 to-indigo-500',
      earned: false,
      progress: 45,
      category: 'health'
    },
    {
      id: 'active-paws',
      title: 'Active Paws',
      description: 'Log 100 activities',
      icon: <Zap className="h-5 w-5" />,
      color: 'from-lime-500 to-green-500',
      earned: false,
      progress: 85,
      category: 'activity'
    },
    {
      id: 'nutrition-master',
      title: 'Nutrition Master',
      description: 'Perfect meal schedule for 30 days',
      icon: <Target className="h-5 w-5" />,
      color: 'from-teal-500 to-cyan-500',
      earned: false,
      progress: 20,
      category: 'nutrition'
    }
  ];

  const earnedBadges = badges.filter(b => b.earned);
  const inProgressBadges = badges.filter(b => !b.earned);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {petName}'s Milestone Badges
            </CardTitle>
            <CardDescription>
              Track achievements and celebrate progress
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {earnedBadges.length}/{badges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Earned Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>Earned Badges</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earnedBadges.map(badge => (
              <div
                key={badge.id}
                className={cn(
                  "relative p-4 rounded-xl border-2 bg-gradient-to-br overflow-hidden",
                  "hover:scale-105 transition-transform cursor-pointer",
                  badge.color
                )}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-white/90 text-foreground">
                      {badge.icon}
                    </div>
                    <Badge variant="secondary" className="bg-white/90">
                      Earned
                    </Badge>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">
                    {badge.title}
                  </h3>
                  <p className="text-white/90 text-sm mb-2">
                    {badge.description}
                  </p>
                  {badge.earnedDate && (
                    <p className="text-white/75 text-xs">
                      Earned on {new Date(badge.earnedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>In Progress</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inProgressBadges.map(badge => (
              <div
                key={badge.id}
                className="relative p-4 rounded-xl border-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-muted">
                    {badge.icon}
                  </div>
                  <Badge variant="outline">
                    {badge.progress}%
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1">
                  {badge.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {badge.description}
                </p>
                {badge.progress && (
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full bg-gradient-to-r transition-all",
                          badge.color
                        )}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep going to unlock this badge!
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};