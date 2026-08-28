import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FavoriteProduct, ProductStatus } from '@/services/favoritesService';
import { formatCurrency } from '@/services/cartService';

interface FavoriteProductCardProps {
  product: FavoriteProduct;
  onToggleFavorite: () => void;
  className?: string;
}

export function FavoriteProductCard({ product, onToggleFavorite, className }: FavoriteProductCardProps) {
  const isActive = product.status?.toLowerCase() === ProductStatus.ACTIVE.toLowerCase();

  return (
    <div className={cn(
      "group relative bg-card rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden",
      !isActive && "opacity-60 cursor-not-allowed",
      className
    )}>
      {/* Remove from favorites button */}
      <button
        onClick={onToggleFavorite}
        className="absolute top-3 right-3 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-full border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
        title="Remove from favorites"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Out of Stock Badge */}
      {!isActive && (
        <div className="absolute top-3 left-12 z-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-destructive text-destructive-foreground rounded-md shadow-md">
            Out of Stock
          </span>
        </div>
      )}

      {/* Overlay for non-active products */}
      {!isActive && (
        <div className="absolute inset-0 bg-black/30 z-[5] pointer-events-none" />
      )}

      {isActive ? (
        <Link to={`/product/${product.uuid}`} className="block">
        {/* Image Section */}
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          <img
            src={product.imageUrls?.[0] || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category badge */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-background/90 text-foreground rounded-md backdrop-blur-sm">
              {product.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
          
          {/* Price and Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                {formatCurrency
                (product.price, product.currency)}
                </span>
              </div>
            </div>
            
            {/* Quick action buttons */}
            {/* <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                onClick={handleAddToCart}
                disabled={isAddingToCart || loading}
              >
                {isAddingToCart || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </Button>
            </div> */}
          </div>
        </div>
      </Link>
      ) : (
        <div className="block">
          {/* Image Section */}
          <div className="aspect-[4/3] relative overflow-hidden bg-muted">
            <img
              src={product.imageUrls?.[0] || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Category badge */}
            <div className="absolute bottom-3 left-3">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-background/90 text-foreground rounded-md backdrop-blur-sm">
                {product.category}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
              {product.name}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
            
            {/* Price */}
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(product.price, product.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorite indicator */}
      <div className="absolute top-3 left-3 p-1.5 bg-pink-500/90 text-white rounded-full backdrop-blur-sm">
        <Heart className="h-3 w-3 fill-current" />
      </div>
    </div>
  );
}