import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Droplets, Flame, Scale } from 'lucide-react';
import { NutritionStats, PetProfileSummary } from '@/types/nutrition';

interface NutritionDashboardProps {
  profile: PetProfileSummary;
  stats: NutritionStats;
}

export const NutritionDashboard = ({ profile, stats }: NutritionDashboardProps) => {
  const getTrendIcon = () => {
    switch (stats.weightTrend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getHydrationColor = () => {
    if (stats.hydrationScore >= 80) return 'text-green-600';
    if (stats.hydrationScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Pet Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium break-words">{profile.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Breed</p>
            <p className="font-medium break-words">{profile.breed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Age</p>
            <p className="font-medium">{profile.age} years</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weight</p>
            <p className="font-medium">{profile.weight} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Activity Level</p>
            <Badge variant="secondary" className="capitalize">
              {profile.activityLevel}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Food</p>
            <p className="font-medium text-sm break-words">{profile.currentFoodBrand}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h4 className="font-semibold">Daily Calories</h4>
            </div>
          </div>
          <p className="text-3xl font-bold">{stats.caloriesPerDay}</p>
          <p className="text-sm text-muted-foreground mt-1">kcal per day</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold">Hydration</h4>
            </div>
          </div>
          <p className={`text-3xl font-bold ${getHydrationColor()}`}>
            {stats.hydrationScore}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Last 7 days average</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-500" />
              <h4 className="font-semibold">Weight Trend</h4>
            </div>
            {getTrendIcon()}
          </div>
          <p className="text-2xl font-bold capitalize">{stats.weightTrend}</p>
          <p className="text-sm text-muted-foreground mt-1">Based on recent logs</p>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-semibold mb-3">Meal Completion Rate</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${stats.mealCompletionRate}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold">{stats.mealCompletionRate}%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Last 7 days</p>
      </Card>
    </div>
  );
};
