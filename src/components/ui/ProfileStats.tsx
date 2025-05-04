
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkCheck, Heart, Clock } from "lucide-react";

interface ProfileStatsProps {
  purchasesCount: number;
  favoritesCount: number;
  recentViewsCount: number;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  purchasesCount,
  favoritesCount,
  recentViewsCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="card-hover overflow-hidden border-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center">
              <BookmarkCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Recent Purchases</p>
              <h3 className="text-3xl font-bold text-primary">{purchasesCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover overflow-hidden border-primary/10 animate-delay-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saved Items</p>
              <h3 className="text-3xl font-bold text-primary">{favoritesCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover overflow-hidden border-primary/10 animate-delay-200 sm:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Recently Viewed</p>
              <h3 className="text-3xl font-bold text-primary">{recentViewsCount}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileStats;
