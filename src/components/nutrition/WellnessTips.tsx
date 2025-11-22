import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WellnessTip } from '@/types/nutrition';
import { Lightbulb, Calendar, Droplets, Bone, Heart, Stethoscope, Scissors } from 'lucide-react';

interface WellnessTipsProps {
  tips: WellnessTip[];
  specialConsiderations: string[];
}

export const WellnessTips = ({ tips, specialConsiderations }: WellnessTipsProps) => {
  const getCategoryIcon = (category: WellnessTip['category']) => {
    const iconClass = "h-5 w-5";
    switch (category) {
      case 'hydration': return <Droplets className={iconClass} />;
      case 'dental': return <Bone className={iconClass} />;
      case 'exercise': return <Heart className={iconClass} />;
      case 'vet': return <Stethoscope className={iconClass} />;
      case 'grooming': return <Scissors className={iconClass} />;
      default: return <Lightbulb className={iconClass} />;
    }
  };

  const getFrequencyColor = (frequency: WellnessTip['frequency']) => {
    switch (frequency) {
      case 'daily': return 'default';
      case 'weekly': return 'secondary';
      case 'monthly': return 'outline';
    }
  };

  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.frequency]) {
      acc[tip.frequency] = [];
    }
    acc[tip.frequency].push(tip);
    return acc;
  }, {} as Record<string, WellnessTip[]>);

  return (
    <div className="space-y-6">
      {/* Special Considerations */}
      {specialConsiderations.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Special Considerations</h3>
          </div>
          <ul className="space-y-2">
            {specialConsiderations.map((consideration, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-orange-600 mt-1">•</span>
                <span>{consideration}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Daily Tips */}
      {groupedTips.daily && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Wellness Tips
          </h3>
          <div className="grid gap-3">
            {groupedTips.daily.map((tip) => (
              <Card key={tip.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{tip.title}</h4>
                      <Badge variant={getFrequencyColor(tip.frequency)} className="capitalize">
                        {tip.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Tips */}
      {groupedTips.weekly && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Wellness Tips
          </h3>
          <div className="grid gap-3">
            {groupedTips.weekly.map((tip) => (
              <Card key={tip.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{tip.title}</h4>
                      <Badge variant={getFrequencyColor(tip.frequency)} className="capitalize">
                        {tip.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Tips */}
      {groupedTips.monthly && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Monthly Wellness Tips
          </h3>
          <div className="grid gap-3">
            {groupedTips.monthly.map((tip) => (
              <Card key={tip.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{tip.title}</h4>
                      <Badge variant={getFrequencyColor(tip.frequency)} className="capitalize">
                        {tip.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
