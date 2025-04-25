
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Product } from '@/services/productService';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { addItem } = useCart();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();


      addItem(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favoriteProduct = {
      id: product.uuid,
      name: product.name,
      price: product.price,
      image: product.productImageUrls && product.productImageUrls[0] ? product.productImageUrls[0] : "",
    };
    if (isFavorite(product.uuid)) {
      removeFavorite(product.uuid);
    } else {
      addFavorite(favoriteProduct);
    }
  };
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300 ease-out",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <Link to={`/product/${product.uuid}`} className="block h-full">
        <div className="aspect-[4/5] relative overflow-hidden">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          <img
            src={product.productImageUrls[0] ?? ""}
            alt={product.name}
            className={cn(
              "object-cover w-full h-full transform transition-transform duration-500",
              isHovered ? "scale-105" : "scale-100",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          <div className="absolute bottom-4 left-4">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full">
              {product.category}
            </span>
          </div>
          
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
          <p className="mt-1 text-gray-700 dark:text-gray-300">${product.price?.toFixed(2) ?? "0.00"}</p>
        </div>
      </Link>
      
      <div 
        className={cn(
          "absolute bottom-4 right-4 flex space-x-2 transform transition-all duration-300",
          isHovered ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        )}
      >
        <button
          onClick={handleAddToCart}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-kitty-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Add to cart"
        >
          <ShoppingCart size={18}  className="text-gray-900 dark:text-white" />
        </button>
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "p-2 bg-white dark:bg-gray-800 rounded-full shadow-md transition-colors",
            isFavorite(product.uuid) 
              ? "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900 dark:hover:bg-pink-800" 
              : "hover:bg-kitty-50 dark:hover:bg-gray-700"
          )}
          aria-label="Toggle favorite"
        >
          <Heart 
            size={18} 
            className={cn(
              "transition-colors",
              isFavorite(product.uuid)
                ? "text-pink-500 dark:text-pink-400 fill-current"
                : "text-gray-900 dark:text-white"
            )} 
          />
        </button>
      </div>
    </div>
  );
}
