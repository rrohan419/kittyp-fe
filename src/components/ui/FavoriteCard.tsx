
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkX, ArrowRight, Heart } from "lucide-react";
import { ProductStatus } from '@/services/favoritesService';

interface FavoriteCardProps {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  category: string;
  status: ProductStatus;
  onRemove: (id: number) => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({
  id,
  name,
  price,
  imageUrl,
  category,
  status,
  onRemove,
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={name} 
          className="h-full w-full object-cover transition-transform group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-xs"
          >
            Buy Now
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/70 hover:bg-white rounded-full h-8 w-8"
            onClick={() => onRemove(id)}
          >
            <BookmarkX className="h-4 w-4 text-primary" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="h-5 w-5 text-white fill-primary stroke-primary" />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm line-clamp-1">{name}</h3>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{category}</div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-primary">{price}</span>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-primary">
            View <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteCard;
