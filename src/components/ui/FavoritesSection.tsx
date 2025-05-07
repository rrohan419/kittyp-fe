
import React from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import { ProductCard } from './ProductCard';
import { Heart } from 'lucide-react';
import { CurrencyType } from '@/services/cartService';

const FavoritesSection = () => {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <Heart className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">
          No favorites yet
        </h3>
        <p className="text-muted-foreground">
          Items you favorite will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Favorite Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              uuid: product.id,
              name: product.name,
              price: product.price,
              productImageUrls: [product.image],
              // productImageUrls: [product.image],
              category: '',
              description: '',
              currency: CurrencyType.INR,
              status: 'ACTIVE',
              attribute: {
                color: '',
                size: '',
                material: '',
              },
            }}
            // showAddToCart={true}
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesSection;
